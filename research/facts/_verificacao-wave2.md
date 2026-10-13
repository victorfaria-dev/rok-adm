# Wave-2 adversarial verification: account domains (A01–A14, B01-05xx)

Date: 2026-10-13. Run by the sub-admin CONTA. Scope: 151 cards (A01–A14 and B01-0500…0506), plus 1 new card (B01-0700). B01-0001…0003 belong to the REINO front (W4) and were neither migrated nor verified. They fail v2 validation (old source IDs `PLxx`, `perfil: lider`, `data_referencia`).

## Method

1. **Re-fetch of every citation (443 quotes, 134 URLs).**
   - Fandom pages were re-read via the MediaWiki API (`prop=text` and `wikitext`, plus revision timestamps and edit comments).
   - Official posts were re-read via the forum JSON API (`/api/v2/posts/<id>`). All 832 official posts were downloaded and searched in full, not just the cited ones.
   - Guide sites were re-read with `curl` and parsed locally.
   - Each quote was tokenised and matched against the page text (script: scratch `verify_quotes.py`; per-quote results in `tools/data/quote_check_wave2.json`).
   - Quote statuses:
     - `verbatim`: every fragment is found contiguously.
     - `near`: ≥90% of tokens are present, with a long contiguous run. This is usually table-row formatting.
     - `partial` / `not_found`: a paraphrase.
     - `unreachable`: the page could not be fetched.
2. **T1 cross-check.** Every numeric card and every `media` card was checked against the 832 official posts (keyword search on the card's subject) and against the C04 patch timeline (`context/game-state-and-patch-timeline.md`).
3. **T2 cross-check.** Fandom revision dates were attached to each citation (`publicado_em`). Edit comments were read where a value was disputed.
4. **T4 corroboration (new access route).** r/RiseofKingdoms is reachable through the Arctic Shift archive API. It was used only for corroboration of strategy and event cadence, and of two contested mechanics (gold via Trading Post, cumulative VIP). T4 never raises a mechanic above `media`.
5. **Migration to schema v2.** Done with `tools/migrate_v2.py` (decisions in `tools/wave2_overrides.py`). Validation with `tools/validate_facts.py`: **0 errors** on A01–A14 and B01-05xx/0700. Two warnings: quotes that remain WebFetch paraphrases in A12-0004 and A13-0004.

## Quote fidelity (all 443 pre-existing citations)

| | verbatim | near | partial | not found | unreachable | literal rate |
|---|---|---|---|---|---|---|
| All | 389 | 17 | 24 | 6 | 7 | **91.6%** (406/443) |

- 18 non-literal quotes were **replaced by the literal sentence located on the page**. The claim was unchanged in all 18 cases; the WebFetch summaries were faithful in meaning.
- The remaining non-literal quotes are tagged inside the `trecho` with `[wave2: paraphrase — literal text not located…]`.
- Cards left at `status: organizado` because of this: A07-0501, A08-0504, A13-0001, A13-0004, B01-0505.
- Non-literal quotes are concentrated in sources read through WebFetch: A07 (5/10), A03 (10/85), A06 (5/48), A13 (3/28).
- The pilot's curl-based quotes (A01, A04, A09, A10, A14) were 97–100% literal.

## Per domain

"Material change" = factual correction, status change to `contestado`/`(parcialmente_)obsoleto`, or a confidence change. Rate = cards with a material change ÷ cards checked.

| Domain | Cards | Quotes literal | Material changes | Rate | Upgrades | Downgrades | Notes |
|---|---|---|---|---|---|---|---|
| A01 Buildings | 11 | 32/34 | 1 (A01-0009 narrowed) | 9% | — | — | CH table re-read from wikitext. Early-unlock conflict narrowed, now pending T0. |
| A02 Research | 5 | 10/13 (3 unreachable) | 0 | 0% | — | — | heaven-guardian academy page down (connection reset). |
| A03 Economy | 32 | 75/85 | 7 | 22% | A03-0027 baixa→media (resolved) | A03-0001 alta→media; A03-0005 media→baixa; A03-0020 media→baixa (copied source); A03-0023 alta→media (only T3) | A03-0022 partly obsolete (pre-1.0.49 yields). A03-0024 gains a T1 corroboration. |
| A04 Gems/speedups | 11 | 39/39 | 0 | 0% | — | — | A04-0007 VIP Shop matched the Fandom Shop table; src:rkg is a copy. |
| A05 VIP | 8 | 25/26 | 1 (A05-0002 → parcialmente_obsoleto) | 13% | — | — | Cumulative thresholds now T4-supported. |
| A06 Commanders | 17 | 43/48 (+5 fixed) | 0 | 0% | — | — | "Talent rework" clarified: effects only, Season 2+. |
| A07 Equipment | 5 | 5/10 (+4 fixed) | 0 | 0% | — | — | A07-0501 still has a paraphrase. |
| A08 Troops | 7 | 18/22 (3 unreachable) | 0 | 0% | — | — | |
| A09 AP/PvE | 8 | 28/28 | **2 (A09-0001 factual error; A09-0006 gap closed)** | 25% | A09-0001 media→alta | — | **AP cap is 1,500, not 1,000.** |
| A10 Routine | 8 | 29/29 | 2 (A10-0001 → parcialmente_obsoleto; A10-0007 alta→media) | 25% | — | A10-0007 alta→media | A10-0007 deduplicated against A03 (its 5% claim is single-source). |
| A11 Events | 14 | 41/42 | 2 (A11-0502 resolved; A11-0503 partly obsolete) | 14% | A11-0502, A11-0505, A11-0513 baixa→media | — | Sunset Canyon, Champions of Olympia and Lohar confirmed live by T1. |
| A12 Spending | 5 | 11/12 | 0 | 0% | — | — | Sources are sellers (CoI flagged). |
| A13 Farms | 10 | 25/28 | 0 | 0% | — | — | |
| A14 Civs | 3 | 13/13 | 0 | 0% | — | — | |
| B01 Lifecycle (05xx) | 7 | 12/14 | **3** (B01-0501 factual error; B01-0503 outdated; B01-0502 contested) | 43% | — | — | Plus new card B01-0700 (T4). |
| **Total** | **151** | **406/443** | **18 cards** | **12%** | 5 | 5 | Strict factual errors: 4 cards (2.6%): A09-0001, B01-0501, B01-0503, A03-0022. |

Final status distribution of the 151 cards:
- 134 `verificado`
- 6 `contestado`: A01-0009, A03-0001, A03-0005, A03-0025, A05-0005, B01-0502
- 6 `parcialmente_obsoleto`: A05-0002, A10-0001, A11-0503, B01-0501, B01-0503, A03-0022
- 5 `organizado`: non-literal quotes

Confidence: 14 `alta`, 84 `media`, 53 `baixa`.

## Notable corrections

1. **AP cap (A09-0001).** The pilot card said 1,000, from a Lyceum quiz answer. The official 1.0.41 notes (2020-12-15) raised it to **1,500** and added a **claimable 500 AP/day**. No later change appears in 832 official posts. Lesson: Lyceum quiz text (src:rkg-lyceum) can be stale. It is now flagged in `fontes.md`.
2. **Gold via Trading Post (A03-0027).** Resolved as **yes, gold can be sent**, limited only by Storehouse protection (T1 1.0.44). Evidence:
   - the heaven-guardian walk-through ("Choose Food, Wood, Stone, or Gold");
   - two 2021 Reddit threads;
   - src:rkg's "avoid transfer taxes".

   This contradicts the Theria Games claim. Pending T0.
3. **Trading Post unlock (A03-0025, A01-0009).** Narrowed to **CH12, probably**:
   - the Fandom main page has said 1stUnlockCH=12 since 2019;
   - the Requirements page was corrected on 2026-08-11 ("updated the building requirement from CH lv 10 -> 12").

   The old developer CH table, copied by src:rkg, says CH10. A player-editor also moved the **Academy** and the **first Quarry** to CH6 in Jan 2026. All are pending T0, observable in the first days.
4. **VIP thresholds are cumulative (A05-0001).** T4 arithmetic supports it: "It's 138k VIP points from 6 to 10" = 150,000 − 11,500. The derived VIP timelines (A05-0007) stand, still as upper bounds.
5. **More Than Gems cadence (A11-0502).** The T3 conflict (2–3 months vs 4–6 weeks) is resolved toward **~monthly**, a **2-day** event with a **~25k gems/day** top tier, seen only in kingdoms older than ~21 days. Basis: six 2026 Reddit comments, plus an official 2023 dev reply ("ideal interval", no number).
6. **Feb 2026 talent "rework" (A06-0514, C04-0011).** Official 1.1.04 notes change only the **effects** of specific damage-reduction talents and inscriptions, and only for **Season 2+**. No restructuring of talent trees appears. Early-game talent advice (Quick Study → Trophy Hunter, gathering trees) is not invalidated.
7. **B01-0501.**
   - "Tides of War not found" was wrong. It is an official SoC story (1.0.76).
   - Season 3 is moving to King of All Britain (C04-0007).
8. **B01-0503.** "The Lost Kingdom opens after Eve of the Crusade" is outdated:
   - in SoC, Eve now starts inside the Lost Kingdom (T1 1.0.95);
   - in Season 1, the first ~6 days of pre-KvK overlap the opening of the Lost Kingdom (1.1.12, T3, plus a Sep 2026 player report).
9. **Gem deposits (A03-0020 / A04-0004).** The 10/20-gem figures have only one independent source. src:boostroom copies src:rkg ("Current references list"). A03-0020 was downgraded to baixa.
10. **Hospital (A01-0008).** T1 1.0.41 confirms that lower-level hospital capacity was raised. This explains the stale src:rkg table.
11. **Gathering (A03-0016, A03-0022).** T1 1.0.49 (2021-08) raised resource-point deposits by 25% and base gathering speed by 10%. Author yields from 2019–2020 are obsolete.
12. **Event existence (A11-0513, A11-0509, A11-0507, A10-0008).** T1 patch notes from 2026 confirm Sunset Canyon, Champions of Olympia and Arms Training/Lohar are live.

## Priority conflicts (requested by the admin)

| Conflict | Verdict | Confidence | Remaining action |
|---|---|---|---|
| Can gold be sent via Trading Post? | **Yes**, only the amount above Storehouse protection (A03-0027, A03-0030) | media | T0: screenshot the resource selector (protocol Q10) |
| Trading Post unlock CH10 vs CH12 | **CH12 probable** (A03-0025, A01-0009) | baixa–media | T0: CH10/CH12 upgrade screens (Q9) |
| VIP thresholds cumulative? | **Yes** (T4 arithmetic) (A05-0001) | media | T0: VIP screen day 1 (Q8) |
| More Than Gems frequency | **~Monthly**, 2 days, kingdoms >~21 days old (A11-0502) | media (T3+T4) | T0: log MTG dates (Q4) |
| Talent trees after the Feb 2026 rework | **Trees unchanged**; damage-reduction effects broadened, Season 2+ only (A06-0514, C04-0011) | alta for the patch text; trees "unchanged" = absence of evidence in 832 posts | T0 screenshot of a talent tree is optional |

## Deduplication

- **A10-0007 ↔ A03-0009 / A03-0010 / A03-0013 (gathering).** A03 is canonical. A10-0007 is kept as the routine-facing summary, with a note not to count it as independent evidence. The Lyceum quote for +25% was added to A03-0009, which keeps it at `alta` with two independent T2 sources.
- **A05-0002 ↔ A03-0002 / C04-0004 (VIP production).** A05-0002 is the canonical VIP buff card (now `parcialmente_obsoleto`, invalidated by C04-0004). A03-0002 is the building-output table.
- **A04-0004 ↔ A03-0020 (gem deposits).** A04-0004 is canonical for deposit sizes. Both are `baixa`.

## Schema problems found during migration

1. **Colliding provisional IDs.** `SA01…SA10` mean different sites in A-economy and A-strategy (e.g. SA02 = heaven-guardian in economy, riseofkingdomsguides in strategy). They were resolved by URL host. Slugs make this impossible going forward.
2. **`publicado_em` free text.** Values like "rev 2025-06-05", "mod 2026-01-02" and "2022/2023" were normalised to ISO dates. Qualifiers (rev/mod/bulk-bumped) are lost. Suggest an optional `publicado_em_tipo: revisao|publicacao|modificado`.
3. **`perfil` misused.** `farm` and `lider` (roles) were moved to `funcao`. Old `baixo` was mapped to `low`.
4. **No field for quote-verification status.** It is recorded in `notas` and in `tools/data/quote_check_wave2.json`. Suggest an optional per-source `verificado_em` and `trecho_literal: true|false`.
5. **`data_validade` semantics.** The migration set it to the newest supporting source date unless a T1 check justified a later date. "Still on Fandom today" is not proof the fact is true today.
6. **`status: verificado` vs `confianca`.** Verified here means "adversarially re-checked and still standing at its confidence". A `verificado` card can be `baixa`. Guides should filter by both fields.
7. **T4 for corroboration.** `fontes.md` limits T4 to pains. Wave 2 used T4 to resolve event cadence and two mechanics, never above `media`. The admin may want to codify this in the schema.

## Tools and artefacts

- `tools/validate_facts.py`: v2 validator (PyYAML, or a stdlib fallback parser; both give identical results on A01–A14).
- `tools/migrate_v2.py` + `tools/wave2_overrides.py`: the one-off migration and all wave-2 decisions, as data.
- `tools/raw_tables_to_csv.py`, `tools/extra_tables.py`: CSV tables.
  - `facts/A01/data/city-hall.csv`, `city-hall-rewards.csv`, `buildings/*.csv` (17 buildings)
  - `facts/A03/data/resource-buildings.csv`, `trading-post.csv`
  - `facts/A04/data/vip-shop.csv`
  - `facts/A05/data/vip-levels.csv`
- `tools/data/quote_check_wave2.json` (per-quote results), `fandom_revs.json`, `forum_dates.json`, `migration_summary_wave2.json`.
- Gaps: `facts/<dom>/_lacunas.md` (15 files). T0 protocol: `protocolos/t0-medicao.md`.
