import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { creatives } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_THUMB_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const creativeId = formData.get("creativeId") as string;
  const file = formData.get("thumbnail") as File | null;

  if (!creativeId || !file)
    return NextResponse.json({ error: "creativeId and thumbnail required" }, { status: 400 });

  const rows = await db
    .select()
    .from(creatives)
    .where(eq(creatives.id, creativeId))
    .limit(1);

  const creative = rows[0];
  if (!creative)
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });

  if (creative.fileType !== "video")
    return NextResponse.json({ error: "Thumbnails only for videos" }, { status: 400 });

  if (!ALLOWED_THUMB_MIMES.has(file.type))
    return NextResponse.json({ error: "Thumbnail must be JPG, PNG, or WebP" }, { status: 400 });

  const thumbDir = join(process.cwd(), "public", "uploads", creative.batchId, "thumbnails");
  await mkdir(thumbDir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const thumbName = `${creative.id}_thumb.${ext}`;
  const thumbPath = join(thumbDir, thumbName);
  const bytes = await file.arrayBuffer();
  await writeFile(thumbPath, Buffer.from(bytes));

  const relativePath = `uploads/${creative.batchId}/thumbnails/${thumbName}`;

  const [updated] = await db
    .update(creatives)
    .set({ thumbnailPath: relativePath, updatedAt: new Date() })
    .where(eq(creatives.id, creativeId))
    .returning();

  return NextResponse.json({ creative: updated });
}
