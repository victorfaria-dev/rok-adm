# Skills para o frontend

Decisão do Victor (2026-10-13): a identidade visual está pronta (`design/brand/`, tokens em `design/tokens/tokens.css`, uso em `design/styleguide.html`). O frontend usa três skills como referência. Este arquivo diz o que pegar de cada uma, onde elas brigam entre si ou com a nossa marca e quem ganha.

| Skill | Repositório | Versão lida |
|-------|-------------|-------------|
| taste-skill (`design-taste-frontend`) | https://github.com/leonxlnx/taste-skill | `d237dd3` (2026-10-11) |
| impeccable | https://github.com/pbakaus/impeccable | v4.5.2, `245ad82` (2026-10-12) |
| emilkowalski/skills | https://github.com/emilkowalski/skills | `2d22863` (2026-10-11) |

**Regra geral: tokens e marca ganham.** Quando uma skill manda algo diferente de `tokens.css`, do kit em `design/brand/` ou do `styleguide.html`, vale o nosso. As três skills dizem isso de algum jeito (taste: "brand assets are starting material"; impeccable: "the brief wins"; Emil: "use the codebase's tokens, don't fork a new curve").

## 1. O que cada skill cobre

| Skill | Cobre | Não cobre / fora de escopo |
|---|---|---|
| **taste-skill** | Anti-"cara de IA" em landing pages e portfólios: leitura do brief, três "dials" (variância, movimento, densidade), tipografia, cor, layout de hero e seções, estados de UI, copy, checklist pré-entrega. Sub-skills (`redesign`, `minimalist`, `brutalist`, `imagegen-*`, `output-skill`) são variações. | Ela mesma exclui dashboards, tabelas, formulários de várias etapas e UI de produto (§13). Para nós vale só na Home e nas páginas de divulgação (F-57). |
| **impeccable** | Qualidade de interface em geral: 4 modos de tela (Persuade, Operate, Read, Experience), "craft floor" (contraste, espaçamento, tipo, estados, superfícies do navegador), comandos `audit`, `critique`, `polish`, `harden`, `adapt`, `onboard`, `typeset`, `layout`, `colorize`, `animate`, e um detector CLI com 59 regras (`npx impeccable detect`). | Não escolhe a direção visual (diz para seguir o mundo já decidido). O fluxo dela espera `PRODUCT.md`/`DESIGN.md` na raiz, que não temos (ver §3). |
| **emilkowalski/skills** | Detalhe de interação: decidir se anima, curva, duração, interrupção, `prefers-reduced-motion` (`emil-design-eng`, `animate`, `animation-performance`); web que parece app no celular (`mobile-native`); dados de pior caso (`break-ui`); bibliotecas recomendadas (`pick-ui-library`). | `animate-expo` e `write-swift` são de app nativo; não se aplicam. |

Papel de cada uma: **impeccable é a base** (vale em toda tela), **Emil é a camada de toque e movimento** (vale em todo componente interativo), **taste é o filtro anti-clichê** das telas de vitrine.

## 2. Regras que aplicamos

### Da impeccable

- **Modo por tela.** Home e páginas de divulgação = *Persuade*. Guias (F-02, F-12) e Trust (F-56) = *Read*. Questionário (F-01), rotina (F-15), checklist de comandante (F-20) e configurações = *Operate*. Em Operate e Read a marca entra por tipo, paleta, densidade e um "movimento assinatura" (para nós, o chanfro); navegação e controles são os padrões da web.
- **Craft floor** em toda tela: contraste ≥ 4,5:1 (texto) e ≥ 3:1 (texto grande, ícones, anel de foco); medida de texto 65–75ch; mais espaço acima de um título que abaixo; estados hover, foco, ativo, desabilitado, carregando, erro e vazio.
- **Superfícies do navegador** com a paleta: `::selection`, `caret-color`, `accent-color` (checkboxes da rotina), `scrollbar-color`, anel de foco `--ko-focus`, `font-variant-numeric: tabular-nums` em números.
- **Proibidos:** cards iguais com ícone + título + texto como estrutura de página; cards dentro de cards; *eyebrow* (rótulo pequeno acima do título); números de seção decorativos (01/02/03); texto em gradiente; vidro/blur decorativo; borda colorida lateral > 1 px em cards e alertas; emoji no lugar de ícone; modal quando inline resolve.
- **Produto (Operate):** escala de tipo fixa em rem (não fluida); cor de destaque só em ação primária, seleção e estado; skeleton em vez de spinner; estado vazio que ensina o próximo passo; overlays com `<dialog>`/popover API para não serem cortados por `overflow`.
- **Adaptação:** mobile-first com `min-width`; mesma arquitetura de informação no celular e no desktop; alvos de toque ≥ 44 px; nada depende de hover; `env(safe-area-inset-*)`.
- **Harden:** testar texto longo, números grandes, lista vazia, offline e erro de dados antes de dar a tela por pronta.
- **Verificação em rodadas limitadas:** construir tudo, uma rodada de capturas (celular e desktop, tema escuro e claro), corrigir em lote, no máximo mais uma rodada.

### Da Emil

- **Decidir antes de animar.** Ação repetida dezenas de vezes por dia (marcar tarefa, trocar aba) quase não anima; ação de teclado nunca anima. Toda animação tem um motivo: feedback, mudança de estado, continuidade espacial.
- **Curvas e durações = nossos tokens.** `--ko-ease-out`, `--ko-ease-in-out` e `--ko-ease-drawer` já são as curvas da Emil. Durações: `--ko-duration-instant` (80 ms) e `-fast` (140 ms) para pressionar; `-base` (200 ms) para dropdown, popover, troca de estado; `-slow` (320 ms) só para sheet/drawer. Nada de UI acima de 300 ms além do sheet. Nunca `ease-in`, nunca `transition: all`, nunca `scale(0)` (começar em `scale(.95)` + opacidade). Saída mais rápida que entrada.
- **Botões:** `:active { transform: scale(.97) }` (o styleguide já faz). Popover cresce a partir do gatilho; modal fica centralizado.
- **Transições CSS, não keyframes,** em UI que pode ser interrompida. `@starting-style` para entrada.
- **Só `transform` e `opacity`** em animação frequente; blur ≤ 20 px e só em área pequena.
- **Mobile-native (piso do App Shell):** `viewport-fit=cover` + safe areas; `100dvh` no shell (`100svh` em hero); `-webkit-tap-highlight-color: transparent` com `:active` próprio; `touch-action: manipulation` em controles; inputs com 16 px (evita zoom no iOS) e `inputmode` certo (`numeric` para CH, dias, minutos); `user-select: none` só em controles; `overscroll-behavior: contain` em sheets; `theme-color` por tema; todo `:hover` dentro de `@media (hover: hover) and (pointer: fine)`; **nunca** `user-scalable=no`.
- **break-ui:** cada tela tem um conjunto de dados de pior caso plausível (nome de comandante longo, CH 25 com 0 blocos restantes, perfil Kraken, dia do reino 0 e 5000, lista vazia) e passa por ele antes de pronta.

### Da taste-skill

- **Dials** (só onde ela se aplica): Home `4 / 3 / 4` (variância / movimento / densidade, perfil "trust-first"); telas de produto ficam fora dos dials e seguem a impeccable.
- **Leitura do brief em uma linha** antes de desenhar uma tela de vitrine. A nossa: *"Hub de jogo para jogadores F2P no celular, linguagem gamer angular e confiável, marca KingdomOps sobre tokens próprios."*
- **Estados completos** (carregando, vazio, erro) e feedback tátil no `:active`.
- **Formulários:** label acima do campo, ajuda opcional, erro abaixo; nunca placeholder como label.
- **Hero:** cabe na primeira tela do celular; título ≤ 2 linhas, subtítulo ≤ 20 palavras, 1 CTA primário + no máximo 1 secundário; sem selo de versão, sem "scroll" indicativo, sem faixa decorativa.
- **Copy:** verbos concretos; sem "elevate/seamless/unleash"; um rótulo por intenção (se o CTA é "Build my guide", é igual na Home, no banner do guia e no menu); números falsamente precisos proibidos (todo número vem de `packages/` com fonte).
- **Uma forma por sistema** (taste: *shape consistency lock*): ver regra de chanfro em §3.
- **Sem `h-screen`**, sem `window.addEventListener('scroll')`, z-index em escala documentada (conteúdo, barra fixa, sheet, toast).

## 3. Conflitos e como resolvemos

| # | Tema | O que dizem | Decisão KingdomOps |
|---|---|---|---|
| 1 | **Paleta bronze/marfim** | taste proíbe como padrão a família "bege + latão + quase-preto quente" (`#b08947`, fundos tipo `#f5f1ea`). Nosso bronze `#B58B59` e o fundo claro `#F4F1EC` estão nessa família. | **Marca ganha.** A própria regra da taste abre exceção quando a marca nomeia as cores. Não trocar nada. Usar o bronze funcional `#79582F` para texto e botões no tema claro (já está em `--ko-accent` light). |
| 2 | **Fonte display em botões e rótulos** | impeccable (Operate): sem fonte display em rótulos, botões e dados. Styleguide: `.btn` e `.pill` em Chakra Petch caixa-alta. | **Marca ganha nos rótulos curtos:** Chakra Petch em títulos, botões e pills de até 3 palavras. **Impeccable ganha no resto:** label de formulário, texto corrido, item de lista e dados em IBM Plex Sans; números e IDs em IBM Plex Mono com `tabular-nums`. |
| 3 | **Monoespaçada** | impeccable: mono como "fantasia técnica" é proibido. Tokens: Plex Mono para IDs e números. | Sem conflito real se o uso for dado. Mono só para números, código de perfil, IDs de fatos e patch ("verified on patch X"). Nunca em título ou parágrafo. |
| 4 | **Título de seção em caixa-alta** | taste limita *eyebrows* a 1 a cada 3 seções; impeccable proíbe *eyebrow*. Styleguide usa `h2` em Chakra Petch caixa-alta. | O `h2` caixa-alta **é o título**, não um eyebrow: permitido. Proibido colocar um rótulo pequeno **acima** dele. |
| 5 | **Forma dos cantos** | taste: um sistema de raio por página. Tokens: raios pequenos (2–8 px) **e** chanfro. | Regra documentada (a taste aceita): chanfro só em momentos de marca (CTA primário, card de perfil, cabeçalho de guia); `--ko-radius-md` em inputs, chips e superfícies; `--ko-radius-pill` só em indicador de status. Nada de cantos arredondados grandes. |
| 6 | **Stack** | taste: React/Next.js com RSC, Tailwind v4, Motion. Emil (`pick-ui-library`): base-ui, Sonner, motion, zustand (todos React). | **ADR 0001 + orçamento F-52 (≤ 200 KB de JS) ganham.** Stack em `produto/plano-app-shell.md`: Astro estático + ilhas Preact, CSS com `--ko-*` (sem Tailwind: os tokens já são a fonte única), animação em CSS. Diálogos com `<dialog>`, menus com popover API, sem biblioteca de toast no MVP (confirmação inline com `aria-live`). Se aparecer necessidade real de toast ou gesto com mola, reavaliar Sonner/motion numa ilha React. |
| 7 | **Ícones** | taste: Phosphor/Tabler/HugeIcons, nunca SVG desenhado à mão; impeccable: biblioteca real **ou** SVG autoral. | Phosphor (traço único, um peso) para interface; SVGs do kit (`design/brand/svg/`) para marca. Nenhum outro desenho manual. |
| 8 | **Imagens** | taste: página de vitrine precisa de imagem real (gerada, picsum ou stock). | **ToS ganha:** nenhuma arte do jogo (§8 do ToS da Lilith, `produto/arvore-funcionalidades.md`). Sem picsum em produção. A Home se apoia no K, na tipografia e em dados reais (ex.: um bloco do guia de verdade). Imagens OG (F-57) geradas por Satori no build. |
| 9 | **Tema padrão** | taste: respeitar `prefers-color-scheme`; impeccable: escolher pelo cenário de uso. Tokens: sem `data-theme`, seguem o sistema. Brief: escuro padrão. | Escuro padrão na primeira visita (cenário: jogo aberto, à noite). Seletor com 3 opções: Dark, Light, System. Detalhe e decisão do dono em `plano-app-shell.md`. |
| 10 | **Movimento reduzido** | Emil e impeccable: reduzir não é zerar; manter opacidade e cor que informam estado. Tokens: `prefers-reduced-motion` zera todas as durações. | Tokens ganham (arquivo gerado, não editar). Efeito: mudanças de cor/opacidade ficam instantâneas, o que ainda comunica estado. Movimento espacial (sheet subindo, stagger) deve ter caminho próprio sem deslocamento. Se o fade fizer falta, ajustar `design/tools/build_tokens.py`, não o CSS. |
| 11 | **Travessão (—)** | taste proíbe em qualquer texto da interface. | Adotado só para textos novos da interface (rótulos, botões, mensagens). Conteúdo de `guides/` e rótulos de `packages/core` não são reescritos pelo frontend. |
| 12 | **`PRODUCT.md` / `DESIGN.md`** | impeccable lê esses arquivos na raiz. | Não criamos agora. Equivalentes: produto = `produto/arvore-funcionalidades.md` + `design/brief.md`; design = `design/tokens/` + `design/styleguide.html`. Ao usar a impeccable, apontar para eles. Decisão do dono se quiser gerar os arquivos para o CLI (ver plano). |
| 13 | **Hover** | Styleguide: `.btn:hover` sem condição. Emil: hover só com `(hover: hover) and (pointer: fine)`. | Emil ganha na implementação (é correção de plataforma, não de marca). O styleguide é referência visual, não código a copiar. |

## 4. Checklist por tela

Rodar antes de abrir PR de qualquer tela. Cada item com evidência (captura, valor computado ou teste), não "sim".

1. **Modo** declarado (Persuade, Read ou Operate) e respeitado.
2. **Só tokens:** nenhuma cor, fonte, espaço, raio, duração ou easing fora de `--ko-*`.
3. **Fontes:** Chakra Petch só em títulos, botões e pills curtos; Plex Sans no texto; Plex Mono + `tabular-nums` nos números.
4. **Contraste** AA nos dois temas, incluindo placeholder, desabilitado, foco e texto sobre `--ko-surface-raised`.
5. **360 px e 1280 px:** sem rolagem horizontal, texto ≤ 75ch, alvos ≥ 44 px, safe areas, nada só no hover.
6. **Estados:** carregando (skeleton), vazio (diz o que fazer), erro (diz o problema e a saída), offline.
7. **Pior caso** (break-ui) com dados plausíveis: texto longo, zero itens, valores extremos do questionário.
8. **Movimento:** cada animação tem motivo; ≤ 300 ms (sheet ≤ 320 ms); só `transform`/`opacity`; `:active` em tudo que é tocável; caminho para `prefers-reduced-motion`.
9. **Teclado e leitor de tela:** ordem de foco = ordem visual, foco visível com `--ko-focus`, landmarks, um `h1`, ícones com nome acessível.
10. **Confiança:** todo número mostra fonte e "verified on patch X" (F-50); confiança baixa rotulada em texto, não só cor.
11. **Proibidos ausentes:** eyebrow, cards aninhados, borda lateral colorida, gradiente em texto, emoji como ícone, arte do jogo, travessão em texto novo.
12. **Orçamento de JS** da rota dentro do limite (teste automático do plano).
