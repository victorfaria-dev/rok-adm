# T0 measurement protocol: new F2P account diary

Version 1, 2026-10-13. Owner: sub-admin CONTA. Observer: Victor, playing a fresh F2P account in a new kingdom.

Every screenshot and every row in the log is a **T0 source** (slug `src:t0-victor` in `research/fontes.md`). T0 sits at the top of the evidence ladder, so a few well-taken screenshots can settle questions that weeks of web research could not. The protocol has four parts:

1. **What to capture and when**: a day-by-day diary (§2).
2. **Stopwatch method**: how to time daily tasks (§3).
3. **Counters to log**: gems, AP and speedups (§4).
4. **Where it goes**: file naming and CSV columns (§5). Templates: `protocolos/t0-log-template.csv` and `protocolos/prints/README.md`.

General rules:
- **Play normally, F2P.** Never spend money. Follow the guide you would follow anyway. The goal is to observe the game, not to optimise it for the protocol.
- **Record the game version once a week**: Settings → the version string, plus the kingdom number. Every T0 fact needs a date, a kingdom day and a version.
- **Kingdom day** = days since the kingdom opened. The kingdom/Monument screen shows it. Day 1 is the day you start if the kingdom is brand new.
- **Screenshot first, play second.** When a screen below appears for the first time, take the screenshot before tapping anything. Uncropped screenshots are fine.
- **Time zone**: write times in UTC if you can. The game resets at 00:00 UTC.
- If something already happened and you missed it, write `missed` in the log. Never reconstruct numbers from memory. (Same rule as the research: no invented numbers.)

## 1. Open questions, ranked by impact on the F2P guide

| # | Question (gap ID) | Why it matters | Observable when | What settles it |
|---|---|---|---|---|
| 1 | **Real F2P gem income per day, by source** (L-A04-01) | Drives VIP timing, MTG and every "spend vs hoard" decision. Only 100 gems/day is documented. | Day 1 onward, all 7+ days | §4 gem ledger (gems_in by source) |
| 2 | **Minutes per daily task** (L-A10-01) | The guide promises "best account per hour played". No source anywhere publishes minutes. | Day 2 onward (after the tutorial) | §3 stopwatch, 7 days |
| 3 | **Base AP regeneration per hour** (L-A09-01) and **daily AP claim** (L-A09-02) | Sets how many barbarians/forts per day, and the value of AP items. | Day 1 | §4 AP test; screenshot of the claim |
| 4 | **Event calendar of a new kingdom**: first day of MGE, More Than Gems, Lohar/Arms Training, Wheel of Fortune, Pelagius (day 5), Pioneer/Road to Revival, Ceroli, Golden Kingdom, Karuak, Ark of Osiris (L-A11-01) | Builds the 90-day plan to KvK1. Today we only have T3 day numbers. | Every 3 days | Calendar screenshot every 3 days plus every new event's rules page |
| 5 | **Monument / Kingdom Chronicles stages with dates** (L-B01-01) | Unlocks forts, passes and Lost Temple. Paces the whole kingdom. | Day 1 onward, at each stage change | Monument screenshot at each change |
| 6 | **Actual (buffed) build times and building-speed buff** on the CH path (L-A01-02, L-A01-03) | Converts Fandom raw times into real days and speedup needs. | CH4 → CH22 | CH upgrade screen plus City Hall → buff chart, at every CH level |
| 7 | **Daily Objectives task list and points after 1.1.09** (L-A10-02) | The cheapest path to 100 points = 100 gems/day. | Day 1 | Screenshot of the full list (scroll); repeat on day 7 (tasks rotate) |
| 8 | **VIP thresholds: cumulative or per level?** (L-A05-01) and the current VIP buff list (L-A05-02) | VIP timeline and the VIP6/VIP10 targets. | Day 1 (VIP 0→1) | VIP screen showing "points to next level" at VIP0, VIP1 and each new level |
| 9 | **Early unlock levels**: Academy CH4 or CH6? first Quarry CH4 or CH6? Trading Post CH10 or CH12? (L-A01-01) | Resolves a contested Fandom edit. Low effort. | CH4–CH12 (days 1–7) | Screenshot of the "unlocks" panel on each CH upgrade screen |
| 10 | **Trading Post: can gold be sent? Capacity, tax, unlock level** (L-A03-03, L-A03-04) | Decides whether a gold farm is useful. | The day the Trading Post unlocks (CH10 or CH12) | Screenshot of the Trading Post info screen plus the resource-assistance screen with the resource selector open |
| 11 | **Gem deposit size and gathering time** (L-A04-02) | Whether F2P should farm gems. | After the Jewelry tech (Academy 16, so CH16+) | Node tooltip (amount) plus march timer |
| 12 | **Speedup income per day** (L-A04-04) | The speedup budget for CH17/CH21/T4. | Day 1 onward | Speedup inventory screenshot on days 1, 7, 14, 30 |
| 13 | **Node amounts and gathering speed** (L-A03-01) | Farm guide, value of gathering minutes. | Day 1 (L1–L2 nodes), later higher | Tooltip of one node per level plus march screen (load, time) |
| 14 | **Wheel of Fortune price in the home kingdom** (L-A11-03) | Gems vs Spin Tickets. | First Wheel (~day 24 per T3) | Wheel screen with the price |
| 15 | **Lost Kingdom entry requirement; Eve of the Crusade timing** (L-B01-03) | KvK1 targets. | Pre-KvK (~day 85–100) | Event rules screenshot |
| 16 | **Store prices** (Growth Fund, Supply Depot, $5 packs, first-purchase multiplier) (L-A12-01) | Low-spender baseline. Look only, do not buy. | Day 1 | Store screenshots (note currency) |

## 2. Day-by-day diary

Days are kingdom days. Where the trigger is a CH level, take the screenshot when you reach it, whatever the day.

### Day 1 (start, tutorial, CH1 → ~CH8)
- [ ] `version`: Settings screen (version + kingdom number). Repeat weekly.
- [ ] `civ-select`: the civilization choice screen (all perks visible). Note which civ you chose and why.
- [ ] `ch-upgrade-chNN`: on **every** CH upgrade screen, before tapping upgrade. It shows requirements, cost, time and the "unlocks" list. Expect many today (CH2–CH8).
- [ ] `vip-screen`: the VIP screen at VIP0 (points needed for VIP1) and right after the first VIP claim. Q8.
- [ ] `vip-claim`: the daily VIP points claim (amount). Repeat each day in the log (streak 40→200).
- [ ] `ap-bar`: the AP bar (current/maximum). Q3: is the maximum 1,000 or 1,500?
- [ ] `ap-claim`: the Daily Action Points claim (amount). Q3.
- [ ] `ap-regen`: **AP regeneration test.** Read AP at time T1. Do not spend AP for ≥60 minutes (stay below the cap). Read again at T2. Log both values and both times. Note VIP level and civ (China +5%, Germany +10%).
- [ ] `daily-objectives`: the full Daily Objectives list (scroll; several screenshots) plus the chest milestones. Q7.
- [ ] `store`: Growth Fund, Supply Depot / gem supply, the cheapest packs. **Do not buy.** Q16.
- [ ] `gems-start`: gem count at the start and at the end of the day. Start the gem ledger (§4).
- [ ] `barbarians-max`: highest barbarian level you can search today (kingdom-wide unlock).
- [ ] `monument`: the Monument / Kingdom Chronicles screen (stage name, timer, goal).
- [ ] `calendar`: the event calendar (all tabs).

### Days 2–7 (CH8 → ~CH12; first week)
- [ ] Each day: `calendar` (only if new events appear), `vip-claim`, `gems` (end of day), one row per timed task (§3).
- [ ] `queue-dashboard` at CH8: the queue-management screen (since 1.1.01).
- [ ] `ch-upgrade-ch04`, `-ch06`, `-ch10`, `-ch12`: zoom on the "unlocks" list. Note whether the **Academy**, the **first Quarry** and the **Trading Post** appear at CH4/CH6/CH10/CH12. Q9.
- [ ] `trading-post` (as soon as it unlocks): the info screen (capacity, tax). Then open resource assistance to an alliance member. Screenshot the resource selector **showing whether Gold can be selected**, and the tax preview. Q10.
- [ ] `lyceum` at CH10: Peerless Scholar (exam days, gem pool if shown).
- [ ] `civ-change` at CH10: the free Civilization Change reward.
- [ ] `vip-shop`: the VIP Shop (weekly restock Monday 00:00 UTC). Food prices of AP and 5-minute speedups.
- [ ] `node-tooltip`: tap one resource node of each level you can see (L1–L3). Screenshot the amount. Send a march and screenshot the march time and load. Q13.
- [ ] Day 5: `pelagius` (Legendary Pelagius event, per 1.1.09). Rules and rewards screen.
- [ ] Day 7: `speedups`: inventory, Speedups tab (counts per type). `daily-objectives` again (tasks rotate).
- [ ] Day 7: write a 5-line summary in the log (`task=weekly-summary`): CH, power, VIP, gems held, the biggest time sink of the week.

### Days 8–30 (CH12 → ~CH17; Monument stages, first big events)
- [ ] Every 3 days: `calendar`. Every Monument stage change: `monument`.
- [ ] Every new event the first time you see it: `event-<name>` (rules page plus reward/milestone table). Expected (T3, unverified): Pioneer + Road to Revival ~day 20–23; first Wheel of Fortune ~day 24 (Q14: price in gems or Spin Tickets?); More Than Gems only when the kingdom is older than ~21 days (T4).
- [ ] `ch-upgrade-chNN` at every CH, plus `buff-chart` (City Hall → buff/economy chart: building speed %) at CH10, CH16 and CH21. Q6.
- [ ] `forts`: when barbarian forts unlock (Monument stage), the rally screen with AP cost.
- [ ] `auto-peacekeeping`: the screen when it unlocks, including the estimated AP. Note the unlock condition.
- [ ] Day 14 and day 30: `speedups` inventory. Day 30: `weekly-summary` plus the CH reached by day 30 (T4 says T4 troops "around day 30", which would mean CH21; check it).
- [ ] CH16: `civ-buff-switch` (civilization buff switching page). `jewelry`: when the Jewelry tech completes, gather one Lv1 and one Lv2 gem deposit. Log gems and minutes (Q11).

### Days 31–90 (CH17 → CH21/22; preparing KvK1)
- [ ] Keep the daily log (gems, VIP claim, timed tasks). The stopwatch can drop to 2 days/week once the averages settle (§3).
- [ ] `mtg`: every More Than Gems: start date, duration and milestone table (gems → rewards). Q4.
- [ ] `vip-screen` at each new VIP level (VIP buff list). Q8.
- [ ] `ch-upgrade-ch17` … `-ch22` plus `buff-chart`.
- [ ] `hospital` at CH16+: total hospital capacity.

### Pre-KvK to KvK1 (~days 85–100)
- [ ] `eve-of-crusade`: rules page (stages, durations). Note whether the Lost Kingdom opens at the same time (1.1.12 says yes, T3). Q15.
- [ ] `lost-kingdom-entry`: any CH requirement shown. Q15.
- [ ] `kvk1-day0`: profile (power, CH, VIP, troop tiers) on the first day of KvK1. This closes the loop with the guide's prediction (B01-0700).

## 3. Stopwatch method (minutes per daily task)

- Use the phone's stopwatch or a second device. Start when you **open the screen for the task**. Stop when you **leave it**. Include loading and travel between screens. Do not include waiting for marches or timers you are not watching.
- **One row per task** in the log, `minutes` with one decimal (e.g. 1.5). If a task is split across sessions, write one row per session.
- Fixed task names (use exactly these so the rows can be summed):

| task | What counts |
|---|---|
| `login-claims` | VIP chest, VIP points, daily AP, mail rewards, alliance gifts |
| `queues` | Refilling builder (both), research, training and healing queues |
| `alliance-help` | Pressing help and the help-all button |
| `alliance-donate` | Alliance tech donation |
| `daily-objectives` | Doing the leftover objectives you would not otherwise do, plus claiming the chests |
| `tavern-chests` | Opening free silver/golden chests |
| `barbarians-manual` | Manual barbarian attacks (include the count) |
| `auto-peacekeeping` | Setting up auto-peacekeeping |
| `forts` | Launching or joining fort rallies |
| `gathering` | Sending gatherers (include marches sent) |
| `courier-merchant` | Courier Station / Mysterious Merchant |
| `expedition` | 3-star claim, medal shop |
| `sunset-canyon` | Daily attempts |
| `lyceum` | Peerless Scholar exam |
| `events` | Any event action (name it in `notes`) |
| `other` | Anything else (describe it) |

- **Session total**: also log one row `task=session` with the total minutes of each play session. This catches time not attributed to any task.
- **Duration**: 7 consecutive days (days 2–8). After that, 2 days per week (one weekday, one weekend day) until KvK1.
- **Value per minute** (computed later, by the research side): rewards ÷ minutes per task. So also log the main reward of each task (e.g. `gems_in=100` for the 100-point chest, `rewards="5x5m training"`).

## 4. Counters

### Gem ledger (Q1, every day)
- One row per gem gain or spend with `gems_in` or `gems_out`, and the source in `notes`, using one of these tags: `daily-objectives`, `quest`, `ch-reward`, `barbarian`, `gem-deposit`, `event:<name>`, `alliance-gift`, `mail`, `code`, `lyceum`, `other`.
- One row per day with `task=gems-eod` and `gems_held` at the end of the day. A missed tag is better than a missing row.
- After 7 days, the research side computes the gems/day mean and min/max per source. This replaces A04-0006 (derived) with T0 data.

### AP (Q3)
- Day 1: the regeneration test (§2). Repeat once at a higher VIP level (VIP buffs AP recovery from VIP2 per Fandom). Log `ap_before`, `ap_after`, `minutes`, `vip`, `civ`.
- Daily: AP claim amount (one row, `task=ap-claim`).

### Speedups (Q12)
- Inventory screenshot on days 1, 7, 14, 30, 60 and 90. Each time, add a row with `task=speedup-inventory` and the totals in `notes` (minutes per type: universal / building / research / training / healing).

### CH ranges (Q6)
- At every CH upgrade: one row with `task=ch-upgrade` and the CH you are going to (N), `minutes_displayed` (displayed build time, in minutes), `buff_building_pct` (from the buff chart if seen) and `speedups_used` (minutes used to finish it). This gives real time per CH range (CH1–10, 10–16, 16–17, 17–21, 21–22).

## 5. Files

- Screenshots go in `research/protocolos/prints/`, named `YYYY-MM-DD_dayNN_topic.png` (see `prints/README.md`). Topics use the names in bold/backticks above (`ch-upgrade-ch10`, `ap-bar`, `trading-post`, `calendar`…).
- Log: copy `protocolos/t0-log-template.csv` to `protocolos/t0-log.csv` and append rows. Columns:

| Column | Meaning |
|---|---|
| `date` | YYYY-MM-DD (UTC if possible) |
| `kingdom_day` | Kingdom day number |
| `ch` | Current City Hall level |
| `vip` | Current VIP level |
| `task` | Task name from §3, or a counter row (`gems-eod`, `ap-regen`, `ap-claim`, `ch-upgrade`, `speedup-inventory`, `weekly-summary`, `observation`) |
| `minutes` | Stopwatch minutes (one decimal), or the test duration for `ap-regen` |
| `rewards` | Free text: main rewards obtained (e.g. "100 gems, Golden Key") |
| `gems_in` | Gems gained in this row |
| `gems_out` | Gems spent in this row |
| `notes` | Source tag, AP before/after, buff %, event name, anything else |
| `screenshot` | File name(s) in `prints/` |

The first 9 columns are the minimum the admin asked for (`date, kingdom_day, CH, task, minutes, rewards, gems_in, gems_out, notes`). `vip` and `screenshot` are optional extras; leave them empty if inconvenient.

## 6. How the research side uses this

- Each answered question becomes a **T0 card** (or updates an existing card). The card cites `src:t0-victor` with the screenshot file name as `url` and a transcription as `trecho`. Confidence `alta` applies **for that version and that kingdom**.
- The guide's time model (A10-0002 checklist with minutes) and gem model (A04-0006) are rebuilt from the log after day 8 and again after day 30.
- Bias note: one account, one kingdom, one playstyle. T0 numbers are a sample of one. The guide shows them as "measured on a fresh F2P account (kingdom N, version X)", never as universal constants.

## Adendo (2026-10-13) — itens pedidos pelo produto

| # | Item | O que registrar | Bloqueia |
|---|------|-----------------|----------|
| T0-A1 | Upload de avatar personalizado | Existe? Requisito (CH/VIP/custo), formato, tamanho máximo, recorte, moderação/tempo de aprovação, cooldown de troca; print do avatar com a moldura do jogo por cima | F-07, F-08 |
| T0-A2 | Código curto no anúncio/descrição da aliança | Se um código alfanumérico curto (sem URL) passa pelo filtro de chat/descrição | F-06 (verificação de liderança) |
| T0-A3 | ROK Toolkit (ferramenta oficial) | Prints de todas as telas: o que mostra, se exporta dados | F-37/F-38 (DKP), ingestão de dados |
| T0-A4 | OCR dos próprios prints | Prints das telas de perfil/estatísticas em resolução nativa (para testar OCR) | F-19 Data Intake |
| T0-A5 | Escudos / proteção de iniciante | Duração da proteção inicial, custos e durações de escudos | blocos de segurança do guia F2P |
| T0-A6 | Skin Hidden Lotus | Como se obtém (evento de início? condição?) | conteúdo de identidade/restart |
