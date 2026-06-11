// Generates db/seed_group_stage.sql — the 72 official 2026 group-stage fixtures.
// Mirrors the draw + calendar logic in src/pool/ThePool.tsx.
import { writeFileSync } from "node:fs";

const GROUPS = {
  A:[["Mexico","mx"],["South Korea","kr"],["South Africa","za"],["Czechia","cz"]],
  B:[["Canada","ca"],["Switzerland","ch"],["Qatar","qa"],["Bosnia & Herz.","ba"]],
  C:[["Brazil","br"],["Morocco","ma"],["Scotland","gb-sct"],["Haiti","ht"]],
  D:[["USA","us"],["Australia","au"],["Paraguay","py"],["Türkiye","tr"]],
  E:[["Germany","de"],["Ecuador","ec"],["Côte d'Ivoire","ci"],["Curaçao","cw"]],
  F:[["Netherlands","nl"],["Japan","jp"],["Tunisia","tn"],["Sweden","se"]],
  G:[["Belgium","be"],["Iran","ir"],["Egypt","eg"],["New Zealand","nz"]],
  H:[["Spain","es"],["Uruguay","uy"],["Saudi Arabia","sa"],["Cape Verde","cv"]],
  I:[["France","fr"],["Senegal","sn"],["Norway","no"],["Iraq","iq"]],
  J:[["Argentina","ar"],["Austria","at"],["Algeria","dz"],["Jordan","jo"]],
  K:[["Portugal","pt"],["Colombia","co"],["Uzbekistan","uz"],["DR Congo","cd"]],
  L:[["England","gb-eng"],["Croatia","hr"],["Panama","pa"],["Ghana","gh"]],
};
const GROUP_KEYS = Object.keys(GROUPS);
const RR = [[[0,2],[1,3]],[[0,1],[2,3]],[[0,3],[1,2]]]; // MD1, MD2, MD3 pairings
const matchDay = (gi,md)=> md*6 + Math.floor(gi/2);     // day index from Jun 11 2026
const KICK_HOURS = [12,15,18,21];                        // stagger up to 4 matches/day (UTC)

const esc = s => s.replace(/'/g,"''");
const perDay = {};
const rows = [];

GROUP_KEYS.forEach((g,gi)=>{
  RR.forEach((day,mdIdx)=>day.forEach(([hi,ai])=>{
    const [hName,hCode] = GROUPS[g][hi];
    const [aName,aCode] = GROUPS[g][ai];
    const dayIdx = matchDay(gi,mdIdx);
    const n = perDay[dayIdx] = (perDay[dayIdx] ?? 0);
    perDay[dayIdx] = n + 1;
    const d = new Date(Date.UTC(2026,5,11+dayIdx, KICK_HOURS[n % KICK_HOURS.length], 0, 0));
    const ext = `${g}-${mdIdx+1}-${hCode}-${aCode}`;
    rows.push(
      `  ('${ext}','${esc(hName)}','${esc(aName)}','${hCode}','${aCode}','${g}',${mdIdx+1},'group','${d.toISOString()}')`
    );
  }));
});

const sql = `-- ============================================================
-- World Cup 2026 — schema extension + group-stage fixtures
-- Idempotent: safe to run multiple times (upsert on external_id).
-- ============================================================

alter table public.matches
  add column if not exists group_code text,
  add column if not exists matchday   int,
  add column if not exists stage      text default 'group',
  add column if not exists home_code  text,
  add column if not exists away_code  text;

insert into public.matches
  (external_id, home_team, away_team, home_code, away_code, group_code, matchday, stage, kickoff_time)
values
${rows.join(",\n")}
on conflict (external_id) do update set
  home_team    = excluded.home_team,
  away_team    = excluded.away_team,
  home_code    = excluded.home_code,
  away_code    = excluded.away_code,
  group_code   = excluded.group_code,
  matchday     = excluded.matchday,
  stage        = excluded.stage,
  kickoff_time = excluded.kickoff_time;
`;

writeFileSync(new URL("./seed_group_stage.sql", import.meta.url), sql);
console.log(`Wrote ${rows.length} fixtures to db/seed_group_stage.sql`);
