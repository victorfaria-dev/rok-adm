# Verification report — REINO wave 2 (B02–B09 + leader pains)

Sub-admin REINO, 2026-10-13. Scope: the 38 fact cards B02–B09 (B01 belongs to CONTA and was not edited) and the 26 leader pains D-0500…D-0525. Method: adversarial re-fetch of every quote and a cross-check against official Lilith patch notes.

## 1. Method

| Step | What was done |
|---|---|
| Quote re-fetch | Extracted all 214 `url + trecho` pairs from B02–B09 and D-05xx. **Reddit (145 pairs, 81 threads):** pulled from the Arctic Shift archive (posts by id and full comment trees) and fuzzy-matched after normalising quotes and whitespace. **Web (55 pairs):** re-downloaded live pages: GitHub READMEs via raw.githubusercontent, Google Sites, ROK Steward, Heaven Guardian, Lootbar, riseofkingdomsguides, Codex Helper, Auctioneer Bot. **Official forum (14 pairs):** the JSON API. |
| Official cross-check | Read the full text of 21 official patch-note posts (1.0.74, 1.0.87, 1.0.89–1.1.09), 2 developer Q&As (Nov 2024, Apr 2025) and the official post list (832 posts). Grepped for every admin-relevant feature: titles, king skills, Watchlist, roster, officers, notes, checks, immigration, votes, coalitions, Acclaim, Toolkit, chat. |
| Independence | Checked posting histories of key cited authors. Merged same-author reports and flagged a persona account. |
| Gap fill | Arctic Shift title search (the full-text search times out) for council, timezone, language, title, export, burnout, tired, KvK1, new kingdom, civil war, NAP. NAP and leader/king/leadership searches failed with throttling. |
| Schema | All B02–B09 cards rewritten to fato.md v2: `metodo`, `funcao`, `data_fonte`, `data_validade`, `versao_minima`, `invalidado_por`, `n_fontes_pro/contra`, `publicado_em`, `copia_de`. YAML validated. |

Note: `publicado_em` for official notes uses the deploy date stated in the post. The forum `inserted_at` is usually 4–7 days earlier.

## 2. Error rates

### Quotes (trecho)

| Corpus | Pairs | Verbatim | Not verbatim | Of which meaning-changing or non-existent |
|---|---|---|---|---|
| Reddit (Arctic Shift) | 145 | 144 | 1 (1wwj0rs paraphrase) | 0 |
| Official forum | 14 | 14 | 0 | 0 |
| Other web | 55 | 45 | 10 | 3 |
| **Total** | **214** | **203** | **11 (5.1%)** | **3 (1.4%)** |

The 10 non-verbatim web quotes:

| Card(s) | Source | Problem |
|---|---|---|
| B03-0001 | Heaven Guardian | paraphrase |
| B03-0001 | riseofkingdomsguides | **sentence not on page** |
| B05-0004 | GabrielOlC | paraphrase |
| B06-0004 | Heaven Guardian | paraphrase |
| B06-0005 | K2779 | **paraphrase changed meaning** |
| B08-0001 | ROK Steward | paraphrase of UI labels |
| B08-0006, D-0503 | K2779 | paraphrase |
| D-0511 | Lootbar | **sentence not on page** |
| D-0522 | GabrielOlC | paraphrase |

All were replaced with verbatim text. The summarizing fetcher was the cause. The Reddit corpus was accurate.

### Claims (fact cards B02–B09, 38 cards)

| Class | Cards | Rate |
|---|---|---|
| Material claim error (wrong or misleading conclusion) | B03-0001 (unreproducible General value), B03-0002 (missed the official title system; conflict left open), B04-0002 (omitted "notes visible to all members"), B05-0001 (stage-count conflict unflagged), B06-0005 (reward-eligibility rule read as a purge rule), B08-0003 (implied in-game xlsx export), B08-0004 (scope of "governor ID not tracked") | **7/38 = 18%** |
| Quote/provenance-only correction | B02-0004, B05-0004, B06-0004, B07-0003, B08-0001, B08-0006 | 6/38 = 16% |
| Correct but incomplete or outdated (official detail missing) | B02-0001, B02-0002, B02-0005, B06-0002, B06-0003, B09-0002 (confidence understated) | 6/38 = 16% |
| No change beyond the v2 migration | the rest | 19/38 = 50% |

Official (T1) claims in wave 1 contained no false statements. They did contain one material omission (B04-0002). Errors concentrated in T3 commercial guides and in inferences.

### Leader pains (26 cards)

| Class | Pains |
|---|---|
| Frequency recount | D-0513: 19 → 22 (−3 off-topic, +6 new). D-0514: 7 → 6 (same author). D-0520: 6 → 7 (−1 duplicate, +2 new). D-0502: 5 → 4 (vendor page). D-0500: 9 → 10 (−1 inauthentic, +2). D-0501: 11 → 12. D-0519: 5 → 8. |
| Evidence removed as inauthentic | D-0500, D-0519. Fantastic-Body6519 is a templated persona across r/passive_income and r/whiteoutsurvival. |
| Status change | D-0519 bruto → **validada**. D-0523 → **descartada** (absorbed by the game). D-0516 gravity media → baixa (possibly obsolete). |
| New pains | D-0526 timezone, D-0527 language |

**Pain error rate:** 7/26 (27%) had a wrong frequency; 2/26 (8%) relied on an inauthentic source; 1/26 (4%) targets a problem already solved in game.

## 3. Top corrections

1. **Titles are handled in game.** Since 1.0.91 (Feb 2025) governors reserve "defender-class" titles for time slots. Kings and rulers can auto-approve and set durations. 1.0.94 added a CH-level requirement and "give up title". The B03-0002 / C01-0025 conflict is resolved, and D-0523 is discarded. Players: "With the last update, you don't need a title bot anymore" (1ioefp0, 2025-02).
2. **No official stats export found, but an official ROK Toolkit exists.**
   - ROK Steward's uploader lists scanner exports (HeroScrolls, StatsMaster, ROKStats, ROKToolKit, generic), so C02-0016's "in-game xlsx" inference is weakened.
   - Lilith runs an in-game **ROK Toolkit** (Notice Board, "tons of info about every Kingdom"; battle-roster upload → code since 1.1.02).
   - Its data and export scope is the #1 open question (L-B08-01) [B08-0003, B08-0007].
3. **Alliance Notes are public to all members** (1.1.07). They are not a private officer CRM [B04-0002].
4. **Vacation Permit** (1.0.87+): the king can remove governors from the SoC matchmaking score. This is an official, non-violent seeding lever that wave 1 missed [B03-0007; D-0520].
5. **Watchlist limits** (1.1.01): the top 50 by power (top 100 in Imperium kingdoms) cannot be watchlisted. Since 1.1.03 "rulers" manage it [B02-0002].
6. **Domains:** split by activity (1.0.91); 600 active governors per domain (1.1.01); roster import via ROK Toolkit (1.1.02) [B02-0001].
7. **KvK calendar:** Lilith said in Apr 2025 that it was building an in-KvK calendar. Pass timing is tied to Chronicles. All Reddit complaints predate Feb 2025 [B02-0005, D-0516].
8. **K2779 rule misread.** "Cross season immigrants should be in top 80" concerns reward eligibility (top ~168 get the best rewards), not exile [B06-0005].
9. **Scanner limits.** RokTracker honor, alliance and seed scans have no governor ID; the kingdom scan does. So honor data cannot be joined reliably [B08-0004; D-0502, D-0503].
10. **Also added** [B04-0005, B04-0006, B07-0004, B08-0008, B09-0002, B09-0003]:
    - Army Groups and markers
    - membership tools
    - comms tools: Bugle pins, language channels, voice chat, non-friend DM block (mitigates D-0515)
    - kingdom-power formula
    - SoC votes, coalitions, reward sharing, Camp Treaty (T3)

## 4. Cards created or retired

- **New fact cards (wave 2):**
  - B03-0007 Vacation Permit
  - B04-0005 Army Groups and markers
  - B04-0006 membership tools
  - B04-0007 Alliance Leadership achievements
  - B07-0004 official comms tools
  - B08-0007 ROK Toolkit
  - B08-0008 kingdom power formula (mirrors C04-0020)
  - B09-0003 Camp Treaty and coalition reward sharing
- **New pains:** D-0526, D-0527.
- **Retired:** D-0523 (descartada).
- **Final counts:** 46 B02–B09 cards and 28 leader pains.

## 5. Residual risks

- **Single channel.** Leader voice is still thin (≈ 10 self-identified leaders across all threads), and Reddit is the only T4 channel. Every `bruto` pain except D-0527 is single-channel.
- **Missing official notes.** 1.1.10–1.1.12 have no official English notes; Camp Treaty is T3 only.
- **Throttled searches.** Arctic Shift throttling blocked the NAP, "leader", "king" and "leadership" title searches. NAP evidence remains zero (L-B09-01).
- **Kingdom rule sites.** Only 2 exist and they share a template. The DKP-formula sample is effectively n = 2 kingdoms plus 1 tool default.

Gap files: `facts/B02…B09/_lacunas.md`. Interview guide: `raw/pains-leaders/_interview-guide.md`.
