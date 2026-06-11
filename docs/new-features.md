# New features — setup & operations

Three features were added: **Matchday Scorer Pick**, **Tournament Predictions**, and a
**players** roster table (groundwork for player-based scoring + a future rankings view).

## 1. Run the migration (once)

In the Supabase SQL editor, run [`db/features.sql`](./features.sql). It is idempotent.
It creates `players`, `matchday_scorer_picks`, `tournament_predictions`,
`tournament_results`, adds `home_scorers`/`away_scorers` to `matches`, and
**redefines `recompute_points_for()` to be holistic** so bonus points are never
overwritten by a group-stage recompute:

```
total_points = group-prediction pts + scorer-pick pts + tournament-award pts
```

> Run `db/features.sql` *after* `db/scoring.sql` — it intentionally supersedes the
> `recompute_points_for()` defined there.

## 2. Redeploy the sync function

The sync function now stores goalscorers:

```powershell
npx supabase functions deploy sync-matches
```

> The worldcup26.ir game payload includes `home_scorers` / `away_scorers`, but the
> format is unknown until the first match finishes (currently the literal string
> `"null"`). The scorer-pick trigger matches a player by lowercased substring
> (`ILIKE '%name%'`). Tighten `score_scorer_picks_for_match()` once a real payload is seen.

## 3. Seed players (no roster API available)

There is **no** squad endpoint, so import rosters from an external source.
Create `db/players.csv` with a header row:

```csv
team,name,position,number
ENG,Harry Kane,Attacker,9
br,Vinicius Junior,Attacker,7
Argentina,Lionel Messi,Attacker,10
```

`team` accepts our code (`mx`, `gb-eng`), a 3-letter code (`MEX`, `ENG`), or the full
country name. Then:

```powershell
$env:SUPABASE_URL="https://dojlxfoyvvunjocjjddd.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
node db/seed_players.mjs
```

> If you have the official FIFA squad-list text dump (`SquadLists-English.txt` in the
> repo root), `node db/parse_squads.mjs` regenerates `db/players.csv` automatically
> (1248 players, all 48 teams). Run it before the seeder.
>
> **Easiest path (no service key):** that parser also writes `db/players_seed.sql`.
> Just run it in the Supabase SQL editor (like `features.sql`) — it bypasses RLS,
> is idempotent, and skips the Node seeder entirely.

Until players are seeded, both features still work: pickers fall back to free-text
input and the player name is stored denormalised, so scoring resolves automatically.

## 4. Scoring & locking

- **Scorer pick (+5):** resolved automatically by the `trg_score_scorer_picks`
  trigger when a match becomes `finished` with scorer text.
- **Tournament awards:** set the answers, then score manually:
  ```sql
  update public.tournament_results
  set wc_winner_code='ar', top_scorer_name='Lionel Messi',
      golden_ball_name='Lionel Messi', golden_glove_name='Emiliano Martinez'
  where id=1;
  select public.score_tournament_predictions();
  ```
  Points: WC winner **15**, top scorer / golden ball / golden glove **10** each.
- **Auto-lock:** tournament picks freeze automatically once every group
  Matchday 1 game is `finished` (`trg_lock_tournament_picks`). To lock manually:
  ```sql
  update public.tournament_results set picks_locked=true where id=1;
  ```

## 5. Quick local test (all matches currently "open")

```sql
-- simulate a finished match with a goalscorer
update public.matches
set status='finished', home_score=2, away_score=1, home_scorers='Harry Kane'
where api_fixture_id = <some id>;
```
Then check the leaderboard updates and the Fixtures scorer banner shows the result.
