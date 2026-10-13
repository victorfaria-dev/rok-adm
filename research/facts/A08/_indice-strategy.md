# Index (strategy collection) — A08 Troops

Collected 2026-10-13 by A-strategy agent. Scope: F2P, new kingdom → first KvK. Status of all cards: `organizado`. Raw notes: `research/raw/A-strategy/`. Sources: `research/raw/A-strategy/_sources.md`.

Schema note: cards add a `publicado_em` field per source (publication date as shown) — not in schemas/fato.md; proposed addition.

Consensus scale used: `unanime` = all sources found agree, none dissent; `majoritario` = most agree, dissent exists or only 2–3 sources; `dividido` = sources split; `minoritario` = single source/opinion not echoed elsewhere. All sources are T3 (no T1/T4 reachable) ⇒ max confidence `media`.

## Cards

| ID | Title | Type | Consensus | Confidence | Conflicts |
|---|---|---|---|---|---|
| [A08-0500](A08-0500.md) | T4 is the troop tier for an F2P first KvK; T5 is a long-term goal | estrategia | majoritario | media | A08-0501 |
| [A08-0501](A08-0501.md) | Should F2P ever go T5? Divided | estrategia | dividido | baixa | A08-0500 |
| [A08-0502](A08-0502.md) | Hospital overflow kills troops; keep capacity and heal-speedups | estrategia | unanime | media | — |
| [A08-0503](A08-0503.md) | F2P combat behavior: never lead, stay behind, retreat early, fill rallies | estrategia | majoritario | media | — |
| [A08-0504](A08-0504.md) | Run fewer, complete marches rather than all march slots | estrategia | majoritario | media | — |
| [A08-0505](A08-0505.md) | T5 heals cost much more; without strong economy fight with T4 | estrategia | majoritario | media | — |
| [A08-0506](A08-0506.md) | Choose one troop type for T5 (infantry or cavalry first) | estrategia | majoritario | media | — |

## Conflicts / disagreements

- A08-0500 ↔ A08-0501: T4 for KvK1 (consensus) vs whether F2P should ever go T5 (SA21 2021 'no' vs 2026 sources 'eventually').

## Gaps

- Quantified cost: heal vs retrain (resources, time) T4/T5.
- Hospital capacity targets for KvK1.
- Community (Reddit) debate on T4 vs T5 for F2P — inaccessible.

## Wave 2 status (2026-10-13)

Migrated to schema v2 and adversarially re-verified — see `facts/_verificacao-wave2.md`; gaps in `_lacunas.md`. Source IDs are now slugs (`fontes.md`). Current status (this table supersedes the type/confidence/status columns above):

| ID | Tipo | Conf. | Status | Invalidado por |
|---|---|---|---|---|
| A08-0500 | estrategia | media | verificado |  |
| A08-0501 | estrategia | baixa | verificado |  |
| A08-0502 | estrategia | media | verificado |  |
| A08-0503 | estrategia | media | verificado |  |
| A08-0504 | estrategia | media | organizado |  |
| A08-0505 | estrategia | media | verificado |  |
| A08-0506 | estrategia | media | verificado |  |

## Onda J (J2, 2026-10-13) — late stages (KvK2, KvK3, SoC)

Raw notes: `research/raw/J2-late-troops-economy/_notas-J2.md`. Status `organizado` (awaiting adversarial verification).

| ID | Title | Type | Consensus | Confidence | Conflicts |
|---|---|---|---|---|---|
| [A08-0600](A08-0600.md) | Fate of severely wounded units by battle context | mecanica | n/a | media | — |
| [A08-0601](A08-0601.md) | Hall of Heroes (official): return at season end, rate by LK tier, healing refund | mecanica | n/a | alta | — |
| [A08-0602](A08-0602.md) | Hall of Heroes returns ~half of dead troops (2022 guide) | mecanica | n/a | baixa | — |
| [A08-0603](A08-0603.md) | Base healing cost per unit (rkg calculator): T4 vs T5 | mecanica | n/a | baixa | A08-0604 |
| [A08-0604](A08-0604.md) | Packsify heal cost for 100k T5/T4 | mecanica | n/a | baixa | A08-0603 |
| [A08-0605](A08-0605.md) | Max base hospital capacity 300,000 (derived) | derivado | n/a | media | — |
| [A08-0606](A08-0606.md) | T4 open field, T5 rallies/garrison/Ark | estrategia | unanime | media | — |
| [A08-0607](A08-0607.md) | Convert to T5 inside MGE/power events | estrategia | majoritario | media | — |
| [A08-0608](A08-0608.md) | Official healing-cost relief levers (SoC) | mecanica | n/a | alta | — |
