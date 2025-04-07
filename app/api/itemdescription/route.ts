import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";

export async function POST(request: Request) {
	try {
		const { name, tag } = await request.json();

		if (!name) {
			return NextResponse.json({ error: "Missing data" }, { status: 400 });
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
Given a name of an item and a tag (typically refers to a location, like a shop, store names, or a category), 
infer and generate a short set of keywords related to the item in both English and Italian. If there is a possibility of multiple interpretation or context, generate multiple sets of descriptions.
The set of keywords should be around 10-30 words in each language. Also, include a couple of popular proper nouns in Italy for that item, like "TUC" for input "crackers", "Barilla, rummo, de cecco" for "pasta", etc. Thiese should also be treated like a keyword.
The output should be a JSON object with the following structure (both for single and multiple sets of descriptions". just provide string as comma separated keywords/phrases. No periods, no flags like "Brands: ".
{"descriptions": [
{"en": "string", "it": "string"},
... 
]
Important rules:
1. return only the JSON object, nothing else. If data is incomplete or unclear, return "ERROR"
2. Only respond with valid JSON or "ERROR"
3. The name or the tag can be either in Italian or in English.
4. if there exists a quantity specified in the name, you may safely ignore the numeric information.

INPUT:
    name: "${name}"
    tag: "${tag}"
`,
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
