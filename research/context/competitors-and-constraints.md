---
tema: "Competitors and constraints (ToS, data sourcing, naming)"
dominios: [C01, C02]
gerado_em: 2026-10-13
fichas_base: [C01-0001, C01-0002, C01-0003, C01-0004, C01-0005, C01-0006, C01-0007, C01-0008, C01-0009, C01-0010, C01-0011, C01-0012, C01-0013, C01-0014, C01-0015, C01-0016, C01-0017, C01-0018, C01-0019, C01-0020, C01-0021, C01-0022, C01-0023, C01-0024, C01-0025, C01-0026, C01-0027, C01-0028, C01-0029, C01-0030, C02-0001, C02-0002, C02-0003, C02-0004, C02-0005, C02-0006, C02-0007, C02-0008, C02-0009, C02-0010, C02-0011, C02-0012, C02-0013, C02-0014, C02-0015, C02-0016, C02-0017, C02-0018, C02-0019, C02-0020, C02-0021]
cobertura: "About 30 tools/services and the full English Lilith ToS (prohibitions, licensing, trademark). Gaps: Reddit/Discord complaints (blocked), rok.guide (unreachable), app stores, post-2019 ban evidence, the in-game export feature, RoK-specific rules page."
---

> Status: all cards are `organizado` (not yet adversarially verified). Competitor facts are what each tool says about itself on 2026-10-13 (T3). ToS facts quote the primary text (T1). Cards with `confianca: baixa` are listed only under "Divergences and uncertainties" or "Gaps", as the schema requires. This is product research, not legal advice.

## Summary (≤ 10 lines)

1. The market has two halves that do not connect. **Content and calculator sites** (riseofkingdomsguides, MetaRoK, Theria, rok-calculator, Davor's Toolkit, AllClash) are free or ad-funded and not personalized. **Kingdom-admin services** (Hero Scrolls, ROKSTATS, Botals, APO, ROK Steward, Codex Helper, Zoe) charge €10–€20 per scan, $5–$10+ per month, or $25+ per KvK. Nobody builds a plan from *your* account state. [C01-0001, C01-0007, C01-0009, C01-0013, C01-0015, C01-0017]
2. **We found no personalized F2P or early-kingdom planner.** Calculators answer one question each, have no version tags, and none says which patch its data comes from. [C01-0001, C01-0005, C01-0006]
3. Kingdom data today comes from **automated scanning** (emulator + ADB + OCR, or service-run in-kingdom accounts). Lilith's ToS bans automated access, data-mining tools, bots and collecting other users' personal data without permission (17.1.7, 17.1.15, 17.1.18, 17.1.13). [C01-0021, C02-0003, C02-0004, C02-0002, C02-0007]
4. Lilith offers **no public API**, so every "live sync" is unofficial. [C02-0015]
5. Lilith absorbs popular tool features into the game: it built in-game title management, and the roka title bot was archived as a result. [C01-0025]
6. There is **no open, maintained game-data dataset**. The Fandom wiki is CC-BY-SA but has only about 2 active editors. Each tool keeps its own private data. [C01-0027, C01-0004, C02-0021]
7. The best design for us: **manual input plus optional screenshot upload with OCR**, done by the user, with **no game automation, no credentials and no client or network hooks**. Keep Lilith's marks out of the product name. [C02-0005, C02-0006, C02-0009]

## Competitor matrix

Legend: ✔ = core feature, ◐ = partial, — = absent or not found. Status and price are as observed on 2026-10-13.

| Tool (card) | Guides/meta | Calculators | Commander/talent builder | Personal planner | Event calendar | Kingdom stats/scans | DKP | Titles/admin bots | Data input method | Status | Business model |
|---|---|---|---|---|---|---|---|---|---|---|---|
| riseofkingdomsguides.com [C01-0001] | ✔ | ◐ (8 basic) | ◐ (static builds) | — | ◐ (event list; says events are unpredictable) | — | — | — | none | alive, posts Oct 2026 | not disclosed |
| MetaRoK [C01-0007] | ✔ (tier lists incl. "Investment") | — | ✔ talent maker + databank | — | — | — | — | — | none | alive | ads + $4.99/mo ad-free |
| Theria Games [C01-0005] | ◐ | ✔ (12) | — | — | ◐ custom calendar | — | — | — | manual | alive (© 2025) | affiliate links |
| rok-calculator.com [C01-0006] | ◐ | ✔ (12) | ◐ | — | — | — | — | — | manual | alive (© 2024) | not disclosed |
| Davor's Toolkit [C01-0010] | ◐ | ✔ stat weighting/scoring | ◐ pairings/inscriptions | — | — | — | — | — | manual | updated Aug 2026 | donations |
| RoK Talents [C01-0024] | — | — | ✔ talent builder | — | — | — | — | — | manual | up; repo pushed 2025-05 | free, GPL-3.0 |
| RoK Hub [C01-0008] | — | ◐ | ◐ equipment builder | — | — | — | — | — | manual | **down** (402) | — |
| Fandom wiki [C01-0004] | ◐ reference | — | — | — | — | — | — | — | — | alive, 2 active editors | Fandom ads; CC-BY-SA |
| Codex Helper bot [C01-0009] | ◐ commander guides | ◐ healing, flags | ◐ pairings | — | ✔ rotation + reminders | — | — | ◐ MGE/AoO signups, verification | Discord, screenshots | alive | $5/mo Patreon |
| Zoe bot [C01-0011] | ◐ | ◐ troops, passports | ◐ talents, pairings | — | — | ◐ (reads your Google Sheet) | — | ◐ AoO | Discord, Sheets, screenshots | 5,290 servers | Premium (price unknown) |
| Hero Scrolls [C01-0014] | ◐ | ✔ governor calculators | ◐ | — | — | ✔ 3,198 kingdoms | ✔ | ✔ title bot | service scans + "Ultra" launcher/overlay | alive, v1.244.1 | store (prices hidden) |
| ROKSTATS [C01-0013] | — | — | — | ◐ "Oracle" account sync | ◐ events board | ✔ managed KvK scans | ✔ | ✔ title, fort, alliance bots | service scans/accounts | alive | from $10/mo; KvK from $25 |
| Botals [C01-0015] | — | — | — | — | — | ✔ per scan | ◐ diffs | — | service scans | alive | €10–€20 per scan |
| APO RoK Data [C01-0016] | — | — | — | — | — | ✔ 134 kingdoms | ✔ configurable | — | service scans | alive (12 Oct 2026) | free + donations |
| ROK Steward [C01-0017] | — | — | — | — | — | ◐ (from uploads) | ✔ reports | — | **user uploads game xlsx** | alive | $4.99 pack / $9.99/mo / $89/yr |
| rok-suite [C01-0019] | — | ◐ alliance | — | — | ✔ | ◐ | ✔ | ◐ emigration, AoO, MGE | uploads | single kingdom, OSS | free |
| ROK Battles [C01-0020] | — | ◐ combat lab | — | — | — | ◐ battle reports | — | — | PC mailcache watcher; iOS profile / Android Intra | alive | free, donations |
| RokTracker family [C01-0021] | — | — | — | — | — | ✔ (self-run) | ◐ | — | emulator + ADB + OCR | maintained (2026) | free, MIT |
| Screenshot-OCR libs [C01-0022] | — | — | — | — | — | ◐ | — | — | user screenshots | mixed | OSS |
| Farming bots [C01-0023] | — | — | — | — | — | — | — | (automation) | ADB automation | mostly stale | OSS; out of scope (ToS) |

Not shown: KingdomOS, which is closed behind a Discord login (low confidence), and Auctioneer Bot, a DKP auction bot that reads Google Sheets (low confidence).

## Gap analysis (what nobody does well)

| # | Gap | Evidence | Opportunity for us |
|---|---|---|---|
| G1 | **No personalized account planner.** No tool takes your account state, your hours per day and your spend and returns a prioritized daily/weekly plan, F2P or otherwise. | Matrix: the "Personal planner" column is empty except ROKSTATS Oracle, which is a stats sync, not a planner [C01-0013]. No mobile planner app found (low confidence, see below). | This is our core differentiator, and it matches the plan's §4 optimization model. |
| G2 | **Calculators are isolated and unversioned.** Each calculator answers one question (speedups, VIP, sculptures…). None shares an inventory with the others, none states the patch its data comes from, and some show low expertise. | [C01-0001] (no per-tool version), [C01-0006] ("More Gems Events"), [C01-0005] | One shared "my inventory" model feeding every calculator, with a data-version stamp on each number. |
| G3 | **Early-game and F2P are not served.** The best current math tools (Davor's Toolkit, MetaRoK, Hero Scrolls dashboards) target late-game, KvK and whale concerns: inscriptions, armaments, rallies. | [C01-0010], [C01-0007], [C01-0014] | An early-kingdom (pre-KvK → KvK1) F2P track, which is our stated v1 priority. |
| G4 | **Admin tooling is fragmented and costly.** A kingdom stacks separate paid services for scans, titles, DKP, forts, AoO/MGE signups and calendars. Discord bots glue them together through Google Sheets. | [C01-0013], [C01-0014], [C01-0015], [C01-0017], [C01-0009], [C01-0011]; the "exorbitant cost" testimonial is low confidence | An integrated, ToS-safe admin layer (roster, DKP rules, MGE/AoO rotations, calendar, announcements) that **accepts data from existing scanners and exports** instead of scanning itself. |
| G5 | **Open data is missing.** There is no open, maintained dataset of commanders, talents, buildings, research or events. The wiki is thin. | [C01-0027], [C01-0004] | Build our own sourced dataset (every number carries source, date and patch). Publishing it openly could be a moat for community trust, but check licenses first (see below). |
| G6 | **Fragile and disappearing hobby tools.** RoK Hub was down at access time. Many repos are archived or stale. Scanners break whenever the emulator resolution or game language changes. | [C01-0008], [C01-0021], [C01-0023], [C01-0024] | Reliability and maintenance cadence are a differentiator. Avoid a dependence on emulator-scraping. |
| G7 | **Event planning stops at about 4 days.** No one gives a "what to save for" forecast with confidence levels. | [C01-0029] | A rotation-based forecast labelled with probability, plus a "save X speedups for MGE/Wheel" planner. |
| G8 | **Trust problem.** Search results are flooded with SEO-spam calculators and scam "gem generators". | low-confidence card (see uncertainties) | A clearly sourced, versioned, ad-light hub. |
| G9 | **Mobile UX is weak.** Builders are "best viewed on PC". Mobile users rely on Discord bots. | [C01-0024] | Mobile-first web app (PWA), because RoK players are on phones. |

What is already well served, so we should not compete head-on at first: commander tier lists and talent builds (MetaRoK, riseofkingdomsguides, AllClash, Zoe); paid managed KvK scanning (Hero Scrolls, ROKSTATS, Botals); free KvK analytics (APO). [C01-0007, C01-0014, C01-0016]

## Verified/organized ToS facts (C02)

All of the following come from the Lilith Terms of Service, English version published 2025-04-15. Rise of Kingdoms' official site links to these terms. [C02-0001]

| Clause | What it says | Card |
|---|---|---|
| 17.1.18 | No cheats, exploits, hacks, bots, mods or "third-party software designed to gain an advantage, perceived or actual", and nothing that modifies or interferes with the Service. | C02-0002 |
| 17.1.7 | No engines, crawlers or "data mining tools" to access, search or download Lilith Content, except Lilith software or a normal browser. | C02-0003 |
| 17.1.15 | No access "by automated means including … bots", and no soliciting other members' login credentials. | C02-0004 |
| 17.1.21, 4.4 | Account sharing is prohibited, and so is disclosing your password to third parties. | C02-0005 |
| 17.1.12, 17.1.6 | No reverse engineering and no circumventing protection measures. | C02-0006 |
| 17.1.13 | No collecting or storing other users' personal data without their express permission. | C02-0007 |
| §8, 17.1.10 | Lilith Content (text, data, graphics) is licensed for personal, non-commercial use only. Using the Services or Lilith Content commercially is prohibited. | C02-0008 |
| 17.1.3, 17.1.9, §25 | Using Lilith names, marks or logos, including in metadata, requires Lilith's express written consent. | C02-0009 |
| §4.5, §12.2 | You do not own your account, and selling virtual items is prohibited. | C02-0010 |
| §20.1 | Lilith may suspend or terminate an account at its discretion if it merely suspects a violation. | C02-0011 |

Other facts:
- There is **no official API** or developer program. [C02-0015]
- Lilith publicly permanently banned botting accounts in 2018–2019 and named **"promotion" of botting tools** as prohibited. [C02-0012]
- Community fan sites operate with non-affiliation disclaimers, and no Lilith fan-content policy exists. [C02-0018]
- US copyright protects original expression, not systems or methods. This is US-only and not a substitute for the contract terms. [C02-0020]
- Fandom wiki text is CC-BY-SA. [C02-0021]

## Design implications: what our system can and cannot do

The risk level is our own assessment. It combines the ToS text with observed enforcement and the industry norm.

| Data or feature approach | ToS clauses touched | Risk to users | Risk to us | Decision |
|---|---|---|---|---|
| **Manual input**: user types levels, inventory, commanders, VIP | none | none | none | ✅ **Default.** Make it fast: presets, "copy from last week", bulk paste. |
| **Screenshot upload, OCR on our server**: the user takes the screenshot and uploads it | none directly. The extracted numbers are still "Lilith Content" (§8). If the screenshot holds *other* players' data, 17.1.13 applies. | very low: no game interaction | low | ✅ **Recommended accelerator.** Limit to the user's own screens (inventory, commander, city). Process, keep the numbers, and offer to delete the image. |
| **Uploading existing exports**: game xlsx (if the feature exists), or CSV/xlsx from scanners the kingdom already uses | 17.1.13 for other players' data | low for our users. Whoever produced the scan carries the scan risk. | low–medium | ✅ For kingdom admin: we ingest, we don't scan. Require leadership attestation and member opt-out. Verify the official export first. [C02-0016, low confidence] |
| Our own **automated leaderboard scanning** (emulator, ADB, OCR, service accounts) | 17.1.7, 17.1.15, 17.1.13, and possibly 17.1.10 | medium: the scanning account is exposed | medium–high: ToS breach plus "promotion" | ❌ **Do not build.** This field is crowded with competitors anyway. |
| Reading client files or network traffic (mailcache, DNS or proxy capture, memory) | 17.1.6, 17.1.12 | medium–high | high | ❌ Do not build. |
| Gameplay automation (farming, gathering, titles via ADB, auto-clickers) | 17.1.18, 17.1.15 | high (perma-ban precedent) | high | ❌ Never. Also do not link to or promote such tools (2018 notice). [C02-0012] |
| Asking for game login, account "pilots", account trading | 17.1.15, 17.1.21, §12.2 | high | high | ❌ Never. |
| Planner modelling **farm accounts the user owns** | 17.1.16 forbids creating accounts *for others* | low if manual | low | ⚠️ Allowed as manual planning only. Never automate farm actions. [farm-account card is low confidence] |
| Discord bot (reminders, signups, calculators, roster) using only data users provide | none | none | low | ✅ |
| Using Lilith art, icons or exact game text on a monetized site | §8, 17.1.10, 17.1.3 | — | medium: no enforcement seen, but no license either | ⚠️ Use our own icons and wording. Name commanders in text (nominative use). Get legal review before charging money. |

Product consequences:
1. Build the **planner engine on manual and screenshot input**. This removes the biggest legal risk and also serves F2P users, who will not pay for scan services.
2. Make **kingdom admin import-first.** Accept common scanner and export formats (RokTracker xls, ROK Steward-style xlsx, CSV) and let the user map columns. This makes us complementary to Hero Scrolls, ROKSTATS and APO instead of competing on scanning.
3. Plan for **feature absorption.** Lilith shipped in-game title management. Durable value sits in planning, cross-tool aggregation and coordination, which the game does not do, not in replicating game features. [C01-0025]
4. Publish a plain-language **"how we stay within Lilith's ToS"** page. In a space full of grey-area tools and scams, this builds trust. [C02-0011]

## Data sourcing options for the hub

| Option | Legal/ToS | Practical | Verdict |
|---|---|---|---|
| Our own observation (T0): in-game screenshots and transcribed numbers from our team or contributors | Personal use is fine. Publishing numbers in our own tables relies on facts and systems not being protected (US). The contract still restricts commercial use of Lilith Content. [C02-0020, C02-0008] | Slow but authoritative. Stamp each number with patch and date. | ✅ Primary for numbers. |
| Official patch notes and announcements (T1) | Cite and link; paraphrase. | Incomplete on numbers. | ✅ Primary for changes and history. |
| Fandom wiki | CC-BY-SA: attribution plus share-alike if we copy text. [C02-0021] | Thin (about 2 active editors). [C01-0004] | ◐ Cross-check only. Do not copy. |
| Guide sites (riseofkingdomsguides, MetaRoK, AllClash…) | Their expression is copyrighted. Facts can be cross-checked. | Useful for consensus and strategy. | ◐ T3 for strategy consensus. Never copy text or tables. |
| GitHub repos | Licenses vary: MIT, GPL-3.0, MPL-2.0, none. Using GPL code in closed source creates obligations. | No game-data datasets exist. Only code. [C01-0027] | ◐ Code reference only, after a license check. |
| Datamining the game client or network | Prohibited (17.1.12, 17.1.6). [C02-0006] | — | ❌ |
| Official API | Does not exist. [C02-0015] | — | ❌ |
| Partnership or licensing with Lilith | Only route to official assets and marks. | Unknown feasibility. | 🔭 Explore once there is traction. |

Recommendation: create a versioned, sourced internal dataset as part of the research pipeline. This repo's `facts/` cards are the seed. Later we could release it under an open data license, such as CC-BY 4.0 for our own compilation, after legal review.

## Naming and trademark notes

- Do **not** put "Rise of Kingdoms", Lilith logos or game art in the product name, logo, app icon or domain. Do not use them in meta tags or hidden metadata either: ToS 17.1.9 names this explicitly. [C02-0009]
- A "RISE OF KINGDOMS" design mark was filed at the USPTO in 2019 (serial 88373088). The owner and status are unconfirmed (low confidence). Check USPTO TSDR and EUIPO before choosing a name.
- The community norm is a neutral brand plus a descriptive mention ("a fan-made planner for Rise of Kingdoms") plus a disclaimer, for example MetaRoK's "Rise of Kingdoms is a trademark of Lilith Games. … is a fan site and is not affiliated with Lilith Games." [C02-0018]
- Many tools use "RoK"/"ROK" in their names (ROKSTATS, ROK Steward, ROK Battles, MetaRoK, RoK Talents), and we found no takedown evidence. It is still safer to choose a distinct brand. If we use "RoK" at all, it should only appear as a descriptor or tagline.
- Avoid names that suggest official status, such as "Official", "Lilith", "Governor's Office" or "Kingdom Hall".

## Divergences and uncertainties

These cards have low confidence or rest on a single source.
- **Enforcement against read-only scanners is unclear.** The ToS text clearly covers automated access [C02-0003, C02-0004]. However, paid scan services operate openly, and the only community statement we found (C02-0014, low confidence) says bans come from automation and modified clients. We found no public case of a ban for scanning, but Reddit is inaccessible to us, so this is absence of evidence only.
- **Ban history** after January 2019 is unknown. C02-0012 is backed by snippets only.
- **Official xlsx export (C02-0016):** ROK Steward implies one exists, but we could not confirm it. This is decisive for the admin design.
- **Farm accounts: about 2 characters per kingdom (C02-0017).** The figure comes from an undated fan source.
- **The alliance help cap of 1,000/day (C02-0013)** dates from 2020 and may have changed since.
- **rok.guide (C01-0002):** unreachable, status unknown. **AllClash (C01-0003):** search-title evidence only. **KingdomOS (C01-0018), Auctioneer (C01-0012), Rokverse (C01-0028):** low confidence.
- **Fragmentation and cost pain (C01-0030):** vendor testimonial only. **SEO pollution (C01-0026):** qualitative observation.
- **Hero Scrolls "Ultra" overlay** and **ROK Battles' mobile capture** methods are not documented. Their ToS risk is unassessed.
- The ROKSTATS "live account sync" mechanism is undisclosed.

## Gaps

- Player complaints about existing tools (accuracy, cost, bans) from Reddit and Discord. These are blocked for us. Hand to the pain collector, or collect manually.
- Google Play / App Store direct search for companion and planner apps.
- RoK-specific in-game rules or Code of Conduct. Lilith privacy policy analysis.
- Traffic and user numbers for guide sites (for prioritizing an SEO strategy).
- USPTO/EUIPO ownership and status of RoK marks.
- Legal review: PRC-law ToS × commercial fan tool; GDPR/LGPD for storing governor data.
