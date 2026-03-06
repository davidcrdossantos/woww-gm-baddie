import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadBatches } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const batches = await db
    .select()
    .from(uploadBatches)
    .orderBy(desc(uploadBatches.createdAt));
  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest) {
  const { batchName } = await req.json();
  if (!batchName?.trim())
    return NextResponse.json({ error: "Batch name required" }, { status: 400 });

  const [batch] = await db
    .insert(uploadBatches)
    .values({ batchName: batchName.trim() })
    .returning();

  return NextResponse.json({ batch }, { status: 201 });
}
