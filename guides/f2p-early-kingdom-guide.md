# Rise of Kingdoms — Guia F2P para o reino inicial (reino novo → KvK1), v1

*Atualizado em 2026-10-13. Conferido com as notas oficiais de patch até 1.1.09 (notas oficiais em inglês mais recentes); 1.1.12 relatada como ativa (T3). Perfil: **F2P**. Montado automaticamente a partir de `guides/data/blocks.f2p.json` (43 blocos) por `guides/tools/assemble_guide.py`: edite os blocos, não este arquivo.*

## Como ler este guia

- **Todo número e toda recomendação citam fichas de fatos** (p. ex. [A01-0001](../research/facts/A01/A01-0001.md)). As afirmações firmes usam apenas fichas com status `verificado` e confiança `media` ou `alta`.
- **Incerto**: a afirmação se apoia em uma ficha mais fraca, contestada ou parcialmente desatualizada; a nota explica o motivo.
- **Pendente de medição no jogo (T0)**: ninguém mediu ainda; o ID da lacuna aponta para `research/facts/<domínio>/_lacunas.md` e para o diário T0 (`research/protocolos/t0-medicao.md`).
- **Estado do patch**: algumas fichas de mudança de patch (C04) vêm de notas oficiais mas ainda não passaram pela verificação formal; aparecem como estado do patch.
- **Consenso**: *unânime* / *maioria* / *dividido* (as duas visões são mostradas) / *mecânica* (regra do jogo, não opinião).
- **Recomendado** marca a opção padrão para o perfil F2P. As **notas para quem gasta pouco (Low)** indicam onde gastar um pouco muda bastante o conselho (um guia delta completo para o perfil Low virá depois).
- **Custos de tempo**: nenhuma fonte publica minutos por tarefa; eles aguardam o cronômetro do T0 (L-A10-01).
- Os IDs dos blocos (`como-este`) são o que o futuro questionário usa para filtrar o guia.

## Sumário

- [1. Visão geral e expectativas realistas](#1-visão-geral-e-expectativas-realistas)
- [2. Preparação dos dias 0–3: civilização e primeiras escolhas](#2-preparação-dos-dias-03-civilização-e-primeiras-escolhas)
- [3. Plano fase a fase até a KvK1](#3-plano-fase-a-fase-até-a-kvk1)
- [4. Rotina diária por tempo disponível](#4-rotina-diária-por-tempo-disponível)
- [5. Calendário de eventos e preparação](#5-calendário-de-eventos-e-preparação)
- [6. Farms](#6-farms)
- [7. Erros a evitar](#7-erros-a-evitar)
- [8. Se você foi zerado](#8-se-você-foi-zerado)
- [9. Perguntas em aberto e medições pendentes](#9-perguntas-em-aberto-e-medições-pendentes)
- [Apêndice: fontes e confiança](#apêndice-fontes-e-confiança)

## 1. Visão geral e expectativas realistas

### Realidade do orçamento: o que um F2P pode esperar até a KvK1

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P · `ov-budget-reality-check`

**O que é sólido**
- A primeira KvK (Temporada 1) começa por volta do **dia 100 do reino**; a pré-KvK (Véspera da Cruzada) fica em torno dos dias 85–95 [[B01-0500](../research/facts/B01/B01-0500.md)].
- **T4 é o nível de tropa de trabalho de um F2P na KvK1**; T5 exige Prefeitura 25 e muito investimento, e é meta de longo prazo [[A08-0500](../research/facts/A08/A08-0500.md)]. T4 é liberado na **Prefeitura 21** [[A01-0001](../research/facts/A01/A01-0001.md)].
- Sua única renda de gemas *garantida* e recorrente são as **100 gemas/dia** do baú de 100 pontos dos Objetivos Diários [[A04-0001](../research/facts/A04/A04-0001.md)]. Todo o resto (eventos, bárbaros, presentes da aliança) é variável.
- Seu melhor canal gratuito de esculturas, chaves e pontos VIP é **uma aliança com jogadores que gastam** (baús de presente) [[A06-0516](../research/facts/A06/A06-0516.md)].

**Metas realistas (Incerto: relatos de jogadores e limites superiores derivados)**
- Entrar na KvK1 com cerca de **Prefeitura 21–22 e T4**, não Prefeitura 25; 10–20M de poder é "realista" segundo relatos de jogadores de 2026 [[B01-0700](../research/facts/B01/B01-0700.md)].
- **VIP 6** por volta do dia 41 *no máximo*, se toda gema gratuita for para o VIP; **VIP 10** fica muito além da KvK1 só com renda garantida (≈ dia 503 como limite superior) [[A05-0007](../research/facts/A05/A05-0007.md)].

**Onde um F2P compete e onde não**
- Compete: *marcos* do MGE (não o ranking) [[A11-0500](../research/facts/A11/A11-0500.md)]; encher bons ataques em massa (rallies) e lutar com marchas completas [[A08-0503](../research/facts/A08/A08-0503.md)].
- Não compete: rankings abertos de poder e eventos repetidos que exigem gastar gemas [[A11-0511](../research/facts/A11/A11-0511.md)].

**Por quê:** A dor mais comum do F2P é sentir que horas de jogo são apagadas por quem gasta. A maior parte disso vem de se comparar com a meta errada. Reinos novos são os mais difíceis para o F2P no começo: quem gasta domina os primeiros 60–90 dias [[B01-0506](../research/facts/B01/B01-0506.md)]. Um plano centrado em **uma marcha T4 completa por volta do dia 100** é alcançável. Um plano centrado em igualar as baleias (whales) não é, e abandonar a conta por frustração é o pior resultado.

> **Incerto:** As metas vêm de [B01-0700](../research/facts/B01/B01-0700.md) (comentários de jogadores sobre T4, baixa), [A05-0007](../research/facts/A05/A05-0007.md) (derivado, baixa: pressupõe limiares de VIP acumulados, sequência ininterrupta e nenhuma outra fonte de VIP, então as datas reais são mais cedo) e [B01-0506](../research/facts/B01/B01-0506.md) (baixa). [A11-0511](../research/facts/A11/A11-0511.md) é baixa. A renda de gemas do F2P além de 100/dia não foi medida.
>
> **Pendente de medição no jogo (T0):** L-A04-01, L-A05-01, L-B01-02, L-A02-03

> **Nota para quem gasta pouco (Low):** O Fundo de Crescimento (~US$ 15 uma vez, ~81.000 gemas pagas conforme se alcançam os marcos da Prefeitura) e o suprimento de gemas de 30 dias (~US$ 10, ~19.500 gemas) são os dois pacotes que os guias colocam em primeiro e segundo lugar [[A12-0001](../research/facts/A12/A12-0001.md), [A12-0002](../research/facts/A12/A12-0002.md)]. Eles servem principalmente para antecipar as datas de VIP 6 → VIP 10; o plano continua o mesmo [[A12-0005](../research/facts/A12/A12-0005.md)]. Os preços vêm de sites de vendedores; confirme na sua loja (L-A12-01).

### Estado atual do patch: o que os guias antigos erram

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `ov-patch-state`

Escrito com base nas notas oficiais até a **1.1.09 (2026-06-30)**; as versões 1.1.10–1.1.12 são conhecidas apenas por uma fonte de terceiros [[C04-0001](../research/facts/C04/C04-0001.md)].

| Conselho antigo | Hoje | Ficha |
|---|---|---|
| "Use a Imigração de Iniciante / uma conta pulo para recomeçar em um reino novo" | A distribuição parou em **2025-03-26** para personagens novos | [C04-0026](../research/facts/C04/C04-0026.md) |
| "Use os impulsos de recursos de 8h/24h todo dia; compre nas lojas" | **Removidos na 1.1.09**; os bônus de produção do VIP foram aumentados no lugar | [C04-0004](../research/facts/C04/C04-0004.md) |
| "O limite de PA é 1.000; não colete os PA diários perto do limite" | O limite é **1.500**; desde a 1.1.02 a coleta diária pode levar os PA *acima* do limite | [A09-0001](../research/facts/A09/A09-0001.md), [C04-0032](../research/facts/C04/C04-0032.md) |
| "A Roda da Fortuna custa X gemas por giro" | Os giros exigem **Tíquetes de Giro** (oficial nas Temporadas 2/3/SoC; Temporada 1 desde a 1.1.12 segundo T3) | [C04-0022](../research/facts/C04/C04-0022.md) |
| "Pelagius é um comandante épico" | Evento do **Pelagius Lendário** a partir do **dia 5** do reino (1.1.09) | [C04-0005](../research/facts/C04/C04-0005.md) |
| "Os bônus de civilização são tudo ou nada" | A **Prefeitura 16** libera a *troca de bônus* de civilização (1.1.01) | [A14-0002](../research/facts/A14/A14-0002.md) |
| "Bots para bárbaros/coleta têm pouco risco" | Existe **pacificação automática** nativa; scripts perdem **Pontuação de Conduta** (1.1.07) | [A09-0008](../research/facts/A09/A09-0008.md), [C04-0006](../research/facts/C04/C04-0006.md) |
| "Esculturas/armamentos ficam travados para sempre" | Existem Troca de Comandante Lendário, Conversão de Armamento (1.0.90) e desmontagem de equipamento com reembolso total (1.0.96) | [C04-0023](../research/facts/C04/C04-0023.md), [C04-0010](../research/facts/C04/C04-0010.md) |
| "Um reino novo tem 6 províncias iniciais" | **3** desde a 1.0.78 | [C04-0033](../research/facts/C04/C04-0033.md) |

**Por quê:** Conselhos que ignoram essas mudanças desperdiçam recursos escassos (gemas em impulsos que não existem mais, conta de gemas para uma Roda que agora exige tíquetes) ou planejam em torno de opções que acabaram (pular de reino). Cada bloco deste guia indica o patch em que foi conferido.

> **Incerto:** [C04-0001](../research/facts/C04/C04-0001.md) (versão) é de terceiros para a 1.1.10–1.1.12. A parte da Temporada 1 de [C04-0022](../research/facts/C04/C04-0022.md) é apenas T3. [C04-0026](../research/facts/C04/C04-0026.md) se apoia em um correio do jogo citado por jogadores mais wiki/guia (sem post oficial no fórum).
>
> **Estado do patch:** [C04-0001](../research/facts/C04/C04-0001.md), [C04-0004](../research/facts/C04/C04-0004.md), [C04-0005](../research/facts/C04/C04-0005.md), [C04-0006](../research/facts/C04/C04-0006.md), [C04-0010](../research/facts/C04/C04-0010.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0023](../research/facts/C04/C04-0023.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0032](../research/facts/C04/C04-0032.md), [C04-0033](../research/facts/C04/C04-0033.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-B01-04

## 2. Preparação dos dias 0–3: civilização e primeiras escolhas

### Escolha sua civilização (China recomendada)

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P · **Prefeitura:** 1–10 · `d0-civilization`

- **Recomendado (F2P): China** — +5% de velocidade de construção, +5% de recuperação de PA, começa com **Sun Tzu** [[A14-0003](../research/facts/A14/A14-0003.md), [A14-0001](../research/facts/A14/A14-0001.md)]. Consenso: **maioria**.
- Alternativas citadas: **Grã-Bretanha** (Boudica, +5% de treinamento) e **Espanha** (+10% de EXP de bárbaros, +20% de produção de recursos, Pelagius) [[A14-0003](../research/facts/A14/A14-0003.md), [A14-0001](../research/facts/A14/A14-0001.md)].
- Sua **primeira troca de civilização é grátis na Prefeitura 10**; fora isso custa 10.000 gemas ou 2M de créditos individuais da aliança. A troca **não** substitui o comandante inicial que você já tem [[A14-0002](../research/facts/A14/A14-0002.md)].
- A partir da **Prefeitura 16** você pode trocar os *bônus* da civilização (1.1.01) [[A14-0002](../research/facts/A14/A14-0002.md)].
- Perto da KvK, os guias sugerem trocar para a **Alemanha** (treinamento, PA) ou para uma civilização de função [[A14-0003](../research/facts/A14/A14-0003.md)].

**Por quê:** A velocidade de construção é o gargalo de todo o caminho até a Prefeitura 21, e a recuperação de PA alimenta bárbaros e eventos; assim, os dois bônus da China acertam as duas alavancas diárias. Sun Tzu também é o comandante inicial F2P mais seguro [[A06-0501](../research/facts/A06/A06-0501.md)]. Como a troca na Prefeitura 10 é grátis, a escolha inicial só precisa servir da Prefeitura 1 à 10.

> **Incerto:** Nenhuma fonte reavalia a Espanha depois do evento do Pelagius Lendário no dia 5 ([C04-0005](../research/facts/C04/C04-0005.md)); isso pode fortalecer a Espanha (lacuna L-A14-02). O valor de +5% de velocidade de construção ao longo da cadeia de Prefeituras não foi quantificado (L-A14-03). O custo/tempo de espera da troca de bônus na Prefeitura 16 é desconhecido (L-A14-01).
>
> **Estado do patch:** [C04-0005](../research/facts/C04/C04-0005.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A14-01, L-A14-02, L-A14-03

### Começando em um reino novo em 2026

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · **Prefeitura:** 1–10 · `d0-new-kingdom-start`

- **Sem pular de reino:** a Imigração de Iniciante não é mais dada a personagens novos (desde 2025-03-26) [[C04-0026](../research/facts/C04/C04-0026.md)]. O reino em que você começa é, na prática, aquele em que vai crescer até a migração abrir; a imigração na mesma temporada é restrita para reinos novos até o fim da Temporada 1 em alguns continentes (pioneiro) [[C04-0008](../research/facts/C04/C04-0008.md)].
- Um reino novo passa pela **Temporada de Preparação** (Crônicas do Reino) por cerca de 85–100 dias antes da KvK1 [[B01-0500](../research/facts/B01/B01-0500.md)]; desde a 1.0.78 ele abre com **3 províncias iniciais**, não 6 [[C04-0033](../research/facts/C04/C04-0033.md)].
- **Entre em uma aliança ativa com jogadores que gastam nos primeiros dias** (veja o próximo bloco) [[A06-0516](../research/facts/A06/A06-0516.md)].
- Espere que os **primeiros 60–90 dias** definam a hierarquia do reino, com quem gasta bem à frente no início [[B01-0506](../research/facts/B01/B01-0506.md)].

**Por quê:** Os conselhos antigos de "como começar" supõem que dá para testar um reino e pular se ele parecer ruim. Isso acabou; então as decisões da primeira semana que ainda importam são *aliança* e *segurança*, não escolher reino.

> **Incerto:** [B01-0506](../research/facts/B01/B01-0506.md) é baixa (T3). [C04-0026](../research/facts/C04/C04-0026.md) e [C04-0033](../research/facts/C04/C04-0033.md) são fichas de estado de patch (status bruto). O bloqueio de reino novo de [C04-0008](../research/facts/C04/C04-0008.md) é um pioneiro em continentes selecionados. Se um F2P deve mesmo começar em um reino totalmente novo é uma discordância em aberto (sem ficha).
>
> **Estado do patch:** [C04-0008](../research/facts/C04/C04-0008.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0033](../research/facts/C04/C04-0033.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-B01-02

### Entre cedo em uma aliança ativa, com jogadores que gastam

**Confiança:** média · **Consenso:** unânime · **Prioridade:** 5/5 · **Recomendado para:** F2P, Low, Medium · `d0-join-alliance`

- **Recomendado (todos os perfis):** entre em uma aliança ativa com jogadores que gastam o quanto antes [[A06-0516](../research/facts/A06/A06-0516.md)]. Consenso: **unânime**.
- O que ela oferece:
  - **Baús de presente** gerados por quem gasta: esculturas, chaves e pontos VIP [[A06-0516](../research/facts/A06/A06-0516.md), [A05-0004](../research/facts/A05/A05-0004.md)].
  - **Ajudas:** cada ajuda preenche 1% de uma barra de construção/pesquisa/cura; as ajudas por tarefa crescem com o nível do Centro da Aliança (5 no Nv1 até 30 no Nv25) [[A10-0006](../research/facts/A10/A10-0006.md)].
  - **+25% de velocidade de coleta** dentro do território da aliança [[A03-0009](../research/facts/A03/A03-0009.md)].
  - Rallies em fortes (Livros do Pacto, presentes da aliança) quando os fortes forem liberados [[A09-0005](../research/facts/A09/A09-0005.md)].

**Por quê:** Para um F2P, a aliança é a maior fonte de renda gratuita fora do baú diário: o gasto dos outros vira suas esculturas e pontos VIP, e as ajudas deles encurtam todo cronômetro. Uma aliança inativa não dá nada disso.

> **Pendente de medição no jogo (T0):** L-A05-03

### As primeiras gemas vão para o VIP (meta VIP 6); nunca quebre a sequência

**Confiança:** média · **Consenso:** dividido · **Prioridade:** 5/5 · **Recomendado para:** F2P · `d0-first-gems-vip`

- **Colete os pontos VIP diários todos os dias.** A coleta começa em 40 e cresce +20 por dia consecutivo até 200/dia; perder um dia volta para 40 [[A05-0003](../research/facts/A05/A05-0003.md)].
- **Recomendado (F2P): ponha as gemas gratuitas no VIP até o VIP 6** (2º construtor permanente), depois poupe para o VIP 10 [[A05-0008](../research/facts/A05/A05-0008.md), [A04-0009](../research/facts/A04/A04-0009.md)]. As gemas viram pontos VIP na proporção 1:1 [[A05-0004](../research/facts/A05/A05-0004.md)]. Consenso: **maioria**.
- Até o VIP 6, mantenha o segundo construtor trabalhando com itens de **Recrutamento de Construtor** (2 dias cada, acumuláveis) [[A01-0006](../research/facts/A01/A01-0006.md)].
- **Não** termine cronômetros com gemas nem compre PA com gemas [[A04-0009](../research/facts/A04/A04-0009.md), [A04-0008](../research/facts/A04/A04-0008.md)].

**Por quê:** O segundo construtor dobra a capacidade de construção pelo resto da vida da conta, e a construção é o gargalo da KvK1 (Prefeitura 21 para T4). Gemas gastas em conclusões instantâneas somem; gemas gastas em VIP viram bônus permanentes e, no VIP 10, uma escultura lendária por dia [[A05-0006](../research/facts/A05/A05-0006.md)].

**As duas visões (dividido):** Maioria (5 fontes): gemas gratuitas → VIP 6, depois VIP 10 [[A05-0008](../research/facts/A05/A05-0008.md)]. Minoria (AllClash, 2020): chegar ao VIP jogando todo dia e não gastar gemas nisso [[A05-0008](../research/facts/A05/A05-0008.md), [A04-0009](../research/facts/A04/A04-0009.md)]. Este guia segue a maioria.

> **Incerto:** Os limiares de VIP são lidos como totais acumulados (a aritmética de T4 sustenta isso; confirme no dia 1, L-A05-01).
>
> **Pendente de medição no jogo (T0):** L-A05-01, L-A04-01

> **Nota para quem gasta pouco (Low):** Compre o Fundo de Crescimento o mais cedo possível: as ~81.000 gemas dele são liberadas conforme os níveis da Prefeitura são alcançados, então comprar cedo não custa nada [[A12-0001](../research/facts/A12/A12-0001.md)]. Essas gemas seguem o mesmo plano de VIP primeiro.

### Ordem de construção: só a Prefeitura e seus pré-requisitos

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P · **Prefeitura:** 1–25 · `d0-build-order`

- **Recomendado (F2P):** gaste tempo de construtor, recursos e acelerações na **Prefeitura e nos edifícios que ela exige**; mantenha os dois construtores ocupados; adie edifícios que não são pré-requisito (edifícios de recursos extras, Torre de Vigia) [[A01-0007](../research/facts/A01/A01-0007.md)]. Consenso: **maioria**.
- As regras: nenhum edifício pode passar da Prefeitura [[A01-0003](../research/facts/A01/A01-0003.md)]; a Prefeitura N (N≥3) exige **Muralha N−1 mais um edifício rotativo no nível N−1** [[A01-0001](../research/facts/A01/A01-0001.md)]; a Muralha N (N≥5) exige Taverna N, que exige Pedreira N; os edifícios militares exigem seu edifício de recurso; o Entreposto Comercial N exige Mina de Ouro N [[A01-0004](../research/facts/A01/A01-0004.md)].
- Marcos que vale conhecer [[A01-0001](../research/facts/A01/A01-0001.md), [A03-0023](../research/facts/A03/A03-0023.md)]:

| Prefeitura | Libera |
|---|---|
| 5 | 2ª marcha |
| 8 | painel de filas (1.1.01), Nível 2 [[A01-0011](../research/facts/A01/A01-0011.md)] |
| 10 | recompensa de Troca de Civilização grátis [[A01-0002](../research/facts/A01/A01-0002.md)], Liceu |
| 11 | 3ª marcha |
| 16 | Nível 3, Ferreiro |
| 17 | 4ª marcha |
| 21 | **Nível 4** |
| 22 | 5ª marcha |

- Os recursos vêm principalmente da **coleta** no mapa, não dos edifícios da cidade [[A01-0007](../research/facts/A01/A01-0007.md)].

**Por quê:** Todo desbloqueio que importa para a KvK1 (marchas, T3, T4) depende da Prefeitura, e a cadeia de pré-requisitos é longa: o tempo bruto mínimo de construção até a Prefeitura 21 é de cerca de 163 dias de construtor, sem bônus [[A01-0005](../research/facts/A01/A01-0005.md)]. Qualquer edifício fora da cadeia atrasa isso.

> **Incerto:** [A01-0005](../research/facts/A01/A01-0005.md) é uma estimativa derivada do organizador (baixa), útil só para ter a escala; o tempo real depende de bônus e acelerações (L-A01-03). Os níveis de desbloqueio iniciais são contestados ([A01-0009](../research/facts/A01/A01-0009.md)): Academia na Prefeitura 4 ou 6, primeira Pedreira na 4 ou 6, Entreposto Comercial na 10 ou 12 (12 é o mais provável). Depósito e Hospital podem merecer atenção mesmo fora da cadeia (notas de [A01-0007](../research/facts/A01/A01-0007.md)).
>
> **Pendente de medição no jogo (T0):** L-A01-01, L-A01-02, L-A01-03

### Segurança no dia 1: proteja o que você tem

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `d0-day1-survival`

- Mantenha os recursos como **itens de recurso fechados** até precisar deles: itens não podem ser saqueados e não têm limite de armazenamento; gemas não podem ser saqueadas de jeito nenhum [[A03-0007](../research/facts/A03/A03-0007.md)].
- Recursos brutos acima da sua **proteção do Depósito** podem ser saqueados; mantenha pouco estoque exposto, principalmente durante eventos de abates [[A03-0006](../research/facts/A03/A03-0006.md), [A13-0005](../research/facts/A13/A13-0005.md)].
- Mantenha a **capacidade do hospital** à frente do seu exército: tropas feridas além da capacidade morrem [[A08-0502](../research/facts/A08/A08-0502.md)].
- **Nada de scripts de terceiros.** Use a pacificação automática nativa [[A09-0008](../research/facts/A09/A09-0008.md)].

**Por quê:** Jogadores novos são atacados principalmente pelo que está dando sopa. Converter o que você guarda em uma forma que não pode ser saqueada não custa nada e tira a recompensa de quem bate em você.

> **Incerto:** Duração de escudos, proteção de iniciante e seus custos ainda não estão em nenhuma ficha (lacuna proposta PROPOSED-SHIELDS). Os valores de proteção do Depósito abaixo do Nv25 diferem entre as fontes ([A03-0006](../research/facts/A03/A03-0006.md); L-A03-05).
>
> **Pendente de medição no jogo (T0):** L-A03-05, PROPOSED-SHIELDS

### Disciplina de PA desde o dia 1

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `d0-ap-discipline`

- **O limite de PA é 1.500**; PA que regenera acima do limite é desperdiçado, então gaste [[A09-0001](../research/facts/A09/A09-0001.md), [A09-0007](../research/facts/A09/A09-0007.md)].
- Gaste o PA que regenera com **bárbaros** logo no início (EXP de comandante, recursos, tarefas dos Objetivos Diários) [[A09-0007](../research/facts/A09/A09-0007.md)]. Um bárbaro custa 50 PA, menos 2 por golpe consecutivo sem voltar (mínimo 40) [[A09-0002](../research/facts/A09/A09-0002.md)]. Na abertura só existem bárbaros Nv1–6; os níveis maiores são liberados nos dias seguintes [[A09-0004](../research/facts/A09/A09-0004.md)].
- **Guarde poções/itens de PA** para a Provação de Lohar / Treino de Armas e para a Véspera da Cruzada [[A11-0505](../research/facts/A11/A11-0505.md), [A09-0007](../research/facts/A09/A09-0007.md)]. Consenso: **maioria**.
- Colete os **PA diários** todos os dias, mesmo perto do limite (desde a 1.1.02 eles podem passar do limite) [[A09-0006](../research/facts/A09/A09-0006.md), [C04-0032](../research/facts/C04/C04-0032.md)].

**Por quê:** O PA que regenera é grátis e some no limite; os itens de PA ficam guardados. Gastar o fluxo gratuito todo dia e guardar os itens para eventos que pagam mais por PA é o ganho mais barato do jogo.

> **Incerto:** A regeneração base de PA por hora é desconhecida (L-A09-01). O valor da coleta diária é 500 segundo as notas oficiais da 1.0.41 (2020); o valor de 2026 não foi confirmado (L-A09-02).
>
> **Estado do patch:** [C04-0032](../research/facts/C04/C04-0032.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A09-01, L-A09-02, L-A09-05

## 3. Plano fase a fase até a KvK1

### Dias 4–14 (Prefeitura 8 → 12, aproximadamente)

#### Marcos da Prefeitura 8 à 12

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 3/5 · **Recomendado para:** F2P · **Prefeitura:** 8–12 · `d4-ch8-ch12-checkpoints`

- **Prefeitura 8:** painel de filas — reabasteça construção, treinamento, pesquisa, cura e exploração em uma só tela [[A01-0011](../research/facts/A01/A01-0011.md)]. Recompensa: 2× aceleração universal de 8h [[A01-0002](../research/facts/A01/A01-0002.md)].
- **Prefeitura 9:** recompensa de 1× aceleração universal de 24h; 3º hospital [[A01-0002](../research/facts/A01/A01-0002.md), [A01-0008](../research/facts/A01/A01-0008.md)].
- **Prefeitura 10:** **Troca de Civilização grátis** (guarde-a, a menos que planeje trocar) [[A14-0002](../research/facts/A14/A14-0002.md)]; Liceu da Sabedoria (Erudito Incomparável) [[A10-0005](../research/facts/A10/A10-0005.md)]; o ouro entra na economia (necessário para tecnologias da Academia após a Academia 10 e para tropas T3+) [[A03-0021](../research/facts/A03/A03-0021.md)].
- **Prefeitura 11:** 3ª marcha [[A03-0023](../research/facts/A03/A03-0023.md)].
- **Prefeitura 12:** Entreposto Comercial (provável) — veja Incerto.

**Por quê:** Esses são os primeiros níveis em que o jogo entrega grandes acelerações grátis e uma nova renda diária (pool de gemas do Liceu). Conhecê-los ajuda a guardar as acelerações para os cronômetros longos que começam logo depois.

> **Incerto:** Entreposto Comercial na Prefeitura 10 ou 12 é contestado ([A03-0025](../research/facts/A03/A03-0025.md), [A01-0009](../research/facts/A01/A01-0009.md)); 12 é o mais provável. Os tempos brutos de melhoria da Prefeitura vêm do conjunto de dados de desenvolvedor do Fandom (L-A01-02).
>
> **Pendente de medição no jogo (T0):** L-A01-01, L-A03-04

#### Academia: primeiro as tecnologias de economia e velocidade

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · **Prefeitura:** 4–16 · `d4-research-economy`

- **Recomendado (F2P):** pesquise **primeiro as tecnologias de velocidade e economia** — Escrita, Alvenaria, Engenharia, Matemática — antes das militares [[A02-0500](../research/facts/A02/A02-0500.md)]. Consenso: **maioria** (pequena discordância sobre qual das duas primeiras vem antes).
- Mantenha a fila de pesquisa ocupada em todo login [[A10-0002](../research/facts/A10/A10-0002.md)].

**Por quê:** A velocidade de construção e de pesquisa se acumula: cada cronômetro seguinte no caminho da Prefeitura 21 / T4 fica mais curto. Tecnologias militares não servem de nada até as tropas que elas melhoram serem liberadas.

> **Incerto:** Os nomes das tecnologias podem ter mudado desde as fontes de 2019–2026; ainda não existe um caminho de pesquisa ordenado com tempos (L-A02-01). A Academia é liberada na Prefeitura 4 ou 6 (contestado, [A01-0009](../research/facts/A01/A01-0009.md)). [A10-0002](../research/facts/A10/A10-0002.md) é uma única lista de verificação comercial (baixa).
>
> **Pendente de medição no jogo (T0):** L-A02-01, L-A01-01

#### Comandantes iniciais: Sun Tzu + um fazendeiro de bárbaros

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · `d4-early-commanders`

- **Concentre:** termine uma marcha completa antes de começar as outras [[A06-0500](../research/facts/A06/A06-0500.md)]. Consenso: **unânime**.
- **Recomendado (F2P): Sun Tzu** como seu principal inicial — épico, não precisa de esculturas douradas e ainda é usado na KvK1 [[A06-0501](../research/facts/A06/A06-0501.md)]. Consenso: **maioria**.
- Evolua **apenas um** entre Boudica ou Lohar para bárbaros/PvE, e nunca coloque esculturas universais (douradas) neles [[A06-0505](../research/facts/A06/A06-0505.md)]. Consenso: **maioria**.
- Evolua cedo um **comandante de coleta**: só os talentos do principal valem; o nível 37 libera Ferramentas Superiores (~25% de velocidade de coleta) [[A03-0017](../research/facts/A03/A03-0017.md)].

**Por quê:** Esculturas são o recurso mais escasso do F2P e os níveis de habilidade pesam no começo, então um comandante terminado vale mais que três pela metade. Comandantes épicos sobem com esculturas épicas baratas (3 por dia vindas do baú diário [[A04-0001](../research/facts/A04/A04-0001.md)]).

> **Incerto:** O valor de longo prazo do Sun Tzu é disputado: uma tier list de 2026 dá F/C para quase todos os épicos no geral ([A06-0509](../research/facts/A06/A06-0509.md), dividido; é uma discordância de horizonte). "Coletor até o 37 primeiro, Centurião é o mais fácil" é de [A06-0506](../research/facts/A06/A06-0506.md) (baixa). Um post de apresentação do Sun Tzu apareceu no fórum oficial em 2026-02-04 (pacote de estado do jogo); não foi conferido se o Sun Tzu épico mudou.
>
> **Pendente de medição no jogo (T0):** L-A06-01, L-A06-03

#### Evento do Pelagius Lendário (dia 5): decida antes de gastar

**Confiança:** baixa · **Consenso:** dividido · **Prioridade:** 3/5 · **Recomendado para:** F2P · `d4-pelagius-day5`

- Desde a 1.1.09 há um evento de melhoria do **Pelagius Lendário** a partir do **dia 5 do reino** [[C04-0005](../research/facts/C04/C04-0005.md)].
- As opiniões estão **divididas**: "monstro de servidor novo" contra tier B na KvK1 [[A06-0508](../research/facts/A06/A06-0508.md)].
- **Recomendado (F2P):** trate como uma decisão, não como compra automática. Aplique a Lista de Decisão de Comandante (bloco dos dias 15–40) antes de gastar qualquer coisa escassa nele.

**Por quê:** É o primeiro lendário oferecido a todo reino novo, então vai disputar os mesmos recursos escassos que o seu lendário de longo prazo. Não há hoje uma análise de custo/benefício para F2P sobre ele.

**As duas visões (dividido):** "Monstro de servidor novo" (AllClash) contra tier B na KvK1 (LootBar) [[A06-0508](../research/facts/A06/A06-0508.md)].

> **Incerto:** [A06-0508](../research/facts/A06/A06-0508.md) é baixa/dividida. Os custos e recompensas do evento não foram registrados (captura de tela no dia 5, protocolo T0).
>
> **Estado do patch:** [C04-0005](../research/facts/C04/C04-0005.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A06-02, L-A14-02

#### Coleta que não precisa de babá

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 3/5 · **Recomendado para:** F2P, Low · `d4-gathering-setup`

- Colete **dentro do território da aliança** (+25% de velocidade) [[A03-0009](../research/facts/A03/A03-0009.md)].
- Online, use nós próximos; **antes de sair, envie marchas para nós grandes** para que não voltem cedo. O nível do nó muda a quantidade, não a velocidade [[A03-0016](../research/facts/A03/A03-0016.md)].
- Itens de **Coleta Aprimorada** (+50% por 8h/24h) ainda existem e podem ser comprados com recursos no Mercador Misterioso [[A03-0013](../research/facts/A03/A03-0013.md)]. Os itens de impulso de *produção* foram removidos na 1.1.09 [[C04-0004](../research/facts/C04/C04-0004.md)].
- A quantidade de marchas cresce com a Prefeitura: 2 na Prefeitura 5, 3 na 11, 4 na 17, 5 na 22 [[A03-0023](../research/facts/A03/A03-0023.md)].

**Por quê:** Os recursos do caminho da Prefeitura vêm da coleta [[A01-0007](../research/facts/A01/A01-0007.md)]. Marchas longas enviadas ao sair transformam horas offline em recursos sem nenhum minuto extra, que é o núcleo de uma rotina de pouco tempo.

> **Estado do patch:** [C04-0004](../research/facts/C04/C04-0004.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A03-01, L-A03-02

### Dias 15–40 (Prefeitura 12 → 17, VIP 6, aproximadamente)

#### Prefeitura 10 → 17: T3, Ferreiro, 4ª marcha

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 4/5 · **Recomendado para:** F2P · **Prefeitura:** 10–17 · `d15-ch10-ch17`

- **Prefeitura 16:** tropas de Nível 3 e o Ferreiro; recompensa de **aceleração universal de 7 dias + 100 gemas**; troca de bônus de civilização [[A01-0001](../research/facts/A01/A01-0001.md), [A01-0002](../research/facts/A01/A01-0002.md), [A14-0002](../research/facts/A14/A14-0002.md)].
- **Prefeitura 17:** 4ª marcha [[A03-0023](../research/facts/A03/A03-0023.md)].
- Tempos brutos (sem bônus) de melhoria da Prefeitura: Prefeitura 10 22h, 16 4d, 17 4d 20h [[A01-0001](../research/facts/A01/A01-0001.md)]. O conjunto de pré-requisitos cresce muito mais rápido que a própria Prefeitura [[A01-0005](../research/facts/A01/A01-0005.md)].
- A pressão sobre os recursos muda: a **pedra** entra por volta da Prefeitura 6 (cadeia da Muralha), o **ouro** a partir da 10 para pesquisa e tropas T3+ [[A03-0021](../research/facts/A03/A03-0021.md)].

**Por quê:** As Prefeituras 16–17 são onde o plano deixa de ser barato: cada nível exige vários pré-requisitos de vários dias, e o ouro começa a pesar. Acumular ouro coletando antes da Prefeitura 16 evita travas.

> **Incerto:** [A01-0005](../research/facts/A01/A01-0005.md) (derivado, baixa): cerca de 70 dias brutos de construtor até a Prefeitura 17, antes de bônus. Os tempos reais dependem do quadro de bônus do T0 (L-A01-03). O requisito de Prefeitura 17 para entrar no Reino Perdido tem fonte única ([B01-0503](../research/facts/B01/B01-0503.md), veja pré-KvK).
>
> **Pendente de medição no jogo (T0):** L-A01-02, L-A01-03

#### Pesquisa: T3 → T4 (sem cerco) → tecnologias de combate compartilhadas

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · **Prefeitura:** 10–21 · `d15-research-military`

- **Recomendado (F2P):** depois das tecnologias de economia, libere o **T3**, depois o **T4 de infantaria, cavalaria e arqueiros (pule o T4 de cerco)**, depois as tecnologias de combate compartilhadas (Táticas de Combate, Formação Defensiva, Medicina Herbal), depois um ramo de tropa; T5 por último [[A02-0501](../research/facts/A02/A02-0501.md)]. Consenso: **maioria**.
- Escolha **um tipo de tropa** que combine com seus melhores comandantes; infantaria ou cavalaria são preferíveis para o primeiro T5 [[A08-0506](../research/facts/A08/A08-0506.md)].

**Por quê:** A pesquisa de T4 precisa estar pronta quando a Prefeitura 21 chegar, senão a corrida até a Prefeitura 21 é desperdiçada. O T4 de cerco agrega pouco a um F2P de campo, e dividir a pesquisa entre tipos de tropa atrasa todos os ramos.

> **Incerto:** A pesquisa é lenta: um guia diz que Táticas de Combate 10 leva cerca de 100 dias para um jogador médio ([A02-0504](../research/facts/A02/A02-0504.md), fonte única, baixa). O tempo até o T4 não foi medido (L-A02-03).
>
> **Pendente de medição no jogo (T0):** L-A02-01, L-A02-03

#### Marco do VIP 6 e depois mudar para poupar

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · `d15-vip6-milestone`

- No **VIP 6** (11.500 pontos VIP acumulados) o 2º construtor se torna permanente; os itens de Recrutamento de Construtor passam a converter em acelerações de construção de 60 minutos [[A05-0001](../research/facts/A05/A05-0001.md), [A01-0006](../research/facts/A01/A01-0006.md)].
- **Depois do VIP 6**, pare de comprar VIP diretamente e **poupe gemas para o Mais que Gemas** (veja Eventos) [[A11-0502](../research/facts/A11/A11-0502.md), [A11-0504](../research/facts/A11/A11-0504.md)]. Próxima meta: **VIP 10** (150.000 acumulados), que adiciona 1 escultura lendária por dia [[A05-0001](../research/facts/A05/A05-0001.md), [A05-0006](../research/facts/A05/A05-0006.md)].

**Por quê:** Abaixo do VIP 6, o construtor vale mais que qualquer bônus de evento. Acima dele, as mesmas gemas compram VIP *e* as recompensas de marcos do evento, se gastas durante o Mais que Gemas.

> **Incerto:** Cronograma F2P derivado ([A05-0007](../research/facts/A05/A05-0007.md), baixa): VIP 6 por volta do dia 41 com 100 gemas/dia + coleta diária; mais cedo com presentes da aliança e gemas de eventos. A leitura acumulada dos limiares aguarda o T0 (L-A05-01).
>
> **Pendente de medição no jogo (T0):** L-A05-01, L-A04-01, L-A12-02

> **Nota para quem gasta pouco (Low):** O suprimento de gemas de 30 dias (~650 gemas/dia contra as 100/dia do F2P) antecipa os marcos de VIP de quem gasta pouco [[A12-0002](../research/facts/A12/A12-0002.md), [A04-0001](../research/facts/A04/A04-0001.md)]; nenhuma ficha dá uma data para o VIP 10 (L-A12-02).

#### Lista de Decisão de Comandante (antes de gastar esculturas douradas)

**Confiança:** média · **Consenso:** dividido · **Prioridade:** 4/5 · **Recomendado para:** F2P · `d15-commander-checklist`

**Regra:** guarde as esculturas universais (douradas) para **um lendário de longo prazo**; nunca as gaste em coletores ou escolhas temporárias [[A06-0510](../research/facts/A06/A06-0510.md)]. Consenso: **maioria**. Yi Seong-Gye (YSG) é o alvo mais citado [[A06-0502](../research/facts/A06/A06-0502.md)].

**Antes de gastar, responda:**
1. **É do seu tipo de tropa?** Você deve estar pesquisando um tipo só [[A08-0506](../research/facts/A08/A08-0506.md)].
2. **Completa uma marcha?** Comandantes soltos dão pouco valor [[A06-0500](../research/facts/A06/A06-0500.md)].
3. **Ainda vai importar depois da KvK1?** Lendários de nível médio (Richard I, Charles Martel, Cao Cao) são fortes na KvK1 mas perdem valor depois — opinião dividida [[A06-0503](../research/facts/A06/A06-0503.md)].
4. **Vem uma opção com momento melhor?** O YSG é relatado na Roda da Fortuna por volta do dia 94 [[A06-0502](../research/facts/A06/A06-0502.md)]; a Roda exige Tíquetes de Giro da Temporada 2 em diante [[C04-0022](../research/facts/C04/C04-0022.md)].
5. **É um lendário gratuito que você pode evoluir no lugar?** Aethelflaed vem da loja da Expedição (1.500 medalhas por escultura) [[A06-0504](../research/facts/A06/A06-0504.md), [A10-0004](../research/facts/A10/A10-0004.md)].

Veredito: **invista** (sim para 1, 2, 3), **espere** (não para 4), **evite** (não para 1 ou 3).

Nota de validade: desde 2025 existem ferramentas de reescolha (Troca de Comandante Lendário, por volta do fim da Temporada 2) [[C04-0023](../research/facts/C04/C04-0023.md)]; assim, uma escolha errada custa caro, mas já não é permanente.

**Por quê:** As esculturas douradas chegam muito devagar para um F2P (o VIP 10 está longe), e o arrependimento com comandantes é uma das dores mais comuns do F2P. Uma lista fixa transforma uma discussão de tier list em cinco perguntas de sim/não que você mesmo pode responder.

**As duas visões (dividido):** Momento do YSG: consenso de alvo de longo prazo, mas alguns jogadores de 2026 dizem que um F2P puro deve pular o YSG na KvK1 (quem gasta pouco pode) [[A06-0502](../research/facts/A06/A06-0502.md)]. Lendários de nível médio: dividido [[A06-0503](../research/facts/A06/A06-0503.md)].

> **Incerto:** [A06-0503](../research/facts/A06/A06-0503.md) é baixa/dividida. A lista é uma construção do guia (S-D-0008) feita sobre essas fichas, não um consenso das fontes. O momento do YSG na Roda (dia ~94) é T3 único. A renda semanal de esculturas não foi medida (L-A06-03).
>
> **Estado do patch:** [C04-0022](../research/facts/C04/C04-0022.md), [C04-0023](../research/facts/C04/C04-0023.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A06-01, L-A06-02, L-A06-03, L-A11-03

> **Nota para quem gasta pouco (Low):** Quem gasta pouco pode mirar de forma realista o YSG para a KvK1 [[A06-0502](../research/facts/A06/A06-0502.md)]; o resto da lista não muda.

#### Medalhas da Expedição → Aethelflaed

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 3/5 · **Recomendado para:** F2P · `d15-expedition-aethelflaed`

- Colete o baú diário da Expedição das missões de 3 estrelas e use a renovação diária grátis da Loja de Medalhas [[A10-0004](../research/facts/A10/A10-0004.md)].
- **Recomendado (F2P):** gaste as medalhas na **Aethelflaed**, o principal lendário gratuito (1.500 medalhas por escultura lendária) [[A06-0504](../research/facts/A06/A06-0504.md), [A10-0004](../research/facts/A10/A10-0004.md)]. Consenso: **maioria**.
- Sun Tzu + Aethelflaed é a dupla F2P de KvK1 mais citada [[A06-0501](../research/facts/A06/A06-0501.md)].

**Por quê:** Aethelflaed é o único lendário que um F2P pode evoluir sem esculturas douradas nem gastos, e as medalhas se acumulam com uma coleta diária rápida.

> **Incerto:** A renda diária de medalhas é desconhecida (L-A10-04).
>
> **Pendente de medição no jogo (T0):** L-A10-04

#### Equipamento: conjuntos baratos agora, épico para a KvK1

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 2/5 · **Recomendado para:** F2P · **Prefeitura:** 16–25 · `d15-equipment`

- **Recomendado (F2P):** forje peças baratas verdes/azuis (Windswept, Vanguard) cedo e passe todos os comandantes principais para **épico** antes de forjar qualquer lendário [[A07-0500](../research/facts/A07/A07-0500.md)]. Consenso: **maioria**.
- O Ferreiro é liberado na Prefeitura 16 [[A01-0001](../research/facts/A01/A01-0001.md)].

**Por quê:** As peças iniciais são substituídas rápido; o épico é a base realista da KvK1. Uma peça lendária acrescenta pouco sobre o épico por peça (uma fonte) e gasta materiais que você vai querer depois.

> **Incerto:** Acumular materiais lendários ([A07-0501](../research/facts/A07/A07-0501.md), organizado, baixa) e "lendário sobre épico acrescenta ~2% por peça" ([A07-0504](../research/facts/A07/A07-0504.md), fonte única, baixa) são incertos. Desde a 1.0.96, desmontar equipamento de talento especial devolve 100% da forja ([C04-0010](../research/facts/C04/C04-0010.md)).
>
> **Estado do patch:** [C04-0010](../research/facts/C04/C04-0010.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A07-01

### Dias 41–90 (Prefeitura 17 → 21/22, T4)

#### Prefeitura 21 para o T4: a principal meta pré-KvK

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P · **Prefeitura:** 17–22 · `d41-ch21-t4`

- **Recomendado (F2P): mire a Prefeitura 21** — ela libera o **Nível 4**, o nível de trabalho da KvK1 [[A01-0001](../research/facts/A01/A01-0001.md), [A08-0500](../research/facts/A08/A08-0500.md)]. Recompensa: aceleração universal de 7 dias + 200 gemas [[A01-0002](../research/facts/A01/A01-0002.md)].
- A Prefeitura 22 traz a 5ª marcha [[A03-0023](../research/facts/A03/A03-0023.md)]; a Prefeitura 25 **não** é esperada na KvK1 para um F2P [[B01-0700](../research/facts/B01/B01-0700.md)].
- Tempos brutos da Prefeitura: 21 11d, 22 17d 3h [[A01-0001](../research/facts/A01/A01-0001.md)].

**Por quê:** O T4 é a diferença entre encher rallies com utilidade e ser bucha de canhão. Tudo o que vem antes neste guia (dois construtores, tecnologias de economia, acelerações guardadas) existe para chegar à Prefeitura 21 e à pesquisa de T4 antes da KvK1.

> **Incerto:** Conflito de prazos: relatos de jogadores de 2026 dizem que o T4 chega "por volta do dia 30" ([B01-0700](../research/facts/B01/B01-0700.md), baixa), enquanto o orçamento bruto derivado de construção até a Prefeitura 21 é de cerca de 163 dias de construtor ([A01-0005](../research/facts/A01/A01-0005.md), baixa), ou seja, bem mais de 80 dias com dois construtores antes de bônus e acelerações. Ambos são fracos; o diário T0 deve definir a data real da Prefeitura 21 (L-A02-03, L-A01-03).
>
> **Pendente de medição no jogo (T0):** L-A01-03, L-A02-03

#### Capacidade do hospital antes da KvK1

**Confiança:** média · **Consenso:** unânime · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `d41-hospital`

- Tropas feridas além da capacidade do hospital **morrem**; algumas ações (atacar cidades/objetivos) sempre matam tropas gravemente feridas. Mantenha os hospitais grandes e vazios antes das lutas [[A08-0502](../research/facts/A08/A08-0502.md)]. Consenso: **unânime**.
- Capacidade por hospital (sem bônus): 7.500 no Nv1, 29.000 no Nv15, 75.000 no Nv25; as Prefeituras 4/9/15 liberam o 2º/3º/4º hospital [[A01-0008](../research/facts/A01/A01-0008.md)].
- As curas de T5 custam muito mais que as de T4; sem uma economia forte, lute com T4 [[A08-0505](../research/facts/A08/A08-0505.md)].

**Por quê:** Para um F2P, tropas mortas são a perda mais cara do jogo (um retreino completo); curar é bem mais barato. O nível do hospital também é pré-requisito da Prefeitura em vários níveis, então raramente é desperdício.

> **Incerto:** O custo de curar contra retreinar não foi quantificado (L-A08-01); ainda não há meta de hospital para a KvK1 (L-A08-02). O Salão dos Heróis devolve parte dos recursos de cura da KvK desde a 1.0.89 ([C04-0028](../research/facts/C04/C04-0028.md)), percentual desconhecido.
>
> **Estado do patch:** [C04-0028](../research/facts/C04/C04-0028.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A08-01, L-A08-02, L-A08-03

#### Acelerações: gastar ou guardar? (debate dividido)

**Confiança:** média · **Consenso:** dividido · **Prioridade:** 4/5 · **Recomendado para:** F2P · `d41-speedups-spend-vs-hoard`

**Renda de acelerações gratuitas:** cerca de **170 min/dia** dos baús dos Objetivos Diários (derivado de uma revisão de wiki de 2020), mais recompensas da Prefeitura (universais de 8h, 24h e 7 dias), bárbaros, a Loja VIP (acelerações de 5 min vendidas por comida), Expedição, aliança e mercador [[A04-0010](../research/facts/A04/A04-0010.md), [A01-0002](../research/facts/A01/A01-0002.md), [A04-0007](../research/facts/A04/A04-0007.md)].

**O debate**
- **Guardar (maioria):** guarde acelerações, itens de recurso e itens de PA para eventos pontuados e para a cura na KvK [[A11-0501](../research/facts/A11/A11-0501.md)].
- **Gastar:** jogue tudo na Prefeitura (visão minoritária mais antiga) ou **só em pesquisa** (uma fonte) [[A02-0503](../research/facts/A02/A02-0503.md), [A11-0501](../research/facts/A11/A11-0501.md)].

**Recomendado (F2P): guardar por padrão, com uma exceção.** Use acelerações no caminho da Prefeitura 21 / pesquisa de T4 quando um cronômetro, de outro modo, fizer você perder o **T4 antes da KvK1**; guarde o resto para eventos pontuados (mais recompensa por minuto gasto) e para a cura na KvK.

**Por quê:** A tensão é real: o objetivo do guia é ter força na KvK1, o que pede gastar, enquanto as recompensas de eventos e a cura na KvK pedem guardar. Acelerações guardadas mantêm todo o valor até serem usadas; uma Prefeitura 21 atrasada não se corrige depois. Ainda não há modelo quantitativo, então a regra da exceção é um julgamento, não um cálculo.

**As duas visões (dividido):** Maioria: guardar para eventos/KvK [[A11-0501](../research/facts/A11/A11-0501.md)]. Minoria: acelerações na Prefeitura [[A11-0501](../research/facts/A11/A11-0501.md) dissidente]. Uma fonte: acelerações universais só em pesquisa [[A02-0503](../research/facts/A02/A02-0503.md)].

> **Incerto:** [A02-0503](../research/facts/A02/A02-0503.md) é baixa/dividida. O valor de 170 min/dia ([A04-0010](../research/facts/A04/A04-0010.md)) é derivado e a mudança dos Objetivos Diários na 1.1.09 pode tê-lo alterado ([A10-0001](../research/facts/A10/A10-0001.md), parcialmente obsoleto). A regra da exceção é uma síntese deste guia, não um consenso com fonte.
>
> **Pendente de medição no jogo (T0):** L-A02-02, L-A04-04

#### O VIP 10 é um jogo longo para um F2P puro

**Confiança:** baixa · **Consenso:** mecânica · **Prioridade:** 3/5 · **Recomendado para:** F2P · `d41-vip10-reality`

- O VIP 10 exige **150.000 pontos VIP acumulados** [[A05-0001](../research/facts/A05/A05-0001.md)].
- Só com renda garantida (coleta diária + 100 gemas/dia), a estimativa derivada é de cerca do **dia 503** [[A05-0007](../research/facts/A05/A05-0007.md)] — um limite superior, já que presentes da aliança e gemas de eventos o encurtam.
- Só continue comprando VIP **durante o Mais que Gemas** [[A11-0502](../research/facts/A11/A11-0502.md)].

**Por quê:** Muitos planos de F2P supõem que o VIP 10 (escultura lendária diária) chega cedo. Com renda garantida ele não chega, então planeje seu caminho de comandantes em torno de Sun Tzu, Aethelflaed e esculturas douradas guardadas para a KvK1.

> **Incerto:** [A05-0007](../research/facts/A05/A05-0007.md) é derivado (baixa); a renda real de gemas e VIP do F2P não foi medida (L-A04-01, L-A05-03).
>
> **Pendente de medição no jogo (T0):** L-A04-01, L-A05-03

> **Nota para quem gasta pouco (Low):** Com o Fundo de Crescimento e o suprimento de 30 dias, o VIP 10 chega mais cedo que com a renda F2P; nenhuma ficha dá uma data, e o Fundo de Crescimento só paga por inteiro conforme os marcos da Prefeitura são alcançados [[A12-0001](../research/facts/A12/A12-0001.md), [A12-0002](../research/facts/A12/A12-0002.md), [A12-0005](../research/facts/A12/A12-0005.md)].

### Pré-KvK1 e KvK1 (aproximadamente dia 85–100+)

#### Véspera da Cruzada: use o que você guardou

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `pk-eve-of-crusade`

- **Recomendado (F2P):** gaste os **itens de PA** guardados em **saqueadores** durante a Véspera da Cruzada (acelerações, gemas, créditos) [[A09-0007](../research/facts/A09/A09-0007.md)]. A pacificação automática também pode atacar saqueadores desde a 1.1.02 [[A09-0008](../research/facts/A09/A09-0008.md)].
- Desde a 1.1.12 (T3), a Véspera da Cruzada abre **junto com o Reino Perdido** na Temporada 1 [[B01-0503](../research/facts/B01/B01-0503.md), [C04-0002](../research/facts/C04/C04-0002.md)].

**Por quê:** Este é o evento para o qual o estoque de itens de PA foi feito: as recompensas dele (acelerações e gemas) alimentam direto a cura da KvK1 e os últimos cronômetros de Prefeitura/T4.

> **Incerto:** [B01-0503](../research/facts/B01/B01-0503.md) é parcialmente obsoleto/baixa: o requisito de entrada no Reino Perdido (Prefeitura 17) é T3 único, e a sobreposição na Temporada 1 vem de um resumo de patch T3 ([C04-0002](../research/facts/C04/C04-0002.md), baixa) mais um relato de jogador.
>
> **Pendente de medição no jogo (T0):** L-B01-03

#### Lista de prontidão para a KvK1

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · `pk-kvk1-readiness`

- [ ] **Prefeitura 21 alcançada e T4 pesquisado** para o seu tipo de tropa [[A01-0001](../research/facts/A01/A01-0001.md), [A02-0501](../research/facts/A02/A02-0501.md), [A08-0506](../research/facts/A08/A08-0506.md)].
- [ ] **Uma marcha completa** (p. ex., Sun Tzu + Aethelflaed) com equipamento épico [[A06-0500](../research/facts/A06/A06-0500.md), [A06-0501](../research/facts/A06/A06-0501.md), [A07-0500](../research/facts/A07/A07-0500.md)].
- [ ] **Hospitais** melhorados e vazios [[A08-0502](../research/facts/A08/A08-0502.md)].
- [ ] **Acelerações** (principalmente as que servem para cura) e **itens de recurso** guardados [[A11-0501](../research/facts/A11/A11-0501.md), [A03-0007](../research/facts/A03/A03-0007.md)].
- [ ] Civilização: considere a troca planejada (Alemanha ou uma civilização de função) [[A14-0003](../research/facts/A14/A14-0003.md)].

**Por quê:** A KvK1 é onde os 100 dias de preparação são pontuados. Uma lista curta pega os deslizes baratos (hospital cheio, sem acelerações) que custam mais tropas que qualquer escolha de comandante.

> **Incerto:** A duração da KvK1 é contestada ([B01-0502](../research/facts/B01/B01-0502.md): 60 dias segundo uma fonte T3 de 2024 contra "todas as KvK duram 50 dias" segundo um jogador de 2026).
>
> **Pendente de medição no jogo (T0):** L-B01-02, L-A08-02

#### Como um F2P luta na KvK1

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · `pk-kvk1-behaviour`

- **Recomendado (F2P):** não lidere, fique atrás, recue cedo, **encha rallies fortes** e reforce em vez de trocar golpes sozinho [[A08-0503](../research/facts/A08/A08-0503.md)]. Consenso: **maioria**.
- Use **menos marchas, mas completas**, em vez de todos os espaços de marcha com marchas fracas [[A08-0504](../research/facts/A08/A08-0504.md)].
- Proteja a capacidade do hospital o tempo todo [[A08-0502](../research/facts/A08/A08-0502.md)].

**Por quê:** A marcha T4 de um F2P se sai mal contra o T5 de quem gasta em campo aberto, mas agrega valor real dentro de um rally ou guarnição. Menos marchas, e melhores, também são mais baratas de curar.

> **Incerto:** [A08-0504](../research/facts/A08/A08-0504.md) é organizado (citação não literal). As duplas F2P para a KvK1 variam conforme a fonte ([A06-0513](../research/facts/A06/A06-0513.md), dividido): Sun Tzu + Aethelflaed; Aethelflaed + Baibars; YSG + flexível; Alexander + YSG. AoE de campo acima de comandantes de rally/guarnição é fonte única ([A06-0512](../research/facts/A06/A06-0512.md)).
>
> **Pendente de medição no jogo (T0):** L-A06-01

## 4. Rotina diária por tempo disponível

### Rotina diária — 15 minutos

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P, Low · **Tempo disponível:** ≥ 15 min/dia · **Custo de tempo:** pendente de T0 (L-A10-01) · `daily-15min`

Faça isto todos os dias, nesta ordem. **Custo de tempo por tarefa: Pendente de medição no jogo (T0), lacuna L-A10-01.**

| # | Tarefa | Por que está no nível de 15 minutos | Fichas |
|---|---|---|---|
| 1 | Colete **pontos VIP + baú VIP** | Quebrar a sequência derruba os 200/dia para 40 | [A05-0003](../research/facts/A05/A05-0003.md), [A05-0006](../research/facts/A05/A05-0006.md) |
| 2 | Colete os **PA diários** | PA grátis; pode passar do limite | [A09-0006](../research/facts/A09/A09-0006.md), [C04-0032](../research/facts/C04/C04-0032.md) |
| 3 | **Reabasteça todas as filas** (2 construtores, pesquisa, treinamento, cura) — pelo painel da Prefeitura 8 | Fila parada é progresso perdido | [A01-0011](../research/facts/A01/A01-0011.md), [A01-0006](../research/facts/A01/A01-0006.md) |
| 4 | **Ajuda da aliança** (ajudar todos) | 20 ajudas = 10 pontos dos Objetivos Diários | [A10-0006](../research/facts/A10/A10-0006.md) |
| 5 | Inicie a **pacificação automática** em bárbaros com o PA que regenera | Usa PA que bateria no limite | [A09-0008](../research/facts/A09/A09-0008.md), [A09-0007](../research/facts/A09/A09-0007.md) |
| 6 | Envie **coletores a nós grandes** no território da aliança antes de sair | Horas offline viram recursos | [A03-0016](../research/facts/A03/A03-0016.md), [A03-0009](../research/facts/A03/A03-0009.md) |

**Pule hoje se estiver sem tempo:** Cânion do Pôr do Sol, simulado do Liceu, bárbaros manuais, passeio pelo mercador.

**Por quê:** As ações diárias de maior valor são as coletas (grátis, baseadas em sequência) e manter os cronômetros rodando. Tudo aqui protege uma sequência ou mantém a conta produzindo enquanto você está offline.

> **Incerto:** Nenhuma fonte publica minutos por tarefa; os custos de tempo aguardam o cronômetro do T0 (L-A10-01). A ordem é um julgamento deste guia a partir do valor com fonte por conclusão, não um valor medido por minuto.
>
> **Estado do patch:** [C04-0032](../research/facts/C04/C04-0032.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A10-01, L-A09-04

### Rotina diária — 30 minutos (inclui os Objetivos Diários)

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · **Tempo disponível:** ≥ 30 min/dia · **Custo de tempo:** pendente de T0 (L-A10-01) · `daily-30min`

Tudo do nível de 15 minutos, mais o seguinte. **Custo de tempo: Pendente de T0 (L-A10-01).**

| Tarefa | Valor | Fichas |
|---|---|---|
| Complete os **Objetivos Diários até 100 pontos** | 100 gemas, Chave de Ouro, 3 esculturas épicas; os baús pelo caminho dão acelerações (~170 min/dia derivado) e 100 PA | [A04-0001](../research/facts/A04/A04-0001.md), [A04-0010](../research/facts/A04/A04-0010.md) |
| Abra os **baús de prata da Taverna** grátis (3/dia na Taverna 1–4, até 10 na Taverna 25) | esculturas, acelerações, tomos | [A10-0003](../research/facts/A10/A10-0003.md) |
| **Estação de Correio / Mercador Misterioso**: renovação grátis, compre com recursos (10 compras também contam para os Objetivos Diários) | acelerações com desconto | [A04-0011](../research/facts/A04/A04-0011.md), [A03-0014](../research/facts/A03/A03-0014.md) |
| **Expedição**: colete o baú de 3 estrelas, renovação grátis de medalhas | medalhas para a Aethelflaed | [A10-0004](../research/facts/A10/A10-0004.md) |

**Por quê:** O baú de 100 pontos é a única renda de gemas garantida que um F2P tem [[A04-0001](../research/facts/A04/A04-0001.md)]; vale os minutos extras em qualquer dia em que você os tenha.

> **Incerto:** Nenhuma fonte publica minutos por tarefa; os custos de tempo aguardam o cronômetro do T0 (L-A10-01). A ordem é um julgamento deste guia a partir do valor com fonte por conclusão, não um valor medido por minuto. A lista de tarefas dos Objetivos Diários mudou na 1.1.09 (tarefas de impulso trocadas por tarefas de login e de doação à aliança); [A10-0001](../research/facts/A10/A10-0001.md) é parcialmente obsoleto e o valor de 170 min/dia de acelerações é derivado.
>
> **Pendente de medição no jogo (T0):** L-A10-01, L-A10-02, L-A04-04

### Rotina diária — 60 minutos (inclui PvE e modos)

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 3/5 · **Recomendado para:** F2P · **Tempo disponível:** ≥ 60 min/dia · **Custo de tempo:** pendente de T0 (L-A10-01) · `daily-60min`

Tudo do nível de 30 minutos, mais o seguinte. **Custo de tempo: Pendente de T0 (L-A10-01).**

| Tarefa | Valor | Fichas |
|---|---|---|
| **Bárbaros manuais** em sequência (−2 PA por golpe consecutivo, mín. 40) e **rallies em fortes** quando os fortes forem liberados | EXP, acelerações, Livros do Pacto (~50% por nível), presentes da aliança | [A09-0002](../research/facts/A09/A09-0002.md), [A09-0005](../research/facts/A09/A09-0005.md) |
| Tentativas no **Cânion do Pôr do Sol** | recompensas diárias/de temporada; top 5 diário → Chave de Ouro | [A10-0008](../research/facts/A10/A10-0008.md) |
| Simulado do **Erudito Incomparável** (seg–sex, Prefeitura 10+) | Lampejos de Percepção; exames quinzenais dividem um pool de gemas | [A10-0005](../research/facts/A10/A10-0005.md) |
| Tarefas de **eventos** ativos (veja Eventos) | por evento | [A11-0512](../research/facts/A11/A11-0512.md) |

**Por quê:** Isso agrega valor, mas ou ainda não tem rendimento quantificado por minuto, ou depende de desbloqueios. São as primeiras coisas a cortar quando o tempo é curto.

> **Incerto:** Nenhuma fonte publica minutos por tarefa; os custos de tempo aguardam o cronômetro do T0 (L-A10-01). A ordem é um julgamento deste guia a partir do valor com fonte por conclusão, não um valor medido por minuto.
>
> **Pendente de medição no jogo (T0):** L-A10-01, L-A10-03, L-A09-03, L-A04-05

### Tarefas semanais e quinzenais

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · **Tempo disponível:** ≥ 15 min/dia · **Custo de tempo:** pendente de T0 (L-A10-01) · `daily-weekly`

- **Loja VIP (segunda-feira 00:00 UTC):** compre as linhas pagas em **comida** — 30× 100 PA por 12.000 de comida cada (VIP 2) e 50× acelerações universais de 5 min por 7.000 de comida cada (VIP 3) [[A04-0007](../research/facts/A04/A04-0007.md)].
- **Erudito Incomparável**, fase preliminar e final a cada duas semanas (pool de gemas) [[A10-0005](../research/facts/A10/A10-0005.md)].
- Confira o **calendário de eventos** com alguns dias de antecedência [[A11-0512](../research/facts/A11/A11-0512.md)].

**Por quê:** As linhas da Loja VIP pagas em comida não custam gemas e somam cerca de 3.000 PA e 250 minutos de acelerações por semana; se todas as fontes gratuitas de PA forem coletadas, o total semanal derivado é de cerca de 7.200 PA [[A09-0006](../research/facts/A09/A09-0006.md)].

> **Incerto:** O valor de 7.200 PA/semana é derivado (método de [A09-0006](../research/facts/A09/A09-0006.md)) e não inclui a regeneração natural (L-A09-01). Custo de tempo pendente de T0 (L-A10-01).
>
> **Pendente de medição no jogo (T0):** L-A09-01, L-A10-01

### Dias leves e Modo Pausa

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 3/5 · **Recomendado para:** F2P, Low · **Tempo disponível:** ≥ 0 min/dia · **Custo de tempo:** pendente de T0 (L-A10-01) · `daily-break-mode`

Nos dias em que você não consegue jogar direito, faça só:
1. **Colete os pontos VIP** — um dia perdido custa até 720 pontos VIP nos 8 dias seguintes (derivado) [[A05-0003](../research/facts/A05/A05-0003.md)].
2. **Reabasteça as filas com cronômetros longos** e envie coletores a nós grandes [[A01-0011](../research/facts/A01/A01-0011.md), [A03-0016](../research/facts/A03/A03-0016.md)].
3. Antes de uma pausa mais longa: mantenha os recursos brutos no limite da proteção do Depósito ou abaixo, e o resto como **itens fechados** [[A03-0006](../research/facts/A03/A03-0006.md), [A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].

**Por quê:** O esgotamento é um dos principais motivos para largar o jogo. Um piso de dois minutos mantém as sequências e a conta seguras, então uma semana ruim não vira motivo para parar.

> **Incerto:** O uso de escudo em pausas de vários dias não é coberto por nenhuma ficha (PROPOSED-SHIELDS). O valor de 720 pontos é derivado de [A05-0003](../research/facts/A05/A05-0003.md).
>
> **Pendente de medição no jogo (T0):** PROPOSED-SHIELDS, L-A10-01

## 5. Calendário de eventos e preparação

### Eventos: planeje pelo calendário do jogo

**Confiança:** média · **Consenso:** unânime · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `ev-calendar-rule`

- Os eventos **não seguem um cronograma fixo**; o calendário do jogo mostra alguns dias à frente, e os reinos variam conforme a idade e o progresso do Monumento [[A11-0512](../research/facts/A11/A11-0512.md)]. Consenso: **unânime**.
- O que se sabe para um reino novo:

| Evento | Momento | Confiança | Fichas |
|---|---|---|---|
| Pelagius Lendário | a partir do dia 5 (oficial) | alta (nota de patch) | [C04-0005](../research/facts/C04/C04-0005.md) |
| Mais que Gemas | ~mensal, 2 dias, reinos com mais de ~21 dias | média | [A11-0502](../research/facts/A11/A11-0502.md) |
| Erudito Incomparável | dias úteis + exames quinzenais | alta | [A10-0005](../research/facts/A10/A10-0005.md) |
| Pioneiro / Caminho do Renascimento | ~dia 20–23 | Incerto (T3 único) | [A11-0510](../research/facts/A11/A11-0510.md) |
| Primeira Roda da Fortuna | ~dia 24; YSG ~dia 94 | Incerto (T3 único) | [A11-0503](../research/facts/A11/A11-0503.md) |
| Arca de Osíris | ~a cada duas semanas | Incerto (T3) | [A11-0508](../research/facts/A11/A11-0508.md) |
| Cânion do Pôr do Sol | tentativas diárias, temporadas de 7 dias | Incerto (T3) | [A11-0507](../research/facts/A11/A11-0507.md) |

- Ativos em 2026 segundo as notas oficiais: Cânion do Pôr do Sol, Campeões de Olímpia, Treino de Armas com Lohar [[A11-0513](../research/facts/A11/A11-0513.md)].

**Por quê:** Qualquer plano de eventos dia a dia seria errado para a maioria dos reinos. As regras de acúmulo (o que guardar para qual tipo de evento) funcionam sem datas; o calendário diz quando.

> **Incerto:** [A11-0510](../research/facts/A11/A11-0510.md), [A11-0503](../research/facts/A11/A11-0503.md) (parcialmente obsoleto), [A11-0508](../research/facts/A11/A11-0508.md) e [A11-0507](../research/facts/A11/A11-0507.md) são baixa. Os dias da primeira ocorrência são um alvo do T0.
>
> **Estado do patch:** [C04-0005](../research/facts/C04/C04-0005.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A11-01, L-B01-01

### Mais que Gemas: a janela para gastar gemas

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P · `ev-more-than-gems`

- **Recomendado (F2P, a partir do VIP 6):** poupe gemas e gaste-as em pontos VIP **durante o Mais que Gemas** [[A11-0502](../research/facts/A11/A11-0502.md), [A11-0504](../research/facts/A11/A11-0504.md)]. Consenso: **maioria**.
- Estrutura relatada: um evento de **2 dias** com marcos diários de gasto de gemas; faixas relatadas de 7.000 gemas/dia → 5 esculturas lendárias universais e 25.000/dia → 13; cerca de **mensal**, só em reinos com mais de ~21 dias [[A11-0502](../research/facts/A11/A11-0502.md)].

**Por quê:** As mesmas gemas compram pontos VIP de qualquer forma; durante o Mais que Gemas elas também pagam recompensas de marcos, incluindo esculturas douradas, que um F2P quase não vê antes do VIP 10.

> **Incerto:** Os valores das faixas são relatos T3/T4 a confirmar no jogo; a periodicidade foi definida a partir de T3 + T4 (notas de [A11-0502](../research/facts/A11/A11-0502.md)).
>
> **Pendente de medição no jogo (T0):** L-A11-01, L-A11-02

> **Nota para quem gasta pouco (Low):** Quem gasta pouco deve guardar as gemas compradas (Depósito de Suprimentos, pagamentos do Fundo de Crescimento) também para o Mais que Gemas e escolher o momento de qualquer recarga em torno do evento de Recarga [[A12-0005](../research/facts/A12/A12-0005.md), [A12-0002](../research/facts/A12/A12-0002.md)].

### Provação de Lohar / Treino de Armas: para onde vão as poções de PA

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 4/5 · **Recomendado para:** F2P, Low · `ev-lohar-ap`

- **Recomendado (F2P):** guarde suas poções de PA para a **Provação de Lohar / Treino de Armas** e gaste-as lá [[A11-0505](../research/facts/A11/A11-0505.md), [A09-0007](../research/facts/A09/A09-0007.md)]. Consenso: **maioria**.
- O Treino de Armas com Lohar está confirmado como ativo em 2026 [[A11-0513](../research/facts/A11/A11-0513.md)].

**Por quê:** É um dos poucos eventos em que o PA de um F2P vira gemas e recompensas de alto valor a uma taxa melhor que a dos bárbaros comuns.

> **Incerto:** O dia da primeira ocorrência e as tabelas de recompensa não foram registrados (L-A11-01, L-A11-02).
>
> **Pendente de medição no jogo (T0):** L-A11-01, L-A11-02

### Governador Mais Poderoso (MGE): marcos, não ranking

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 3/5 · **Recomendado para:** F2P · `ev-mge`

- **Recomendado (F2P):** pegue as recompensas de **marcos** do MGE; não corra atrás do ranking — ou siga as regras de MGE do seu reino [[A11-0500](../research/facts/A11/A11-0500.md)]. Consenso: **maioria**.

**Por quê:** As recompensas de ranking vão para quem gasta em um reino novo; os marcos são alcançáveis e custam só o que você usaria de qualquer jeito. Muitos reinos também definem as posições do MGE, e quebrar essas regras tem custo social.

> **Incerto:** O formato atual do MGE não foi registrado (L-A11-04, L-B05-01).
>
> **Pendente de medição no jogo (T0):** L-A11-04, L-B05-01

### Roda da Fortuna: só com alvo planejado

**Confiança:** baixa · **Consenso:** maioria · **Prioridade:** 2/5 · **Recomendado para:** F2P · `ev-wheel-of-fortune`

- Consenso F2P: gire só por um **alvo planejado**, em geral parando em **10 giros**, de preferência depois do VIP 10 [[A11-0503](../research/facts/A11/A11-0503.md)].
- Os giros agora exigem **Tíquetes de Giro** nas Temporadas 2/3/SoC (oficial) e, segundo um resumo de terceiros, na Temporada 1 desde a 1.1.12 [[C04-0022](../research/facts/C04/C04-0022.md)]. A conta antiga de gemas por giro está errada onde os tíquetes valem.

**Por quê:** A Roda é o principal caminho inicial para um lendário em destaque (o YSG é relatado por volta do dia 94 [[A06-0502](../research/facts/A06/A06-0502.md)]), mas giros sem planejamento são o clássico ralo de gemas do F2P.

> **Incerto:** [A11-0503](../research/facts/A11/A11-0503.md) é parcialmente obsoleto/baixa (o custo em gemas dele é anterior aos Tíquetes de Giro). O preço no reino de origem é desconhecido (L-A11-03).
>
> **Estado do patch:** [C04-0022](../research/facts/C04/C04-0022.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A11-03

### Quais eventos priorizar e quais pular

**Confiança:** baixa · **Consenso:** dividido · **Prioridade:** 2/5 · **Recomendado para:** F2P · `ev-priorities`

- **Priorize:** eventos de marcos garantidos e de PvE da aliança — Provação de Lohar, Cerimônia Karuak, Reino Dourado, Crise de Ceroli, Mobilização da Aliança, Legião Sombria [[A11-0506](../research/facts/A11/A11-0506.md)].
- **Pule:** Corrida Contra o Tempo, eventos repetidos de gasto de gemas, rankings abertos de poder [[A11-0511](../research/facts/A11/A11-0511.md)].
- **Dividido:** Arca de Osíris — boa fonte de esculturas contra "o F2P não consegue competir" [[A11-0508](../research/facts/A11/A11-0508.md)]. Campeões de Olímpia é chamado de o modo mais amigável ao F2P por uma fonte [[A11-0509](../research/facts/A11/A11-0509.md)]. Pioneiro / Caminho do Renascimento: compre primeiro as quatro chaves de ouro (uma fonte) [[A11-0510](../research/facts/A11/A11-0510.md)].

**Por quê:** Eventos com marcos garantidos recompensam o esforço do F2P; eventos ranqueados por gasto ou poder bruto, não.

**As duas visões (dividido):** Arca de Osíris: valiosa para esculturas contra pouco competitiva para o F2P [[A11-0508](../research/facts/A11/A11-0508.md)].

> **Incerto:** As cinco fichas ([A11-0506](../research/facts/A11/A11-0506.md), [A11-0511](../research/facts/A11/A11-0511.md), [A11-0508](../research/facts/A11/A11-0508.md), [A11-0509](../research/facts/A11/A11-0509.md), [A11-0510](../research/facts/A11/A11-0510.md)) são baixa. As tabelas de recompensa por evento são uma lacuna.
>
> **Pendente de medição no jogo (T0):** L-A11-02

## 6. Farms

*Apenas um resumo. O guia dedicado a farms (F-03: farms de recurso único, gerais e de par de recursos) vai substituir esta seção.*

### Contas farm (resumo; guia completo em breve)

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 2/5 · **Recomendado para:** F2P, Low · `farm-brief`

- **Finalidade:** a farm coleta recursos e os envia à conta principal pelo Entreposto Comercial (com taxa); usos secundários incluem pontos do MGE, Livros do Pacto e apoio na KvK [[A13-0010](../research/facts/A13/A13-0010.md)]. Consenso: **maioria**.
- **Metas:** Prefeitura 11 (3 marchas) para começar, Prefeitura 17 (4) como mínimo prático, Prefeitura 22 (5) como meta forte [[A13-0002](../research/facts/A13/A13-0002.md)]; Entreposto Comercial ≥ 15 na farm [[A13-0003](../research/facts/A13/A13-0003.md)].
- A **taxa** cai de 35% (Entreposto Nv1) para 21% (Nv15), 10% (Nv24) e 8% (Nv25) [[A03-0024](../research/facts/A03/A03-0024.md)].
- Só recursos **acima da proteção do Depósito** podem ser enviados [[A03-0030](../research/facts/A03/A03-0030.md)]; ouro pode ser enviado [[A03-0027](../research/facts/A03/A03-0027.md)]; cada transferência usa uma marcha e tempo de viagem [[A03-0026](../research/facts/A03/A03-0026.md)].
- Envie o excedente com regularidade; não mantenha grandes pilhas de recursos brutos em uma farm de Prefeitura baixa durante eventos de abates [[A13-0005](../research/facts/A13/A13-0005.md)].
- **Sem scripts em farms** (Pontuação de Conduta) [[C04-0006](../research/facts/C04/C04-0006.md)].

O guia dedicado a farms (variantes de recurso único, geral e de par de recursos) está planejado como F-03.

**Por quê:** Farms são a forma mais comum de uma conta principal F2P conseguir recursos extras sem gastar, mas custam minutos diários que ainda não foram medidos, então vêm depois que a rotina da conta principal está sob controle.

> **Incerto:** Duas cidades por reino pelo Gerenciamento de Personagens ([A13-0001](../research/facts/A13/A13-0001.md), organizado). Os minutos e o rendimento diário da farm são desconhecidos. Farms de par de recursos não têm fonte (apenas hipótese). A política oficial sobre farms não foi confirmada.
>
> **Estado do patch:** [C04-0006](../research/facts/C04/C04-0006.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A13-01, L-A13-02, L-A13-03, L-A03-03

## 7. Erros a evitar

### Erros que mais custam ao F2P

**Confiança:** média · **Consenso:** maioria · **Prioridade:** 5/5 · **Recomendado para:** F2P, Low · `mistakes-economy`

1. **Quebrar a sequência do VIP** (volta para 40/dia) [[A05-0003](../research/facts/A05/A05-0003.md)].
2. **Ficar parado no limite de PA** (1.500) em vez de gastar o PA que regenera [[A09-0001](../research/facts/A09/A09-0001.md), [A09-0007](../research/facts/A09/A09-0007.md)].
3. **Terminar cronômetros com gemas** ou **comprar PA com gemas** [[A04-0009](../research/facts/A04/A04-0009.md), [A04-0008](../research/facts/A04/A04-0008.md)].
4. **Espalhar esculturas** por vários comandantes [[A06-0500](../research/facts/A06/A06-0500.md)]; **esculturas douradas em coletores ou escolhas temporárias** [[A06-0510](../research/facts/A06/A06-0510.md)].
5. **Deixar os hospitais transbordarem** (o excesso morre) [[A08-0502](../research/facts/A08/A08-0502.md)].
6. **Liderar lutas** sendo F2P em vez de encher rallies [[A08-0503](../research/facts/A08/A08-0503.md)].
7. **Manter recursos brutos acima da proteção do Depósito** quando itens estariam seguros [[A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].
8. **Construir fora da cadeia da Prefeitura** antes da Prefeitura 21 [[A01-0007](../research/facts/A01/A01-0007.md)].

**Por quê:** Cada um desses erros desperdiça algo que o F2P não consegue comprar de volta: uma sequência, PA grátis, gemas, esculturas ou tropas.


### Erro: seguir conselhos desatualizados

**Confiança:** média · **Consenso:** mecânica · **Prioridade:** 3/5 · **Recomendado para:** F2P, Low · `mistakes-outdated-advice`

Confira a data e o patch de qualquer guia. Itens desatualizados comuns [[C04-0004](../research/facts/C04/C04-0004.md), [C04-0026](../research/facts/C04/C04-0026.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0024](../research/facts/C04/C04-0024.md), [C04-0006](../research/facts/C04/C04-0006.md)]:
- impulsos de recursos (removidos na 1.1.09);
- contas pulo / Imigração de Iniciante (acabou em 2025-03-26);
- conta de gemas por giro da Roda da Fortuna (Tíquetes de Giro);
- "o VIP para no 18" (VIP19 e SVIP desde a 1.0.87);
- bots para bárbaros/coleta (Pontuação de Conduta desde a 1.1.07).

**Por quê:** Muitos dos primeiros resultados de busca têm anos ou mostram datas atualizadas automaticamente. Segui-los gasta recursos com coisas que não existem mais.

> **Incerto:** [C04-0026](../research/facts/C04/C04-0026.md) se apoia em um correio do jogo citado por jogadores mais wiki/guia.
>
> **Estado do patch:** [C04-0004](../research/facts/C04/C04-0004.md), [C04-0006](../research/facts/C04/C04-0006.md), [C04-0022](../research/facts/C04/C04-0022.md), [C04-0024](../research/facts/C04/C04-0024.md), [C04-0026](../research/facts/C04/C04-0026.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).

## 8. Se você foi zerado

### Se você foi zerado

**Confiança:** baixa · **Consenso:** mecânica · **Prioridade:** 3/5 · **Recomendado para:** F2P, Low · `recovery-zeroed`

**O que sobrevive** [[A03-0007](../research/facts/A03/A03-0007.md), [A08-0502](../research/facts/A08/A08-0502.md)]:
- **Itens** de recurso e **gemas** não podem ser saqueados.
- As tropas são feridas e vão para os hospitais até a capacidade; além dela morrem, e algumas ações sempre matam os gravemente feridos.

**O que fazer agora**
1. **Cure antes de retreinar** — curar é bem mais barato que retreinar (direção concordada pelas fontes; valores não quantificados) [[A08-0502](../research/facts/A08/A08-0502.md)].
2. **Estanque a sangria:** mantenha os recursos brutos no limite da proteção do Depósito ou abaixo, e o resto como itens [[A03-0006](../research/facts/A03/A03-0006.md), [A03-0007](../research/facts/A03/A03-0007.md), [A13-0005](../research/facts/A13/A13-0005.md)].
3. **Recomeçar ou continuar:** uma conta nova já não pode pular para um reino novo com a Imigração de Iniciante [[C04-0026](../research/facts/C04/C04-0026.md)]; as regras de imigração foram endurecidas em 2026 [[C04-0008](../research/facts/C04/C04-0008.md)]. Continuar costuma ser a única opção realista para o F2P.
4. Releia a lista de prontidão e reconstrua primeiro **uma** marcha completa [[A06-0500](../research/facts/A06/A06-0500.md)].

**Por quê:** Ser zerado é um dos principais motivos para largar o jogo. Saber o que *não* foi perdido, e o que reconstruir primeiro, transforma um desastre em um atraso.

> **Incerto:** As regras de ferimento grave/morte não têm texto oficial (L-A08-03); o custo de curar contra retreinar não foi quantificado (L-A08-01). As regras de escudo não foram pesquisadas (PROPOSED-SHIELDS). [C04-0008](../research/facts/C04/C04-0008.md) é uma ficha de estado de patch (limites de imigração, partes de pioneiro).
>
> **Estado do patch:** [C04-0008](../research/facts/C04/C04-0008.md), [C04-0026](../research/facts/C04/C04-0026.md) (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).
>
> **Pendente de medição no jogo (T0):** L-A08-01, L-A08-03, PROPOSED-SHIELDS, L-B06-03

## 9. Perguntas em aberto e medições pendentes

### Perguntas em aberto / medições pendentes no jogo (T0)

**Confiança:** pendente · **Consenso:** n/d · **Prioridade:** 1/5 · `open-pending-measurements`

Essas lacunas enfraquecem partes específicas deste guia; o protocolo T0 (`research/protocolos/t0-medicao.md`) foi desenhado para fechá-las.

| Lacuna | O que mudaria | Blocos afetados |
|---|---|---|
| L-A10-01 minutos por tarefa | Custos de tempo e a ordem de 15/30/60 | daily-* |
| L-A04-01 renda real de gemas do F2P | Datas de VIP 6 / VIP 10, orçamento do Mais que Gemas | ov-budget-reality-check, d15-vip6-milestone |
| L-A01-03 tempos de construção com bônus | Datas reais da Prefeitura 17/21 | d0-build-order, d41-ch21-t4 |
| L-A02-03 tempo até o T4 | Resolve "T4 ~dia 30" contra ~163 dias brutos de construtor | d41-ch21-t4 |
| L-A02-02 modelo de alocação de acelerações | Transforma o debate gastar-ou-guardar em regra | d41-speedups-spend-vs-hoard |
| L-A04-04 renda de acelerações/dia | Orçamento de acelerações para a Prefeitura 21 | d41-speedups-spend-vs-hoard |
| L-A09-01 regeneração de PA | Bárbaros/dia | d0-ap-discipline |
| L-A10-02 Objetivos Diários após a 1.1.09 | Caminho mais barato até 100 pontos | daily-30min |
| L-A11-01 dias da primeira ocorrência de eventos | Calendário de eventos | ev-calendar-rule |
| L-A06-03 renda de esculturas | Plano de comandantes | d15-commander-checklist |
| L-A01-01 níveis de desbloqueio iniciais | Prefeitura de Academia / Pedreira / Entreposto Comercial | d0-build-order |
| L-B01-03 entrada no Reino Perdido, momento da Véspera | Plano pré-KvK | pk-eve-of-crusade |
| PROPOSED-SHIELDS escudo e proteção de iniciante | Conselhos de segurança e de Modo Pausa | d0-day1-survival, recovery-zeroed |

**Por quê:** Dizer o que não sabemos faz parte do valor do guia: você vê quais conselhos são sólidos e quais aguardam medição.

> **Pendente de medição no jogo (T0):** L-A10-01, L-A04-01, L-A01-03, L-A02-03, L-A02-02, L-A04-04, L-A09-01, L-A10-02, L-A11-01, L-A06-03, L-A01-01, L-B01-03, PROPOSED-SHIELDS

## Apêndice: fontes e confiança

**120 fichas de fatos citadas**; 77 passam no filtro firme (`verificado` + `media`/`alta`). As demais aparecem apenas dentro das notas *Incerto* ou como *Estado do patch*.

| Ficha | Título | Status | Confiança | Consenso | Firme? | Usada em |
|---|---|---|---|---|---|---|
| [A01-0001](../research/facts/A01/A01-0001.md) | City Hall CH1→CH25: requirements, cost, raw time, troop capacity, unlocks (table) | verificado | media | n/a | sim | `ov-budget-reality-check`, `d0-build-order`, `d15-ch10-ch17`, `d15-equipment`, `d41-ch21-t4`, `pk-kvk1-readiness` |
| [A01-0002](../research/facts/A01/A01-0002.md) | City Hall upgrade rewards per level (resources, speedups, gems, civilization change) | verificado | media | n/a | sim | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17`, `d41-ch21-t4`, `d41-speedups-spend-vs-hoard` |
| [A01-0003](../research/facts/A01/A01-0003.md) | City Hall level caps the level of every other building | verificado | media | n/a | sim | `d0-build-order` |
| [A01-0004](../research/facts/A01/A01-0004.md) | Prerequisite rule for each building in the City Hall chain (table) | verificado | media | n/a | sim | `d0-build-order` |
| [A01-0005](../research/facts/A01/A01-0005.md) | Minimum building set and total raw build time to reach CH10/13/16/17/20/21/22/25 (derived) | verificado | baixa | n/a | não | `d0-build-order`, `d15-ch10-ch17`, `d41-ch21-t4` |
| [A01-0006](../research/facts/A01/A01-0006.md) | Builder queue: 1 by default, 2nd via Builder Recruitment (2 days) or permanently at VIP 6 | verificado | alta | n/a | sim | `d0-first-gems-vip`, `d15-vip6-milestone`, `daily-15min` |
| [A01-0007](../research/facts/A01/A01-0007.md) | F2P build priority: City Hall and its prerequisites first; everything else waits | verificado | media | majoritario | sim | `d0-build-order`, `d4-gathering-setup`, `mistakes-economy` |
| [A01-0008](../research/facts/A01/A01-0008.md) | Hospital capacity per level: outdated values in riseofkingdomsguides (Lv1 3,000 / Lv15 24, | verificado | alta | n/a | sim | `d4-ch8-ch12-checkpoints`, `d41-hospital` |
| [A01-0009](../research/facts/A01/A01-0009.md) | Conflicting low-level prerequisites between Fandom and riseofkingdomsguides (Academy, Stab | contestado | baixa | n/a | não | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-research-economy` |
| [A01-0011](../research/facts/A01/A01-0011.md) | Queue management dashboard unlocks at City Hall 8 (construction, training, research, heali | verificado | alta | n/a | sim | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `daily-15min`, `daily-break-mode` |
| [A02-0500](../research/facts/A02/A02-0500.md) | Research: speed/economy techs first (Writing, Masonry/Engineering, Mathematics) | verificado | media | majoritario | sim | `d4-research-economy` |
| [A02-0501](../research/facts/A02/A02-0501.md) | Military path: T3 → T4 (skip siege) → shared combat techs → one branch → T5 | verificado | media | majoritario | sim | `d15-research-military`, `pk-kvk1-readiness` |
| [A02-0503](../research/facts/A02/A02-0503.md) | Where universal speedups go: research vs City Hall — divided | verificado | baixa | dividido | não | `d41-speedups-spend-vs-hoard` |
| [A02-0504](../research/facts/A02/A02-0504.md) | Time cost of research is long (Combat Tactics 10 ≈ 100 days, avg player) | verificado | baixa | fonte_unica | não | `d15-research-military` |
| [A03-0006](../research/facts/A03/A03-0006.md) | Storehouse protection capacity by level | verificado | media | n/a | sim | `d0-day1-survival`, `daily-break-mode`, `recovery-zeroed` |
| [A03-0007](../research/facts/A03/A03-0007.md) | Resource items vs raw resources (plunder safety) | verificado | media | n/a | sim | `d0-day1-survival`, `pk-kvk1-readiness`, `daily-break-mode`, `mistakes-economy`, `recovery-zeroed` |
| [A03-0009](../research/facts/A03/A03-0009.md) | Alliance territory gives +25% gathering speed | verificado | alta | n/a | sim | `d0-join-alliance`, `d4-gathering-setup`, `daily-15min` |
| [A03-0013](../research/facts/A03/A03-0013.md) | Enhanced Gathering boost items (+50%, 8h/24h) and how to get them | verificado | alta | n/a | sim | `d4-gathering-setup` |
| [A03-0014](../research/facts/A03/A03-0014.md) | Mysterious Merchant: daily at 00:00 UTC, food/wood-priced items | verificado | media | n/a | sim | `daily-30min` |
| [A03-0016](../research/facts/A03/A03-0016.md) | Node level affects total amount, not gathering speed; pick node by availability | verificado | media | majoritario | sim | `d4-gathering-setup`, `daily-15min`, `daily-break-mode` |
| [A03-0017](../research/facts/A03/A03-0017.md) | Gathering commander setup: talents, level 37, primary only | verificado | media | majoritario | sim | `d4-early-commanders` |
| [A03-0021](../research/facts/A03/A03-0021.md) | Resource bottleneck progression by CH stage | verificado | media | majoritario | sim | `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17` |
| [A03-0023](../research/facts/A03/A03-0023.md) | March queues (gathering armies) by CH level | verificado | media | n/a | sim | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-gathering-setup`, `d15-ch10-ch17`, `d41-ch21-t4` |
| [A03-0024](../research/facts/A03/A03-0024.md) | Trading Post tax rate by level | verificado | alta | n/a | sim | `farm-brief` |
| [A03-0025](../research/facts/A03/A03-0025.md) | Trading Post capacity per trip and unlock CH (conflicting) | contestado | media | n/a | não | `d4-ch8-ch12-checkpoints` |
| [A03-0026](../research/facts/A03/A03-0026.md) | Trading Post transfers use a march queue and travel time | verificado | media | n/a | sim | `farm-brief` |
| [A03-0027](../research/facts/A03/A03-0027.md) | Gold CAN be sent via Trading Post (only the amount above Storehouse protection is sendable | verificado | media | majoritario | sim | `farm-brief` |
| [A03-0030](../research/facts/A03/A03-0030.md) | Storehouse-protected resources cannot be transported | verificado | alta | n/a | sim | `farm-brief` |
| [A04-0001](../research/facts/A04/A04-0001.md) | Daily Objectives 100-activity-point chest gives 100 gems per day (main guaranteed F2P gem  | verificado | media | n/a | sim | `ov-budget-reality-check`, `d4-early-commanders`, `d15-vip6-milestone`, `daily-30min` |
| [A04-0007](../research/facts/A04/A04-0007.md) | VIP Shop: items, gem/resource prices, VIP level required, quantity per refresh (table) + d | verificado | media | n/a | sim | `d41-speedups-spend-vs-hoard`, `daily-weekly` |
| [A04-0008](../research/facts/A04/A04-0008.md) | Buying Action Points with gems: 500 AP for 100 gems, +50 gems per purchase, resets daily | verificado | media | n/a | sim | `d0-first-gems-vip`, `mistakes-economy` |
| [A04-0009](../research/facts/A04/A04-0009.md) | Where F2P should spend gems: VIP first; avoid finishing builds with gems; save for More Th | verificado | media | majoritario | sim | `d0-first-gems-vip`, `mistakes-economy` |
| [A04-0010](../research/facts/A04/A04-0010.md) | Free speedup sources for F2P (qualitative list) and early fixed speedups | verificado | media | n/a | sim | `d41-speedups-spend-vs-hoard`, `daily-30min` |
| [A04-0011](../research/facts/A04/A04-0011.md) | Mysterious Merchant / Courier Station: 5 refreshes per visit, 1 free refresh per 24h; buy  | verificado | media | majoritario | sim | `daily-30min` |
| [A05-0001](../research/facts/A05/A05-0001.md) | VIP points needed per VIP level (VIP 1–18) | verificado | media | n/a | sim | `d15-vip6-milestone`, `d41-vip10-reality` |
| [A05-0003](../research/facts/A05/A05-0003.md) | Daily free VIP points: 40 on day 1, +20 per consecutive day, capped at 200/day; missing a  | verificado | media | n/a | sim | `d0-first-gems-vip`, `daily-15min`, `daily-break-mode`, `mistakes-economy` |
| [A05-0004](../research/facts/A05/A05-0004.md) | F2P sources of VIP points (daily chest, gems 1:1, alliance shop, alliance gifts, Mysteriou | verificado | media | n/a | sim | `d0-join-alliance`, `d0-first-gems-vip` |
| [A05-0006](../research/facts/A05/A05-0006.md) | Daily free VIP chest contents by level; legendary commander sculptures from VIP 10 (1/day) | verificado | media | n/a | sim | `d0-first-gems-vip`, `d15-vip6-milestone`, `daily-15min` |
| [A05-0007](../research/facts/A05/A05-0007.md) | Realistic F2P VIP: days to reach VIP 5/6/7/8/10 from daily chest alone vs daily chest + 10 | verificado | baixa | n/a | não | `ov-budget-reality-check`, `d15-vip6-milestone`, `d41-vip10-reality` |
| [A05-0008](../research/facts/A05/A05-0008.md) | F2P VIP target: spend free gems on VIP to reach VIP 6 early, then VIP 10 (majority) vs. ne | verificado | media | majoritario | sim | `d0-first-gems-vip` |
| [A06-0500](../research/facts/A06/A06-0500.md) | F2P: concentrate on one complete march instead of spreading sculptures | verificado | media | unanime | sim | `d4-early-commanders`, `d15-commander-checklist`, `pk-kvk1-readiness`, `mistakes-economy`, `recovery-zeroed` |
| [A06-0501](../research/facts/A06/A06-0501.md) | Sun Tzu (epic) is the safest early F2P investment | verificado | media | majoritario | sim | `d0-civilization`, `d4-early-commanders`, `d15-expedition-aethelflaed`, `pk-kvk1-readiness` |
| [A06-0502](../research/facts/A06/A06-0502.md) | Yi Seong-Gye (YSG) is the top F2P legendary target | verificado | media | majoritario | sim | `d15-commander-checklist`, `ev-wheel-of-fortune` |
| [A06-0503](../research/facts/A06/A06-0503.md) | Mid-tier legendaries (Richard I, Charles Martel, Cao Cao): divided | verificado | baixa | dividido | não | `d15-commander-checklist` |
| [A06-0504](../research/facts/A06/A06-0504.md) | Aethelflaed is a free legendary obtainable via Expedition Store | verificado | media | majoritario | sim | `d15-commander-checklist`, `d15-expedition-aethelflaed` |
| [A06-0505](../research/facts/A06/A06-0505.md) | Early barbarian/PvE commander: level only one of Boudica or Lohar; no gold sculptures | verificado | media | majoritario | sim | `d4-early-commanders` |
| [A06-0506](../research/facts/A06/A06-0506.md) | Level a gathering commander to 37 early (Centurion first) | verificado | baixa | majoritario | não | `d4-early-commanders` |
| [A06-0508](../research/facts/A06/A06-0508.md) | Pelagius (legendary) as an early-server pick: divided | verificado | baixa | dividido | não | `d4-pelagius-day5` |
| [A06-0509](../research/facts/A06/A06-0509.md) | Long-term value of epic commanders: divided | verificado | baixa | dividido | não | `d4-early-commanders` |
| [A06-0510](../research/facts/A06/A06-0510.md) | Reserve universal (gold) sculptures and tomes for one long-term legendary | verificado | media | majoritario | sim | `d15-commander-checklist`, `mistakes-economy` |
| [A06-0512](../research/facts/A06/A06-0512.md) | F2P should favor open-field (fighting, AoE) commanders over rally/garrison | verificado | baixa | fonte_unica | não | `pk-kvk1-behaviour` |
| [A06-0513](../research/facts/A06/A06-0513.md) | Pairs suggested for an F2P first KvK | verificado | baixa | dividido | não | `pk-kvk1-behaviour` |
| [A06-0516](../research/facts/A06/A06-0516.md) | Alliance gift chests are a major F2P sculpture/gem source — join a spending alliance | verificado | media | unanime | sim | `ov-budget-reality-check`, `d0-new-kingdom-start`, `d0-join-alliance` |
| [A07-0500](../research/facts/A07/A07-0500.md) | Early F2P equipment: cheap green/blue sets; epic as KvK baseline; legendary later | verificado | media | majoritario | sim | `d15-equipment`, `pk-kvk1-readiness` |
| [A07-0501](../research/facts/A07/A07-0501.md) | Hoard legendary materials; don't burn them on early gear | organizado | baixa | majoritario | não | `d15-equipment` |
| [A07-0504](../research/facts/A07/A07-0504.md) | Legendary over epic gives small marginal gain per piece | verificado | baixa | fonte_unica | não | `d15-equipment` |
| [A08-0500](../research/facts/A08/A08-0500.md) | T4 is the troop tier for an F2P first KvK; T5 is a long-term goal | verificado | media | majoritario | sim | `ov-budget-reality-check`, `d41-ch21-t4` |
| [A08-0502](../research/facts/A08/A08-0502.md) | Hospital overflow kills troops; keep capacity and heal-speedups | verificado | media | unanime | sim | `d0-day1-survival`, `d41-hospital`, `pk-kvk1-readiness`, `pk-kvk1-behaviour`, `mistakes-economy`, `recovery-zeroed` |
| [A08-0503](../research/facts/A08/A08-0503.md) | F2P combat behavior: never lead, stay behind, retreat early, fill rallies | verificado | media | majoritario | sim | `ov-budget-reality-check`, `pk-kvk1-behaviour`, `mistakes-economy` |
| [A08-0504](../research/facts/A08/A08-0504.md) | Run fewer, complete marches rather than all march slots | organizado | media | majoritario | não | `pk-kvk1-behaviour` |
| [A08-0505](../research/facts/A08/A08-0505.md) | T5 heals cost much more; without strong economy fight with T4 | verificado | media | majoritario | sim | `d41-hospital` |
| [A08-0506](../research/facts/A08/A08-0506.md) | Choose one troop type for T5 (infantry or cavalry first) | verificado | media | majoritario | sim | `d15-research-military`, `d15-commander-checklist`, `pk-kvk1-readiness` |
| [A09-0001](../research/facts/A09/A09-0001.md) | Action Points: cap 1,500 (raised from 1,000 in 1.0.41, Dec 2020) plus a claimable 500 AP/d | verificado | alta | n/a | sim | `ov-patch-state`, `d0-ap-discipline`, `mistakes-economy` |
| [A09-0002](../research/facts/A09/A09-0002.md) | Barbarian attack cost: 50 AP, −2 AP per consecutive attack without returning (max −10), fu | verificado | media | n/a | sim | `d0-ap-discipline`, `daily-60min` |
| [A09-0004](../research/facts/A09/A09-0004.md) | Barbarian level unlocks: personal (beat previous level) and kingdom-wide (only Lv.1–6 at k | verificado | media | n/a | sim | `d0-ap-discipline` |
| [A09-0005](../research/facts/A09/A09-0005.md) | Barbarian Forts: rally-only; Lv.1–5 recommended troops and alliance gift keys; ~50% chance | verificado | media | n/a | sim | `d0-join-alliance`, `daily-60min` |
| [A09-0006](../research/facts/A09/A09-0006.md) | Free AP recovery items for F2P: 100 AP daily (Daily Objectives 60-pt chest), 30×100 AP wee | verificado | media | n/a | sim | `d0-ap-discipline`, `daily-15min`, `daily-weekly` |
| [A09-0007](../research/facts/A09/A09-0007.md) | AP spending strategy for F2P: never cap AP; forts for Books of Covenant until Castle 25; b | verificado | media | majoritario | sim | `d0-ap-discipline`, `pk-eve-of-crusade`, `daily-15min`, `ev-lohar-ap`, `mistakes-economy` |
| [A09-0008](../research/facts/A09/A09-0008.md) | Built-in auto-peacekeeping (automatic barbarian hunting) exists; third-party scripts are p | verificado | alta | n/a | sim | `ov-patch-state`, `d0-day1-survival`, `pk-eve-of-crusade`, `daily-15min` |
| [A10-0001](../research/facts/A10/A10-0001.md) | Daily Objectives: tasks, activity points and chest thresholds (20/40/60/80/100) — list par | parcialmente_obsoleto | baixa | n/a | não | `d41-speedups-spend-vs-hoard`, `daily-30min` |
| [A10-0002](../research/facts/A10/A10-0002.md) | Consolidated F2P daily/weekly checklist (tasks, frequency/cap, yield, dependency) — minute | verificado | baixa | majoritario | não | `d4-research-economy` |
| [A10-0003](../research/facts/A10/A10-0003.md) | Tavern: daily free silver chests (3 → 10 by Tavern level) and free golden chest interval ( | verificado | media | n/a | sim | `daily-30min` |
| [A10-0004](../research/facts/A10/A10-0004.md) | Expedition: 3-star missions give a free daily claim; Medal Shop (1 free refresh/day, then  | verificado | media | n/a | sim | `d15-commander-checklist`, `d15-expedition-aethelflaed`, `daily-30min` |
| [A10-0005](../research/facts/A10/A10-0005.md) | Peerless Scholar (Lyceum of Wisdom, CH10): one Mock Exam per weekday; Preliminary and Fina | verificado | alta | n/a | sim | `d4-ch8-ch12-checkpoints`, `daily-60min`, `daily-weekly`, `ev-calendar-rule` |
| [A10-0006](../research/facts/A10/A10-0006.md) | Alliance help: each help fills 1% of the bar; times you can be helped = Alliance Center le | verificado | alta | n/a | sim | `d0-join-alliance`, `daily-15min` |
| [A10-0008](../research/facts/A10/A10-0008.md) | Sunset Canyon: daily free attempts (VIP adds +1…+5); top-5 daily rank gives Golden Key rew | verificado | media | n/a | sim | `daily-60min` |
| [A11-0500](../research/facts/A11/A11-0500.md) | MGE: F2P should take milestone rewards, not chase ranking | verificado | media | majoritario | sim | `ov-budget-reality-check`, `ev-mge` |
| [A11-0501](../research/facts/A11/A11-0501.md) | Hoard speedups/resources/AP for scored events and KvK instead of spending as they come | verificado | media | majoritario | sim | `d41-speedups-spend-vs-hoard`, `pk-kvk1-readiness` |
| [A11-0502](../research/facts/A11/A11-0502.md) | More Than Gems: the best window to spend gems; F2P target 7k/day tier | verificado | media | majoritario | sim | `d15-vip6-milestone`, `d41-vip10-reality`, `ev-calendar-rule`, `ev-more-than-gems` |
| [A11-0503](../research/facts/A11/A11-0503.md) | Wheel of Fortune: F2P do the first 10 spins on a commander they need | parcialmente_obsoleto | baixa | majoritario | não | `ev-calendar-rule`, `ev-wheel-of-fortune` |
| [A11-0504](../research/facts/A11/A11-0504.md) | Gem spending priority for F2P: VIP first | verificado | media | majoritario | sim | `d15-vip6-milestone`, `ev-more-than-gems` |
| [A11-0505](../research/facts/A11/A11-0505.md) | Lohar's Trial is a high-value event for F2P; save AP for it | verificado | media | majoritario | sim | `d0-ap-discipline`, `ev-lohar-ap` |
| [A11-0506](../research/facts/A11/A11-0506.md) | F2P priority events: guaranteed-milestone & alliance PvE events | verificado | baixa | majoritario | não | `ev-priorities` |
| [A11-0507](../research/facts/A11/A11-0507.md) | Sunset Canyon: daily free attempts; push before season reset | verificado | baixa | minoritario | não | `ev-calendar-rule` |
| [A11-0508](../research/facts/A11/A11-0508.md) | Ark of Osiris value for F2P: divided | verificado | baixa | dividido | não | `ev-calendar-rule`, `ev-priorities` |
| [A11-0509](../research/facts/A11/A11-0509.md) | Champions of Olympia called the most F2P-friendly mode | verificado | baixa | minoritario | não | `ev-priorities` |
| [A11-0510](../research/facts/A11/A11-0510.md) | Pioneer / Road to Revival (~day 20–23): buy the 4 gold keys | verificado | baixa | fonte_unica | não | `ev-calendar-rule`, `ev-priorities` |
| [A11-0511](../research/facts/A11/A11-0511.md) | Events which F2P should skip | verificado | baixa | majoritario | não | `ov-budget-reality-check`, `ev-priorities` |
| [A11-0512](../research/facts/A11/A11-0512.md) | Event schedule is not fixed — plan from the in-game calendar | verificado | media | unanime | sim | `daily-60min`, `daily-weekly`, `ev-calendar-rule` |
| [A11-0513](../research/facts/A11/A11-0513.md) | Events confirmed as current in 2026 sources | verificado | media | n/a | sim | `ev-calendar-rule`, `ev-lohar-ap` |
| [A12-0001](../research/facts/A12/A12-0001.md) | Growth Fund: $15 one-time, ~81,000 gems, full value needs CH24 | verificado | media | unanime | sim | `ov-budget-reality-check`, `d0-first-gems-vip`, `d41-vip10-reality` |
| [A12-0002](../research/facts/A12/A12-0002.md) | Supply Depot (30-day gem supply): ~$10, ~19,500 gems | verificado | media | majoritario | sim | `ov-budget-reality-check`, `d15-vip6-milestone`, `d41-vip10-reality`, `ev-more-than-gems` |
| [A12-0005](../research/facts/A12/A12-0005.md) | Low-spender spending discipline | verificado | media | majoritario | sim | `ov-budget-reality-check`, `d41-vip10-reality`, `ev-more-than-gems` |
| [A13-0001](../research/facts/A13/A13-0001.md) | Accounts per kingdom via Character Management | organizado | media | n/a | não | `farm-brief` |
| [A13-0002](../research/facts/A13/A13-0002.md) | Farm City Hall targets by march queues | verificado | media | majoritario | sim | `farm-brief` |
| [A13-0003](../research/facts/A13/A13-0003.md) | Farm Trading Post level targets | verificado | media | majoritario | sim | `farm-brief` |
| [A13-0005](../research/facts/A13/A13-0005.md) | Farm risks: raids, kill events, zeroing | verificado | media | majoritario | sim | `d0-day1-survival`, `daily-break-mode`, `farm-brief`, `mistakes-economy`, `recovery-zeroed` |
| [A13-0010](../research/facts/A13/A13-0010.md) | Purpose of farms for main growth (F2P) | verificado | media | majoritario | sim | `farm-brief` |
| [A14-0001](../research/facts/A14/A14-0001.md) | Civilization bonuses, starting commanders and special units (15 civilizations) — table | verificado | media | n/a | sim | `d0-civilization` |
| [A14-0002](../research/facts/A14/A14-0002.md) | Changing civilization: free item at CH10; otherwise 10,000 gems (Shop) or 2M individual cr | verificado | alta | n/a | sim | `ov-patch-state`, `d0-civilization`, `d4-ch8-ch12-checkpoints`, `d15-ch10-ch17` |
| [A14-0003](../research/facts/A14/A14-0003.md) | Civilization choice for an early F2P: China (building speed + AP + Sun Tzu) is the most re | verificado | media | majoritario | sim | `d0-civilization`, `pk-kvk1-readiness` |
| [B01-0500](../research/facts/B01/B01-0500.md) | First KvK starts when kingdom is ~85–100 days old | verificado | media | majoritario | sim | `ov-budget-reality-check`, `d0-new-kingdom-start` |
| [B01-0502](../research/facts/B01/B01-0502.md) | KvK durations and gaps | contestado | baixa | n/a | não | `pk-kvk1-readiness` |
| [B01-0503](../research/facts/B01/B01-0503.md) | Lost Kingdom (KvK1) entry needs City Hall 17; opens after Eve of the Crusade | parcialmente_obsoleto | baixa | n/a | não | `d15-ch10-ch17`, `pk-eve-of-crusade` |
| [B01-0506](../research/facts/B01/B01-0506.md) | New kingdoms: the F2P–spender gap is largest early; first 60–90 days set hierarchy | verificado | baixa | majoritario | não | `ov-budget-reality-check`, `d0-new-kingdom-start` |
| [B01-0700](../research/facts/B01/B01-0700.md) | Player reports (2026): F2P accounts typically enter KvK1 below CH25 (CH21–22 is workable); | verificado | baixa | majoritario | não | `ov-budget-reality-check`, `d41-ch21-t4` |
| [C04-0001](../research/facts/C04/C04-0001.md) | Current game version as of 2026-10-13 | bruto | media | n/a | não | `ov-patch-state` |
| [C04-0002](../research/facts/C04/C04-0002.md) | 1.1.12: Radiant Rivalry 1v1 kingdom event and early-season Lost Kingdom changes (unverifie | bruto | baixa | n/a | não | `pk-eve-of-crusade` |
| [C04-0004](../research/facts/C04/C04-0004.md) | 1.1.09: resource boost items and Deceptive Troops removed; VIP production buffs raised | bruto | alta | n/a | não | `ov-patch-state`, `d4-gathering-setup`, `mistakes-outdated-advice` |
| [C04-0005](../research/facts/C04/C04-0005.md) | 1.1.09: Legendary Pelagius event for new kingdoms from day 5 | bruto | alta | n/a | não | `ov-patch-state`, `d0-civilization`, `d4-pelagius-day5`, `ev-calendar-rule` |
| [C04-0006](../research/facts/C04/C04-0006.md) | 1.1.07: Conduct Score anti-script/cheat system | bruto | alta | n/a | não | `ov-patch-state`, `farm-brief`, `mistakes-outdated-advice` |
| [C04-0008](../research/facts/C04/C04-0008.md) | 1.1.06: immigration age limits tightened; same-season immigration restricted for new kingd | bruto | alta | n/a | não | `d0-new-kingdom-start`, `recovery-zeroed` |
| [C04-0010](../research/facts/C04/C04-0010.md) | Legendary equipment respec: special talent reset and full-refund dismantle | bruto | alta | n/a | não | `ov-patch-state`, `d15-equipment` |
| [C04-0022](../research/facts/C04/C04-0022.md) | Wheel of Fortune now requires Spin Tickets (S3/SoC 2025, S2 2025, S1 2026) | bruto | alta | n/a | não | `ov-patch-state`, `d15-commander-checklist`, `ev-wheel-of-fortune`, `mistakes-outdated-advice` |
| [C04-0023](../research/facts/C04/C04-0023.md) | 1.0.90: Armament Conversion, Legendary Commander Swap, Gathering of Heroes | bruto | alta | n/a | não | `ov-patch-state`, `d15-commander-checklist` |
| [C04-0024](../research/facts/C04/C04-0024.md) | 1.0.87: VIP19 and SVIP added | bruto | alta | n/a | não | `mistakes-outdated-advice` |
| [C04-0026](../research/facts/C04/C04-0026.md) | Beginner's Immigration (jumping) removed for new accounts from 2025-03-26 | bruto | media | n/a | não | `ov-patch-state`, `d0-new-kingdom-start`, `mistakes-outdated-advice`, `recovery-zeroed` |
| [C04-0028](../research/facts/C04/C04-0028.md) | 1.0.89: Hall of Heroes refunds part of KvK healing resources; Realm of Mystique | bruto | alta | n/a | não | `d41-hospital` |
| [C04-0032](../research/facts/C04/C04-0032.md) | 1.1.02: daily AP claim can exceed cap; Army Groups for all SoC alliances | bruto | alta | n/a | não | `ov-patch-state`, `d0-ap-discipline`, `daily-15min` |
| [C04-0033](../research/facts/C04/C04-0033.md) | Kingdom lifecycle: Preparation Season → Season 1 → Season 2 → Season 3 → Season of Conques | bruto | media | n/a | não | `ov-patch-state`, `d0-new-kingdom-start` |

### Lacunas referenciadas (medição ou pesquisa pendente)

| Lacuna | Descrição | Impacto | Blocos |
|---|---|---|---|
| L-A01-01 | Early unlock levels: Academy (CH4 vs CH6), first Quarry (CH4 vs CH6), Trading Post (CH10 vs CH12) | medio | `d0-build-order`, `d4-ch8-ch12-checkpoints`, `d4-research-economy`, `open-pending-measurements` |
| L-A01-02 | No T0/T1 confirmation of the CH1→CH25 requirement table and raw times (only Fandom, 2018 developer dataset) | alto | `d0-build-order`, `d15-ch10-ch17` |
| L-A01-03 | Consolidated building-speed buff stack (research, alliance tech, VIP, civ, help) → real build time to CH17/CH21/CH22 | alto | `d0-build-order`, `d15-ch10-ch17`, `d41-ch21-t4`, `open-pending-measurements` |
| L-A02-01 | Current tech names and an ordered F2P research path with times (only 2019 AllClash order + 2026 commercial guide) | alto | `d4-research-economy`, `d15-research-military` |
| L-A02-02 | Quantitative speedup allocation: research vs City Hall vs hoarding for events | alto | `d41-speedups-spend-vs-hoard`, `open-pending-measurements` |
| L-A02-03 | Research speed buffs and time to T4 (Academy 21 path) for a F2P | alto | `ov-budget-reality-check`, `d15-research-military`, `d41-ch21-t4`, `open-pending-measurements` |
| L-A03-01 | Resource amount per node level (L1–L6) and base gathering speed per resource | alto | `d4-gathering-setup` |
| L-A03-02 | Measured gathering yield per hour/day by CH stage (needed for value-per-minute) | alto | `d4-gathering-setup` |
| L-A03-03 | Gold via Trading Post: confirm in-game and check if gold assistance needs a Trading Post level | medio | `farm-brief` |
| L-A03-04 | Trading Post capacity L1–L24 (Fandom only) and unlock CH | medio | `d4-ch8-ch12-checkpoints` |
| L-A03-05 | Storehouse protection L6–L24 (Fandom vs riseofkingdomsguides differ 10–35%) | medio | `d0-day1-survival` |
| L-A04-01 | Real F2P gem income per day (barbarian gem drops, quests, events, alliance gifts) — only 100/day is guaranteed | alto | `ov-budget-reality-check`, `d0-first-gems-vip`, `d15-vip6-milestone`, `d41-vip10-reality`, `open-pending-measurements` |
| L-A04-04 | Speedup income per day by source (Daily Objectives 170 min derived from a 2020 wiki revision) | alto | `d41-speedups-spend-vs-hoard`, `daily-30min`, `open-pending-measurements` |
| L-A04-05 | Peerless Scholar gem pool size and typical share | medio | `daily-60min` |
| L-A05-01 | Are VIP thresholds cumulative? (T4 says yes) | medio | `ov-budget-reality-check`, `d0-first-gems-vip`, `d15-vip6-milestone` |
| L-A05-03 | VIP point income from alliance gifts/caves for an F2P | medio | `d0-join-alliance`, `d41-vip10-reality` |
| L-A06-01 | Current F2P pairs-by-role table for KvK1 (2026 commanders) | alto | `d4-early-commanders`, `d15-commander-checklist`, `pk-kvk1-behaviour` |
| L-A06-02 | Free/kingdom-gated legendary acquisition routes and timing (Minamoto, Pelagius day 5, Aethelflaed medals, kingdom events) | alto | `d4-pelagius-day5`, `d15-commander-checklist` |
| L-A06-03 | Sculpture income per week for F2P (epic + legendary) — limits any commander plan | alto | `d4-early-commanders`, `d15-commander-checklist`, `open-pending-measurements` |
| L-A07-01 | Blueprint sources, crafting time and material income/day for an epic set by KvK1 | alto | `d15-equipment` |
| L-A08-01 | Heal vs retrain cost (resources/time) T4 vs T5 | medio | `d41-hospital`, `recovery-zeroed` |
| L-A08-02 | Hospital capacity target for KvK1 (F2P) | medio | `d41-hospital`, `pk-kvk1-readiness` |
| L-A08-03 | Severe-wound/death rules (official text) | medio | `d41-hospital`, `recovery-zeroed` |
| L-A09-01 | Base AP regeneration rate per hour | alto | `d0-ap-discipline`, `daily-weekly`, `open-pending-measurements` |
| L-A09-02 | Daily AP claim amount in 2026 (T1 2020 says 500) | medio | `d0-ap-discipline` |
| L-A09-03 | Fort rally AP cost; fort reward tiers 6–10 | medio | `daily-60min` |
| L-A09-04 | Auto-peacekeeping unlock level and whether it keeps the −2 AP streak discount | medio | `daily-15min` |
| L-A09-05 | Kingdom-wide barbarian level unlock schedule by day | medio | `d0-ap-discipline` |
| L-A10-01 | Minutes per daily task (no source anywhere) | alto | `daily-15min`, `daily-30min`, `daily-60min`, `daily-weekly`, `daily-break-mode`, `open-pending-measurements` |
| L-A10-02 | Current Daily Objectives task list and points after 1.1.09 (login, alliance donation tasks) | alto | `daily-30min`, `open-pending-measurements` |
| L-A10-03 | Sunset Canyon unlock level and base free attempts | baixo | `daily-60min` |
| L-A10-04 | Expedition medals/day; Mysterious Merchant visit frequency | baixo | `d15-expedition-aethelflaed` |
| L-A11-01 | Day of first occurrence in a new kingdom for MGE, More Than Gems, Lohar/Arms Training, Wheel of Fortune, Ceroli, Golden Kingdom, Karuak, Ark of Osiris, Sunset Canyon | alto | `ev-calendar-rule`, `ev-more-than-gems`, `ev-lohar-ap`, `open-pending-measurements` |
| L-A11-02 | Reward tables and time cost per event (value per hour) | alto | `ev-more-than-gems`, `ev-lohar-ap`, `ev-priorities` |
| L-A11-03 | Wheel of Fortune pricing in the home kingdom (gems vs Spin Tickets) | medio | `d15-commander-checklist`, `ev-wheel-of-fortune` |
| L-A11-04 | Current MGE format (commander-specific rewards, ranking caps, kingdom rules) | medio | `ev-mge` |
| L-A12-02 | Official VIP points per $ and Growth Fund milestone table | medio | `d15-vip6-milestone` |
| L-A13-01 | Minutes per farm per day and yield/day by farm CH | alto | `farm-brief` |
| L-A13-02 | Official policy on farms/multiple accounts | medio | `farm-brief` |
| L-A13-03 | Resource-pair farms — no source; only derived reasoning | medio | `farm-brief` |
| L-A14-01 | Mechanics/cost of CH16 civilization buff switching (1.1.01) | medio | `d0-civilization` |
| L-A14-02 | Spain re-evaluated after Legendary Pelagius day-5 event | medio | `d0-civilization`, `d4-pelagius-day5` |
| L-A14-03 | Quantified value of +5% building speed over the CH chain | baixo | `d0-civilization` |
| L-B01-01 | Official/T0 Monument (Kingdom Chronicles) timeline with dates | alto | `ev-calendar-rule` |
| L-B01-02 | Official season day counts (Preparation Season, KvK1) | alto | `ov-budget-reality-check`, `d0-new-kingdom-start`, `pk-kvk1-readiness` |
| L-B01-03 | Lost Kingdom entry requirement (CH17, single T3) and Eve of the Crusade timing for Season 1 after 1.1.12 | alto | `pk-eve-of-crusade`, `open-pending-measurements` |
| L-B01-04 | Radiant Rivalry (1v1 kingdom event in new kingdoms, pioneer) — rules and timing | medio | `ov-patch-state` |
| L-B05-01 | Current MGE stage count/durations and rank sculpture table (Fandom vs riseofkingdomsguides conflict) | medio | `ev-mge` |
| L-B06-03 | Migration rules changed in 1.1.10–1.1.12 (no official EN notes); mail Lilith sent then deleted (Aug 2026) | alto | `recovery-zeroed` |
| PROPOSED-SHIELDS | Shield durations/costs and beginner protection rules: no fact card exists yet (proposed gap, to be added by the research side) | alto (proposed) | `d0-day1-survival`, `daily-break-mode`, `recovery-zeroed`, `open-pending-measurements` |

### Confiança dos blocos

baixa: 5, média: 37, pendente: 1

### Contradições conhecidas na pesquisa (nesta versão)

- **Tempo até o T4:** relatos de jogadores de 2026 dizem que o T4 chega "por volta do dia 30" ([B01-0700](../research/facts/B01/B01-0700.md)), mas o orçamento bruto derivado de construção até a Prefeitura 21 (desbloqueio do T4) é de cerca de 163 dias de construtor ([A01-0005](../research/facts/A01/A01-0005.md)). Ambos são `baixa`; o T0 resolve (L-A02-03).
- **Níveis de desbloqueio iniciais:** Academia e primeira Pedreira na Prefeitura 4 ou 6, Entreposto Comercial na 10 ou 12 ([A01-0009](../research/facts/A01/A01-0009.md), [A03-0025](../research/facts/A03/A03-0025.md)); a tabela de Prefeituras do Fandom ainda lista o Entreposto Comercial na 10.
- **Duração da KvK:** 60 dias (T3 de 2024) contra 50 dias (T4 de 2026) ([B01-0502](../research/facts/B01/B01-0502.md)).
- **Gastar gemas em VIP:** maioria diz que sim, AllClash (2020) diz que não ([A05-0008](../research/facts/A05/A05-0008.md)).
- **Valor da coleta diária de PA:** 500 PA segundo a 1.0.41 oficial (2020); a nota da 1.1.02 não o repete ([A09-0006](../research/facts/A09/A09-0006.md), L-A09-02).
- **As fichas de estado de patch** (C04) ainda são `bruto`, embora os pacotes de contexto tratem a maioria delas como fatos T1.
