import { db } from "@/db";
import { items, tags, people } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const include = searchParams.get('include');

  const query = db
    .select({
      id: items.id,
      name: items.name,
      checked: items.checked,
      createdAt: items.createdAt,
      tagId: items.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
        color: tags.color
      },
      personId: items.personId,
      person: include?.includes('person') ? {
        id: people.id,
        name: people.name,
        color: people.color
      } : {}
    })
    .from(items)
    .leftJoin(tags, eq(items.tagId, tags.id))
    .leftJoin(people, eq(items.personId, people.id));

  const allItems = await query;

  return NextResponse.json(allItems);
}

export async function POST(request: Request) {
  const { name, tagId, personId } = await request.json();

  const newItem = await db.insert(items).values({
    name,
    tagId: tagId ? Number(tagId) : null,
    personId: personId ? Number(personId) : null
  }).returning({
    id: items.id,
    name: items.name,
    checked: items.checked,
    createdAt: items.createdAt,
    tagId: items.tagId,
    personId: items.personId
  });

  return NextResponse.json(newItem[0]);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, checked, personId } = body;

    const parsedId = Number(id);
    if (Number.isNaN(parsedId) || typeof checked !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    const updateData = {
      checked,
      ...(personId && { personId: Number(personId) })
    };

    const updatedItem = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, parsedId))
      .returning();

    if (!updatedItem.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const parsedId = Number(id);

    if (Number.isNaN(parsedId)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    await db
      .delete(items)
      .where(eq(items.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}