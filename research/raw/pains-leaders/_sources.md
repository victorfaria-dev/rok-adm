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
