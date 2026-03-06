import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metaSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);
  const row = rows[0];

  if (!row) return NextResponse.json({ hasToken: false });

  return NextResponse.json({
    hasToken: !!row.accessToken,
    tokenPreview: row.accessToken
      ? `••••••••${row.accessToken.slice(-8)}`
      : null,
    adAccountId: row.adAccountId,
    adAccountName: row.adAccountName,
    pageId: row.pageId,
    pageName: row.pageName,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accessToken, adAccountId, adAccountName, pageId, pageName } = body;

  // If token starts with mask, load existing token from DB
  let tokenToSave = accessToken;
  if (accessToken?.startsWith("••••••••")) {
    const existing = await db
      .select({ accessToken: metaSettings.accessToken })
      .from(metaSettings)
      .where(eq(metaSettings.id, 1))
      .limit(1);
    tokenToSave = existing[0]?.accessToken || accessToken;
  }

  await db
    .insert(metaSettings)
    .values({
      id: 1,
      accessToken: tokenToSave,
      adAccountId,
      adAccountName,
      pageId,
      pageName,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: metaSettings.id,
      set: {
        accessToken: tokenToSave,
        adAccountId,
        adAccountName,
        pageId,
        pageName,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
