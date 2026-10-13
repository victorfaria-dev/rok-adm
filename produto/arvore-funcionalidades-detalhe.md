---
tipo: detalhe-de-funcionalidades
gerado_em: 2026-10-13
responsavel: Sub-admin PRODUTO
complementa: produto/arvore-funcionalidades.md (visão geral, scores, releases, grafo de dependências, JTBD)
entradas: produto/processos/conta.md, produto/processos/reino.md, produto/apis-integracoes.md, produto/ideias-3d.md, research/context/*, research/pains/_indice-*.md, research/brainstorm/solucoes/*, research/perfis.md, docs/adr/0001-stack-mvp.md, estado do repositório (packages/, guides/, content/, prototipos/)
status: proposta para revisão do Victor
---

# Árvore de funcionalidades: ficha por funcionalidade

Este arquivo tem a especificação curta de **cada uma das 89 funcionalidades** (F-01..F-89). A visão geral (árvore, rastreabilidade, scores, ranking, releases, grafo de dependências e índice de jobs-to-be-done) fica em `produto/arvore-funcionalidades.md`. A tabela de backlog fica em `produto/backlog-sistema.md`.

## Como ler cada ficha

| Campo | O que contém |
|---|---|
| **Status** | `construindo` = existe código ou conteúdo em `packages/`, `guides/` ou `content/` (conferido no repositório em 2026-10-13). `backlog` = especificação suficiente; espera a release. `especificar` = falta um dado (T0, pesquisa, fórmula), uma validação com usuários ou uma decisão antes de especificar. |
| **Aceite** | 2 a 4 critérios testáveis (dado → quando → então). |
| **Métrica** | Como saberemos que funciona depois de lançada. Eventos medidos com PostHog em modo anônimo e com consentimento (`apis-integracoes.md` §2), salvo indicação. |
| **Entradas** | Fatos (IDs de fichas ou packs), medições T0 (`research/protocolos/t0-medicao.md`) e o que o usuário digita. |
| **Integrações** | Serviços e bibliotecas de `produto/apis-integracoes.md` (ou de `produto/ideias-3d.md` para 3D). "—" = nenhuma. |
| **Risco ToS/priv.** | nenhum / baixo / médio / alto, com o motivo. Base: ToS da Lilith (17.1.6, 17.1.7, 17.1.12, 17.1.13, 17.1.15, 17.1.18, §8) e LGPD/GDPR (`research/context/competitors-and-constraints.md`). |

Regra fixa para todas as fichas: nada de automação no jogo, leitura de arquivos ou tráfego do cliente, credenciais, assets da Lilith ou dados de terceiros sem consentimento. Toda divulgação acontece fora do chat do jogo (D-0022).

---

## Área CONTA

### E-C1 Guias e onboarding

#### F-01 ★ Account Setup Questionnaire → Personalized Guide · `construindo`
Lógica pronta em `packages/core/src/questionnaire.ts` (perguntas, código de perfil `1.<gasto>.<função>...`, filtro de blocos); telas aguardam F-52.
- **Aceite:** (a) com no máximo 10 perguntas obrigatórias, o guia gerado só contém blocos cujas tags casam com o perfil (teste com os blocos reais de `guides/data/`); (b) blocos com `recommended_para` do perfil aparecem marcados **Recommended**; (c) o código de perfil reabre o mesmo guia (ida e volta sem perda); (d) gasto acumulado informado gera aviso ou perfil efetivo (F-72).
- **Métrica:** ≥ 60% de quem começa o questionário chega ao guia; ≥ 20% volta ao guia em 7 dias (critério de saída do MVP).
- **Entradas:** `research/perfis.md`; blocos `guides/data/blocks.*.json`; usuário: gasto mensal e acumulado, horas/dia, função, estágio do reino, civ, CH, retornante.
- **Integrações:** PostHog (funil); Satori (imagem OG do link compartilhado, via F-57).
- **Risco ToS/priv.:** nenhum. Respostas ficam no navegador; o link compartilhado leva só o código do perfil, sem dado pessoal.

#### F-02 ★ F2P Base Guide + Spend Deltas · `construindo` (base F2P)
Guia F2P v1 pronto: `guides/data/blocks.f2p.json` (43 blocos) e `guides/f2p-early-kingdom-guide.md`. Deltas por perfil agora são F-75, F-76 e F-77.
- **Aceite:** (a) todo bloco exibe fonte e selo "verified on patch X" vindos de F-50; (b) bloco com confiança `baixa` aparece rotulado como tal; (c) o validador `guides/tools/validate_blocks.py` passa com 0 erros; (d) um perfil Low vê os blocos F2P mais o seu delta, sem duplicação.
- **Métrica:** % de blocos marcados como "útil" vs "errado/desatualizado" (botão por bloco); denúncias de erro corrigidas em ≤ 7 dias.
- **Entradas:** packs `f2p-early-progression`, `daily-routine`, `early-kingdom-timeline-and-events`, `f2p-economy-gems-vip-speedups`, `f2p-commanders-equipment`, `spending-tiers-baseline`; T0 Q1, Q4, Q6, Q16.
- **Integrações:** Claude API (Batch) só no build, para tradução revisada por humano (F-84).
- **Risco ToS/priv.:** baixo. Texto próprio; nomes de comandantes só como menção (uso nominativo); nenhuma arte do jogo (§8).

#### F-11 First 30 Days Path · `backlog`
- **Aceite:** (a) para cada dia 1–30 mostra 3–5 objetivos e 1 conceito (do glossário F-88); (b) objetivos vêm dos blocos com fase `day0-3`..`day15-40`, sem texto duplicado; (c) o usuário marca objetivos feitos e o dia seguinte não muda por causa disso (sem punição).
- **Métrica:** % de usuários novos que completam ≥ 7 dias; queda de perguntas "what next?" desses usuários (pesquisa de 1 pergunta).
- **Entradas:** A01-0001, A05-0008, C04-0005; T0 Q4, Q9; usuário: dia do reino.
- **Integrações:** F-86 (lembrete diário opcional por ICS).
- **Risco ToS/priv.:** nenhum.

#### F-12 New Kingdom Start Guide (+ Day-1 Survival) · `construindo`
Conteúdo em `guides/data/blocks.newkingdom.json` (14 blocos).
- **Aceite:** (a) cobre escolha de reino, aliança, escudo e o que fazer quando jumpers/whales dominam; (b) nenhuma recomendação depende de Beginner's Immigration (removida em 2025-03-26, C04-0026); (c) cada bloco cita ficha e confiança.
- **Métrica:** tempo de leitura ≥ 2 min em ≥ 40% das visitas; taxa de clique para F-01.
- **Entradas:** C04-0026, C04-0033, B01-0506, A09-0007.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-13 Zeroed Recovery Playbook + Risk Checklist · `especificar`
Falta a lacuna de custos e regras de escudo (T0).
- **Aceite:** (a) checklist de saída com ≤ 6 itens cabe em 30 segundos (escudo, hospital, recursos acima da proteção, farm em evento de kill); (b) playbook de recuperação ordena o que reconstruir primeiro e o que "ainda conta"; (c) cobre a farm (CF-07).
- **Métrica:** usuários que abrem o playbook e voltam ao hub em 7 dias (sinal de que não largaram o jogo).
- **Entradas:** A03-0007, A03-0030, A13-0005; T0 custos de escudo.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-14 Budget Reality Check · `construindo`
Dados em `packages/planner/data/budget-inputs.json` e `vip-levels.json`; lógica em andamento em `packages/planner`.
- **Aceite:** (a) para cada perfil de gasto, mostra o que é alcançável até o KvK1 (VIP, CH, comandantes) e o que não é; (b) cada meta mostra a renda usada (gemas/dia por fonte) e a confiança; (c) inclui "o que comprar não muda" para Low (sem link de compra).
- **Métrica:** % de usuários que ajustam a meta após ver o resultado; avaliação "me sinto menos atrás" (pesquisa de 1 pergunta).
- **Entradas:** A04-0001, A04-0006, A12-0001, A12-0002, A05-0001; T0 Q1, Q12, Q16; usuário: perfil, dia do reino.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-87 "What This Game Actually Is" Primer · `backlog` · **nova**
Página para quem chegou por anúncio, com quiz "esse jogo é para você?" (S-D-0021 ideia 2).
- **Aceite:** (a) explica em ≤ 5 min o que o jogo exige de tempo, PvP e gasto, com números do F-14 e do F-15; (b) o quiz (tempo, PvP, gasto) leva ao F-01 com respostas pré-preenchidas; (c) nenhuma frase desestimula ou incentiva gastar.
- **Métrica:** tráfego orgânico de busca para a página; % que segue para o F-01.
- **Entradas:** D-0035, D-0030; packs `daily-routine`, `spending-tiers-baseline`.
- **Integrações:** Satori (OG), PostHog.
- **Risco ToS/priv.:** nenhum.

#### F-88 RoK Glossary & Concept Cards · `backlog` · **nova**
Glossário curto (DKP, KP, T4/T5, MGE, MTG, seed, Lost Kingdom, Trading Post etc.), reutilizado como dica em todo o hub.
- **Aceite:** (a) cada termo tem definição em ≤ 2 frases, a ficha de origem e o patch; (b) qualquer bloco ou calculadora mostra a definição ao tocar no termo; (c) o F-11 tira daqui o "conceito do dia".
- **Métrica:** aberturas de dica por sessão; termos mais buscados sem resultado (vira fila de conteúdo).
- **Entradas:** D-0030, D-0013; CK-02 ("muitos não sabem o que é DKP"); C04-0007, B08-0001, B01-0503.
- **Integrações:** F-84 (tradução).
- **Risco ToS/priv.:** nenhum. Texto próprio, sem copiar o wiki (CC-BY-SA exige atribuição e share-alike).

### E-C2 Rotina diária

#### F-15 Time-Boxed Routine (+ Break Mode) · `construindo`
Dados em `packages/planner/data/routine-tasks.json` e `routine-task-meta.json`.
- **Aceite:** (a) com 15, 30 ou 60 min, a lista ordena tarefas por valor e cabe no tempo; sem minutos do T0, avisa "ordem só por valor"; (b) mostra ≥ 3 itens "safe to skip" com o motivo; (c) Break Mode gera plano de pausa com manutenção semanal mínima; (d) o check diário não tem sequência que se perde.
- **Métrica:** % de sessões com ≥ 80% da lista marcada; retorno D7; tempo de jogo autodeclarado cai (pesquisa de 2 perguntas no dia 14).
- **Entradas:** A10-0001, A10-0002, A05-0003, A09-0006, A04-0001; T0 §3 (minutos por tarefa); usuário: minutos, logins/dia, evento ativo.
- **Integrações:** @date-fns/tz ou Luxon (reset 00:00 UTC em hora local); F-86 (lembrete opcional).
- **Risco ToS/priv.:** nenhum. Checklist manual; nada executa no jogo.

### E-C3 Planejamento da conta

#### F-16 Account Snapshot · `backlog`
- **Aceite:** (a) o usuário preenche CH, pesquisas-chave, tropas, aceleradores, gemas, VIP e idade do reino uma vez, e ≥ 3 ferramentas leem o mesmo dado; (b) "copiar da semana passada" + atualização em < 2 min (teste com 5 usuários); (c) dados ficam só no aparelho, com exportar/importar em JSON.
- **Métrica:** % de usuários com snapshot atualizado nos últimos 14 dias; ferramentas usadas por snapshot.
- **Entradas:** X1 (`_matriz.md`); usuário: estado da conta; F-54 opcional (print próprio).
- **Integrações:** PapaParse (colar em lote); tesseract.js no R2 (via F-54).
- **Risco ToS/priv.:** baixo. Dado próprio, local; se sincronizar (F-53), entra na política do F-56.

#### F-17 Next 3 Actions · `especificar`
Falta o teste offline com 30 posts reais de "what next?" (Arctic Shift, só pesquisa interna).
- **Aceite:** (a) dado um snapshot, devolve 3 ações com o "porquê" e a ficha de origem; (b) marcar uma ação feita recalcula a lista; (c) no teste com 30 posts, ≥ 70% das respostas batem com o consenso dos comentários mais votados.
- **Métrica:** % de ações marcadas como feitas; volta ao F-17 em 7 dias.
- **Entradas:** F-16; A01-0001, A02-0500, A02-0501, A08-0500.
- **Integrações:** Arctic Shift (só validação interna; nunca exibido).
- **Risco ToS/priv.:** nenhum.

#### F-18 Milestone Benchmark · `especificar`
Depende do T0 `kvk1-day0` e Q6.
- **Aceite:** (a) compara o snapshot com marcos por idade do reino e perfil de gasto, com faixa (abaixo / no caminho / acima); (b) cada marco mostra a fonte e a confiança; (c) faixas com confiança baixa aparecem como "estimativa".
- **Métrica:** queda de posts "am I cooked?" entre usuários (pesquisa); uso semanal (CS-03).
- **Entradas:** B01-0700, A01-0005; T0 `kvk1-day0`, Q6; F-16.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-19 Restart vs Continue Decision Tree · `backlog`
- **Aceite:** (a) em ≤ 6 perguntas, diz o que é reversível (troca de civ, Commander Swap, dismantle) e o custo de catch-up; (b) cita a regra vigente com patch; (c) "recomeçar" nunca é a resposta padrão sem motivo explícito.
- **Métrica:** % de usuários que escolhem "continuar" e seguem ativos em 30 dias.
- **Entradas:** A14-0002, C04-0023, C04-0010.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-20 Commander Decision Checklist (+ Shelf-life) · `construindo`
Dados em `packages/planner/data/commander-checklist.json` e `commander-shelf-life.json` (em edição).
- **Aceite:** (a) antes de investir cabeças, o checklist pergunta papel, vida útil na temporada, alternativa grátis e opções de respec; (b) cada comandante citado tem "útil até a temporada X, verificado no patch Y"; (c) a etiqueta de vida útil vence sozinha quando sai patch novo do domínio (F-50).
- **Métrica:** uso antes de eventos de cabeça (pico em MGE/Wheel); denúncias "conselho vencido".
- **Entradas:** A06-0500, A06-0501, A06-0504, A06-0506, A06-0510, C04-0021, C04-0023.
- **Integrações:** —
- **Risco ToS/priv.:** baixo. Nomes de comandantes só em texto; nenhum retrato (§8).

#### F-23 Path-to-T4/T5 Planner · `especificar`
Depende do T0 Q6 (tempos buffados) e Q12.
- **Aceite:** (a) dado CH atual e aceleradores, mostra dias e aceleradores até CH21/T4 e CH25/T5; (b) mostra se fecha antes do KvK1 (F-24); (c) usa tempos com buff e diz quais buffs assumiu.
- **Métrica:** diferença entre o previsto e o CH real informado no snapshot 30 dias depois.
- **Entradas:** A01-0001, A01-0005, A02-0501, A08-0500; T0 Q6, Q12; F-16.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

#### F-62 Progress Tower (3D) · `especificar` · **3D integrada**
Visualização 3D da conta (um andar por faixa de CH) sobre os dados de F-16 e F-18. Origem: `produto/ideias-3d.md`.
- **Aceite:** (a) cada andar mostra o que falta (dados de F-18) e tem versão 2D/texto equivalente; (b) carrega sob demanda, com ≤ 150 KB de JS extra e fallback estático sem WebGL ou com `prefers-reduced-motion`; (c) modelo low-poly próprio, sem arte do jogo.
- **Métrica:** sessões semanais de quem usa a torre vs quem usa só a versão 2D (teste A/B); se não houver diferença, a torre sai.
- **Entradas:** F-16, F-18.
- **Integrações:** React Three Fiber + drei; glTF com Draco/Meshopt (`ideias-3d.md`).
- **Risco ToS/priv.:** baixo. Arte original obrigatória (§8, 17.1.9).

#### F-78 Gold-Head Budget Projection · `especificar` · **nova**
Projeção de cabeças/esculturas até o próximo KvK e quantos comandantes isso maxa (S-D-0008 ideia 2). É um delta concreto por perfil de gasto: a renda de cabeças muda com VIP e com o que se compra.
- **Aceite:** (a) dado VIP, perfil e eventos que o jogador faz, projeta a renda mensal de cabeças por fonte (VIP shop, eventos, MGE); (b) mostra o "orçamento de comandantes" do ano (1–3 slots) e o custo até o nível útil; (c) toda fonte de renda com confiança baixa aparece como faixa, não como número.
- **Métrica:** uso junto do F-20; comparação previsto × real no snapshot 60 dias depois.
- **Entradas:** D-0008, D-0029; A05-0006 (esculturas por VIP), fichas A06; T0 (renda real de cabeças); F-16.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

#### F-79 Day-0 → KvK1 Season Plan · `especificar` · **nova**
Plano de longo prazo, semana a semana, ancorado na data de abertura do reino: metas de CH e VIP, o que guardar para Pelagius (dia 5), MTG, Lohar e Eve of the Crusade, e prontidão para o KvK1 (dia ~100). Cobre a lacuna G7 (planejamento de eventos que para em ~4 dias) sem prometer datas que o jogo não fixa.
- **Aceite:** (a) dada a data de abertura (F-24) e o snapshot (F-16), mostra 14 semanas com metas e reservas; (b) eventos sem data fixa aparecem como "provável a partir do dia N" com a confiança; (c) ao atualizar o snapshot, o plano recalcula e marca semanas atrasadas sem culpa (sugere o corte, não mais tempo de jogo).
- **Métrica:** % de usuários com plano que chegam ao dia ~85 com a reserva-alvo do Eve (autodeclarado); retenção D30.
- **Entradas:** B01-0500, B01-0505, C04-0005, A11-0501, A11-0502, A11-0505, A09-0007; T0 Q4, Q5, Q6; F-16, F-18, F-23, F-25.
- **Integrações:** ICS via `ical-generator` (marcos no calendário do usuário, F-86).
- **Risco ToS/priv.:** nenhum.

### E-C4 Calculadoras

#### F-21 Gem & VIP Value Table (+ Wheel guarantees) · `especificar`
Falta a equivalência gema ↔ acelerador defensável (T0 Q1, Q8, Q14).
- **Aceite:** (a) tabela do valor de cada uso de gema (VIP, aceleradores, chaves) com fonte e patch; (b) calculadora de roda mostra custo total e recompensa garantida antes de girar; (c) lê gemas e VIP do F-16 quando existir.
- **Métrica:** uso nas semanas de MTG e Wheel; % que diz ter mudado onde gasta gemas.
- **Entradas:** A05-0001, A05-0004, A05-0008, A04-0009, A11-0502, C04-0022; `packages/planner/data/vip-levels.json`.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

#### F-22 Healing Cost Calculator · `especificar`
Falta a ficha de custo de cura vs retreino (L-A08-01).
- **Aceite:** (a) dada a capacidade de hospital e o tier, mostra recursos e aceleradores de cura por onda; (b) compara curar vs deixar morrer com a fonte; (c) exporta a meta de recursos para o F-69 (meta das farms).
- **Métrica:** uso no pré-KvK; usuários que ligam a meta ao Farm Hub.
- **Entradas:** A08-0502, A08-0505, A01-0008, C04-0028; L-A08-01.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

### E-C5 Eventos e KvK

#### F-24 Kingdom Clock & Personal Event Calendar · `backlog`
- **Aceite:** (a) a data de abertura do reino é digitada uma vez e todo plano mostra "dias até o KvK1"; (b) fim de evento aparece em hora local, com fuso detectado e editável; (c) "adicionar ao calendário" gera .ics válido (testado em Google, Apple e Outlook).
- **Métrica:** eventos exportados por usuário; janelas perdidas relatadas (pesquisa) vs grupo sem calendário.
- **Entradas:** A11-0512, A11-0502, A10-0005, C04-0005, B01-0500; T0 Q4, Q5; usuário: data de abertura, fuso.
- **Integrações:** @date-fns/tz ou Luxon; `ical-generator` (R1); feed ICS por URL e Web Push no R2 (F-86).
- **Risco ToS/priv.:** nenhum.

#### F-25 Hoard Advisor · `backlog`
- **Aceite:** (a) regras por objetivo dizem o que guardar para Lohar, MTG, Eve e KvK, sem depender de datas; (b) com F-16, mostra "guardado vs alvo" por item; (c) cada regra cita a ficha.
- **Métrica:** % de usuários que atingem o alvo de reserva antes do Eve (autodeclarado).
- **Entradas:** A11-0501, A11-0505, A09-0007, A02-0503; F-16 opcional.
- **Integrações:** F-86 (lembrete).
- **Risco ToS/priv.:** nenhum.

#### F-26 KvK Readiness Checklist (+ Season Explainer) · `backlog`
- **Aceite:** (a) checklist por função e orçamento (CH, tropas, hospital, aceleradores); (b) explicação da temporada em ≤ 1 página, com patch; (c) itens com fonte ausente aparecem como "sem consenso".
- **Métrica:** uso 2–4 semanas antes do KvK; % de itens marcados.
- **Entradas:** A08-0500, A08-0502, B01-0503, C04-0007; T0 Q15.
- **Integrações:** F-88 (termos).
- **Risco ToS/priv.:** nenhum.

#### F-27 Hidden Lotus Planner · `especificar`
Depende do T0 de requisito e prazo do Hidden Lotus (fora do protocolo hoje).
- **Aceite:** (a) plano dia a dia com o ritmo de poder necessário; (b) no dia 2 já diz "no ritmo / fora do ritmo"; (c) avisa quando recomeçar não compensa (liga ao F-19).
- **Métrica:** usuários que completam sem reiniciar (autodeclarado).
- **Entradas:** D-0042, D-0015; T0 Hidden Lotus.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-80 Event Rotation Forecast · `especificar` · **nova**
Previsão de 30–60 dias com probabilidade (S-D-0011 ideia 3), a partir do diário T0 e de calendários registrados por usuários que optarem por compartilhar. Ataca a lacuna G7.
- **Aceite:** (a) cada previsão mostra probabilidade, tamanho da amostra e data do último registro; (b) com < 5 reinos registrados, a previsão não aparece (só "dados insuficientes"); (c) o registro é manual (o usuário digita o evento que vê), nunca lido do jogo.
- **Métrica:** acerto da previsão (Brier score) nos 60 dias seguintes; % de previsões exibidas.
- **Entradas:** A11-0512, A11-0513; diário T0; registros de usuários (opt-in).
- **Integrações:** Supabase (registros agregados, R2+).
- **Risco ToS/priv.:** baixo. Só eventos do próprio reino digitados pelo usuário; nenhum dado de jogador.

### E-C6 Retornantes

#### F-28 What Changed Since… · `backlog`
- **Aceite:** (a) dada a data em que parou, lista mudanças agrupadas por impacto (alto/médio/baixo); (b) cada item cita a nota de patch (T1) com data; (c) a lista vem da mesma linha do tempo do F-50, sem cópia manual.
- **Métrica:** tempo na página; clique para o F-29.
- **Entradas:** `game-state-and-patch-timeline.md` (C04-*).
- **Integrações:** API JSON do fórum Lilith e API da Fandom **só no pipeline editorial** (leitura humana; nunca ao vivo).
- **Risco ToS/priv.:** baixo; médio se o pipeline editorial for automatizado em produção (17.1.7). Decisão: só uso editorial manual.

#### F-29 Returner Mode · `backlog`
- **Aceite:** (a) plano de 14 dias gerado a partir de F-28 + F-16; (b) recomendação ficar/migrar/recomeçar com o motivo e a regra de migração vigente (F-31); (c) o plano usa a rotina com tempo (F-15).
- **Métrica:** retornantes ativos no dia 14 e no dia 30.
- **Entradas:** B06-0003, C04-0008, C04-0023; F-16, F-17, F-28, F-31.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

### E-C7 O reino visto pelo jogador

#### F-30 My Requirements Tracker · `backlog`
- **Aceite:** (a) importa o card de requisitos do F-34 por link/código, ou aceita a regra digitada; (b) o jogador digita (ou lê do próprio print, F-54) KP e mortes e vê % do requisito; (c) explica a fórmula em linguagem simples (F-88).
- **Métrica:** % de usuários que atualizam o tracker em cada estágio do KvK.
- **Entradas:** B08-0001, B08-0002; F-34; usuário: KP, mortes, poder.
- **Integrações:** PapaParse (colar); tesseract.js no R2.
- **Risco ToS/priv.:** nenhum. Só dados do próprio jogador.

#### F-31 Migration Eligibility & Passport Checker · `especificar`
Faltam as notas oficiais 1.1.10–1.1.12 para fechar as regras por patch.
- **Aceite:** (a) dados idade da conta, poder e reino-alvo, devolve "elegível / não elegível + motivo" para o patch vigente; (b) cada regra mostra o patch em que foi verificada; (c) um oficial de migração gera link que abre o checador com os requisitos do reino.
- **Métrica:** uso por oficiais (links gerados); passaportes "desperdiçados" relatados.
- **Entradas:** B06-0001, B06-0002, B06-0003, C04-0008; notas 1.1.10–1.1.12.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

#### F-32 Play It Safe FAQ (+ Account Safety) · `backlog`
- **Aceite:** (a) lista o que causa mute/ban, com a fonte ou "relatado pela comunidade"; (b) diz explicitamente para não colar link de Discord no chat do jogo (D-0022); (c) checklist de segurança da conta (binding, sem compartilhar senha, ToS 17.1.21).
- **Métrica:** visitas vindas de busca; cliques no F-82.
- **Entradas:** C02-0002, C02-0005, C02-0010, C04-0006.
- **Integrações:** —
- **Risco ToS/priv.:** baixo. Escrever do ponto de vista de conformidade, nunca como "como não ser pego".

#### F-82 Support Ticket & Report Builder · `backlog` · **nova**
Monta, no navegador, o texto de um ticket bem formado para o canal oficial: recuperar conta, contestar ban/mute, denunciar bot ou trapaça. O hub não guarda nem envia nada (S-D-0021 ideias 1 e 3; dores D-0017, D-0021, D-0022, D-0023).
- **Aceite:** (a) 3 modelos (recuperação, contestação, denúncia) pedem só os campos que o suporte usa (governor ID, data, prints) e geram texto para copiar; (b) nada é salvo nem enviado pelo hub; (c) aponta só canais oficiais.
- **Métrica:** textos copiados; resposta do suporte relatada (pesquisa opcional).
- **Entradas:** D-0017, D-0021, D-0022, D-0023; C02-0005.
- **Integrações:** —
- **Risco ToS/priv.:** baixo. A denúncia cita outro jogador, mas vai do próprio usuário para a Lilith; o hub não armazena (17.1.13 não se aplica).

### E-C8 Perfil de gasto (deltas Low → Kraken) · **épico novo**

#### F-72 Lifetime Spend Adjustment (perfil efetivo) · `especificar` · **nova**
Transforma o gasto acumulado (já coletado em `packages/core`) em "perfil efetivo" para o filtro de blocos. Atende a limitação de `research/perfis.md` ("uma conta que gastou $10k e hoje é F2P não se comporta como F2P").
- **Aceite:** (a) gasto mensal + acumulado + estado (CH, VIP) definem o perfil efetivo, com regra exibida ao usuário; (b) o usuário pode trocar o perfil efetivo à mão; (c) os limiares ficam em F-50 com fonte "regra de produto", não "fato do jogo".
- **Métrica:** % de perfis efetivos diferentes do declarado; avaliação "o guia combina com minha conta".
- **Entradas:** `research/perfis.md`; conta.md §7 ("ex-gastador hoje F2P"); usuário: gasto mensal e acumulado.
- **Integrações:** —
- **Risco ToS/priv.:** baixo. Gasto é dado sensível para o usuário: fica no aparelho e nunca entra no cartão de perfil sem opt-in.

#### F-73 Pack Value Advisor (valor por dólar, anti-FOMO) · `especificar` · **nova**
Tabela de valor por dólar dos pacotes que importam para Low (Growth Fund ≈ 5.400 gemas/$; gem supply ≈ 1.950 gemas/$; VIP/$ cai em recargas maiores), com "pular" como padrão.
- **Aceite:** (a) mostra gemas/$ e VIP/$ por pacote com fonte, data, região e o aviso de conflito de interesse das fontes; (b) a ordem sugerida segue o sub-perfil (pass-only: Growth Fund cedo, depois gem supply); (c) nenhuma tela tem link ou botão de compra, e o padrão é "não compre se não estiver no seu teto"; (d) preço sem confirmação do T0 Q16 aparece como "não confirmado".
- **Métrica:** % de usuários Low que declaram ter evitado uma compra impulsiva (pesquisa); nunca medir "compras geradas".
- **Entradas:** A12-0001, A12-0002, A12-0004, A12-0005, A05-0004, A04-0001; T0 Q16 (prints da loja, sem comprar).
- **Integrações:** F-81.
- **Risco ToS/priv.:** baixo (ToS): nenhuma venda ou link. Risco ético médio (estimular gasto): tom anti-FOMO obrigatório e revisão do Victor.

#### F-74 Monthly Spend Cap & Purchase Log · `especificar` · **nova**
Teto mensal declarado + registro manual de compras + aviso ao passar do teto (S-D-0010 ideia 3). Liga a D-0026 (dano na vida real) e D-0034 (FOMO).
- **Aceite:** (a) o usuário define o teto e registra compras em ≤ 3 toques; (b) ao passar de 80% e de 100% do teto, aparece aviso neutro; (c) nada sai do aparelho sem conta (F-53) e opt-in.
- **Métrica:** % de meses dentro do teto entre usuários ativos.
- **Entradas:** usuário: teto, compras (valor, moeda, região).
- **Integrações:** —
- **Risco ToS/priv.:** médio (privacidade): dado financeiro pessoal. Local por padrão; criptografado e com exclusão fácil se sincronizar.

#### F-75 Low Delta Guide (pass-only / low pleno) · `backlog` · **nova** (parte do F-02)
Arquivo `blocks.low.json` com o delta Low sobre o F2P. O núcleo já faz o fallback Low → F2P (`packages/core/NOTES.md`).
- **Aceite:** (a) dois sub-perfis, pass-only (~$5–25) e low pleno (~$25–100), cada um só com o que muda; (b) o validador de blocos aceita o arquivo e o F-01 o usa sem código novo; (c) recomendação com confiança baixa (A12-0003/0004) fica rotulada.
- **Métrica:** % de usuários Low; "útil" por bloco do delta.
- **Entradas:** `spending-tiers-baseline.md`; A12-0001, A12-0002, A12-0005, A11-0502; T0 Q16.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-76 Medium Delta Guide · `especificar` · **nova** (parte do F-02)
Sem pesquisa ainda (lacuna declarada em `spending-tiers-baseline.md`).
- **Aceite:** (a) só entra com ≥ 1 context pack Medium de confiança média; (b) delta lista o que deixa de ser gargalo e quais prioridades se invertem; (c) mesmo formato de bloco do F-75.
- **Métrica:** % de usuários Medium; "útil" por bloco.
- **Entradas:** pesquisa Medium (onda futura); D-0031 (achado 7: gastadores também acham os guias enviesados).
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-77 High / Whale / Kraken Delta Guides · `especificar` · **nova** (parte do F-02)
- **Aceite:** (a) só entra com pesquisa própria de cada perfil; (b) foco em T5, armamentos e papel de liderança de luta (hipótese de conta.md §7, a confirmar); (c) mesmo formato de bloco.
- **Métrica:** % de usuários High+; retenção desse grupo.
- **Entradas:** pesquisa High+ (não iniciada).
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

---

## Área FARMS

Guardrail da área: só farms do próprio jogador, operadas à mão. O hub não automatiza coleta nem transporte, não lê o jogo e não incentiva farms para inflar MGE ou poder (ToS 17.1.18, 17.1.15; Conduct Score C04-0006; D-0522).

### E-F1 Guia de farms

#### F-03 ★ Farm Guide (guarda-chuva) · `especificar`
Ideia do Victor (I-03). Agora é entregue por F-65 (variante), F-66 (caminho de montagem), F-67 (transporte) e F-71 (ROI).
- **Aceite:** (a) uma página liga as quatro partes na ordem decidir → montar → enviar → avaliar; (b) cada variante só aparece com o nível de evidência do `farms.md` (tabela "Farm variants"); (c) a hipótese de par alimento+madeira não aparece como recomendação antes do T0 (L-A13-03).
- **Métrica:** % de usuários com farm que usam ≥ 2 das 4 partes.
- **Entradas:** `research/context/farms.md`; T0 Q10, Q13; L-A13-01.
- **Integrações:** —
- **Risco ToS/priv.:** baixo. Farms próprias e manuais; a política oficial sobre farms ainda é lacuna (L-A13-02).

#### F-65 Farm Variant Picker · `especificar` · **nova**
"Preciso de farm? Quantas? De qual tipo?" conforme o gargalo da principal por estágio de CH.
- **Aceite:** (a) dado o CH da principal e minutos/dia, recomenda 0, 1 ou 2 farms (limite de ~2 cidades por reino, A13-0001); (b) variantes exibidas com o nível de evidência: **geral** = suportada (padrão); **recurso único** = fraca, "só para quem tem muito tempo" (A13-0009); **ouro** = contestada, não recomendada para F2P até o T0 confirmar envio e rendimento (A03-0027, A13-0004); **par** = só a hipótese alimento+madeira, oculta até o T0 L-A13-03; (c) mostra o gargalo do estágio (CH1–6 alimento/madeira, CH6–10 + pedra, CH10–21 ouro) com a fonte.
- **Métrica:** % de usuários que seguem a recomendação e continuam com a farm 30 dias depois.
- **Entradas:** A13-0001, A13-0004, A13-0009, A13-0010, A03-0021, A03-0027, A03-0028, A03-0029; T0 Q10, Q13, L-A13-03; usuário: CH da principal, minutos/dia.
- **Integrações:** —
- **Risco ToS/priv.:** baixo (mesmo motivo do F-03).

#### F-66 Farm Setup Path · `backlog` · **nova**
Ordem de montagem da farm: civ, CH11 (3 marchas) → CH17 (4) → CH22 (5), Trading Post ≥ 15, Goldmine no mesmo nível para TP10+, comandante de coleta nível 37 e pesquisas de coleta por recurso.
- **Aceite:** (a) passos em ordem, cada um com a ficha (A13-0002, A13-0003, A03-0023, A03-0024, A03-0017, A03-0028, A03-0029); (b) a civ sugerida segue o recurso foco (Roma alimento, França madeira, Grécia/Bizâncio pedra, Maya ouro, Japão todos +5%); (c) alerta "não suba o Storehouse da farm esperando enviar" (A03-0030); (d) a divergência do desbloqueio do TP (CH10 vs CH12, contestado) aparece como tal.
- **Métrica:** usuários que marcam CH17 e TP15 na farm (autodeclarado, F-68).
- **Entradas:** fichas acima; `packages/data/generated/tables/A03-trading-post.json`.
- **Integrações:** —
- **Risco ToS/priv.:** baixo.

#### F-67 Trading Post Transfer Calculator · `backlog` · **nova**
Quanto chega à principal: taxa por nível (35% no L1 → 21% no L15 → 10% no L24 → 8% no L25), fator de envio (1,27× a 21%, 1,11× a 10%), capacidade por viagem, proteção do armazém e viagens necessárias.
- **Aceite:** (a) dado o nível do TP, a meta líquida e o recurso, devolve o bruto a enviar, o número de viagens e as marchas ocupadas; (b) só o excedente acima da proteção do Storehouse entra no cálculo (A03-0030); (c) capacidades L1–L24 aparecem com a marca "contestado" até o T0 (L-A03-04); ouro com "pendente de T0" (L-A03-03); (d) resultado alimenta o F-69.
- **Métrica:** uso por usuários com farm; erros relatados vs o jogo (botão "não bateu").
- **Entradas:** A03-0024 (alta; tabela pronta em `packages/data/generated/tables/A03-trading-post.json`), A03-0025, A03-0026, A03-0027, A03-0030; usuário: nível do TP, meta, estoque.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum. Calculadora sobre dados digitados.

#### F-71 Farm ROI Calculator · `especificar` · **nova**
"Vale criar mais uma farm?" (S-D-0020 ideia 3): recursos/semana a mais vs minutos/dia a mais.
- **Aceite:** (a) dados minutos disponíveis, farms atuais e TP, mostra o retorno marginal da próxima farm e o ponto de saturação; (b) inclui o custo de montagem (tempo do F-66); (c) sem o rendimento por CH da farm (L-A13-01), mostra só a fórmula com valores do usuário.
- **Métrica:** decisões "não criar" registradas (proteção contra D-0002) e retenção de quem tem farm.
- **Entradas:** L-A13-01 (rendimento/dia e minutos/dia por farm), L-A03-02; F-67.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum.

### E-F2 Farm Hub

#### F-04 ★ Farm Hub (guarda-chuva) · `especificar`
Ideia do Victor (I-04). Entregue por F-68 (metas e checklist), F-69 (livro de envios), F-70 (lembrete de ociosa) e F-89 (declaração ao reino). Falta o teste de 5 usuários × 1 semana.
- **Aceite:** (a) um quadro único mostra cada farm, o que está fazendo e quando precisa do jogador; (b) funciona local (F-52) e sincroniza no R2 (F-53); (c) nenhum botão executa algo no jogo.
- **Métrica:** logins por dia em farms (autodeclarado) cai sem queda do total enviado.
- **Entradas:** A03-0024, A03-0026, A13-0005; F-03.
- **Integrações:** Supabase (sync, R2).
- **Risco ToS/priv.:** baixo.

#### F-68 Farm Daily Targets & One-Tap Checklist · `especificar` · **nova**
- **Aceite:** (a) cadastro de farm (nome, CH, recurso foco, marchas, nível do TP) em < 1 min; (b) 1 toque registra "coletando até HH:MM" e o quadro ordena a próxima farm que precisa de atenção; (c) meta diária por farm (marchas despachadas antes de sair; enviar quando passar da proteção); (d) a rotina do F-15 inclui as farms no orçamento de minutos.
- **Métrica:** teste de 5 usuários × 1 semana: ≥ 3 continuam usando no dia 7 (premissa P1 do S-D-0020).
- **Entradas:** A03-0009, A03-0013, A03-0016, A13-0007; usuário: farms e horários.
- **Integrações:** @date-fns/tz.
- **Risco ToS/priv.:** nenhum. Registro manual.

#### F-69 Farm-to-Main Shipment Ledger · `backlog` · **nova**
- **Aceite:** (a) cada envio registra farm, recurso, bruto e líquido (calculado pelo F-67); (b) total semanal vs meta (ex.: recursos de cura do F-22); (c) exporta CSV e um resumo "minhas farms" que o jogador pode mandar ao reino (liga ao F-89).
- **Métrica:** semanas com ≥ 1 envio registrado por usuário com farm; % que atinge a meta.
- **Entradas:** F-67, F-22; usuário: envios.
- **Integrações:** PapaParse (exportar CSV).
- **Risco ToS/priv.:** nenhum. Dado do próprio jogador.

#### F-70 Idle Farm Reminder · `especificar` · **nova**
- **Aceite:** (a) quando passa o "coletando até" do F-68, chega 1 lembrete por farm por ciclo; (b) horário de silêncio e limite diário configuráveis, desligados = zero lembretes; (c) no R1 só existe a versão ICS (sem servidor); push no R2.
- **Métrica:** teste A/B de 2 semanas (premissa P3 do S-D-0020): coleta registrada com e sem lembrete; taxa de desativação.
- **Entradas:** F-68.
- **Integrações:** Web Push (VAPID, R2; iOS ≥ 16.4 só com o app na Tela de Início); ICS (R1); F-86.
- **Risco ToS/priv.:** nenhum (ToS). Risco de produto: virar "segundo emprego" (D-0002), por isso o limite.

#### F-89 Alt↔Main Self-Declaration · `especificar` · **nova**
O jogador declara as próprias farms ao conselho (CF-10), com prova por código curto (F-55). O conselho usa a declaração para somar alts na principal (W3-1) e para regras de MGE (D-0522).
- **Aceite:** (a) o jogador lista as farms (governor ID e nome) e prova cada uma colocando o código do hub na descrição do perfil e enviando print; (b) o conselho vê só as declarações feitas para o seu reino; (c) o jogador pode retirar a declaração a qualquer momento.
- **Métrica:** % de membros com farm que declaram, em reinos que usam o F-38.
- **Entradas:** B08-0006; D-0522, D-0503; F-55 (T0 do código).
- **Integrações:** Supabase (R2); F-54 (print).
- **Risco ToS/priv.:** baixo. É o próprio dono declarando as próprias contas (consentimento); nada é coletado de terceiros.

---

## Área REINO

### E-R1 Regras e transparência

#### F-33 Kingdom Rules Page & Charter · `backlog`
Teste antes como Google Doc com 3–5 líderes.
- **Aceite:** (a) modelo de carta (liderança, processo de decisão, MGE/DKP, conflitos) gera página pública fora do jogo; (b) cada R5 marca "de acordo" com nome e data; (c) a página tem versão traduzida com aviso "a versão original prevalece" (F-84).
- **Métrica:** reinos com página publicada; visitas de novatos por página.
- **Entradas:** B03-0004, B07-0004, B08-0001; F-50.
- **Integrações:** Satori (OG); Claude API ou Google Translation (R2, F-84).
- **Risco ToS/priv.:** baixo. Texto do reino; nomes de governador só de quem assina.

#### F-34 Requirements Card & Formula Sandbox · `especificar`
Faltam 15–20 fórmulas reais classificadas.
- **Aceite:** (a) o conselho escolhe preset de fórmula (versionado em F-50), testa em contas de exemplo e publica o card; (b) o card vira link/código que o F-30 importa sem servidor; (c) pesos de contribuição não-kill (honra, fortes, guarnição) são opcionais (D-0502).
- **Métrica:** cards publicados; imports no F-30 por card.
- **Entradas:** B08-0001, B08-0002; 15–20 fórmulas reais.
- **Integrações:** PapaParse, SheetJS (CDN oficial).
- **Risco ToS/priv.:** nenhum.

#### F-35 MGE Ledger (+ applications) · `especificar`
Teste em planilha com 3–5 líderes no R1.
- **Aceite:** (a) registro público de quem pegou cada vaga de MGE, por qual regra e quando; (b) membros se inscrevem e veem a fila; (c) registros só são acrescentados (append-only) e correções ficam visíveis.
- **Métrica:** reinos que mantêm o ledger por ≥ 2 MGEs; queixas de "hoarding" no reino (entrevista).
- **Entradas:** B05-0002, B05-0003, B05-0004.
- **Integrações:** Supabase (R2); ICS (agenda das MGEs, F-86); webhooks do Discord (R2).
- **Risco ToS/priv.:** baixo. Nomes de governador publicados com consentimento (opt-out do F-56).

#### F-36 Decision Log & Pact Registry · `backlog`
- **Aceite:** (a) cada decisão (expurgo, exceção, MGE) registra regra, autor, data e evidência; (b) acordo entre alianças só vale com as duas assinaturas verificadas (F-55); (c) direito de resposta vinculado ao registro.
- **Métrica:** decisões registradas por reino/mês; contestações resolvidas.
- **Entradas:** B09-0001, B03-0005.
- **Integrações:** Supabase; F-55.
- **Risco ToS/priv.:** médio. Registra fatos sobre jogadores: exige atestado da liderança, opt-out e moderação (F-56, F-83).

### E-R2 Dados de contribuição

#### F-37 Data Intake · `especificar`
Depende do T0 do ROK Toolkit (L-B08-01) e da decisão do Victor sobre aceitar arquivos de scanners de terceiros (`apis-integracoes.md` §6).
- **Aceite:** (a) upload de CSV/xlsx, mapeamento de colunas uma vez e junção por governor ID; (b) a liderança atesta a origem e o membro pode pedir opt-out; (c) o hub nunca escaneia nem chama scanner.
- **Métrica:** horas de planilha poupadas por evento (entrevista); imports por reino.
- **Entradas:** B08-0003, B08-0004, C01-0017, C01-0021, C02-0007, C02-0016.
- **Integrações:** PapaParse, SheetJS; Google Sheets API com escopo `drive.file` (R2).
- **Risco ToS/priv.:** médio. Dados de terceiros (17.1.13, LGPD/GDPR): atestado, opt-out e retenção curta obrigatórios.

#### F-38 DKP Sheet Doctor · `backlog`
- **Aceite:** (a) deltas por estágio, log de exceções (dia zerado = mortes 0) e fusão alt↔main (F-89) aplicados aos dados importados; (b) alertas para delta negativo e ID ausente antes da publicação; (c) tiers calculados pela fórmula do F-34.
- **Métrica:** erros encontrados antes da publicação por import.
- **Entradas:** B08-0001, B08-0002, B08-0006; F-37, F-34.
- **Integrações:** SheetJS (exportar).
- **Risco ToS/priv.:** médio (mesmo motivo do F-37).

#### F-39 Seed Simulator · `backlog`
- **Aceite:** (a) simula o seed a partir das faixas de poder do top 300; (b) mostra o efeito do Vacation Permit; (c) cita a fórmula oficial com patch.
- **Métrica:** uso no período de SoC.
- **Entradas:** B08-0008, B03-0007.
- **Integrações:** F-81.
- **Risco ToS/priv.:** nenhum (dados agregados digitados).

### E-R3 Fluxo de pessoas

#### F-40 Exit Notice Kit · `backlog`
- **Aceite:** (a) aviso padrão cita a regra publicada, o prazo e a opção de redenção; (b) o membro pode contestar com evidência; (c) critério de Lost Kingdom publicado (sem roster).
- **Métrica:** contestações por expurgo; casos de "UNSAFE"/vingança relatados (entrevista).
- **Entradas:** B06-0005, B03-0005, B02-0002; F-38, F-36.
- **Integrações:** Resend (R2); tradução (F-84).
- **Risco ToS/priv.:** médio. Lista de nomes: só para o reino, com direito de resposta.

#### F-41 Migration Application Pipeline · `backlog`
- **Aceite:** (a) formulário roda o F-31 e os requisitos do reino antes de enviar; (b) prints do candidato só com consentimento e apagados após a decisão; (c) o oficial vê só candidatos viáveis.
- **Métrica:** candidaturas inviáveis filtradas; tempo de triagem.
- **Entradas:** B06-0004, B07-0001; F-31, F-54.
- **Integrações:** Supabase Storage (TTL a confirmar); OCR (F-54).
- **Risco ToS/priv.:** médio. Dados e prints de terceiros com consentimento explícito.

### E-R4 Descoberta e recrutamento

#### F-42 Open Roles Board (+ recruitment post generator) · `backlog`
- **Aceite:** (a) R4 publica vagas por papel (rally, guarnição, retornantes bem-vindos); (b) gera post para Reddit/Discord com imagem; (c) nenhum texto pede link no chat do jogo.
- **Métrica:** posts gerados; candidatos vindos do board.
- **Entradas:** B06-0004, C04-0025.
- **Integrações:** Satori; F-84.
- **Risco ToS/priv.:** baixo.

#### F-43 Kingdom Directory · `backlog`
- **Aceite:** (a) filtro por idioma, estilo, requisitos e "aceita retornantes"; (b) só reinos com página (F-33) e contato verificado (F-55) aparecem; (c) denúncia e moderação ativas (F-83).
- **Métrica:** buscas → contatos; reinos listados com página atualizada em 60 dias.
- **Entradas:** lacuna de mercado (`competitors-and-constraints.md`); F-33.
- **Integrações:** Supabase; F-83.
- **Risco ToS/priv.:** baixo; moderação é custo operacional.

### E-R5 Operação da liderança

#### F-44 Availability & Role Roster · `backlog`
- **Aceite:** (a) membros declaram papel e slots UTC uma vez; (b) visão de cobertura por slot; (c) lembrete 1/4/8 h antes (F-86).
- **Métrica:** eventos montados pelo roster vs Forms.
- **Entradas:** B07-0001, B04-0005.
- **Integrações:** @date-fns/tz; Discord webhooks (R2), bot (R3).
- **Risco ToS/priv.:** baixo (dado voluntário do membro).

#### F-45 Activity Definition & Check-in · `backlog`
- **Aceite:** (a) a aliança publica o que é "ativo"; (b) histórico privado e datado (diferente das Alliance Notes, que são públicas); (c) o membro vê o próprio histórico.
- **Métrica:** kicks contestados por aliança.
- **Entradas:** B04-0002, B08-0005.
- **Integrações:** Supabase.
- **Risco ToS/priv.:** médio (anotações sobre terceiros): o membro vê e contesta.

#### F-46 Leadership Weekly Cockpit · `backlog`
- **Aceite:** (a) uma tela semanal com decisões pendentes, prazos e cobertura por fuso; (b) agrega F-33..F-45 sem redigitar; (c) transferência de função em 1 passo.
- **Métrica:** horas/semana de liderança (entrevista antes/depois).
- **Entradas:** B04-0007, B03-0003.
- **Integrações:** Supabase; Discord webhooks.
- **Risco ToS/priv.:** baixo.

#### F-47 KvK Timeline Template · `backlog` (congelada)
- **Aceite:** (a) só reabre se o calendário oficial de KvK não cobrir portões/passes; (b) ancorada no início do KvK; (c) sem cópia do mapa do jogo.
- **Métrica:** —
- **Entradas:** B02-0005.
- **Integrações:** ICS.
- **Risco ToS/priv.:** nenhum.

#### F-64 KvK Planning Map 2.5D/3D · `especificar` · **3D integrada**
Mapa esquemático **original** para o conselho planejar alvos, rotas e horários **antes** do KvK. Não é coordenação ao vivo (o jogo já tem Army Groups e marcadores; ver árvore §4).
- **Aceite:** (a) mapa de zonas genérico desenhado pelo hub, sem copiar o mapa do jogo; (b) camadas por aliança e horários em UTC/local; (c) versão 2D/lista com a mesma informação; (d) só entra após ≥ 5 entrevistas com líderes confirmando a necessidade.
- **Métrica:** conselhos que usam o mapa em ≥ 2 reuniões de planejamento.
- **Entradas:** D-0516, D-0526, D-0517; W1-7, W2-1; roteiro de entrevistas de REINO.
- **Integrações:** React Three Fiber, ou Deck.gl/MapLibre em 2.5D (`ideias-3d.md`); Supabase.
- **Risco ToS/priv.:** médio. Reproduzir o mapa do jogo seria uso de Lilith Content (§8); o desenho tem de ser próprio e esquemático.

---

## Área IDENTIDADE

### E-I1 Identidade pessoal

#### F-05 ★ Player Profile · `backlog`
- **Aceite:** (a) perfil com nome, governor ID opcional, civ, função, perfil de gasto e aliança; (b) privado por padrão, cada campo com visibilidade própria; (c) liga planner, farms e reino sem redigitar.
- **Métrica:** cliques em "salvar/sincronizar" no R1 (≥ 20% dos recorrentes, árvore §7); perfis ativos no R2.
- **Entradas:** usuário.
- **Integrações:** Supabase Auth; Discord OAuth2 (`identify`); e-mail por Resend.
- **Risco ToS/priv.:** baixo. Perfil criado pelo próprio jogador; nunca a partir de scans (17.1.13).

#### F-10 ★ Shareable Profile Card · `backlog`
- **Aceite:** (a) cartão gerado no navegador, sem login, com civ (inclusive "do coração"), função, idade da conta e marcos; (b) exporta PNG e tem imagem OG para Reddit/Discord; (c) arte 100% original.
- **Métrica:** uso orgânico em ≥ 10 posts em 30 dias (árvore §7).
- **Entradas:** usuário; F-16 opcional.
- **Integrações:** Satori ou canvas no cliente; F-57.
- **Risco ToS/priv.:** baixo. Nada de arte do jogo; o usuário escolhe o que mostrar.

#### F-48 Journey Timeline · `backlog`
- **Aceite:** (a) linha do tempo datada de marcos (CH, KvKs, skins) a partir dos snapshots; (b) compartilhável como imagem; (c) o usuário apaga qualquer marco.
- **Métrica:** timelines compartilhadas.
- **Entradas:** F-16, F-05.
- **Integrações:** Satori.
- **Risco ToS/priv.:** baixo.

#### F-08 ★ In-Game Avatar PNG Export · `especificar`
Depende do T0 de avatar (5 perguntas da I-07).
- **Aceite:** (a) PNG no tamanho, recorte e área segura medidos no T0; (b) arquivo abaixo do limite do jogo; (c) só arte original ou enviada pelo usuário.
- **Métrica:** downloads; prints de avatar em uso enviados pelos usuários.
- **Entradas:** T0 avatar.
- **Integrações:** Sharp (R2) ou canvas no cliente; moderação de imagem (nsfwjs como pré-filtro, SafeSearch ou Rekognition) se houver upload.
- **Risco ToS/priv.:** baixo. A imagem é do usuário; o upload no jogo é feito por ele.

#### F-60 3D Profile Card (raridade v2 por City Hall) · `backlog` · **3D integrada**
Efeito de carta colecionável sobre o F-10. Protótipo em `prototipos/cartao-perfil-3d.html`. **Regra de raridade v2** (decisão do Victor, `ideias-3d.md`): Common CH1–16, Rare CH17–21 (pronto para o KvK1), Epic CH22–24, Legendary CH25 (pronto para SoC). Selo **Verified** com 1 print da Prefeitura; sem print, **Self-reported**. Contas F2P recebem a marca **F2P Achiever**.
- **Aceite:** (a) a raridade depende só do CH informado, nas faixas acima, com teste para os limites 16/17, 21/22, 24/25; (b) no R1 (sem backend) todo cartão sai **Self-reported**; Verified só depois do F-54 e do T0 de OCR; (c) inclinação por mouse/giroscópio feita em CSS 3D (não precisa de WebGL), com versão estática quando `prefers-reduced-motion` estiver ativo; (d) a marca F2P Achiever aparece como autodeclarada.
- **Métrica:** cartões gerados e compartilhados vs F-10 sem efeito (A/B); posts com o cartão.
- **Entradas:** usuário (CH, perfil de gasto); C04 (SoC exige CH25), `early-kingdom-timeline-and-events.md` (KvK1 exige CH17), A13 (farms param em CH22).
- **Integrações:** CSS 3D transforms; Satori para a versão estática; F-54 para Verified (R2).
- **Risco ToS/priv.:** baixo. Arte original. Risco de produto: a raridade mede progresso, não habilidade, e quem gasta chega antes (trade-off aceito pelo Victor; não reforçar D-0001 com textos de "rank").

### E-I2 Identidade de aliança (experimental)

#### F-06 ★ Alliance Page & Leadership Verification · `especificar`
Condicionada à validação da árvore §7 (fake door + T0 do código).
- **Aceite:** (a) R5 reivindica a página com código curto no anúncio da aliança e envia print; (b) membros entram por convite; (c) página nasce com moderação e denúncia (F-83).
- **Métrica:** CTR ≥ 5% no fake door; alianças verificadas ativas em 30 dias.
- **Entradas:** F-05, F-55.
- **Integrações:** Supabase; Discord Linked Roles (R3).
- **Risco ToS/priv.:** baixo. Sem senha; o código tem de passar no filtro do chat (T0).

#### F-07 ★ Alliance-Aligned Avatar · `especificar`
- **Aceite:** (a) borda na cor da aliança, brasão e tag sobre o avatar; (b) respeita a área segura do T0 avatar; (c) só arte original.
- **Métrica:** ≥ 2 de 5 alianças do kit concierge com ≥ 30% dos membros usando (árvore §7).
- **Entradas:** F-05, F-06, F-08.
- **Integrações:** Sharp ou canvas.
- **Risco ToS/priv.:** baixo.

#### F-09 ★ Crest Editor · `especificar`
- **Aceite:** (a) brasão montado com formas, cores e símbolos originais do hub; (b) exporta SVG e PNG; (c) nenhum símbolo parecido com os brasões do jogo (revisão visual).
- **Métrica:** ≥ 2 alianças pedem edição própria no kit concierge.
- **Entradas:** biblioteca de símbolos própria.
- **Integrações:** —
- **Risco ToS/priv.:** baixo (17.1.9: não usar marcas da Lilith).

#### F-49 Verified Official Channels · `especificar`
- **Aceite:** (a) lista de canais oficiais da aliança verificada por código (F-55); (b) o membro confere um link antes de clicar; (c) canal sem verificação aparece como "não verificado".
- **Métrica:** consultas por aliança verificada.
- **Entradas:** S-D-0514; F-55, F-06.
- **Integrações:** Discord Linked Roles (R3).
- **Risco ToS/priv.:** nenhum.

#### F-61 3D Alliance Crest · `especificar` · **3D integrada**
O brasão do F-09 vira escudo 3D com relevo, girável, que exporta PNG no ângulo escolhido (para o F-08). Protótipo em `prototipos/brasao-3d.html`.
- **Aceite:** (a) a geometria sai da extrusão do SVG do F-09; (b) carrega sob demanda com ≤ 150 KB de JS extra e tem PNG estático de fallback; (c) só entra se o kit concierge do F-07/F-09 passar.
- **Métrica:** alianças que exportam o brasão 3D e o usam (print enviado).
- **Entradas:** F-09.
- **Integrações:** Three.js / React Three Fiber (`ideias-3d.md`).
- **Risco ToS/priv.:** baixo (arte original).

---

## Área PLATAFORMA (habilitadores)

### E-P1 Conhecimento versionado

#### F-50 Rules & Formula Library ("verified on patch X") · `construindo` (v0)
v0 em `packages/data` (pipeline, `badge.ts`, `formulas.ts`, `generated/patches.json`).
- **Aceite:** (a) todo número exibido tem fonte, data e patch; (b) build determinístico (teste `determinism.test.ts`); (c) patch novo do domínio marca blocos e fórmulas como "re-verificar"; (d) fórmulas de DKP, migração e seed versionadas.
- **Métrica:** % de números com selo; tempo entre patch e re-verificação.
- **Entradas:** `research/facts/`; notas de patch.
- **Integrações:** API do fórum Lilith e da Fandom só como insumo editorial humano.
- **Risco ToS/priv.:** baixo. Fatos próprios; texto da Fandom não copiado (CC-BY-SA).

#### F-51 Content Block Engine · `construindo`
Em `packages/core/src/blocks.ts`.
- **Aceite:** (a) seleção por perfil, função, estágio, CH, horas e retornante; (b) Low herda F2P até existir `blocks.low.json`; (c) ordem estável (seção → ordem → prioridade → id).
- **Métrica:** blocos reutilizados em ≥ 2 superfícies (guia, rotina, plano).
- **Entradas:** `guides/data/*.json`.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

#### F-81 Calculator Kit (inventário compartilhado + selo de patch) · `especificar` · **nova**
Casca comum a todas as calculadoras: lê o inventário do F-16, mostra o selo do F-50, gera link compartilhável e funciona offline. Ataca as lacunas G2 (calculadoras isoladas e sem versão), G6 (ferramentas frágeis) e G9 (mobile fraco), e a dor D-0032.
- **Aceite:** (a) uma calculadora nova usa o kit sem reescrever entrada de inventário; (b) toda saída mostra o patch dos dados e "re-verificar" quando vencido; (c) valores digitados numa calculadora aparecem nas outras (mesmo F-16); (d) funciona sem rede depois da primeira visita.
- **Métrica:** calculadoras no kit; % de sessões que usam ≥ 2 calculadoras.
- **Entradas:** F-16, F-50.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

### E-P2 Dados e contas

#### F-52 App Shell (PWA, local-first, sem login) · `backlog`
Bloqueado pela identidade visual (`research/STATUS.md`).
- **Aceite:** (a) instalável como PWA e utilizável offline após a primeira visita; (b) estado no aparelho, com exportar/importar; (c) primeira carga ≤ 200 KB de JS no Android de entrada.
- **Métrica:** Core Web Vitals no celular; instalações.
- **Entradas:** —
- **Integrações:** PostHog (anônimo, com consentimento).
- **Risco ToS/priv.:** baixo (cookies e consentimento LGPD/GDPR).

#### F-53 Accounts & Sync · `especificar`
Decisão pendente do Victor: qual módulo puxa o primeiro backend (estado compartilhado do reino vs identidade); stack do backend a rever (ADR 0001).
- **Aceite:** (a) login por Discord e por e-mail; (b) estado do F-16 e do F-04 sincroniza entre aparelhos; (c) RLS por reino/aliança; (d) exclusão de conta completa em 1 passo.
- **Métrica:** % de usuários que criam conta; incidentes de acesso indevido = 0.
- **Entradas:** —
- **Integrações:** Supabase (Postgres, Auth, Storage, RLS); Discord OAuth2; Resend.
- **Risco ToS/priv.:** médio (dados pessoais, LGPD/GDPR); nenhum dado do jogo vem por automação.

#### F-54 Own-Screenshot OCR · `especificar`
Depende do T0 de qualidade de OCR (~30 prints próprios).
- **Aceite:** (a) só telas do próprio usuário (perfil, inventário, comandante); telas com outros jogadores são recusadas; (b) o usuário confirma cada número antes de salvar; (c) a imagem é apagada após a extração.
- **Métrica:** acerto por campo ≥ 95% no T0; correções por upload.
- **Entradas:** prints do usuário.
- **Integrações:** tesseract.js (no aparelho), PaddleOCR (servidor); Cloud Vision ou Claude visão como fallback.
- **Risco ToS/priv.:** baixo. Prints próprios; se usar fallback de terceiro, registrar no F-56.

#### F-55 Verification Code · `especificar`
Depende do T0: código editável no anúncio/perfil sem disparar o filtro anti-"third party".
- **Aceite:** (a) código curto, sem URL, válido por tempo limitado; (b) conferido por print; (c) nunca pede senha.
- **Métrica:** verificações concluídas / iniciadas.
- **Entradas:** T0 do código.
- **Integrações:** F-54; Discord Linked Roles (R3).
- **Risco ToS/priv.:** baixo; se o filtro pegar o código, o jogador pode ser mutado (D-0022), por isso o T0 vem antes.

#### F-85 Accessibility & Performance Budget · `especificar` · **nova**
Requisito transversal das telas, ligado a G9 (mobile fraco), D-0032 (ferramentas ruins), D-0030 (sobrecarga) e aos critérios de `ideias-3d.md`.
- **Aceite:** (a) WCAG 2.2 AA nas telas (contraste, foco, alvos de toque ≥ 44 px, leitor de tela); (b) toda informação em 3D ou gráfico também existe em texto; (c) `prefers-reduced-motion` e economia de bateria desligam animações; (d) orçamento de JS por tela verificado no CI.
- **Métrica:** auditoria automática (axe/Lighthouse) sem erro crítico; tempo de interação no Android de entrada.
- **Entradas:** `ideias-3d.md` (critérios), `apis-integracoes.md` §3.9.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum.

### E-P3 Confiança e distribuição

#### F-56 Trust & Privacy Center · `construindo`
Textos em `content/legal/trust-and-privacy.md` e `fan-content-notice.md`.
- **Aceite:** (a) página "o que o hub faz e nunca faz" (sem bots, senhas ou scans); (b) aviso de não afiliação à Lilith; (c) consentimento, opt-out e exclusão de dados descritos antes de qualquer dado de terceiro (F-37).
- **Métrica:** cliques na página; pedidos de exclusão atendidos em ≤ 30 dias.
- **Entradas:** C02-0002..C02-0011, C02-0018.
- **Integrações:** —
- **Risco ToS/priv.:** nenhum; reduz risco. Revisão jurídica antes de cobrar.

#### F-57 Share & Discovery Kit · `construindo`
Texto em `content/share/share-kit.md`.
- **Aceite:** (a) imagens OG para guia, cartão, página de reino e vagas; (b) páginas indexáveis sem "Rise of Kingdoms"/Lilith no nome ou metadados (17.1.9); (c) nenhum fluxo pede para colar link no chat do jogo.
- **Métrica:** visitas por canal externo (Reddit, Discord, busca, YouTube).
- **Entradas:** C02-0009, C02-0018.
- **Integrações:** Satori; PostHog.
- **Risco ToS/priv.:** baixo (marca: descrição nominativa + aviso).

#### F-63 3D Landing Hero · `backlog` (opcional) · **3D integrada**
"Mesa de guerra" original na página inicial. Valor só de primeira impressão.
- **Aceite:** (a) carrega depois do conteúdo principal (nunca no caminho crítico); (b) imagem estática no lugar quando não houver WebGL, em economia de bateria ou com movimento reduzido; (c) arte e mapa originais.
- **Métrica:** taxa de rejeição e clique para o F-01, com e sem o hero (A/B); se não ganhar, sai.
- **Entradas:** —
- **Integrações:** Spline (protótipo) ou React Three Fiber.
- **Risco ToS/priv.:** baixo (arte original).

#### F-83 Community Safety Baseline · `especificar` · **nova**
Requisito para qualquer superfície social do hub (F-05, F-06, F-36, F-42, F-43): denúncia, moderação de nomes e imagens, sem mensagem direta entre desconhecidos, política de idade. Responde a D-0024 dentro do que é nosso (S-D-0021 ideia 3). O hub não modera o chat do jogo.
- **Aceite:** (a) toda página ou conteúdo de usuário tem "denunciar" com resposta em ≤ 72 h; (b) nomes e imagens passam por filtro antes de publicar; (c) não há DM entre usuários desconhecidos; (d) política de idade mínima e de remoção publicada no F-56.
- **Métrica:** denúncias resolvidas no prazo; conteúdo removido por mil páginas.
- **Entradas:** D-0024; política própria.
- **Integrações:** nsfwjs (pré-filtro no aparelho); Google SafeSearch ou AWS Rekognition (servidor).
- **Risco ToS/priv.:** baixo; reduz risco legal (menores). Moderação é custo operacional.

#### F-84 Multilingual Content & Docs (i18n) · `especificar` · **nova**
Pipeline de tradução: conteúdo próprio traduzido no build com revisão humana; documentos de reino (F-33, F-40, F-42) traduzidos sob demanda com o aviso "a versão original prevalece". Liga a D-0025, D-0527 e ao viés do corpus (comunidades VN, TR, AR, RU e PT-BR grandes e fora da pesquisa).
- **Aceite:** (a) UI e blocos com chaves de tradução; (b) segunda língua escolhida pelos dados de tráfego do MVP; (c) glossário RoK fixo (F-88) usado em toda tradução; (d) tradução automática sempre rotulada.
- **Métrica:** % de visitas em cada idioma; erros de tradução denunciados.
- **Entradas:** D-0025, D-0527; F-88.
- **Integrações:** Claude API (Batch, no build); Google Cloud Translation ou Claude (sob demanda, R2).
- **Risco ToS/priv.:** baixo; texto de reino enviado a terceiro deve constar no F-56.

### E-P4 Canais assistidos

#### F-58 Discord Companion Bot · `backlog`
- **Aceite:** (a) slash commands para consultas (F-50) e lembretes (F-86); (b) roster do F-44 no Discord; (c) sem intent de Message Content.
- **Métrica:** servidores ativos em 30 dias.
- **Entradas:** F-53.
- **Integrações:** Discord bot, slash commands, webhooks.
- **Risco ToS/priv.:** baixo; mercado lotado (Codex Helper, Zoe).

#### F-59 Ask-with-Context Assistant · `especificar`
- **Aceite:** (a) responde com citações das fichas e do snapshot; (b) sem fonte, diz "não sei"; (c) custo por pergunta medido e com teto.
- **Métrica:** respostas marcadas úteis; perguntas sem fonte.
- **Entradas:** F-50 maduro, F-16.
- **Integrações:** Claude API com Citations e cache de prompt; Voyage + pgvector só se a base crescer.
- **Risco ToS/priv.:** baixo; o snapshot enviado ao modelo precisa de consentimento (F-56).

#### F-86 Reminder Service · `especificar` · **nova**
Serviço único de lembretes: ICS gerado no aparelho (R1), feed ICS por URL e Web Push (R2), webhooks do Discord (R2). Ligado a D-0014 (janelas perdidas; caso do Commander Swap que acabou um dia antes) e D-0517.
- **Aceite:** (a) todo lembrete tem horário de silêncio, limite diário e desligar em 1 toque; (b) nenhum lembrete usa culpa ou sequência (D-0026); (c) o .ics funciona em Google, Apple e Outlook; (d) push só depois de gesto do usuário (exigência do iOS 16.4+).
- **Métrica:** lembretes abertos vs desativados; janelas perdidas relatadas.
- **Entradas:** F-24, F-25, F-35, F-44, F-70.
- **Integrações:** `ical-generator`; Web Push (VAPID); Discord webhooks; Resend.
- **Risco ToS/priv.:** baixo (endpoint de push é dado pessoal).
