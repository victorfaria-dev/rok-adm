---
tema: "F2P economy: gem income, VIP path, speedup sources, spend vs hoard"
dominios: [A04, A05, A09, A10, A11, A01]
gerado_em: 2026-10-13
fichas_base: [A04-0001, A04-0002, A04-0003, A04-0004, A04-0005, A04-0006, A04-0007, A04-0008, A04-0009, A04-0010, A04-0011, A05-0001, A05-0002, A05-0003, A05-0004, A05-0005, A05-0006, A05-0007, A05-0008, A01-0002, A01-0006, A03-0007, A03-0014, A09-0006, A10-0004, A10-0005, A11-0501, A11-0502, A11-0503, A11-0504, A02-0503, C04-0004, C04-0009, C04-0022]
cobertura: "Covered: guaranteed daily gems, gem-item sources, one-time gems, VIP thresholds/daily points/chests, VIP Shop, AP purchase, free speedup sources, gem-spend priorities and More Than Gems cadence. Gaps: real F2P gem income per day, gem-deposit yield, speedup income per day, VIP buff table after 1.1.09, Peerless pool size — all scheduled in the T0 protocol."
---

# F2P economy: gems, VIP, speedups

Main sections: only cards with confianca ≥ media. Derived numbers are marked **(derived)** and cite the card that carries the method.

## Summary (≤ 10 lines)

1. **Guaranteed F2P gems = 100/day** from the 100-point Daily Objectives chest, which also gives a Golden Key, a Magic Box and 3 epic sculptures [A04-0001]. Everything else is variable or one-time [A04-0002, A04-0005].
2. **Gem → VIP conversion is 1:1** [A05-0004]. VIP thresholds are read as **cumulative totals**: VIP6 11,500, VIP8 35,000, VIP10 150,000 [A05-0001].
3. **Daily VIP points** start at 40, rise by +20/day to a 200/day cap, and reset if a day is missed [A05-0003]. **Never break the streak.**
4. **Majority gem priority for F2P:** VIP 6 (permanent 2nd builder), then VIP 10 (1 legendary sculpture/day). Don't finish timers with gems. Spend during More Than Gems [A05-0008, A04-0009, A11-0504].
5. **More Than Gems** is a ~monthly, 2-day gem-spend event (top tier ~25k gems/day) seen in kingdoms older than ~21 days [A11-0502].
6. **Free speedups:** Daily Objectives chests give 170 min/day **(derived)** [A04-0010]. Other sources: CH rewards, barbarians, the VIP Shop (food-priced), the Courier Station [A04-0010, A04-0007, A04-0011].
7. **Spend vs hoard:** the majority hoards speedups, resources and AP for scored events and KvK [A11-0501]. Whether to use speedups on City Hall or research is unresolved (see Divergences).

## Verified facts

### Gem income

| Source | Amount | Frequency | Card |
|---|---|---|---|
| Daily Objectives 100-pt chest | 100 gems | daily (reset 00:00 UTC) | A04-0001 |
| CH16 / CH21 / CH25 rewards | 100 / 200 / 500 | once | A01-0002, A04-0005 |
| Facebook account binding | 200 | once | A04-0005 (single T3 for this item) |
| Barbarians Lv1–25, forts Lv1–4, Lohar's Trial, Bone Necklaces | 10-gem items | per drop (rate unknown) | A04-0002, A04-0003 |
| Events (Era Breakthrough, Clarion Call, Cornucopia…) | 100-gem items ×1–15 | per event | A04-0002 |
| Ark of Osiris | 2,000-gem items | per event | A04-0002 |
| Peerless Scholar prelim/final (CH10 Lyceum) | share of a gem pool | every 2 weeks | A10-0005 |

- Barbarian gem drops are an **optional 4th item**. The advertised count rises with level: 1×10 gems at Lv1–10, 2× at Lv11–14 and Lv16–20, 3× at Lv15 and Lv21–30 [A04-0003]. The drop rate is unknown.
- **(derived)** Guaranteed income is about 700 gems/week and about 3,000 per 30 days [A04-0006 method]. The full estimate is `baixa` because every other source is unquantified.

### VIP

- **Thresholds** (cumulative reading): VIP1 200, VIP2 400, VIP3 1,200, VIP4 3,500, VIP5 6,000, VIP6 11,500, VIP7 17,500, VIP8 35,000, VIP9 75,000, VIP10 150,000 … VIP18 4,000,000 [A05-0001]. Table: `facts/A05/data/vip-levels.csv`. VIP19 and SVIP exist since Oct 2024 (C04-0024).
- **Daily VIP points:** 40 → 200 cap, +20 per consecutive day [A05-0003].
  - **(derived)** One missed day costs up to 720 VIP points over the following 8 days [A05-0003 method].
- **VIP point sources for F2P** [A05-0004]:
  - gems at 1:1;
  - alliance gift chests (10–1,000 VIP items, depending on the spenders in the alliance);
  - the Alliance Shop 100-VIP item;
  - Mysterious Caves.
- **Daily VIP chest** [A05-0006]:
  - VIP 8–9 add a Silver Key per day.
  - VIP 10+ add a Golden Key and legendary sculptures: 1/day at VIP10–11, 2/day at VIP12–13, 3/day at VIP14+.
- **VIP 6 = permanent 2nd builder** [A01-0006]. The BlueStacks "VIP 7" claim is contradicted [A05-0005, contestado].

### VIP Shop and gem prices

- **VIP Shop** (restocks Monday 00:00 UTC) [A04-0007]. Full table: `facts/A04/data/vip-shop.csv`. F2P-relevant rows:

  | Item | Price | VIP needed | Qty/week | Gems per minute **(derived)** |
  |---|---|---|---|---|
  | 100 AP | 12,000 food | 2 | 30 | — |
  | 5m universal speedup | 7,000 food | 3 | 50 | — |
  | 5m universal speedup | 6 gems | 3 | 500 | ≈1.2 |
  | 60m universal | 50 gems | 5 | 50 | ≈0.83 |
  | 8h universal | 240 gems | 7 | 20 | 0.5 |
  | 24h universal | 600 gems | 15 | — | ≈0.42 |

  The food-priced rows cost no gems; check them weekly.
- **Buying AP:** 500 AP for 100 gems, +50 gems per extra purchase, resetting daily. Only possible with zero AP items [A04-0008]. Not recommended for F2P (same card).
- **Mysterious Merchant / Courier Station** [A04-0011, A03-0014]:
  - 5 refreshes per visit, 1 free per 24h.
  - Buy with resources rather than gems. Buy gem-priced speedups only at ≥60–70% off.
  - Ten purchases there also count for a 10-point Daily Objective [A04-0011].
- **Resource items** cannot be plundered and have no storage limit; gems cannot be plundered at all [A03-0007].

### Speedups (free sources)

- **Daily Objectives chests:**
  - 20 pts: 5×5m training.
  - 40 pts: 5×5m building.
  - 60 pts: 8×5m research and 100 AP.
  - 80 pts: 16×5m universal.

  Total 170 min/day **(derived** from the 2020 wiki revision) [A04-0010]. The list may have changed in 1.1.09 [A10-0001].
- **Other sources:** CH rewards (8h, 24h and 7d universals at CH8/9/16/21) [A01-0002]; barbarian kills (1-min universal or 5-min training each) [A04-0003]; forts, the Expedition medal shop, the Alliance shop, Peerless Scholar, Sunset Canyon, alliance gifts [A04-0010].
- **Expedition:** daily claim of 3-star rewards; 1,500 medals per legendary sculpture [A10-0004].

## Recommendations by profile and stage

| Stage | F2P | Consensus | Cards |
|---|---|---|---|
| Day 1 → VIP 6 | Put free gems into VIP until VIP 6 (2nd builder). Use Builder Recruitment items before that. | majoritario | A05-0008, A01-0006, A04-0009 |
| VIP 6 → VIP 10 | Keep gems for VIP 10. Buy VIP points **during More Than Gems** for the extra sculptures (save for it if MTG is days away). | majoritario | A05-0008, A11-0502, A11-0504 |
| Always | Don't instant-finish timers or buy AP with gems. Use resource-priced shop and merchant items. Claim the VIP chest every day. | majoritario | A04-0009, A04-0008, A04-0011, A05-0003 |
| Events / KvK | Hoard speedups, AP items and resource items for scored events and KvK healing. | majoritario | A11-0501 |
| Low spender (delta) | Growth Fund and 30-day gem supply change the gem budget (see `spending-tiers-baseline.md`). | majoritario | A12-0001, A12-0002 |

## Divergences and uncertainties

- **Derived VIP timeline** [A05-0007, baixa]. Assumes cumulative thresholds, an unbroken streak and no other sources.
  - Daily chest only: VIP6 ≈ day 62, VIP8 ≈ day 179.
  - Chest + 100 gems/day: VIP6 ≈ day 41, VIP7 ≈ day 61, VIP8 ≈ day 120, VIP10 ≈ day 503.

  These are upper bounds: alliance gifts, events and quest gems shorten them by unknown amounts. The T0 gem ledger will replace them.
- **VIP production buffs changed in 1.1.09** (+5…+37% at VIP0–5; ×1.25 above VIP5). The rest of the VIP buff table is unverified after 1.0.87 [A05-0002, parcialmente_obsoleto; C04-0004].
- **Gems → VIP at all?** AllClash (2020) says no [A04-0009, A05-0008 dissent]. Books of Covenant with gems: divided [A04-0009].
- **Wheel of Fortune gem math is obsolete** wherever Spin Tickets are required [A11-0503, parcialmente_obsoleto; C04-0022]. F2P consensus: 10 spins on a planned target, after VIP 10.
- **Speedups to City Hall vs research vs hoard:** divided [A02-0503, baixa]. A quantitative model is a gap (L-A02-02).
- **Gem deposits** (10/20 gems, Academy 16 Jewelry tech): single source [A04-0004, A03-0020, baixa]. Whether F2P should farm gems is unknown.
- **Oasis Bazaar** (sell resources for gems) exists only in SoC and needs Trading Post 25 [C04-0009]. Not relevant before KvK1.

## Gaps

- **L-A04-01:** real gem income/day by source. T0 gem ledger, 7+ days.
- **L-A04-02:** gem deposit yield and minutes.
- **L-A04-03:** barbarian gem drop rate.
- **L-A04-04:** speedup income/day.
- **L-A05-01:** cumulative VIP check (T0 day 1).
- **L-A05-02:** current VIP buffs.
- **L-A04-05:** Peerless pool size.
- **L-A11-03:** Wheel of Fortune price in the home kingdom.
