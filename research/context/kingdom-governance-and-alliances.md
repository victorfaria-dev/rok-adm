---
tema: "Kingdom governance and alliances — king, titles, officers/permissions, R1–R5, rules, MGE models, migration"
dominios: [B03, B04, B05, B06, B07, B09]
gerado_em: 2026-10-13
fichas_base: [B03-0001, B03-0002, B03-0003, B03-0004, B03-0005, B03-0006, B03-0007, B04-0001, B04-0002, B04-0003, B04-0004, B04-0005, B04-0006, B04-0007, B05-0001, B05-0002, B05-0003, B05-0004, B06-0001, B06-0002, B06-0003, B06-0004, B06-0005, B07-0001, B07-0002, B07-0003, B07-0004, B09-0001, B09-0002, B09-0003, B02-0002, C04-0014, C04-0025, C04-0026]
cobertura: "Official governance mechanics re-read in Lilith patch notes 1.0.74–1.1.09 (T1, verbatim) + community practice from Reddit (archive, verbatim), two kingdom rule sites, tool docs. Weak: leader-authored descriptions of councils, MGE rotation mechanics, NAPs, R-rank permission defaults (R1–R5 rank powers were not collected), timezone practice."
---

# Kingdom governance and alliances

Related packs: `kingdom-lifecycle-and-kvk.md` (stage view), `kingdom-metrics-dkp.md` (DKP and requirements), `kingdom-admin-workflows.md` (step-by-step workflows). Pains: D-05xx in `research/pains/`.

## Summary (≤ 10 lines)

1. **Two layers of power.**
   - The game defines the **king** (Lost Temple holder): king skills, titles, immigration cap, Lost Kingdom roster, SoC votes. Below the king sit **alliance ranks** (leader/R5, counselor, officers with customisable permissions) [B03-0001, B03-0003, B04-0001, B06-0002, B09-0002].
   - Everything else is community-made: council, DKP, MGE lists, purge lists, intake rules [B03-0004, B03-0005, B05-0002, B06-0004].
2. **Leadership is shareable in-game.** Since 1.0.96, Queen, General and Prime Minister can use the core king skills [B03-0003]. Since 1.1.03, "rulers" can manage the Watchlist [B02-0002].
3. **Titles are handled in-game.** Title reservation with auto-approval has existed since Feb 2025 [B03-0002]. The "title queue" pain is largely solved by the game [D-0523, descartada].
4. **Officer rights are granular.** Permissions fall into 6 categories (1.0.96). Building dismantles run on a countdown the leader can cancel (1.1.03). Blocklist and passlist hold 200 each [B04-0001, B04-0006]. Insider-sabotage risk is reduced, not removed [D-0514].
5. **Fixed MGE is the norm from KvK1 on.**
   - Top ranks are pre-assigned by DKP, role, or auction [B05-0002, B05-0004]. Rank rewards are top-heavy: 180 sculptures for 1st vs 20 for 7th–10th (T2 wiki, contested) [B05-0001].
   - Breaking the list is punished [B05-0003]. The fairness dispute is the main legitimacy problem [D-0505, D-0506].
6. **Enforcement is informal.** Rule-breakers are kicked, then given a migrate-by deadline, then zeroed [B03-0005]. Official alternatives (Banish, Watchlist, blocklist, SoC territory protection) cover only part of this [B03-0003, B02-0002, B04-0006, C04-0014].
7. **Migration is a two-key system.** The game sets eligibility (age limits tightened Mar 2026; passports by power) [B06-0003, B06-0001]. Kingdoms add their own screening and post-KvK exit lists [B06-0004, B06-0005]. Rules change often and are not shown in-game [D-0509, D-0518].

## Verified facts (mechanics, T1 unless noted)

### King and titles
- **Kingdom titles** [B03-0001, media; T3 values]:

  | Group | Titles and documented buffs |
  |---|---|
  | Leadership | King (+5% atk/def/hp), Queen (+15% gathering), General (+5% atk/def), Prime Minister (+15% production, +10% building) |
  | Court | Justice, Duke, Architect, Scientist |
  | Negative | Traitor, Beggar, Exile, Slave, Sluggard, Fool |

  A development title must be active when the queue starts. Since 1.0.91 each Lost Kingdom domain has its own titles.
- **Title reservation (1.0.91):** governors reserve "defender-class" titles for a time slot. The king or a ruler approves, or auto-approval is on, and the title is granted automatically. Kings and rulers choose which titles are open and set the durations. Since 1.0.94 they can also set a City Hall level requirement, and governors can give up a title [B03-0002, alta].
- **King skills:** Imprison, Exile, Banish, Leader, Inspire, Watchlist.
  - Banish teleports a city to the kingdom's upper-left province (1.0.74).
  - Queen, General and PM can use Imprison, Exile, Banish, Leader and Inspire (1.0.96).
  - Watchlist blocks Lost Kingdom entry. It cannot target the top 50 by power (top 100 in Imperium kingdoms), but always can target players under 50M (1.1.01). King and rulers manage it, and they are immune to it and to Banish (1.1.03) [B03-0003, B02-0002].
- **Vacation Permit (SoC):** the king issues it. The holder leaves the matchmaking score but is confined to the starting province. Permits are revocable, holders pay fewer passports to emigrate, and the monthly allowance scales with kingdom activity [B03-0007].
- **King's immigration powers:** the king controls the normal immigration power cap and approves special immigration (cap control is T3). Special-immigration records reset after a merger (T1) [B06-0002].

### Alliances (R-ranks, officers)
- **Officer permissions (1.0.96):** 6 categories (Info, Member, Internal, Building, Garrison/Rally, Admin). Leader and Counselors customise them per officer title, and 8 more officer titles exist for Season 3 and SoC. Profile editing moved to Admin in 1.0.99 [B04-0001].
- **Membership tools:**
  - blocklist and passlist (1.0.74), now 200 each [B04-0006]
  - Quick Approval for join requests, a removal reason, and invitations posted to kingdom chat (1.0.91) [B04-0006]
  - leaders and officers can kick troops out of alliance rallies, buildings and garrisons in the Lost Kingdom [B04-0006]
- **Alliance Notes (1.1.07):** notes on members, **visible to all members** [B04-0002].
- **Quick Checks (1.1.07):** online members confirm or decline; available from Season 1 [B04-0002].
- **Army Groups (SoC, 1.1.01–1.1.02):** the creator controls troops that members lend. There are also map markers with commands and teleport markers [B04-0005].
- **Alliance Leadership achievements** reward time spent leading (Jan 2026) [B04-0007].
- **R1–R5 rank powers** (what each rank can do by default) were **not collected** — see Gaps.

### Communication (official)
- Kingdom and Lost Kingdom **Bugle**: a pinned chat statement (1.0.91) [B07-0004].
- Language chat channels across the season (1.0.91) [B07-0004].
- Option to block DMs from non-friends (1.0.96) [B07-0004].
- Voice chat in alliance and coalition channels (1.0.99) [B07-0004].
- Countdown markers (1.0.90) [B07-0004].
- Raid-time mail notification (1.1.01) [B07-0004].
- **No translation layer** appears in the 1.0.90–1.1.09 notes [B07-0004].

### Migration (game rules)
- **Personal requirements** (T3): CH16+, no alliance, a 30-day cooldown after migrating, Passport Pages by power (1 page at 0–10M up to 75 pages above 100M; 600k credits per page) [B06-0001].
- **Alliance Shop passports** (T1): weekly-restocked Passport Pages, storage up to 75 [B06-0001].
- **Age limits (1.1.06):**

  | Route | Max days older than the target kingdom |
  |---|---|
  | Same-season into a first-story SoC kingdom | 150 (was 240) |
  | Cross-season into Season 2 | 80 (was 120) |
  | Cross-season into Season 3 | 120 (was 180) |

  New kingdoms are locked from same-season immigration until the end of Season 1 (pioneer). Since 1.1.01, immigration into a Lost Kingdom in the settlement phase is allowed [B06-0003].
- **Cross-season immigration (2024):** 20,000-gem deposit, ≥10M power, 85M cap [C04-0025].
- **Jumping removed:** Beginner's Immigration has been unavailable since 2025-03-26 [C04-0026].

### Cross-kingdom diplomacy (SoC)
- **Team-up:** 2 or more kingdoms, 150 or more active governors [B09-0002].
- **Match vote:** a camp refuses its match when more than 80% of its votes reject it [B09-0002].
- **Coalitions:** start with 4 alliances [B09-0002].
- **Rest Mode vote:** passes with more than 50% of kingdoms in favour (pioneer) [B09-0002].
- **Coalition reward sharing:** at A+ and S+ tiers [B09-0003].
- **Passes and holy sites** can be transferred between coalition alliances (1.0.92) [B09-0001 notes].
- **SoC home-kingdom territory protection:** cities inside other alliances' territory can't be attacked (1.1.03) [C04-0014].

## Recommendations by profile and stage (with consensus level)

Community governance practice below comes from member-heavy public sources. Consensus is "majoritario" in what we saw, but confidence is `media` at best.

| Practice | Stage | Consensus | Confidence | Cards / pains |
|---|---|---|---|---|
| Fixed MGE list for top ranks from KvK1 on, allocated by DKP, role (rally/garrison leads), or auction. Off-season or early game is sometimes free-for-all. | KvK1+ | majoritario | media | B05-0002, B05-0004 |
| Publish requirements and MGE policy **before** KvK. "Fair/transparent DKP/MGE" is the most common recruiting promise. | all | majoritario | media | B05-0002, D-0501, D-0506 |
| Intake screening by form/profile review plus minimums (kills, deaths, power, CH25/T5), with alliance placement | all | majoritario | media | B06-0004, D-0508 |
| Post-KvK exit list targeting low DKP among top-300 power, with a deadline | KvK1+ | majoritario | media | B06-0005, D-0507 |
| Discord as the hub, with bots for verification, reminders, multilingual forms and auctions | all | majoritario | media | B07-0001, B05-0004 |

**MGE models found in the wild (no source describes a full rotation algorithm):**

| Model | Description | Cards |
|---|---|---|
| (a) Fixed by contribution | top N slots go to the top DKP/KvK performers | B05-0002 |
| (b) Fixed by role | rally/garrison leads get the commanders they need | B05-0002 |
| (c) DKP auction | bids from DKP balances; one bot charges the lowest winning bid; balances expire | B05-0004 |
| (d) Free-for-all | early or off-season, family alliances | B04-0003, B05-0002 |
| (e) "Rotation" | advertised only, never specified | B05-0002 notes |

## Divergences and uncertainties

- **Low-confidence community norms** (baixa, single voices or member-side):
  - "one leadership team per kingdom" and "council, not a dictator" [B03-0004]
  - migrants must ask the king first [B03-0006]
  - family/academy structures [B04-0003]
  - ghost alliances and informal succession [B04-0004]
  - breaking a fixed MGE leads to a kick, migration or zeroing [B05-0003]
  - coercion over flags [B09-0001]
  - rule sites vs unwritten rules [B07-0002]
  - mail as the broadcast channel [B07-0003]
- **Zeroing as enforcement.** 18 of 50 "zeroed" posts describe it as kingdom enforcement [B03-0005, media]. SoC home-kingdom territory protection now limits it inside alliance territory [C04-0014]. It is still the de-facto penalty pre-SoC.
- **MGE structure conflict.** Fandom says 6 stages over 6 days; riseofkingdomsguides says the final stage lasts 48 h [B05-0001, contestado].
- **Title buff values** come from two T3 guides that may copy each other. One is an account marketplace [B03-0001].
- **"Defender-class" titles** are not defined. It is unknown whether Queen/General/PM can be reserved [B03-0002].
- **Bias.** Reddit voice is dominated by members, often kicked or zeroed players. Some anti-"toxic leadership" posts are recruitment pitches (D-0506 notes). One cited author was an inauthentic persona account and was removed (D-0500, D-0519 notes).

## Pains in this area (ranked by score in `_indice-leaders.md`)

| Pain | Status | Note |
|---|---|---|
| D-0513 civil war | validada, freq 22 | |
| D-0506 MGE fairness | validada | |
| D-0525 legitimacy | bruto | |
| D-0514 insider sabotage | validada | |
| D-0505 MGE enforcement | bruto | |
| D-0521 coercion and diplomacy | bruto | |
| D-0518 invisible rules | validada | |
| D-0508 intake | validada | |
| D-0509 rule churn | validada | |
| D-0523 titles | **descartada** | absorbed by the game |

## Lacunas

- **R1–R5 default rank powers;** the content of each permission category; officer slots [L-B04-01].
- **MGE rotation mechanics, point caps, and the prevalence of fixed vs free MGE** [L-B05-02/03/04].
- **NAP / peace-deal practice;** Camp Treaty content [L-B09-01/02].
- **Who "rulers" are;** kingship transfer; the "kingdom for sale" signal [L-B03-04/05].
- **King's immigration cap UI** and timing (players report caps set "48h before migration", 1aqk42x, 2024) [L-B06-02].
- **Translation and timezone coordination practice** [L-B07-02/03].
