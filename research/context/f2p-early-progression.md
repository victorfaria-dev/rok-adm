---
tema: "F2P early progression: City Hall path, builder time, research priorities, T4 path (new kingdom → KvK1)"
dominios: [A01, A02, A03, A08, A10, A14, B01]
gerado_em: 2026-10-13
fichas_base: [A01-0001, A01-0002, A01-0003, A01-0004, A01-0005, A01-0006, A01-0007, A01-0008, A01-0009, A01-0010, A01-0011, A02-0500, A02-0501, A02-0502, A02-0503, A02-0504, A03-0001, A03-0021, A03-0023, A05-0008, A08-0500, A08-0501, A08-0502, A08-0503, A08-0504, A08-0505, A08-0506, A10-0006, A14-0001, A14-0002, A14-0003, B01-0503, B01-0700]
cobertura: "Covered: CH1→CH25 requirements, raw times and unlocks (Fandom dev dataset), prerequisite rules, builder queues, CH rewards, march queues, research and troop-tier consensus (T3), civilization start. Gaps: buffed build times, ordered research path with times, speedup budget model, early unlock levels (CH4/6/10/12), time to T4 measured on a real account. See facts/A01/_lacunas.md, A02, A08."
---

# F2P early progression (new kingdom → first KvK)

Rule for this pack: the main sections use only cards with `status` verificado/organizado and `confianca` ≥ media. Everything else is listed under "Divergences and uncertainties" or "Gaps". Card IDs in brackets; machine tables in `facts/A01/data/`.

## Summary (≤ 10 lines)

1. **City Hall (CH) gates everything.** No building can exceed CH level, and each CH level needs Wall N−1 plus one rotating building at N−1 [A01-0003, A01-0001, A01-0004].
2. **Unlock milestones that matter to F2P:**
   - CH5: 2nd march.
   - CH8: queue dashboard and Tier 2.
   - CH11: 3rd march.
   - CH16: Tier 3 and the Blacksmith.
   - CH17: 4th march.
   - CH21: **Tier 4**.
   - CH22: 5th march.
   - CH25: Tier 5.

   [A01-0001, A01-0011, A03-0023]
3. **The second builder is the first big lever.** Builder Recruitment gives it for 2 days per item; VIP 6 makes it permanent [A01-0006]. The majority advice is to spend early free gems on VIP to reach VIP 6 [A05-0008].
4. **Build order:** CH and its prerequisites first, keep both builders busy, and defer non-prerequisite buildings. Resources come from gathering [A01-0007, A03-0021].
5. **Academy:** economy and speed techs first (Writing, Masonry/Engineering, Mathematics). Then T3 → T4 for infantry, cavalry and archers (skip T4 siege) and the shared combat techs [A02-0500, A02-0501].
6. **T4 is the working tier for KvK1;** T5 is long-term [A08-0500]. As a F2P: fight with complete marches, don't lead fights, mind hospital overflow [A08-0502, A08-0503, A08-0504].
7. **Civilization:** China is the most recommended F2P start (+5% build speed, +5% AP recovery, Sun Tzu). CH10 gives one free civilization change [A14-0003, A14-0002].

## Verified facts

### City Hall path

- **Requirements:** CH N (N≥3) requires Wall N−1 plus one building at N−1. The rotation is Hospital, Scout Camp, Storehouse, Barracks, Alliance Center, Academy, Archery Range, Trading Post (at CH14 and CH25), Stable, Siege Workshop [A01-0001]. Full table: `facts/A01/data/city-hall.csv`.
- **Prerequisite chains** [A01-0004]:
  - Wall N (N≥5) needs Tavern N.
  - Tavern N needs Quarry N.
  - Barracks, Archery Range and Stable N need Farm, Lumber Mill and Quarry N respectively.
  - Siege Workshop N needs all three military buildings at N.
  - Trading Post N needs Goldmine N.

  Per-building costs and raw times: `facts/A01/data/buildings/*.csv` (17 buildings).
- **Costs** are food and wood, with stone from CH6. City Hall never costs gold. CH25 also needs a Master's Blueprint [A01-0001, A03-0001].
- **Raw CH times** (no buffs; developer dataset on Fandom): CH10 22h, CH16 4d, CH17 4d 20h, CH21 11d, CH22 17d 3h, CH25 126d 8h [A01-0001].
- **CH upgrade rewards** include [A01-0002]; full list in `facts/A01/data/city-hall-rewards.csv`:
  - CH8: 2× 8h universal speedups.
  - CH9: 1× 24h universal.
  - CH10: a free Civilization Change.
  - CH16: 7d universal + 100 gems.
  - CH21: 7d universal + 200 gems.
  - CH25: Master's Blueprint + 500 gems.
- **March queues:** 1, then 2 at CH5, 3 at CH11, 4 at CH17, 5 at CH22 [A03-0023].
- **Hospital capacity** (unbuffed, per hospital): 7,500 at Lv1, 29,000 at Lv15, 75,000 at Lv25. CH4, CH9 and CH15 unlock the 2nd, 3rd and 4th hospitals [A01-0008, A01-0001]. Older guide tables (3,000 at Lv1) predate a 2020 capacity increase [A01-0008].

### Builder time

- **Builder queues:** 1 by default, maximum 2. The second queue comes from Builder Recruitment (2 days per item, stackable) or permanently from VIP 6. After VIP 6, Builder Recruitment items convert into 60-minute building speedups [A01-0006].
- **Alliance help:** each help fills 1% of the bar. Helps received per job depend on Alliance Center level: 5 at Lv1, 18 at Lv14, 24 at Lv20, 30 at Lv25. Construction, research and healing can be helped; troop training cannot [A10-0006].
- **Queue dashboard** at CH8 (since 1.1.01): one screen to refill construction, training, research, healing and scouting queues [A01-0011]. Relevant to the "minimum minutes per day" goal.

### Resources along the path

- **Bottlenecks by stage:** food and wood dominate early. Stone is needed for most buildings from about CH6 and is the main Wall resource. Gold is not used for buildings, but is needed for Academy tech after Academy 10 and for T3+ troops [A03-0021, A03-0001].

### Research and troops (T3 consensus)

- **Research:** speed and economy first (Writing, Masonry, Engineering, Mathematics) [A02-0500, majoritario]. Then the military path: T3 → T4 for infantry, cavalry and archers, skipping T4 siege. Then the shared combat techs (Combat Tactics, Defensive Formation, Herbal Medicine), one branch, and T5 last [A02-0501, majoritario].
- **T4 for KvK1;** T5 needs CH25 and heavy investment [A08-0500, majoritario]. CH21 unlocks T4 [A01-0001].
- **Choose one troop type for T5** (infantry or cavalry first) [A08-0506].
- **T5 heals cost much more;** keep fighting with T4 without a strong economy [A08-0505].
- **Hospital overflow kills troops.** Keep capacity and healing speedups [A08-0502, unanime].
- **F2P behaviour in fights:** don't lead, stay behind, retreat early, fill rallies [A08-0503]. Run fewer complete marches rather than many weak ones [A08-0504].

### Civilization start

- **Economy-relevant perks** [A14-0001]:
  - China: +5% building speed, +5% AP recovery.
  - Egypt: +1.5% building and research speed.
  - Korea: +3% research.
  - Germany and Britain: +5% training (Germany also +10% AP recovery).
  - Spain: +20% resource production, +10% barbarian EXP.
- **Civilization change:** free at CH10, otherwise 10,000 gems or 2M alliance credits. CH16 unlocks civilization buff switching (1.1.01) [A14-0002, alta].
- **Recommendation:** start as China (majority), with Britain or Spain as alternatives. Consider a later switch (Germany) around KvK [A14-0003].

## Recommendations by profile and stage

| Stage | F2P recommendation | Consensus | Cards |
|---|---|---|---|
| Day 1–7 (CH1→~CH12) | Rush CH prerequisites only. Use Builder Recruitment to keep 2 builders. Put first free gems into VIP toward VIP 6. Pick China unless you have a reason not to. | majoritario | A01-0007, A01-0006, A05-0008, A14-0003 |
| CH10 | Use the free Civilization Change only if switching is planned; otherwise keep it. | — (mechanic) | A14-0002 |
| CH8+ | Use the queue dashboard every login to refill all queues in one screen. | — (mechanic) | A01-0011 |
| CH10–CH17 | Academy: speed/economy techs, then T3. Upgrade Hospital as it falls in the CH chain. | majoritario | A02-0500, A02-0501, A08-0502 |
| CH17–CH21 (pre-KvK) | Target CH21 for T4. Research T4 (not siege) and the shared combat techs. | majoritario | A08-0500, A02-0501 |
| KvK1 | Fight with complete T4 marches; never lead; protect hospital capacity. | majoritario/unanime | A08-0503, A08-0504, A08-0502 |
| Low spender (delta) | Same path. Growth Fund rewards CH progress (see `spending-tiers-baseline.md`). | — | A12-0001 |

## Divergences and uncertainties

- **Derived build-time budget** [A01-0005, baixa, tipo derivado]. Minimum raw builder-days with no buffs: about 70 to CH17, 163 to CH21, 221 to CH22, 631 to CH25. City Hall itself is about one third of that. This is an organizer script over Fandom tables, not a source claim. Real times depend on the buff stack, which is still a gap (L-A01-03).
- **Early unlock levels contested** [A01-0009, contestado]:
  - Academy at CH4 vs CH6.
  - First Quarry at CH4 vs CH6 [A03-0001, A03-0005].
  - Trading Post at CH10 vs CH12 (CH12 probable).

  These are observable on day 1–7 (T0 protocol Q9).
- **CH table variants in T3 guides** (CH10 time and stone, CH16/CH21 capacity, CH22 time) [A01-0010, baixa]. Fandom values are used.
- **Where speedups go** (research vs City Hall vs hoard) is divided [A02-0503, baixa; A11-0501]. No quantitative model yet.
- **Research timing:** one guide says Combat Tactics 10 takes about 100 days for an average player [A02-0504, baixa, fonte_unica].
- **Economy research on a farm vs the main:** divided [A02-0502, baixa].
- **Should F2P ever go T5?** Divided between old and new sources [A08-0501, baixa].
- **Player reports (T4, 2026)** [B01-0700, baixa]:
  - F2P usually reaches T4 "around day 30".
  - Fighting KvK1 at CH21 is workable; CH25 is not expected by KvK1.
  - 10–20M power by KvK1 is "realistic" for F2P/low spenders.

  Treat these as sanity checks, not targets.
- **Lost Kingdom entry needs CH17** (single T3) [B01-0503, baixa, parcialmente_obsoleto on Eve timing].

## Gaps

From the `_lacunas.md` files:
- **L-A01-02 / L-A01-03:** T0 confirmation of the CH table and the real buffed times; building-speed buff stack.
- **L-A01-01:** early unlock levels.
- **L-A02-01:** current tech names and an ordered research path with times.
- **L-A02-02:** speedup allocation model.
- **L-A02-03:** time to T4.
- **L-A08-01 / L-A08-02:** heal vs retrain costs; hospital target for KvK1.
- **L-B01-03:** Lost Kingdom entry requirement.
