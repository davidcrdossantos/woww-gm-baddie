import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creatives } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const { id, adName } = await req.json();

  if (!id || !adName?.trim())
    return NextResponse.json({ error: "id and adName required" }, { status: 400 });

  const [updated] = await db
    .update(creatives)
    .set({ adName: adName.trim(), updatedAt: new Date() })
    .where(eq(creatives.id, id))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });

  return NextResponse.json({ creative: updated });
}
