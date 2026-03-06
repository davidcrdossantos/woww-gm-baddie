import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metaSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCampaigns } from "@/lib/utils/meta-api";

export async function GET() {
  const rows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);

  const settings = rows[0];
  if (!settings?.accessToken || !settings?.adAccountId)
    return NextResponse.json({ error: "Settings not configured" }, { status: 400 });

  try {
    const campaigns = await getCampaigns(settings.adAccountId, settings.accessToken);
    return NextResponse.json({ campaigns });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
