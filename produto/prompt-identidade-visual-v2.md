# Prompt — identidade visual v2 (para o Codex)

> **Substituído (2026-10-13):** a identidade visual final é o kit do Victor em `design/brand/`, com tokens em `design/tokens/`. Este prompt não deve mais ser usado.

Substitui `prompt-identidade-visual.md` (v1), que pedia design system completo + telas e travou. A v2 é só **identidade visual**: logo, paleta, estilos e fontes. Componentes e telas virão depois, com as skills de `skills-frontend.md`.

Copie o bloco abaixo.

```text
Crie a IDENTIDADE VISUAL (somente: logo, paleta, fontes e estilos base) de um produto web. Escopo pequeno e fechado: NÃO crie componentes, telas, app, framework nem build. Entregue tudo na pasta /design do repositório, partindo da branch main.

## O produto (contexto suficiente, não precisa ler outros arquivos)
- Hub web para jogadores e líderes de aliança/reino do jogo mobile Rise of Kingdoms: guias, planejador de conta, calculadoras, gestão de farms e administração de reino.
- Público internacional, interface em inglês, uso principal no celular com o jogo aberto ao lado (tema escuro é o padrão).
- Personalidade: estratégico, confiável, preciso, organizado, competitivo. "Sala de conselho / mesa de guerra" moderna, com acentos heráldicos discretos. Evitar: clichê de fantasia, pergaminho, dourado em excesso, gradiente roxo-azul genérico.
- Os jogadores valorizam muito identidade: alianças têm cor, tag [ABC] e brasão; perfis têm raridade (Common, Rare, Epic, Legendary).

## Restrições
1. Nada da Lilith Games / Rise of Kingdoms: nenhum logo, fonte, ícone, arte, brasão ou imitação. O nome do produto não pode conter "Rise of Kingdoms" nem "RoK".
2. Fontes só com licença livre (Google Fonts / OFL).
3. Contraste WCAG 2.2 AA em todo par texto/fundo, nos temas escuro e claro.
4. Nome provisório do produto: "rok-adm". Proponha 3 nomes originais e curtos (com uma tagline em inglês cada) e use o recomendado no logo; se não tiver certeza, use o wordmark provisório.

## Entregáveis (exatamente estes arquivos)
1. /design/brand.md — nome (3 propostas + recomendação), conceito em 5 linhas, princípios visuais, tom de voz com 6 exemplos de microcopy, e o "porquê" de cada escolha de cor e fonte.
2. /design/logo/ — SVGs originais e simples, legíveis a 16px:
   - symbol.svg (símbolo isolado), wordmark.svg, lockup-horizontal.svg;
   - versões mono-light.svg e mono-dark.svg;
   - favicon.svg (32×32).
3. /design/tokens/tokens.css — CSS custom properties com tema escuro padrão e claro via [data-theme="light"] e prefers-color-scheme:
   - cores: primária, secundária, neutros (escala 50–950 com leve viés de matiz, sem cinza puro), semânticas (success, warning, danger, info);
   - confiança de dados: high, medium, low, pending;
   - perfis de gasto: f2p, low, medium, high, whale, kraken;
   - raridades: common (ferro fosco), rare (prata), epic (violeta), legendary (ouro);
   - paleta de alianças: 12 cores escolhíveis, todas com contraste AA para texto/tag sobre elas e como borda nos dois temas;
   - tipografia: famílias (display, body, mono para números), escala de tamanhos, pesos, alturas de linha;
   - estilos base: espaçamento (escala de 4px), raios, bordas, sombras/elevação, durações e easings de animação.
4. /design/tokens/tokens.json — os mesmos valores no formato Design Tokens (W3C).
5. /design/index.html — UMA página estática (sem build, só HTML/CSS inline + tokens.css) que mostra: logos em fundo claro e escuro, todas as paletas com nome e hex, a escala tipográfica com texto real de exemplo (ex.: "City Hall 22 → 25", "Verified on patch 1.1.09"), e os estilos base. Botão para alternar tema. Deve funcionar em 360px de largura.
6. /design/contrast-report.md — tabela dos pares de cor usados com a razão de contraste calculada (escreva um script simples em /design/tools/ para calcular e rode-o).

## Forma de trabalhar
- Faça commits pequenos a cada entregável (1→6), na ordem.
- Não espere tudo ficar perfeito: priorize entregar os 6 arquivos completos e coerentes.
- Ao terminar, abra um Pull Request para main com um resumo e as decisões principais.
```
