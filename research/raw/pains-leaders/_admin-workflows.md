# Recurring kingdom / alliance admin workflows

> **Superseded (wave 2, 2026-10-13):** the verified and cleaned version is `research/context/kingdom-admin-workflows.md`. Corrections: W7 titles are now largely handled by the official title-reservation system (1.0.91); Alliance Notes are visible to all members; the ROK Toolkit (official) may cover parts of W1/W3. Kept as raw history.

Synthesized 2026-10-13 from raw notes in this folder, fact cards B01–B09 (pains-leaders), C01/C04 cards and the context packs. "Breaks" link to pains (D-05xx). Confidence: steps marked (T1) are official mechanics; the rest is community practice (T3/T4), varies by kingdom.

## Roles (typical)

| Role | Who | Main jobs |
|---|---|---|
| King | leader of the alliance that holds the Lost Temple / elected in SoC | titles, king skills (Imprison/Exile/Banish/Leader/Inspire; Watchlist), immigration power cap & special approvals, LK registration (domains, battle roster), Rest Mode vote (T1) |
| Queen / General / PM | king's appointees | hand out court titles; since 1.0.96 can use the core king skills (T1) |
| Council | R5s (sometimes R4s) of the top alliances | rules, DKP formula, MGE list, purge list, diplomacy |
| R5 / R4 / Counselor / officers | alliance leadership | permissions in 6 categories (T1), recruiting, kicks, Alliance Notes, Quick Checks, Army Groups (SoC) |
| Functional officers (community) | volunteers | Data/scan officer, Migration officer, Title officer, Territory planner, Diplomacy, Events (AoO), War leader, Rally/Garrison leads by troop type |

---

## W1. Pre-KvK preparation (≈ 2–4 weeks before registration / Eve of the Crusade)
1. Council meets (Discord) and agrees kingdom-level rules: one leadership team, zone/territory split, MGE policy for the season, DKP formula & requirement. *Breaks:* rival alliance refuses → civil war (D-0513); no standard formula (D-0501).
2. Baseline scan: data officer runs a scanner or buys a scan (top 300/600/1000): power, KP, T4/T5 kills, deads per governor ID. *Tools:* RokTracker (emulator+ADB+OCR), ROKSTATS/Hero Scrolls/Botals, hired scanners ($5–7/scan). *Breaks:* fragile/costly/ToS (D-0504).
3. Requirements published per governor (DKP or dead+kill target as % of power, tiers/groups, exclusions for farms). *Tools:* Google Sheets, ROK Steward PDF/links, bots that answer `/stats <id>`. *Breaks:* opaque/unfair perception (D-0501), farms/alts (D-0522).
4. Role roster: rally leads, garrison leads (by troop type), open-field, flag team, territory planners; recruit gaps from other kingdoms. *Breaks:* recruiting (D-0510).
5. Seed check (SoC): sum top-300 tiered power; decide whether to shed or add power. *Breaks:* seed management, zeroing own players (D-0520).
6. Registration (T1): king activates/registers domains, sets battle roster (single-domain), watchlists unwanted governors. *Breaks:* exclusions feel arbitrary (D-0524).
7. Timeline: find/build the spreadsheet of gate/pass/ruin/altar openings for this story; set reminders. *Tools:* Sheets, Codex Helper, APO. *Breaks:* D-0516.

## W2. During KvK (each stage / pass fight)
1. Announce fight times (UTC) and targets via Discord, in-game mail, coalition markers (T1, 1.1.07).
2. Rally/garrison coordination live in-game + voice/Discord; Army Groups let one officer move members' troops (SoC, T1). *Gap:* timezone/language coordination evidence weak.
3. Stage snapshots: scan at start/end of stage → deltas (ROK Steward "Delta is the default"); track honor separately; fort/barb-rally participation if tool supports. *Breaks:* D-0500, D-0502, D-0503 (trades, zeroing outside fights).
4. Mid-KvK reviews: warn underperformers, adjust requirements, apply exceptions (e.g. zeroed during bad trade → deaths count 0). *Breaks:* exception handling is manual (D-0503).

## W3. DKP calculation & post-KvK review
1. Final scan; join with baseline by governor ID; clean OCR errors (quarantine nulls, negatives, missing IDs); merge alts onto mains.
2. Compute DKP (e.g. T4×10 + T5×20–30 + dead×50–80) and % of requirement; tiers: super pass / pass / barely / fail.
3. Publish ranking (Sheets, Power BI, PDF with traffic lights).
4. Outcomes: rewards (top ~N KvK rewards, MGE slots, gold-head events, DKP auction credits); probation; removal list. *Breaks:* "2–3 hours of spreadsheet math per event" (D-0500); legitimacy (D-0506, D-0525).

## W4. Purge / exit management ("mandatory migration list")
1. From W3 tiers, select low-DKP & high-power (often top-300 power) governors and inactive/farm deadweight; optionally reduce power for a lower seed.
2. Notify (DM/mail/Discord) with deadline (e.g. 2 weeks); offer redemption (double DKP next time / fine) sometimes.
3. Enforce: kick from alliance, watchlist (T1), then zeroing by top alliances; "hunt until they leave".
4. Aftermath: revenge, sabotage, "UNSAFE DO NOT MIGRATE" posts, sleeper cells. *Breaks:* D-0507, D-0514, D-0525.

## W5. Migration intake
1. Announce window and requirements (Reddit/Discord recruitment posts: power, KP/deads, CH25/T5, role slots; "fair MGE/DKP" pitch).
2. Applicant sends profile screenshots / form to migration officer or king; officer checks stats, commander/equipment, spy risk, seed impact.
3. Game constraints checked: CH16, passports by power, 30-day cooldown, account-age & season limits (C04-0008), king's power cap; special immigration approved by king (T1). *Breaks:* rules change often (D-0509).
4. Assign alliance (main vs academy/farm alliance) and Discord verification (screenshot bots). 
5. Police unannounced arrivals (locate, warn, zero). *Breaks:* D-0508, D-0518.

## W6. MGE cycle (per MGE event; recurring every few weeks)
1. Decide allocation for this MGE: fixed list (by DKP/KvK stats, rally/garrison role, rotation) or free-for-all (off-season / family alliances); sometimes DKP auction (lowest winning bid).
2. Collect applications (Codex Helper questionnaire, 11 languages) → publish top-N list and point caps.
3. Monitor the in-game leaderboard during the 6 stages; contact anyone over their slot.
4. Punish breakers (kick/migrate/zero/fine). *Breaks:* D-0505, D-0506, farms feeding points (D-0522).

## W7. Titles (continuous)
1. Governors post coordinates + desired title in title channel (kingdom chat / Discord / bot).
2. Title officer (Queen/General/PM or bot via OCR+ADB) assigns; queue/time limits per kingdom; lock titles during events. *Breaks:* manual queue (D-0523, low); bots are ToS-risky; game partly absorbed it (C01-0025).

## W8. Alliance housekeeping (weekly)
1. Activity review (helps, donations, forts, chat, power growth, Acclaim) via spreadsheet/bot → kicks or moves between main/academy. Since 1.1.07: Alliance Notes + Quick Checks (T1).
2. Officer permissions review (6 categories, T1); blocklist (200).
3. Fort/barb-rally participation tracking (ROKSTATS Fort Tracker, screenshots). *Breaks:* D-0511, D-0512, D-0514.

## W9. Events sign-up (Ark of Osiris, other alliance events)
1. Signup via reactions/forms; pick teams by role and availability (UTC slot).
2. Reminders 1/4/8 h before (Codex Helper). *Breaks:* D-0517.

## W10. Diplomacy (continuous)
1. Inside kingdom: territory/flag allocation between alliances; academy/vassal arrangements; coalition markers.
2. Across kingdoms (SoC): camp coalitions (4 starting alliances), matchmaking reject vote (>80%), Rest Mode vote (>50%), Camp Treaty (pioneer). NAPs between kingdoms: practice not documented in reachable sources.
3. Records live in DMs/screenshots only. *Breaks:* D-0513, D-0521.

## Where it breaks — summary
- **Data plumbing** (W1.2, W2.3, W3): DIY scanning + spreadsheets; no official export; data gameable.
- **Legitimacy** (W3.4, W4, W6): decisions with high stakes for members, no transparent record.
- **Rules distribution** (W5, W6, W7): unwritten, chat-based, multilingual.
- **Game-rule churn** (W5.3, W1.5): migration and seeding rules change every few patches.
- **Single points of failure:** the "data officer" or the bot author; when they quit, the workflow collapses.
