import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────
export const batchStatusEnum = pgEnum("batch_status", [
  "draft",
  "uploading",
  "complete",
  "error",
]);

export const creativeStatusEnum = pgEnum("creative_status", [
  "pending",
  "uploading",
  "created",
  "error",
]);

export const fileTypeEnum = pgEnum("file_type", ["image", "video"]);

// ── GM Tables ──────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  category: text("category"),
  description: text("description"),
  url: text("url"),
  market: text("market"),
  problem: text("problem"),
  outcome: text("outcome"),
  features: text("features"),
  methodology: text("methodology"),
  proof: text("proof"),
  mechanism: text("mechanism"),
  authority: text("authority"),
  customers: text("customers"),
  testimonials: text("testimonials"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const generatedOutputs = pgTable("generated_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "cascade",
  }),
  module: text("module").notNull(),
  prompt: text("prompt"),
  output: text("output").notNull(),
  isFavourited: boolean("is_favourited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Meta Ads Tables ────────────────────────────────────────────────────────

export const metaSettings = pgTable("meta_settings", {
  id: integer("id").primaryKey().default(1),
  accessToken: text("access_token"),
  adAccountId: text("ad_account_id"),
  adAccountName: text("ad_account_name"),
  pageId: text("page_id"),
  pageName: text("page_name"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uploadBatches = pgTable("upload_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchName: text("batch_name").notNull(),
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  adSetId: text("ad_set_id"),
  adSetName: text("ad_set_name"),
  primaryTexts: jsonb("primary_texts").$type<string[]>().default([]),
  headlines: jsonb("headlines").$type<string[]>().default([]),
  descriptions: jsonb("descriptions").$type<string[]>().default([]),
  ctaType: text("cta_type"),
  websiteUrl: text("website_url"),
  displayLink: text("display_link"),
  launchAsPaused: boolean("launch_as_paused").default(true),
  enhancementsEnabled: boolean("enhancements_enabled").default(false),
  status: batchStatusEnum("status").default("draft").notNull(),
  adsCreated: integer("ads_created").default(0),
  adsErrored: integer("ads_errored").default(0),
  errorLog: jsonb("error_log").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creatives = pgTable("creatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id")
    .references(() => uploadBatches.id, { onDelete: "cascade" })
    .notNull(),
  fileName: text("file_name").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  thumbnailPath: text("thumbnail_path"),
  adName: text("ad_name").notNull(),
  metaAdId: text("meta_ad_id"),
  metaCreativeId: text("meta_creative_id"),
  status: creativeStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ many }) => ({
  outputs: many(generatedOutputs),
}));

export const uploadBatchesRelations = relations(
  uploadBatches,
  ({ many }) => ({
    creatives: many(creatives),
  })
);

export const creativesRelations = relations(creatives, ({ one }) => ({
  batch: one(uploadBatches, {
    fields: [creatives.batchId],
    references: [uploadBatches.id],
  }),
}));

// ── Inferred Types ─────────────────────────────────────────────────────────

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type GeneratedOutput = typeof generatedOutputs.$inferSelect;
export type MetaSettings = typeof metaSettings.$inferSelect;
export type UploadBatch = typeof uploadBatches.$inferSelect;
export type Creative = typeof creatives.$inferSelect;
