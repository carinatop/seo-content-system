-- AI SEO Content System schema
-- Run in Supabase SQL editor. Auth is handled by Supabase Auth.

create extension if not exists "pgcrypto";
-- enable later for embeddings:
-- create extension if not exists vector;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  plan text default 'free',
  created_at timestamptz default now()
);

create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'owner',
  primary key (workspace_id, user_id)
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  niche text,
  audience_json jsonb default '{}'::jsonb,
  tone_json jsonb default '{}'::jsonb,
  voice_rules_json jsonb default '{}'::jsonb,
  commercial_json jsonb default '{}'::jsonb,
  seo_notes text,
  created_at timestamptz default now()
);
create index on brands(workspace_id);

create table if not exists brand_samples (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  title text,
  body text not null,
  created_at timestamptz default now()
);
create index on brand_samples(brand_id);

create table if not exists brand_urls (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  url text not null,
  title text,
  tags text[] default '{}',
  summary text
);
create index on brand_urls(brand_id);

create table if not exists brand_competitors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  domain text not null,
  notes text
);

create table if not exists topic_clusters (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  pillar text not null,
  description text,
  status text default 'active'
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references topic_clusters(id) on delete set null,
  brand_id uuid references brands(id) on delete cascade,
  title text not null,
  primary_keyword text,
  secondary_keywords text[] default '{}',
  intent text,
  funnel_stage text,
  content_type text,
  status text default 'idea'
);

create table if not exists content_pieces (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  content_type text not null default 'blog_seo',
  status text not null default 'idea',
  title text,
  target_keyword text,
  secondary_keywords text[] default '{}',
  due_date date,
  word_count_target int default 1500,
  cta_type text,
  final_url text,
  published_at timestamptz,
  last_refresh_at timestamptz,
  notes text,
  qa_score_latest numeric,
  created_at timestamptz default now()
);
create index on content_pieces(brand_id);
create index on content_pieces(status);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references content_pieces(id) on delete cascade,
  kind text not null, -- brief | outline | draft | meta | qa | links
  version int not null default 1,
  content_json jsonb,
  content_md text,
  model text,
  created_at timestamptz default now()
);
create index on artifacts(piece_id);

create table if not exists qa_reports (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references content_pieces(id) on delete cascade,
  artifact_id uuid references artifacts(id) on delete set null,
  scores_json jsonb,
  overall numeric,
  verdict text,
  revision_notes jsonb,
  created_at timestamptz default now()
);

create table if not exists refresh_candidates (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references content_pieces(id) on delete cascade,
  reasons text[] default '{}',
  priority int default 3,
  detected_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists prompt_runs (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references content_pieces(id) on delete set null,
  route text,
  model text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  cost_cents numeric,
  created_at timestamptz default now()
);

-- RLS
alter table workspaces enable row level security;
alter table brands enable row level security;
alter table brand_samples enable row level security;
alter table brand_urls enable row level security;
alter table content_pieces enable row level security;
alter table artifacts enable row level security;
alter table qa_reports enable row level security;
alter table topics enable row level security;
alter table topic_clusters enable row level security;

create policy "own workspaces" on workspaces for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "brands in own workspaces" on brands for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- helper policy pattern for child tables
create policy "brand children" on brand_samples for all
  using (brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "brand urls" on brand_urls for all
  using (brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "pieces" on content_pieces for all
  using (brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "artifacts" on artifacts for all
  using (piece_id in (select id from content_pieces where brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid()))));
create policy "qa" on qa_reports for all
  using (piece_id in (select id from content_pieces where brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid()))));
create policy "topics" on topics for all
  using (brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "clusters" on topic_clusters for all
  using (brand_id in (select id from brands where workspace_id in (select id from workspaces where owner_id = auth.uid())));
