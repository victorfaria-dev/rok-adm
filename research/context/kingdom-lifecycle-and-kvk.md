---
tema: "Kingdom lifecycle and KvK — what kingdom leadership must do at each stage (new kingdom → first KvK → SoC)"
dominios: [B01, B02, B03, B06, B08, B09, C04]
gerado_em: 2026-10-13
fichas_base: [B02-0001, B02-0002, B02-0005, B03-0002, B03-0003, B03-0007, B04-0002, B04-0005, B06-0002, B06-0003, B07-0004, B08-0007, B08-0008, B09-0002, B09-0003, B01-0001, B01-0003, B01-0500, B01-0503, B01-0504, C04-0002, C04-0005, C04-0007, C04-0008, C04-0013, C04-0014, C04-0015, C04-0020, C04-0026, C04-0031, C04-0033]
cobertura: "Leadership view of the lifecycle: official tools that unlock per stage (T1, patch notes 1.0.87–1.1.09 re-read 2026-10-13) and the leader tasks/pains per stage. Player-side progression and event timing are in CONTA's packs (early-kingdom-timeline-and-events.md, game-state-and-patch-timeline.md). Gaps: per-story KvK day tables, an in-game KvK calendar's existence, 1.1.10–1.1.12 official text, Camp Treaty content."
---

# Kingdom lifecycle and KvK (leadership view)

Companion packs: `game-state-and-patch-timeline.md` (stage table and patch history), `early-kingdom-timeline-and-events.md` (player events, day 0 → KvK1), `kingdom-governance-and-alliances.md`, `kingdom-metrics-dkp.md`, `kingdom-admin-workflows.md`. Pain IDs (D-05xx) point to `research/pains/`.

## Summary (≤ 10 lines)

1. A kingdom passes through **Preparation Season → Season 1 (KvK1) → Season 2 → Season 3 → Season of Conquest (SoC, repeating)**; KvK1 starts at about day 100 [B01-0500, C04-0007].
2. Leadership work grows by stage. **Pre-KvK** is about settling who leads (one council, no civil war) and recruiting. **From KvK1** the DKP/requirements/MGE/purge loop starts. **SoC** adds seeding, team-ups, votes and coalition diplomacy [D-0513, D-0501, D-0507, D-0520].
3. Lilith has shipped many **official leader tools since 2025**:
   - title reservation with auto-approval (1.0.91) [B03-0002]
   - shared king skills for Queen, General and PM (1.0.96) [B03-0003]
   - 6 officer permission categories (1.0.96) [B04-0001]
   - battle roster and Watchlist (1.1.00–1.1.03) [B02-0001, B02-0002]
   - Army Groups (1.1.01–1.1.02) [B04-0005]
   - roster import through the official **ROK Toolkit** (1.1.02) [B08-0007]
   - Alliance Notes and Quick Checks (1.1.07) [B04-0002]
   - Rest Mode vote (1.1.08) [B09-0002].
4. Many of these unlock **only from Season 1 or only in SoC**, so a brand-new kingdom's leaders have the fewest in-game tools exactly when the hierarchy forms [B04-0002, B03-0007, B04-0005].
5. Seeding is **official math**: tiered power of the top 300 governors [B08-0008]. **Vacation Permits** can take governors out of the SoC matchmaking score [B03-0007]. Some leaders instead zero their own players to drop a seed [D-0520].
6. Immigration windows and age limits were tightened in **March 2026** [B06-0003]. Jumping is gone (2025-03-26) [C04-0026]. Intake rules must be versioned by patch.

## Verified facts (by stage)

### Stage 0 — Preparation Season (day 0 → ~day 85–100)

Facts:
- **Starting provinces and age-matching.** New kingdoms start with 3 provinces (1.0.78) [C04-0033]. Matchmaking groups kingdoms by age [B01-0504].
- **No Beginner's Immigration.** It was unavailable to new accounts from 2025-03-26 [C04-0026], so early population comes from new players plus later immigration rules.
- **Kingship comes from the Lost Temple.** The king holds the title system: assigns Queen, General and PM [B03-0001]. Court titles can be reserved by players and auto-approved by the king or "rulers" since 1.0.91 [B03-0002].
- **Queen, General and PM share the core king skills** (Imprison, Exile, Banish, Leader, Inspire) since 1.0.96 [B03-0003]. Leadership can therefore be spread across time zones.
- **Pre-KvK alliance tools are limited.**
  - Available: officer permissions, blocklist/passlist, Quick Approval, removal reasons [B04-0001, B04-0006].
  - Not yet: Quick Checks unlock only when the kingdom enters Season 1 [B04-0002].
- **In-game comms that already work:**
  - Kingdom Bugle (pinned statement in kingdom chat) [B07-0004]
  - language chat channels across the season [B07-0004]
  - voice chat in alliance and group chats [B07-0004]

Leader tasks (community practice, low confidence — see Divergences): form one leadership council, split territory and flags between alliances, set MGE policy, recruit role holders.

Pains at this stage:
- civil war between top alliances before KvK1 [D-0513] (e.g. "Need advice to avoid civil war before KvK1", 2026-04)
- coercion of small alliances [D-0521]
- dead alliances and inactive members [D-0511]
- Day-1 top alliances set power minimums that rise daily and kick members who fall below them [T4, not carded].
  - 1rhmw0n (2026-03-01): "the top alliances are already requiring 100k power to join".
  - 1rjnce9 (2026-03-03): "Next day in the morning, I’m kicked".

  This is an early-kingdom roster-churn task for R4s, with no tooling found.

### Stage 1 — Season 1 / KvK1 (≈ day 100 onward)

Facts:
- **How the Lost Kingdom opens.**
  - Kingdoms are split into domains by activity level (1.0.91).
  - Since 1.1.01 a domain unlocks at 600 active governors and holds up to 600 [B02-0001].
  - Single-domain kingdoms have a **battle roster**: the king selects participants (1.1.00). It can be imported via a code from the **ROK Toolkit** (1.1.02) [B02-0001, B08-0007].
- **Watchlist** (1.1.00, king skill):
  - Blocks a governor from entering the Lost Kingdom and shows their city.
  - Cannot target the top 50 by power (top 100 in Imperium kingdoms), but anyone under 50M power can be targeted (1.1.01).
  - Since 1.1.03 "rulers" can manage it too [B02-0002].
- **Quick Checks** become available (alliance-wide readiness confirmation) [B04-0002].
- **Lost Kingdom entry timing.** Pre-KvK now overlaps the Lost Kingdom opening (1.1.12, T3) [B01-0503, C04-0002].
- **Pass timing.** Pass openings follow Lost Kingdom Chronicles chapters. Pioneer rule in two stories: passes open 13 h after the chapter ends (1.1.02). 1.1.12 (T3) fixes key chapters to Fri–Sat 12:00 [B02-0005].
- **Immigration in Season 1.** New kingdoms are restricted from same-season immigration until the end of Season 1 (1.1.06, pioneer rollout) [B06-0003].

Leader tasks:
- set DKP formula and requirements before the KvK starts [B08-0001, B08-0002]
- take baseline and stage scans [B08-0003]
- assign roles: rally and garrison leads by troop type [B02-0003, low confidence]
- hold fixed fight times in UTC [B02-0004, low confidence]
- select the battle roster [B02-0001]

Pains at this stage:
- requirements are opaque and reach first-KvK players unexplained [D-0501, D-0518]. Example: a 10.5M player mailed a 250%-of-power target without knowing what DKP is (2026-04).
- DKP computation [D-0500]
- timezone exclusion [D-0526]
- deciding who enters the Lost Kingdom [D-0524]

### Between seasons — post-KvK review and migration windows

- **Requirements bite after each KvK.** Results are compared to requirements, then tiers and a "mandatory migration list" follow [B06-0005; D-0507].
- **Immigration rules (1.1.06):**
  - Cross-season age limits: ≤80 days older than the target kingdom for Season 2, ≤120 days for Season 3.
  - Same-season into a first-story SoC kingdom: ≤150 days [B06-0003].
- **Special immigration** above the king's power cap is approved by leadership. Records reset after a Kingdom Merger (1.1.03) [B06-0002].
- **Passport Pages:** bought from the Alliance Shop "Weekly Limit" section (1.0.89), storage up to 75 (1.0.99) [B06-0001].

### Stage 2–3 — Season 2 and Season 3

- **Season 3 story.** Season 3 is moving to King of All Britain (pioneer May 2026; T3 says standard by Sep 2026) [C04-0007].
- **New officer titles.** 8 new officer titles exist for Season 3 and SoC (1.0.96) [B04-0001].
- **Seed choices start to dominate leadership decisions as SoC approaches** [D-0520]. Leaders tracked toward Imperium or B seed by purging or recruiting. Example: "My kingdom is kicking out a bunch of people because they want to be an imperium seed" (2025-05).

### Stage 4+ — Season of Conquest (CH25 to register)

**Seeding**
- Kingdom power for matchmaking counts each governor's power in tiers: 100% up to 150M, 80% for 150–300M, 50% for 300–500M, 0% above 500M. Only the top 300 governors count. The Imperium threshold is 23.5B [B08-0008, C04-0020, B01-0001].
- **Vacation Permit:** the king issues it in SoC. The holder is excluded from the matchmaking score and confined to the starting province. Permits can be revoked. The monthly allowance depends on activity [B03-0007].

**Matchmaking and diplomacy**
- **Team-up phase:** teams of 2 or more kingdoms with ≥150 active governors. Team power = top-300 sum, capped at the top-24 kingdoms [B09-0002].
- **Match vote:** a camp refuses its match when more than 80% of its votes reject it [B09-0002].
- **Forced matching:** kingdoms that hit the skip limit are forced into a story in the by-election phase [B01-0003, C04-0013].
- **Coalitions** start with 4 alliances (1.1.03) [B09-0002].
- **Rest Mode vote:** passes with more than 50% of kingdoms in favour (pioneer 1.1.08) [B09-0002].
- **Coalition rewards:** at A+ tier, coalition leaders distribute Autarch Testimonies. At S+, the Great Ziggurat coalition can share a Star of Champions [B09-0003].
- **Camp Treaty:** a pioneer in 1.1.12, known from T3 only [B09-0003].

**Combat and control**
- **Army Groups:** an officer controls troops lent by members (all SoC alliances since 1.1.02). There are also map markers with commands and teleport markers [B04-0005].
- **Home-kingdom territory protection** in SoC (1.1.03): cities inside other alliances' territory can't be attacked [C04-0014].
- **Acclaim** is the official contribution metric, earned from wounds and kills dealt and suffered [C04-0015].

**Rules enforcement**
- **Conduct Score** penalises third-party scripts and cheats. It started in SoC kingdoms (1.1.07) [C04-0006].

## Recommendations by profile and stage (leadership)

Strategy confidence for leadership practice is generally `baixa` (public sources are mostly member voice). Each item below is therefore phrased as a **verified official lever** plus the pain it addresses, not as consensus advice.

| Stage | Official lever to use (T1) | Addresses | Cards |
|---|---|---|---|
| Pre-KvK | Enable title reservation with auto-approval, CH-level requirement and duration. Replaces manual title queues and title bots. | D-0523 (now discarded) | B03-0002 |
| Pre-KvK | Appoint Queen, General and PM in different time zones. They share king skills. | D-0519, D-0526 | B03-0003 |
| Pre-KvK | Configure officer permissions per title. Keep building-dismantle rights with trusted officers; the 1.1.03 countdown lets the leader cancel. | D-0514 | B04-0001 |
| KvK1+ | Use the battle roster (import via ROK Toolkit code) and the Watchlist to control Lost Kingdom entry. Publish the criteria. | D-0524, D-0507 | B02-0001, B02-0002 |
| KvK1+ | Use Quick Checks before fights. Alliance Notes are **public to members**, so put no private judgements there. | D-0512 | B04-0002 |
| SoC | Use Vacation Permits for low-activity or farm power instead of zeroing for seed. Check the permit allowance first. | D-0520 | B03-0007 |
| SoC | Use Army Groups so online officers can field the troops of offline members. | D-0526 | B04-0005 |

## Divergences and uncertainties

- **KvK calendar.** Lilith said in Apr 2025 that it was building an in-KvK calendar of pass/holy-site openings. No patch note through 1.1.09 announces it. If it shipped (or the Fri–Sat chapter rule is general), the community-spreadsheet pain is obsolete [B02-0005, D-0516].
- **Durations.** KvK durations (KvK1/KvK2 ~60 days, KvK3/SoC ~50 days) are T3/T4 and contested [B01-0502].
- **"Rulers".** Who counts as "rulers" in 1.1.03 (Watchlist and title approvals) is not defined [B02-0002, B03-0002].
- **Pioneer features.** Several features are pioneer-only and may not be live in a given kingdom: same-season immigration lock, Rest Mode vote, Camp Treaty, Radiant Rivalry [B06-0003, B09-0002, B09-0003].
- **Leadership practice** is single-source or member-voiced:
  - role-based KvK leadership teams [B02-0003, baixa]
  - UTC fight times [B02-0004, baixa]
  - one-council norm [B03-0004, baixa]
  - "approval before migrating" norm [B03-0006, baixa]

  Treat these as common patterns, not rules.
- **Matchmaking score vs kingdom power.** Whether the Vacation Permit "matchmaking score" equals the tiered top-300 kingdom power is not stated [B03-0007].

## Lacunas

- Per-story day-by-day KvK timelines (gates, passes, ruins, altars) [L-B02-03].
- In-game KvK calendar's existence today [L-B02-01].
- Battle roster limits and edit rights [L-B02-02].
- Vacation Permit allowance by activity level [L-B03-03].
- Official 1.1.10–1.1.12 notes: Camp Treaty, Radiant Rivalry, migration changes [L-B09-02, L-B06-03].
- ROK Toolkit contents [L-B08-01].
