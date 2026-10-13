# Prompt — criação da identidade visual (para o Codex)

> **Substituído por `prompt-identidade-visual-v2.md`** (2026-10-13): a v1 tinha escopo grande demais e o Codex travou.

Copie o bloco abaixo e envie ao Codex com o repositório `victorfaria-dev/rok-adm` aberto.

```text
Você vai criar a identidade visual completa e o design system de um produto web chamado provisoriamente "rok-adm": um megahub para jogadores e líderes de reino do jogo mobile Rise of Kingdoms (Lilith Games). Trabalhe no repositório atual e entregue tudo na pasta /design.

## Contexto (leia antes de começar)
- produto/backlog-sistema.md — funcionalidades (guias, planner de conta, hub de farms, administração de reino, perfis e alianças)
- produto/referencias-design.md — referências de design e princípios
- research/perfis.md — perfis de gasto (F2P, Low, Medium, High, Whale, Kraken)
- research/brainstorm/backlog-ideias.md — ideias I-05 (Guide Builder), I-06 e I-07 (identidade de jogador/aliança e avatar exportável)
- guides/README.md — guias montados a partir de blocos com nível de confiança

## O produto
- Público: jogadores de Rise of Kingdoms (começando por F2P em reino novo) e líderes de aliança/reino (R4, R5, rei, conselho). Internacional; a interface é em inglês.
- Uso: principalmente no celular, com o jogo aberto ao lado → mobile-first, leitura rápida, alvos de toque grandes. Também desktop para líderes (tabelas, DKP, planilhas).
- Proposta de valor: "saber exatamente o que fazer, sem desperdiçar tempo nem recursos", com informação confiável (cada dado mostra fonte e o patch em que foi verificado).
- Diferencial de tom em relação aos concorrentes: os sites atuais de RoK são poluídos de anúncios, desatualizados e ruins no celular. O nosso deve ser limpo, rápido, confiável e com personalidade.
- Identidade é central para os jogadores: perfis personalizáveis, alianças com cor, tag e brasão, avatar exportável para usar dentro do jogo.

## Restrições obrigatórias
1. NÃO usar nenhum asset, logo, fonte, ícone, personagem, brasão ou arte da Lilith Games / Rise of Kingdoms, nem imitar o logotipo do jogo. Tudo deve ser original. O nome do produto não pode conter "Rise of Kingdoms" nem "RoK" como marca principal.
2. Acessibilidade: contraste WCAG 2.2 AA em todos os pares texto/fundo, nos temas claro e escuro. Não depender só de cor para transmitir estado.
3. Tema escuro como padrão (jogadores usam à noite e com o jogo aberto) + tema claro completo.
4. Fontes apenas com licença livre (ex.: Google Fonts / OFL). Ícones de biblioteca aberta (ex.: Lucide) ou SVG próprios.
5. Sem dependência de build para visualizar: o guia de estilo deve abrir como HTML estático.

## Tom e conceito
- Estratégico, medieval-moderno, "sala de guerra/conselho" — mas sem clichê de fantasia pesado, sem texturas de pergaminho e sem excesso de dourado. Pense em um painel de comando elegante: clareza de produto moderno (Linear, Raider.io, Maxroll) com acentos heráldicos.
- Sensação: confiável, preciso, organizado, competitivo.

## Entregáveis
1. /design/brand.md
   - 3 propostas de nome (originais, curtas, verificáveis como domínio .gg ou .app — apenas sugira, não registre), com significado e tagline em inglês para cada; recomende uma.
   - Conceito, princípios, tom de voz (com exemplos de microcopy: botões, estados vazios, erros, avisos de "dado não verificado").
2. Logo (SVG, original, simples, legível em 16px): versão completa, símbolo isolado, monocromática, para fundo claro e escuro. /design/logo/*.svg
3. Paleta e tokens
   - Cores primária, secundária, neutras (escala 50–950), semânticas (sucesso, alerta, erro, info) para claro e escuro.
   - Cores de **nível de confiança** dos dados: high / medium / low / pending (usadas nos guias).
   - Cores dos **perfis de gasto**: F2P, Low, Medium, High, Whale, Kraken (distinguíveis também por ícone/forma, não só por cor).
   - **Paleta de alianças**: 12–16 cores para os usuários escolherem como cor da aliança, todas com contraste garantido em avatar, tag e borda nos dois temas.
   - Exportar como /design/tokens/tokens.json (formato Design Tokens W3C), /design/tokens/tokens.css (CSS custom properties, com [data-theme="dark"|"light"] e prefers-color-scheme) e um preset Tailwind (/design/tokens/tailwind.preset.js).
4. Tipografia: famílias (títulos e texto; uma mono para números/tabelas), escala tipográfica fluida, pesos, altura de linha, uso de números tabulares em tabelas e calculadoras.
5. Espaçamento, grid, raios, sombras/elevação, breakpoints (mobile-first), motion (durações e easings; respeitar prefers-reduced-motion).
6. Iconografia: estilo, tamanhos e um set inicial para o domínio (recursos: food, wood, stone, gold, gems; speedups; tropas; comandantes; eventos; KvK; aliança; farms; checklist; calendário; confiança). Ícones originais em SVG, nunca cópias dos ícones do jogo.
7. Sistema de identidade do usuário/aliança:
   - Avatar com borda na cor da aliança, tag [TAG] e brasão.
   - **Editor de brasão**: biblioteca de formas de escudo, divisões, cores e emblemas originais (SVG), com regras de combinação.
   - **Avatar exportável** (PNG) para usar como foto de perfil no jogo: defina canvas quadrado com tamanho configurável, uma "área segura" circular central (a moldura do jogo cobre as bordas — deixe a área segura parametrizável até confirmarmos as medidas reais) e variações de borda.
   - **Cartão de perfil compartilhável** (para Discord): 1200×630 e 1080×1080.
8. Componentes (especificação + HTML/CSS de referência): botões, inputs, select, checkbox/toggle, tabs, cards, badges (confiança, perfil de gasto, "Recommended", "Verified on patch X"), tabela densa, checklist diário com tempo estimado, item de calendário/evento, barra de progresso/meta, alerta, tooltip, modal, navegação mobile (bottom nav) e desktop (sidebar), estado vazio, skeleton.
9. Telas de exemplo (HTML estático com os tokens, mobile e desktop):
   a) questionário do Guide Builder (perfil de gasto, função, horas/dia, estágio do reino, CH atual, civilização);
   b) guia gerado, com blocos marcados como Recommended e níveis de confiança;
   c) rotina diária "tenho 15/30/60 min";
   d) perfil de jogador com avatar da aliança;
   e) página de aliança;
   f) painel de DKP de um líder (tabela densa).
10. /design/index.html — guia de estilo navegável que reúne tudo acima, com alternância claro/escuro.

## Critérios de aceitação
- Abrir /design/index.html localmente mostra todo o sistema, nos dois temas, sem build.
- Todos os pares de cor usados passam em WCAG AA (inclua um script /design/tools/check_contrast.(js|py) que verifique os tokens e rode-o; registre o resultado em /design/contrast-report.md).
- Nenhum asset da Lilith/Rise of Kingdoms.
- Tokens são a única fonte de cor/tipografia/espaçamento usada nas telas de exemplo.
- Funciona bem em 360px de largura.
- Explique suas decisões em /design/brand.md e liste em /design/open-questions.md o que depende de confirmação (ex.: medidas reais do avatar no jogo).

Trabalhe em commits pequenos e descritivos.
```
