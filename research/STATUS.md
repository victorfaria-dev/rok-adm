# Status do projeto (painel do administrador)

Atualizado: 2026-10-13

## Organização (delegação)

```
Victor (direção, ideias, decisões finais)
  └─ Admin geral (Claude): prioridades, integração, revisão, commits, interface com o Victor
       ├─ Sub-admin CONTA      → W1, W2, W6, W7 + verificadores → context packs → Guia F2P → deltas por perfil (perfis.md)
       ├─ Sub-admin REINO      → W4 + verificadores → Guia de administração de reino
       ├─ Sub-admin PRODUTO    → W3, W4 (dores), W5 → ranking de dores → MVP e especificação do megahub
       └─ Sub-admin ENGENHARIA (a partir da onda de especificação) → modelo de dados, arquitetura, protótipo
```

Limitação técnica (descoberta na onda 2): subagentes **não conseguem disparar outros subagentes**. Na prática o sub-admin executa o trabalho ele mesmo e o paralelismo é feito pelo admin geral, disparando vários sub-admins/workers ao mesmo tempo.

Regras: cada sub-admin recebe um objetivo e critérios de aceitação, dispara seus próprios workers, só escreve nas suas pastas e devolve um relatório curto. Só o admin geral faz commit e muda `00-PLANO.md`, `fontes.md` e schemas.

Onda 1 (abaixo) foi disparada diretamente pelo admin geral; a partir da onda 2 os sub-admins assumem.

## Frentes em execução (subagentes)

| # | Frente | Domínios | Saída | Status |
|---|--------|----------|-------|--------|
| W1 | Mecânicas F2P (piloto) | A01, A04, A05, A09, A10, A14 | `raw/A-pilot/`, `facts/A0x/` | **concluída** — 49 fichas; sem minutos por tarefa nem renda diária completa de gemas |
| W2 | Estratégia F2P / início de reino | A02, A06, A07, A08, A11, B01 | `raw/A-strategy/`, `facts/` (IDs ≥0500) | **concluída** — 55 fichas, todas ≤ media; fontes T1/T2 bloqueadas |
| W3 | Dores — jogadores | C03 | `pains/D-0001..0499`, `raw/pains-players/` | **concluída** — 44 dores; ~12,8 mil posts Reddit (arquivo), ~3,5 mil reviews, ~1 mil comentários do fórum oficial |
| W4 | Dores — líderes + administração | B01–B09, C03 | `pains/D-0500..0999`, `facts/B0x/`, `raw/pains-leaders/` | **concluída** — 26 dores (14 validadas), 38 fichas B, 10 fluxos de administração |
| W5 | Concorrência e ToS | C01, C02 | `facts/C01-C02/`, `context/competitors-and-constraints.md` | **concluída** — ~30 ferramentas, ToS lido; 51 fichas não verificadas |
| W6 | Economia, coleta, farms, gasto | A03, A12, A13 | `raw/A-economy/`, `facts/A03,A12,A13/` | **concluída** — 47 fichas; lacunas: taxas de coleta por nível, ouro via Trading Post |
| W7 | Histórico de patches / estado atual | C04 | `facts/C04/`, `context/game-state-and-patch-timeline.md` | **concluída** — 33 fichas; versão atual provável 1.1.12 (confiança baixa) |

## Onda 2 (em execução)

| Frente | Responsável | Escopo |
|--------|-------------|--------|
| Integração + verificação + lacunas + protocolo T0 + context packs de conta | Sub-admin CONTA | A01–A14, B01 — **concluída**: 134/151 verificadas, 4 erros factuais corrigidos, 7 context packs, protocolo T0 |
| Verificação + dores de líderes + context packs de administração de reino | Sub-admin REINO | B02–B09, D-05xx — **concluída**: 214 citações rechecadas (5% corrigidas), 7/38 fichas com erro corrigido, 4 context packs, roteiro de entrevistas |
| Soluções conceituais por dor (hipóteses) | Brainstorm | `brainstorm/solucoes/` — **concluída**: 70 dores cobertas, 34 fichas, matriz + top 10 |

## Onda 3 (em execução)

| Frente | Escopo | Saída |
|--------|--------|-------|
| Guia F2P v1 (EN) em blocos | conta, F2P, início de reino | `guides/` — **concluída**: 43 blocos (37 média, 5 baixa, 1 pendente); lacuna nova: escudos/proteção de iniciante |
| Correção de IDs de fonte e confiança em B02–B09 | dados | **concluída** — 282 fichas, 0 erros, 15 avisos |
| Mapas de processo + árvore de funcionalidades | Sub-admin PRODUTO | `produto/` — **concluída**: 5 áreas, 20 épicos, 59 funcionalidades, MVP + R1–R3 |
| Migração v2 das fichas C01, C02, C04 e B01-0001..0003 | dados | **concluída** — 87 fichas, validador 0 erros (B02–B09 pendentes com o sub-admin REINO) |

## Construção do MVP sem identidade visual (lógica concluída)

Stack: `docs/adr/0001-stack-mvp.md` (TypeScript, monorepo pnpm, Vitest, CI no GitHub Actions).

| Frente | Pacote/pasta | Funcionalidades |
|--------|--------------|-----------------|
| Pipeline de dados + biblioteca de regras e fórmulas | `packages/data` | F-50 v0 — **concluída** (282 fatos, 25 patches, 23 tabelas, 37 testes) |
| Motor de blocos + questionário | `packages/core` | F-51, F-01 — **concluída** (36 testes) |
| Rotina por tempo, reality check, checklist de comandante | `packages/planner` | F-15, F-14, F-20 — **concluída** (39 testes; minutos pendentes de T0) |
| Conteúdo: guia de reino novo, privacidade, kit de divulgação | `guides/data`, `content/` | F-12, F-56, F-57 — **concluída** (14 blocos) |
| Onda H: mais guias em blocos (EN) | `guides/data`, `packages/core` | F-75, F-11, F-29 + F-28, F-13, admin de reino — **concluída**: 61 blocos (3 alta, 48 média, 3 baixa, 7 pendentes), verificação adversarial por guia (115 achados corrigidos/relativizados); registro de guias por perfil no core com 19 testes |

## Identidade visual (concluída)

KingdomOps v1.0: kit do Victor em `design/brand/`; tokens gerados em `design/tokens/` (contraste: 0 falhas em `design/contrast-report.md`); ícones em `design/brand/export/`; guia de estilo `design/styleguide.html`. Skill `logo-design` desativada.

## Frontend (`apps/web`, ADR 0002: Astro estático + ilhas Preact)

| Tela | Status |
|---|---|
| 1. App Shell + Home | **concluída**: abas no celular, trilho no tablet/desktop, tema Dark/Light/System sem flash, chip de perfil, offline (service worker), JS ≤ 5 KB gz por rota; 15 testes unitários + 63 testes Playwright (axe nos dois temas) |
| 2. Questionário (`/start`) | próxima |
| 3. Meu guia + Budget Reality Check (`/guide`) | depois da 2 |

## Lacunas da onda H (guias)

Usadas nos blocos como `PROPOSED-*` (o validador só avisa). Promover a `L-*` no `_lacunas.md` do domínio quando o dono do domínio aceitar.

| ID | Lacuna | Impacto | Método sugerido | Domínio | Guias |
|---|---|---|---|---|---|
| PROPOSED-SHIELDS | Duração, custo, fontes de escudos; proteção de iniciante; o que quebra o escudo | alto | T0 loja/tooltips; notas oficiais | A03/A08 | recuperação, 30 dias, F2P, reino novo |
| PROPOSED-ZEROING-LOSS-SCOPE | O que um zeramento pode levar além de tropas e recursos saqueáveis (prédios, comandantes, pesquisa, equipamento, VIP) | alto | ajuda oficial/FAQ; T0 antes/depois | A08 | recuperação |
| PROPOSED-CH-BY-KINGDOM-DAY | CH típico de um não pagante nos dias 3/7/14/21/30 do reino | alto | diário T0 em conta nova; relatos T4 | A01 | 30 dias |
| PROPOSED-RETURNER-REWARDS | Existe evento/recompensa de retorno? conteúdo, duração, quanto tempo fora | alto | conta parada 30+ dias: prints no primeiro login; fórum oficial | A11 | retornante |
| PROPOSED-CONDUCT-SCORE-RULES | Limites e penalidades do Conduct Score; scanners/bots de print contam? Good Conduct Reward (1.1.10) | alto | texto de regras no jogo (T0); notas/FAQ oficiais | C04/C02 | admin de reino |
| PROPOSED-HALL-OF-HEROES-RETURN | % de recursos de cura e tropas devolvidos pelo Hall of Heroes após o Lost Kingdom | medio | notas 1.0.89/1.0.94; carta de fim de KvK (T0) | A08/B01 | recuperação |
| PROPOSED-TELEPORT | Tipos, custos e limites de teleporte após zeramento | medio | T0 loja/tooltips | A03 | recuperação |
| PROPOSED-SWAP-ACCESS | Retornante em reino pós-Season 2 ainda usa o Legendary Commander Swap? | medio | calendário de evento em reino SoC; notas 1.1.02+ | A06 | retornante |
| PROPOSED-INACTIVE-ACCOUNT-STATE | O que acontece com cidade inativa (escudo, queima, realocação, cargo na aliança) | medio | ajuda no jogo; FAQ oficial | A13/B04 | retornante |
| PROPOSED-RECHARGE-EVENT | Recompensas e frequência do evento de Recharge; passes contam? | medio | T0 print do evento (sem compra) | A12/A11 | Low |
| PROPOSED-DO-CHEST-CONTENTS | Conteúdo dos baús de Daily Objectives (20–100 pontos) após 1.1.09 | medio | T0 dia 1: print da prévia de cada baú | A10/A04/A09 | 30 dias |
| PROPOSED-SUPPLY-DEPOT-CLAIM | O suprimento de 30 dias precisa ser coletado diariamente? dia perdido some? | baixo | T0 tela de coleta/texto do pacote | A12 | Low |

Fatos pedidos pelos autores que não existem em fichas (sem ID ainda): tabela de marcos do Growth Fund por CH (cai em L-A12-02); horas do conselho por fluxo; poderes padrão R1–R5; transferência de reinado e de R5 inativo (L-B05/L-B03-05); quantidade de Vacation Permits (L-B03-03); custo de cura vs. retreino (L-A08-01); ordem de desbloqueio do tutorial (L-A01-04); fichas C04 para 1.0.95 (Eve of the Crusade dentro do Lost Kingdom) e 1.1.11 (mudança de tempos de passe), hoje só na linha do tempo.

Manutenção de fichas apontada (não alterada nesta onda): A13-0005 tem nota dizendo que C04-0014 invalida parte do conselho mas `invalidado_por: null`; B02-0001 (governador que sai da aliança fica no roster, 1.0.91) e B08-0008 (matchmaking usa poder médio e kill points, 1.0.96) têm fatos oficiais só nas `notas`; B05-0004 (Auctioneer Bot sem manutenção desde 2025-01, validade vencida); A12-0004 (tabela VIP por dólar não é citação literal); A11-0502 ("exceto abaixo de VIP 6" ambíguo); A04-0001/A09-0006 (conteúdo dos baús vem de wiki 2020); A03-0014 (Mercador, wiki 2020).

## Bloqueios

- **rok.guide**: fora do ar na origem — o DNS do domínio falha (servidores de nome recusam a consulta, SERVFAIL via dns.google em 2026-10-13). Não é a política de rede (ambiente está em acesso completo). Possível domínio expirado/abandonado → relevante para concorrência (C01). Usar cópias em archive/buscadores quando possível.
- **Reddit, Fandom wiki**: respondem 403 (bloqueio do próprio site a bots) — impacta a coleta de dores. Alternativas: espelhos/buscadores, YouTube, reviews de loja.
- **Site oficial Lilith**: inacessível na W2.

## Próximas ondas (disparadas quando a anterior terminar)

1. **Integração:** consolidar `_sources.md` → `fontes.md`; resolver conflitos de IDs; consolidar índices.
2. **Verificação adversarial:** um verificador por grupo de domínios, cruzando com W7 (obsolescência).
3. **Síntese de dores:** ranking único jogadores + líderes → escolha do MVP do megahub (`brainstorm/`).
4. **Context packs:** `context/` por tema.
5. **Guia F2P v1** (EN) e **guia de administração de reino v1**; depois deltas Low → Medium → High → Whale → Kraken (`perfis.md`).
6. **Mapas de processo + árvore de funcionalidades** (Sub-admin PRODUTO): processo completo de conta e de reino → pontos de apoio do sistema → árvore de funcionalidades. Método: `produto/metodo-arvore-funcionalidades.md`.
7. **Especificação do sistema:** requisitos, modelo de dados, arquitetura.
