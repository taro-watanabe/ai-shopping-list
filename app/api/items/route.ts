import { db } from "@/db";
import { items, tags, people, receipts } from "@/db/schema";
import { eq, inArray, or, and, type SQL, exists, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

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

	// Build final condition before applying where clause
	let finalCondition: SQL | undefined;
	if (conditions.length === 2) {
		finalCondition = and(conditions[0], conditions[1]);
	} else if (conditions.length === 1) {
		finalCondition = conditions[0];
	}

	// Apply where clause only if there are conditions
	const finalQuery = finalCondition ? query.where(finalCondition) : query;

	const allItems = await finalQuery;

	return NextResponse.json(allItems);
}

export async function POST(request: Request) {
	const { name, tagId, personId } = await request.json();

	const newItem = await db
		.insert(items)
		.values({
			name,
			tagId: tagId ? Number(tagId) : null,
			personId: personId ? Number(personId) : null,
		})
		.returning({
			id: items.id,
			name: items.name,
			checked: items.checked,
			createdAt: items.createdAt,
			tagId: items.tagId,
			personId: items.personId,
		});

	return NextResponse.json(newItem[0]);
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { id, checked, personId, price } = body;

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
			...(price && { price: Number(price) }),
			checkedAt: checked ? new Date().toISOString() : null,
		};

		if (personId === 0) {
			updateData.personId = null;
		}

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

		return NextResponse.json(updatedItem[0]);
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
