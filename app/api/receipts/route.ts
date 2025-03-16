import { db } from "@/db";
import { receipts, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get("itemId");

		if (!itemId) {
			return new NextResponse("Missing itemId parameter", { status: 400 });
		}

		const parsedItemId = Number.parseInt(itemId, 10);
		if (Number.isNaN(parsedItemId)) {
			return new NextResponse("Invalid itemId", { status: 400 });
		}

		// First, get the receipt ID from the item
		const itemData = await db
			.select({ receiptId: items.receiptId })
			.from(items)
			.where(eq(items.id, parsedItemId))
			.limit(1);

		if (!itemData.length || !itemData[0].receiptId) {
			return NextResponse.json([]);
		}

		// Then get the receipt data
		const receiptData = await db
			.select({
				id: receipts.id,
				imageBase64: receipts.imageBase64,
				createdAt: receipts.createdAt,
			})
			.from(receipts)
			.where(eq(receipts.id, itemData[0].receiptId));

		return NextResponse.json(receiptData);
	} catch (error) {
		console.error("Error fetching receipts:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { imageBase64, itemId } = await request.json();

		if (!imageBase64 || !itemId) {
			return new NextResponse("Missing required fields", { status: 400 });
		}

		// First, insert the receipt
		const [newReceipt] = await db
			.insert(receipts)
			.values({
				imageBase64,
			})
			.returning();

		// Then update the item with the receipt ID
		await db
			.update(items)
			.set({ receiptId: newReceipt.id })
			.where(eq(items.id, itemId));

		return NextResponse.json(newReceipt);
	} catch (error) {
		console.error("Error saving receipt:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}
