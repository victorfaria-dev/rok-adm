# Sources — pains-leaders collector (B01–B09 + leader pains)

Collected 2026-10-13. Local IDs `PLxx` (this collector only; `research/fontes.md` not edited — the organizer should merge these). Where a global ID exists it is given.

| ID | Global | Source | Tier | Accessed / content dates | Access notes |
|---|---|---|---|---|---|
| PL01 | S05 | r/RiseofKingdoms via Arctic Shift archive API (`arctic-shift.photon-reddit.com/api/posts/search`, `/api/posts/ids`, `/api/comments/search?link_id=`) | T4 | posts 2023-12 → 2026-10-12 | reddit.com and old.reddit.com blocked for our fetcher; WebSearch refuses reddit.com. Arctic Shift works but full-text search times out (HTTP 422) for rare terms (inactive, NAP, burnout, timezone, council, R5, title) → those topics are under-sampled. Quotes pass through a summarizing fetcher (≤125 chars) — near-verbatim; recheck before publishing. |
| PL02 | S01 | Lilith official forum JSON API `forum-global.lilithgame.com/api/v2/posts/<id>` (account_id 10000000 = official) | T1 | patch notes 1.0.96 (2025-07-09), 1.1.00 (2025-09-30), 1.1.07 (2026-04-30) | HTML pages render empty; API works. Keyword search not supported. Official posts have few comments → little player voice. |
| PL03 | S08 | GitHub READMEs: iwbc/rok-scan-stats, Cyrexxis/RokTracker (+issues), daniellwdb/roka, mattspen/RoK-Title-Bot, TheMaxi7/RoK-discord-bots, GabrielOlC/Game-Data-Analytics-Engine, sovanna/rok-discord-data, mik132user/DiscordDKPbot, raikusy/rok-lost-toolkit, Kingdom3138/KvK-Dates-site, hellonewday/rok-kdp-api | T3 (tool docs) | 2022 → 2026-09 | via GitHub MCP search + WebFetch |
| PL04 | — | Kingdom 2779 rules site `https://sites.google.com/view/jlateam/kingdom-rules/dkp` | T3 (primary example of a kingdom's own rules) | undated (KvK2 era) | |
| PL05 | — | Kingdom 2708 rules site `https://sites.google.com/view/rok-2708/dkp-system` | T3 | undated (KvK1 era) | |
| PL06 | — (C01-0017) | ROK Steward `https://roksteward.com/app` | T3 (vendor) | 2026-10-13 | |
| PL07 | — (C01-0013) | ROKSTATS pricing `https://app.rokstats.online/pricing` | T3 (vendor) | 2026-10-13 | |
| PL08 | — (C01-0009) | Codex Helper `https://www.codexhelper.com/` | T3 (vendor) | 2026-10-13 | |
| PL09 | — (C01-0012) | Auctioneer Bot `https://zff.dev/juan_jm/auctioneer-bot` | T3 | last commit 2025-01-28 | |
| PL10 | — | Lootbar alliance guide `https://www.lootbar.com/blog/en/alliance-guide-how-to-choose-the-right-kingdom-and-team.html` | T3 (commercial) | 2026-07-07 | |
| PL11 | — | Heaven Guardian migration guide `https://heaven-guardian.com/rok-migration-guide-2026/` | T3 (commercial) | 2026-10-09 | |
| PL12 | — | Heaven Guardian titles guide `https://heaven-guardian.com/rise-of-kingdoms-titles-guide-to-maximize-your-buffs/` | T3 | 2026-10-02 | |
| PL13 | S04 | riseofkingdomsguides.com KvK guide + MGE guide | T3 | 2026-01-02 | patch log stale per context pack |
| PL14 | — | One Chilled Gamer KvK summary `https://onechilledgamer.com/rise-of-kingdoms-kvk-summary/` | T3 | 2022-03-24, upd. 2024-04-29 | old |
| PL15 | — | Hero Scrolls seeds page `https://www.heroscroll.com/rok/seeds` | T2/T3 | live, undated | |
| PL16 | — | KingdomOS `https://kingdomos.ai` | — | 2026-10-13 | login wall only |
| PL17 | — | kvk.gg | — | 2026-10-13 | login wall only |

## Blocked / gaps
- reddit.com (direct), YouTube (Google "sorry" redirect), riseofkingdoms.fandom.com (HTTP 402), pullpush.io (HTTP 429). Discord servers not accessible.
- No leader-authored long-form content (blogs/YouTube transcripts) obtained; leader voice comes from ~15 self-identified leader posts + tool READMEs.
- Sample bias: Reddit members (non-leaders, often kicked/zeroed players) dominate; leader pains are partly inferred from member complaints and from tool READMEs.

## Wave 2 additions (Sub-admin REINO, 2026-10-13)

| ID | Global | Source | Tier | Accessed / content dates | Access notes |
|---|---|---|---|---|---|
| PL02 (extended) | S01 | Lilith official forum JSON API — patch notes 1.0.74 (1561908), 1.0.87 (1817043), 1.0.89 (1868790), 1.0.90 (1896244), 1.0.91 (1935973), 1.0.92 (1963188), 1.0.93 (1994801), 1.0.94 (2030530), 1.0.95 (2056756), 1.0.96 (2081453), 1.0.98 (2102690), 1.0.99 (2124406), 1.1.00 (2139649), 1.1.01 (2161435), 1.1.02 (2179486), 1.1.03 (2197960), 1.1.04 (2213663), 1.1.06 (2219742), 1.1.07 (2232581), 1.1.08 (2246725), 1.1.09 (2259768); Q&A posts 1862964 (Nov 2024), 2013999 (Apr 2025); community posts 2183679 "The New Feature: ROK Toolkit!" (2025-12-20), 2205356 "New Achievements: Alliance Leadership" (2026-01-30) | T1 | 2023-09 → 2026-06 | `GET /api/v2/posts/<id>`; listing `GET /api/v2/posts?account_id=10000000&limit=50&offset=N` (832 official posts). Comments endpoint returned none for these posts. |
| PL18 | — | Fandom wiki via MediaWiki API `riseofkingdoms.fandom.com/api.php?action=parse&page=...&prop=wikitext` (pages: Events/The_Mightiest_Governor, edited 2026-01-15; Governor_Profile, edited 2025-12-02) | T2 (wiki, ~2 active editors) | 2025-12 → 2026-01 | HTML 403; API works |
| PL19 | — | LDShop blog 1.1.12 summary `https://www.ldshop.gg/blog/rise-of-kingdoms/halloween-guide.html` (Camp Treaty) | T3 (commercial top-up reseller) | 2026-09-22 | via W7 raw notes `research/raw/patches/ldshop-gg.md` |
| PL01 (extended) | S05 | Arctic Shift: `/api/posts/ids`, `/api/comments/search?link_id=`, `/api/comments/tree?link_id=t3_<id>` (full trees; `search` truncates/returns null for big threads), `/api/posts/search?title=<word>` (title search works when full-text `query=` times out). New threads used: 1hzdznp (council workload, 2025-01), 1ioefp0 (title bots redundant, 2025-02), 1akdypd (seed lowering, 2024-02), 1kvzfir/1kvzmm5, 1lbzmmj, 1cnjet2, 1n6chfg, 16u2ue2 (timezone), 1wfog9q, 1v0w6ts (language), 1sk7zuh (250% requirement), civil-war titles 1d5nnya, 1dehqu3, 1fblrxw, 1gnxl5h, 1ji0zu4, 1n3i9qx | T4 | 2023-09 → 2026-09 | API heavily throttled ("Timeout. Maybe slow down a bit"); NAP/leadership/king title searches failed repeatedly |

### Authenticity / independence notes (apply when counting frequency)
- **Fantastic-Body6519** (1ub5jmv, 1u9cc0j): templated persona posting "Update:"/"Venting:" stories across r/passive_income, r/whiteoutsurvival, r/RiseofKingdoms → excluded as evidence.
- **Wild-Technician-1645**, **Fancy-Investment-656**: restart-project recruiters; anti-"toxic leadership" posts are pitches.
- **Dorothy2023**: 38 RoK posts; appears in 5 cited threads → count once per pain.
- **Legal-Farm-8166**: frequent commenter across 3 cited threads (pro-leadership voice).
- **PL04 / PL05**: two kingdom rule sites built from the same template (identical exile sentence) → one norm, two parameter sets.
- **Heaven Guardian (PL11, PL12)** and **Lootbar (PL10)**: account marketplace / top-up sellers → conflict-of-interest flag.
