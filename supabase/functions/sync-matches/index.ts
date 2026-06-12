// supabase/functions/sync-matches/index.ts
//
// Syncs FIFA World Cup 2026 fixtures, live scores, and the knockout bracket
// from the free, no-key worldcup26.ir API into the public.matches table.
//
// The browser never calls worldcup26.ir directly — this runs server-side and
// writes to Supabase, so the UI just reads public.matches (with realtime) and
// updates automatically. No API key/secret is required by the upstream API.
//
// Why server-side: avoids CORS, lets us cache in our DB (the UI keeps working
// if the upstream is briefly down), and lets us MATCH real fixtures onto the
// existing rows by country code so users' predictions are preserved.
//
// Edge Function secrets (set with `supabase secrets set ...`):
//   SUPABASE_URL                (auto-populated in deployed functions)
//   SUPABASE_SERVICE_ROLE_KEY   (auto-populated in deployed functions)
// Optional:
//   CRON_SECRET                 if set, callers must send x-cron-secret header
//   WC_API_BASE                 default https://worldcup26.ir (set to your self-host)
//   KICKOFF_TZ_OFFSET_MIN       fallback offset (minutes) for a venue we don't
//                               recognise (default -240 = US Eastern in summer).
//                               Each known stadium uses its own offset below.
//
// Timezones: the API's local_date is the *stadium's* wall-clock time. The 16
// venues span four zones, so we convert each to the correct UTC instant using a
// per-stadium offset (the whole tournament, Jun–Jul 2026, is within DST). The
// browser then renders that instant in each user's own local timezone.
//
// Invoke:  POST /functions/v1/sync-matches   (header x-cron-secret if configured)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Game = {
  id: string;
  home_team_id: string; away_team_id: string;
  home_score: string; away_score: string;
  group: string; matchday: string;
  local_date: string; stadium_id?: string;
  finished: string; time_elapsed: string; type: string;
  home_scorers?: string; away_scorers?: string;
  home_team_name_en?: string; away_team_name_en?: string;
  home_team_label?: string; away_team_label?: string;
};

// API sends the literal string "null" (or empty) when there are no scorers yet.
const scorersOf = (s?: string) => {
  const v = (s ?? "").trim();
  return (v === "" || v.toLowerCase() === "null") ? null : v;
};
type Team = { id: string; name_en: string; iso2: string; flag: string };

// "group" -> 'group'; r32/r16/qf/sf/third/final -> 'ko'.
const STAGE_FOR = (type: string) => (type === "group" ? "group" : "ko");

const ROUND_LABEL: Record<string, string> = {
  r32: "Round of 32", r16: "Round of 16", qf: "Quarter-final",
  sf: "Semi-final", third: "Third place", final: "Final",
};
function roundLabel(g: Game) {
  if (g.type === "group") return `Group ${g.group} · MD${g.matchday}`;
  return ROUND_LABEL[g.type] ?? g.group;
}

// finished/time_elapsed -> coarse status the UI understands.
function isFinishedFlag(finished: string): boolean {
  return String(finished).trim().toLowerCase() === "true" || String(finished).trim() === "1";
}
function timeElapsedIndicatesFinished(elapsed?: string): boolean {
  const t = String(elapsed ?? "").trim().toLowerCase();
  if (!t) return false;
  return /^(ft|full(\s*time)?|finished|ended|aet|after extra time|penalties?)$/i.test(t);
}
function statusFor(g: Game): "open" | "live" | "finished" {
  if (isFinishedFlag(g.finished) || timeElapsedIndicatesFinished(g.time_elapsed)) return "finished";
  const t = (g.time_elapsed ?? "").toLowerCase();
  if (t && t !== "notstarted") return "live";
  return "open";
}

// Failsafe: some feeds leave a game on "live" (or even "notstarted") long
// after full time. If the API reports a started game whose kickoff was more
// than 4 hours ago, treat it as finished so points can be settled.
const FINISH_AFTER_MS = 4 * 60 * 60 * 1000;
function effectiveStatus(
  status: "open" | "live" | "finished",
  kickoffIso: string | null,
): "open" | "live" | "finished" {
  if (status !== "live" || !kickoffIso) return status;
  const ko = Date.parse(kickoffIso);
  if (Number.isFinite(ko) && Date.now() - ko > FINISH_AFTER_MS) return "finished";
  return status;
}

// UTC offset (minutes) of each 2026 host stadium during the tournament window
// (Jun 11 – Jul 19 2026 — all US/Canada venues are in DST; Mexico has no DST).
//  -240 Eastern (EDT) · -300 Central (CDT) · -360 Mexico (CST) · -420 Pacific (PDT)
const STADIUM_TZ_OFFSET: Record<string, number> = {
  "1": -360, // Estadio Azteca, Mexico City
  "2": -360, // Estadio Akron, Guadalajara
  "3": -360, // Estadio BBVA, Monterrey
  "4": -300, // AT&T Stadium, Dallas
  "5": -300, // NRG Stadium, Houston
  "6": -300, // Arrowhead, Kansas City
  "7": -240, // Mercedes-Benz, Atlanta
  "8": -240, // Hard Rock, Miami
  "9": -240, // Gillette, Boston
  "10": -240, // Lincoln Financial, Philadelphia
  "11": -240, // MetLife, New York/New Jersey
  "12": -240, // BMO Field, Toronto
  "13": -420, // BC Place, Vancouver
  "14": -420, // Lumen Field, Seattle
  "15": -420, // Levi's, San Francisco Bay Area
  "16": -420, // SoFi, Los Angeles
};

// "MM/DD/YYYY HH:mm" (no tz) -> ISO UTC, interpreting it in offsetMin timezone.
function toIso(localDate: string, offsetMin: number): string | null {
  const m = localDate?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, mm, dd, yyyy, HH, MM] = m;
  // Date.UTC treats the parts as UTC; shift by the source tz offset to get real UTC.
  const pseudo = Date.UTC(+yyyy, +mm - 1, +dd, +HH, +MM);
  return new Date(pseudo - offsetMin * 60000).toISOString();
}

const numOrNull = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "content-type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: "missing SUPABASE_URL / SERVICE_ROLE_KEY" }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
  const base = (Deno.env.get("WC_API_BASE") ?? "https://worldcup26.ir").replace(/\/$/, "");
  const fallbackOffset = Number(Deno.env.get("KICKOFF_TZ_OFFSET_MIN") ?? "-240");
  // Per-stadium offset, falling back to the env default for any unknown venue.
  const offsetFor = (stadiumId?: string) =>
    STADIUM_TZ_OFFSET[String(stadiumId)] ?? fallbackOffset;
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  let updated = 0, inserted = 0;
  const rowErrors: string[] = [];
  try {
    const [teamsJson, gamesJson] = await Promise.all([
      fetchJson(`${base}/get/teams`),
      fetchJson(`${base}/get/games`),
    ]);
    const teamArr: Team[] = teamsJson.teams ?? teamsJson;
    const games: Game[] = gamesJson.games ?? gamesJson;

    const teamById: Record<string, Team> = {};
    for (const t of teamArr) teamById[String(t.id)] = t;
    // worldcup26.ir uses football codes (SCO/ENG/WAL) for the home nations;
    // map them to the codes our flag set + seed use.
    const CODE_FIX: Record<string, string> = {
      sco: "gb-sct", eng: "gb-eng", wal: "gb-wls", nir: "gb-nir",
    };
    const codeOf = (id: string) => {
      const c = (teamById[id]?.iso2 ?? "").toLowerCase();
      return CODE_FIX[c] ?? c;
    };
    const flagOf = (id: string) => teamById[id]?.flag ?? null;

    // Remove any group rows previously mis-inserted as duplicates (external_id
    // wc26-*). Our seed owns every group fixture (external_id like 'A-1-..'),
    // so a wc26 group row only exists from an earlier failed match.
    await db.from("matches").delete().eq("stage", "group").like("external_id", "wc26-%");

    // Existing rows let us match real fixtures onto current rows (preserving
    // predictions) instead of creating duplicates.
    const { data: existing, error: exErr } = await db
      .from("matches")
      .select("id,group_code,matchday,home_code,away_code,stage,api_fixture_id");
    if (exErr) throw new Error(`select matches: ${exErr.message}`);

    // Key group rows by group|<sorted code pair> (a pair plays exactly once per
    // group), so neither home/away order nor matchday assignment matters.
    const keyOf = (group: string | null, a: string, b: string) =>
      `${group}|${[a, b].sort().join("-")}`;
    const existingByKey: Record<string, any> = {};
    const existingByApiId: Record<string, any> = {};
    for (const r of existing ?? []) {
      if (r.stage === "group" && r.group_code) {
        existingByKey[keyOf(r.group_code, r.home_code ?? "", r.away_code ?? "")] = r;
      }
      if (r.stage === "group" && r.api_fixture_id != null) {
        existingByApiId[String(r.api_fixture_id)] = r;
      }
    }

    const inserts: any[] = [];
    const updates: Promise<any>[] = [];

    for (const g of games) {
      const stage = STAGE_FOR(g.type);
      const kickoff = toIso(g.local_date, offsetFor(g.stadium_id));
      const status = effectiveStatus(statusFor(g), kickoff);
      const started = status !== "open";
      const round = roundLabel(g);
      const apiId = numOrNull(g.id);

      if (stage === "group") {
        const hCode = codeOf(g.home_team_id);
        const aCode = codeOf(g.away_team_id);
        const md = numOrNull(g.matchday);
        const key = keyOf(g.group, hCode, aCode);
        // Match by group+code pair first; fall back to the api_fixture_id
        // stored on a previous successful sync (covers the API renaming a
        // team or changing its iso2 code mid-tournament).
        const row = existingByKey[key] ?? (apiId != null ? existingByApiId[String(apiId)] : undefined);

        // Scores only once the match has started; otherwise leave null so the
        // UI keeps showing users' predictions.
        const hScore = started ? numOrNull(g.home_score) : null;
        const aScore = started ? numOrNull(g.away_score) : null;
        const hScorers = started ? scorersOf(g.home_scorers) : null;
        const aScorers = started ? scorersOf(g.away_scorers) : null;

        if (row) {
          // Preserve the existing home/away orientation (and thus predictions);
          // flip the API scores/logos only when we positively detect the API
          // lists the pair the other way round.
          const sameOrientation = (row.away_code ?? "") !== hCode;
          updates.push(
            db.from("matches").update({
              api_fixture_id: apiId,
              round,
              kickoff_time: kickoff,
              status,
              status_detail: g.time_elapsed ?? null,
              home_score: sameOrientation ? hScore : aScore,
              away_score: sameOrientation ? aScore : hScore,
              home_scorers: sameOrientation ? hScorers : aScorers,
              away_scorers: sameOrientation ? aScorers : hScorers,
              home_logo: sameOrientation ? flagOf(g.home_team_id) : flagOf(g.away_team_id),
              away_logo: sameOrientation ? flagOf(g.away_team_id) : flagOf(g.home_team_id),
              synced_at: new Date().toISOString(),
            }).eq("id", row.id).then((r: any) => {
              if (!r.error) updated++;
              else rowErrors.push(`row ${row.id} (game ${g.id}): ${r.error.message}`);
              return r;
            }),
          );
        } else {
          inserts.push({
            api_fixture_id: apiId,
            external_id: `wc26-${g.id}`,
            home_team: g.home_team_name_en ?? "TBD",
            away_team: g.away_team_name_en ?? "TBD",
            home_code: hCode, away_code: aCode,
            home_logo: flagOf(g.home_team_id), away_logo: flagOf(g.away_team_id),
            group_code: g.group, matchday: md, stage: "group", round,
            kickoff_time: kickoff, status, status_detail: g.time_elapsed ?? null,
            home_score: hScore, away_score: aScore,
            home_scorers: hScorers, away_scorers: aScorers,
            synced_at: new Date().toISOString(),
          });
        }
      } else {
        // Knockout: teams are often TBD (id 0) — fall back to the label text.
        const hasHome = g.home_team_id !== "0" && teamById[g.home_team_id];
        const hasAway = g.away_team_id !== "0" && teamById[g.away_team_id];
        inserts.push({
          api_fixture_id: apiId,
          external_id: `wc26-${g.id}`,
          home_team: hasHome ? teamById[g.home_team_id].name_en : (g.home_team_label ?? "TBD"),
          away_team: hasAway ? teamById[g.away_team_id].name_en : (g.away_team_label ?? "TBD"),
          home_code: hasHome ? codeOf(g.home_team_id) : "",
          away_code: hasAway ? codeOf(g.away_team_id) : "",
          home_logo: hasHome ? flagOf(g.home_team_id) : null,
          away_logo: hasAway ? flagOf(g.away_team_id) : null,
          group_code: null, matchday: numOrNull(g.matchday), stage: "ko", round,
          kickoff_time: kickoff, status,
          status_detail: g.time_elapsed ?? null,
          home_score: started ? numOrNull(g.home_score) : null,
          away_score: started ? numOrNull(g.away_score) : null,
          home_scorers: started ? scorersOf(g.home_scorers) : null,
          away_scorers: started ? scorersOf(g.away_scorers) : null,
          synced_at: new Date().toISOString(),
        });
      }
    }

    await Promise.all(updates);
    if (inserts.length) {
      // external_id has a real UNIQUE constraint (the seed relies on it);
      // api_fixture_id's index is partial and can't drive ON CONFLICT.
      const { error } = await db.from("matches").upsert(inserts, { onConflict: "external_id" });
      if (error) throw new Error(`upsert: ${error.message}`);
      inserted = inserts.length;
    }

    const errNote = rowErrors.length ? `; errors: ${rowErrors.join(" | ")}` : "";
    await db.from("sync_log").insert({
      mode: "all", fixtures: updated + inserted, odds: 0, ok: rowErrors.length === 0,
      message: `updated ${updated}, upserted ${inserted}${errNote}`,
    });
    return new Response(JSON.stringify({ ok: true, updated, upserted: inserted, errors: rowErrors }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.from("sync_log").insert({ mode: "all", fixtures: 0, odds: 0, ok: false, message });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
});
