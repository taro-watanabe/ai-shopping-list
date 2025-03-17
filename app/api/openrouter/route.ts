import { NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/openrouter";

export async function POST(request: Request) {
	try {
		const { messages } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: "Invalid messages format" },
				{ status: 400 },
			);
		}

		const completion = await getChatCompletion(messages);

		return NextResponse.json({ completion });
	} catch (error) {
		console.error("Error calling OpenRouter API:", error);
		return NextResponse.json(
			{ error: "Failed to get completion" },
			{ status: 500 },
		);
	}
}
