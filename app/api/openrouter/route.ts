import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";

export async function POST(request: Request) {
	try {
		const { image } = await request.json();

		if (!image) {
			return NextResponse.json(
				{ error: "Missing image data" },
				{ status: 400 },
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
	{"name": "string", "price": number, "description": "string"},
	...,
]
}
Important rules:
1. return only the JSON object, nothing else. If data is incomplete or unclear, return "ERROR"
2. Ignore quantity rows like '3 x 2.40'
3. Only respond with valid JSON or "ERROR"
4. The receipt input can be either in Italian or in English.
5. If there is a discount, count that as an item on its own, with a negative price. When doing so, aggregate the original item name with the discount name, e.g. "Discount on item X"
6. The description will not be present in the receipt itself, but should be generated. Please provide a short description of the supposed item based on the name (names are often cutoff and abbreviated, like "PARM. REG. 18 ME" for "parimigaino reggiano 18 mesi"), location you may find in the receipt (e.g. Carrefour -> likely to be grocery), and price. provide it in both English and Italian. Aim for around 10-30 words per language.

Receipt image:
							`,
						},
						{
							type: "image_url",
							image_url: {
								url: `data:image/jpeg;base64,${image}`,
							},
						},
					],
				},
			],
		});
		return NextResponse.json({
			analysis: completion.choices[0].message.content,
		});
	} catch (error) {
		console.error("OpenRouter API error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze receipt" },
			{ status: 500 },
		);
	}
}
