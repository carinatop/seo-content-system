# AI SEO Content System

Multi-brand SEO content studio — Next.js 15 (App Router) + Supabase + Anthropic (Claude).
This is the MVP scaffold from the approved blueprint at `.claude/plans/unified-inventing-blanket.md`.

## What works in this MVP

- Brand CRUD with Brand Brain fields (voice rules, tone, audience, commercial, SEO notes)
- Content piece pipeline: **Brief → Outline → Draft → Meta → QA**
- Section-by-section draft generation (Opus) to prevent context dilution
- QA scoring on 10 dimensions with verdict (publish / revise / reject)
- Versioned artifacts (brief v1, v2, …) stored in Supabase
- Draft detail page showing all artifacts + QA report
- Supabase RLS policies scoped by workspace

## Not yet built (see roadmap phases 5+ in the plan)

- Topic cluster generator
- Internal linking engine (pgvector embeddings)
- Refresh queue cron
- Newsletter + conversion-support chains
- Targeted revision endpoint
- Auth UI (you'll need to add Supabase Auth pages — API routes already check `auth.uid()`)

## Setup

### 1. Install
```bash
cd seo-content-system
npm install
```

### 2. Supabase
1. Create a Supabase project at https://supabase.com
2. Open SQL editor → paste `supabase/schema.sql` → run
3. Enable Email auth in Authentication → Providers

### 3. Environment
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional for MVP)
- `ANTHROPIC_API_KEY`

### 4. Run locally
```bash
npm run dev
```
Visit http://localhost:3000

### 5. Deploy to Vercel
- Push to GitHub
- Import repo in Vercel
- Add the same env vars in Vercel project settings
- Deploy

## Using the MVP

1. **Sign in** (add Supabase Auth UI — or temporarily insert a user via SQL for testing)
2. **Brands → Add brand** — fill in the Brand Brain
3. **Open brand → New content piece** — enter title + target keyword
4. Click the action buttons in order: **brief → outline → draft → meta → qa**
5. **Drafts → click a piece** to see all artifacts and the QA report

## Architecture at a glance

```
app/
  (app)/              # dashboard UI
    dashboard/
    brands/[id]/      # brand detail + piece pipeline controls
    drafts/[id]/      # artifact viewer + QA panel
  api/
    brands/[id]/
    pieces/[id]/
      brief/          # Claude Opus → structured brief JSON
      outline/        # Claude Opus → outline JSON
      draft/          # Section-by-section Opus draft (Node, 300s)
      meta/           # Claude Haiku → titles/meta/faqs/ctas
      qa/             # Claude Opus → 10-dim rubric + verdict
lib/
  anthropic.ts        # Claude client + callJSON / callMarkdown helpers
  brain/brandContext  # Assembles Brand Context Pack for prompt injection
  prompts/            # Versioned prompt templates per step
  supabase/           # SSR + browser clients
supabase/schema.sql   # Full DB schema + RLS
```

## Next steps (phases from the plan)

- **Phase 5** — topic cluster generator route
- **Phase 6** — enable `pgvector` extension, embed `brand_samples` + `brand_urls`, build internal link suggester
- **Phase 7** — Vercel Cron nightly `/api/refresh/scan`
- **Phase 8** — newsletter + conversion-support pipelines
- **Phase 9** — client-viewer role, share links, multi-user

## Cost note

A full blog piece with this pipeline (Opus brief + outline + sectioned draft + Opus QA + Haiku meta) should land under ~$0.50 at typical lengths. Logged via `prompt_runs` in the schema (wire up in `lib/anthropic.ts` when you want tracking).
