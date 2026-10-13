# Plano: App Shell (F-52) e primeiras telas

Data: 2026-10-13 · Status: proposta para o Victor · Entradas: `docs/adr/0001-stack-mvp.md`, `produto/arvore-funcionalidades.md` §6 (MVP), `produto/arvore-funcionalidades-detalhe.md` (F-01, F-02, F-12, F-14, F-15, F-20, F-52, F-56, F-57, F-85), `produto/skills-frontend.md`, `design/tokens/tokens.css`.

Restrições que guiam tudo: site estático, sem login e sem backend; celular primeiro (Android de entrada, jogo aberto ao lado); PWA offline após a 1ª visita; estado no aparelho com exportar/importar; **≤ 200 KB de JS na primeira carga** (F-52 c); WCAG 2.2 AA (F-85); reaproveitar `@rokadm/core`, `@rokadm/planner` e `@rokadm/data` sem duplicar lógica.

## 1. Framework para `apps/web`

| | **A. Astro (estático) + ilhas Preact** — recomendado | **B. Vite + Preact (SPA) + pré-render** |
|---|---|---|
| JS na 1ª carga | Zero por padrão; só as ilhas interativas carregam JS (Preact ≈ 4 KB gz). Folga grande no orçamento de 200 KB. | Runtime + roteador + app inteiro na entrada (ou code-split manual). Cabe, mas o orçamento vira trabalho contínuo. |
| Guias (F-02, F-12) e Trust (F-56) | HTML pronto no build: indexável (F-57), rápido no 3G, funciona sem JS. | Precisa de plugin de pré-render; sem ele o guia não é indexado e mostra tela vazia até o JS rodar. |
| Uso de `packages/` | O frontmatter `.astro` roda no build em Node: `@rokadm/data` (≈ 950 KB de JSON) é lido **só no build** e vira HTML ou JSON enxuto. As ilhas importam só funções puras de `@rokadm/core`/`planner`. | Tudo que a tela usa vai para o cliente. Importar o barril de `@rokadm/data` por engano estoura o orçamento; exige disciplina de import dinâmico. |
| Estado entre telas | MPA: cada navegação é uma página. Estado compartilhado via `localStorage` + `nanostores` (≈ 1 KB). Transições opcionais com View Transitions. | Estado em memória natural; navegação instantânea entre abas. |
| PWA / offline | `@vite-pwa/astro` (Workbox) pré-cacheia páginas e JSON. | `vite-plugin-pwa`, igual. |
| Hospedagem | Pasta `dist/` estática (qualquer host). | Igual, mas exige fallback de rota SPA no host. |
| Custo | Dois modelos mentais (`.astro` + componentes Preact). | Um só modelo; mais familiar. |

**Recomendação: A.** O MVP é na maior parte conteúdo filtrado (guias com fonte e patch) com 3 ferramentas interativas pequenas. Astro entrega o conteúdo como HTML, deixa o dataset pesado no build e põe JS só onde há interação. Isso cumpre F-52 (c), F-57 (páginas indexáveis) e F-85 sem esforço extra, e mantém a lógica nos pacotes, como pede o ADR 0001. O ponto fraco (estado entre páginas) é pequeno: o estado do MVP é um código de perfil, as marcações da rotina e o tema.

Decisões que acompanham a escolha:
- `pnpm-workspace.yaml` ganha `apps/*`; pacote `@rokadm/web` com `typecheck` (`astro check`), `test` (Vitest) e `e2e` (Playwright), então `pnpm check` e o CI já o incluem.
- **CSS puro sobre os tokens:** `design/tokens/tokens.css` importado direto (nunca copiado); estilos com escopo do Astro. Sem Tailwind (seria uma segunda fonte de verdade).
- **Fontes** self-hosted via Fontsource, só subconjunto latino e pesos usados: Chakra Petch 600/700, IBM Plex Sans 400/500/600, IBM Plex Mono 400; `font-display: swap`; pré-carregar só a Plex Sans 400.
- **Ícones:** Phosphor via `unplugin-icons` (SVG embutido no build, sem runtime); marca a partir de `design/brand/svg/`; manifest e favicons de `design/brand/export/`.
- **Regra de import:** `@rokadm/data` só em código de build (`.astro`, endpoints `src/pages/data/*.json.ts`). Ilhas recebem JSON enxuto. Pré-calcular no build tudo que depende de poucas variáveis (ex.: `vipTimeline` não depende do perfil e sai pronto no HTML).
- **Estado local** em `src/lib/store.ts`: uma chave versionada `ko:v1` (`{ profileCode, routine: { date, done[] }, theme }`), leitura tolerante (JSON corrompido → padrão), export/import em JSON. O perfil é guardado como o próprio código de `encodeProfile`.

## 2. Rotas do MVP

Tiradas de `arvore-funcionalidades.md` §6. Modo = modo de tela da impeccable (`skills-frontend.md` §2).

| Rota | Tela | Funcionalidades | Modo | Render |
|---|---|---|---|---|
| `/` | Home: o que é o hub, CTA para o questionário, atalhos | F-57, entrada do F-01 | Persuade | Estático + ilha mínima (CTA muda se já há perfil) |
| `/start` | Questionário (até 10 perguntas) | F-01 | Operate | Ilha; tela cheia, sem barra de abas |
| `/guide` | Meu guia: blocos filtrados pelo perfil + seção `#budget` | F-01, F-02, F-14, F-50 v0 (selos), F-51 | Read | HTML do guia F2P padrão no build (SEO) + ilha que refiltra pelo perfil salvo ou `?p=<código>` |
| `/guides/new-kingdom` | Guia de reino novo + sobrevivência do dia 1 | F-12 | Read | Estático |
| `/routine` | Rotina por tempo (15/30/60 min) + Break Mode | F-15 | Operate | Ilha |
| `/commanders` | Checklist de decisão de comandante + validade | F-20 | Operate | Estático + ilha do checklist |
| `/me` | Perfil (resumo, editar), tema, exportar/importar/apagar dados | F-52 (b) | Operate | Ilha |
| `/trust` | O que o hub faz e nunca faz; aviso de não afiliação | F-56 | Read | Estático de `content/legal/*.md` |
| `/404` | Não encontrado, com links para Guia e Home | — | — | Estático |

F-14 não ganha rota própria: é a seção `#budget` do guia, como define o MVP. F-57 entra como meta tags/OG (Satori no build) em `/`, `/guide` e `/guides/new-kingdom`, mais o botão "Share" do guia.

## 3. Estrutura do App Shell

Mesma arquitetura de informação em todos os tamanhos (4 destinos), só a forma muda.

**Destinos:** Guide (`/guide`), Routine (`/routine`), Commanders (`/commanders`), You (`/me`). Secundários: New kingdom guide, Trust & privacy.

```
Celular (< 768 px)                     Desktop (≥ 1024 px)
┌───────────────────────────┐          ┌──────────┬─────────────────────────┐
│ K  Page title   [F2P·30m]│ top bar  │ KINGDOM  │                         │
├───────────────────────────┤          │ OPS      │   conteúdo              │
│                           │          │ ▸ Guide  │   Read: ≤ 72ch          │
│   conteúdo                │          │   Routine│   Operate: ≤ 960 px     │
│                           │          │   Cmdrs  │                         │
│                           │          │   You    │                         │
├───────────────────────────┤          │ ──────── │                         │
│ Guide Routine Cmdrs  You │ abas     │ New kgdm │                         │
└───────────────────────────┘          │ Trust    │                         │
                                       │ [◐ tema] [F2P·30m]                 │
                                       └──────────┴─────────────────────────┘
```

- **Celular (< 768 px):** barra superior de 56 px + `safe-area-inset-top` com o K (link para `/`), título da página e o **chip de perfil**; barra de abas inferior fixa com 4 itens (ícone + rótulo, alvo ≥ 48 px) + `safe-area-inset-bottom`. O conteúdo reserva o espaço das duas barras. Shell em `100dvh`.
- **Tablet (768–1023 px):** trilho lateral de 80 px com ícone e rótulo curto embaixo; sem barra inferior.
- **Desktop (≥ 1024 px):** trilho de 240 px com logo horizontal, os 4 destinos, os 2 secundários e, no rodapé, o seletor de tema e o chip de perfil.
- **Item ativo:** `aria-current="page"`, cor `--ko-accent` + marcador; troca de aba não anima (ação frequente). Um `<a>` de "Skip to content" antes do shell; landmarks `header`, `nav`, `main`, `footer`.
- **Tema:** botão de tema (barra superior no celular, rodapé do trilho no desktop) abre um popover com 3 opções: **Dark** (padrão na 1ª visita), **Light**, **System**. Um script inline no `<head>`, antes do CSS, lê `ko:v1.theme` e define `data-theme` (System = sem atributo, e os tokens seguem `prefers-color-scheme`). Assim não há flash. O script também atualiza `<meta name="theme-color">` para a cor de `--ko-background` do tema. `/me` repete o mesmo controle.
- **Perfil e questionário:** o chip mostra o resumo do perfil salvo ("F2P · 30 min · CH 12") e leva a `/me`; sem perfil, vira o botão "Set up profile" e leva a `/start`. Outras entradas para `/start`: CTA da Home, banner do guia sem perfil, "Edit answers" em `/me` (questionário pré-preenchido). `/start` esconde as abas e mostra "Close" (volta para onde estava, mantendo o rascunho).
- **Rodapé** (Home, guias, Trust): aviso de não afiliação à Lilith (F-56) e link para `/trust`.
- **Piso mobile-native** (Emil): `viewport-fit=cover`, `interactive-widget=resizes-content`, tap highlight transparente, `touch-action: manipulation`, inputs com 16 px, hover só com `(hover: hover) and (pointer: fine)`, `overscroll-behavior: contain` em painéis roláveis. Zoom nunca bloqueado.
- **PWA:** manifest com nome "KingdomOps", `display: standalone`, `background_color`/`theme_color` = `#101214`, ícones de `design/brand/export/`. O service worker pré-cacheia todas as rotas do MVP, fontes e JSON de dados.

## 4. As 3 primeiras telas (em ordem)

A ordem segue o funil que mede o MVP (F-01: ≥ 60% de quem começa chega ao guia). Rotina e comandantes vêm depois, sobre o mesmo shell. Enquanto não existirem, as abas apontam para uma página estática "Coming next" com link para o guia (não um 404).

### Tela 1: App Shell + Home (`/`)

Critérios de aceite:
1. Em 360, 390, 768 e 1280 px não há rolagem horizontal. Abaixo de 768 px aparece a barra de abas; a partir de 768 px, o trilho. Os 4 destinos são os mesmos e o atual tem `aria-current="page"`.
2. Na 1ª visita o tema é escuro (fundo `#101214`). Escolhido Light, o tema persiste após recarregar sem flash (`data-theme` definido antes do primeiro paint). Com System, segue `prefers-color-scheme`. `theme-color` acompanha.
3. Chip de perfil: sem perfil leva a `/start`; com perfil salvo mostra o resumo.
4. Home no celular (390×844): título ≤ 2 linhas, subtítulo ≤ 20 palavras e o CTA primário "Build my guide" visível sem rolar. Um CTA secundário "Read the F2P guide" (`/guide`). Sem eyebrow, sem arte do jogo, sem número sem fonte.
5. Depois da 1ª visita, `/`, `/start`, `/guide` e `/guides/new-kingdom` abrem offline.
6. JS da primeira carga de `/` ≤ 30 KB gz (o shell deve ser quase só HTML/CSS); total de qualquer rota ≤ 200 KB gz.
7. axe sem violação séria ou crítica nos dois temas; foco visível com `--ko-focus`; skip link funciona.
8. Só tokens `--ko-*` no CSS (teste: nenhuma cor hex fora de `tokens.css`).

### Tela 2: Questionário (`/start`)

Critérios de aceite:
1. Perguntas, opções, limites e padrões vêm de `QUESTIONS` de `@rokadm/core`; nenhum texto de pergunta duplicado em `apps/web`.
2. Uma pergunta por passo, com progresso "3 of 10". Escolhas como opções grandes (rádio, alvo ≥ 48 px). Números com atalhos (presets) + campo "Other" (`inputmode="numeric"`, 16 px, `min`/`max` do core). Perguntas `nullable` têm "Skip".
3. Label acima, erro abaixo do campo, dizendo como corrigir (ex.: "City Hall goes from 1 to 25"). A validação final usa `validateAnswers`; nenhum passo avança com valor inválido.
4. Back preserva as respostas. O rascunho é salvo a cada resposta; recarregar retoma no mesmo passo.
5. Teclado: Enter avança, Esc fecha; ao trocar de passo o foco vai para o título da pergunta (anunciado ao leitor de tela).
6. O passo final mostra o resumo e os avisos de `profileWarnings`. "See my guide" salva `encodeProfile(...)` e abre `/guide?p=<código>`.
7. "Edit answers" abre pré-preenchido a partir do código salvo; ida e volta não perde dado (F-01 c).
8. Pior caso: CH 25, dia do reino 5000, gasto 10.000.000, 1440 min, civilização nula. Nada quebra o layout em 360 px.

### Tela 3: Meu guia (`/guide`, com Budget Reality Check)

Critérios de aceite:
1. Sem perfil e sem `?p`: o HTML do build já contém o guia F2P padrão (indexável, legível sem JS) e um banner "Personalize in 2 minutes" leva a `/start`.
2. Com `?p=<código>` válido ou perfil salvo, a ilha aplica `selectBlocks` e mostra as seções na ordem de `GUIDE_SECTIONS`. `?p` tem precedência e **não** sobrescreve o perfil salvo; um botão "Use this profile" faz isso. Código inválido mostra erro inline e cai no guia padrão, sem quebrar.
3. Blocos com `recommended_para` do perfil mostram "Recommended". Blocos já feitos ficam no grupo recolhido "Already done?" (`<details>`). Blocos futuros aparecem marcados como "upcoming".
4. Todo bloco mostra fonte, "verified on patch X" (Plex Mono) e confiança em texto; confiança baixa é rotulada (F-02 a, b).
5. A seção `#budget` mostra o que dá para alcançar até o KvK1 para o perfil (F-14 a–c), com a renda usada, a confiança e, para Low, "what buying doesn't change", sem link de compra. A tabela VIP vem pré-calculada do build.
6. "Share" usa `navigator.share` quando existe; senão copia a URL com `?p=` e confirma inline ("Link copied", via `aria-live`). O link leva só o código do perfil.
7. Contagem de blocos exibidos = saída de `selectBlocks` para 3 perfis fixos (F2P/dia 0/CH 1; Low/dia 20/CH 12; Whale/CH 25).
8. No celular, um índice de seções recolhível no topo; texto ≤ 72ch; nenhum card dentro de card.
9. JSON do guia (blocos + selos) ≤ 40 KB gz, carregado pela ilha e pré-cacheado.

## 5. Testes

**Unitários (Vitest, como o resto do monorepo)**, em `apps/web/src/**/*.test.ts`:
- `store`: esquema versionado, JSON corrompido volta ao padrão, export → import é idêntico.
- `theme`: preferência salva → atributo (`dark`, `light`, ausente) e cor de `theme-color`.
- Perfil na URL: precedência de `?p` sobre o salvo, código inválido, "Use this profile".
- Máquina de passos do questionário: next/back/skip, validação por passo, retomada do rascunho.
- Navegação: 4 destinos, item ativo por rota (incluindo sub-rotas).
- Payload do guia (código de build): todo `id` de `guides/data/*.json` presente, todo bloco com selo de patch.
- Ilha do questionário com `@testing-library/preact` + `happy-dom`: teclado e mensagens de erro.
- **Orçamento de JS** (`scripts/check-budget.ts`, roda após o build no CI): soma gzip dos scripts de cada página em `dist/` ≤ 200 KB e `/` ≤ 30 KB. Também falha se algum chunk contiver o dataset completo (ex.: a string de um ID de fato que só existe em `facts.json`).

**Smoke com Playwright** (`apps/web/e2e/smoke.spec.ts`):
- `@playwright/test` **1.56.1**, versão que casa com o Chromium instalado em `/opt/pw-browsers` (`chromium-1194`). Aqui `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` já está definido; no CI, `pnpm exec playwright install --with-deps chromium`.
- `webServer`: `astro build && astro preview` (testa o site estático real, com service worker).
- Projetos: `phone` (390×844, `isMobile`, `hasTouch`) e `desktop` (1280×800), só Chromium.
- Cenários:
  1. Cada rota do MVP responde 200, tem um `h1`, nenhum erro no console e nenhuma rolagem horizontal em 360 px.
  2. Navegação: abas no `phone`, trilho no `desktop`; cada destino recebe `aria-current`.
  3. Tema: fundo `#101214` na 1ª visita; Light persiste após recarregar com `data-theme` presente no `domcontentloaded`; System segue `emulateMedia({ colorScheme })`.
  4. Funil: Home → "Build my guide" → responder só com teclado → `/guide?p=…` com "Recommended"; recarregar mantém o perfil; `?p=lixo` mostra erro e o guia padrão.
  5. Offline: visitar `/`, esperar `navigator.serviceWorker.ready`, `context.setOffline(true)`, abrir `/guide`, que deve renderizar.
  6. Acessibilidade: `@axe-core/playwright` em cada rota, nos dois temas; zero violações sérias ou críticas.
- Scripts: `pnpm --filter @rokadm/web test` e `pnpm --filter @rokadm/web e2e`. No CI, entram depois de `pnpm test`.

**Fora do alcance do Playwright:** Chromium emulado não reproduz Safari iOS, hover grudado, teclado virtual, safe areas reais nem a sensação de toque. Antes de publicar cada tela: rodada manual num Android de entrada e num iPhone (servidor de dev pelo IP da rede local), seguindo o checklist de `skills-frontend.md` §4.

## 6. Decisões do dono em aberto

1. **Aprovar Astro + Preact** (vira o ADR 0002 com este §1).
2. **Hospedagem estática e domínio** (Cloudflare Pages, GitHub Pages ou Netlify): define o caminho base e o escopo do service worker. Busca de marca para "KingdomOps" ainda pendente (`design/brief.md`).
3. **Tema padrão:** escuro forçado na 1ª visita (proposta, alinhado ao brief) ou seguir o sistema (o que os tokens fazem sem atributo).
4. **Medida do orçamento de 200 KB:** proposta é JS comprimido (gzip) por rota na primeira carga; F-52 não diz se é comprimido.
5. **`?p=` compartilhado:** só visualizar (proposta) ou adotar o perfil automaticamente.
6. **Impeccable CLI:** gerar `PRODUCT.md`/`DESIGN.md` na raiz e usar `npx impeccable detect` como verificação local (baixa um binário). Proposta: local e opcional, fora do CI no início.
7. **Analytics (PostHog com consentimento):** a métrica do F-01 precisa dele, mas o banner de consentimento não está nas 3 primeiras telas. Definir se entra antes do lançamento ou junto.
