# @rokadm/planner — notes

## Data flow
- `scripts/build-data.ts` (`pnpm --filter @rokadm/planner build:data`, or `check:data` to fail on drift) reads `research/facts` directly and writes `data/facts-meta.json` (cited cards: title, confidence, status, consensus) and `data/vip-levels.json` (from `A05/data/vip-levels.csv`). It also checks the authored files: every fact ID exists, every gap ID is declared in a `_lacunas.md`, and every number in `budget-inputs.json` has an `evidence` substring that appears word for word in its card. It does not depend on `@rokadm/data`. Once that package ships, `realityCheck(profile, facts)` and `evaluateCommanderDecision(answers, { facts })` can take its `Fact[]` instead.
- Authored files: `routine-tasks.json` (RoutineTask[]), `routine-task-meta.json`, `budget-inputs.json`, `commander-checklist.json`, `commander-shelf-life.json`.

## Estimates pending T0
- Every `estimatedMinutes` in `routine-tasks.json` is a **planner estimate** (`minutes: null`, gap **L-A10-01**). Plans report `usesEstimates` and `pendingTaskIds`. When the T0 stopwatch log exists, put the measured values in `minutes`. `routine-task-meta.json` maps each task to its T0 task name (`t0Task`).
- `value` (1–5) is a planner judgement built from sourced yields. Each task's `valueReason` cites its fact cards.

## Proposed changes to `packages/core/src/types.ts` (not applied)
1. `AccountProfile.vipLevel: number | null`. VIP gates the VIP Shop tasks (A04-0007) and drives F-14 and F-20. It is passed as `PlanOptions.vipLevel` for now.
2. `RoutineTask` additions (currently in `routine-task-meta.json`):
   - `valueReason: string`
   - `mustDo: boolean`
   - `breakRole: "streak" | "before_pause" | null`
   - `weekdays?: number[]` (Peerless mock exam runs Mon–Fri)
   - `minVip?: number`
   - `t0Task?: string`
3. `RoutineTask.frequency`: add `"biweekly"` (Peerless Preliminary/Final, A10-0005). It is modelled as `weekly` + `cadence` for now.
4. A shared `Sourced<T>` shape (value, unit, facts, confidence, derived, pendingGaps) in core. F-14, F-21 and F-23 will all need it.

## Open points
- Break Mode: account protection while away (shield, troops, resources) has **no fact card**. This is premise P1 of S-D-0002 Idea 2. The planner only lists it as a pending note.
- Profiles other than `f2p` return `not_researched_yet` placeholders. A12 cards (Growth Fund, Supply Depot) could seed `low` later.

## Farms (F-65..F-69)
- Modules: `src/farms-common.ts` (types, `FARMS_DATA`, slim fact index), `farms-trading-post.ts` (F-67), `farms-variants.ts` (F-65), `farms-build.ts` (F-66), `farms-daily.ts` (F-68), `farms-ledger.ts` (F-69). `src/farms.ts` re-exports them all and the index re-exports `./farms`.
- Data: `data/farms.json` is authored. Every numeric claim carries an `evidence` substring; build-data checks every `evidence` map nested anywhere in the file. `data/trading-post.json` is generated from `research/facts/A03/data/trading-post.csv` (A03-0024 tax, A03-0025 capacity). `data/farms-facts.json` is generated: the cards cited by farms.json, with id, title, confidence, status and consensus only.
- **Bundle rule:** the farm modules import only **types** from `./facts`. Importing its values would pull `facts-meta.json` into client JS, and that file contains `invalidatedBy`, the dataset marker that `apps/web/scripts/check-budget.ts` rejects. The farm modules carry their own copy of the confidence rules (`farmConfidenceOf`, `farmFactConfidence`, `farmMinConfidence`). A test pins these to `facts.ts`, and another fails if a farm module imports `facts-meta.json` or `BUNDLED_FACTS`. Measured: an island importing `planTransfer` + `recommendFarms` from `@rokadm/planner` bundles about 7.6 KB gz with no marker.
- **Hypotheses (labelled in output, `hypothesis: true`, confidence capped at low):**
  - the farm-count rule (0/1/2), because there is no data per tier (L-A13-04);
  - `LOTS_OF_TIME_MINUTES = 120` and `MIN_FARM_MINUTES = 15`, because no farm minutes are measured (L-A13-01);
  - the food + wood pair, always `hidden` (L-A13-03);
  - the assumption that the **gross** amount sent counts against Trading Post capacity per trip. No card says this; it is the `capacity_counts_gross` warning, and plans with trips are capped at low.
- Bottleneck bands: CH1–5 food+wood, CH6–9 +stone, CH10–20 gold+stone, CH21–25 gold. CH21 is the T4 unlock (A01-0001), which maps the farms.md row "T4/T5".
- Gold farm: `not_recommended` for f2p/low/unknown spending, and `possible` for medium and above (A03-0027 vs A13-0004, divided).
- Trading Post unlock is contested (CH12 vs CH10, A03-0025). It is exposed as `TP_UNLOCK_NOTE` and as the `tp-unlock` build step, which counts as done once a Trading Post level is entered.
- Academy steps take the top of each A03-0028 range as the check: food/wood 9 and 20, stone/gold 15 and 25. Focus `general` keeps all four.
- Storage (`apps/web/src/lib/farms-store.ts`, key `ko:farms:v1`):
  - `removeFarm` also deletes that farm's shipments, so the ledger never has orphans;
  - the oldest shipments are dropped past 2,000;
  - the store has no planner runtime imports (types only).

## Council kit (wave E: F-33, F-34, F-30, F-35, F-39, F-42)
- Modules: `kingdom-common.ts` (doc base, `parseQuantity`, formatting), `kingdom-codec.ts` (share links: `#d=` + "1z"/"1j" + base64url of `{k, d}`), `kingdom-formula.ts` (safe evaluator, presets from B08-0001), `kingdom-requirements.ts`, `kingdom-rules.ts`, `kingdom-recruit.ts`, `kingdom-mge.ts`, `kingdom-seed.ts`; barrel `kingdom.ts`.
- Same bundle rule as farms: only types from `./facts`; a test fails if a kingdom module imports `facts-meta.json`. Displayed fact confidence is pinned by tests that read the card files in `research/facts/`.
- Web storage: `apps/web/src/lib/kingdom-store.ts`, key `ko:kingdom:v1`, plain documents `{id, kind, title, updatedAt, data}` ready for wave F sync.
- Hypotheses/limits: seed what-if (Vacation Permit = removed from the counted power) is a hypothesis (L-B03-03); MGE rotation rule is ours (L-B05-02); requirement power basis is a council field (L-B08-02).
