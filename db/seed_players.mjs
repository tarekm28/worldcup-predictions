// Seed the `players` table from a CSV file.
//
// The worldcup26.ir API exposes NO squad/roster data, so player lists must be
// imported from an external source (Wikipedia squad tables, a Kaggle dataset,
// football-data.org, etc.). Drop a CSV at db/players.csv and run this script.
//
// CSV columns (header row required, order-independent):
//   team, name, position, number
// - `team`   may be our code (mx, gb-eng), a 3-letter code (MEX, ENG) or the
//            full country name ("Mexico", "England"). It is normalised below.
// - `name`   player full name (required).
// - `position` optional: Goalkeeper | Defender | Midfielder | Attacker.
// - `number` optional shirt number.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://dojlxfoyvvunjocjjddd.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key from dashboard>"
//   node db/seed_players.mjs
//
// The service_role key is required (RLS allows only service_role to write
// players). NEVER commit it — pass it via the environment as shown above.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

// Our canonical codes (must match matches.home_code / away_code).
// [name, code, TLA]
const TEAMS = [
  ["Mexico","mx","MEX"],["South Korea","kr","KOR"],["South Africa","za","RSA"],["Czechia","cz","CZE"],
  ["Canada","ca","CAN"],["Switzerland","ch","SUI"],["Qatar","qa","QAT"],["Bosnia & Herz.","ba","BIH"],
  ["Brazil","br","BRA"],["Morocco","ma","MAR"],["Scotland","gb-sct","SCO"],["Haiti","ht","HAI"],
  ["USA","us","USA"],["Australia","au","AUS"],["Paraguay","py","PAR"],["Türkiye","tr","TUR"],
  ["Germany","de","GER"],["Ecuador","ec","ECU"],["Côte d'Ivoire","ci","CIV"],["Curaçao","cw","CUW"],
  ["Netherlands","nl","NED"],["Japan","jp","JPN"],["Tunisia","tn","TUN"],["Sweden","se","SWE"],
  ["Belgium","be","BEL"],["Iran","ir","IRN"],["Egypt","eg","EGY"],["New Zealand","nz","NZL"],
  ["Spain","es","ESP"],["Uruguay","uy","URU"],["Saudi Arabia","sa","KSA"],["Cape Verde","cv","CPV"],
  ["France","fr","FRA"],["Senegal","sn","SEN"],["Norway","no","NOR"],["Iraq","iq","IRQ"],
  ["Argentina","ar","ARG"],["Austria","at","AUT"],["Algeria","dz","ALG"],["Jordan","jo","JOR"],
  ["Portugal","pt","POR"],["Colombia","co","COL"],["Uzbekistan","uz","UZB"],["DR Congo","cd","COD"],
  ["England","gb-eng","ENG"],["Croatia","hr","CRO"],["Panama","pa","PAN"],["Ghana","gh","GHA"],
];

const norm = s => (s ?? "").trim().toLowerCase();
const CODE_MAP = {};
const NAME_BY_CODE = {};
for (const [name, code, tla] of TEAMS) {
  NAME_BY_CODE[code] = name;
  CODE_MAP[norm(code)] = code;
  CODE_MAP[norm(tla)]  = code;
  CODE_MAP[norm(name)] = code;
}
// A few common aliases.
Object.assign(CODE_MAP, {
  "united states": "us", "usmnt": "us", "korea republic": "kr", "south korea": "kr",
  "turkey": "tr", "ivory coast": "ci", "cote d'ivoire": "ci", "dr congo": "cd",
  "democratic republic of the congo": "cd", "czech republic": "cz", "cabo verde": "cv",
  "bosnia and herzegovina": "ba", "bosnia": "ba", "curacao": "cw",
});

function resolveCode(raw) {
  return CODE_MAP[norm(raw)] ?? null;
}

// Minimal CSV parser (handles quoted fields and commas inside quotes).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

const csvPath = new URL("./players.csv", import.meta.url);
let raw;
try { raw = readFileSync(csvPath, "utf8"); }
catch { console.error(`Missing ${csvPath.pathname}. Create db/players.csv (see header docs).`); process.exit(1); }

const rows = parseCsv(raw);
const header = rows.shift().map(h => norm(h));
const col = n => header.indexOf(n);
const ci = { team: col("team"), name: col("name"), position: col("position"), number: col("number") };
if (ci.team < 0 || ci.name < 0) {
  console.error("CSV must have at least `team` and `name` columns.");
  process.exit(1);
}

const players = [];
const unmatched = new Set();
for (const r of rows) {
  const code = resolveCode(r[ci.team]);
  const name = (r[ci.name] || "").trim();
  if (!name) continue;
  if (!code) { unmatched.add(r[ci.team]); continue; }
  const numRaw = ci.number >= 0 ? parseInt(r[ci.number], 10) : NaN;
  players.push({
    team_code: code,
    team_name: NAME_BY_CODE[code],
    name,
    position: ci.position >= 0 ? (r[ci.position] || "").trim() || null : null,
    shirt_number: Number.isFinite(numRaw) ? numRaw : null,
  });
}

if (unmatched.size) {
  console.warn("⚠ Could not map these `team` values (rows skipped):", [...unmatched].join(", "));
}
if (!players.length) { console.error("No valid players parsed. Nothing to do."); process.exit(1); }

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Upsert in chunks on (team_code, name).
const CHUNK = 500;
let done = 0;
for (let i = 0; i < players.length; i += CHUNK) {
  const slice = players.slice(i, i + CHUNK);
  const { error } = await db.from("players").upsert(slice, { onConflict: "team_code,name" });
  if (error) { console.error("Upsert error:", error.message); process.exit(1); }
  done += slice.length;
  console.log(`Upserted ${done}/${players.length}`);
}
console.log(`✅ Done. ${players.length} players across ${new Set(players.map(p => p.team_code)).size} teams.`);
