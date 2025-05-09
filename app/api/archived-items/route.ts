import { db } from "@/db";
import { items, tags, people } from "@/db/schema";
import { eq, and, lt, gte, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const offset = (page - 1) * limit;

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Base query for archived items (checked AND checkedAt older than 7 days)
  const archivedCondition = and(
    eq(items.checked, true),
    lt(items.checkedAt, sevenDaysAgo.toISOString())
  );

  // Get total count of archived items
  const totalItems = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(archivedCondition);

  // Get paginated archived items with related data
  const archivedItems = await db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      price: items.price,
      checked: items.checked,
      checkedAt: items.checkedAt,
      createdAt: items.createdAt,
      tagId: items.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
        color: tags.color,
      },
      personId: items.personId,
      person: {
        id: people.id,
        name: people.name,
        color: people.color,
      },
    })
    .from(items)
    .leftJoin(tags, eq(items.tagId, tags.id))
    .leftJoin(people, eq(items.personId, people.id))
    .where(archivedCondition)
    .orderBy(items.checkedAt)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    items: archivedItems,
    currentPage: page,
    totalPages: Math.ceil(totalItems[0].count / limit),
    totalItems: totalItems[0].count,
  });
}
