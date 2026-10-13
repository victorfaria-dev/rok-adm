---
tema: "Farm accounts for a F2P main: setup, Trading Post, bottlenecks by CH stage, farm variants"
dominios: [A13, A03, A01, C02]
gerado_em: 2026-10-13
fichas_base: [A13-0001, A13-0002, A13-0003, A13-0004, A13-0005, A13-0006, A13-0007, A13-0008, A13-0009, A13-0010, A03-0001, A03-0002, A03-0006, A03-0007, A03-0009, A03-0013, A03-0015, A03-0016, A03-0017, A03-0021, A03-0023, A03-0024, A03-0025, A03-0026, A03-0027, A03-0028, A03-0029, A03-0030, A01-0001]
cobertura: "Covered: why farms exist, CH and Trading Post targets, transfer tax/capacity/limits, gold transferability (resolved to yes, pending T0), per-resource tech timing and civ bonuses, the bottleneck sequence. Weak/absent: farm minutes per day, yield per day by farm CH, node sizes, any source for resource-pair farms (hypothesis only), official farm policy (C02)."
---

# Farms (secondary accounts feeding a F2P main)

Main sections: confianca ≥ media. Hypotheses are labelled **HYPOTHESIS (derived)** with their inputs; no source recommends them.

## Summary (≤ 10 lines)

1. **Purpose:** a farm gathers resources and ships them to the main through the Trading Post (taxed). It also has side uses (MGE points, Books of Covenant, KvK support) [A13-0010, majoritario]. A 2026 player also advises F2P to create farms (T4, same card).
2. **Accounts:** Character Management allows a second city in the same kingdom (commonly two per kingdom) [A13-0001, media; ToS in C02].
3. **Farm CH targets:** CH11 (3 marches) to start, CH17 (4) as the practical minimum, CH22 (5 marches) as the strong target [A13-0002, A03-0023].
4. **Trading Post:**
   - tax falls from 35% (L1) to 21% (L15), 10% (L24) and 8% (L25) [A03-0024, alta];
   - farm target TP ≥15 [A13-0003];
   - TP L10+ needs a same-level Goldmine [A03-0024].
5. **Only resources above Storehouse protection can be shipped** (1.0.44) [A03-0030, alta]. **Gold can be sent** too (resolved in wave 2, pending T0) [A03-0027, media].
6. **Each transfer uses a march queue** and travel time, so keep the farm close to the main [A03-0026].
7. **Bottleneck sequence of the main:** food and wood early → stone from ~CH6 → gold from CH10 (research after Academy 10, T3+ troops), acute at T5 [A03-0021, A03-0001].

## Verified facts

### Transfer mechanics

- **Tax by Trading Post level:** L1 35%, L5 31%, L10 26%, L15 21%, L20 16%, L21 15%, L22 14%, L23 12%, L24 10%, L25 8% [A03-0024]. Table: `facts/A03/data/trading-post.csv`.
  - **(derived**, A03-0024 method) The farm must send 1.27× what the main receives at 21% tax, and 1.11× at 10%.
  - The 8% floor is corroborated by an official 2023 dev reply refusing to lower it [A03-0024].
- **Capacity per trip:** L25 = 10,000,000 (T1, 1.0.90). Lower levels per Fandom: L1 10,000, L15 1.6M, L24 4.0M [A03-0025, contestado only on the unlock CH]. Guide tables with half these values are outdated (same card).
- **Storehouse protection:** protected resources cannot be transported; only the excess is shipped [A03-0030, alta]. L25 protects 2.5M of each; lower levels differ between sources [A03-0006].
- **Gold:** selectable in resource assistance ("Choose Food, Wood, Stone, or Gold"). A 2021 player donated gold; the limit is the Storehouse rule [A03-0027, media].
- **Each transfer occupies a dispatch (march) queue** and walks there and back [A03-0026].
- **Resource items** (unopened boxes) cannot be plundered and are unlimited; raw resources can be plundered above protection [A03-0007].

### Gathering on a farm

- **+25% gathering in alliance territory** [A03-0009, alta]. **Enhanced Gathering** items give +50%, usable in bulk since 1.1.09 [A03-0013, alta].
- **Node level** changes the amount, not the speed. Send to big nodes before going offline [A03-0016].
- **Base deposits** were raised +25% and base gathering speed +10% in 1.0.49 (2021, T1) [A03-0016].
- **Siege units carry the most:** T1 ram 20 per unit vs infantry T1 7 [A03-0015].
- **Gathering commander:** primary only; level 37 unlocks Superior Tools (~25%) [A03-0017].
- **Per-resource Academy techs** [A03-0028]:
  - food and wood: +15% at Academy 5–9, +35% at Academy 17–20;
  - stone and gold: +15% at Academy 12–15, +35% at Academy 20–25.
- **Civilization gathering perks** [A03-0029]: Rome food +10%, France wood +10%, Greece and Byzantium stone +10%, Maya gold +10%, Japan all +5%. Spain gets +20% production, which applies to buildings, not gathering.
- **City buildings** produce 400/h (farm L1) to 20,800/h (L25) and stop when full (10× hourly output) [A03-0002]. Production boost items were removed in 1.1.09 (C04-0004).

### Bottlenecks of the main by CH stage

| Main stage | Binding resource (consensus) | Cards |
|---|---|---|
| CH1–CH6 | food, wood (building costs) | A03-0021, A01-0001 |
| CH6–CH10 | stone joins (Wall chain, most buildings) | A03-0021 |
| CH10–CH21 | gold for research after Academy 10 and T3+ troops; stone for buildings | A03-0021, A03-0001 |
| T4/T5, KvK | gold (T5 training and healing), healing resources overall | A03-0021, A13-0010 |

## Recommendations (F2P / low)

| Topic | Recommendation | Consensus | Cards |
|---|---|---|---|
| Farm CH | Push the farm to CH11, then CH17. CH22 is ideal but costly. | majoritario | A13-0002 |
| Trading Post | TP ≥15 on the farm (21% tax); main needs TP24 anyway for CH25 | majoritario | A13-0003, A01-0001 |
| Storehouse | Don't over-level the farm Storehouse expecting to ship it; protected stock can't be sent | rule (T1) | A03-0030 |
| Safety | Ship surplus regularly; don't hold big raw piles on a low-CH farm during kill events | majoritario | A13-0005 |
| Placement | Farm close to the main; in the main alliance or an approved farm alliance; gather in territory | majoritario / dividido | A03-0026, A13-0006 |

## Farm variants: what the evidence supports

| Variant | Evidence | Status |
|---|---|---|
| **One all-resource farm** (the norm) | Guides describe one active farm as the norm; AllClash suggests France (Joan of Arc start, +10% wood) for a single active farm [A13-0007, A13-0009] | Supported (T3), baixa–media |
| **Single-resource farms** (one farm per resource: Rome food, Byzantium/Greece stone, Maya/Japan gold) | Only AllClash 2019, "only for players that spend a lot of time" [A13-0009, baixa]. Also limited by about 2 cities per kingdom [A13-0001]. | Weakly supported; mostly for heavy players |
| **Gold farm** | Gold is transferable [A03-0027], but guides advise gathering gold on the main (better tech, no tax) [A13-0004, dividido] | Contested; gold farm not recommended for F2P until T0 confirms transfer and yield |
| **Resource-pair farm** | **No source recommends pairs.** | **HYPOTHESIS (derived)**, see below |

**HYPOTHESIS (derived), not sourced: a food + wood farm is the only pair that is cheap at low farm CH.**
- Inputs:
  - food and wood get their first +15% gathering tech at Academy 5–9, while stone and gold need Academy 12–15 [A03-0028];
  - food and wood dominate early main costs [A03-0021];
  - France (wood) and Rome (food) give +10% [A03-0029].
- Method: compare the earliest Academy level that gives each resource +15%, and match it against the main's early bottleneck.
- Confidence: min(inputs) = media for the inputs, but the *recommendation* is unsourced. Test it with T0 farm yields before using it in the guide.
- A stone or gold specialised farm needs a more developed farm (Academy 12+ / 20+), so it fits later stages, when the main's bottleneck shifts to stone and gold [A03-0021].

## Divergences and uncertainties

- **Trading Post unlock:** CH12 (probable) vs CH10 [A03-0025, A01-0009, contestado].
- **Storehouse protection L6–L24:** Fandom vs riseofkingdomsguides differ by 10–35% [A03-0006].
- **Gather gold and gems on the main, not the farm:** divided; gems cannot be transferred [A13-0004, baixa].
- **Farm alliance etiquette** varies by kingdom [A13-0006, baixa].
- **Farm time cost is qualitative only:** log in twice daily, dispatch before logout [A13-0007, baixa].
- **ToS stance on farms** comes from secondary sources only [A13-0008, baixa]. The official position is in C02. Note the Conduct Score penalises third-party scripts (C04-0006): **no bots on farms.**
- **Yield anecdotes from 2019–2020** are obsolete after 1.0.49 [A03-0022, parcialmente_obsoleto].

## Gaps

- **L-A13-01:** farm minutes per day and yield per day by farm CH.
- **L-A03-01:** node amounts and base gathering speed.
- **L-A03-02:** gathering yield by CH.
- **L-A03-03:** gold assistance confirmation (T0 when the Trading Post unlocks).
- **L-A03-04:** Trading Post capacity L1–L24 and unlock.
- **L-A03-05:** Storehouse table.
- **L-A13-02:** official farm policy.
- **L-A13-03:** resource pairs (test the hypothesis).
- **L-A13-04:** farms per spending tier.
