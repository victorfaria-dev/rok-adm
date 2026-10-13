# Raw: open-source RoK projects on GitHub

Source CS35: GitHub repository search `"rise of kingdoms"` (195 results) and `riseofkingdoms in:topics` (13), via GitHub API, accessed 2026-10-13. `pushed` = last push date from API (more reliable than "updated", which changes with stars). License = GitHub-detected SPDX.

| Repo | Stars | Last push | License | Archived | What it is | Method |
|---|---|---|---|---|---|---|
| Dylan-Zheng/Rise-of-Kingdoms-Bot | 148 | 2023-12-04 | MIT | no | Farming bot: quests/VIP/gifts, gather, donate tech, train, "pass verification" (captcha via 2captcha/haoi) | ADB + image recognition on emulator |
| KingRider/lyceum-of-wisdom | 121 | 2026-01-11 | none | no | Lyceum/Peerless Scholar Q&A (Portuguese) | data |
| nikolakis1919/RokTracker | 104 | 2025-11-29 | MIT | no | Kingdom stats scanner top 50–975 → .xls | BlueStacks 5 + ADB + Tesseract OCR |
| Cyrexxis/RokTracker | 104 | 2026-06-15 | MIT | no | Fork/successor: kingdom/alliance/honor/seed scans, v6 | BlueStacks 5 (1600x900, DPI 450) + ADB + tessdata |
| GabrielAgrela/ROKBOT | 79 | 2023-10-15 | none | no | Barbarian farming bot | automation |
| yuceltoluyag/Rise-of-Kingdoms-Bot | 77 | 2026-07-05 | MIT | no | Fork of Dylan-Zheng bot | automation |
| GabrielAgrela/OSROKBOT | 74 | 2023-12-28 | none | no | "Multi-feature bot" | automation |
| TheMaxi7/RoK-discord-bots | 48 | 2024-05-15 | MIT | no | Discord bots collection | — |
| daniellwdb/roka | 37 | 2025-06-21 | MPL-2.0 | yes | Titles + DKP via Discord; deprecated because game added own title system | ADB/OpenCV |
| rokmonster/ocr | 26 | 2026-06-23 | GPL-3.0 | no | OCR engine; "By analyzing screenshots we can extract various data points such as governor power, deaths, kills and more." | screenshots + Tesseract |
| carmelosantana/rok-monster-ocr | 24 | 2022-05-01 | MIT | yes | PHP predecessor | OCR |
| sonpiaz/4x-game-agent | 21 | 2026-03-15 | MIT | no | LLM agent framework for 4X games incl. RoK ("OCR → FSM → World Model → Workflows → LLM Vision") | ADB automation |
| thesimonho/rok-data | 18 | 2019-06-15 | GPL-3.0 | no | "Code used to analyze data for Rise of Kingdoms" (commander pairings analysis) — no dataset listed | — |
| thesimonho/rok-talents | 14 | 2025-05-18 | GPL-3.0 | no | roktalents.com talent builder | web |
| iwbc/rok-scan-stats | 11 | 2024-05-06 | GPL-3.0 | yes | KvK stats collection script (JP: "the No.1 thing everyone asks why it isn't official") | OCR |
| avweigel/rok-suite | 10 | 2026-10-07 | (README: MIT) | no | Kingdom admin web suite | uploads + Supabase |
| Nexor256/RoK-Tracker | 8 | 2026-10-12 | MIT | no | "Automate kingdom, alliance, and honor scanning using OCR and ADB with a modern desktop app" (Tauri/Vue) | ADB + OCR |
| feels-dev/RokVision | 7 | 2026-03-07 | MIT | no | "cognitive OCR API for Rise of Kingdoms screenshot data" (PaddleOCR, .NET) | screenshot OCR |
| Douk1NG/gathering-of-heroes-calculator | 7 | 2026-02-13 | GPL-3.0 | no | event calculator | web |
| sovanna/rok-data-collector | 3 | — | — | no | extracts data from user screenshots → xlsx (search summary) | screenshots |
| k8731/Rise-Of-Kingdoms-Alliance-Contribution-Tracker | 1 | — | — | no | "extract and organize ... player stats from screenshots using OCR" | screenshots |
| Arsovic/rok-timer-bot | 1 | — | MIT | no | timer bot with OCR + Telegram notifications | OCR |
| rokbattles/rokbattles | 13 | (updated 2026-10-13) | MIT/Apache-2.0 | no | battle report platform | PC mailcache folder watcher |
| mattspen/RoK-Title-Bot | 5 | — | — | no | Discord title bot | ADB + cv2 + Tesseract |
| JulianFleckDev/Rise-of-Kingdoms-Bot | 1 | — | — | no | auto-clicker, topics include "cheatgaming" | click recording |

## README notes
- CS38 Dylan-Zheng README: "Use it at your own risk!" / "I don't know will your account be banned by using it!"; developer no longer maintains; last version v1.4.3 dated 06/07/2021.
- CS36 Cyrexxis/RokTracker README: requires BlueStacks 5 at 1600x900, DPI 450, ADB on, game in English; no ToS/ban disclaimer.
- CS37 nikolakis1919/RokTracker README: "No move should be made in this window until scanning is done."; your account must rank below the scanned range, "so a farm account may be needed"; no ToS warning.
- CS39 roka: "not affiliated, endorsed, or associated with Rise of Kingdoms"; "at your own risk".

## Observations
- Two families: (a) **automation bots** (farm/gather/barbs/titles) — clearly in ToS 17.1.15/17.1.18 territory; (b) **ranking scanners** (ADB-driven navigation + OCR of leaderboards) — also automated access (17.1.7/17.1.15), and they collect other players' names/IDs (17.1.13). (c) **screenshot OCR** of user-supplied images (rokmonster, RokVision, rok-data-collector) — no automated game access by the tool itself.
- No open dataset of commanders/talents/buildings was found on GitHub (searches "rise of kingdoms commanders json data", "rok commanders dataset" → 0 results).
- Scanner repos are fragile: fixed emulator resolution/DPI, English client, no touching the window.
