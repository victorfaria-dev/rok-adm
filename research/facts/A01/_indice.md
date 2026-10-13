# A01 — City Hall & buildings — index (pilot, organizer: A-pilot agent, 2026-10-13)

## Cards
| ID | Title | Type | Conf. | Status |
|---|---|---|---|---|
| A01-0001 | City Hall CH1→CH25 table (requirements, cost, raw time, troops, unlocks) | mecanica (table) | media | organizado |
| A01-0002 | City Hall upgrade rewards per level (incl. 100/200/500 gems at CH16/21/25, Civ Change at CH10) | mecanica (table) | media | organizado |
| A01-0003 | City Hall level caps every other building | regra | media | organizado |
| A01-0004 | Prerequisite rule per building in the CH chain (table) | mecanica (table) | media | organizado |
| A01-0005 | Minimum building set + total raw build-days to CH10/13/16/17/20/21/22/25 (derived) | mecanica (derived) | baixa | organizado |
| A01-0006 | Builder queue: 1 default, 2nd via Builder Recruitment (2d) or VIP 6 | mecanica | alta | organizado |
| A01-0007 | F2P build priority: CH + prerequisites first | estrategia | media | organizado |
| A01-0008 | Hospital capacity: S04 table outdated (Lv15 29,000 per Fandom + quiz) | mecanica | alta | organizado |
| A01-0009 | Conflicting low-level prerequisites (Academy, Stable, Tavern, Trading Post, Quarry) | mecanica | baixa | contestado |
| A01-0010 | Variant CH values in T3 guides (CH10, CH16, CH21, CH22) | mecanica | baixa | organizado |
| A01-0011 | Queue-management dashboard at CH8 (1.1.01) | mecanica | alta | organizado |

Full per-level costs/times for all 19 buildings: `research/raw/A-pilot/fandom-building-tables.md`.

## Known gaps
- No T0/T1 confirmation of the CH table; Lilith patch notes never publish base building tables. rok.guide (likely best T2) blocked by network policy (CONNECT 502).
- CH23/CH24 "unlocks" are "?" in the wiki; Lv.25 build times missing for Hospital, Academy, Storehouse, Scout Camp, Archery Range, Siege Workshop.
- Building-speed buff stack (research, alliance tech, VIP, civ, holy sites, help %) not consolidated → real (buffed) times unknown; needs A02 + A10-0006.
- Main/side-quest rewards for building upgrades (gems, speedups) not collected.
- Resource totals (food/wood/stone) for the minimum set to each CH target not computed (tables are in raw; easy follow-up).
- Whether first KvK timing allows CH17/CH22 etc. — B01 domain.

## Conflicts
- A01-0001 ↔ A01-0010 (CH10 time/stone, CH16/CH21 capacity, CH22 time).
- A01-0001/A01-0004 ↔ A01-0009 (early unlock levels; Fandom per-building pages vs Fandom CH table vs S04).
- A01-0006 ↔ A05-0005 (2nd builder VIP 6 vs VIP 7).
- Independence issue: riseofkingdomsguides (S04) CH table is a copy of Fandom (shared typo "1,322,48").

## Wave 2 status (2026-10-13)

Migrated to schema v2 and adversarially re-verified — see `facts/_verificacao-wave2.md`; gaps in `_lacunas.md`. Source IDs are now slugs (`fontes.md`). Current status (this table supersedes the type/confidence/status columns above):

| ID | Tipo | Conf. | Status | Invalidado por |
|---|---|---|---|---|
| A01-0001 | mecanica | media | verificado |  |
| A01-0002 | mecanica | media | verificado |  |
| A01-0003 | regra | media | verificado |  |
| A01-0004 | mecanica | media | verificado |  |
| A01-0005 | derivado | baixa | verificado |  |
| A01-0006 | mecanica | alta | verificado |  |
| A01-0007 | estrategia | media | verificado |  |
| A01-0008 | mecanica | alta | verificado |  |
| A01-0009 | mecanica | baixa | contestado |  |
| A01-0010 | mecanica | baixa | verificado |  |
| A01-0011 | mecanica | alta | verificado |  |
