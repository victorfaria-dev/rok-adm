# Sources used by the A-economy collector (A03, A12, A13)

Accessed 2026-10-13. Do not edit `research/fontes.md` from here. IDs `SAxx` are **provisional** and should be merged into `fontes.md` (next free IDs) by the coordinator. S01/S02/S04 reuse the existing IDs.

| ID | Source | Tier | Access method | Dates | Notes |
|----|--------|------|---------------|-------|-------|
| S01 | Lilith official forum, RoK account 10000000 — https://forum-global.lilithgame.com/api/v2/posts?account_id=10000000 | T1 | public JSON API (832 posts) | posts 2021-03-04 (1.0.44), 2021-04-27, 2024-07-23 (1.0.84), 2024-12-31 (1.0.90), 2026-06-23 (1.1.09) | Patch notes; tip from another agent. |
| S02 | Rise of Kingdoms Fandom wiki — https://riseofkingdoms.fandom.com | T2 | MediaWiki API (`api.php?action=parse&prop=wikitext`); HTML returns 402/403 | page revisions 2018-12 → 2026-09 (per card) | Build times "provided by the game developers" per editor note. Some pages very old (2018–2020). |
| S03 | rok.guide | T2/T3 | **not accessible** (DNS EAI_AGAIN) | — | Gap. |
| S04 | riseofkingdomsguides.com | T3 | curl HTML + WebFetch; some pages bot-protected on refetch | originals 2021–2022; all `dateModified` 2026-01-02 (visible "January 2, 2026" is the modified date) | Unofficial fan site; tables sometimes outdated (Trading Post capacity). |
| S05 | Reddit r/RiseofKingdoms | T4 | **blocked** (bot wall; mirrors 404) | — | Only a 2019 F2P-guide snippet via search (SA09). |
| SA01 | allclash.com (gathering guide; farm account; gold) | T3 | curl HTML, verbatim | pub 2019-11-23 / 2020-02-21; mod 2026-08-23 | Older content, 2019–2020 game state. |
| SA02 | heaven-guardian.com (farm account; trading post; spending) | T3 | WebFetch (2 pages) + curl (1 page) | 2026-09-18, 2026-10-02, 2026-10-07 | Account marketplace / top-up seller — conflict of interest; spending page states it copies a "source guide". |
| SA03 | Pocket Gamer — https://www.pocketgamer.com/rise-of-kingdoms/resources/ | T3 | curl HTML | 2022-11-04 | |
| SA04 | Theria Games — https://theriagames.com/?p=50361 | T3 | curl HTML | 2025-02-07 | Claims gold not transferable. |
| SA05 | LootBar blog — https://www.lootbar.com/blog/en/rise-of-kingdoms-spending-guide-by-budgets.html | T3 | curl HTML | 2026-03-20 (mod 03-23) | Seller site. |
| SA06 | Packsify — https://www.packsify.com/blogs/rise-of-kingdoms-growth-fund-monthly-pass | T3 | WebFetch | 2026-03-21 | Seller site, whale-oriented, no figures. |
| SA07 | Old Man Duck "School of RoK" — https://oldmanduck.wordpress.com/school-of-rok/collecting-resources/ | T3 | WebFetch | undated (images 2020-03) | |
| SA08 | AppGamer Q&A — https://www.appgamer.com/rise-of-kingdoms/answers/15958-i-have-2-accounts-in-a-kingdom-am-i | T4 | search snippet only (403) | unknown | Unverified. |
| SA09 | Reddit F2P guide 2019 — https://www.reddit.com/r/RiseofKingdoms/comments/b3vxwr/free_to_play_f2p_guide | T4/T3 | search snippet only | 2019-03-21 | Unverified, likely obsolete. |
| SA10 | Boostroom blog — https://boostroom.com/blog/rise-of-kingdoms-farming-guide-best-ways-to-farm-resources-gems-and-speedups | T3 | WebFetch | 2026-09-02 | Boosting-service seller. |

Also read (no new ID): `research/context/game-state-and-patch-timeline.md` and `research/facts/C04/C04-0004, -0009, -0014, -0016` (other agents) for obsolescence checks.

## Quote-verification method
- "verbatim" = string located in downloaded HTML/wikitext/JSON.
- "(WebFetch)" / "(WebFetch summary)" in a card's `trecho` = text returned by the fetch summarizer; must be re-checked by the Verifier. One summarizer error was caught (riseofkingdomsguides storehouse columns swapped).
