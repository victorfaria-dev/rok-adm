# Rise of Kingdoms — F2P early-kingdom guide (new kingdom → KvK1), v1

*As of 2026-10-13. Checked against official patch notes up to 1.1.09 (latest official EN notes); 1.1.12 reported live (T3). Profile: **F2P**. Assembled automatically from `guides/data/blocks.f2p.json` (43 blocks) by `guides/tools/assemble_guide.py`: edit the blocks, not this file.*

## How to read this guide

- **Every number and recommendation cites fact cards** (e.g. [A01-0001](../research/facts/A01/A01-0001.md)). Firm statements use only cards with status `verificado` and confidence `media` or `alta`.
- **Uncertain**: the claim relies on a weaker, contested or partly outdated card; the note says why.
- **Pending in-game measurement (T0)**: nobody has measured it yet; the gap ID points to `research/facts/<domain>/_lacunas.md` and the T0 diary (`research/protocolos/t0-medicao.md`).
- **Patch state**: some patch-change cards (C04) come from official notes but have not yet been through the formal verification pass; they are shown as patch state.
- **Consensus**: *unanimous* / *majority* / *split* (both views shown) / *mechanic* (a game rule, not an opinion).
- **Recommended** marks the default option for the F2P profile. **Low spender notes** flag where spending a little changes the advice materially (a full Low-spender delta guide comes later).
- **Time costs**: no source publishes minutes per task; they are pending the T0 stopwatch (L-A10-01).
- Block IDs (`like-this`) are what the future questionnaire uses to filter the guide.

## Contents

- [1. Overview and realistic expectations](#1-overview-and-realistic-expectations)
- [2. Day 0–3 setup: civilization and first choices](#2-day-03-setup-civilization-and-first-choices)
- [3. Phase-by-phase plan to KvK1](#3-phase-by-phase-plan-to-kvk1)
- [4. Daily routine by time budget](#4-daily-routine-by-time-budget)
- [5. Events calendar and preparation](#5-events-calendar-and-preparation)
- [6. Farms](#6-farms)
- [7. Mistakes to avoid](#7-mistakes-to-avoid)
- [8. If you got zeroed](#8-if-you-got-zeroed)
- [9. Open questions and pending measurements](#9-open-questions-and-pending-measurements)
- [Appendix: Sources and confidence](#appendix-sources-and-confidence)

## 1. Overview and realistic expectations

### Budget Reality Check: what a F2P can expect by KvK1

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P · `ov-budget-reality-check`

**What is solid**
- The first KvK (Season 1) starts at about **kingdom day 100**; pre-KvK (Eve of the Crusade) around day 85–95 [[B01-0500](../research/facts/B01/B01-0500.md)].
- **T4 is the working troop tier for a F2P in KvK1**; T5 needs CH25 and heavy investment and is a long-term goal [[A08-0500](../research/facts/A08/A08-0500.md)]. T4 unlocks at **CH21** [[A01-0001](../research/facts/A01/A01-0001.md)].
- Your only *guaranteed* recurring gem income is **100 gems/day** from the 100-point Daily Objectives chest [[A04-0001](../research/facts/A04/A04-0001.md)]. Everything else (events, barbarians, alliance gifts) is variable.
- Your best free channel for sculptures, keys and VIP points is **an alliance with spenders** (gift chests) [[A06-0516](../research/facts/A06/A06-0516.md)].

**Realistic targets (Uncertain: player reports and derived upper bounds)**
- Enter KvK1 at about **CH21–22 with T4**, not CH25; 10–20M power is "realistic" per 2026 player reports [[B01-0700](../research/facts/B01/B01-0700.md)].
- **VIP 6** around day 41 *at the latest* if every free gem goes to VIP; **VIP 10** is far beyond KvK1 on guaranteed income alone (≈ day 503 upper bound) [[A05-0007](../research/facts/A05/A05-0007.md)].

**Where a F2P competes, and where not**
- Compete: MGE *milestones* (not ranking) [[A11-0500](../research/facts/A11/A11-0500.md)]; filling strong rallies and fighting with complete marches [[A08-0503](../research/facts/A08/A08-0503.md)].
- Don't compete: open power rankings and repeated gem-spending events [[A11-0511](../research/facts/A11/A11-0511.md)].

**Why:** The most common F2P pain is feeling that hours of play are erased by spenders. Most of that comes from comparing yourself with the wrong target. New kingdoms are hardest for F2P early: spenders dominate the first 60–90 days [[B01-0506](../research/facts/B01/B01-0506.md)]. A plan built around **one complete T4 march by day ~100** is reachable. A plan built around matching whales is not, and abandoning the account out of frustration is the worst outcome.

> **Uncertain:** Targets come from [B01-0700](../research/facts/B01/B01-0700.md) (T4 player comments, baixa), [A05-0007](../research/facts/A05/A05-0007.md) (derived, baixa: assumes cumulative VIP thresholds, an unbroken streak and no other VIP sources, so real dates are earlier) and [B01-0506](../research/facts/B01/B01-0506.md) (baixa). [A11-0511](../research/facts/A11/A11-0511.md) is baixa. The F2P gem income beyond 100/day is unmeasured.
>
> **Pending in-game measurement (T0):** L-A04-01, L-A05-01, L-B01-02, L-A02-03

> **Low spender note:** Growth Fund (~$15 once, ~81,000 gems paid out as CH milestones are reached) and the 30-day gem supply (~$10, ~19,500 gems) are the two packs guides rank first and second [[A12-0001](../research/facts/A12/A12-0001.md), [A12-0002](../research/facts/A12/A12-0002.md)]. They mostly move the VIP 6 → VIP 10 dates earlier; the plan stays the same [[A12-0005](../research/facts/A12/A12-0005.md)]. Prices are from seller sites; confirm in your store (L-A12-01).

### Current patch state: what older guides get wrong

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 4/5 · **Recommended for:** F2P, Low · `ov-patch-state`

Written against official notes up to **1.1.09 (2026-06-30)**; 1.1.10–1.1.12 are known only from a third-party source [[C04-0001](../research/facts/C04/C04-0001.md)].

| Old advice | Today | Card |
|---|---|---|
| "Use Beginner's Immigration / a jumper account to restart in a fresh kingdom" | Distribution stopped **2025-03-26** for new characters | [C04-0026](../research/facts/C04/C04-0026.md) |
| "Pop 8h/24h resource boosts daily; buy them in the shops" | **Removed in 1.1.09**; VIP production bonuses raised instead | [C04-0004](../research/facts/C04/C04-0004.md) |
| "AP cap is 1,000; don't claim daily AP near the cap" | Cap is **1,500**; the daily claim can push AP *above* the cap since 1.1.02 | [A09-0001](../research/facts/A09/A09-0001.md), [C04-0032](../research/facts/C04/C04-0032.md) |
| "Wheel of Fortune costs X gems per spin" | Spins need **Spin Tickets** (Season 2/3/SoC official; Season 1 since 1.1.12 per T3) | [C04-0022](../research/facts/C04/C04-0022.md) |
| "Pelagius is an epic commander" | **Legendary Pelagius** event from kingdom **day 5** (1.1.09) | [C04-0005](../research/facts/C04/C04-0005.md) |
| "Civilization perks are all-or-nothing" | **CH16** unlocks civilization *buff switching* (1.1.01) | [A14-0002](../research/facts/A14/A14-0002.md) |
| "Bots for barbarians/gathering are low risk" | Built-in **auto-peacekeeping** exists; scripts lose **Conduct Score** (1.1.07) | [A09-0008](../research/facts/A09/A09-0008.md), [C04-0006](../research/facts/C04/C04-0006.md) |
| "Sculptures/armaments are locked forever" | Legendary Commander Swap, Armament Conversion (1.0.90) and full-refund equipment dismantle (1.0.96) exist | [C04-0023](../research/facts/C04/C04-0023.md), [C04-0010](../research/facts/C04/C04-0010.md) |
| "A new kingdom has 6 starting provinces" | **3** since 1.0.78 | [C04-0033](../research/facts/C04/C04-0033.md) |

**Why:** Advice that ignores these changes wastes scarce resources (gems on boosts that no longer exist, gem math for a Wheel that now needs tickets) or plans around options that are gone (jumping). Every block in this guide carries the patch it was checked against.

> **Uncertain:** [C04-0001](../research/facts/C04/C04-0001.md) (version) is third-party for 1.1.10–1.1.12. The Season 1 part of [C04-0022](../research/facts/C04/C04-0022.md) is T3 only. [C04-0026](../research/facts/C04/C04-0026.md) rests on an in-game mail quoted by players plus wiki/guide (no official forum post).
>
> **Patch state:** [C04-0001](../research/facts/C04/C04-0001.md), [C04-0004](../research/facts/C04/C04-0004.md), [C04-0005](../research/facts/C04/C04-0005.md), [C04-0006](../research/facts/C04/C04-0006.md), [C04-0010](../research/facts/C04/C04-0010.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0023](../research/facts/C04/C04-0023.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0032](../research/facts/C04/C04-0032.md), [C04-0033](../research/facts/C04/C04-0033.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-B01-04

## 2. Day 0–3 setup: civilization and first choices

### Choose your civilization (China recommended)

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P · **CH:** 1–10 · `d0-civilization`

- **Recommended (F2P): China** — +5% building speed, +5% AP recovery, starts with **Sun Tzu** [[A14-0003](../research/facts/A14/A14-0003.md), [A14-0001](../research/facts/A14/A14-0001.md)]. Consensus: **majority**.
- Cited alternatives: **Britain** (Boudica, +5% training) and **Spain** (+10% barbarian EXP, +20% resource production, Pelagius) [[A14-0003](../research/facts/A14/A14-0003.md), [A14-0001](../research/facts/A14/A14-0001.md)].
- Your **first civilization change is free at CH10**; otherwise it costs 10,000 gems or 2M individual alliance credits. A change does **not** replace the starting commander you already own [[A14-0002](../research/facts/A14/A14-0002.md)].
- From **CH16** you can switch civilization *buffs* (1.1.01) [[A14-0002](../research/facts/A14/A14-0002.md)].
- Around KvK, guides suggest switching to **Germany** (training, AP) or a role civilization [[A14-0003](../research/facts/A14/A14-0003.md)].

**Why:** Building speed is the bottleneck of the whole CH21 path, and AP recovery feeds barbarians and events, so China's two perks hit the two daily levers. Sun Tzu is also the safest early F2P commander [[A06-0501](../research/facts/A06/A06-0501.md)]. Because the change at CH10 is free, the starting pick only has to be right for CH1–CH10.

> **Uncertain:** No source re-evaluates Spain after the day-5 Legendary Pelagius event ([C04-0005](../research/facts/C04/C04-0005.md)); this could strengthen Spain (gap L-A14-02). The value of +5% building speed over the CH chain is not quantified (L-A14-03). The cost/cooldown of CH16 buff switching is unknown (L-A14-01).
>
> **Patch state:** [C04-0005](../research/facts/C04/C04-0005.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A14-01, L-A14-02, L-A14-03

### Starting in a new kingdom in 2026

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 4/5 · **Recommended for:** F2P, Low · **CH:** 1–10 · `d0-new-kingdom-start`

- **No jumping:** Beginner's Immigration is no longer given to new characters (since 2025-03-26) [[C04-0026](../research/facts/C04/C04-0026.md)]. The kingdom you start in is, in practice, the one you will grow in until migration opens; same-season immigration is restricted for new kingdoms until the end of Season 1 on some continents (pioneer) [[C04-0008](../research/facts/C04/C04-0008.md)].
- A new kingdom runs in the **Preparation Season** (Kingdom Chronicles) for about 85–100 days before KvK1 [[B01-0500](../research/facts/B01/B01-0500.md)]; since 1.0.78 it opens with **3 starting provinces**, not 6 [[C04-0033](../research/facts/C04/C04-0033.md)].
- **Join an active alliance with spenders in the first days** (see next block) [[A06-0516](../research/facts/A06/A06-0516.md)].
- Expect the **first 60–90 days** to set the kingdom's hierarchy, with spenders far ahead early [[B01-0506](../research/facts/B01/B01-0506.md)].

**Why:** Old "how to start" advice assumes you can test a kingdom and jump if it looks bad. That is gone, so the first-week decisions that still matter are *alliance* and *safety*, not kingdom shopping.

> **Uncertain:** [B01-0506](../research/facts/B01/B01-0506.md) is baixa (T3). [C04-0026](../research/facts/C04/C04-0026.md) and [C04-0033](../research/facts/C04/C04-0033.md) are patch-state cards (status bruto). [C04-0008](../research/facts/C04/C04-0008.md)'s new-kingdom lock is a pioneer on select continents. Whether a F2P should start in a brand-new kingdom at all is an open disagreement (no card).
>
> **Patch state:** [C04-0008](../research/facts/C04/C04-0008.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0033](../research/facts/C04/C04-0033.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-B01-02

### Join an active, spending alliance early

**Confidence:** medium · **Consensus:** unanimous · **Priority:** 5/5 · **Recommended for:** F2P, Low, Medium · `d0-join-alliance`

- **Recommended (all profiles):** join an active alliance with spenders as soon as you can [[A06-0516](../research/facts/A06/A06-0516.md)]. Consensus: **unanimous**.
- What it gives you:
  - **Gift chests** generated by spenders: sculptures, keys and VIP points [[A06-0516](../research/facts/A06/A06-0516.md), [A05-0004](../research/facts/A05/A05-0004.md)].
  - **Helps:** each help fills 1% of a construction/research/healing bar; helps per job grow with the Alliance Center level (5 at Lv1 up to 30 at Lv25) [[A10-0006](../research/facts/A10/A10-0006.md)].
  - **+25% gathering speed** inside alliance territory [[A03-0009](../research/facts/A03/A03-0009.md)].
  - Fort rallies (Books of Covenant, alliance gifts) once forts unlock [[A09-0005](../research/facts/A09/A09-0005.md)].

**Why:** For a F2P, the alliance is the largest free income source outside the daily chest: other people's spending turns into your sculptures and VIP points, and their helps shorten every timer. An inactive alliance gives none of this.

> **Pending in-game measurement (T0):** L-A05-03

### First gems go to VIP (target VIP 6), never break the streak

**Confidence:** medium · **Consensus:** split · **Priority:** 5/5 · **Recommended for:** F2P · `d0-first-gems-vip`

- **Claim the daily VIP points every day.** The claim starts at 40 and grows by +20 per consecutive day to 200/day; missing one day resets it to 40 [[A05-0003](../research/facts/A05/A05-0003.md)].
- **Recommended (F2P): put free gems into VIP until VIP 6** (permanent 2nd builder), then save toward VIP 10 [[A05-0008](../research/facts/A05/A05-0008.md), [A04-0009](../research/facts/A04/A04-0009.md)]. Gems convert to VIP points 1:1 [[A05-0004](../research/facts/A05/A05-0004.md)]. Consensus: **majority**.
- Until VIP 6, keep the second builder running with **Builder Recruitment** items (2 days each, stackable) [[A01-0006](../research/facts/A01/A01-0006.md)].
- **Don't** finish timers with gems or buy AP with gems [[A04-0009](../research/facts/A04/A04-0009.md), [A04-0008](../research/facts/A04/A04-0008.md)].

**Why:** The second builder doubles construction throughput for the rest of the account's life, and construction is the KvK1 bottleneck (CH21 for T4). Gems spent on instant-finishes are gone; gems spent on VIP become permanent buffs and, at VIP 10, a daily legendary sculpture [[A05-0006](../research/facts/A05/A05-0006.md)].

**Both views (split):** Majority (5 sources): free gems → VIP 6, then VIP 10 [[A05-0008](../research/facts/A05/A05-0008.md)]. Minority (AllClash, 2020): reach VIP through daily play and don't spend gems on it [[A05-0008](../research/facts/A05/A05-0008.md), [A04-0009](../research/facts/A04/A04-0009.md)]. This guide follows the majority.

> **Uncertain:** VIP thresholds are read as cumulative totals (T4 arithmetic supports it; confirm on day 1, L-A05-01).
>
> **Pending in-game measurement (T0):** L-A05-01, L-A04-01

> **Low spender note:** Buy the Growth Fund as early as possible: its ~81,000 gems accrue as City Hall levels are reached, so buying early loses nothing [[A12-0001](../research/facts/A12/A12-0001.md)]. Those gems follow the same VIP-first plan.

### Build order: City Hall and its prerequisites only

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P · **CH:** 1–25 · `d0-build-order`

- **Recommended (F2P):** spend builder time, resources and speedups on **City Hall and the buildings it requires**; keep both builders busy; defer non-prerequisite buildings (extra resource buildings, Watchtower) [[A01-0007](../research/facts/A01/A01-0007.md)]. Consensus: **majority**.
- The rules: no building can exceed City Hall [[A01-0003](../research/facts/A01/A01-0003.md)]; CH N (N≥3) needs **Wall N−1 plus one rotating building at N−1** [[A01-0001](../research/facts/A01/A01-0001.md)]; Wall N (N≥5) needs Tavern N, which needs Quarry N; military buildings need their resource building; Trading Post N needs Goldmine N [[A01-0004](../research/facts/A01/A01-0004.md)].
- Milestones worth knowing [[A01-0001](../research/facts/A01/A01-0001.md), [A03-0023](../research/facts/A03/A03-0023.md)]:

| CH | Unlock |
|---|---|
| 5 | 2nd march |
| 8 | queue dashboard (1.1.01), Tier 2 [[A01-0011](../research/facts/A01/A01-0011.md)] |
| 10 | free Civilization Change reward [[A01-0002](../research/facts/A01/A01-0002.md)], Lyceum |
| 11 | 3rd march |
| 16 | Tier 3, Blacksmith |
| 17 | 4th march |
| 21 | **Tier 4** |
| 22 | 5th march |

- Resources come mainly from **gathering** on the map, not city buildings [[A01-0007](../research/facts/A01/A01-0007.md)].

**Why:** Every unlock that matters for KvK1 (marches, T3, T4) is gated by City Hall, and the prerequisite chain is long: the minimum raw build time to CH21 is about 163 builder-days with no buffs [[A01-0005](../research/facts/A01/A01-0005.md)]. Any building outside the chain delays that.

> **Uncertain:** [A01-0005](../research/facts/A01/A01-0005.md) is a derived organizer estimate (baixa), useful for scale only; real time depends on buffs and speedups (L-A01-03). Early unlock levels are contested ([A01-0009](../research/facts/A01/A01-0009.md)): Academy at CH4 or CH6, first Quarry at CH4 or CH6, Trading Post at CH10 or CH12 (CH12 probable). Storehouse and Hospital may deserve attention even when not on the chain ([A01-0007](../research/facts/A01/A01-0007.md) notes).
>
> **Pending in-game measurement (T0):** L-A01-01, L-A01-02, L-A01-03

### Day-1 safety: protect what you hold

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P, Low · `d0-day1-survival`

- Keep resources as **unopened resource items** until you need them: items cannot be plundered and have no storage limit; gems cannot be plundered at all [[A03-0007](../research/facts/A03/A03-0007.md)].
- Raw resources above your **Storehouse protection** can be plundered; keep exposed stock low, especially during kill events [[A03-0006](../research/facts/A03/A03-0006.md), [A13-0005](../research/facts/A13/A13-0005.md)].
- Keep **hospital capacity** ahead of your army: wounded troops beyond capacity die [[A08-0502](../research/facts/A08/A08-0502.md)].
- **No third-party scripts.** Use the built-in auto-peacekeeping instead [[A09-0008](../research/facts/A09/A09-0008.md)].

**Why:** New players are attacked mostly for what is lying around. Converting what you keep into unplunderable form costs nothing and removes the reward for hitting you.

> **Uncertain:** Shield durations, beginner protection and their costs are not covered by any fact card yet (proposed gap PROPOSED-SHIELDS). Storehouse protection values below L25 differ between sources ([A03-0006](../research/facts/A03/A03-0006.md); L-A03-05).
>
> **Pending in-game measurement (T0):** L-A03-05, PROPOSED-SHIELDS

### AP discipline from day 1

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P, Low · `d0-ap-discipline`

- **AP cap is 1,500**; regenerating AP above the cap is wasted, so spend it [[A09-0001](../research/facts/A09/A09-0001.md), [A09-0007](../research/facts/A09/A09-0007.md)].
- Spend regenerating AP on **barbarians** early (commander EXP, resources, Daily Objective tasks) [[A09-0007](../research/facts/A09/A09-0007.md)]. A barbarian costs 50 AP, minus 2 per consecutive hit without returning (minimum 40) [[A09-0002](../research/facts/A09/A09-0002.md)]. At opening only Lv1–6 barbarians exist; higher levels unlock over the following days [[A09-0004](../research/facts/A09/A09-0004.md)].
- **Save AP potions/items** for Lohar's Trial / Arms Training and for Eve of the Crusade [[A11-0505](../research/facts/A11/A11-0505.md), [A09-0007](../research/facts/A09/A09-0007.md)]. Consensus: **majority**.
- Claim the **daily AP** every day, even near the cap (it can exceed the cap since 1.1.02) [[A09-0006](../research/facts/A09/A09-0006.md), [C04-0032](../research/facts/C04/C04-0032.md)].

**Why:** Regenerating AP is free and disappears at the cap; AP items keep. Spending the free stream daily and banking the items for events that pay more per AP is the cheapest gain in the game.

> **Uncertain:** Base AP regeneration per hour is unknown (L-A09-01). The daily claim amount is 500 per the official 1.0.41 notes (2020); the 2026 amount is unconfirmed (L-A09-02).
>
> **Patch state:** [C04-0032](../research/facts/C04/C04-0032.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A09-01, L-A09-02, L-A09-05

## 3. Phase-by-phase plan to KvK1

### Days 4–14 (about CH8 → CH12)

#### CH8–CH12 checkpoints

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 3/5 · **Recommended for:** F2P · **CH:** 8–12 · `d4-ch8-ch12-checkpoints`

- **CH8:** queue dashboard — refill construction, training, research, healing and scouting from one screen [[A01-0011](../research/facts/A01/A01-0011.md)]. Reward: 2× 8h universal speedups [[A01-0002](../research/facts/A01/A01-0002.md)].
- **CH9:** reward 1× 24h universal speedup; 3rd hospital [[A01-0002](../research/facts/A01/A01-0002.md), [A01-0008](../research/facts/A01/A01-0008.md)].
- **CH10:** **free Civilization Change** (keep it unless you plan to switch) [[A14-0002](../research/facts/A14/A14-0002.md)]; Lyceum of Wisdom (Peerless Scholar) [[A10-0005](../research/facts/A10/A10-0005.md)]; gold enters the economy (needed for Academy tech after Academy 10 and T3+ troops) [[A03-0021](../research/facts/A03/A03-0021.md)].
- **CH11:** 3rd march [[A03-0023](../research/facts/A03/A03-0023.md)].
- **CH12:** Trading Post (probable) — see Uncertain.

**Why:** These are the first levels where the game hands out big free speedups and new daily income (Lyceum gem pool). Knowing them helps you keep speedups for the long timers that start right after.

> **Uncertain:** Trading Post unlock CH10 vs CH12 is contested ([A03-0025](../research/facts/A03/A03-0025.md), [A01-0009](../research/facts/A01/A01-0009.md)); CH12 is probable. Raw CH upgrade times come from the Fandom developer dataset (L-A01-02).
>
> **Pending in-game measurement (T0):** L-A01-01, L-A03-04

#### Academy: economy and speed techs first

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · **CH:** 4–16 · `d4-research-economy`

- **Recommended (F2P):** research **speed and economy techs first** — Writing, Masonry, Engineering, Mathematics — before military [[A02-0500](../research/facts/A02/A02-0500.md)]. Consensus: **majority** (minor disagreement on which of the first two goes first).
- Keep the research queue busy at every login [[A10-0002](../research/facts/A10/A10-0002.md)].

**Why:** Building and research speed compound: every later timer on the CH21 / T4 path gets shorter. Military techs are useless until the troops they improve are unlocked.

> **Uncertain:** Tech names may have changed since the 2019–2026 sources; no ordered research path with times exists yet (L-A02-01). The Academy unlocks at CH4 or CH6 (contested, [A01-0009](../research/facts/A01/A01-0009.md)). [A10-0002](../research/facts/A10/A10-0002.md) is a single commercial checklist (baixa).
>
> **Pending in-game measurement (T0):** L-A02-01, L-A01-01

#### Early commanders: Sun Tzu + one barbarian farmer

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · `d4-early-commanders`

- **Concentrate:** finish one complete march before starting others [[A06-0500](../research/facts/A06/A06-0500.md)]. Consensus: **unanimous**.
- **Recommended (F2P): Sun Tzu** as your early primary — epic, needs no gold sculptures, still used in KvK1 [[A06-0501](../research/facts/A06/A06-0501.md)]. Consensus: **majority**.
- Level **only one** of Boudica or Lohar for barbarians/PvE, and never put universal (gold) sculptures into them [[A06-0505](../research/facts/A06/A06-0505.md)]. Consensus: **majority**.
- Level a **gathering commander** early: only the primary's talents apply; level 37 unlocks Superior Tools (~25% gathering speed) [[A03-0017](../research/facts/A03/A03-0017.md)].

**Why:** Sculptures are the scarcest F2P resource and skill levels are front-loaded, so one finished commander beats three half-built ones. Epic commanders level from cheap epic sculptures (3 per day from the daily chest [[A04-0001](../research/facts/A04/A04-0001.md)]).

> **Uncertain:** Sun Tzu's long-term value is disputed: one 2026 tier list rates nearly all epics F/C overall ([A06-0509](../research/facts/A06/A06-0509.md), divided; it is a horizon disagreement). "Gatherer to 37 first, Centurion easiest" is [A06-0506](../research/facts/A06/A06-0506.md) (baixa). A Sun Tzu intro post appeared on the official forum on 2026-02-04 (game-state pack); whether the epic Sun Tzu changed is not checked.
>
> **Pending in-game measurement (T0):** L-A06-01, L-A06-03

#### Legendary Pelagius event (day 5): decide before you spend

**Confidence:** low · **Consensus:** split · **Priority:** 3/5 · **Recommended for:** F2P · `d4-pelagius-day5`

- Since 1.1.09 a **Legendary Pelagius** upgrade event runs from **kingdom day 5** [[C04-0005](../research/facts/C04/C04-0005.md)].
- Opinions are **split**: "early-server monster" vs KvK1 B-tier [[A06-0508](../research/facts/A06/A06-0508.md)].
- **Recommended (F2P):** treat it as a decision, not an automatic buy. Apply the Commander Decision Checklist (day 15–40 block) before spending anything scarce on it.

**Why:** It is the first legendary offered to every new kingdom, so it will compete for the same scarce resources as your long-term legendary. There is no current F2P cost/benefit analysis for it.

**Both views (split):** "Early-server monster" (AllClash) vs B-tier for KvK1 (LootBar) [[A06-0508](../research/facts/A06/A06-0508.md)].

> **Uncertain:** [A06-0508](../research/facts/A06/A06-0508.md) is baixa/divided. The event's costs and rewards are not captured (screenshot on day 5, T0 protocol).
>
> **Patch state:** [C04-0005](../research/facts/C04/C04-0005.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A06-02, L-A14-02

#### Gathering setup that does not need babysitting

**Confidence:** medium · **Consensus:** majority · **Priority:** 3/5 · **Recommended for:** F2P, Low · `d4-gathering-setup`

- Gather **inside alliance territory** (+25% speed) [[A03-0009](../research/facts/A03/A03-0009.md)].
- When online, use nearby nodes; **before logging off, send marches to large nodes** so they don't come back early. Node level changes the amount, not the speed [[A03-0016](../research/facts/A03/A03-0016.md)].
- **Enhanced Gathering** items (+50% for 8h/24h) still exist and can be bought with resources at the Mysterious Merchant [[A03-0013](../research/facts/A03/A03-0013.md)]. *Production* boost items were removed in 1.1.09 [[C04-0004](../research/facts/C04/C04-0004.md)].
- March count grows with CH: 2 at CH5, 3 at CH11, 4 at CH17, 5 at CH22 [[A03-0023](../research/facts/A03/A03-0023.md)].

**Why:** Resources for the CH path come from gathering [[A01-0007](../research/facts/A01/A01-0007.md)]. Long marches sent at logoff turn offline hours into resources at zero extra minutes, which is the core of a low-time routine.

> **Patch state:** [C04-0004](../research/facts/C04/C04-0004.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A03-01, L-A03-02

### Days 15–40 (about CH12 → CH17, VIP 6)

#### CH10 → CH17: T3, Blacksmith, 4th march

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 4/5 · **Recommended for:** F2P · **CH:** 10–17 · `d15-ch10-ch17`

- **CH16:** Tier 3 troops and the Blacksmith; reward **7-day universal speedup + 100 gems**; civilization buff switching [[A01-0001](../research/facts/A01/A01-0001.md), [A01-0002](../research/facts/A01/A01-0002.md), [A14-0002](../research/facts/A14/A14-0002.md)].
- **CH17:** 4th march [[A03-0023](../research/facts/A03/A03-0023.md)].
- Raw (unbuffed) City Hall upgrade times: CH10 22h, CH16 4d, CH17 4d 20h [[A01-0001](../research/facts/A01/A01-0001.md)]. The whole prerequisite set grows much faster than City Hall itself [[A01-0005](../research/facts/A01/A01-0005.md)].
- Resource pressure shifts: **stone** joins around CH6 (Wall chain), **gold** from CH10 for research and T3+ troops [[A03-0021](../research/facts/A03/A03-0021.md)].

**Why:** CH16–CH17 is where the plan stops being cheap: each level needs several multi-day prerequisites, and gold starts to bind. Stockpiling gold through gathering before CH16 avoids stalls.

> **Uncertain:** [A01-0005](../research/facts/A01/A01-0005.md) (derived, baixa): about 70 raw builder-days to CH17, before buffs. Real times need the T0 buff chart (L-A01-03). A Lost Kingdom entry requirement of CH17 is single-source ([B01-0503](../research/facts/B01/B01-0503.md), see pre-KvK).
>
> **Pending in-game measurement (T0):** L-A01-02, L-A01-03

#### Research: T3 → T4 (skip siege) → shared combat techs

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · **CH:** 10–21 · `d15-research-military`

- **Recommended (F2P):** after the economy techs, unlock **T3**, then **T4 for infantry, cavalry and archers (skip T4 siege)**, then the shared combat techs (Combat Tactics, Defensive Formation, Herbal Medicine), then one troop branch; T5 last [[A02-0501](../research/facts/A02/A02-0501.md)]. Consensus: **majority**.
- Pick **one troop type** that matches your best commanders; infantry or cavalry are preferred for a first T5 [[A08-0506](../research/facts/A08/A08-0506.md)].

**Why:** T4 research must be ready when CH21 lands, or the CH21 rush is wasted. Siege T4 adds little for a F2P field fighter, and splitting research across troop types delays every branch.

> **Uncertain:** Research is slow: one guide says Combat Tactics 10 takes about 100 days for an average player ([A02-0504](../research/facts/A02/A02-0504.md), single source, baixa). Time to T4 is unmeasured (L-A02-03).
>
> **Pending in-game measurement (T0):** L-A02-01, L-A02-03

#### VIP 6 milestone, then switch to saving

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · `d15-vip6-milestone`

- At **VIP 6** (11,500 cumulative VIP points) the 2nd builder becomes permanent; Builder Recruitment items then convert into 60-minute building speedups [[A05-0001](../research/facts/A05/A05-0001.md), [A01-0006](../research/facts/A01/A01-0006.md)].
- **After VIP 6**, stop buying VIP directly and **save gems for More Than Gems** (see Events) [[A11-0502](../research/facts/A11/A11-0502.md), [A11-0504](../research/facts/A11/A11-0504.md)]. Next target: **VIP 10** (150,000 cumulative), which adds 1 legendary sculpture per day [[A05-0001](../research/facts/A05/A05-0001.md), [A05-0006](../research/facts/A05/A05-0006.md)].

**Why:** Below VIP 6, the builder is worth more than any event bonus. Above it, the same gems buy VIP *and* event milestone rewards if spent during More Than Gems.

> **Uncertain:** Derived F2P timeline ([A05-0007](../research/facts/A05/A05-0007.md), baixa): VIP 6 about day 41 with 100 gems/day + daily claim; earlier with alliance gifts and event gems. Cumulative reading of thresholds pending T0 (L-A05-01).
>
> **Pending in-game measurement (T0):** L-A05-01, L-A04-01, L-A12-02

> **Low spender note:** The 30-day gem supply (~650 gems/day vs the F2P 100/day) moves VIP milestones earlier for a low spender [[A12-0002](../research/facts/A12/A12-0002.md), [A04-0001](../research/facts/A04/A04-0001.md)]; no card gives a VIP 10 date (L-A12-02).

#### Commander Decision Checklist (before spending gold sculptures)

**Confidence:** medium · **Consensus:** split · **Priority:** 4/5 · **Recommended for:** F2P · `d15-commander-checklist`

**Rule:** bank universal (gold) sculptures for **one long-term legendary**; never spend them on gatherers or temporary picks [[A06-0510](../research/facts/A06/A06-0510.md)]. Consensus: **majority**. Yi Seong-Gye (YSG) is the most cited target [[A06-0502](../research/facts/A06/A06-0502.md)].

**Before spending, answer:**
1. **Is it your troop type?** You should be researching one type [[A08-0506](../research/facts/A08/A08-0506.md)].
2. **Does it complete a march?** Partial commanders give little value [[A06-0500](../research/facts/A06/A06-0500.md)].
3. **Will it still matter after KvK1?** Mid-tier legendaries (Richard I, Charles Martel, Cao Cao) are strong in KvK1 but lose value later — split opinion [[A06-0503](../research/facts/A06/A06-0503.md)].
4. **Is a better-timed option coming?** YSG is reported on the Wheel of Fortune around day 94 [[A06-0502](../research/facts/A06/A06-0502.md)]; the Wheel needs Spin Tickets in Season 2+ [[C04-0022](../research/facts/C04/C04-0022.md)].
5. **Is it a free legendary you can grow instead?** Aethelflaed comes from the Expedition store (1,500 medals per sculpture) [[A06-0504](../research/facts/A06/A06-0504.md), [A10-0004](../research/facts/A10/A10-0004.md)].

Verdict: **invest** (yes to 1, 2, 3), **wait** (no to 4), **avoid** (no to 1 or 3).

Shelf-life note: since 2025 there are respec tools (Legendary Commander Swap, around the end of Season 2) [[C04-0023](../research/facts/C04/C04-0023.md)], so a wrong pick is costly but no longer permanent.

**Why:** Gold sculptures arrive very slowly for a F2P (VIP 10 is far away), and commander regret is one of the most common F2P pains. A fixed checklist turns a tier-list argument into five yes/no questions you can answer yourself.

**Both views (split):** YSG timing: consensus long-term target, but some 2026 players say a pure F2P should skip him for KvK1 (low spenders can) [[A06-0502](../research/facts/A06/A06-0502.md)]. Mid-tier legendaries: divided [[A06-0503](../research/facts/A06/A06-0503.md)].

> **Uncertain:** [A06-0503](../research/facts/A06/A06-0503.md) is baixa/divided. The checklist is a guide construction (S-D-0008) built on these cards, not a source consensus. YSG Wheel timing (day ~94) is single T3. Sculpture income per week is unmeasured (L-A06-03).
>
> **Patch state:** [C04-0022](../research/facts/C04/C04-0022.md), [C04-0023](../research/facts/C04/C04-0023.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A06-01, L-A06-02, L-A06-03, L-A11-03

> **Low spender note:** Low spenders can realistically aim at YSG for KvK1 [[A06-0502](../research/facts/A06/A06-0502.md)]; the rest of the checklist is unchanged.

#### Expedition medals → Aethelflaed

**Confidence:** medium · **Consensus:** majority · **Priority:** 3/5 · **Recommended for:** F2P · `d15-expedition-aethelflaed`

- Claim the daily Expedition chest from 3-star missions and use the free daily Medal Shop refresh [[A10-0004](../research/facts/A10/A10-0004.md)].
- **Recommended (F2P):** spend medals on **Aethelflaed**, the main free legendary (1,500 medals per legendary sculpture) [[A06-0504](../research/facts/A06/A06-0504.md), [A10-0004](../research/facts/A10/A10-0004.md)]. Consensus: **majority**.
- Sun Tzu + Aethelflaed is the most cited F2P KvK1 pair [[A06-0501](../research/facts/A06/A06-0501.md)].

**Why:** Aethelflaed is the one legendary a F2P can grow without gold sculptures or spending, and the medals accrue from a short daily claim.

> **Uncertain:** Medal income per day is unknown (L-A10-04).
>
> **Pending in-game measurement (T0):** L-A10-04

#### Equipment: cheap sets now, epic for KvK1

**Confidence:** medium · **Consensus:** majority · **Priority:** 2/5 · **Recommended for:** F2P · **CH:** 16–25 · `d15-equipment`

- **Recommended (F2P):** craft cheap green/blue pieces (Windswept, Vanguard) early and move all main commanders to **epic** before any legendary crafting [[A07-0500](../research/facts/A07/A07-0500.md)]. Consensus: **majority**.
- The Blacksmith unlocks at CH16 [[A01-0001](../research/facts/A01/A01-0001.md)].

**Why:** Early pieces are replaced quickly; epic is the realistic KvK1 baseline. A legendary piece adds little over epic per piece (one source) and costs materials you will want later.

> **Uncertain:** Hoarding legendary materials ([A07-0501](../research/facts/A07/A07-0501.md), organizado, baixa) and "legendary over epic adds ~2% per piece" ([A07-0504](../research/facts/A07/A07-0504.md), single source, baixa) are uncertain. Since 1.0.96 special-talent equipment dismantles refund 100% of forging ([C04-0010](../research/facts/C04/C04-0010.md)).
>
> **Patch state:** [C04-0010](../research/facts/C04/C04-0010.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A07-01

### Days 41–90 (CH17 → CH21/22, T4)

#### CH21 for T4: the main pre-KvK goal

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P · **CH:** 17–22 · `d41-ch21-t4`

- **Recommended (F2P): target CH21** — it unlocks **Tier 4**, the KvK1 working tier [[A01-0001](../research/facts/A01/A01-0001.md), [A08-0500](../research/facts/A08/A08-0500.md)]. Reward: 7-day universal speedup + 200 gems [[A01-0002](../research/facts/A01/A01-0002.md)].
- CH22 adds the 5th march [[A03-0023](../research/facts/A03/A03-0023.md)]; CH25 is **not** expected by KvK1 for a F2P [[B01-0700](../research/facts/B01/B01-0700.md)].
- Raw City Hall times: CH21 11d, CH22 17d 3h [[A01-0001](../research/facts/A01/A01-0001.md)].

**Why:** T4 is the difference between filling rallies usefully and being fodder. Everything earlier in this guide (two builders, economy techs, hoarded speedups) exists to land CH21 and T4 research before KvK1.

> **Uncertain:** Timing conflict: 2026 player reports say T4 comes "around day 30" ([B01-0700](../research/facts/B01/B01-0700.md), baixa), while the derived raw build budget to CH21 is about 163 builder-days ([A01-0005](../research/facts/A01/A01-0005.md), baixa), i.e. well over 80 days with two builders before buffs and speedups. Both are weak; the T0 diary must settle the real CH21 date (L-A02-03, L-A01-03).
>
> **Pending in-game measurement (T0):** L-A01-03, L-A02-03

#### Hospital capacity before KvK1

**Confidence:** medium · **Consensus:** unanimous · **Priority:** 4/5 · **Recommended for:** F2P, Low · `d41-hospital`

- Wounded troops beyond hospital capacity **die**; some actions (attacking cities/objectives) always kill severely wounded. Keep hospitals large and empty before fights [[A08-0502](../research/facts/A08/A08-0502.md)]. Consensus: **unanimous**.
- Capacity per hospital (unbuffed): 7,500 at Lv1, 29,000 at Lv15, 75,000 at Lv25; CH4/CH9/CH15 unlock the 2nd/3rd/4th hospital [[A01-0008](../research/facts/A01/A01-0008.md)].
- T5 heals cost much more than T4; without a strong economy, fight with T4 [[A08-0505](../research/facts/A08/A08-0505.md)].

**Why:** For a F2P, dead troops are the most expensive loss in the game (a full retrain); healing is far cheaper. Hospital level is also a CH prerequisite at several levels, so it is rarely wasted.

> **Uncertain:** Heal vs retrain cost is not quantified (L-A08-01); no hospital target for KvK1 yet (L-A08-02). The Hall of Heroes returns part of KvK healing resources since 1.0.89 ([C04-0028](../research/facts/C04/C04-0028.md)), percentage unknown.
>
> **Patch state:** [C04-0028](../research/facts/C04/C04-0028.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A08-01, L-A08-02, L-A08-03

#### Speedups: spend or hoard? (split debate)

**Confidence:** medium · **Consensus:** split · **Priority:** 4/5 · **Recommended for:** F2P · `d41-speedups-spend-vs-hoard`

**Free speedup income:** about **170 min/day** from Daily Objectives chests (derived from a 2020 wiki revision), plus CH rewards (8h, 24h, 7-day universals), barbarians, the VIP Shop (food-priced 5-min speedups), Expedition, alliance and merchant [[A04-0010](../research/facts/A04/A04-0010.md), [A01-0002](../research/facts/A01/A01-0002.md), [A04-0007](../research/facts/A04/A04-0007.md)].

**The debate**
- **Hoard (majority):** keep speedups, resource items and AP items for scored events and KvK healing [[A11-0501](../research/facts/A11/A11-0501.md)].
- **Spend:** pour them into City Hall (older minority view) or **only into research** (one source) [[A02-0503](../research/facts/A02/A02-0503.md), [A11-0501](../research/facts/A11/A11-0501.md)].

**Recommended (F2P): hoard by default, with one exception.** Use speedups on the CH21 / T4-research path when a timer would otherwise make you miss **T4 before KvK1**; keep the rest for scored events (more reward per minute spent) and KvK healing.

**Why:** The tension is real: the guide's goal is strength by KvK1, which argues for spending, while event rewards and KvK healing argue for hoarding. Hoarded speedups keep their full value until used; a late CH21 cannot be fixed later. There is no quantitative model yet, so the exception rule is a judgment, not a calculation.

**Both views (split):** Majority: hoard for events/KvK [[A11-0501](../research/facts/A11/A11-0501.md)]. Minority: speedups into City Hall [[A11-0501](../research/facts/A11/A11-0501.md) dissent]. One source: universal speedups only on research [[A02-0503](../research/facts/A02/A02-0503.md)].

> **Uncertain:** [A02-0503](../research/facts/A02/A02-0503.md) is baixa/divided. The 170 min/day figure ([A04-0010](../research/facts/A04/A04-0010.md)) is derived and the 1.1.09 Daily Objectives change may have altered it ([A10-0001](../research/facts/A10/A10-0001.md), partially obsolete). The exception rule is this guide's synthesis, not a sourced consensus.
>
> **Pending in-game measurement (T0):** L-A02-02, L-A04-04

#### VIP 10 is a long game for a pure F2P

**Confidence:** low · **Consensus:** mechanic · **Priority:** 3/5 · **Recommended for:** F2P · `d41-vip10-reality`

- VIP 10 needs **150,000 cumulative** VIP points [[A05-0001](../research/facts/A05/A05-0001.md)].
- On guaranteed income only (daily claim + 100 gems/day), the derived estimate is about **day 503** [[A05-0007](../research/facts/A05/A05-0007.md)] — an upper bound, since alliance gifts and event gems shorten it.
- Keep buying VIP only **during More Than Gems** [[A11-0502](../research/facts/A11/A11-0502.md)].

**Why:** Many F2P plans assume VIP 10 (daily legendary sculpture) arrives early. On guaranteed income it does not, so plan your commander path around Sun Tzu, Aethelflaed and banked gold sculptures for KvK1.

> **Uncertain:** [A05-0007](../research/facts/A05/A05-0007.md) is derived (baixa); real F2P gem and VIP income is unmeasured (L-A04-01, L-A05-03).
>
> **Pending in-game measurement (T0):** L-A04-01, L-A05-03

> **Low spender note:** With the Growth Fund and the 30-day supply, VIP 10 comes earlier than on F2P income; no card gives a date, and the Growth Fund pays in full only as CH milestones are reached [[A12-0001](../research/facts/A12/A12-0001.md), [A12-0002](../research/facts/A12/A12-0002.md), [A12-0005](../research/facts/A12/A12-0005.md)].

### Pre-KvK1 and KvK1 (about day 85–100+)

#### Eve of the Crusade: cash in the hoard

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P, Low · `pk-eve-of-crusade`

- **Recommended (F2P):** spend the saved **AP items on marauders** during Eve of the Crusade (speedups, gems, credits) [[A09-0007](../research/facts/A09/A09-0007.md)]. Auto-peacekeeping can also attack marauders since 1.1.02 [[A09-0008](../research/facts/A09/A09-0008.md)].
- Since 1.1.12 (T3), Eve of the Crusade opens **together with the Lost Kingdom** in Season 1 [[B01-0503](../research/facts/B01/B01-0503.md), [C04-0002](../research/facts/C04/C04-0002.md)].

**Why:** This is the event the AP-item hoard was built for: its rewards (speedups and gems) feed directly into KvK1 healing and the last CH/T4 timers.

> **Uncertain:** [B01-0503](../research/facts/B01/B01-0503.md) is partially obsolete/baixa: the Lost Kingdom entry requirement (CH17) is single T3, and the Season 1 overlap comes from a T3 patch summary ([C04-0002](../research/facts/C04/C04-0002.md), baixa) plus one player report.
>
> **Pending in-game measurement (T0):** L-B01-03

#### KvK1 readiness checklist

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · `pk-kvk1-readiness`

- [ ] **CH21 reached and T4 researched** for your one troop type [[A01-0001](../research/facts/A01/A01-0001.md), [A02-0501](../research/facts/A02/A02-0501.md), [A08-0506](../research/facts/A08/A08-0506.md)].
- [ ] **One complete march** (e.g. Sun Tzu + Aethelflaed) on epic gear [[A06-0500](../research/facts/A06/A06-0500.md), [A06-0501](../research/facts/A06/A06-0501.md), [A07-0500](../research/facts/A07/A07-0500.md)].
- [ ] **Hospitals** upgraded and empty [[A08-0502](../research/facts/A08/A08-0502.md)].
- [ ] **Speedups** (especially healing-usable ones) and **resource items** banked [[A11-0501](../research/facts/A11/A11-0501.md), [A03-0007](../research/facts/A03/A03-0007.md)].
- [ ] Civilization: consider the planned switch (Germany or a role civilization) [[A14-0003](../research/facts/A14/A14-0003.md)].

**Why:** KvK1 is where the 100 days of preparation are scored. A short checklist catches the cheap misses (full hospital, no speedups) that cost more troops than any commander choice.

> **Uncertain:** KvK1 duration is contested ([B01-0502](../research/facts/B01/B01-0502.md): 60 days per a 2024 T3 source vs "all KvKs last 50 days" per a 2026 player).
>
> **Pending in-game measurement (T0):** L-B01-02, L-A08-02

#### How a F2P fights in KvK1

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · `pk-kvk1-behaviour`

- **Recommended (F2P):** don't lead, stay behind, retreat early, **fill strong rallies** and reinforce instead of trading alone [[A08-0503](../research/facts/A08/A08-0503.md)]. Consensus: **majority**.
- Run **fewer, complete marches** rather than every march slot with weak ones [[A08-0504](../research/facts/A08/A08-0504.md)].
- Protect hospital capacity throughout [[A08-0502](../research/facts/A08/A08-0502.md)].

**Why:** A F2P's T4 march trades badly against spenders' T5 in the open, but adds real value inside a rally or garrison. Fewer, better marches are also cheaper to heal.

> **Uncertain:** [A08-0504](../research/facts/A08/A08-0504.md) is organizado (quote not literal). F2P pairs for KvK1 differ by source ([A06-0513](../research/facts/A06/A06-0513.md), divided): Sun Tzu + Aethelflaed; Aethelflaed + Baibars; YSG + flexible; Alexander + YSG. Field AoE over rally/garrison commanders is single-source ([A06-0512](../research/facts/A06/A06-0512.md)).
>
> **Pending in-game measurement (T0):** L-A06-01

## 4. Daily routine by time budget

### Daily routine — 15 minutes

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P, Low · **Time budget:** ≥ 15 min/day · **Time cost:** pending T0 (L-A10-01) · `daily-15min`

Do these every day, in this order. **Time cost per task: Pending in-game measurement (T0), gap L-A10-01.**

| # | Task | Why it is in the 15-minute tier | Cards |
|---|---|---|---|
| 1 | Claim **VIP points + VIP chest** | Breaking the streak resets 200/day to 40 | [A05-0003](../research/facts/A05/A05-0003.md), [A05-0006](../research/facts/A05/A05-0006.md) |
| 2 | Claim **daily AP** | Free AP; can exceed the cap | [A09-0006](../research/facts/A09/A09-0006.md), [C04-0032](../research/facts/C04/C04-0032.md) |
| 3 | **Refill all queues** (2 builders, research, training, healing) — from the CH8 dashboard | Idle queues are lost progress | [A01-0011](../research/facts/A01/A01-0011.md), [A01-0006](../research/facts/A01/A01-0006.md) |
| 4 | **Alliance help** (help all) | 20 helps = 10 Daily Objective points | [A10-0006](../research/facts/A10/A10-0006.md) |
| 5 | Start **auto-peacekeeping** on barbarians with regenerating AP | Uses AP that would cap | [A09-0008](../research/facts/A09/A09-0008.md), [A09-0007](../research/facts/A09/A09-0007.md) |
| 6 | Send **gatherers to large nodes** in alliance territory before logging off | Offline hours become resources | [A03-0016](../research/facts/A03/A03-0016.md), [A03-0009](../research/facts/A03/A03-0009.md) |

**Skip today if short on time:** Sunset Canyon, Lyceum mock exam, manual barbarians, merchant browsing.

**Why:** The highest-value daily actions are claims (free, streak-based) and keeping timers running. Everything here either protects a streak or keeps the account producing while you are offline.

> **Uncertain:** No source publishes minutes per task; time costs are pending the T0 stopwatch (L-A10-01). The ordering is this guide's judgment from sourced value per completion, not a measured value per minute.
>
> **Patch state:** [C04-0032](../research/facts/C04/C04-0032.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A10-01, L-A09-04

### Daily routine — 30 minutes (adds Daily Objectives)

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P, Low · **Time budget:** ≥ 30 min/day · **Time cost:** pending T0 (L-A10-01) · `daily-30min`

Everything in the 15-minute tier, plus. **Time cost: Pending T0 (L-A10-01).**

| Task | Value | Cards |
|---|---|---|
| Finish **Daily Objectives to 100 points** | 100 gems, Golden Key, 3 epic sculptures; chests on the way give speedups (~170 min/day derived) and 100 AP | [A04-0001](../research/facts/A04/A04-0001.md), [A04-0010](../research/facts/A04/A04-0010.md) |
| Open free **Tavern silver chests** (3/day at Tavern 1–4, up to 10 at Tavern 25) | sculptures, speedups, tomes | [A10-0003](../research/facts/A10/A10-0003.md) |
| **Courier Station / Mysterious Merchant**: free refresh, buy with resources (10 purchases also count for Daily Objectives) | discounted speedups | [A04-0011](../research/facts/A04/A04-0011.md), [A03-0014](../research/facts/A03/A03-0014.md) |
| **Expedition**: claim the 3-star chest, free medal refresh | medals for Aethelflaed | [A10-0004](../research/facts/A10/A10-0004.md) |

**Why:** The 100-point chest is the only guaranteed gem income a F2P has [[A04-0001](../research/facts/A04/A04-0001.md)]; it is worth the extra minutes on any day you have them.

> **Uncertain:** No source publishes minutes per task; time costs are pending the T0 stopwatch (L-A10-01). The ordering is this guide's judgment from sourced value per completion, not a measured value per minute. The Daily Objectives task list changed in 1.1.09 (boost tasks replaced by login and alliance-donation tasks); [A10-0001](../research/facts/A10/A10-0001.md) is partially obsolete and the 170 min/day speedup figure is derived.
>
> **Pending in-game measurement (T0):** L-A10-01, L-A10-02, L-A04-04

### Daily routine — 60 minutes (adds PvE and modes)

**Confidence:** medium · **Consensus:** majority · **Priority:** 3/5 · **Recommended for:** F2P · **Time budget:** ≥ 60 min/day · **Time cost:** pending T0 (L-A10-01) · `daily-60min`

Everything in the 30-minute tier, plus. **Time cost: Pending T0 (L-A10-01).**

| Task | Value | Cards |
|---|---|---|
| **Manual barbarians** in chains (−2 AP per consecutive hit, min 40) and **fort rallies** once forts unlock | EXP, speedups, Books of Covenant (~50% per tier), alliance gifts | [A09-0002](../research/facts/A09/A09-0002.md), [A09-0005](../research/facts/A09/A09-0005.md) |
| **Sunset Canyon** attempts | daily/season rewards; top 5 daily → Golden Key | [A10-0008](../research/facts/A10/A10-0008.md) |
| **Peerless Scholar** mock exam (Mon–Fri, CH10+) | Flashes of Insight; biweekly exams split a gem pool | [A10-0005](../research/facts/A10/A10-0005.md) |
| Active **event** tasks (see Events) | per event | [A11-0512](../research/facts/A11/A11-0512.md) |

**Why:** These add value but either have no quantified yield per minute yet or depend on unlocks. They are the first things to cut when time is short.

> **Uncertain:** No source publishes minutes per task; time costs are pending the T0 stopwatch (L-A10-01). The ordering is this guide's judgment from sourced value per completion, not a measured value per minute.
>
> **Pending in-game measurement (T0):** L-A10-01, L-A10-03, L-A09-03, L-A04-05

### Weekly and fortnightly tasks

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 4/5 · **Recommended for:** F2P, Low · **Time budget:** ≥ 15 min/day · **Time cost:** pending T0 (L-A10-01) · `daily-weekly`

- **VIP Shop (Monday 00:00 UTC):** buy the **food-priced** rows — 30× 100 AP for 12,000 food each (VIP 2) and 50× 5-min universal speedups for 7,000 food each (VIP 3) [[A04-0007](../research/facts/A04/A04-0007.md)].
- **Peerless Scholar** preliminary and final every two weeks (gem pool) [[A10-0005](../research/facts/A10/A10-0005.md)].
- Check the **event calendar** a few days ahead [[A11-0512](../research/facts/A11/A11-0512.md)].

**Why:** The food-priced VIP Shop rows cost no gems and add about 3,000 AP and 250 minutes of speedups per week; if all free AP sources are claimed, the derived weekly total is about 7,200 AP [[A09-0006](../research/facts/A09/A09-0006.md)].

> **Uncertain:** The 7,200 AP/week figure is derived ([A09-0006](../research/facts/A09/A09-0006.md) method) and excludes natural regeneration (L-A09-01). Time cost pending T0 (L-A10-01).
>
> **Pending in-game measurement (T0):** L-A09-01, L-A10-01

### Light days and Break Mode

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 3/5 · **Recommended for:** F2P, Low · **Time budget:** ≥ 0 min/day · **Time cost:** pending T0 (L-A10-01) · `daily-break-mode`

On days you can't play properly, do only:
1. **Claim VIP points** — a missed day costs up to 720 VIP points over the next 8 days (derived) [[A05-0003](../research/facts/A05/A05-0003.md)].
2. **Refill queues with long timers** and send gatherers to large nodes [[A01-0011](../research/facts/A01/A01-0011.md), [A03-0016](../research/facts/A03/A03-0016.md)].
3. Before a longer break: keep raw resources at or below Storehouse protection and the rest as **unopened items** [[A03-0006](../research/facts/A03/A03-0006.md), [A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].

**Why:** Burnout is a top reason players quit. A two-minute floor keeps the streaks and the account safe, so a bad week does not become a reason to stop.

> **Uncertain:** Shield use for multi-day breaks is not covered by any card (PROPOSED-SHIELDS). The 720-point figure is derived from [A05-0003](../research/facts/A05/A05-0003.md).
>
> **Pending in-game measurement (T0):** PROPOSED-SHIELDS, L-A10-01

## 5. Events calendar and preparation

### Events: plan from the in-game calendar

**Confidence:** medium · **Consensus:** unanimous · **Priority:** 4/5 · **Recommended for:** F2P, Low · `ev-calendar-rule`

- Events **do not follow a fixed schedule**; the in-game calendar shows a few days ahead, and kingdoms differ by age and Monument progress [[A11-0512](../research/facts/A11/A11-0512.md)]. Consensus: **unanimous**.
- What is known for a new kingdom:

| Event | Timing | Confidence | Cards |
|---|---|---|---|
| Legendary Pelagius | from day 5 (official) | high (patch note) | [C04-0005](../research/facts/C04/C04-0005.md) |
| More Than Gems | ~monthly, 2 days, kingdoms older than ~21 days | medium | [A11-0502](../research/facts/A11/A11-0502.md) |
| Peerless Scholar | weekdays + biweekly exams | high | [A10-0005](../research/facts/A10/A10-0005.md) |
| Pioneer / Road to Revival | ~day 20–23 | Uncertain (single T3) | [A11-0510](../research/facts/A11/A11-0510.md) |
| First Wheel of Fortune | ~day 24; YSG ~day 94 | Uncertain (single T3) | [A11-0503](../research/facts/A11/A11-0503.md) |
| Ark of Osiris | ~every two weeks | Uncertain (T3) | [A11-0508](../research/facts/A11/A11-0508.md) |
| Sunset Canyon | daily attempts, 7-day seasons | Uncertain (T3) | [A11-0507](../research/facts/A11/A11-0507.md) |

- Live in 2026 per official notes: Sunset Canyon, Champions of Olympia, Arms Training with Lohar [[A11-0513](../research/facts/A11/A11-0513.md)].

**Why:** Any fixed day-by-day event plan would be wrong for most kingdoms. Hoarding rules (what to keep for which kind of event) work without dates; the calendar tells you when.

> **Uncertain:** [A11-0510](../research/facts/A11/A11-0510.md), [A11-0503](../research/facts/A11/A11-0503.md) (partially obsolete), [A11-0508](../research/facts/A11/A11-0508.md) and [A11-0507](../research/facts/A11/A11-0507.md) are baixa. First-occurrence days are a T0 target.
>
> **Patch state:** [C04-0005](../research/facts/C04/C04-0005.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A11-01, L-B01-01

### More Than Gems: the window to spend gems

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P · `ev-more-than-gems`

- **Recommended (F2P, from VIP 6 on):** save gems and spend them on VIP points **during More Than Gems** [[A11-0502](../research/facts/A11/A11-0502.md), [A11-0504](../research/facts/A11/A11-0504.md)]. Consensus: **majority**.
- Reported structure: a **2-day** event with daily gem-spend milestones; reported tiers 7,000 gems/day → 5 universal legendary sculptures and 25,000/day → 13; about **monthly**, only in kingdoms older than ~21 days [[A11-0502](../research/facts/A11/A11-0502.md)].

**Why:** The same gems buy VIP points either way; during MTG they also pay milestone rewards, including gold sculptures, which a F2P otherwise barely sees before VIP 10.

> **Uncertain:** Tier amounts are T3/T4 reports to confirm in game; the cadence was resolved from T3 + T4 ([A11-0502](../research/facts/A11/A11-0502.md) notes).
>
> **Pending in-game measurement (T0):** L-A11-01, L-A11-02

> **Low spender note:** Low spenders should hold purchased gems (Supply Depot, Growth Fund payouts) for MTG as well and time any top-up around the Recharge event [[A12-0005](../research/facts/A12/A12-0005.md), [A12-0002](../research/facts/A12/A12-0002.md)].

### Lohar's Trial / Arms Training: where AP potions go

**Confidence:** medium · **Consensus:** majority · **Priority:** 4/5 · **Recommended for:** F2P, Low · `ev-lohar-ap`

- **Recommended (F2P):** save your AP potions for **Lohar's Trial / Arms Training** and spend them there [[A11-0505](../research/facts/A11/A11-0505.md), [A09-0007](../research/facts/A09/A09-0007.md)]. Consensus: **majority**.
- Arms Training with Lohar is confirmed live in 2026 [[A11-0513](../research/facts/A11/A11-0513.md)].

**Why:** It is one of the few events where a F2P's AP turns into gems and high-value rewards at a better rate than ordinary barbarians.

> **Uncertain:** First occurrence day and reward tables are not captured (L-A11-01, L-A11-02).
>
> **Pending in-game measurement (T0):** L-A11-01, L-A11-02

### Mightiest Governor (MGE): milestones, not ranking

**Confidence:** medium · **Consensus:** majority · **Priority:** 3/5 · **Recommended for:** F2P · `ev-mge`

- **Recommended (F2P):** take MGE **milestone** rewards; don't chase the ranking — or follow your kingdom's MGE rules [[A11-0500](../research/facts/A11/A11-0500.md)]. Consensus: **majority**.

**Why:** Ranking rewards go to spenders in a new kingdom; milestones are reachable and cost only what you would use anyway. Many kingdoms also assign MGE ranks, and breaking those rules has social costs.

> **Uncertain:** Current MGE format is not captured (L-A11-04, L-B05-01).
>
> **Pending in-game measurement (T0):** L-A11-04, L-B05-01

### Wheel of Fortune: planned target only

**Confidence:** low · **Consensus:** majority · **Priority:** 2/5 · **Recommended for:** F2P · `ev-wheel-of-fortune`

- F2P consensus: spin only for a **planned target**, usually stopping at **10 spins**, ideally after VIP 10 [[A11-0503](../research/facts/A11/A11-0503.md)].
- Spins now need **Spin Tickets** in Season 2/3/SoC (official) and, per a third-party summary, in Season 1 since 1.1.12 [[C04-0022](../research/facts/C04/C04-0022.md)]. Older gem-per-spin math is wrong where tickets apply.

**Why:** The Wheel is the main early route to a featured legendary (YSG is reported around day 94 [[A06-0502](../research/facts/A06/A06-0502.md)]), but unplanned spins are the classic F2P gem sink.

> **Uncertain:** [A11-0503](../research/facts/A11/A11-0503.md) is partially obsolete/baixa (its gem cost predates Spin Tickets). Home-kingdom pricing is unknown (L-A11-03).
>
> **Patch state:** [C04-0022](../research/facts/C04/C04-0022.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A11-03

### Which events to prioritise and which to skip

**Confidence:** low · **Consensus:** split · **Priority:** 2/5 · **Recommended for:** F2P · `ev-priorities`

- **Prioritise:** guaranteed-milestone and alliance PvE events — Lohar's Trial, Karuak Ceremony, Golden Kingdom, Ceroli Crisis, Alliance Mobilization, Shadow Legion [[A11-0506](../research/facts/A11/A11-0506.md)].
- **Skip:** Race Against Time, repeated gem-spending events, open power rankings [[A11-0511](../research/facts/A11/A11-0511.md)].
- **Split:** Ark of Osiris — good sculpture source vs "F2P cannot compete" [[A11-0508](../research/facts/A11/A11-0508.md)]. Champions of Olympia is called the most F2P-friendly mode by one source [[A11-0509](../research/facts/A11/A11-0509.md)]. Pioneer / Road to Revival: buy the four gold keys first (one source) [[A11-0510](../research/facts/A11/A11-0510.md)].

**Why:** Events with guaranteed milestones pay F2P effort; events ranked on spending or raw power do not.

**Both views (split):** Ark of Osiris: valuable for sculptures vs not competitive for F2P [[A11-0508](../research/facts/A11/A11-0508.md)].

> **Uncertain:** All five cards ([A11-0506](../research/facts/A11/A11-0506.md), [A11-0511](../research/facts/A11/A11-0511.md), [A11-0508](../research/facts/A11/A11-0508.md), [A11-0509](../research/facts/A11/A11-0509.md), [A11-0510](../research/facts/A11/A11-0510.md)) are baixa. Reward tables per event are a gap.
>
> **Pending in-game measurement (T0):** L-A11-02

## 6. Farms

*Brief only. The dedicated farm guide (F-03: single-resource, general and resource-pair farms) will replace this section.*

### Farm accounts (brief; full guide to come)

**Confidence:** medium · **Consensus:** majority · **Priority:** 2/5 · **Recommended for:** F2P, Low · `farm-brief`

- **Purpose:** a farm gathers resources and ships them to the main through the Trading Post (taxed); side uses include MGE points, Books of Covenant and KvK support [[A13-0010](../research/facts/A13/A13-0010.md)]. Consensus: **majority**.
- **Targets:** CH11 (3 marches) to start, CH17 (4) as the practical minimum, CH22 (5) as a strong target [[A13-0002](../research/facts/A13/A13-0002.md)]; Trading Post ≥ 15 on the farm [[A13-0003](../research/facts/A13/A13-0003.md)].
- **Tax** falls from 35% (Trading Post L1) to 21% (L15), 10% (L24) and 8% (L25) [[A03-0024](../research/facts/A03/A03-0024.md)].
- Only resources **above Storehouse protection** can be shipped [[A03-0030](../research/facts/A03/A03-0030.md)]; gold can be sent [[A03-0027](../research/facts/A03/A03-0027.md)]; each transfer uses a march and travel time [[A03-0026](../research/facts/A03/A03-0026.md)].
- Ship surplus regularly; don't keep big raw piles on a low-CH farm during kill events [[A13-0005](../research/facts/A13/A13-0005.md)].
- **No scripts on farms** (Conduct Score) [[C04-0006](../research/facts/C04/C04-0006.md)].

The dedicated farm guide (single-resource, general and resource-pair variants) is planned as F-03.

**Why:** Farms are the most common way a F2P main gets extra resources without spending, but they cost daily minutes that are not yet measured, so they belong after the main routine is under control.

> **Uncertain:** Two cities per kingdom via Character Management ([A13-0001](../research/facts/A13/A13-0001.md), organizado). Farm minutes and yield per day are unknown. Resource-pair farms have no source (hypothesis only). Official farm policy is unconfirmed.
>
> **Patch state:** [C04-0006](../research/facts/C04/C04-0006.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A13-01, L-A13-02, L-A13-03, L-A03-03

## 7. Mistakes to avoid

### Mistakes that cost F2P the most

**Confidence:** medium · **Consensus:** majority · **Priority:** 5/5 · **Recommended for:** F2P, Low · `mistakes-economy`

1. **Breaking the VIP streak** (back to 40/day) [[A05-0003](../research/facts/A05/A05-0003.md)].
2. **Sitting at the AP cap** (1,500) instead of spending regenerating AP [[A09-0001](../research/facts/A09/A09-0001.md), [A09-0007](../research/facts/A09/A09-0007.md)].
3. **Finishing timers with gems** or **buying AP with gems** [[A04-0009](../research/facts/A04/A04-0009.md), [A04-0008](../research/facts/A04/A04-0008.md)].
4. **Spreading sculptures** over several commanders [[A06-0500](../research/facts/A06/A06-0500.md)]; **gold sculptures on gatherers or temporary picks** [[A06-0510](../research/facts/A06/A06-0510.md)].
5. **Letting hospitals overflow** (overflow dies) [[A08-0502](../research/facts/A08/A08-0502.md)].
6. **Leading fights** as a F2P instead of filling rallies [[A08-0503](../research/facts/A08/A08-0503.md)].
7. **Keeping raw resources above Storehouse protection** when items would be safe [[A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].
8. **Building outside the CH chain** before CH21 [[A01-0007](../research/facts/A01/A01-0007.md)].

**Why:** Each of these wastes something a F2P cannot buy back: a streak, free AP, gems, sculptures or troops.


### Mistake: following outdated advice

**Confidence:** medium · **Consensus:** mechanic · **Priority:** 3/5 · **Recommended for:** F2P, Low · `mistakes-outdated-advice`

Check the date and patch of any guide. Common outdated items [[C04-0004](../research/facts/C04/C04-0004.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0024](../research/facts/C04/C04-0024.md), [C04-0006](../research/facts/C04/C04-0006.md)]:
- resource boosts (removed in 1.1.09);
- jumper accounts / Beginner's Immigration (gone since 2025-03-26);
- gem-per-spin Wheel of Fortune math (Spin Tickets);
- "VIP caps at 18" (VIP19 and SVIP since 1.0.87);
- bots for barbarians/gathering (Conduct Score since 1.1.07).

**Why:** Many top search results are years old or show auto-bumped dates. Following them wastes resources on things that no longer exist.

> **Uncertain:** [C04-0026](../research/facts/C04/C04-0026.md) rests on an in-game mail quoted by players plus wiki/guide.
>
> **Patch state:** [C04-0004](../research/facts/C04/C04-0004.md), [C04-0006](../research/facts/C04/C04-0006.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0024](../research/facts/C04/C04-0024.md), [C04-0026](../research/facts/C04/C04-0026.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).

## 8. If you got zeroed

### If you got zeroed

**Confidence:** low · **Consensus:** mechanic · **Priority:** 3/5 · **Recommended for:** F2P, Low · `recovery-zeroed`

**What survives** [[A03-0007](../research/facts/A03/A03-0007.md), [A08-0502](../research/facts/A08/A08-0502.md)]:
- Resource **items** and **gems** cannot be plundered.
- Troops are wounded into hospitals up to capacity; beyond capacity they die, and some actions always kill severely wounded.

**What to do now**
1. **Heal before retraining** — healing is far cheaper than retraining (direction agreed by sources; amounts not quantified) [[A08-0502](../research/facts/A08/A08-0502.md)].
2. **Stop the bleeding:** keep raw resources at or below Storehouse protection, the rest as items [[A03-0006](../research/facts/A03/A03-0006.md), [A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].
3. **Restart vs continue:** a fresh account can no longer jump to a new kingdom with Beginner's Immigration [[C04-0026](../research/facts/C04/C04-0026.md)]; immigration rules were tightened in 2026 [[C04-0008](../research/facts/C04/C04-0008.md)]. Continuing is usually the only realistic F2P option.
4. Re-check the readiness checklist and rebuild **one** complete march first [[A06-0500](../research/facts/A06/A06-0500.md)].

**Why:** Being zeroed is a top reason players quit. Knowing what was *not* lost, and what to rebuild first, turns a disaster into a delay.

> **Uncertain:** Severe-wound/death rules lack official text (L-A08-03); heal vs retrain cost is not quantified (L-A08-01). Shield rules are not researched (PROPOSED-SHIELDS). [C04-0008](../research/facts/C04/C04-0008.md) is a patch-state card (immigration limits, pioneer parts).
>
> **Patch state:** [C04-0008](../research/facts/C04/C04-0008.md), [C04-0026](../research/facts/C04/C04-0026.md) (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).
>
> **Pending in-game measurement (T0):** L-A08-01, L-A08-03, PROPOSED-SHIELDS, L-B06-03

## 9. Open questions and pending measurements

### Open questions / pending in-game measurements (T0)

**Confidence:** pending · **Consensus:** n/a · **Priority:** 1/5 · `open-pending-measurements`

These gaps weaken specific parts of this guide; the T0 protocol (`research/protocolos/t0-medicao.md`) is designed to close them.

| Gap | What it would change | Blocks affected |
|---|---|---|
| L-A10-01 minutes per task | Time costs and the 15/30/60 ordering | daily-* |
| L-A04-01 real F2P gem income | VIP 6 / VIP 10 dates, MTG budget | ov-budget-reality-check, d15-vip6-milestone |
| L-A01-03 buffed build times | Real CH17/CH21 dates | d0-build-order, d41-ch21-t4 |
| L-A02-03 time to T4 | Resolves "T4 ~day 30" vs ~163 raw builder-days | d41-ch21-t4 |
| L-A02-02 speedup allocation model | Turns the spend-vs-hoard split into a rule | d41-speedups-spend-vs-hoard |
| L-A04-04 speedup income/day | Speedup budget for CH21 | d41-speedups-spend-vs-hoard |
| L-A09-01 AP regeneration | Barbarians/day | d0-ap-discipline |
| L-A10-02 Daily Objectives after 1.1.09 | Cheapest path to 100 points | daily-30min |
| L-A11-01 event first-occurrence days | Event calendar | ev-calendar-rule |
| L-A06-03 sculpture income | Commander plan | d15-commander-checklist |
| L-A01-01 early unlock levels | Academy / Quarry / Trading Post CH | d0-build-order |
| L-B01-03 Lost Kingdom entry, Eve timing | Pre-KvK plan | pk-eve-of-crusade |
| PROPOSED-SHIELDS shield and beginner protection | Safety and Break Mode advice | d0-day1-survival, recovery-zeroed |

**Why:** Saying what we don't know is part of the guide's value: you can see which advice is solid and which is waiting for measurement.

> **Pending in-game measurement (T0):** L-A10-01, L-A04-01, L-A01-03, L-A02-03, L-A02-02, L-A04-04, L-A09-01, L-A10-02, L-A11-01, L-A06-03, L-A01-01, L-B01-03, PROPOSED-SHIELDS

## Appendix: Sources and confidence

**120 fact cards cited**; 77 pass the firm filter (`verificado` + `media`/`alta`). The others appear only inside *Uncertain* notes or as *Patch state*.

| Card | Title | Status | Confidence | Consensus | Firm? | Used in |
|---|---|---|---|---|---|---|
| [A01-0001](../research/facts/A01/A01-0001.md) | City Hall CH1→CH25: requirements, cost, raw time, troop capacity, unlocks (table) | verificado | media | n/a | yes | `ov-budget-reality-check`, `d0-build-order`, `d15-ch10-ch17`, `d15-equipment`, `d41-ch21-t4`, `pk-kvk1-readiness` |
| [A01-0002](../research/facts/A01/A01-0002.md) | City Hall upgrade rewards per level (resources, speedups, gems, civilization change) | verificado | media | n/a | yes | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17`, `d41-ch21-t4`, `d41-speedups-spend-vs-hoard` |
| [A01-0003](../research/facts/A01/A01-0003.md) | City Hall level caps the level of every other building | verificado | media | n/a | yes | `d0-build-order` |
| [A01-0004](../research/facts/A01/A01-0004.md) | Prerequisite rule for each building in the City Hall chain (table) | verificado | media | n/a | yes | `d0-build-order` |
| [A01-0005](../research/facts/A01/A01-0005.md) | Minimum building set and total raw build time to reach CH10/13/16/17/20/21/22/25 (derived) | verificado | baixa | n/a | no | `d0-build-order`, `d15-ch10-ch17`, `d41-ch21-t4` |
| [A01-0006](../research/facts/A01/A01-0006.md) | Builder queue: 1 by default, 2nd via Builder Recruitment (2 days) or permanently at VIP 6 | verificado | alta | n/a | yes | `d0-first-gems-vip`, `d15-vip6-milestone`, `daily-15min` |
| [A01-0007](../research/facts/A01/A01-0007.md) | F2P build priority: City Hall and its prerequisites first; everything else waits | verificado | media | majoritario | yes | `d0-build-order`, `d4-gathering-setup`, `mistakes-economy` |
| [A01-0008](../research/facts/A01/A01-0008.md) | Hospital capacity per level: outdated values in riseofkingdomsguides (Lv1 3,000 / Lv15 24, | verificado | alta | n/a | yes | `d4-ch8-ch12-checkpoints`, `d41-hospital` |
| [A01-0009](../research/facts/A01/A01-0009.md) | Conflicting low-level prerequisites between Fandom and riseofkingdomsguides (Academy, Stab | contestado | baixa | n/a | no | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-research-economy` |
| [A01-0011](../research/facts/A01/A01-0011.md) | Queue management dashboard unlocks at City Hall 8 (construction, training, research, heali | verificado | alta | n/a | yes | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `daily-15min`, `daily-break-mode` |
| [A02-0500](../research/facts/A02/A02-0500.md) | Research: speed/economy techs first (Writing, Masonry/Engineering, Mathematics) | verificado | media | majoritario | yes | `d4-research-economy` |
| [A02-0501](../research/facts/A02/A02-0501.md) | Military path: T3 → T4 (skip siege) → shared combat techs → one branch → T5 | verificado | media | majoritario | yes | `d15-research-military`, `pk-kvk1-readiness` |
| [A02-0503](../research/facts/A02/A02-0503.md) | Where universal speedups go: research vs City Hall — divided | verificado | baixa | dividido | no | `d41-speedups-spend-vs-hoard` |
| [A02-0504](../research/facts/A02/A02-0504.md) | Time cost of research is long (Combat Tactics 10 ≈ 100 days, avg player) | verificado | baixa | fonte_unica | no | `d15-research-military` |
| [A03-0006](../research/facts/A03/A03-0006.md) | Storehouse protection capacity by level | verificado | media | n/a | yes | `d0-day1-survival`, `daily-break-mode`, `recovery-zeroed` |
| [A03-0007](../research/facts/A03/A03-0007.md) | Resource items vs raw resources (plunder safety) | verificado | media | n/a | yes | `d0-day1-survival`, `pk-kvk1-readiness`, `daily-break-mode`, `mistakes-economy`, `recovery-zeroed` |
| [A03-0009](../research/facts/A03/A03-0009.md) | Alliance territory gives +25% gathering speed | verificado | alta | n/a | yes | `d0-join-alliance`, `d4-gathering-setup`, `daily-15min` |
| [A03-0013](../research/facts/A03/A03-0013.md) | Enhanced Gathering boost items (+50%, 8h/24h) and how to get them | verificado | alta | n/a | yes | `d4-gathering-setup` |
| [A03-0014](../research/facts/A03/A03-0014.md) | Mysterious Merchant: daily at 00:00 UTC, food/wood-priced items | verificado | media | n/a | yes | `daily-30min` |
| [A03-0016](../research/facts/A03/A03-0016.md) | Node level affects total amount, not gathering speed; pick node by availability | verificado | media | majoritario | yes | `d4-gathering-setup`, `daily-15min`, `daily-break-mode` |
| [A03-0017](../research/facts/A03/A03-0017.md) | Gathering commander setup: talents, level 37, primary only | verificado | media | majoritario | yes | `d4-early-commanders` |
| [A03-0021](../research/facts/A03/A03-0021.md) | Resource bottleneck progression by CH stage | verificado | media | majoritario | yes | `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17` |
| [A03-0023](../research/facts/A03/A03-0023.md) | March queues (gathering armies) by CH level | verificado | media | n/a | yes | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-gathering-setup`, `d15-ch10-ch17`, `d41-ch21-t4` |
| [A03-0024](../research/facts/A03/A03-0024.md) | Trading Post tax rate by level | verificado | alta | n/a | yes | `farm-brief` |
| [A03-0025](../research/facts/A03/A03-0025.md) | Trading Post capacity per trip and unlock CH (conflicting) | contestado | media | n/a | no | `d4-ch8-ch12-checkpoints` |
| [A03-0026](../research/facts/A03/A03-0026.md) | Trading Post transfers use a march queue and travel time | verificado | media | n/a | yes | `farm-brief` |
| [A03-0027](../research/facts/A03/A03-0027.md) | Gold CAN be sent via Trading Post (only the amount above Storehouse protection is sendable | verificado | media | majoritario | yes | `farm-brief` |
| [A03-0030](../research/facts/A03/A03-0030.md) | Storehouse-protected resources cannot be transported | verificado | alta | n/a | yes | `farm-brief` |
| [A04-0001](../research/facts/A04/A04-0001.md) | Daily Objectives 100-activity-point chest gives 100 gems per day (main guaranteed F2P gem  | verificado | media | n/a | yes | `ov-budget-reality-check`, `d4-early-commanders`, `d15-vip6-milestone`, `daily-30min` |
| [A04-0007](../research/facts/A04/A04-0007.md) | VIP Shop: items, gem/resource prices, VIP level required, quantity per refresh (table) + d | verificado | media | n/a | yes | `d41-speedups-spend-vs-hoard`, `daily-weekly` |
| [A04-0008](../research/facts/A04/A04-0008.md) | Buying Action Points with gems: 500 AP for 100 gems, +50 gems per purchase, resets daily | verificado | media | n/a | yes | `d0-first-gems-vip`, `mistakes-economy` |
| [A04-0009](../research/facts/A04/A04-0009.md) | Where F2P should spend gems: VIP first; avoid finishing builds with gems; save for More Th | verificado | media | majoritario | yes | `d0-first-gems-vip`, `mistakes-economy` |
| [A04-0010](../research/facts/A04/A04-0010.md) | Free speedup sources for F2P (qualitative list) and early fixed speedups | verificado | media | n/a | yes | `d41-speedups-spend-vs-hoard`, `daily-30min` |
| [A04-0011](../research/facts/A04/A04-0011.md) | Mysterious Merchant / Courier Station: 5 refreshes per visit, 1 free refresh per 24h; buy  | verificado | media | majoritario | yes | `daily-30min` |
| [A05-0001](../research/facts/A05/A05-0001.md) | VIP points needed per VIP level (VIP 1–18) | verificado | media | n/a | yes | `d15-vip6-milestone`, `d41-vip10-reality` |
| [A05-0003](../research/facts/A05/A05-0003.md) | Daily free VIP points: 40 on day 1, +20 per consecutive day, capped at 200/day; missing a  | verificado | media | n/a | yes | `d0-first-gems-vip`, `daily-15min`, `daily-break-mode`, `mistakes-economy` |
| [A05-0004](../research/facts/A05/A05-0004.md) | F2P sources of VIP points (daily chest, gems 1:1, alliance shop, alliance gifts, Mysteriou | verificado | media | n/a | yes | `d0-join-alliance`, `d0-first-gems-vip` |
| [A05-0006](../research/facts/A05/A05-0006.md) | Daily free VIP chest contents by level; legendary commander sculptures from VIP 10 (1/day) | verificado | media | n/a | yes | `d0-first-gems-vip`, `d15-vip6-milestone`, `daily-15min` |
| [A05-0007](../research/facts/A05/A05-0007.md) | Realistic F2P VIP: days to reach VIP 5/6/7/8/10 from daily chest alone vs daily chest + 10 | verificado | baixa | n/a | no | `ov-budget-reality-check`, `d15-vip6-milestone`, `d41-vip10-reality` |
| [A05-0008](../research/facts/A05/A05-0008.md) | F2P VIP target: spend free gems on VIP to reach VIP 6 early, then VIP 10 (majority) vs. ne | verificado | media | majoritario | yes | `d0-first-gems-vip` |
| [A06-0500](../research/facts/A06/A06-0500.md) | F2P: concentrate on one complete march instead of spreading sculptures | verificado | media | unanime | yes | `d4-early-commanders`, `d15-commander-checklist`, `pk-kvk1-readiness`, `mistakes-economy`, `recovery-zeroed` |
| [A06-0501](../research/facts/A06/A06-0501.md) | Sun Tzu (epic) is the safest early F2P investment | verificado | media | majoritario | yes | `d0-civilization`, `d4-early-commanders`, `d15-expedition-aethelflaed`, `pk-kvk1-readiness` |
| [A06-0502](../research/facts/A06/A06-0502.md) | Yi Seong-Gye (YSG) is the top F2P legendary target | verificado | media | majoritario | yes | `d15-commander-checklist`, `ev-wheel-of-fortune` |
| [A06-0503](../research/facts/A06/A06-0503.md) | Mid-tier legendaries (Richard I, Charles Martel, Cao Cao): divided | verificado | baixa | dividido | no | `d15-commander-checklist` |
| [A06-0504](../research/facts/A06/A06-0504.md) | Aethelflaed is a free legendary obtainable via Expedition Store | verificado | media | majoritario | yes | `d15-commander-checklist`, `d15-expedition-aethelflaed` |
| [A06-0505](../research/facts/A06/A06-0505.md) | Early barbarian/PvE commander: level only one of Boudica or Lohar; no gold sculptures | verificado | media | majoritario | yes | `d4-early-commanders` |
| [A06-0506](../research/facts/A06/A06-0506.md) | Level a gathering commander to 37 early (Centurion first) | verificado | baixa | majoritario | no | `d4-early-commanders` |
| [A06-0508](../research/facts/A06/A06-0508.md) | Pelagius (legendary) as an early-server pick: divided | verificado | baixa | dividido | no | `d4-pelagius-day5` |
| [A06-0509](../research/facts/A06/A06-0509.md) | Long-term value of epic commanders: divided | verificado | baixa | dividido | no | `d4-early-commanders` |
| [A06-0510](../research/facts/A06/A06-0510.md) | Reserve universal (gold) sculptures and tomes for one long-term legendary | verificado | media | majoritario | yes | `d15-commander-checklist`, `mistakes-economy` |
| [A06-0512](../research/facts/A06/A06-0512.md) | F2P should favor open-field (fighting, AoE) commanders over rally/garrison | verificado | baixa | fonte_unica | no | `pk-kvk1-behaviour` |
| [A06-0513](../research/facts/A06/A06-0513.md) | Pairs suggested for an F2P first KvK | verificado | baixa | dividido | no | `pk-kvk1-behaviour` |
| [A06-0516](../research/facts/A06/A06-0516.md) | Alliance gift chests are a major F2P sculpture/gem source — join a spending alliance | verificado | media | unanime | yes | `ov-budget-reality-check`, `d0-new-kingdom-start`, `d0-join-alliance` |
| [A07-0500](../research/facts/A07/A07-0500.md) | Early F2P equipment: cheap green/blue sets; epic as KvK baseline; legendary later | verificado | media | majoritario | yes | `d15-equipment`, `pk-kvk1-readiness` |
| [A07-0501](../research/facts/A07/A07-0501.md) | Hoard legendary materials; don't burn them on early gear | organizado | baixa | majoritario | no | `d15-equipment` |
| [A07-0504](../research/facts/A07/A07-0504.md) | Legendary over epic gives small marginal gain per piece | verificado | baixa | fonte_unica | no | `d15-equipment` |
| [A08-0500](../research/facts/A08/A08-0500.md) | T4 is the troop tier for an F2P first KvK; T5 is a long-term goal | verificado | media | majoritario | yes | `ov-budget-reality-check`, `d41-ch21-t4` |
| [A08-0502](../research/facts/A08/A08-0502.md) | Hospital overflow kills troops; keep capacity and heal-speedups | verificado | media | unanime | yes | `d0-day1-survival`, `d41-hospital`, `pk-kvk1-readiness`, `pk-kvk1-behaviour`, `mistakes-economy`, `recovery-zeroed` |
| [A08-0503](../research/facts/A08/A08-0503.md) | F2P combat behavior: never lead, stay behind, retreat early, fill rallies | verificado | media | majoritario | yes | `ov-budget-reality-check`, `pk-kvk1-behaviour`, `mistakes-economy` |
| [A08-0504](../research/facts/A08/A08-0504.md) | Run fewer, complete marches rather than all march slots | organizado | media | majoritario | no | `pk-kvk1-behaviour` |
| [A08-0505](../research/facts/A08/A08-0505.md) | T5 heals cost much more; without strong economy fight with T4 | verificado | media | majoritario | yes | `d41-hospital` |
| [A08-0506](../research/facts/A08/A08-0506.md) | Choose one troop type for T5 (infantry or cavalry first) | verificado | media | majoritario | yes | `d15-research-military`, `d15-commander-checklist`, `pk-kvk1-readiness` |
| [A09-0001](../research/facts/A09/A09-0001.md) | Action Points: cap 1,500 (raised from 1,000 in 1.0.41, Dec 2020) plus a claimable 500 AP/d | verificado | alta | n/a | yes | `ov-patch-state`, `d0-ap-discipline`, `mistakes-economy` |
| [A09-0002](../research/facts/A09/A09-0002.md) | Barbarian attack cost: 50 AP, −2 AP per consecutive attack without returning (max −10), fu | verificado | media | n/a | yes | `d0-ap-discipline`, `daily-60min` |
| [A09-0004](../research/facts/A09/A09-0004.md) | Barbarian level unlocks: personal (beat previous level) and kingdom-wide (only Lv.1–6 at k | verificado | media | n/a | yes | `d0-ap-discipline` |
| [A09-0005](../research/facts/A09/A09-0005.md) | Barbarian Forts: rally-only; Lv.1–5 recommended troops and alliance gift keys; ~50% chance | verificado | media | n/a | yes | `d0-join-alliance`, `daily-60min` |
| [A09-0006](../research/facts/A09/A09-0006.md) | Free AP recovery items for F2P: 100 AP daily (Daily Objectives 60-pt chest), 30×100 AP wee | verificado | media | n/a | yes | `d0-ap-discipline`, `daily-15min`, `daily-weekly` |
| [A09-0007](../research/facts/A09/A09-0007.md) | AP spending strategy for F2P: never cap AP; forts for Books of Covenant until Castle 25; b | verificado | media | majoritario | yes | `d0-ap-discipline`, `pk-eve-of-crusade`, `daily-15min`, `ev-lohar-ap`, `mistakes-economy` |
| [A09-0008](../research/facts/A09/A09-0008.md) | Built-in auto-peacekeeping (automatic barbarian hunting) exists; third-party scripts are p | verificado | alta | n/a | yes | `ov-patch-state`, `d0-day1-survival`, `pk-eve-of-crusade`, `daily-15min` |
| [A10-0001](../research/facts/A10/A10-0001.md) | Daily Objectives: tasks, activity points and chest thresholds (20/40/60/80/100) — list par | parcialmente_obsoleto | baixa | n/a | no | `d41-speedups-spend-vs-hoard`, `daily-30min` |
| [A10-0002](../research/facts/A10/A10-0002.md) | Consolidated F2P daily/weekly checklist (tasks, frequency/cap, yield, dependency) — minute | verificado | baixa | majoritario | no | `d4-research-economy` |
| [A10-0003](../research/facts/A10/A10-0003.md) | Tavern: daily free silver chests (3 → 10 by Tavern level) and free golden chest interval ( | verificado | media | n/a | yes | `daily-30min` |
| [A10-0004](../research/facts/A10/A10-0004.md) | Expedition: 3-star missions give a free daily claim; Medal Shop (1 free refresh/day, then  | verificado | media | n/a | yes | `d15-commander-checklist`, `d15-expedition-aethelflaed`, `daily-30min` |
| [A10-0005](../research/facts/A10/A10-0005.md) | Peerless Scholar (Lyceum of Wisdom, CH10): one Mock Exam per weekday; Preliminary and Fina | verificado | alta | n/a | yes | `d4-ch8-ch12-checkpoints`, `daily-60min`, `daily-weekly`, `ev-calendar-rule` |
| [A10-0006](../research/facts/A10/A10-0006.md) | Alliance help: each help fills 1% of the bar; times you can be helped = Alliance Center le | verificado | alta | n/a | yes | `d0-join-alliance`, `daily-15min` |
| [A10-0008](../research/facts/A10/A10-0008.md) | Sunset Canyon: daily free attempts (VIP adds +1…+5); top-5 daily rank gives Golden Key rew | verificado | media | n/a | yes | `daily-60min` |
| [A11-0500](../research/facts/A11/A11-0500.md) | MGE: F2P should take milestone rewards, not chase ranking | verificado | media | majoritario | yes | `ov-budget-reality-check`, `ev-mge` |
| [A11-0501](../research/facts/A11/A11-0501.md) | Hoard speedups/resources/AP for scored events and KvK instead of spending as they come | verificado | media | majoritario | yes | `d41-speedups-spend-vs-hoard`, `pk-kvk1-readiness` |
| [A11-0502](../research/facts/A11/A11-0502.md) | More Than Gems: the best window to spend gems; F2P target 7k/day tier | verificado | media | majoritario | yes | `d15-vip6-milestone`, `d41-vip10-reality`, `ev-calendar-rule`, `ev-more-than-gems` |
| [A11-0503](../research/facts/A11/A11-0503.md) | Wheel of Fortune: F2P do the first 10 spins on a commander they need | parcialmente_obsoleto | baixa | majoritario | no | `ev-calendar-rule`, `ev-wheel-of-fortune` |
| [A11-0504](../research/facts/A11/A11-0504.md) | Gem spending priority for F2P: VIP first | verificado | media | majoritario | yes | `d15-vip6-milestone`, `ev-more-than-gems` |
| [A11-0505](../research/facts/A11/A11-0505.md) | Lohar's Trial is a high-value event for F2P; save AP for it | verificado | media | majoritario | yes | `d0-ap-discipline`, `ev-lohar-ap` |
| [A11-0506](../research/facts/A11/A11-0506.md) | F2P priority events: guaranteed-milestone & alliance PvE events | verificado | baixa | majoritario | no | `ev-priorities` |
| [A11-0507](../research/facts/A11/A11-0507.md) | Sunset Canyon: daily free attempts; push before season reset | verificado | baixa | minoritario | no | `ev-calendar-rule` |
| [A11-0508](../research/facts/A11/A11-0508.md) | Ark of Osiris value for F2P: divided | verificado | baixa | dividido | no | `ev-calendar-rule`, `ev-priorities` |
| [A11-0509](../research/facts/A11/A11-0509.md) | Champions of Olympia called the most F2P-friendly mode | verificado | baixa | minoritario | no | `ev-priorities` |
| [A11-0510](../research/facts/A11/A11-0510.md) | Pioneer / Road to Revival (~day 20–23): buy the 4 gold keys | verificado | baixa | fonte_unica | no | `ev-calendar-rule`, `ev-priorities` |
| [A11-0511](../research/facts/A11/A11-0511.md) | Events which F2P should skip | verificado | baixa | majoritario | no | `ov-budget-reality-check`, `ev-priorities` |
| [A11-0512](../research/facts/A11/A11-0512.md) | Event schedule is not fixed — plan from the in-game calendar | verificado | media | unanime | yes | `daily-60min`, `daily-weekly`, `ev-calendar-rule` |
| [A11-0513](../research/facts/A11/A11-0513.md) | Events confirmed as current in 2026 sources | verificado | media | n/a | yes | `ev-calendar-rule`, `ev-lohar-ap` |
| [A12-0001](../research/facts/A12/A12-0001.md) | Growth Fund: $15 one-time, ~81,000 gems, full value needs CH24 | verificado | media | unanime | yes | `ov-budget-reality-check`, `d0-first-gems-vip`, `d41-vip10-reality` |
| [A12-0002](../research/facts/A12/A12-0002.md) | Supply Depot (30-day gem supply): ~$10, ~19,500 gems | verificado | media | majoritario | yes | `ov-budget-reality-check`, `d15-vip6-milestone`, `d41-vip10-reality`, `ev-more-than-gems` |
| [A12-0005](../research/facts/A12/A12-0005.md) | Low-spender spending discipline | verificado | media | majoritario | yes | `ov-budget-reality-check`, `d41-vip10-reality`, `ev-more-than-gems` |
| [A13-0001](../research/facts/A13/A13-0001.md) | Accounts per kingdom via Character Management | organizado | media | n/a | no | `farm-brief` |
| [A13-0002](../research/facts/A13/A13-0002.md) | Farm City Hall targets by march queues | verificado | media | majoritario | yes | `farm-brief` |
| [A13-0003](../research/facts/A13/A13-0003.md) | Farm Trading Post level targets | verificado | media | majoritario | yes | `farm-brief` |
| [A13-0005](../research/facts/A13/A13-0005.md) | Farm risks: raids, kill events, zeroing | verificado | media | majoritario | yes | `d0-day1-survival`, `farm-brief`, `daily-break-mode`, `mistakes-economy`, `recovery-zeroed` |
| [A13-0010](../research/facts/A13/A13-0010.md) | Purpose of farms for main growth (F2P) | verificado | media | majoritario | yes | `farm-brief` |
| [A14-0001](../research/facts/A14/A14-0001.md) | Civilization bonuses, starting commanders and special units (15 civilizations) — table | verificado | media | n/a | yes | `d0-civilization` |
| [A14-0002](../research/facts/A14/A14-0002.md) | Changing civilization: free item at CH10; otherwise 10,000 gems (Shop) or 2M individual cr | verificado | alta | n/a | yes | `ov-patch-state`, `d0-civilization`, `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17` |
| [A14-0003](../research/facts/A14/A14-0003.md) | Civilization choice for an early F2P: China (building speed + AP + Sun Tzu) is the most re | verificado | media | majoritario | yes | `d0-civilization`, `pk-kvk1-readiness` |
| [B01-0500](../research/facts/B01/B01-0500.md) | First KvK starts when kingdom is ~85–100 days old | verificado | media | majoritario | yes | `ov-budget-reality-check`, `d0-new-kingdom-start` |
| [B01-0502](../research/facts/B01/B01-0502.md) | KvK durations and gaps | contestado | baixa | n/a | no | `pk-kvk1-readiness` |
| [B01-0503](../research/facts/B01/B01-0503.md) | Lost Kingdom (KvK1) entry needs City Hall 17; opens after Eve of the Crusade | parcialmente_obsoleto | baixa | n/a | no | `d15-ch10-ch17`, `pk-eve-of-crusade` |
| [B01-0506](../research/facts/B01/B01-0506.md) | New kingdoms: the F2P–spender gap is largest early; first 60–90 days set hierarchy | verificado | baixa | majoritario | no | `ov-budget-reality-check`, `d0-new-kingdom-start` |
| [B01-0700](../research/facts/B01/B01-0700.md) | Player reports (2026): F2P accounts typically enter KvK1 below CH25 (CH21–22 is workable); | verificado | baixa | majoritario | no | `ov-budget-reality-check`, `d41-ch21-t4` |
| [C04-0001](../research/facts/C04/C04-0001.md) | Current game version as of 2026-10-13 | bruto | media | n/a | no | `ov-patch-state` |
| [C04-0002](../research/facts/C04/C04-0002.md) | 1.1.12: Radiant Rivalry 1v1 kingdom event and early-season Lost Kingdom changes (unverifie | bruto | baixa | n/a | no | `pk-eve-of-crusade` |
| [C04-0004](../research/facts/C04/C04-0004.md) | 1.1.09: resource boost items and Deceptive Troops removed; VIP production buffs raised | bruto | alta | n/a | no | `ov-patch-state`, `d4-gathering-setup`, `mistakes-outdated-advice` |
| [C04-0005](../research/facts/C04/C04-0005.md) | 1.1.09: Legendary Pelagius event for new kingdoms from day 5 | bruto | alta | n/a | no | `ov-patch-state`, `d0-civilization`, `d4-pelagius-day5`, `ev-calendar-rule` |
| [C04-0006](../research/facts/C04/C04-0006.md) | 1.1.07: Conduct Score anti-script/cheat system | bruto | alta | n/a | no | `ov-patch-state`, `farm-brief`, `mistakes-outdated-advice` |
| [C04-0008](../research/facts/C04/C04-0008.md) | 1.1.06: immigration age limits tightened; same-season immigration restricted for new kingd | bruto | alta | n/a | no | `d0-new-kingdom-start`, `recovery-zeroed` |
| [C04-0010](../research/facts/C04/C04-0010.md) | Legendary equipment respec: special talent reset and full-refund dismantle | bruto | alta | n/a | no | `ov-patch-state`, `d15-equipment` |
| [C04-0022](../research/facts/C04/C04-0022.md) | Wheel of Fortune now requires Spin Tickets (S3/SoC 2025, S2 2025, S1 2026) | bruto | alta | n/a | no | `ov-patch-state`, `d15-commander-checklist`, `ev-wheel-of-fortune`, `mistakes-outdated-advice` |
| [C04-0023](../research/facts/C04/C04-0023.md) | 1.0.90: Armament Conversion, Legendary Commander Swap, Gathering of Heroes | bruto | alta | n/a | no | `ov-patch-state`, `d15-commander-checklist` |
| [C04-0024](../research/facts/C04/C04-0024.md) | 1.0.87: VIP19 and SVIP added | bruto | alta | n/a | no | `mistakes-outdated-advice` |
| [C04-0026](../research/facts/C04/C04-0026.md) | Beginner's Immigration (jumping) removed for new accounts from 2025-03-26 | bruto | media | n/a | no | `ov-patch-state`, `d0-new-kingdom-start`, `mistakes-outdated-advice`, `recovery-zeroed` |
| [C04-0028](../research/facts/C04/C04-0028.md) | 1.0.89: Hall of Heroes refunds part of KvK healing resources; Realm of Mystique | bruto | alta | n/a | no | `d41-hospital` |
| [C04-0032](../research/facts/C04/C04-0032.md) | 1.1.02: daily AP claim can exceed cap; Army Groups for all SoC alliances | bruto | alta | n/a | no | `ov-patch-state`, `d0-ap-discipline`, `daily-15min` |
| [C04-0033](../research/facts/C04/C04-0033.md) | Kingdom lifecycle: Preparation Season → Season 1 → Season 2 → Season 3 → Season of Conques | bruto | media | n/a | no | `ov-patch-state`, `d0-new-kingdom-start` |

### Gaps referenced (pending measurement or research)

| Gap | Description | Impact | Blocks |
|---|---|---|---|
| L-A01-01 | Early unlock levels: Academy (CH4 vs CH6), first Quarry (CH4 vs CH6), Trading Post (CH10 vs CH12) | medio | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-research-economy`, `open-pending-measurements` |
| L-A01-02 | No T0/T1 confirmation of the CH1→CH25 requirement table and raw times (only Fandom, 2018 developer dataset) | alto | `d0-build-order`, `d15-ch10-ch17` |
| L-A01-03 | Consolidated building-speed buff stack (research, alliance tech, VIP, civ, help) → real build time to CH17/CH21/CH22 | alto | `d0-build-order`, `d15-ch10-ch17`, `d41-ch21-t4`, `open-pending-measurements` |
| L-A02-01 | Current tech names and an ordered F2P research path with times (only 2019 AllClash order + 2026 commercial guide) | alto | `d4-research-economy`, `d15-research-military` |
| L-A02-02 | Quantitative speedup allocation: research vs City Hall vs hoarding for events | alto | `d41-speedups-spend-vs-hoard`, `open-pending-measurements` |
| L-A02-03 | Research speed buffs and time to T4 (Academy 21 path) for a F2P | alto | `ov-budget-reality-check`, `d15-research-military`, `d41-ch21-t4`, `open-pending-measurements` |
| L-A03-01 | Resource amount per node level (L1–L6) and base gathering speed per resource | alto | `d4-gathering-setup` |
| L-A03-02 | Measured gathering yield per hour/day by CH stage (needed for value-per-minute) | alto | `d4-gathering-setup` |
| L-A03-03 | Gold via Trading Post: confirm in-game and check if gold assistance needs a Trading Post level | medio | `farm-brief` |
| L-A03-04 | Trading Post capacity L1–L24 (Fandom only) and unlock CH | medio | `d4-ch8-ch12-checkpoints` |
| L-A03-05 | Storehouse protection L6–L24 (Fandom vs riseofkingdomsguides differ 10–35%) | medio | `d0-day1-survival` |
| L-A04-01 | Real F2P gem income per day (barbarian gem drops, quests, events, alliance gifts) — only 100/day is guaranteed | alto | `ov-budget-reality-check`, `d0-first-gems-vip`, `d15-vip6-milestone`, `d41-vip10-reality`, `open-pending-measurements` |
| L-A04-04 | Speedup income per day by source (Daily Objectives 170 min derived from a 2020 wiki revision) | alto | `d41-speedups-spend-vs-hoard`, `daily-30min`, `open-pending-measurements` |
| L-A04-05 | Peerless Scholar gem pool size and typical share | medio | `daily-60min` |
| L-A05-01 | Are VIP thresholds cumulative? (T4 says yes) | medio | `ov-budget-reality-check`, `d0-first-gems-vip`, `d15-vip6-milestone` |
| L-A05-03 | VIP point income from alliance gifts/caves for an F2P | medio | `d0-join-alliance`, `d41-vip10-reality` |
| L-A06-01 | Current F2P pairs-by-role table for KvK1 (2026 commanders) | alto | `d4-early-commanders`, `d15-commander-checklist`, `pk-kvk1-behaviour` |
| L-A06-02 | Free/kingdom-gated legendary acquisition routes and timing (Minamoto, Pelagius day 5, Aethelflaed medals, kingdom events) | alto | `d4-pelagius-day5`, `d15-commander-checklist` |
| L-A06-03 | Sculpture income per week for F2P (epic + legendary) — limits any commander plan | alto | `d4-early-commanders`, `d15-commander-checklist`, `open-pending-measurements` |
| L-A07-01 | Blueprint sources, crafting time and material income/day for an epic set by KvK1 | alto | `d15-equipment` |
| L-A08-01 | Heal vs retrain cost (resources/time) T4 vs T5 | medio | `d41-hospital`, `recovery-zeroed` |
| L-A08-02 | Hospital capacity target for KvK1 (F2P) | medio | `d41-hospital`, `pk-kvk1-readiness` |
| L-A08-03 | Severe-wound/death rules (official text) | medio | `d41-hospital`, `recovery-zeroed` |
| L-A09-01 | Base AP regeneration rate per hour | alto | `d0-ap-discipline`, `daily-weekly`, `open-pending-measurements` |
| L-A09-02 | Daily AP claim amount in 2026 (T1 2020 says 500) | medio | `d0-ap-discipline` |
| L-A09-03 | Fort rally AP cost; fort reward tiers 6–10 | medio | `daily-60min` |
| L-A09-04 | Auto-peacekeeping unlock level and whether it keeps the −2 AP streak discount | medio | `daily-15min` |
| L-A09-05 | Kingdom-wide barbarian level unlock schedule by day | medio | `d0-ap-discipline` |
| L-A10-01 | Minutes per daily task (no source anywhere) | alto | `daily-15min`, `daily-30min`, `daily-60min`, `daily-weekly`, `daily-break-mode`, `open-pending-measurements` |
| L-A10-02 | Current Daily Objectives task list and points after 1.1.09 (login, alliance donation tasks) | alto | `daily-30min`, `open-pending-measurements` |
| L-A10-03 | Sunset Canyon unlock level and base free attempts | baixo | `daily-60min` |
| L-A10-04 | Expedition medals/day; Mysterious Merchant visit frequency | baixo | `d15-expedition-aethelflaed` |
| L-A11-01 | Day of first occurrence in a new kingdom for MGE, More Than Gems, Lohar/Arms Training, Wheel of Fortune, Ceroli, Golden Kingdom, Karuak, Ark of Osiris, Sunset Canyon | alto | `ev-calendar-rule`, `ev-more-than-gems`, `ev-lohar-ap`, `open-pending-measurements` |
| L-A11-02 | Reward tables and time cost per event (value per hour) | alto | `ev-more-than-gems`, `ev-lohar-ap`, `ev-priorities` |
| L-A11-03 | Wheel of Fortune pricing in the home kingdom (gems vs Spin Tickets) | medio | `d15-commander-checklist`, `ev-wheel-of-fortune` |
| L-A11-04 | Current MGE format (commander-specific rewards, ranking caps, kingdom rules) | medio | `ev-mge` |
| L-A12-02 | Official VIP points per $ and Growth Fund milestone table | medio | `d15-vip6-milestone` |
| L-A13-01 | Minutes per farm per day and yield/day by farm CH | alto | `farm-brief` |
| L-A13-02 | Official policy on farms/multiple accounts | medio | `farm-brief` |
| L-A13-03 | Resource-pair farms — no source; only derived reasoning | medio | `farm-brief` |
| L-A14-01 | Mechanics/cost of CH16 civilization buff switching (1.1.01) | medio | `d0-civilization` |
| L-A14-02 | Spain re-evaluated after Legendary Pelagius day-5 event | medio | `d0-civilization`, `d4-pelagius-day5` |
| L-A14-03 | Quantified value of +5% building speed over the CH chain | baixo | `d0-civilization` |
| L-B01-01 | Official/T0 Monument (Kingdom Chronicles) timeline with dates | alto | `ev-calendar-rule` |
| L-B01-02 | Official season day counts (Preparation Season, KvK1) | alto | `ov-budget-reality-check`, `d0-new-kingdom-start`, `pk-kvk1-readiness` |
| L-B01-03 | Lost Kingdom entry requirement (CH17, single T3) and Eve of the Crusade timing for Season 1 after 1.1.12 | alto | `pk-eve-of-crusade`, `open-pending-measurements` |
| L-B01-04 | Radiant Rivalry (1v1 kingdom event in new kingdoms, pioneer) — rules and timing | medio | `ov-patch-state` |
| L-B05-01 | Current MGE stage count/durations and rank sculpture table (Fandom vs riseofkingdomsguides conflict) | medio | `ev-mge` |
| L-B06-03 | Migration rules changed in 1.1.10–1.1.12 (no official EN notes); mail Lilith sent then deleted (Aug 2026) | alto | `recovery-zeroed` |
| PROPOSED-SHIELDS | Shield durations/costs and beginner protection rules: no fact card exists yet (proposed gap, to be added by the research side) | alto (proposed) | `d0-day1-survival`, `daily-break-mode`, `recovery-zeroed`, `open-pending-measurements` |

### Block confidence

low: 5, medium: 37, pending: 1

### Known contradictions in the research (as of this version)

- **Time to T4:** 2026 player reports say T4 "around day 30" ([B01-0700](../research/facts/B01/B01-0700.md)), but the derived raw build budget to CH21 (T4 unlock) is about 163 builder-days ([A01-0005](../research/facts/A01/A01-0005.md)). Both are `baixa`; T0 settles it (L-A02-03).
- **Early unlock levels:** Academy and first Quarry at CH4 vs CH6, Trading Post at CH10 vs CH12 ([A01-0009](../research/facts/A01/A01-0009.md), [A03-0025](../research/facts/A03/A03-0025.md)); the Fandom CH table still lists the Trading Post at CH10.
- **KvK durations:** 60 days (2024 T3) vs 50 days (2026 T4) ([B01-0502](../research/facts/B01/B01-0502.md)).
- **Spending gems on VIP:** majority yes, AllClash (2020) no ([A05-0008](../research/facts/A05/A05-0008.md)).
- **Daily AP claim amount:** 500 AP per official 1.0.41 (2020); the 1.1.02 note does not restate it ([A09-0006](../research/facts/A09/A09-0006.md), L-A09-02).
- **Patch-state cards** (C04) are still `bruto` although the context packs treat most of them as T1 facts.
