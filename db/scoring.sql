-- ============================================================
-- Automatic scoring: when a match gets a real result, award points
-- to everyone who predicted it and roll the totals into profiles.
-- The leaderboard reads profiles.total_points (realtime) so it
-- updates the instant the sync writes a finished score.
--
-- Scoring: 5 = exact score · 3 = correct outcome · 0 = wrong.
-- A prediction flagged double_points counts x2.
--
-- Run this once in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- Base points for a single prediction vs the real result.
create or replace function public.score_pred(ph int, pa int, ah int, aa int)
returns int language sql immutable as $$
  select case
    when ph is null or pa is null or ah is null or aa is null then 0
    when ph = ah and pa = aa then 5
    when sign(ph - pa) = sign(ah - aa) then 3
    else 0
  end;
$$;

-- Recompute points for a set of users from scratch (idempotent — no
-- double counting even if a result is re-synced or corrected).
create or replace function public.recompute_points_for(uids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Per-prediction points: only finished matches with a real score count.
  update public.predictions pr
  set points_awarded = case
        when m.status = 'finished' and m.home_score is not null and m.away_score is not null
          then public.score_pred(pr.home_pred, pr.away_pred, m.home_score, m.away_score)
               * (case when pr.double_points then 2 else 1 end)
        else 0
      end
  from public.matches m
  where m.id = pr.match_id and pr.user_id = any(uids);

  -- Roll the per-prediction points up into each profile's total.
  update public.profiles p
  set total_points = coalesce(
    (select sum(pr.points_awarded) from public.predictions pr where pr.user_id = p.id), 0)
  where p.id = any(uids);
end;
$$;

-- Fired whenever a match's status or score changes. Recomputes only the
-- users who predicted that match.
create or replace function public.matches_score_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare uids uuid[];
begin
  select array_agg(distinct user_id) into uids
    from public.predictions where match_id = new.id;
  if uids is not null then
    perform public.recompute_points_for(uids);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_matches_score on public.matches;
create trigger trg_matches_score
  after insert or update of status, home_score, away_score on public.matches
  for each row execute function public.matches_score_trigger();

-- One-time backfill so existing predictions are scored against any results
-- already in the table.
select public.recompute_points_for(array(select id from public.profiles));

-- Make sure the leaderboard's realtime source is published (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
end $$;
