# @rokadm/core — implementation notes

`src/types.ts` (the contract) is unchanged. New code: `src/blocks.ts` (F-51), `src/questionnaire.ts` (F-01), `src/render.ts` (Markdown). Tests in `test/` read the real `guides/data/blocks.f2p.json` and `guides/f2p-early-kingdom-guide.md`.

## Behaviour choices (not dictated by the contract)

- **Low inherits F2P blocks.** `selectBlocks` option `profileFallback` defaults to `{ low: "f2p" }`. Every block with a `low_spender_note` is tagged `perfil: ["f2p"]`, so a strict `perfil` match would never show those notes to a Low spender. guides/README.md describes the Low guide as a delta over the F2P base, so Low sees F2P blocks until `blocks.low.json` exists. Pass `{ profileFallback: {} }` for a strict match. No other profile falls back, so a Whale sees only `todos`/`whale` blocks.
- **City Hall:** a CH below `ch_range` keeps the block and flags it `upcoming`. A CH above the range moves it to `alreadyDone`, as in the README sketch. Set `includeAlreadyDone: false` to drop those blocks.
- **Kingdom day:** when `kingdomDay` is set, blocks in dated phases that are already past (`day0-3` ≤ 3, `day4-14` ≤ 14, `day15-40` ≤ 40, `day41-90` ≤ 90) also go to `alreadyDone`. Caveat for content: some `day0-3` blocks give ongoing advice (join an alliance, AP discipline, day-1 safety), so on day 20 they move to "Already done?". If that is wrong, change those blocks to phase `anytime` or set `usePhaseByKingdomDay: false`.
- **Civilization:** a block with a non-empty `civ` is hidden when the civilization is unknown (`null`). No block in the current data uses `civ`.
- **Daily tiers:** by default all fitting tiers are listed (`dailyTiers: "all"`). `"fold"` keeps the highest one and nests the lower ones in `folded`. Tier detection matches the id pattern `daily-<n>min`. A `tier` field on blocks would make this explicit.
- **Ordering:** section → order → priority (descending) → id. In the current data this is the same as the Python assembler's phase → order.
- **Profile code** (`encodeProfile` / `decodeProfile`), version 1: `1.<spend>.<role>.<stage>.<CH>.<min>.<sessions>.<day>.<lifetimeUsd>.<civ>.<returning>`. Spending, role and stage are indexes into `SPENDING_PROFILES`, `ROLES` and `KINGDOM_STAGES`, so **never reorder those arrays** (append only), or bump the version. The output uses only `[0-9a-z.]`.
- **Questionnaire:** minutes per day is a number from 0 to 1440, with presets of 15/30/60/120. CH defaults to 1, which gives the full guide with later steps marked "upcoming". The civilization list (15 codes) comes from the names that appear in research/facts and should be confirmed in game.

## Possible future contract additions (not made)

- `AccountProfile.returningPlayer` is collected but no block field uses it yet. F-51 lists a "retornante" tag, so blocks may need a `returning: boolean | null` field later.
- `lifetimeSpendUsd` only produces a warning for now (`profileWarnings`). It could map to an "effective profile" once research/perfis.md defines the thresholds.
- Blocks carry no card metadata, so `renderGuideMarkdown` skips the Python guide's "Sources and confidence" appendix. It would need the F-50 `Fact[]` as input.

## Guide sets (wave H, `src/guideSets.ts`)

- `GUIDE_SETS` registers every `guides/data/blocks.*.json` file (a test fails if a file is added without registering it). Kinds: `base` (F2P), `profile-delta` (`blocks.low.json`, merged into the base guide for Low and above, as guides/README.md says), `guide` (standalone: new kingdom, first 30 days, returning, recovery, kingdom admin).
- `guidesForProfile(profile, { zeroed })` lists the guides to offer, most specific first, base guide last: recovery only when `zeroed` is passed (the questionnaire does not ask it); returning when `returningPlayer`; kingdom admin for role `lider`; new kingdom for `pre_kvk` and kingdom day ≤ 14 (or unknown); first 30 days for non-returning players with CH ≤ 16 (`FIRST30_MAX_CITY_HALL`, a proxy, since the profile has no account age).
- `selectGuide(id, loaded, profile)` = `selectBlocks` over `blocksForGuide` with the set's chapter titles (`sectionTitles`, new `SelectOptions` field). Loading the JSON stays with the caller (no I/O in core).
