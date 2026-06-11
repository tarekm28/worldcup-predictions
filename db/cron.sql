-- ============================================================
-- Schedule the sync-matches Edge Function with pg_cron + pg_net.
-- Run this in the Supabase SQL editor AFTER deploying the function.
--
-- Source API (worldcup26.ir) needs no key, and no CRON_SECRET is set on the
-- function, so this file runs as-is. (If you later set a CRON_SECRET secret,
-- add  'x-cron-secret', '<value>'  back into the headers below.)
--
--   project ref : already filled (dojlxfoyvvunjocjjddd) — change if different.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Clean up the job if you re-run this file.
select cron.unschedule('wc-sync') where exists
  (select 1 from cron.job where jobname = 'wc-sync');

-- Fixtures + live results + knockout: every 5 minutes.
-- (Bump to '*/1 * * * *' during live matches if you want faster updates.)
select cron.schedule(
  'wc-sync',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://dojlxfoyvvunjocjjddd.functions.supabase.co/sync-matches',
    headers := jsonb_build_object('content-type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

-- ----------------------------------------------------------------
-- VERIFY the autosync is working (run these any time after scheduling):
--
-- 1) Job exists and is active:
--      select jobid, schedule, active from cron.job where jobname = 'wc-sync';
-- 2) Recent cron runs (status should be 'succeeded'):
--      select status, return_message, start_time
--        from cron.job_run_details
--        where jobid = (select jobid from cron.job where jobname = 'wc-sync')
--        order by start_time desc limit 10;
-- 3) What the function itself logged each run (a new row every ~5 min):
--      select ran_at, ok, fixtures, message from public.sync_log order by ran_at desc limit 10;
-- 4) Freshness of the data — newest sync should be within the last few minutes:
--      select max(synced_at) as last_synced, now() - max(synced_at) as age from public.matches;
