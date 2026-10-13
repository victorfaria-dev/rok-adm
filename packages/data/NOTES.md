# @rokadm/data — notes (F-50 v0)

## Pipeline

`pnpm --filter @rokadm/data build` runs `scripts/build.ts`. It reads these inputs:

- `research/facts/<dom>/[A-C]NN-NNNN.md`
- the CSVs named by `tabela` (a directory means every CSV inside it)
- `research/context/game-state-and-patch-timeline.md`
- `guides/data/blocks.f2p.json`

It replaces `generated/` with these files:

| File | Content |
|---|---|
| `facts.json` | `Fact[]`, sorted by id |
| `patches.json` | `PatchEntry[]`, sorted by version |
| `blocks.f2p.json` | `GuideBlock[]`, sorted by `order`, then by `id` |
| `tables/<dom>-<path>.json` | `{name, source, columns, rows, factIds}`. Plain numbers become numbers; any other text (`"2,000"`, `"35%"`) stays a string. |
| `manifest.json` | dataset version, build date, git commit, counts, latest known and latest official patch |
| `index.ts` | static imports of all the JSON files. Do not edit it; the typed API is in `src/dataset.ts`. |

**Determinism.** Object keys are sorted, and arrays keep a fixed order. `datasetVersion` is a sha256 over the input files plus the pipeline code (`scripts/*.ts`, `src/version.ts`, `src/policy.ts`). `builtAt` and `gitCommit` are reused from the previous manifest while `datasetVersion` stays the same, so rebuilding without input changes produces no diff. `SOURCE_DATE_EPOCH` is respected when set.

**Staleness check.** `test/determinism.test.ts` fails when the committed `generated/` is out of date with `research/`. After you edit a card, CSV or block, run the build again.

## How patches are derived

There is one `PatchEntry` for every `x.y.z` version that a C04 card mentions, in any of these fields: `versao_jogo`, `versao_minima`, the title, or the values. Versions marked approximate (`~1.0.93`) are ignored.

| Field | Rule |
|---|---|
| `date` | A `data_<version>` value on a card. Otherwise, the date from the timeline table. This can be a partial `YYYY-MM` for 2023–2024 versions. |
| `confidence` | The highest confidence among the cards *about* that version (`versao_minima`, or a title that starts with `x.y.z:`). It is capped at `baixa` when the timeline marks the date as T3-only, which applies to 1.1.10 and 1.1.12. |
| `summary` | The "Change" column of the timeline. Otherwise, the card titles. |

Timeline rows with no C04 card are not emitted: 1.0.72, 1.0.76, 1.0.79, 1.0.80, 1.0.82, 1.0.86, 1.0.88, 1.0.91, 1.0.93, 1.0.98, 1.0.99 and 1.1.11. They need cards first.

`latestPatch()` returns 1.1.12 (`baixa`). `latestPatch({minConfidence: "alta"})` returns 1.1.09, which has official notes.

## How `Fact.patch` is derived

`Fact.patch` comes from `versao_minima`. If that is empty, it comes from `versao_jogo`, but only when that field is a single plain version (`1.0.90` or `1.0.90+`). In every other case it is `null`; 226 of the 282 cards have no patch, because most say "desconhecida".

## Contract proposals (`packages/core/src/types.ts` — not edited)

1. **`SourceRef.copyOf: string | null`** (from `copia_de`). Without it, `factBadge().sourceCount` counts distinct slugs, not *independent* sources. For example, `src:rkg` is a copy of `src:fandom` in A05-0001.
2. **`SourceRef.literal: boolean | null`** (from `citacao_literal`), and optionally **`tier`** (T0–T4 from `fontes.md`). The badge could then show "official source".
3. **`Fact.gameVersionRaw: string | null`** (raw `versao_jogo`, such as "desconhecida (Fandom page revised 2026-01-04)"). `patch` drops this information.
4. **`Fact.consensus`, `Fact.conflicts: string[]`, `Fact.method: string | null`, `Fact.timeCostMin` + `timeCostOrigin`**. These fields are in schema v2, and F-15, F-20 and the derived-card UI need them.
5. **`PatchEntry.date`** should be documented as an ISO date *or* a `YYYY-MM` partial date. Optionally add a **`PatchEntry.official: boolean`** (T1 notes exist), instead of encoding that in `confidence`.
6. **`DataTable`** and **`FormulaResult<T>`** (`{value, inputs, confidence, usable, assumptions}`) are defined in this package for now (`src/dataset.ts`, `src/formulas.ts`). Move them to core if planner or core consume them.
7. `guides/data/blocks.newkingdom.json` now exists. The pipeline only loads `blocks.f2p.json`, as asked. Generalising to `blocks.*.json` is a one-line change.

## Decisão (2026-10-13): versões sem ficha C04 ficam fora do `patches.json`

Aprovado pelo Victor, por recomendação do admin. As 12 versões que aparecem só na tabela de `research/context/game-state-and-patch-timeline.md` (ex.: 1.0.72, 1.1.11) não entram no dataset enquanto não tiverem ficha C04, porque sem ficha não há confiança atribuída.

Gatilho para criar a ficha: quando um guia, bloco, fórmula ou funcionalidade precisar citar aquela versão (ex.: uma mudança que torna um conselho obsoleto). Nesse caso, criar a ficha C04 com fonte, rodar `pnpm build:data` e o teste de dataset atualizado.
