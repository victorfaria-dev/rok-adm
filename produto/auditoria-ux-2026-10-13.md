# Auditoria de UX — 2026-10-13 (revisor crítico, sem edições)

Relatório bruto do revisor (em inglês). Capturas de tela ficaram no scratchpad da sessão e não foram versionadas.

## Persona walkthroughs (phone, 390x844)

**1. New F2P, 2 weeks in — "what do I do today?"**
Path: Home → "Build my guide" → 10-step Sun Tzu chat (6 questions shown, 4 skipped) → "Review answers" → "See my guide" → `/guide/` (13,848px, 745 words, 9 sections) → Routine tab. 13 taps to the guide, 14 to Routine. First thing shown: "Share" + "39 of 43 steps apply · patch 1.1.09" + a 400-word "Budget Reality Check" essay with citation codes `[B01-0500]`. No "do this now" step. The real answer lives on Routine (clean 7-item checklist), but the funnel does not land there, and Routine shows "pending measurement · must-do" and "planner-estimate-v0 … research/protocolos/t0-medicao.md". Questionnaire asks kingdom age and civilization (16 options), which a 2-week player cannot answer.

**2. Low spender — "$20 pack worth it?" / "which commanders?"**
Pack: no money entry on Home. Menu → Tools → Pack value is the 6th card → 500px "WHAT THIS DOES NOT TELL YOU" before the form. ~8 taps + 3 typed fields. Result "210.4 gems per dollar · Low confidence · Re-verify: A12-0616…", never yes/no. Commanders: dropdown of 21 → verdict badge (good) → 29-control questionnaire; one commander at a time, no ranked list. 5 taps, 4,520px.

**3. Kingdom leader — rules, MGE, recruitment**
Home → menu → "Kingdom council" (label does not say "leaders") → hub with 7 pill-tabs + 6 cards + Privacy block → Rules → blank charter. 3 taps to a blank editor; 7 to touch Rules, MGE, Recruit. Each sub-page repeats the pills, the "Planning only, no bots" disclaimer and the Privacy block. DKP formula is a raw expression textbox. Kingdom pages do not feed each other (rules ↔ requirements ↔ recruit post).

## Top 15 problems

1. Guide lands on a research essay, not actions (`/guide/` 13.8k px, citation codes inline).
2. Funnel ends on the wrong page (Guide instead of Routine/Today).
3. Provenance noise: 246 "Re-verify" chips, "Low confidence" on 26 pages, dataset banner on 15 pages, fact IDs on results.
4. Menu hides half the product (Tools, Farms, Kingdom); no entry from Home.
5. Pack value never answers the question; 500px disclaimer before the form.
6. Tools ignore the profile (0 of 13 read it).
7. "You" tab is Settings, not a profile.
8. Questionnaire asks unknowables (kingdom day, civilization, sessions/day); default CH = 1.
9. Commanders: single-item questionnaire, no ranking.
10. Kingdom hub triple navigation (pills + cards + menu).
11. Routine leaks internals (planner version, file paths).
12. Tools page: flat list of 16 cards with Glossary/Changes/Trust mixed in.
13. Meta pages in nav: Brand, Crest (experimental), Card, Trust (8.9k px).
14. Home hero is marketing ("354 fact cards"), not a dashboard.
15. Jargon unexplained at point of use (DKP, MGE, KvK1, T4/T5…); glossary is an 18k px page.

## Content density (phone heights)
Guide 14,132 · Glossary 18,153 · Farm guide 14,133 (2,637 words) · Changes 12,607 · New kingdom 11,079 · Trust 8,889 · Safety 7,537 · Gems 7,122 · Requirements 6,444 · Pack value 5,546 (1,135 words for a 4-field calculator). Nothing collapsed by default; 2–4 paragraphs of preamble before the first control.

## Pollution → functions
- Pack value disclaimers + 9-pack table + prose → one widget: "better/worse than X% of reference packs" bar; disclaimers behind (i).
- `/tools/kvk/` + `/tools/migration/` + new-kingdom timeline text → one kingdom timeline widget fed by kingdom day.
- `/tools/gems/` + `/tools/vip/` + `/tools/action-points/` → one "what do my gems buy" calculator.
- DKP essay + formula help → inline tooltip; formula builder instead of textbox.
- Data banner (15), Privacy block (7), "no bots" (4), "fan-made" footer (54), "stays on this device" (19) → one global footer + Trust page.
- Guide "realistic targets" bullets → progress gauges on the City Hall tab.
- `/changes/` → "since you left" diff inside the returning-player flow.
- `/glossary/` → inline term popovers; page kept as search.
- `/brand/`, `/crest/`, `/card/` → one "share card" under profile; Brand off-nav.
- Routine "Reality check" paragraph → one line.

## IA mapping (owner's structure)
- **Guides tab:** `/guide/`, `/guides/*`, `/guides/farms/*`, `/tools/safety/`, `/tools/zeroed/`, `/glossary/` (search), `/changes/` (returning filter).
- **City Hall progress tab:** profile summary, CH + next-level cost (`/tools/buildings/`), speedups, VIP/gems, Today checklist (`/routine/`), KvK readiness milestones, hoard countdown, governor card.
- **Player tools:** Pack value, Commanders (ranked by role), Healing, Action points, Migration, Farms; Screenshot reader hidden (experimental).
- **Leader systems (role switch):** `/kingdom/*`, seed under experimental, crest as alliance identity.
- **Remove/merge:** `/more/`, `/brand/` (footer), `/trust/` (footer, shorter), `/start/` into profile editing, `/me/` → profile summary with settings behind a gear, `/tools/` index.

## Proposed flow and nav
`/` → no profile: 4-question setup (spend, minutes/day, City Hall, kingdom stage) → Progress tab with "Today: 3 must-dos" + CH gauge → task opens the tool pre-filled. Returning users land on Progress.
- Player nav: Today · Progress · Guides · Tools · Me.
- Leader nav: Kingdom · Members · Events · Guides · Me.
- Role switch "Playing as: Player / Leader" on Me; leader mode swaps the tab bar.

## Language
Audience is Brazilian; site is English-only. Localize setup, Today, Progress and kingdom rule templates first.
