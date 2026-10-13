# Raw notes — admin tools (GitHub READMEs, services) — what problem they solve

Accessed 2026-10-13. Purpose: understand leader problems implied by tools (NOT competitor analysis — see research/context/competitors-and-constraints.md and facts/C01 for that).

## iwbc/rok-scan-stats (GitHub, archived; created 2022-01, Python, OCR)
- Description (JP): "Rise of Kingdoms なぜ公式で用意しないのかランキング圧倒的No.1のKvK戦績収集を自動化するスクリプト"
- Translation: "A script that automates KvK battle-record collection — overwhelmingly No.1 in the ranking of 'why doesn't the official game provide this?'"
- → leaders consider per-player KvK stats collection a missing official feature.

## Cyrexxis/RokTracker (GitHub; fork of nikolakis1919)
- "Open Source Rise of Kingdoms Stats Management Tool." Track top X of kingdom / alliance / honor leaderboards.
- Bluestacks 5 1600x900 + ADB + Tesseract OCR; clicks through governor profiles; exports xlsx.
- Kingdom fields: ID, name, power, KP, T1–T5 kills, T4+T5 kills, dead, RSS gathered, RSS assistance, helps, alliance.
- Limits: "Game Language must be English — other languages break inactive governor detection."; "Your rank must be lower than the number of players you want to scan." (needs a low alt); names approximate.
- Issues: #137 (2025-10-13) "how to use that Scanner?"; #77 crash on special-char path; #66 crash reconstructing kills. Support: "no guaranteed response time since this is a free-time project."
- Feature: validates kills vs KP, flags suspicious entries for manual review.

## daniellwdb/roka (archived 2026-03-17)
- "Rise of Kingdoms bot to manage kingdom titles and DKP through Discord." (ADB+OCR)
- "This project is deprecated due to the game having their own system to manage titles." / "DKP tracking still works but is no longer maintained."

## mattspen/RoK-Title-Bot ("Title Oracle", updated 2026-09)
- "designed to manage and automate title requests, registration, and title locking mechanisms."
- OCR reads in-game chat for requests: "The OCR script (read_chat.py) is executed periodically to read the in-game chat and process any title requests found."; admins lock titles; per-title timers.
- → even after in-game title system, title queueing/assignment still automated by bots (so the in-game system does not fully cover kingdom needs).

## TheMaxi7/RoK-discord-bots (48★; author quit game)
- Stats lookup by governor ID from spreadsheet; Ark (AoO) registration via reactions; Hall of Heroes screenshot → Google Sheet (deads verification); rokstats.online API lookup.
- "The development of new features and new bots is for now suspended since i quit the game." → hobby tools die when the leader-dev quits.

## GabrielOlC/Game-Data-Analytics-Engine (Excel/Power Query/VBA/Power BI; 2025-05)
- "Originally, this was done manually: disjointed scans, dirty data, and 2–3 hours of spreadsheet math per event."
- "Raw kill counts alone cannot capture true effort."
- "Zeroing events (players being wiped outside official war times) unfairly skewed death counts."
- "Raw data came from third-party Optical Character Recognition (OCR) scans of the game UI"
- "Eradicated subjective council disputes and accusations of favoritism"
- Workflow: block files F1.A/F1.B joined on Governor ID → delta; alt→main mapping; quarantine checks (nulls, negatives, missing IDs); score normalized to power; tiers (reward / probation / removal); CP (contribution points) economy with auctions & expiry; publish flattened data to public Power BI.

## sovanna/rok-discord-data; mik132user/DiscordDKPbot
- Discord bots that display governor stats from Google Sheets / sqlite per kingdom; "built for one kingdom".

## raikusy/rok-lost-toolkit
- "Create beautiful Rise of Kingdoms & Call of Dragons mail for event guides, KVK strategies, alliance and kingdom updates, MGE announcements with ease." → in-game mail formatting is a comms pain.

## Kingdom3138/KvK-Dates-site (2025-07) — static site listing KvK dates; Vincent-Michael/rokMapKvK (2025-10) — KvK map.
## hellonewday/rok-kdp-api — "Pre-kvk Data Importing API, with the help of OCR."

## Juan_jm/Auctioneer Bot (Codeberg, public 2025-01-28)
- DKP auctions in Discord reading DKP balances from Google Sheets; auctions MGE ranks, weekly Trophy rewards, "20 gold head" events; winners pay lowest winning bid.
- "No further development or bug fixes are planned unless the issues are simple and trivial."

## ROK Steward (roksteward.com/app)
- Upload scanner xlsx (HeroScrolls, StatsMaster, ROKStats, ROKToolKit, generic) → requirement sheets, scored reports, PDF w/ traffic lights, share link 90 days.
- Requirement modes: composite "(ReqDeads × 8) + (ReqKills × 1)" or single DKP target e.g. "400% of power"; flat or power-tiered; boost/penalty groups; excluded governors; stage tags (Passes 4–9, Kingsland, Ruins, Final). "Most reports compare what a governor did during the event, so Delta is the default."; "know their KvK targets before the event starts".

## ROKSTATS (app.rokstats.online/pricing)
- Modules: Title Manager (Discord bot, VIP queues, per-alliance whitelists), Player Finder, Fort Tracker (fort DKP), Alliance Tracker (migration logs who joined/left), War Map Planner, Managed KvK Scans & DKP; "from $10/mo"; KvK season from $25.
- Claims: "Troop threshold auto-kick: anyone under your march size is removed."; "Every rally recorded live: who led, who joined, how much each march contributed"; farms flagged & exempt.

## Codex Helper (codexhelper.com) — Discord bot, $5/mo Patreon
- MGE applications questionnaire (11 languages) w/ published rankings; Altar of Darkness / Ancient Ruins reminders (1/4/8h); event schedule tracker; KvK flag/timer tools; healing calculator; auto verification of alliance roles from governor profile screenshots; AoO signups.

## Reddit service ads
- 1fsiirf (2024-09-30): human "Kingdom Scanner for Hire": "$5/$7 for one scan of the Top 200/300"
- 1pbylf7 (2025-12-02): "BOT STATS" (ES) "Sistema DKP para premios y sanciones"
- 1kz4sty (2025-05-30): coaching "How your account can most effectively meet DKP requirement."
