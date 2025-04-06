import { db } from "@/db";
import { items } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  const { embeddings, threshold = 0.8 } = await request.json();

  try {
    const results = await db.all(sql`
      SELECT 
        id,
        name,
        price,
        checked,
        vector,
        (1 - vec_cosine_distance(
          vector, 
          json(${JSON.stringify(embeddings)})
        )) AS similarity
      FROM items
      WHERE checked = FALSE
      AND similarity > ${threshold}
      ORDER BY similarity DESC
      LIMIT 1
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Vector search failed:", error);
    return NextResponse.json(
      { error: "Vector search failed" },
      { status: 500 }
    );
  }
}
