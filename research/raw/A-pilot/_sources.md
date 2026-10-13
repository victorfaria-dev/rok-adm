# Sources used by the A-pilot collector (domains A01, A04, A05, A09, A10, A14) — 2026-10-13

Proposed IDs: existing IDs from `fontes.md` are reused (S01, S02, S03, S04, S05). New sources get **provisional IDs SP01–SP05** (P = pilot) to avoid collisions with agents running in parallel; the orchestrator should renumber them when merging into `fontes.md` (cards reference SP0x).

| ID | Source | URL(s) | Proposed tier | Last updated (visible) | Accessible? | Notes |
|---|---|---|---|---|---|---|
| S01 | Lilith official RoK forum (official account 10000000) | https://forum-global.lilithgame.com/rok/post/<id>/ ; API /api/v2/posts?account_id=10000000 | T1 | latest EN post 2026-06-23 (1.1.09) | yes (JSON API; tip from coordinator) | Patch notes only describe changes; no base tables. 832 posts keyword-searched. |
| S02 | Rise of Kingdoms Wiki (Fandom) | https://riseofkingdoms.fandom.com/wiki/... | T2 | per page: CH Requirements 2026-01-04; VIP 2026-08-02; Civilizations 2025-12-04; Daily Objectives **2020-01-11**; Peerless Scholar 2023-04 (obsolete); Goldmine 2019-02 | HTML **no** (402/403); **yes via MediaWiki API** `api.php?action=parse&prop=wikitext` | Build times stated as "raw values [...] provided by the game developers". Some pages stale vs patches (VIP production, Peerless, Daily Objectives). |
| S03 | rok.guide | https://www.rok.guide/buildings/city-hall/ | (T2 expected) | — | **no** — DNS/CONNECT 502, "connect_rejected (organization policy)" | Not used. |
| S04 | riseofkingdomsguides.com | /rise-of-kingdoms-city-hall-requirements-and-cost/, /<building>/, /shop/, /rise-of-kingdoms-gems/, /where-to-spend-gems-in-rise-of-kingdoms/, /how-do-you-get-vip-points-in-rise-of-kingdoms/, /rise-of-kingdoms-action-points/, /rise-of-kingdoms-barbarians-and-barbarian-forts/, /how-to-get-speedups-in-rise-of-kingdoms/, /rise-of-kingdoms-best-civilization-tier-list/, /how-to-gather-a-lot-of-gems-in-rise-of-kingdoms/ | T3 | WP "modified" 2026-01-02 for nearly all posts (bulk re-save — not a review date) | yes (curl); /vip-guide/ behind bot check | Copies Fandom tables (shared typo); some tables stale (Hospital). Internal contradictions (Books of Covenant). |
| S05 | Reddit r/RiseofKingdoms | reddit.com, old.reddit.com, mirrors | T4/T3 | — | **no** — 403 (curl), WebFetch refuses reddit.com; redlib mirrors 404/SSL error | Biggest coverage gap for F2P gem/time logs. |
| SP01 | Gamer Empire — City Hall guide | https://gamerempire.net/rise-of-kingdoms-city-hall-guide-upgrade-requirements-rewards/ | T3 | published 2021-04-08, modified 2024-05-24 | yes | Partly independent of Fandom (different typos/values). |
| SP02 | BlueStacks blog (F2P guide, FAQ) | https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-free-to-play-guide-en.html ; .../rok-faqs-en.html | T3 | 2021-03-02 / 2021-02-10 | yes | Old; VIP 7 builder claim wrong; jumping advice obsolete. |
| SP03 | LootBar blog (daily routine, F2P progression) | https://www.lootbar.com/blog/en/daily-routine-guide-rise-of-kingdoms.html ; .../rise-of-kingdoms-free-to-play-progression-guide-grow-efficiently.html | T3 (commercial bias: sells gem top-ups) | 2026-06-30 / 2026-06-22 | yes (2nd only via WebFetch) | Recent but generic; no numbers for time. |
| SP04 | AllClash — gathering guide | https://www.allclash.com/the-only-rise-of-kingdoms-gathering-guide-you-really-need/ | T3 | published 2020-02-21, modified 2026-08-23 | partial — curl gets JS shell/403 on search & sitemaps; WebFetch works (quotes ≤125 chars) | Other AllClash RoK pages could not be enumerated. |
| SP05 | Lyceum of Wisdom / Peerless Scholar quiz answers (compiled by riseofkingdomsguides) | https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/ | T2 (official quiz text, fan transcription) | modified 2026-10-01 | yes | Several answers independently confirm Fandom values (Hospital Lv15, AC Lv20, builder VIP6). |

## Tried and not usable
| Source | URL | Result |
|---|---|---|
| appgamer.com strategy guides | https://www.appgamer.com/rise-of-kingdoms/strategy-guide/daily-objectives (and others) | 403 |
| allclash.com search / sitemap | https://www.allclash.com/?s=... , /sitemap_index.xml | 403 |
| web.archive.org (for rok.guide) | https://web.archive.org/web/2025/https://www.rok.guide/... | connection reset |
| Spam/"gem generator" pages in search results | various | excluded deliberately |
