# KingdomOps — identidade visual v1.0

Marca gamer moderna, plana, com K facetado e lettering angular próprio.
SVGs redesenhados geometricamente a partir da prévia aprovada. A imagem gerada foi referência; os arquivos finais usam cores sólidas e contornos limpos.

## Paleta da marca

| Cor | HEX | Função |
| --- | --- | --- |
| Grafite | #191B1D | Base e versão escura |
| Bronze | #B58B59 | Símbolo e OPS |
| Marfim | #E8E3DA | KINGDOM em fundo escuro |

## Composições

- Horizontal: KINGDOM e OPS mantêm a mesma altura e o mesmo espaçamento entre letras. A cor separa os dois termos.
- Compacta: KINGDOM acima de OPS, alinhados à esquerda; símbolo à esquerda do conjunto.
- Ícone: K isolado. App icon: K com fundo grafite próprio.
- `dark`: para fundo escuro; `light`: para fundo claro. O fundo dos logos é transparente.
- `mono-*`: aplicações de uma cor; `currentcolor`: herda a propriedade CSS `color` quando o SVG é inserido inline.

Todos os logos usam caminhos vetoriais; não contêm imagens embutidas, fontes, filtros ou gradientes. O lettering é um desenho de marca, não uma fonte digitável.
Os mesmos caminhos das letras e do símbolo são reutilizados nas duas composições.

## Uso

- Área livre recomendada: 30 unidades, equivalentes à espessura principal das letras, ao redor do desenho. O viewBox inclui margem técnica de 12 unidades; reserve o restante no layout.
- Tamanhos iniciais recomendados: horizontal ≥240 px de largura; compacta ≥180 px; símbolo ≥24 px. Para favicon de 16 px, use o K isolado e confira a renderização.
- Preserve a proporção. Não estique, gire, adicione relevo ou altere os cortes.
- Símbolo em bronze e KINGDOM em marfim sobre fundos escuros. Sobre fundos claros, KINGDOM em grafite e bronze preservado.
- Bronze claro é cor de marca; para textos pequenos e botões no tema claro, use o bronze funcional escuro `#79582F`.

## Paletas de interface

`palette/kingdomops-palette.json` reúne cores da marca, temas dark/light e estados funcionais.
`palette/kingdomops-tokens.css` expõe variáveis CSS. Aplique `data-theme="dark"` ou `data-theme="light"` no elemento raiz.
Os estados success/warning/error/info são cores auxiliares e não variantes da marca. Sempre combine estado com texto ou ícone.

### Contraste calculado (sRGB)

| Tema | Par | Contraste |
| --- | --- | --- |
| dark | text / background | 14.69:1 |
| dark | text-muted / background | 8.29:1 |
| dark | accent / background | 6.08:1 |
| dark | on-accent / accent | 6.08:1 |
| light | text / background | 15.33:1 |
| light | text-muted / background | 5.48:1 |
| light | accent / background | 5.74:1 |
| light | on-accent / accent | 6.46:1 |

Estes pares excedem 4,5:1. Isso valida as combinações de cor listadas, não a acessibilidade de uma interface completa.

## Arquivos

- `svg/`: logos transparentes em SVG, variantes monocromáticas e app icon.
- `palette/`: paletas e tokens.
- `kingdomops-brand-preview.svg` e `.png`: prancha de conferência.
- `README.md`: esta orientação.
