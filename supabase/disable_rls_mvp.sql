-- MVP single-user mode: disable RLS so anon key can read/write.
-- ONLY run this if you don't want to add SUPABASE_SERVICE_ROLE_KEY.
-- Re-enable RLS later when you add real multi-user auth.

alter table workspaces disable row level security;
alter table brands disable row level security;
alter table brand_samples disable row level security;
alter table brand_urls disable row level security;
alter table brand_competitors disable row level security;
alter table topic_clusters disable row level security;
alter table topics disable row level security;
alter table content_pieces disable row level security;
alter table artifacts disable row level security;
alter table qa_reports disable row level security;
alter table refresh_candidates disable row level security;
alter table prompt_runs disable row level security;

-- Also drop the NOT-NULL-like constraint that requires owner_id on workspaces
-- (we use a single default workspace in MVP mode)
alter table workspaces alter column owner_id drop not null;
