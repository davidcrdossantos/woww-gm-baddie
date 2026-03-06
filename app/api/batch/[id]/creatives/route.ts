import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creatives } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(creatives)
    .where(eq(creatives.batchId, id))
    .orderBy(asc(creatives.createdAt));

  return NextResponse.json({ creatives: rows });
}
