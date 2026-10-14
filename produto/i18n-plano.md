# Plano de i18n do KingdomOps (formato, URLs, glossário, RTL, fontes) — 2026-10-14

Status: **proposta**. A UI ainda não foi traduzida e nada aqui foi implementado. O glossário de termos já existe (`packages/data/i18n/glossary.json`) e a cobertura está em `research/i18n-glossary-coverage.md`. Os idiomas e a ordem de entrega estão em `produto/backlog-pos-ux.md` (Idiomas): primeiro os de escrita latina, depois RU, depois KO e zh-Hant, por último AR.

Restrições: site Astro estático com ilhas Preact. Orçamento de JS (`apps/web/scripts/check-budget.ts`): **30 KB gz em `/`** e **200 KB por rota**. Os guias são públicos e devem ser indexáveis em cada idioma.

## 1. Catálogo de mensagens e biblioteca

| Opção | Custo em runtime | Ilhas Preact | Prós | Contras |
|---|---|---|---|---|
| **A. Sem biblioteca:** i18n nativo do Astro + catálogos JSON próprios + `Intl` | **0 KB**: as strings já saem no HTML; as ilhas recebem só o que usam, via props | strings passadas como props (serializadas no HTML, não no bundle) | zero dependência; tipagem simples (chave de `en.json` → tipo); plural, número e data com `Intl.PluralRules`/`NumberFormat`/`DateTimeFormat`, que já estão no navegador | interpolação, plural e lint são código nosso (~150 linhas); sem editor visual |
| **B. Paraglide JS (inlang)** | ~0–1 KB: compila cada mensagem numa função e o tree-shaking descarta o que a ilha não usa | importa `m.chave()` direto na ilha | tipado, ICU-like, há integração com Astro, mensagem por mensagem | mais uma ferramenta de build e o formato de projeto inlang; ainda precisa de um passo nosso para o glossário |
| C. i18next + react-i18next (preact/compat) | ~15–20 KB gz, mais o catálogo carregado no cliente | hook `useTranslation` | ecossistema grande, ICU via plugin | gasta metade do orçamento de `/` (30 KB); catálogo enviado em runtime; não precisamos de troca dinâmica |
| D. Lingui (macro + compile) | ~2–3 KB | `<Trans>` / `t` | ICU completo e extração automática | macro Babel/SWC no Vite; mais complexo que A para o ganho |

**Recomendação: opção A.** Se as regras de plural ou o volume de strings crescerem, migrar para B, sem mudar o formato das URLs nem o do glossário.

Formato proposto:
- **Arquivos:** `apps/web/src/i18n/messages/<locale>.json`, um por idioma, com chaves planas por área (`nav.guides`, `cityhall.upgradeTo`). O `en.json` é a fonte, e o tipo `MessageKey` é gerado a partir dele.
- **Interpolação:** `{n}`, `{name}`. Plural por objeto `{ "one": "...", "other": "..." }` resolvido com `Intl.PluralRules(locale)`. Isso cobre as 6 formas do árabe e as 3 do russo, e KO/zh usam só `other`.
- **Metadados por mensagem** (arquivo `<locale>.meta.json` à parte, para não pesar o catálogo): `status` (`machine` | `reviewed`), `reviewer`, `date`. É a mesma ideia do glossário: tradução por IA fica marcada como "sem revisão nativa".
- **No servidor:** `t(locale, key, vars)` roda no build, dentro do `.astro`.
- **Nas ilhas:** recebem `strings={pick(locale, ["k1","k2"])}` via props. O check de orçamento continua valendo, porque o catálogo não entra no bundle.
- **Validador** (no `pnpm check`, como o do glossário):
  - toda chave do `en.json` existe nos 12 outros idiomas;
  - os placeholders batem;
  - não há string vazia;
  - as formas de plural exigidas por `Intl.PluralRules` estão presentes;
  - nenhum termo do glossário aparece escrito à mão (seção 3).

## 2. Estratégia de URL

**Recomendação: prefixo de idioma no caminho**, com o i18n nativo do Astro:
- `defaultLocale: "en"` com `prefixDefaultLocale: false`. As URLs atuais continuam valendo e não quebram links compartilhados.
- Os outros idiomas ficam em `/pt-br/…`, `/es/…`, `/zh-hant/…`, `/ar/…`, sempre minúsculos e com `trailingSlash: "always"`, como hoje.

| | Prefixo `/pt-br/...` (estático) | Troca só no cliente (mesma URL) |
|---|---|---|
| SEO | cada idioma é indexável, com `hreflang` e `canonical` próprios | o Google indexa só um idioma; o resto fica invisível |
| Compartilhar link | o link abre no idioma de quem enviou | depende do navegador de quem recebe |
| Custo | build ~13× maior em páginas (HTML estático, barato na Netlify) | JS e catálogos no cliente, que vão contra o orçamento |
| Offline / SW | o precache por idioma pode limitar-se ao idioma escolhido | um cache só |

Detalhes:
- **Em toda página:**
  - `<html lang dir>` correto;
  - `<link rel="alternate" hreflang>` para os 13 idiomas mais `x-default` (EN);
  - `canonical` apontando para a própria versão;
  - `og:locale`.
- **Sitemap:** um único arquivo, com as alternates de cada URL.
- **Detecção de idioma:** nunca redirecionar automaticamente por `Accept-Language`, porque isso atrapalha crawlers e links compartilhados. Na primeira visita, um aviso discreto sugere o idioma detectado. A escolha fica em `localStorage` (`ko:locale`), e o seletor leva à **URL equivalente** no outro idioma.
- **Páginas de app** (com login, rotina, cidade): também ganham prefixo, para manter um padrão só, mas levam `noindex`. Só os guias e as páginas públicas entram no sitemap.
- **Guias:** só ganham versão em outro idioma depois da compressão de conteúdo (backlog). Até lá, a rota traduzida mostra a interface traduzida e o corpo em EN, com aviso. Essa rota leva `noindex` para não competir com o original.
- **Service worker:** precachear só o idioma ativo. A lista do precache já é gerada por arquivo, então dá para filtrar pelo prefixo.

## 3. Como injetar os termos do glossário

Objetivo: o mesmo termo do jogo é escrito igual em todas as telas, e igual ao cliente do jogo.

1. **Referência por id, nunca texto solto.** No catálogo, a mensagem cita `{{term:city-hall}}`. Exemplo: `"cityhall.upgradeTo": "Melhore a {{term:city-hall}} para o nível {n}"`. O build substitui o token por `glossary.terms[id].translations[locale].text`.
2. **Flexão.** Para idiomas que flexionam (RU, AR, e TR com sufixos), o glossário pode ganhar formas opcionais (`forms: { gen: "…", acc: "…" }`) e o token vira `{{term:city-hall|gen}}`. Até existir a forma, a frase deve ser escrita para usar o termo no nominativo, como rótulo.
3. **Lint no `pnpm check`:**
   - falha quando um catálogo não-EN contém o texto EN de um termo do glossário (sinal de termo esquecido sem tradução);
   - falha quando contém uma variante rejeitada do termo;
   - avisa quando uma mensagem `reviewed` usa um termo que ainda está `unverified` no glossário.
4. **Para tradutores e IA:** o prompt ou pacote de tradução de cada idioma leva a tabela do glossário daquele idioma (termo EN → texto local + status) como restrição obrigatória. O revisor nativo confere primeiro os termos `unverified` (a lista está no relatório de cobertura).
5. **Modo revisor** (só em dev ou `?review=1`): cada termo injetado sai como `<span data-term="city-hall" data-status="unverified">`, com sublinhado pontilhado. Isso permite revisar a tela inteira de uma vez. Em produção, o span não é emitido (0 bytes).
6. **Nomes de comandantes:** também vêm do glossário (`commander-<id>`). Hoje há 35 comandantes; ao traduzir o guia de comandantes, entram os demais 74 com o mesmo processo.
7. **OCR / verificação de perfil:** o leitor de print (F-54) e a verificação pelo Álbum devem casar os rótulos do Perfil do Governador **no idioma do cliente**. Esses rótulos vêm do mesmo glossário (`kill-points`, `power`, `dead-troops`, `governor-id`…). Por isso eles estão no topo da lista de revisão.

## 4. Plano de RTL (árabe)

O árabe é o último da fila de entrega, mas as regras abaixo valem desde já, para não acumular dívida:
- **Atributos:** `<html lang="ar" dir="rtl">` vem do locale. O glossário já marca `dir: "rtl"` para `ar`.
- **CSS só com propriedades lógicas:** `margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`, `border-start-start-radius`. Um lint (stylelint `plugin/use-logical-spec` ou um grep no `pnpm check`) proíbe `left`/`right`/`margin-left` novos em `apps/web/src`. Antes de abrir o AR, fazer uma auditoria única dos estilos atuais.
- **Ícones direcionais** (setas, voltar, carrossel): espelhar com `:dir(rtl) { transform: scaleX(-1) }`. Logos, gráficos, relógios e ícones de mídia não são espelhados.
- **Números:** usar dígitos latinos (`ar-u-nu-latn` no `Intl.NumberFormat`), para casar com os números que o jogador vê e copia do jogo (poder, KP, IDs). Confirmar com o revisor AR. Datas com `Intl.DateTimeFormat("ar")`.
- **Bidi:**
  - nomes de governador, tags de aliança, IDs e códigos entram em `<bdi>` ou `unicode-bidi: isolate`;
  - campos de entrada de ID ou número levam `dir="ltr"`;
  - textos mistos (KvK, T5, VIP 10) são isolados.
- **Componentes:** carrossel de cidades, barras de progresso, tabelas e o seletor de rotas precisam de teste. Gráficos mantêm o eixo do tempo da esquerda para a direita (convenção comum em dashboards árabes; confirmar com o revisor).
- **Testes:** projeto Playwright `ar` com snapshot visual das telas principais, rodando axe com `lang`/`dir`.

## 5. Fontes: CJK e cirílico

Fontes atuais (`apps/web/src/styles/global.css`): Chakra Petch (títulos), IBM Plex Sans (texto) e IBM Plex Mono (números). Hoje só o subconjunto `latin` é importado.

| Script | Situação | Plano |
|---|---|---|
| Latim estendido (TR, VI, DE, FR, IT, ES, PT, ID) | Plex Sans e Mono têm `latin-ext` e `vietnamese`; Chakra Petch tem `latin-ext` e `vietnamese` | importar `latin-ext` e `vietnamese` (com `unicode-range`, o navegador só baixa se a página usar) |
| Cirílico (RU) | Plex Sans e Mono têm `cyrillic`; **Chakra Petch não tem** | importar `cyrillic` de Plex Sans e Mono. Títulos em RU usam IBM Plex Sans Condensed 600/700 (tem cirílico e mantém o tom técnico) via `:lang(ru)`. Avaliar só depois uma display com cirílico (ex.: Russo One) |
| Coreano | sem cobertura | `:lang(ko)` usa primeiro fontes do sistema (Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR do Android): **0 KB**. Opcional: IBM Plex Sans KR via `@fontsource`, fatiada por `unicode-range`, sem preload, carregada só em páginas `/ko/` |
| Chinês tradicional | sem cobertura | `:lang(zh-Hant)` usa primeiro fontes do sistema (PingFang TC, Microsoft JhengHei, Noto Sans CJK TC): **0 KB**. Opcional: Noto Sans TC fatiada, só em `/zh-hant/` e nunca no precache do SW |
| Árabe | sem cobertura | IBM Plex Sans Arabic (mesma família do texto), subconjunto `arabic`, só em `/ar/`. Fallback: Noto Naskh/Sans Arabic do sistema |

Regras:
- Usar `font-display: swap` e nenhum preload de fonte CJK ou árabe.
- As fontes ficam fora do orçamento de JS, mas entram na métrica de LCP. O check de orçamento pode ganhar um limite de fonte por rota (sugestão: 150 KB na primeira visita).
- CJK: `word-break: keep-all` para KO, `line-break: strict` para zh; altura de linha ~1,7; não usar itálico.
- Títulos em KO/zh não usam Chakra Petch (não tem glifos). O fallback precisa ter peso compatível com 600/700.

## 6. Ordem sugerida (quando a reestruturação da navegação terminar)

1. Infra:
   - `i18n` no `astro.config.mjs`;
   - `t()` com o validador de catálogo;
   - substituição dos tokens `{{term:…}}`;
   - `hreflang`, sitemap e seletor de idioma;
   - catálogo EN extraído das telas.
2. Idiomas latinos (pt-BR primeiro, pelos prints oficiais do dono), com tradução por IA marcada `machine` e o glossário como restrição.
3. RU, com títulos condensados.
4. KO e zh-Hant, com fontes do sistema e testes de quebra de linha.
5. AR, com auditoria de CSS lógico, bidi e testes RTL.
6. Guias por idioma, só depois da compressão de conteúdo.

Riscos:
- **Termos sem fonte:** 59% das células do glossário estão `unverified`. Mitigação: protocolo de prints com revisores (relatório de cobertura).
- **Termos que divergem do cliente:** o app KR é separado e o Gamota (VN) também. Mitigação: confirmar com revisor de cada edição.
- **Peso do build:** 13 idiomas multiplicam o número de páginas e o tempo de build. Mitigação: build incremental e cache da Netlify.
- **Flexão de termos:** RU, AR e TR flexionam. Mitigação: formas opcionais no glossário e redação que use o termo como rótulo.
