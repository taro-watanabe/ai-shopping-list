import { db } from "@/db";
import { receipts, items } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
// import { getMultimodalCompletion } from "@/lib/openrouter";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get("itemId");
		const receiptId = searchParams.get("receiptId");
		const shouldAnalyze = searchParams.get("analyze") === "true";

		// Either itemId or receiptId should be provided
		if (!itemId && !receiptId) {
			return new NextResponse("Missing itemId or receiptId parameter", {
				status: 400,
			});
		}

		let receiptData: Array<{
			id: number;
			imageBase64: string;
			createdAt: string;
		}> = [];

		// Handle receiptId first for direct access
		if (receiptId) {
			const parsedReceiptId = Number.parseInt(receiptId, 10);
			if (Number.isNaN(parsedReceiptId)) {
				return new NextResponse("Invalid receiptId", { status: 400 });
			}

			// Get receipt data directly
			receiptData = await db
				.select({
					id: receipts.id,
					imageBase64: receipts.imageBase64,
					createdAt: sql<Date>`datetime(created_at, 'unixepoch')`.mapWith(Date),
				})
				.from(receipts)
				.where(eq(receipts.id, parsedReceiptId));

			if (!receiptData.length) {
				return NextResponse.json([], { status: 404 });
			}
		}
		// Then handle itemId lookup through item association
		else if (itemId) {
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
				return NextResponse.json([], { status: 404 });
			}

			// Then get the receipt data
			receiptData = await db
				.select({
					id: receipts.id,
					imageBase64: receipts.imageBase64,
					createdAt: sql<Date>`datetime(created_at, 'unixepoch')`.mapWith(Date),
				})
				.from(receipts)
				.where(eq(receipts.id, itemData[0].receiptId));
		}

		// If no analysis requested, return receipt data as is
		if (!shouldAnalyze || !receiptData.length) {
			return NextResponse.json(receiptData);
		}

		// If analysis requested, analyze the receipt image using AI
	} catch (error) {
		console.error("Error getting receipt:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { imageBase64, itemId } = await request.json();

		if (!imageBase64) {
			return new NextResponse("Missing image data", { status: 400 });
		}

		// First, insert the receipt
		const [newReceipt] = await db
			.insert(receipts)
			.values({
				imageBase64,
			})
			.returning();

		// If itemId is provided, associate the receipt with the item
		if (itemId) {
			await db
				.update(items)
				.set({ receiptId: newReceipt.id })
				.where(eq(items.id, itemId));
		}

		return NextResponse.json({
			...newReceipt,
			imageBase64 // Explicitly include in response
		});
	} catch (error) {
		console.error("Error saving receipt:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}
