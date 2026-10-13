# Migration to schema v2: C01, C02, C04 and B01-0001…0003

Date: 2026-10-13. Scope: 87 cards. The cards were not committed. `fontes.md`, B02–B09, A*, pains/ and context/ were not touched.

## Result

`python3 research/tools/validate_facts.py C01 C02 C04 B01` reports **95 cards, 0 errors, 1 warning**. The 95 include all of B01. The single warning is in B01-0700, which is outside this scope and predates this migration (a malformed source key).

The full repository run still shows 146 errors, all in B02–B09, which another agent is migrating.

## What was done

1. **Source IDs mapped to slugs.** All 161 citations now use slugs, following the "Mapa de IDs antigos" in `fontes.md`:
   - CSxx → tool and official slugs.
   - S01/S02 → `src:lilith-forum` and `src:fandom`.
   - C04-Sxx → `src:ldshop`, `src:heaven-guardian`, `src:change-org`.
   - PL01 → `src:reddit`; PL02 → `src:lilith-forum`; PL14 → `src:onechilledgamer`; PL15 → `src:heroscroll`.

   No source lacked a slug; see `_migration-c-missing-sources.md`.
2. **Quote re-check.** Every cited URL was re-fetched, and each `trecho` was matched against the page text:
   - Official forum: JSON API.
   - Fandom: MediaWiki API.
   - GitHub READMEs: `raw.githubusercontent.com`.
   - Reddit: Arctic Shift archive.
   - Other sites: curl.

   Per-quote results are in `tools/data/quote_check_migration_c.json`. The scripts are `tools/fetch_pages_c.py`, `tools/check_quotes_c.py` and `tools/migrate_v2_c.py`.
3. **v2 fields filled.**
   - `citacao_literal` was set per citation:
     - `true`: the quote was found literally, or the trecho was replaced by the literal text.
     - `false`: the trecho is a paraphrase or our own description.
     - `null`: the page could not be reached, or the quote is a search snippet only.
   - `publicado_em` and `publicado_em_tipo` were filled only from visible evidence:
     - forum post dates: `publicacao`;
     - Fandom revision timestamp: `revisao`;
     - `article:modified_time` / `dateModified`: `modificado`;
     - riseofkingdomsguides 2026-01-02: `modificado_em_massa`;
     - ToS `show_at` 2025-04-15;
     - Reddit `created_utc`;
     - LDShop and heaven-guardian post dates from the raw notes.

     Otherwise the field is `null`.
   - `data_validade` takes the v1 `data_referencia`, as the schema's migration rule says. `data_fonte` is the latest reliable `publicado_em` among the sources; mass-modified dates are excluded. It is `null` when none is known: 26 of 30 C01 cards and 8 of 21 C02 cards.
   - `versao_minima` was set for 31 C04 cards: the first patch in their `versao_jogo`. It was also set for B01-0001 (1.0.95). C04-0001 (metadata) and C04-0026 (approximate version) are left `null`.
   - `n_fontes_pro` is the number of distinct slugs. `n_fontes_contra` is 0, since no contrary sources are cited.
   - `copia_de` and `invalidado_por` are `null`.
   - `funcao` is `[todas]`, except B01-0002: v1 `perfil: [lider]` becomes `perfil: [todos]`, `funcao: [lider]`.

## Quote fidelity (161 citations)

| Domain | Cards | Quotes | Literal | Replaced by literal text | Not literal | Not verifiable |
|---|---|---|---|---|---|---|
| C01 | 30 | 45 | 39 | 5 | 2 | 4 |
| C02 | 21 | 33 | 28 | 2 | 0 | 5 |
| C04 | 33 | 75 | 64 | 0 | 0 | 11 |
| B01-0001…3 | 3 | 8 | 8 | 0 | 0 | 0 |
| **Total** | **87** | **161** | **139** | **7** | **2** | **20** |

The "Replaced by literal text" column is a subset of "Literal".

**Paraphrases replaced by the literal sentence on the page.** In none of these cases was the claim changed. C01-0022 lost the nuance "near-perfect accuracy"; the README instead says ">95% accuracy" if its screenshot rules are followed.
- C01-0004 (Fandom API stats).
- C01-0013 (ROKSTATS "Managed KvK Scans & DKP").
- C01-0021 (RokTracker: "players in kingdom", not "Players of kingdom").
- C01-0022 (RokVision: the quoted sentence is not in the README; the README sentence is now cited).
- C01-0029 (Codex Helper: "Daily updated in-game event tracker").
- C02-0001 #3 and C02-0015 #2 (rok.lilith.com footer links were rendered as "Terms of Service: URL"; the literal `<a>` tag is now cited).

**Not literal (`false`):**
- C01-0002: the trecho is our own proxy error.
- C01-0027 #2: a summary of a GitHub search API result. GitHub search is not reachable to re-check it.

**Not verifiable (`null`):**
- LDShop, 10 quotes in C04: 403 today. All 10 match the curl capture in `raw/patches/ldshop-gg.md`.
- heaven-guardian, C04-0026: connection reset. The quote matches the curl capture in `raw/patches/community-misc.md`.
- Search-snippet-only sources: allclash, appgamer ×2, justia, alternativeto, zff.dev, the legacy forum ×2.
- rok.guide (DNS).
- everycalculators (Cloudflare block).

**WebFetch tags.** No trecho in this scope carried a WebFetch tag.

**Competitor quotes.** The competitors' "summarizer" quotes held up well: on the reachable pages, only 5 of 45 C01 quotes needed literal replacement.

## Status and confidence changes

- **Status: no promotions.** C01 and C02 stay `organizado`; C04 and B01-0001…3 stay `bruto`. This migration only re-checked quotes. It was not the adversarial T1 cross-check that wave 2 did before promoting A* cards to `verificado`. No card is `verificado`, so no card with a `false` quote is `verificado`.
- **Confidence: two downgrades, alta → media.**
  - C01-0004 and C02-0021: their only source is the Fandom API, a single T2 source, so they fail the rule "alta = T0/T1 or two independent T2". The wiki's own siteinfo is arguably primary evidence for a claim about the wiki itself, but the rule was applied as written.
  - C01-0004 also claims "recent edits mostly from a single editor", which its quote does not support.
- **Consensus: one change.** B01-0002 (strategy) went from `majoritario` to `fonte_unica`. Its three Reddit posts share one slug, `src:reddit`, following the wave-2 rule. Reconsider if posts by different authors should count separately.

## Validator change

`tools/validate_facts.py` now accepts the v2 citation keys `publicado_em_tipo` and `citacao_literal`. Before, it emitted about 320 "unknown key" warnings for fields the schema itself defines.

It also adds three new errors:
- an invalid `publicado_em_tipo`;
- a non-boolean `citacao_literal`;
- `citacao_literal: false` on a `verificado` card.

The A* cards still validate with 0 errors.

## Open issues

- C04 holds 27 `alta` cards still at `bruto`. They need a verification pass before guides can use them, since guides filter on `verificado`.
- C04-0001 to 0003, C04-0007 and C04-0022 rely on LDShop, a source with a conflict of interest (it sells top-ups). LDShop is the only source for patches 1.1.10–1.1.12, and it could not be re-fetched today.
- The Lilith ToS `show_at` date is the only date available for C02. Most C01 tool sites expose no date at all, which is why `data_fonte` is `null` for them.
