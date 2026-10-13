# Feature ideas for the megahub — brainstorm from player pains (ALL ITEMS ARE HYPOTHESES)

> Pain Collector (players), 2026-10-13. Each idea links to pain cards in `research/pains/`. "Must be true" = assumptions to test before building. Ordering follows `_indice-players.md` (frequency × gravity) but prioritises what a hub can actually influence.
> Global constraint from the evidence: Lilith bans/mutes for sharing "third party information" in chat (D-0022) and forbids automation/account sharing (see `raw/competitors/lilith-tos.md`). Any idea relying on reading the game client, bots or account trading is excluded.

## 1. Decision paralysis cluster (D-0006, D-0007, D-0008, D-0010, D-0011, D-0012, D-0015, D-0029)

| Idea (hypothesis) | Pains | Must be true |
|---|---|---|
| **"Next 3 moves" account planner** — 2-minute intake (kingdom age/season, CH, tech milestones, T4/T5, VIP, gold heads, key commanders, budget, minutes/day) → next 3 actions with the *why* and what to *skip*. | D-0006, D-0015 | Rules can be encoded per stage with enough accuracy; players will type ~15 numbers (no screenshots/OCR ToS risk); advice stays current after patches (needs a maintained rules base from the facts pipeline). |
| **Account benchmark ("am I on track?")** — percentile vs. accounts of the same kingdom age and spend profile; replaces "rate my account" posts. | D-0007, D-0043 | Enough players contribute anonymised snapshots to build distributions (cold-start: seed from Reddit progress posts with dates); players accept self-reported data. |
| **Commander investment advisor** — for each commander: role, shelf-life rating, swap/reset eligibility, heads needed to reach "useful" (e.g. 5511 vs expertise), and an F2P gold-head income projection (VIP, dailies, events). | D-0008, D-0009, D-0029 | Shelf-life can be estimated credibly (patch history); swap/reset rules are documented; the community trusts the hub's tier judgments (contested area — show reasoning and consensus level). |
| **Gem & speedup allocator** — compares value of gems in VIP vs wheels vs books for the player's stage; tells when to spend speedups vs save for MGE/Zenith/KvK given the upcoming calendar. | D-0010, D-0011, D-0033 | Event calendar is predictable per kingdom age; values per gem can be computed (needs mechanic facts); players' goals can be expressed simply. |
| **Restart-or-continue calculator** — time/money to reach a target on current account vs. a new account in a new kingdom (incl. sleeper option, migration constraints). | D-0015, D-0018 | Progress curves by spend profile are knowable; honest output doesn't push churn that harms the hub's audience. |

## 2. KvK preparation (D-0012, D-0013, D-0028)

| Idea | Pains | Must be true |
|---|---|---|
| **KvK readiness checklist by role & spend** (rally filler, field fighter, farmer) with concrete ranges and a confidence note. | D-0012 | Ranges can be justified (contradictory community numbers today: 75M vs 1B RSS) — needs source-backed derivation and per-seed variants. |
| **Healing budget calculator** — troops × tier × expected losses → RSS + healing speedups; batch-healing tips for F2P. | D-0028, D-0032 | Healing cost formulas are verifiable (T1/T2 facts); comment evidence says no tool covers this today. |
| **Kingdom lifecycle explainer** (pre-KvK → KvK1–3 → SoC): what changes, what to save, which commanders become irrelevant. | D-0013, D-0016 | Season structure is stable enough to document; maintained per patch. |

## 3. Time burden & burnout (D-0002, D-0026, D-0014, D-0020)

| Idea | Pains | Must be true |
|---|---|---|
| **Time-boxed routine builder** — "I have 3×10 min + 1 h on weekends" → per-session checklist ordered by value; explicit "safe to skip" list. | D-0002, D-0026 | Value-per-minute of activities can be estimated (plan §4); players value permission to skip more than max optimisation. |
| **Personal event calendar in local time** with exact end times, reminders and "prepare X by Y" notes (would have prevented the Jan-2025 commander-swap losses). | D-0014 | Event schedules can be derived per kingdom age/season without reading the client; push/email reminders are acceptable; schedules change rarely without notice. |
| **Farm-account dashboard (manual)** — list of farms, last-visited time, RSS stock estimate, transfer plan; no automation. | D-0020 | Players will log manually (or with lightweight inputs); value exceeds effort; must not encourage ToS-violating multi-account behaviours beyond what Lilith allows. |
| **Healthy-play framing** — weekly time report from the planner, "minimum viable routine", break-mode advice (how to park an account safely). | D-0026, D-0036 | Audience responds positively (risk: seen as preachy); differentiates from whale-oriented content. |

## 4. Where do I belong? (D-0018, D-0016, D-0019, D-0037, D-0025, D-0005, D-0004)

| Idea | Pains | Must be true |
|---|---|---|
| **Kingdom directory / matching** — kingdoms tagged by playstyle (casual, PvE, competitive), language, timezone, seed, KvK requirements (KP/deads), migration openness; player filters and sees fit. | D-0037, D-0025, D-0004, D-0019, D-0014 | Kingdom leaders will list themselves (incentive: recruitment) and keep info honest; moderation against fake listings; doesn't conflict with chat bans (links shared outside game). |
| **Returning-player hub** — "what changed since <date>", account triage (keep/park/restart), returnee migration rules, priority plan. | D-0016, D-0013 | Patch history is collected (C04); returning players can find the hub (SEO / Reddit). |
| **New-kingdom survival guide** — day 1–10 for natural start vs sleeper vs project; shield timing, alliance selection by activity rules, power milestones to avoid kicks. | D-0018, D-0041, D-0005 | Advice works without joining paid "projects"; honest expectations for solo F2P. |
| **Personal requirements tracker** — player enters their kingdom's rules (KP, deads, power, MGE rules) and tracks progress to avoid being zeroed/forced out. | D-0004, D-0003 | Rules are expressible in a simple form; players will update their numbers; useful even without kingdom adoption. |
| **Migration calculator** — passports needed by power, requirements, timing windows, cheapest path. | D-0019 | Passport formula/limits are verifiable and stable. |

## 5. Pay-to-win & spending (D-0001, D-0034, D-0033)

| Idea | Pains | Must be true |
|---|---|---|
| **Budget-aware goals** — choose F2P / monthly pass / $X month → realistic targets (march count, role) and progress pace, instead of comparing with whales. | D-0001 | Spend profiles map to outcomes credibly; players accept "role-based" success. |
| **Bundle & wheel value ranking** — value per $ and expected gems to guarantee wheel rewards; monthly spend tracker with "skip" advice. | D-0034, D-0033, D-0010 | Bundle contents are capturable quickly after release (manual); avoid appearing to promote spending. |

## 6. Information quality (D-0031, D-0032)

| Idea | Pains | Must be true |
|---|---|---|
| **Guides tagged by spend profile + "last verified on patch X"**, with consensus level (unanimous/divided) from the facts pipeline. | D-0031 | Maintenance capacity exists; the facts pipeline delivers dated, verified facts. |
| **Fast, reliable, no-login calculators** (RSS, speedups, healing, passports, gold heads, sculptures) — mobile first. | D-0032, D-0012, D-0028 | Uptime/hosting is cheap; numbers are verified; screenshots/OCR avoided (players find screenshot bots annoying; ToS risk). |
| **Battle/march comparison (simulator-lite)** — a forum wish ("Add a battle simulator… we should not have to rely on a 3rd party"). | D-0008, D-0032 | Combat formulas are knowable enough; high risk of inaccuracy — probably later phase. |

## 7. Identity (D-0042, D-0043, D-0044, D-0038)

| Idea | Pains | Must be true |
|---|---|---|
| **Shareable account card / progress timeline** — players record milestones (CH25, T5, first expertise, KvK results) and share a page (outside game). | D-0043, D-0007 | Players want to show off outside the game (Reddit showcases + 298k forum photowall posts suggest yes); sharing does not trigger in-game bans (share on Reddit/Discord, not game chat). |
| **Skin-milestone planner** — Hidden Lotus day-by-day plan; Zenith cost estimator and "ask your kingdom first" warning. | D-0042, D-0015 | Milestone rules are documented; reduces restart loops rather than encouraging them. |
| **Civilization pages with history & identity** (lore + bonuses + best use) | D-0038 | Out of mechanics scope; low priority, but cheap engagement content. |
| **Alliance branding kit** (logo, flag, Discord role templates) | (inferred, no evidence) | **Untested** — no public evidence of demand; validate with alliance leaders before building. |

## 8. Out of scope (record only)
D-0017 account loss, D-0021 bots/pilots, D-0022 opaque bans, D-0023 support, D-0024 chat safety, D-0035 ads, D-0039 crashes — game-side. Possible low-cost hub content: "account safety checklist" (bind, keep receipts, record governor ID) and "what gets you muted/banned" FAQ from official sources.

## Cross-cutting assumptions to validate first
1. Players will enter data manually (no OCR/scanning) — test with a 15-field intake prototype.
2. Advice can be kept current per patch — depends on the facts/verification pipeline throughput.
3. Discovery: the hub must be found via Reddit/YouTube/Google, not in-game chat (chat-filter bans).
4. Trust: community is quick to call advice wrong (harsh comment culture) — show sources, dates and consensus level.
