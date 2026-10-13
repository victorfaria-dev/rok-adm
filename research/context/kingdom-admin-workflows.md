---
tema: "Kingdom admin workflows W1–W10 — who, when, tools, failure points, and which official in-game tools now cover parts"
dominios: [B02, B03, B04, B05, B06, B07, B08, B09]
gerado_em: 2026-10-13
fichas_base: [B02-0001, B02-0002, B02-0005, B03-0002, B03-0003, B03-0005, B03-0007, B04-0001, B04-0002, B04-0005, B04-0006, B05-0002, B05-0004, B06-0002, B06-0003, B06-0004, B06-0005, B07-0001, B07-0004, B08-0001, B08-0002, B08-0003, B08-0004, B08-0007, B08-0008, B09-0002, B09-0003, C01-0009, C01-0013, C01-0017, C01-0021, C04-0006, C04-0014]
cobertura: "Cleaned version of raw/pains-leaders/_admin-workflows.md after wave-2 verification. Official coverage re-checked against patch notes 1.0.74–1.1.09 (T1). Step lists are community practice (T3/T4) unless marked T1; they vary by kingdom. Missing: leader interviews (time per step), Discord/private practice, NAPs, timezone scheduling."
---

# Kingdom admin workflows (W1–W10)

Legend: **(T1)** = official mechanic (card cited). Other steps = community practice. **Covered** = an official tool now does part of the step. **Breaks** = pain card. Time costs are unknown unless stated. The only figure found is "2–3 hours of spreadsheet math per event" from one tool README [B08-0003].

## Summary (≤ 10 lines)

1. Ten recurring workflows make up kingdom administration. The **data loop** (W1→W3→W4) and the **people flow** (W4, W5) carry the highest stakes. **MGE** (W6) is the most frequent recurring dispute.
2. Since 2025, **official tools cover large parts** of these workflows:
   - W7 titles: almost fully [B03-0002]
   - W1/W2 Lost Kingdom entry: battle roster, Watchlist, ROK Toolkit roster codes [B02-0001, B02-0002, B08-0007]
   - W8 alliance housekeeping: Notes, Quick Checks, permissions, blocklist [B04-0001, B04-0002, B04-0006]
   - W2 combat coordination: Army Groups, markers [B04-0005]
   - W10 SoC votes and coalitions [B09-0002]
3. **Still not covered in-game:**
   - kingdom-wide DKP computation and publishing
   - requirements and exit lists
   - MGE allocation, ledger and enforcement
   - intake screening against kingdom rules
   - written rules and agreements between alliances
   - cross-timezone scheduling
4. **Single points of failure:** the data officer, the bot author and the king. Tool authors quitting is documented [D-0504, D-0519].

## Roles

| Role | Official powers (T1) | Community duties |
|---|---|---|
| King | titles and reservations, king skills incl. Watchlist, immigration cap and special approvals, battle roster and domains, Vacation Permits (SoC), Rest Mode vote, match vote [B03-0002, B02-0001, B02-0002, B03-0007, B06-0002, B09-0002] | chairs council; final say on purges and intake |
| Queen / General / PM ("rulers"?) | Imprison, Exile, Banish, Leader, Inspire (1.0.96); Watchlist management for "rulers" (1.1.03) [B03-0003, B02-0002] | title duty, enforcement backup across time zones |
| Alliance leader (R5) / Counselor | 6 permission categories per officer title; cancel building dismantles; notes, Quick Checks, markers, Army Groups [B04-0001, B04-0002, B04-0005] | council seat, recruiting, kicks |
| Officers (R4) | as permitted | rally/garrison leads, data officer, migration officer, territory planner, events/AoO (low-confidence practice [B02-0003]) |

## The workflows

### W1. Pre-KvK preparation (≈ 2–4 weeks before registration)

| Step | Who | Tools | Covered (official) | Breaks |
|---|---|---|---|---|
| 1. Agree kingdom rules: one leadership, territory/zone split, MGE policy, DKP formula and requirement | council (R5s, king) | Discord, Google Sites/Docs | — | D-0513 civil war; D-0501 no standard formula |
| 2. Baseline scan of top 300/600/1000 | data officer | RokTracker; ROKSTATS / Hero Scrolls / Botals; hired scanners | ROK Toolkit? (contents unknown) [B08-0007] | D-0504 fragile/ToS; D-0500 |
| 3. Publish per-governor requirements | council | Sheets, ROK Steward, stats bots | — | D-0501, D-0518 (newcomers don't understand DKP) |
| 4. Role roster: rally/garrison leads by troop type, flags, territory planners; recruit gaps | war leader, R4s | Discord, Reddit ads | in-game Recruitment Plaza (1.0.83, C04-0025) | D-0510 |
| 5. Seed check (SoC): top-300 tiered power | king/council | Hero Scrolls seeds, manual sums | formula is official [B08-0008]; Vacation Permits [B03-0007] | D-0520 (zeroing own players) |
| 6. Registration: domains, battle roster, watchlist | king | game | **yes** (T1) [B02-0001, B02-0002]; roster import code via ROK Toolkit [B08-0007] | D-0524 exclusions feel arbitrary |
| 7. Timeline of gates/passes/ruins | council | Sheets, Codex Helper, APO | promised official calendar (Apr 2025); Chronicles-tied pass timing [B02-0005] | D-0516 (evidence ≤2025-01; possibly obsolete) |

### W2. During KvK (each stage / pass fight)

| Step | Tools | Covered | Breaks |
|---|---|---|---|
| 1. Announce fight times (UTC) and targets | Discord, mail, chat | countdown markers (1.0.90), map command markers, raid-time mail (1.1.01), Bugle pins, voice chat [B07-0004, B04-0005] | D-0526 timezone exclusion |
| 2. Live rally/garrison coordination | in-game + voice | **Army Groups**: officer fields members' troops (SoC) [B04-0005]; Quick Checks [B04-0002] | weak evidence on language/timezone (D-0527) |
| 3. Stage snapshots: scan start/end, deltas; honor tracked separately | scanners, ROK Steward stage tags | — | D-0500, D-0502 (honor scans lack IDs, B08-0004), D-0503 |
| 4. Mid-KvK reviews, warnings, exceptions (e.g. zeroed-day deaths = 0) | sheets, DMs | — | D-0503 (manual exceptions) |

### W3. DKP calculation and post-KvK review

1. Final scan; join with the baseline by governor ID; clean OCR errors; merge alts onto mains [B08-0004, B08-0006].
2. Compute DKP with the kingdom formula (verified examples: T4×10 + T5×20/30 + dead×50/80). Compute % of requirement and assign tiers [B08-0001, B08-0002].
3. Publish the ranking (Sheets, Docs, PDF). Example: one council published 200+ governors with IDs on Google Docs (1hzdznp, 2025-01).
4. Decide outcomes: rewards (top-N KvK rewards, MGE slots, gold heads, DKP auction credits), probation, removal [B08-0006, B05-0004].
- **Covered:** nothing official beyond Acclaim totals [C04-0015].
- **Breaks:** D-0500 (recurring cost), D-0506/D-0525 (legitimacy), D-0503 (gaming).

### W4. Purge / exit management ("mandatory migration list")

1. Select low DKP among top-300 power, plus inactive or farm deadweight. Sometimes power is shed to drop a seed [B06-0005, D-0520].
2. Notify with a deadline (e.g. 2 weeks). Sometimes offer redemption (double DKP, a fine) [B03-0005].
3. Enforce: kick, then Watchlist (blocks Lost Kingdom entry; cannot target the top 50/100 by power), then zeroing [B02-0002, B03-0005].
4. Aftermath: revenge, sleeper cells, "UNSAFE DO NOT MIGRATE" posts [D-0507, D-0514].

**Covered and constraints:**
- Watchlist and Banish (T1) cover part of step 3.
- SoC home-kingdom territory protection limits zeroing inside other alliances' territory [C04-0014].
- Vacation Permits are a non-violent seed lever [B03-0007].
- The game gives no notice or appeal tooling.

### W5. Migration intake

1. Announce the window and requirements: power, KP/deads, CH25/T5, role slots, "fair MGE/DKP" pitch [B06-0004].
2. Review the applicant's form and profile screenshots: stats, commanders/equipment, spy risk, seed impact [B06-0004].
3. Check game constraints (T1):
   - CH16 and passports by power (T3)
   - 30-day cooldown (T3)
   - age limits (1.1.06)
   - same-season lock in new kingdoms
   - king's power cap and special immigration
   
   [B06-0001, B06-0002, B06-0003]
4. Assign an alliance (main, academy or farm) and verify in Discord (screenshot bots) [B07-0001].
5. Police unannounced arrivals [B03-0006].

**Covered and breaks:**
- Covered: eligibility checks are enforced by the game; Quick Approval and passlist help alliance joins [B04-0006].
- Breaks: D-0508 (no intake pipeline), D-0509 (rules churn; a mail sent and deleted in Aug 2026), D-0518.

### W6. MGE cycle (every MGE)

1. Choose the allocation model:
   - fixed by DKP/role
   - DKP auction
   - free-for-all
   - "rotation" (undocumented)

   [B05-0002, B05-0004]
2. Collect applications (Codex Helper questionnaire, 11 languages) and publish the top-N list plus point caps [B07-0001].
3. Monitor the leaderboard across the stages and contact anyone above their slot [B05-0003].
4. Punish breakers: kick, migrate, zero, or fine [B05-0003].

**Covered and breaks:**
- Covered: nothing official.
- Breaks: D-0505, D-0506 (hoarding perception), D-0522 (farms feeding points).

### W7. Titles (continuous) — **largely absorbed by the game**

1. Since 1.0.91 governors reserve court ("defender-class") titles for time slots. King and rulers approve, or enable auto-approval, and set durations. Since 1.0.94: a CH-level requirement per title and a "give up title" button [B03-0002].
2. Some kingdoms still run OCR title bots or chat queues. Players in 2025 called bots "redundant" after the update [D-0523, descartada].
- **Residual:** leadership titles (Queen/General/PM) and kingdoms not using reservations.

### W8. Alliance housekeeping (weekly)

1. Review activity (helps, donations, forts, chat, power growth) by sheet or bot, then kick or move members between main and academy [B08-0005].
   - Official: Quick Checks, Alliance Notes (**public to members**), member search, removal reasons [B04-0002, B04-0006].
2. Review officer permissions (6 categories); blocklist/passlist 200; dismantle countdown (cancellable by leader or counselor) [B04-0001].
3. Track fort/barbarian-rally participation (ROKSTATS fort tracker, screenshots). There is no official participation log [D-0502].
- **Breaks:** D-0511, D-0512, D-0514.

### W9. Event sign-ups (Ark of Osiris and other alliance events)

1. Sign-ups through reactions or forms; teams picked by role and UTC availability. Reminders 1/4/8 h before (Codex Helper) [B07-0001].
- **Covered:** Ark coordinator markers (1.0.90), voice chat [B07-0004]. Selection itself happens outside the game.
- **Breaks:** D-0517, D-0526.

### W10. Diplomacy (continuous)

1. **Inside the kingdom:** territory and flag allocation between alliances; academy/vassal deals [B09-0001, baixa].
2. **Across kingdoms (SoC)** [B09-0002, B09-0003]:
   - team-up
   - camp match vote (>80% to reject)
   - Rest Mode vote (>50%, pioneer)
   - coalition reward sharing (A+/S+)
   - Camp Treaty (pioneer, T3)
   - pass/holy-site transfers within a coalition
3. **Records:** live in DMs and screenshots only. NAP practice is undocumented.
- **Breaks:** D-0513, D-0521.

## Where official tools now stand (coverage matrix)

| Workflow | Official coverage (T1) | Remaining gap for third parties |
|---|---|---|
| W1/W2 Lost Kingdom entry | high (roster, Watchlist, Toolkit roster code) | transparent selection criteria, member notification |
| W2 combat coordination | medium (Army Groups SoC, markers, Quick Checks, voice) | cross-timezone scheduling, multilingual briefings |
| W3 DKP | **none** (Acclaim only) unless the ROK Toolkit holds stats | import, join, formula, ledger, publishing |
| W4 exits | low (Watchlist with exemptions, Banish) | notice/deadline/appeal workflow, decision log |
| W5 intake | low (eligibility enforced, special approval) | screening pipeline, rule-aware eligibility checker, seed preview |
| W6 MGE | **none** | allocation ledger, published caps, violation log |
| W7 titles | **high** | — (avoid) |
| W8 housekeeping | medium (Notes public, Quick Checks, permissions) | private officer notes, kingdom-wide roster, activity history |
| W9 events | low | availability by UTC slot, team balancing |
| W10 diplomacy | medium in SoC (votes, coalitions, Camp Treaty?) | intra-kingdom agreement registry, NAP terms |

## Divergences and uncertainties

- **Practice vs mechanics.** All non-T1 steps come from public posts, tool docs and two kingdom sites sharing a template. Kingdoms vary widely, and leaders are under-represented (sample bias).
- **ROK Toolkit.** Its contents could collapse W3 effort if it exposes kingdom stats [B08-0007].
- **Pioneer rollouts.** Several official items are pioneer-only and may not be live in a given kingdom: Rest Mode, Camp Treaty, the same-season immigration lock.
- **Time per step** is unmeasured.

## Lacunas

See `research/raw/pains-leaders/_interview-guide.md` for questions that close these:

- time per workflow
- tool stack per kingdom
- MGE rotation rules
- NAP practice
- timezone scheduling
- ROK Toolkit use
