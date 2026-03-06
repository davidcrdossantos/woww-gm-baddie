import sharp from "sharp";

const GRAPH_BASE = "https://graph.facebook.com/v22.0";

// ── Error class ────────────────────────────────────────────────────────────

export class MetaApiError extends Error {
  statusCode: number;
  metaCode?: number;
  metaSubcode?: number;

  constructor(
    message: string,
    statusCode: number,
    metaCode?: number,
    metaSubcode?: number
  ) {
    super(message);
    this.name = "MetaApiError";
    this.statusCode = statusCode;
    this.metaCode = metaCode;
    this.metaSubcode = metaSubcode;
  }
}

function throwMetaError(body: Record<string, unknown>, status: number): never {
  const err = body.error as Record<string, unknown> | undefined;
  const message =
    (err?.error_user_msg as string) ||
    (err?.message as string) ||
    "Unknown Meta API error";
  const code = err?.code as number | undefined;
  const subcode = err?.error_subcode as number | undefined;
  throw new MetaApiError(message, status, code, subcode);
}

// ── Generic helpers ────────────────────────────────────────────────────────

export async function metaGet<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${endpoint}`);
  url.searchParams.set("access_token", accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) throwMetaError(body, res.status);
  return body as T;
}

export async function metaPost<T>(
  endpoint: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throwMetaError(data, res.status);
  return data as T;
}

// ── Typed API calls ────────────────────────────────────────────────────────

export interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
}

export interface FacebookPage {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
}

export interface AdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
}

export async function getAdAccounts(accessToken: string): Promise<AdAccount[]> {
  const data = await metaGet<{ data: AdAccount[] }>(
    "/me/adaccounts",
    accessToken,
    { fields: "id,name,account_id,account_status,currency", limit: "100" }
  );
  return (data.data || []).sort(
    (a, b) => (a.account_status === 1 ? -1 : 1) - (b.account_status === 1 ? -1 : 1)
  );
}

export async function getPages(accessToken: string): Promise<FacebookPage[]> {
  const data = await metaGet<{ data: FacebookPage[] }>(
    "/me/accounts",
    accessToken,
    { fields: "id,name", limit: "100" }
  );
  return data.data || [];
}

export async function getCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<Campaign[]> {
  const data = await metaGet<{ data: Campaign[] }>(
    `/${adAccountId}/campaigns`,
    accessToken,
    {
      fields: "id,name,status,objective",
      limit: "100",
      effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
    }
  );
  return data.data || [];
}

export async function getAdSets(
  campaignId: string,
  accessToken: string
): Promise<AdSet[]> {
  const data = await metaGet<{ data: AdSet[] }>(
    `/${campaignId}/adsets`,
    accessToken,
    { fields: "id,name,status,campaign_id", limit: "100" }
  );
  return data.data || [];
}

export async function getAdSetDetails(
  adSetId: string,
  accessToken: string
): Promise<Record<string, unknown>> {
  return metaGet<Record<string, unknown>>(
    `/${adSetId}`,
    accessToken,
    {
      fields:
        "id,name,status,campaign_id,targeting,billing_event,optimization_goal,bid_amount,bid_strategy,daily_budget,lifetime_budget,end_time,promoted_object,destination_type,attribution_spec,pacing_type,budget_remaining",
    }
  );
}

export async function createAdSet(
  adAccountId: string,
  accessToken: string,
  {
    name,
    campaignId,
    sourceAdSetId,
  }: { name: string; campaignId: string; sourceAdSetId: string }
): Promise<{ id: string }> {
  const source = await getAdSetDetails(sourceAdSetId, accessToken);

  const payload: Record<string, unknown> = {
    name,
    campaign_id: campaignId,
    status: "PAUSED",
    billing_event: source.billing_event,
    optimization_goal: source.optimization_goal,
    targeting: source.targeting,
  };

  if (source.bid_amount) payload.bid_amount = source.bid_amount;
  if (source.bid_strategy) payload.bid_strategy = source.bid_strategy;
  if (source.daily_budget) payload.daily_budget = source.daily_budget;
  if (source.lifetime_budget) {
    payload.lifetime_budget = source.lifetime_budget;
    if (source.end_time) payload.end_time = source.end_time;
  }
  if (source.promoted_object) payload.promoted_object = source.promoted_object;
  if (source.destination_type) payload.destination_type = source.destination_type;
  if (source.attribution_spec) payload.attribution_spec = source.attribution_spec;
  if (source.pacing_type) payload.pacing_type = source.pacing_type;

  return metaPost<{ id: string }>(
    `/${adAccountId}/adsets`,
    accessToken,
    payload
  );
}

export async function uploadImageToMeta(
  adAccountId: string,
  accessToken: string,
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  const mimeType = fileName.split(".").pop()?.toLowerCase();
  let finalBuffer = imageBuffer;
  let finalName = fileName;

  if (["webp", "bmp", "tiff", "tif"].includes(mimeType || "")) {
    finalBuffer = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
    finalName = fileName.replace(/\.[^.]+$/, ".jpg");
  }

  const form = new FormData();
  form.append(
    "source",
    new Blob([finalBuffer as unknown as BlobPart[]]),
    finalName
  );
  form.append("access_token", accessToken);

  const res = await fetch(`${GRAPH_BASE}/${adAccountId}/adimages`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok || data.error) throwMetaError(data, res.status);

  const images = data.images as Record<string, { hash: string }>;
  const first = Object.values(images)[0];
  return first.hash;
}

export async function uploadVideoToMeta(
  adAccountId: string,
  accessToken: string,
  videoBuffer: Buffer,
  fileName: string
): Promise<string> {
  const form = new FormData();
  form.append("source", new Blob([videoBuffer]), fileName);
  form.append("access_token", accessToken);

  const res = await fetch(`${GRAPH_BASE}/${adAccountId}/advideos`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok || data.error) throwMetaError(data, res.status);
  return data.id as string;
}

// ── createAdCreative ───────────────────────────────────────────────────────

interface CreativeParams {
  pageId: string;
  mediaType: "image" | "video";
  mediaHash?: string;
  videoId?: string;
  thumbnailUrl?: string;
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
  ctaType: string;
  websiteUrl: string;
  displayLink?: string;
  name: string;
}

export async function createAdCreative(
  adAccountId: string,
  accessToken: string,
  params: CreativeParams
): Promise<{ id: string }> {
  const {
    pageId,
    mediaType,
    mediaHash,
    videoId,
    thumbnailUrl,
    primaryTexts,
    headlines,
    descriptions,
    ctaType,
    websiteUrl,
    displayLink,
    name,
  } = params;

  const isMultiVariation =
    primaryTexts.length > 1 ||
    headlines.length > 1 ||
    descriptions.length > 1;

  let objectStorySpec: Record<string, unknown>;

  if (isMultiVariation) {
    // Case 1: asset_feed_spec
    const assetFeedSpec: Record<string, unknown> = {
      bodies: primaryTexts.map((t) => ({ text: t })),
      titles: headlines.map((t) => ({ text: t })),
      call_to_action_types: [ctaType],
      link_urls: [{ website_url: websiteUrl }],
    };

    const nonEmptyDescs = descriptions.filter((d) => d.trim());
    if (nonEmptyDescs.length > 0) {
      assetFeedSpec.descriptions = nonEmptyDescs.map((d) => ({ text: d }));
    }

    if (mediaType === "image" && mediaHash) {
      assetFeedSpec.images = [{ hash: mediaHash }];
      assetFeedSpec.ad_formats = ["SINGLE_IMAGE"];
    } else if (mediaType === "video" && videoId) {
      const videoItem: Record<string, unknown> = { video_id: videoId };
      if (thumbnailUrl) videoItem.thumbnail_url = thumbnailUrl;
      assetFeedSpec.videos = [videoItem];
      assetFeedSpec.ad_formats = ["SINGLE_VIDEO"];
    }

    objectStorySpec = { page_id: pageId };

    return metaPost<{ id: string }>(
      `/${adAccountId}/adcreatives`,
      accessToken,
      {
        name,
        asset_feed_spec: assetFeedSpec,
        object_story_spec: objectStorySpec,
      }
    );
  } else {
    // Case 2: single variation
    if (mediaType === "image" && mediaHash) {
      const linkData: Record<string, unknown> = {
        image_hash: mediaHash,
        link: websiteUrl,
        message: primaryTexts[0],
        name: headlines[0],
        call_to_action: { type: ctaType },
      };
      if (descriptions[0]?.trim()) linkData.description = descriptions[0];
      if (displayLink?.trim()) linkData.caption = displayLink;

      objectStorySpec = { page_id: pageId, link_data: linkData };
    } else if (mediaType === "video" && videoId) {
      const videoData: Record<string, unknown> = {
        video_id: videoId,
        message: primaryTexts[0],
        title: headlines[0],
        call_to_action: { type: ctaType, value: { link: websiteUrl } },
      };
      if (descriptions[0]?.trim()) videoData.link_description = descriptions[0];
      if (thumbnailUrl) videoData.image_url = thumbnailUrl;

      objectStorySpec = { page_id: pageId, video_data: videoData };
    } else {
      throw new MetaApiError("Missing media hash or video ID", 400);
    }

    return metaPost<{ id: string }>(
      `/${adAccountId}/adcreatives`,
      accessToken,
      { name, object_story_spec: objectStorySpec }
    );
  }
}

export async function createAd(
  adAccountId: string,
  accessToken: string,
  {
    name,
    adSetId,
    creativeId,
    status,
  }: { name: string; adSetId: string; creativeId: string; status: string }
): Promise<{ id: string }> {
  return metaPost<{ id: string }>(`/${adAccountId}/ads`, accessToken, {
    name,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status,
  });
}
