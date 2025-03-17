import { db } from "@/db";
import { receipts, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getMultimodalCompletion } from "@/lib/openrouter";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get("itemId");
		const receiptId = searchParams.get("receiptId");
		const shouldAnalyze = searchParams.get("analyze") === "true";
		
		// Either itemId or receiptId should be provided
		if (!itemId && !receiptId) {
			return new NextResponse("Missing itemId or receiptId parameter", { status: 400 });
		}

		let receiptData;

		// If itemId is provided, get receipt through item
		if (itemId) {
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
			receiptData = await db
				.select({
					id: receipts.id,
					imageBase64: receipts.imageBase64,
					createdAt: receipts.createdAt,
				})
				.from(receipts)
				.where(eq(receipts.id, itemData[0].receiptId));
		} 
		// If receiptId is provided directly
		else if (receiptId) {
			const parsedReceiptId = Number.parseInt(receiptId, 10);
			if (Number.isNaN(parsedReceiptId)) {
				return new NextResponse("Invalid receiptId", { status: 400 });
			}

			// Get receipt data directly
			receiptData = await db
				.select({
					id: receipts.id,
					imageBase64: receipts.imageBase64,
					createdAt: receipts.createdAt,
				})
				.from(receipts)
				.where(eq(receipts.id, parsedReceiptId));
			
			if (!receiptData.length) {
				return NextResponse.json([], { status: 404 });
			}
		}

		// If no analysis requested, return receipt data as is
		if (!shouldAnalyze || !receiptData.length) {
			return NextResponse.json(receiptData);
		}

		// If analysis requested, analyze the receipt image using AI
		const { imageBase64 } = receiptData[0];
		
		// Create multimodal message for analysis
		const messages = [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: "What's in this image?"
					},
					{
						type: "image_url",
						image_url: {
							url: `data:image/jpeg;base64,${imageBase64}`
						}
					}
				]
			}
		];

		// Get AI analysis
		const analysis = await getMultimodalCompletion(messages);
		
		// Return receipt data with analysis
		return NextResponse.json({
			receipt: receiptData[0],
			analysis
		});
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
