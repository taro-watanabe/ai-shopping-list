import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
	const allItems = await db.select().from(items);
	return NextResponse.json(allItems);
}

export async function POST(request: Request) {
	const { name } = await request.json();
	const newItem = await db.insert(items).values({ name }).returning();
	return NextResponse.json(newItem[0]);
}

export async function PUT(request: Request) {
	try {
		console.log("ciao");
		console.log(request);
		const body = await request.json();
		console.log("Request body:", body);
		const { id, checked } = body;

		const parsedId = Number(id);
		console.log(parsedId);
		console.log(checked);
		console.log(typeof checked);
		if (Number.isNaN(parsedId) || typeof checked !== "boolean") {
      console.log("caz");
			return NextResponse.json(
				{ error: "NOOOO request data" },
				{ status: 400 },
			);
		}

		const updatedItem = await db
			.update(items)
			.set({ checked })
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
