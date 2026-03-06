import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metaSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdAccounts } from "@/lib/utils/meta-api";

export async function GET() {
  const rows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);

  const token = rows[0]?.accessToken;
  if (!token) return NextResponse.json({ error: "No token saved" }, { status: 400 });

  try {
    const accounts = await getAdAccounts(token);
    return NextResponse.json({ accounts });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
