-- Reactions feature REMOVED. Run this in the Supabase SQL editor to drop the
-- table and take it off realtime. (Safe to run more than once.)

-- Drop the table off realtime first (ignore if it isn't published).
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reactions'
  ) then
    execute 'alter publication supabase_realtime drop table public.reactions';
  end if;
end $$;

drop table if exists public.reactions cascade;

-- ----------------------------------------------------------------------------
-- Realtime: keep the tables the app still subscribes to (idempotent).
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['matches','predictions','profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
