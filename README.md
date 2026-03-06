# Woww GM Baddie

> Dream campaigns for a Dream Team — 11-module AI marketing platform.

## Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Clients** | Client brief builder with AI feedback |
| 2 | **Dream Buyer Avatars** | 14-tab psychographic persona builder |
| 3 | **Google Ads Generator** | Headlines, descriptions, sitelinks, keywords |
| 4 | **Facebook Ad Generator** | 8 angles, beast mode, 3 output formats |
| 5 | **Ad Creatives** | Live preview builder + AI image generation |
| 6 | **DR Headlines** | Direct response headlines for ads & pages |
| 7 | **HVCO Titles** | Lead magnet title variations |
| 8 | **Hero Mechanisms** | Unique mechanism builder |
| 9 | **Landing Pages** | Full HTML pages, live preview, downloadable |
| 10 | **Godfather Offers** | Zero-risk offer engineering |
| 11 | **Meta Ads Uploader** | Bulk upload creatives to Meta via API v22.0 |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in DATABASE_URL and ANTHROPIC_API_KEY

# 3. Push database schema
npm run db:push

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard/clients`.

## Environment Variables

```
DATABASE_URL=postgresql://...   # Neon, Supabase, or any Postgres
ANTHROPIC_API_KEY=sk-ant-...    # For all AI generation modules
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database (Drizzle + Neon)

Schema has 5 tables: `clients`, `generated_outputs`, `meta_settings`, `upload_batches`, `creatives`.

```bash
npm run db:push    # Push schema to database
npm run db:studio  # Open Drizzle Studio
```

## Meta Ads Setup (Module 11)

1. Go to `/dashboard/meta-ads/settings`
2. Get a token from [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer) with `ads_management` + `pages_read_engagement` permissions
3. Select your ad account and Facebook page
4. Go to Upload → upload creatives → write copy → launch

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** + **Tailwind CSS**
- **Drizzle ORM** + **Neon PostgreSQL**
- **Anthropic Claude** (claude-sonnet-4-20250514)
- **Meta Marketing API v22.0**
- **sharp** for image conversion
