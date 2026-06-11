// One-off parser: extract players from the FIFA squad-list text dump
// (SquadLists-English.txt) into db/players.csv for db/seed_players.mjs.
//
//   node db/parse_squads.mjs
//
// Each team block looks like:
//   Algeria (ALG)
//   # POS PLAYER NAME FIRST NAME(S) LAST NAME(S) NAME ON SHIRT DOB CLUB ...
//   GK MASTIL Melvin  Melvin Feycal  MASTIL  MASTIL  19/02/2000  FC ... 194 2 0
//   ...
// Columns are whitespace-separated and names span several columns, so we
// anchor on the position token (GK/DF/MF/FW) at the start and the DOB
// (dd/mm/yyyy) to find where the name columns end. The "PLAYER NAME" column
// is "SURNAME(S) Given" — we rebuild it as natural "Given Surname".

import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../SquadLists-English.txt", import.meta.url);
const OUT = new URL("./players.csv", import.meta.url);
const OUT_SQL = new URL("./players_seed.sql", import.meta.url);

// TLA -> our canonical [code, name] (must match matches.home_code / away_code).
const TEAM_BY_TLA = {
  MEX:["mx","Mexico"], KOR:["kr","South Korea"], RSA:["za","South Africa"], CZE:["cz","Czechia"],
  CAN:["ca","Canada"], SUI:["ch","Switzerland"], QAT:["qa","Qatar"], BIH:["ba","Bosnia & Herz."],
  BRA:["br","Brazil"], MAR:["ma","Morocco"], SCO:["gb-sct","Scotland"], HAI:["ht","Haiti"],
  USA:["us","USA"], AUS:["au","Australia"], PAR:["py","Paraguay"], TUR:["tr","Türkiye"],
  GER:["de","Germany"], ECU:["ec","Ecuador"], CIV:["ci","Côte d'Ivoire"], CUW:["cw","Curaçao"],
  NED:["nl","Netherlands"], JPN:["jp","Japan"], TUN:["tn","Tunisia"], SWE:["se","Sweden"],
  BEL:["be","Belgium"], IRN:["ir","Iran"], EGY:["eg","Egypt"], NZL:["nz","New Zealand"],
  ESP:["es","Spain"], URU:["uy","Uruguay"], KSA:["sa","Saudi Arabia"], CPV:["cv","Cape Verde"],
  FRA:["fr","France"], SEN:["sn","Senegal"], NOR:["no","Norway"], IRQ:["iq","Iraq"],
  ARG:["ar","Argentina"], AUT:["at","Austria"], ALG:["dz","Algeria"], JOR:["jo","Jordan"],
  POR:["pt","Portugal"], COL:["co","Colombia"], UZB:["uz","Uzbekistan"], COD:["cd","DR Congo"],
  ENG:["gb-eng","England"], CRO:["hr","Croatia"], PAN:["pa","Panama"], GHA:["gh","Ghana"],
};

const POS_MAP = { GK: "Goalkeeper", DF: "Defender", MF: "Midfielder", FW: "Forward" };
const COUNTRY_RE = /^(.+?)\s+\(([A-Z]{3})\)\s*$/;
const PLAYER_RE  = /^(GK|DF|MF|FW)\s+(.*\S)\s*$/;
const DOB_RE     = /\b\d{2}\/\d{2}\/\d{4}\b/;

const isUpperToken = t => /[A-Za-zÀ-ÿ]/.test(t) && t === t.toUpperCase();
// A "given name" token is Title-case in every hyphen/apostrophe segment
// (e.g. "Angus", "Nico", "Jean-Philippe"). Surname tokens are all-caps
// ("ROBERTSON"), Mc-style ("McTOMINAY") or particles ("DE") — none qualify.
const isTitleSeg = s => /^[A-ZÀ-Þ][a-zà-ÿ.]+$/.test(s);
const isGivenToken = t => t.split(/[-'’]/).every(isTitleSeg);
const titleWord = w => {
  const t = w.split(/([-'’])/).map(p =>
    (p === "-" || p === "'" || p === "’") ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ).join("");
  return /^Mc./.test(t) ? "Mc" + t.charAt(2).toUpperCase() + t.slice(3) : t; // McTominay
};
const titleCase = s => s.split(/\s+/).map(titleWord).join(" ");

const text = readFileSync(SRC, "utf8");
const lines = text.split(/\r?\n/);

const rows = [];           // { team, name, position }
const seen = new Set();     // team|name dedupe
let tla = null;

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  const country = COUNTRY_RE.exec(line);
  // A country header is short and has no DOB / digits trailing like a player row.
  if (country && !PLAYER_RE.test(line) && !DOB_RE.test(line)) {
    tla = country[2];
    continue;
  }

  const pm = PLAYER_RE.exec(line);
  if (!pm || !tla) continue;

  const position = POS_MAP[pm[1]];
  const rest = pm[2];
  const dob = DOB_RE.exec(rest);
  if (!dob) continue;                         // not a real player row
  const namesPart = rest.slice(0, dob.index).trim();
  const tokens = namesPart.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) continue;

  // Leading tokens up to the first Title-case token = surname; that token = given.
  let i = 0;
  const surname = [];
  while (i < tokens.length && !isGivenToken(tokens[i])) surname.push(tokens[i++]);
  const given = tokens[i] ?? "";
  if (!surname.length || !given) continue;

  const name = `${titleWord(given)} ${titleCase(surname.join(" "))}`.trim();
  const key = `${tla}|${name.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  rows.push({ team: tla, name, position });
}

const esc = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
const csv = ["team,name,position,number",
  ...rows.map(r => [r.team, r.name, r.position, ""].map(esc).join(","))].join("\n");
writeFileSync(OUT, csv + "\n", "utf8");

// SQL seed (run in the Supabase SQL editor — bypasses RLS, no service key needed).
const sq = s => `'${String(s).replace(/'/g, "''")}'`;
const mapped = rows.map(r => ({ ...r, t: TEAM_BY_TLA[r.team] })).filter(r => r.t);
const unmapped = [...new Set(rows.filter(r => !TEAM_BY_TLA[r.team]).map(r => r.team))];
const values = mapped.map(r => `  (${sq(r.t[0])}, ${sq(r.t[1])}, ${sq(r.name)}, ${sq(r.position)})`);
const CHUNK = 250;
const stmts = [];
for (let i = 0; i < values.length; i += CHUNK) {
  stmts.push(
    "insert into public.players (team_code, team_name, name, position) values\n" +
    values.slice(i, i + CHUNK).join(",\n") +
    "\non conflict (team_code, name) do nothing;"
  );
}
const sql =
`-- Player roster seed — generated by db/parse_squads.mjs from SquadLists-English.txt.
-- Run in the Supabase SQL editor (requires db/features.sql to have created the table).
-- Idempotent: re-running skips existing (team_code, name) rows.

${stmts.join("\n\n")}
`;
writeFileSync(OUT_SQL, sql, "utf8");

const byTeam = rows.reduce((m, r) => (m[r.team] = (m[r.team] || 0) + 1, m), {});
console.log(`Parsed ${rows.length} players across ${Object.keys(byTeam).length} teams.`);
console.log("Per team:", Object.entries(byTeam).map(([t, n]) => `${t}:${n}`).join("  "));
if (unmapped.length) console.warn("⚠ Unmapped TLAs (excluded from SQL):", unmapped.join(", "));
console.log(`Wrote ${OUT.pathname}`);
console.log(`Wrote ${OUT_SQL.pathname} (${mapped.length} rows)`);
