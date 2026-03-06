import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { uploadBatches, creatives, metaSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  uploadImageToMeta,
  uploadVideoToMeta,
  createAdCreative,
  createAd,
} from "@/lib/utils/meta-api";
import { z } from "zod";

const launchSchema = z.object({
  batchId: z.string().uuid(),
  adSetId: z.string().min(1),
  campaignId: z.string().min(1),
  campaignName: z.string().optional(),
  adSetName: z.string().optional(),
  primaryTexts: z.array(z.string()).min(1),
  headlines: z.array(z.string()).min(1),
  descriptions: z.array(z.string()).default([]),
  ctaType: z.string().min(1),
  websiteUrl: z.string().url(),
  displayLink: z.string().optional(),
  launchAsPaused: z.boolean().default(true),
  enhancementsEnabled: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = launchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;

  // Load settings
  const settingsRows = await db
    .select()
    .from(metaSettings)
    .where(eq(metaSettings.id, 1))
    .limit(1);
  const settings = settingsRows[0];
  if (!settings?.accessToken || !settings?.adAccountId || !settings?.pageId)
    return NextResponse.json({ error: "Settings not fully configured (token, ad account, page)" }, { status: 400 });

  // Load batch
  const batchRows = await db
    .select()
    .from(uploadBatches)
    .where(eq(uploadBatches.id, data.batchId))
    .limit(1);
  const batch = batchRows[0];
  if (!batch)
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  // Load creatives
  const batchCreatives = await db
    .select()
    .from(creatives)
    .where(eq(creatives.batchId, data.batchId));

  if (!batchCreatives.length)
    return NextResponse.json({ error: "No creatives in batch" }, { status: 400 });

  // Mark batch uploading and save copy config
  await db
    .update(uploadBatches)
    .set({
      status: "uploading",
      campaignId: data.campaignId,
      campaignName: data.campaignName,
      adSetId: data.adSetId,
      adSetName: data.adSetName,
      primaryTexts: data.primaryTexts,
      headlines: data.headlines,
      descriptions: data.descriptions,
      ctaType: data.ctaType,
      websiteUrl: data.websiteUrl,
      displayLink: data.displayLink,
      launchAsPaused: data.launchAsPaused,
      enhancementsEnabled: data.enhancementsEnabled,
      updatedAt: new Date(),
    })
    .where(eq(uploadBatches.id, data.batchId));

  let adsCreated = 0;
  let adsErrored = 0;
  const errorLog: string[] = [];

  for (const creative of batchCreatives) {
    // Mark creative uploading
    await db
      .update(creatives)
      .set({ status: "uploading", updatedAt: new Date() })
      .where(eq(creatives.id, creative.id));

    try {
      const filePath = join(process.cwd(), "public", creative.filePath);
      const fileBuffer = await readFile(filePath);

      let metaCreativeId: string;
      let metaAdId: string;

      if (creative.fileType === "image") {
        const imageHash = await uploadImageToMeta(
          settings.adAccountId,
          settings.accessToken,
          fileBuffer,
          creative.fileName
        );

        const creativeResult = await createAdCreative(
          settings.adAccountId,
          settings.accessToken,
          {
            pageId: settings.pageId,
            mediaType: "image",
            mediaHash: imageHash,
            primaryTexts: data.primaryTexts,
            headlines: data.headlines,
            descriptions: data.descriptions,
            ctaType: data.ctaType,
            websiteUrl: data.websiteUrl,
            displayLink: data.displayLink,
            name: creative.adName,
          }
        );
        metaCreativeId = creativeResult.id;
      } else {
        // Video
        const videoId = await uploadVideoToMeta(
          settings.adAccountId,
          settings.accessToken,
          fileBuffer,
          creative.fileName
        );

        let thumbnailUrl: string | undefined;
        if (creative.thumbnailPath) {
          try {
            const thumbPath = join(process.cwd(), "public", creative.thumbnailPath);
            const thumbBuffer = await readFile(thumbPath);
            const thumbHash = await uploadImageToMeta(
              settings.adAccountId,
              settings.accessToken,
              thumbBuffer,
              `thumb_${creative.fileName}.jpg`
            );
            thumbnailUrl = `https://graph.facebook.com/v22.0/${settings.adAccountId}/adimages?hash=${thumbHash}`;
          } catch {
            // Non-fatal: continue without thumbnail
            console.warn(`Thumbnail upload failed for ${creative.id}`);
          }
        }

        const creativeResult = await createAdCreative(
          settings.adAccountId,
          settings.accessToken,
          {
            pageId: settings.pageId,
            mediaType: "video",
            videoId,
            thumbnailUrl,
            primaryTexts: data.primaryTexts,
            headlines: data.headlines,
            descriptions: data.descriptions,
            ctaType: data.ctaType,
            websiteUrl: data.websiteUrl,
            displayLink: data.displayLink,
            name: creative.adName,
          }
        );
        metaCreativeId = creativeResult.id;
      }

      // Create the ad
      const adStatus = data.launchAsPaused ? "PAUSED" : "ACTIVE";
      const adResult = await createAd(
        settings.adAccountId,
        settings.accessToken,
        {
          name: creative.adName,
          adSetId: data.adSetId,
          creativeId: metaCreativeId,
          status: adStatus,
        }
      );
      metaAdId = adResult.id;

      await db
        .update(creatives)
        .set({
          status: "created",
          metaCreativeId,
          metaAdId,
          updatedAt: new Date(),
        })
        .where(eq(creatives.id, creative.id));

      adsCreated++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errorLog.push(`${creative.adName}: ${msg}`);
      await db
        .update(creatives)
        .set({ status: "error", errorMessage: msg, updatedAt: new Date() })
        .where(eq(creatives.id, creative.id));
      adsErrored++;
    }
  }

  const finalStatus = adsCreated === 0 ? "error" : "complete";
  await db
    .update(uploadBatches)
    .set({
      status: finalStatus,
      adsCreated,
      adsErrored,
      errorLog,
      updatedAt: new Date(),
    })
    .where(eq(uploadBatches.id, data.batchId));

  const httpStatus = adsCreated === 0 ? 400 : adsErrored > 0 ? 207 : 200;
  return NextResponse.json({ adsCreated, adsErrored, errorLog }, { status: httpStatus });
}
