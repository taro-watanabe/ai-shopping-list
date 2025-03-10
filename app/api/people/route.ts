import { db } from '@/db';
import { people } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await db.select().from(people);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { name, color } = await request.json();
  
  const result = await db.insert(people).values({
    name,
    color,
  }).returning();
  
  return NextResponse.json(result[0]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  
  await db.delete(people).where(eq(people.id, id));
  
  return NextResponse.json({ success: true });
}