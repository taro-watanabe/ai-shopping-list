import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/openai";

export async function POST(request: Request) {
	try {
		const { text } = await request.json();
		if (!text) {
			return NextResponse.json({ error: "Missing text data" }, { status: 400 });
		}

		const embedding = await generateEmbedding(text);
		return NextResponse.json({
			embedding,
		});
	} catch (error) {
		console.error("OpenAI API error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
