# guides/ — modular guides (I-05)

Guides are **not** written once per combination of answers. They are built from **tagged blocks** (architecture decision I-05 in `research/brainstorm/backlog-ideias.md`). One block = one recommendation or step, with its reasoning, its evidence (fact-card IDs) and the tags a questionnaire needs to decide whether to show it. The same blocks will later feed the Account Planner (M1) and the Farm Hub (M13).

Pipeline: `research/facts/` (cards) → `guides/data/blocks.*.json` (blocks) → assembled guide (Markdown now, HTML from the Guide Builder M14 later).

## Files

| Path | What |
|---|---|
| `data/blocks.f2p.json` | F2P base blocks, v1 (43 blocks). **The source of truth**: edit here. |
| `data/blocks.newkingdom.json` | F-12 New Kingdom Start Guide + Day-1 Survival + Returning-player branch, v1 (14 blocks, ids `nk-*`). |
| `data/blocks.schema.json` | JSON Schema of a blocks file. |
| `f2p-early-kingdom-guide.md` | Human-readable F2P guide, **generated** from the blocks. Don't edit by hand. |
| `tools/validate_blocks.py` | Validator: schema plus editorial rules checked against `research/facts`. With no arguments it checks every `data/blocks.*.json` and that ids are unique across files (profile delta files excepted). Stdlib only. |
| `tools/assemble_guide.py` | Builds the Markdown guide from a blocks file (filter by profile, order by phase). |
| `tools/factlib.py` | Shared helpers: read card front matter and gap IDs. |

```bash
python3 guides/tools/validate_blocks.py            # must print "0 errors"
python3 guides/tools/assemble_guide.py             # rewrites f2p-early-kingdom-guide.md
```

## Block fields

| Field | Meaning | Used by the questionnaire? |
|---|---|---|
| `id` | Stable slug. Never reuse a retired ID. | link target |
| `title`, `body_md`, `why_md` | What to do, and **why** (every block states its reasoning). | — |
| `phase` | When in the kingdom's life: `overview`, `day0-3`, `day4-14`, `day15-40`, `day41-90`, `pre-kvk1`, `daily`, `event`, `anytime`. | kingdom day |
| `section`, `order` | Chapter of the assembled guide and sort key. | — |
| `stage` | Kingdom stage (`pre_kvk`, `kvk1` … `soc`, `todos`), same codes as `research/schemas/fato.md`. | kingdom stage |
| `perfil` | Spending profiles that see the block (`f2p` … `kraken`, `todos`); see `research/perfis.md`. | spending profile |
| `recommended_for` | Profiles for which the block's main option is badged **Recommended**. | spending profile |
| `low_spender_note` | Where a Low spender's advice changes materially (until the Low delta file exists). | spending profile |
| `funcao` | Role (`todas`, `lutador`, `farm`, `rally`, `guarnicao`, `lider`). | role |
| `hours_min_per_day` | Minimum daily play time (hours) at which the block applies; `null` = any. | hours/day |
| `time_cost_min` | **Measured** minutes the block costs (T0 only); `null` until measured. | hours/day (later) |
| `ch_range` | `[min, max]` City Hall where the block is relevant; `null` = any. | current CH |
| `civ` | Civilizations the block is specific to; empty = all. | civilization |
| `priority` | 1–5; 5 = do first. | ordering / "minimum plan" |
| `consensus`, `split_views` | `unanimous` / `majority` / `split` / `minority` / `single-source` / `mechanic`. Both views are required when `split`. | — |
| `cards` | Every fact card cited anywhere in the block. | — |
| `patch_cards` | C04 patch-change cards cited while still `bruto` (shown as "Patch state"). | — |
| `confidence` | `high` / `medium` / `low` / `pending`. | optional "hide low" toggle |
| `uncertain_notes` | Names every weaker card used, and why. | — |
| `gaps` | Gap IDs (`L-<domain>-NN` from `research/facts/*/_lacunas.md`, or `PROPOSED-*`). | — |
| `as_of`, `patch_ref` | Date and patch the block was checked against. | "verified on patch" label |

## Editorial rules (enforced by `validate_blocks.py`)

1. Every card ID mentioned in the text is in `cards` and exists in `research/facts`.
2. Firm statements rely only on cards with status `verificado` **and** confidence `media`/`alta`. Every other cited card must be named in `uncertain_notes` (shown as **Uncertain**). The exception is C04 patch cards with confidence ≥ `media`, which are listed in `patch_cards` and shown as **Patch state** until the patch front verifies them.
3. A `high`/`medium` block needs at least one firm or patch card. A `high` block cannot cite non-firm cards.
4. `consensus: split` requires `split_views`.
5. Gap IDs must exist in a `_lacunas.md` (`PROPOSED-*` gaps only produce a warning, so the research side can file them).
6. `time_cost_min` stays `null` until a T0 stopwatch value exists. Daily blocks without it must list `L-A10-01`.
7. Numbers are never invented. Missing numbers become a gap reference ("Pending in-game measurement (T0)").

## How the questionnaire (F-01, M14 Guide Builder) will filter the blocks

The questionnaire asks six questions. Each answer is a filter or a sort over the block fields. A static HTML page can do this in the browser with the JSON file, with no backend.

| Question | Answer codes | Rule |
|---|---|---|
| **Spending profile** | `f2p`, `low`, `medium`, `high`, `whale`, `kraken` | Load the base F2P file plus the delta files up to the chosen profile (`blocks.low.json`, …, when they exist; a delta block with the same `id` replaces the base block). Keep a block if `perfil` contains the answer or `todos`. Badge **Recommended** if `recommended_for` contains it. Show `low_spender_note` when the answer is `low` (until the Low delta exists). |
| **Role** | `lutador`, `farm`, `rally`, `guarnicao`, `lider` | Keep the block if `funcao` contains the answer or `todas`. A farm-only player still gets `todas` blocks (routine, safety). |
| **Hours per day** | 0.25 / 0.5 / 1 / 2+ | Keep the block if `hours_min_per_day` is `null` or ≤ the answer. For `daily` blocks, show the **highest tier that fits**, with lower tiers folded into it. Once T0 fills `time_cost_min`, sum costs and flag a plan that exceeds the budget. |
| **Kingdom stage** | `pre_kvk`, `kvk1`, `kvk2`, `kvk3`, `soc` | Keep the block if `stage` contains the answer or `todos`. A kingdom-day answer (optional) collapses phases that are already past. |
| **Current City Hall** | 1–25 | Keep the block if `ch_range` is `null` or contains the CH. Blocks whose range ends below the CH are moved to a collapsed "Already done?" list rather than hidden, so a player can catch what they missed. |
| **Civilization** | e.g. `china`, `spain`, … | Keep the block if `civ` is empty or contains the answer. The civilization-choice block is shown only to CH ≤ 10 players (its `ch_range`), when the free change is still ahead. |

Ordering after filtering: `phase` (in the order listed above), then `order`. A "minimum plan" view shows only `priority ≥ 4`. An optional toggle hides `confidence: low` and `pending` blocks; it is off by default, so uncertainty stays visible.

Sketch:

```js
const keep = b =>
  (b.perfil.includes(a.perfil) || b.perfil.includes("todos")) &&
  (b.funcao.includes(a.funcao) || b.funcao.includes("todas")) &&
  (b.stage.includes(a.stage) || b.stage.includes("todos")) &&
  (b.hours_min_per_day === null || b.hours_min_per_day <= a.hours) &&
  (b.ch_range === null || a.ch <= b.ch_range[1]) &&      // past ranges -> "Already done?"
  (b.civ.length === 0 || b.civ.includes(a.civ));
```

## Adding a profile or updating for a patch

- **New profile (Low, then Medium, …):** write `blocks.<perfil>.json` with only the blocks that change (same `id` to override, new `id` to add), as described in `research/perfis.md`. Don't copy the F2P file.
- **New patch:** blocks whose cards are invalidated by a new C04 card get new text and a new `as_of` / `patch_ref`. The validator catches cards that dropped below the firm filter, because statuses are read live from `research/facts`.
- **T0 results:** when a gap closes, the research side updates or adds the card. Then the block moves the number from "Pending" into the body and, for routine tasks, fills `time_cost_min`.
