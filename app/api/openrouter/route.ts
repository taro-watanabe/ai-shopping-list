import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";

export async function POST(request: Request) {
	try {
		const { image } = await request.json();

		if (!image) {
			return NextResponse.json(
				{ error: "Missing image data" },
				{ status: 400 }
			);
		}

		const completion = await openrouter.chat.completions.create({
			model: "google/gemini-2.0-flash-lite-001",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: `
Analyze this receipt image and return JSON with this structure: 
{
"date": "YYYY-MM-DD",
"place": "string",
"items": [
	{"name": "string", "price": number},
	...,
]
}
Important rules:
1. return only the JSON object, nothing else. If data is incomplete or unclear, return "ERROR"
2. Ignore quantity rows like '3 x 2.40'
3. Only respond with valid JSON or "ERROR"
4. If there is a discount, count that as an item on its own, with a negative price. When doing so, aggregate the original item name with the discount name, e.g. "Discount on item X"

Receipt image:
							`
						},
						{
							type: "image_url",
							image_url: {
								url: `data:image/jpeg;base64,${image}`
							}
						}
					]
				}
			],
		});
		return NextResponse.json({
			analysis: completion.choices[0].message.content
		});

	} catch (error) {
		console.error("OpenRouter API error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze receipt" },
			{ status: 500 }
		);
	}
} 
