---
tema: "Kingdom metrics and DKP — KP, deads, DKP formulas in the wild, requirement formulas, data sources/scanners, gaming risks"
dominios: [B08, B01, B02, C01, C02, C04]
gerado_em: 2026-10-13
fichas_base: [B08-0001, B08-0002, B08-0003, B08-0004, B08-0005, B08-0006, B08-0007, B08-0008, B03-0007, B05-0004, B06-0005, B04-0002, C01-0013, C01-0014, C01-0015, C01-0016, C01-0017, C01-0021, C02-0003, C02-0004, C02-0007, C02-0016, C04-0006, C04-0015, C04-0020]
cobertura: "DKP formulas: only 3 verified verbatim (two kingdom sites sharing a template + one tool default). Requirement design from tool docs and Reddit. Official metrics (Acclaim, kingdom power) from T1 notes. Data paths: scanners, paid services, the official ROK Toolkit (contents unknown). Gaps: KP-per-tier values, Toolkit contents/export, more formulas, scanner error rates."
---

# Kingdom metrics and DKP

Related packs: `kingdom-admin-workflows.md` (W1–W4 data loop), `competitors-and-constraints.md` (tools, ToS).

## Summary (≤ 10 lines)

1. **DKP is not a game feature.** Each kingdom defines a weighted score of T4/T5 kills and deaths, usually ignoring T1–T3. Deaths get the highest weight (dead:T5 ratio 2.5×–5× in the verified examples) [B08-0001].
2. **Requirements** are usually "DKP ≥ X% of power". Seen in the wild: 250% for a KvK1 player, 400% as a tool example, pass bands up to a 500% "super pass". They are measured as the **delta** between start and end scans [B08-0002].
3. **The game has two official aggregate metrics:**
   - **Acclaim:** from wounds and kills dealt and suffered, scaled by troop level; T1 heavily discounted since 1.1.04 [C04-0015].
   - **Kingdom power for seeding:** tiered and top-300 only [B08-0008].
4. **No official per-governor stats export was found** in notes 1.0.90–1.1.09. Kingdoms scan with emulator+OCR tools or pay services [B08-0003, B08-0004].
5. **New in wave 2:** an official in-game **ROK Toolkit** has "tons of info about every Kingdom" and accepts roster uploads. What it shows and whether it exports is unknown. This is the highest-value open question for any DKP product [B08-0007, L-B08-01].
6. **Data can be gamed or is noisy.** Risks include kill trading, zeroing outside fight windows, farms/alts, approximate OCR names, and honor scans without governor IDs [D-0503, B08-0004]. Scanning also conflicts with ToS and Conduct Score [C02-0003, C04-0006].

## Verified facts

### What the game shows (T1/T2)
- **Kills (profile):** the "kills" counter counts troops killed **plus** enemy troops brought to severely wounded, with a per-tier breakdown. Neutral units don't count (Fandom "Governor Profile", edited 2025-12; T2, not carded). Kill Points per tier were **not collected** (gap).
- **Development overview (1.0.91):** a profile graph compares *your* development with others in the kingdom or Lost Kingdom. It is personal, with no kingdom list [B08-0003].
- **Acclaim** [C04-0015]:
  - earned for severe wounds and kills suffered and inflicted, scaled by troop level, and shown on battle reports (1.1.01)
  - T1 rates (1.1.04): 10,000 T1 severely wounded = 1 Acclaim; 10,000 T1 killed = 2
  - Seasons 1–3 versions per 1.1.12 (T3)
- **Kingdom power for SoC matchmaking (1.0.95)** [B08-0008]:
  - 100% of power up to 150M, 80% for 150–300M, 50% for 300–500M, 0% above 500M
  - top 300 governors only (Q&A)
  - Imperium threshold: 23.5B
  - team-up power = top-300 sum, capped at the top-24 kingdoms (1.1.03)
- **Vacation Permit holders** are excluded from the SoC matchmaking score [B03-0007].

### DKP formulas found in the wild (verbatim sources)

| Source | Stage | Formula | Exceptions/notes | Card |
|---|---|---|---|---|
| Kingdom 2708 rules site (PL05) | KvK1 | `DKP = T4 kill * 10 + T5 kill * 20 + death * 50` | "formula may change in kvk2" | B08-0001 |
| Kingdom 2779 rules site (PL04) | KvK2 | `DKP = T4 kill * 10 + T5 kill * 30 + death * 80` | T1–T3 excluded. "If you are zeroed with terrible trade, your death of that day will be counted as 0." Alts' DKP can be added to one account. | B08-0001, B08-0006 |
| ROK Steward default (PL06) | any | `T4 × 1 + T5 × 2 + Deads × 10` | optional raw KP weight; group boosts or penalties ("Rally/Garrison +10%", "Fort penalty -10%") | B08-0001 |

- **Independence warning:** the two kingdom sites share one template, so they count as one norm with two parameter sets [B08-0001, B06-0005].
- **Leaders ask which formula to use.** Example: "Which formula should we use for kvk3 as low seed?" (2026-02) [D-0501].

### Requirement formulas

- **Form:** target DKP as a % of power, flat or power-tiered; sometimes adjusted by account age, seed or group [B08-0002].
  - "250% de mi poder": a 10.5M KvK1 player, by in-game mail, 2026-04.
  - "everyone must reach 400% of power as DKP": ROK Steward example.
  - pass bands up to "Super pass <500%" (2025-12).
- **ROK Steward's composite mode** has been seen as `(ReqDeads × 8) + (ReqKills × 1)`, along with stage tags (Pass 4–9, Kingsland…). Re-read on roksteward.com/app, 2026-10-13; T3 vendor; not carded.
- **Measurement:** delta between start and end scans is the default [B08-0002].
- **Use after KvK:**
  - Tiers set reward, probation and removal. In K2779 the top ~168 get the best rewards and cross-season immigrants must be in the top 80 [B08-0006, B06-0005].
  - The exit list is low DKP among top-300 power [B06-0005].
  - DKP can become a currency for MGE and gold-head auctions. In one bot, winners pay the lowest winning bid and balances can expire [B05-0004].

### Data sources (how kingdoms get numbers)

| Path | What it gives | Cost / risk | Cards |
|---|---|---|---|
| Self-run scanners (RokTracker family) | Kingdom scan: governor ID, name, power, KP, ranged points, T1–T5 kills, T4+T5, deads, RSS gathered/assist, helps, alliance. Honor, alliance and seed scans give an approximate name and score only, **no ID**. | Free. Needs BlueStacks + ADB, English client, and an account ranked below the scan range. ToS 17.1.7/17.1.15 risk. Conduct Score since 1.1.07. | B08-0004, C01-0021, C02-0003, C02-0004, C04-0006 |
| Paid scan services (ROKSTATS, Hero Scrolls, Botals) or hired scanners | Kingdom-wide snapshots, DKP dashboards | €10–€20 per scan (Botals); from $10/mo (ROKSTATS); $5/$7 per top-200/300 scan (2024 ad) | B08-0003, C01-0013, C01-0014, C01-0015 |
| Free analytics (APO) | DKP rankings and CSV for 134 kingdoms | Free; coverage limited | C01-0016 |
| Upload-only reports (ROK Steward) | Excel/PDF reports from **scanner xlsx** (HeroScrolls, StatsMaster, ROKStats, ROKToolKit, generic) | $4.99–$89/yr; lowest ToS risk | B08-0003, C01-0017 |
| Official ROK Toolkit (in game, Notice Board) | "tons of info about every Kingdom"; roster upload to code | Official; **contents and export unknown** | B08-0007 |
| Official Acclaim, battle reports | per-battle Acclaim, skill statistics (1.1.03) | Official; aggregation unknown | C04-0015 |

### Activity metrics beyond DKP
- Councils also track helps, donations, forts, building time, chat activity and power growth, in sheets or bots [B08-0005, baixa].
- **Official alliance tools:**
  - Quick Checks: point-in-time readiness [B04-0002]
  - Alliance Notes: public to members [B04-0002]

## Recommendations by profile and stage

No leader consensus exists on formulas. What the evidence supports, as design guidance for a guide or product:

| Guidance | Basis |
|---|---|
| Publish formula and requirement **before** KvK and explain them in each member's language. First-KvK players receive targets without knowing what DKP is. | D-0501, D-0518, B08-0002 |
| Score **deltas per stage**, with an exception log for zeroing days and trades. K2779 already sets "zeroed with terrible trade" deaths to 0. | B08-0001, D-0503 |
| Join on **governor ID**. Honor data from ranking scans lacks IDs and needs name matching. | B08-0004, D-0502 |
| Treat alts explicitly: map them to mains for DKP, seed and MGE. | B08-0006, D-0522 |

## Divergences and uncertainties

- **Gaming risks** [D-0503 validada, D-0522 validada, D-0502 bruto]:

  | Risk | Example |
  |---|---|
  | Kill trading | "dueled or bought their dkp" |
  | Zeroing outside war time | skews deaths |
  | Farms inflating power and feeding MGE | |
  | Missing governors in scans | |
  | T1 trading | reduced for Acclaim by 1.1.04 |

- **Cost is felt unevenly.** A 2025 thread says "Nobody does it manually" and "There’s so many services that do it cheaply" [D-0500, D-0504 notes]. The pain is dependency and spreadsheet logic, more than raw manual entry.
- **Time cost.** The "2–3 hours of spreadsheet math per event" figure comes from one tool README [B08-0003].
- **Export claim refuted.** C02-0016 (in-game xlsx export) is weakened: ROK Steward's uploader names scanner formats. The ROK Toolkit remains a candidate [B08-0003, B08-0007].
- **Low-confidence practice:**
  - activity metrics [B08-0005]
  - tiering details [B08-0006]
  - DKP auctions [B05-0004, minoritario]

## Lacunas

- **ROK Toolkit:** fields, scope, history, export, access [L-B08-01, HIGH].
- **Requirement basis:** power base and tiering rules [L-B08-02].
- **Formulas:** more DKP formulas from independent kingdoms [L-B08-03].
- **Non-kill contribution:** how honor, forts, rallies and Acclaim are weighted [L-B08-04].
- **Scanner error rates** [L-B08-05].
- **Kill Points per troop tier** (official values) — not collected; do not quote from memory.
