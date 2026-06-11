-- ============================================================
-- World Cup 2026 — schema for live API sync (worldcup26.ir)
-- Adds the columns the sync-matches Edge Function writes to.
-- Idempotent: safe to run multiple times.
-- (odds columns are kept for a future odds provider; currently unused.)
-- ============================================================

alter table public.matches
  add column if not exists api_fixture_id bigint,
  add column if not exists round          text,
  add column if not exists home_logo      text,
  add column if not exists away_logo      text,
  add column if not exists status_detail  text,   -- raw API short status (NS, 1H, FT, ...)
  add column if not exists synced_at       timestamptz;

-- odds columns the frontend already reads (no-op if they exist)
alter table public.matches
  add column if not exists home_win_odds numeric,
  add column if not exists draw_odds     numeric,
  add column if not exists away_win_odds numeric;

-- One real fixture == one row. The Edge Function upserts on this.
create unique index if not exists matches_api_fixture_id_key
  on public.matches (api_fixture_id)
  where api_fixture_id is not null;

-- Lightweight audit of each sync run (optional but handy for debugging).
create table if not exists public.sync_log (
  id          bigint generated always as identity primary key,
  ran_at      timestamptz not null default now(),
  mode        text,
  fixtures    int,
  odds        int,
  ok          boolean,
  message     text
);

-- Let signed-in clients read the sync log (e.g. show "last updated" in UI).
alter table public.sync_log enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='sync_log' and policyname='sync_log_read'
  ) then
    create policy sync_log_read on public.sync_log
      for select to authenticated using (true);
  end if;
end$$;

-- ------------------------------------------------------------
-- Grants. The sync-matches Edge Function runs as `service_role`, which
-- bypasses RLS but still needs table privileges. The existing setup only
-- granted `authenticated`, so the function got "permission denied".
-- ------------------------------------------------------------
grant select, insert, update, delete on public.matches  to service_role;
grant select, insert                 on public.sync_log  to service_role, authenticated;
grant usage, select on all sequences in schema public to service_role;

