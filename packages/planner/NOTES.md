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
