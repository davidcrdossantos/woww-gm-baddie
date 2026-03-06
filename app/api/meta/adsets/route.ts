import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metaSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdSets, createAdSet } from "@/lib/utils/meta-api";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  if (!campaignId)
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  const rows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);

  const settings = rows[0];
  if (!settings?.accessToken)
    return NextResponse.json({ error: "No token" }, { status: 400 });

  try {
    const adSets = await getAdSets(campaignId, settings.accessToken);
    return NextResponse.json({ adSets });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  campaignId: z.string().min(1),
  sourceAdSetId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const rows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);

  const settings = rows[0];
  if (!settings?.accessToken || !settings?.adAccountId)
    return NextResponse.json({ error: "Settings not configured" }, { status: 400 });

  try {
    const result = await createAdSet(
      settings.adAccountId,
      settings.accessToken,
      parsed.data
    );
    return NextResponse.json({ adSet: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
