import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { uploadBatches, creatives } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
]);
const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/mpeg",
  "video/webm",
]);

function classifyMimeType(mime: string): "image" | "video" | null {
  const clean = mime.split(";")[0].trim().toLowerCase();
  if (IMAGE_MIMES.has(clean)) return "image";
  if (VIDEO_MIMES.has(clean)) return "video";
  return null;
}

function sanitizeFileName(original: string): string {
  const lastDot = original.lastIndexOf(".");
  const ext = lastDot >= 0 ? original.slice(lastDot).toLowerCase() : "";
  let base = lastDot >= 0 ? original.slice(0, lastDot) : original;
  base = base
    .replace(/[^a-zA-Z0-9\-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!base) base = "file";
  return `${base}${ext}`;
}

function adNameFromFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const base = lastDot >= 0 ? fileName.slice(0, lastDot) : fileName;
  return base
    .replace(/[_\-]/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function deduplicateFileName(name: string, existing: Set<string>): string {
  if (!existing.has(name)) {
    existing.add(name);
    return name;
  }
  const lastDot = name.lastIndexOf(".");
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot >= 0 ? name.slice(lastDot) : "";
  let counter = 2;
  while (existing.has(`${base}_${counter}${ext}`)) counter++;
  const unique = `${base}_${counter}${ext}`;
  existing.add(unique);
  return unique;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const batchId = formData.get("batchId") as string;
  if (!batchId)
    return NextResponse.json({ error: "batchId required" }, { status: 400 });

  const batches = await db
    .select()
    .from(uploadBatches)
    .where(eq(uploadBatches.id, batchId))
    .limit(1);
  if (!batches.length)
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  const uploadDir = join(process.cwd(), "public", "uploads", batchId);
  await mkdir(uploadDir, { recursive: true });

  const files = formData.getAll("files") as File[];
  const results: { id: string; adName: string; fileName: string }[] = [];
  const errors: { fileName: string; error: string }[] = [];
  const seenNames = new Set<string>();

  for (const file of files) {
    const mime = file.type;
    const fileType = classifyMimeType(mime);
    if (!fileType) {
      errors.push({ fileName: file.name, error: `Unsupported type: ${mime}` });
      continue;
    }

    try {
      const sanitized = deduplicateFileName(sanitizeFileName(file.name), seenNames);
      const filePath = join(uploadDir, sanitized);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const relativePath = `uploads/${batchId}/${sanitized}`;
      const adName = adNameFromFileName(sanitized);

      const [creative] = await db
        .insert(creatives)
        .values({
          batchId,
          fileName: sanitized,
          fileType,
          mimeType: mime,
          filePath: relativePath,
          fileSize: file.size,
          adName,
        })
        .returning();

      results.push({ id: creative.id, adName, fileName: sanitized });
    } catch (e: unknown) {
      errors.push({
        fileName: file.name,
        error: e instanceof Error ? e.message : "Write failed",
      });
    }
  }

  const status =
    results.length === 0 ? 400 : errors.length > 0 ? 207 : 201;
  return NextResponse.json(
    { creatives: results, errors: errors.length ? errors : undefined },
    { status }
  );
}
