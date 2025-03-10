import { db } from "@/db";
import { tags } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
	const allTags = await db.select().from(tags).where(eq(tags.deleted, false));
	return NextResponse.json(allTags);
}

export async function POST(request: Request) {
	const { name, color } = await request.json();
  
	if (!name || !color || !/^[a-fA-F0-9]{6}$/.test(color)) {
		return NextResponse.json({ error: "Invalid tag data" }, { status: 400 });
	}

	try {
		const newTag = await db
			.insert(tags)
			.values({
				name,
				color,
			})
			.returning();

		return NextResponse.json(newTag[0]);
	} catch (error) {
		return NextResponse.json({ error: "Tag creation failed" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const { id } = await request.json();

	if (!id) {
		return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
	}

	try {
		await db.update(tags).set({ deleted: true }).where(eq(tags.id, id));
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json({ error: "Tag deletion failed" }, { status: 500 });
	}
}
