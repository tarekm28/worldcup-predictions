# Knockout-stage propagation — pickup guide

> **Status:** deferred until the group stage ends (real R32 pairings locked).
> **Goal:** make the knockout bracket behave like the group stage — show teams
> advancing based on **predicted** scores until a real result is synced, then
> **overwrite** with the real result and propagate the real winner forward
> (R32 → R16 → QF → SF → Final).

---

## 1. What already works today (don't rebuild)

- **Group standings** are computed from synced fixtures and driven by the
  viewer's predictions, with real results overriding. See
  `projResult` / `projectedStandings` in `src/pool/ThePool.tsx`.
- **Round of 32 seeding** is derived from those standings (group winners,
  runners-up, 8 best third-placed teams). See `projectedQualifiers` and
  `resolveR32`.
- So R32 *already* shows the right teams (predicted → real). The gap is
  **everything after R32**: later rounds render static template labels like
  `"Winner R32·1"` and never resolve to actual teams.

## 2. Why it's blocked right now

1. **KO matches aren't loaded into the app.** `LiveDataProvider.load()` (and the
   non-provider loader around line ~866) query:
   ```ts
   .from("matches")
     .eq("stage","group")
     .not("group_code","is",null)
   ```
   So `stage='ko'` rows the sync writes are never read by the UI.
2. **There is no knockout-prediction UI.** Users predict group fixtures only.
   For "predicted until real" to mean anything in the KO rounds, users need to
   be able to predict KO ties (or we auto-advance the higher seed as a default).
3. **No mapping** from a KO match row to its bracket slot, so we can't tell
   which tie a real result belongs to.

## 3. Backend facts to rely on

- `matches` table KO rows: `stage='ko'`, `external_id='wc26-{apiId}'`, plus
  `round` (text), `home_team/away_team`, `home_code/away_code`,
  `kickoff_time`, `status` (`open|live|finished`), `home_score/away_score`,
  `api_fixture_id`. The sync function (`supabase/functions/sync-matches/index.ts`)
  already **upserts KO rows by `external_id`**.
- Scoring trigger (`db/scoring.sql`) already recomputes points for **any**
  finished match with predictions — it is stage-agnostic, so KO predictions
  will score automatically once they exist. **No scoring change needed.**
- `predictions` table: `user_id, match_id, home_pred, away_pred, double_points,
  points_awarded`. KO predictions reuse the same table (keyed by `match_id`).

## 4. The bracket data shapes (in `src/pool/ThePool.tsx`)

- `KNOCKOUT` (≈ line 100): array of 5 rounds. R32 ties use slot labels
  `"Winner A"`, `"Runner-up B"`, `"3rd place"`. R16+ use `"Winner R32·1"`,
  `"Winner R16·3"`, etc. The `·N` index is the 1-based tie number of the
  previous round.
- `resolveR32(q)` (≈ line 323): turns R32 template slots into
  `{ label, team, from? }` using `q.winners/q.runners/q.thirds`.
- `LiveKnockout` (≈ line 1262): builds `q = projectedQualifiers(...)`,
  `r32 = resolveR32(q)`, splits each round in half and renders `BkCol`.
- `BkCol` (≈ line 556): renders a column of ties.

## 5. Step-by-step plan (do this after group stage)

### Step A — Load KO matches into the live layer
In **both** loaders (`LiveDataProvider.load()` ~line 354 and the second one
~line 866), add a second query for KO rows (or relax the filter and split in
JS). Recommended: keep group load as-is and add:
```ts
const { data: koRows } = await supabase
  .from("matches")
  .select("id,external_id,round,home_team,away_team,home_code,away_code,kickoff_time,status,home_score,away_score")
  .eq("stage","ko")
  .order("kickoff_time");
```
Map them into a `koMatches` array on the context value (mirror the existing
`actual:{h,a}`, `dbStatus`, `kickoffMs` shape used for group matches).

### Step B — Map each KO row to a bracket slot
The api `round` text (and kickoff order) identifies the round; within a round,
order by `kickoff_time` to get tie index 1..N. Build a lookup:
`bracketSlot = { "R32·1": matchRow, ... }`. Confirm the **real** R32 ordering
matches `KNOCKOUT[0].ties` order once FIFA publishes pairings — adjust the
template order if needed so `·N` lines up.

### Step C — Resolve winners (predicted → real), round by round
Write a `koWinner(matchRow, myPicks)` helper mirroring `projResult`:
```ts
function koResult(m, myPicks){
  if(m.dbStatus==="finished" && m.actual.h!=null && m.actual.a!=null)
    return { h:m.actual.h, a:m.actual.a, real:true };
  const p = myPicks?.[m.id];
  if(p && p.saved) return { h:p.h, a:p.a, real:false };
  return null;
}
```
Then `koWinner` returns the home/away team based on the result. **KO ties can't
draw** — if predicted scores are level, fall back to a tiebreak rule (e.g.
higher group seed advances, or require the user to pick a winner in the KO
prediction UI; see Step E).

### Step D — Propagate through the rounds
Replace the static `R16/QF/SF/Final` template resolution with a function that
walks rounds in order:
1. `r32resolved = resolveR32(q)` (already real→predicted via groups).
2. For each subsequent round, each tie's two slots = winners of the two feeding
   ties from the previous **resolved** round, where the winner is:
   - the **real** KO result if that KO match is finished, else
   - the **predicted** winner (from KO prediction, or default seed).
3. Carry `{ team, real:boolean }` so the UI can style real vs projected
   (reuse the existing violet "projected" vs solid "real" treatment).

### Step E — Knockout prediction UI (needed for true "predicted until real")
Without KO predictions, later rounds can only auto-advance a default (e.g.
higher seed). To match the group-stage feel:
- Add a KO predictions surface (reuse the fixture card / score stepper) that
  writes to `predictions` keyed by the KO `match_id`.
- Require a winner when a KO prediction is level (no draws in knockouts).
- Scoring already handles these rows via `db/scoring.sql` (no change).

### Step F — Realtime + verify
- Realtime is already subscribed to `matches` + `predictions`, so KO updates
  will refresh once Step A loads them.
- Verify by syncing a real KO result (or simulate via SQL editor):
  `update public.matches set status='finished', home_score=2, away_score=1 where external_id='wc26-<id>';`
  Confirm the bracket advances the real winner and downstream ties update.

## 6. Acceptance checklist
- [ ] KO matches load into the live context.
- [ ] R32 slots map 1:1 to real KO match rows.
- [ ] Bracket shows projected winners (from predictions/seed) before results.
- [ ] A synced real KO result overrides the projection and advances the real
      winner through all downstream rounds.
- [ ] KO predictions score into `profiles.total_points` (already wired).
- [ ] Projected vs real styling is visually distinct (violet vs solid).

## 7. Key file references
- `src/pool/ThePool.tsx`: `KNOCKOUT` (~100), `resolveR32` (~323),
  `projectedQualifiers` (~313), `projResult`/`projectedStandings` (~288/295),
  `BkCol` (~556), loaders (~354 and ~866), `LiveKnockout` (~1262).
- `supabase/functions/sync-matches/index.ts`: KO upsert by `external_id='wc26-{id}'`.
- `db/scoring.sql`: stage-agnostic scoring trigger (no change needed).
