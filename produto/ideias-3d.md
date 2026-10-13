# 3D no megahub — ideias e critérios

Pedido do Victor (2026-10-13): usar 3D no sistema. Princípio: **3D só onde ele melhora a função ou a identidade**, nunca como decoração que pesa no celular do jogador (que está com o jogo aberto ao lado).

## Critérios obrigatórios
1. **Desempenho:** carregar o 3D sob demanda (lazy), nunca no caminho crítico; orçamento de ~150 KB de JS a mais na tela que usar 3D; testar em Android de entrada.
2. **Fallback 2D:** imagem estática quando não houver WebGL, em economia de bateria ou com `prefers-reduced-motion`.
3. **Arte original:** nada de modelos, retratos de comandantes, mapas ou brasões da Lilith (ToS). Modelos próprios ou de bibliotecas com licença livre.
4. **Acessibilidade:** toda informação mostrada em 3D também existe em texto/2D.

## Ideias, do mais barato ao mais caro

| ID | Ideia | Onde | Tecnologia | Esforço | Valor |
|----|-------|------|------------|---------|-------|
| F-60 | **Cartão de perfil com inclinação 3D e brilho holográfico** (efeito de carta colecionável ao mover o dedo/mouse; raridade visual por marcos da conta) | Identidade (F-10) | CSS 3D transforms + gradientes; sensor de giro no celular | S | Alto: identidade + compartilhamento |
| F-61 | **Brasão 3D da aliança** — o brasão do editor (F-09) vira um escudo com relevo e material metálico, girável; exporta PNG em ângulo escolhido para o avatar (F-08) | Identidade | Three.js / React Three Fiber, geometria gerada a partir do SVG (extrusão) | M | Alto: identidade de aliança (ainda sem evidência → depende do teste de F-06) |
| F-62 | **Torre de progresso da conta** — a Prefeitura/conta como uma torre que ganha andares a cada nível de CH, marcos e metas até o KvK; toque num andar mostra o que falta | Conta (planner, F-14) | R3F com modelo low-poly próprio | M | Médio: motivação e visão do progresso |
| F-63 | **Hero 3D da landing** — "mesa de guerra" com peças e mapa estilizado original, para a página inicial e marketing | Plataforma (F-57) | Spline (export) ou R3F | S–M | Médio: primeira impressão; zero valor funcional |
| F-64 | **Mapa de planejamento de KvK em 2.5D/3D** — mapa esquemático original (zonas, passes, estruturas) onde líderes marcam alvos, rotas e horários; camadas por aliança | Reino (planejamento de KvK) | R3F ou Deck.gl/MapLibre em modo 2.5D | L | Potencialmente alto para líderes, mas precisa validação (entrevistas) e não pode copiar o mapa do jogo |

Fora: gráficos de dados em 3D (pioram a leitura), retratos 3D de comandantes (assets da Lilith).

## Recomendação
- **MVP/R1:** F-60 (barato, reforça identidade e compartilhamento) e F-63 só se sobrar tempo.
- **R2:** F-61 junto com o editor de brasão, **se** o teste de identidade de aliança (F-06) passar.
- **R3:** F-62 e F-64 após validação com usuários/líderes.

## Stack proposta
- CSS 3D para efeitos leves (F-60).
- React Three Fiber + drei (Three.js) para cenas (F-61, F-62, F-64).
- Spline apenas para protótipos visuais/landing (exporta cena, mas gera dependência e peso).
- Modelos em glTF/GLB comprimidos (Draco/Meshopt).

## Raridade do cartão de perfil (F-60) — v2 simplificada (2026-10-13)

Decisão: a v1 (vários marcos + metas por perfil de gasto) foi considerada complexa demais pelo Victor. A v2 usa **um único número: o nível da Prefeitura (City Hall)**.

| Raridade | City Hall | Significado no jogo | Base na pesquisa |
|----------|-----------|---------------------|------------------|
| Common | 1–16 | construindo a conta | — |
| Rare | 17–21 | pronto para o primeiro KvK | KvK1 exige CH17 (`context/early-kingdom-timeline-and-events.md`) |
| Epic | 22–24 | fim de jogo | farms param em CH22 (A13); faixa intermediária |
| Legendary | 25 | Prefeitura máxima, pronto para Season of Conquest | SoC exige CH25 (C04) |

Prova: 1 print da Prefeitura dá o selo **Verified**; sem print, "Self-reported". Contas F2P recebem a marca **F2P Achiever**. Visual de cada nível igual à v1.

Trade-off aceito: a raridade mede progresso, não habilidade; quem gasta chega antes, mas todos podem chegar ao Legendary.

### Proposta v1 (substituída)

Visual: cada nível adiciona uma camada (Common fosco/ferro → Rare moldura prateada → Epic foil violeta + moldura animada + brilhos → Legendary foil arco-íris + moldura de ouro animada + varredura de luz + aura). Prévia: `prototipos/cartao-perfil-raridades.png`.

| Raridade | Marcos da conta | Prova |
|----------|-----------------|-------|
| Common | Perfil criado | nenhuma |
| Rare | CH ≥ 22, T4 liberado, 1 comandante com expertise | autodeclarado |
| Epic | CH 25, T5 liberado, 3 comandantes com expertise, 1 KvK completo | prints verificados pelo hub |
| Legendary | Marcos do Epic + 2 KvKs completos + meta de kills/mortes **proporcional ao perfil de gasto** | prints verificados pelo hub |

Regras de design:
- A raridade nunca mede dinheiro; metas escalam com o perfil de gasto (evita reforçar a dor D-0001 "pay-to-win").
- Conta F2P que atinge um nível ganha a marca **F2P Achiever**.
- Epic e Legendary exigem prova, senão viram autodeclaração inflada e perdem valor.

Pendências: thresholds são proposta do admin, não vêm da pesquisa; metas de kills/mortes por perfil precisam de dados; a verificação por print depende do OCR (F-54) e do teste T0-A4.
