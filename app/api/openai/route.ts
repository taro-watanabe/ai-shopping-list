import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

async function generateEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    return response.data[0].embedding;
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        if (!text) {
            return NextResponse.json(
                { error: "Missing text data" },
                { status: 400 }
            );
        }

        const embedding = await generateEmbedding(text);
        return NextResponse.json({
            embedding,
        });
    } catch (error) {
        console.error("OpenAI API error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}    