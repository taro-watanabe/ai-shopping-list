import { db } from '@/db';
import { tags } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allTags = await db.select().from(tags);
  return NextResponse.json(allTags);
}

export async function POST(request: Request) {
  const { name, color } = await request.json();
  
  if (!name || !color || !/^[a-fA-F0-9]{6}$/.test(color)) {
    return NextResponse.json(
      { error: 'Invalid tag data' },
      { status: 400 }
    );
  }

  try {
    const newTag = await db.insert(tags).values({
      name,
      color,
    }).returning();
    
    return NextResponse.json(newTag[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Tag creation failed' },
      { status: 500 }
    );
  }
}