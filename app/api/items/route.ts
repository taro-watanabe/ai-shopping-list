import { db } from "@/db";
import { items, tags, people, receipts } from "@/db/schema";
import { eq, inArray, and, or, gte, type SQL, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/openai";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const include = searchParams.get("include");

	// Get filter parameters as arrays
	const tagIds = searchParams
		.getAll("tagId")
		.map(Number)
		.filter((id) => !Number.isNaN(id));
	const personIds = searchParams
		.getAll("personId")
		.map(Number)
		.filter((id) => !Number.isNaN(id));

	const query = db
		.select({
			id: items.id,
			name: items.name,
			checked: items.checked,
			createdAt: items.createdAt,
			checkedAt: items.checkedAt,
			vector: items.vector,
			tagId: items.tagId,
			tag: {
				id: tags.id,
				name: tags.name,
				color: tags.color,
			},
			personId: items.personId,
			person: include?.includes("person")
				? {
						id: people.id,
						name: people.name,
						color: people.color,
					}
				: {},
			price: items.price,
			receiptId: items.receiptId,
			// Check if receipt exists by checking if receiptId is not null
			existsReceipt: isNotNull(items.receiptId),
		})
		.from(items)
		.leftJoin(tags, eq(items.tagId, tags.id))
		.leftJoin(people, eq(items.personId, people.id));

	// Prepare filter conditions
	const conditions: SQL[] = [];

	// Add tag filter condition (OR between selected tags)
	if (tagIds.length > 0) {
		conditions.push(inArray(items.tagId, tagIds));
	}

	// Add person filter condition (OR between selected people)
	if (personIds.length > 0) {
		conditions.push(inArray(items.personId, personIds));
	}

	// if checked boolean is provided, filter by it
	const checked = searchParams.get("checked");
	if (checked !== null) {
		conditions.push(eq(items.checked, checked === "true"));
	}

	// Calculate date 7 days ago for active items filter
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	// Always exclude archived items (checked AND checkedAt older than 7 days)
	const activeItemsCondition = or(
		eq(items.checked, false),
		and(
			eq(items.checked, true),
			gte(items.checkedAt, sevenDaysAgo.toISOString())
		)
	);
	conditions.push(activeItemsCondition);

	// Build final condition - we always have at least activeItemsCondition
	const finalCondition = conditions.length === 2 
		? and(conditions[0], conditions[1])
		: conditions[0];

	// Apply where clause
	const finalQuery = query.where(finalCondition);

	const allItems = await finalQuery;

	return NextResponse.json(allItems);
}

export async function POST(request: Request) {
	const { name, description, tagId, personId } = await request.json();

	try {
		const embedding = await generateEmbedding(`${name} ${description || ""}`);
		if (!Array.isArray(embedding)) {
			throw new Error("Invalid embedding format");
		}
		if (embedding.length === 0) {
			throw new Error("Empty embedding");
		}
		if (!embedding.every((val) => typeof val === "number")) {
			throw new Error("Embedding contains non-numeric values");
		}
		if (embedding.length !== 1536) {
			throw new Error(`Embedding length is ${embedding.length}, expected 1536`);
		}
		const newItem = await db
			.insert(items)
			.values({
				name,
				description: description || null,
				tagId: tagId ? Number(tagId) : null,
				personId: personId ? Number(personId) : null,
				vector: JSON.stringify(embedding),
			})
			.returning({
				id: items.id,
				name: items.name,
				description: items.description,
				checked: items.checked,
				createdAt: items.createdAt,
				tagId: items.tagId,
				personId: items.personId,
				vector: items.vector,
			});

		return NextResponse.json(newItem[0]);
	} catch (error) {
		console.error("Failed to generate embedding:", error);
		return NextResponse.json(
			{ error: "Failed to create item with embedding" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { id, checked, personId, price, receiptId, tagId } = body;

		// Validate price is a number if provided
		if (price !== undefined && Number.isNaN(Number(price))) {
			return NextResponse.json(
				{ error: "Invalid price format" },
				{ status: 400 },
			);
		}

		const parsedId = Number(id);
		if (Number.isNaN(parsedId) || typeof checked !== "boolean") {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}

		const updateData = {
			checked,
			...(personId && { personId: Number(personId) }),
			...(price !== undefined && { price: Number(price) }),
			...(receiptId && { receiptId: Number(receiptId) }),
			...(tagId && { tagId: Number(tagId) }),
			checkedAt: checked ? new Date().toISOString() : null,
		};

		if (personId === 0) {
			updateData.personId = null;
		}

		// If checkbox is not checked, do nothing
		if (!checked) {
			updateData.price = null;
			updateData.personId = null;
			updateData.checkedAt = null;
			updateData.receiptId = null; // Clear receipt when unchecked
		}

		const updatedItem = await db
			.update(items)
			.set(updateData)
			.where(eq(items.id, parsedId))
			.returning();

		if (!updatedItem.length) {
			return NextResponse.json({ error: "Item not found" }, { status: 404 });
		}

		return NextResponse.json({
			...updatedItem[0],
			vector: updatedItem[0].vector,
		});
	} catch (error) {
		console.error("Error updating item:", error);
		return NextResponse.json(
			{ error: "Failed to update item" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { id } = await request.json();
		const parsedId = Number(id);

		if (Number.isNaN(parsedId)) {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}

		// Get receipt ID first to delete it afterwards
		const itemToDelete = await db
			.select({ receiptId: items.receiptId })
			.from(items)
			.where(eq(items.id, parsedId))
			.limit(1);

		// Delete the item
		await db.delete(items).where(eq(items.id, parsedId));

		// If there was a receipt, delete it too
		if (itemToDelete.length > 0 && itemToDelete[0].receiptId) {
			await db
				.delete(receipts)
				.where(eq(receipts.id, itemToDelete[0].receiptId));
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting item:", error);
		return NextResponse.json(
			{ error: "Failed to delete item" },
			{ status: 500 },
		);
	}
}
