# Registro de fontes (v2 — integrado na onda 2, 2026-10-13)

Registro único, chaveado por **slug** (`src:<nome>`). Todas as fichas no schema v2 citam fontes por slug (`fontes[].id`). Os IDs provisórios usados na onda 1 (S01–S09, SP01–SP05, SA01–SA38 da coleta de estratégia, SA01–SA10 da coleta de economia — **colidem entre si**, CS01–CS48, C04-S01..S06, PL01) estão mapeados na seção "Mapa de IDs antigos". Integração feita pelo sub-admin CONTA a partir de `raw/*/_sources.md` (A-pilot, A-strategy, A-economy, patches, competitors, pains-players; pains-leaders não tem `_sources.md` — fontes inferidas dos cabeçalhos dos arquivos raw).

Regras de uso: ver `schemas/fato.md` (v2). Resumo dos níveis:

| Nível | Tipo | Uso permitido |
|-------|------|---------------|
| T0 | Observação direta (prints/registro do próprio jogo, com data e versão) | Mecânica verificada |
| T1 | Oficial (Lilith: notas de patch, fórum oficial, ToS, texto do jogo) | Mecânica verificada |
| T2 | Dados primários da comunidade (wiki com histórico, transcrição de texto oficial do jogo) | Mecânica; verificada se 2 fontes **independentes** concordarem |
| T3 | Guias/criadores | Estratégia; mecânica só como "não verificada" |
| T4 | Voz do jogador (Reddit, reviews, comentários) | Dores, sentimento; na onda 2 também usado como **corroboração** de estratégia/frequência de eventos (nunca eleva mecânica acima de `media`) |

## Como acessar (lições da onda 1/2)

| Situação | O que funciona | O que não funciona |
|---|---|---|
| Fórum oficial Lilith | API JSON pública: lista `https://forum-global.lilithgame.com/api/v2/posts?account_id=10000000&limit=100&offset=N` (832 posts oficiais em 2026-10-13); **conteúdo completo** só em `/api/v2/posts/<id>` com header `language: en_US` (a lista trunca `plain_content` em ~200 caracteres). Comentários: `/api/v2/comments?post_id=<id>` (T4). | `rok-club.lilith.com` (só JS). Site legado `forum.lilithgame.com` (host morto). |
| Fandom wiki | MediaWiki API via **curl** (UA não-navegador, ex. `rok-research/0.1`): `api.php?action=parse&page=<Título>&prop=wikitext` ou `prop=text`; datas e autores de revisão: `action=query&prop=revisions&rvprop=timestamp\|user\|comment`; diffs: `action=compare&fromrev=&torev=`. Comentários de edição são evidência útil (ex.: "updated the building requirement from CH lv 10 -> 12"). | HTML das páginas (402/403). Python `urllib` com UA padrão (403). Comentários HTML (`<!-- -->`) só aparecem no wikitext, não no `prop=text`. |
| riseofkingdomsguides.com | curl com UA padrão do curl. | UA de navegador dispara página "Bot Verification" depois de algumas requisições. `/vip-guide/` atrás de bot-check. |
| Reddit r/RiseofKingdoms | **Arctic Shift API** (arquivo público): `https://arctic-shift.photon-reddit.com/api/{posts\|comments}/search?subreddit=RiseofKingdoms&{query\|body}=...&limit=N`; árvore: `/api/comments/search?link_id=<id>`. Rate-limit ("Timeout. Maybe slow down a bit") → retry com espera. | reddit.com / old.reddit (403), WebFetch recusa reddit.com, mirrors redlib (404/503). |
| allclash.com | Páginas de artigo com UA de navegador. | Busca e sitemaps (403). |
| ldshop.gg | UA Firefox + `--http1.1`. | curl padrão (403). |
| heaven-guardian.com | Intermitente; algumas páginas respondem, outras dão `Connection reset by peer` (curl 35) mesmo após espera. | — |
| rok.guide | — | **DNS morto** (SERVFAIL / CONNECT 502). Tratar como fonte perdida. |
| web.archive.org | — | Conexão resetada / bloqueado. |
| WebFetch (ferramenta) | Útil para triagem. | **Não é literal**: o sumarizador parafraseia e já trocou colunas de tabela. Toda citação "(WebFetch)" foi rechecada na onda 2 com curl + parsing local (ver `facts/_verificacao-wave2.md`). Tabelas: sempre curl + parser. |
| Lojas de apps | iTunes RSS `itunes.apple.com/<cc>/rss/customerreviews/...`; Google Play via `google-play-scraper`. | — |

## Registro (por slug)

Colunas: **Tier** · **Última atualização vista** (da fonte, não do acesso) · **Como acessar** · **copia_de** (fonte original quando a fonte copia outra — não conta como independente) · **CoI** (conflito de interesse: vende recarga/contas/boosting) · IDs antigos.

### Oficiais e observação direta

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
| `src:t0-victor` | Prints e medições do diário de conta nova (Victor, conta F2P em reino novo) | T0 | a partir de 2026-10 | `research/protocolos/prints/` (nome `YYYY-MM-DD_dayNN_topic.png`) + `protocolos/t0-log.csv` | — | — | — | Protocolo: `protocolos/t0-medicao.md`. Cada ficha que citar T0 informa data, dia do reino, CH e versão do jogo. |
| `src:lilith-forum` | Fórum oficial global de RoK (conta oficial 10000000, "Rise of Kingdoms", GM) | T1 | Último patch note EN: **1.1.09 (post 2259768, 2026-06-23)**; posts oficiais até 2026-10 | API JSON (ver acima) | — | — | S01 (todos os agentes), C04 "S01 sub-source" | Notas de patch descrevem **mudanças**, não tabelas-base. Q&A de devs = intenção, não garantia. 1.0.97, 1.1.05 e 1.1.10–1.1.12 sem nota EN. |
| `src:lilith-forum-comments` | Comentários de jogadores no fórum oficial | T4 | 2026-10 | `/api/v2/comments?post_id=` | — | — | (pains-players) | Voz do jogador, não mecânica. |
| `src:lilith-tos` | Termos de Serviço Lilith (EN) | T1 | show_at 2025-04-15 | https://www.lilith.com/termofservice/?locale=en_US (texto em JSON embutido) | — | — | CS01, S09 | |
| `src:rok-official-site` | Site oficial rok.lilith.com | T1 | 2026-10 | curl | — | — | CS02 | Só links de Privacidade/ToS. |
| `src:lilith-forum-legacy` | Fórum antigo forum.lilithgame.com (Anti-Botting Reports) | T1 | 2018–2019 | só snippets de busca (host morto) | — | — | CS03, CS04 | |
| `src:x-riseofkingdoms` | X/Twitter oficial @riseofkingdoms | T1 | ~2025-10 | snippets de busca | — | — | C04 "S01 sub-source" | |
| `src:rkg-lyceum` | Respostas do quiz Lyceum of Wisdom / Peerless Scholar (texto oficial do jogo, transcrito por riseofkingdomsguides) | T2 (oficial-transcrito) | modificado 2026-10-01 | https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/ (curl) | — (independente da Fandom) | — | SP05 | **Atenção (onda 2):** perguntas antigas não são atualizadas pelo jogo — ex.: "1000 AP sem buffs" contraria o patch 1.0.41 (2020) que subiu o máximo para 1.500. Usar como T2, nunca como T1. |

### Dados primários da comunidade (T2)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
| `src:fandom` | Rise of Kingdoms Wiki (Fandom) | T2 | Por página: CH Requirements 2026-01-04; Trading Post Requirements 2026-08-11; VIP 2026-08-02; Civilizations 2025-12-04; Daily Objectives **2020-01-11**; Builder queue 2020-04-30; Shop (VIP Shop) 2023-10-12; Barbarians 2024-11-07; Peerless Scholar 2023-04 (obsoleta); Goldmine 2018-12 | MediaWiki API (ver acima) | — | — | S02, CS13 | Tempos de construção "fornecidos pelos devs" (dataset de 2018, sem Lv.25). Poucos editores ativos; edições de 2026 por jogadores (ex.: Academy/Quarry CH6, Trading Post CH12) são **observações não confirmadas**. Licença CC-BY-SA. |
| `src:rok-guide` | rok.guide | T2/T3 | desconhecida | **inacessível** (DNS) | — | — | S03, CS11 | Fonte perdida; relevante para C01. |
| `src:davor-toolkit` | Davor's Toolkit (Codex Helper) | T2/T3 | 2026-08 | curl | — | — | CS21 | Calculadoras. |

### Guias e criadores (T3)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
| `src:rkg` | riseofkingdomsguides.com | T3 | `dateModified` 2026-01-02 em quase todos os posts (re-save em massa, **não** é data de revisão); tier list "October 2026"; patch log parou em 2025-02-06 | curl (UA padrão) | **src:fandom** para tabelas de prédios (typo compartilhado "1,322,48"), tabela do VIP Shop (idêntica à Fandom) e limiares VIP 1–15 | — (anúncios) | S04, CS07–CS10; estratégia SA01–SA04, SA06, SA07, SA09, SA12, SA15, SA17, SA19, SA20, SA23, SA33, SA34, SA36–SA38 | Tabelas às vezes velhas (Hospital, capacidade do Trading Post). Contradições internas (Books of Covenant; Wheel of Fortune). |
| `src:gamerempire` | Gamer Empire — guia de City Hall | T3 | pub 2021-04-08, mod 2024-05-24 | curl | parcialmente independente da Fandom (typos próprios) | — | SP01 | |
| `src:bluestacks` | BlueStacks blog (F2P guide, FAQ, mistakes) | T3 | 2021-02/03 | curl | — | — (emulador) | SP02, SA05, SA21 | Antigo; "builder VIP 7" errado; conselho de jumping obsoleto. |
| `src:lootbar` | LootBar blog (rotina, progressão F2P, tier list, cura, equipamento) | T3 | 2026-04 → 2026-08 | curl | — | **sim** (vende recarga de gemas) | SP03, SA05 (economia), SA13, SA25, SA28, C04-S04 | Genérico; conselhos F2P anti-gasto reduzem o viés nesses pontos. |
| `src:allclash` | AllClash (guia de coleta, academia, tier lists) | T3 | coleta: pub 2020-02-21, mod 2026-08-23; tier list 2026-09-10/15 | curl com UA navegador (artigos) | — | — | SP04, SA01 (economia), SA10, SA24, SA26, C04-S02, CS12 | Conteúdo 2019–2020 com datas novas; tier list 2026 atual. |
| `src:heaven-guardian` | heaven-guardian.com (farm, trading post, top-up, academia, T5, eventos) | T3 | 2026-09-02 → 2026-10-07 | curl (intermitente) | parte copia um "source guide" (declarado); TP table ≈ src:rkg | **sim** (marketplace de contas / top-up) | SA02 (economia), SA11, SA27, SA32, C04-S05 | 3 páginas inacessíveis na onda 2 (connection reset): academy, trading-post, unlock-t5. |
| `src:pocketgamer` | Pocket Gamer — recursos | T3 | 2022-11-04 | curl | — | — | SA03 (economia) | |
| `src:theriagames` | Theria Games (trading post, monumento, calculadoras) | T3 | 2025-02-07 | curl | — | afiliados | SA04 (economia), SA31, CS14 | Afirma que ouro não pode ser enviado — **contrariado** na onda 2. |
| `src:packsify` | Packsify blog | T3 | 2026-03-21 | curl | — | **sim** (vende pacotes) | SA06 (economia), SA08, SA18 | Orientado a whale. |
| `src:oldmanduck` | Old Man Duck "School of RoK" | T3 | c. 2020 | curl | — | — | SA07 (economia) | |
| `src:appgamer` | AppGamer | T3/T4 | 2020 | **403** (só snippets) | — | — | SA08 (economia), CS05, CS47 | |
| `src:boostroom` | Boostroom blog (farming, KvK) | T3 | 2026-09-02 | curl | **src:rkg** para tamanho de gem deposits ("Current references list: Level 1 Gem Deposit: 10 Gems…") | **sim** (boosting) | SA10 (economia), SA35 | |
| `src:onechilledgamer` | OneChilledGamer — resumo de KvK | T3 | 2022-03-24, upd. 2024-04-29 | curl | — | — | SA14 | Velho (>18 meses). |
| `src:ldshop` | LDShop blog (patches 1.1.10–1.1.12, tier list) | T3 | 2026-09-22 | UA Firefox | — | **sim** (top-up) | SA16, SA29, C04-S01 | Única fonte para 1.1.10–1.1.12; às vezes truncado. |
| `src:youtube-summary` | youtubesummary.com (resumo por IA de vídeo YouTube, Seal Gaming, id A1jemAl-SQY) | T3/T4 | desconhecida | curl | resumo de `src:youtube` | — | SA22 | **Não literal** (resumo de IA). |
| `src:youtube` | Criadores de RoK no YouTube | T3 | — | só títulos via busca | — | — | S06 | |
| `src:ajackof` | A Jack Of — missões do Monumento | T2/T3 | sem data | curl | — | — | SA30 | Tabela sem data; confirmar com T0. |
| `src:nedese` | nedese.com — lista de comandantes 2026 | T3 | 2026-09-16 | curl | — | — | C04-S03 | |
| `src:rokhandbook` | RoK Handbook | T3 | 2026-08-18 | curl | — | — | CS06 | |
| `src:k2779-rules` | Site de regras do Reino 2779 (DKP, imigração, exílio) | T3 (regra primária de um reino) | sem data (era KvK2) | https://sites.google.com/view/jlateam/kingdom-rules/dkp (curl) | — | — | PL04 (pains-leaders) | Mesmo template de `src:k2708-rules` (frase de exílio idêntica) → **não independente** dele. |
| `src:k2708-rules` | Site de regras do Reino 2708 (sistema de DKP) | T3 (regra primária de um reino) | sem data (era KvK1) | https://sites.google.com/view/rok-2708/dkp-system (curl) | mesmo template de `src:k2779-rules` | — | PL05 (pains-leaders) | Contar com `src:k2779-rules` como uma norma só. |

### Voz do jogador (T4)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
| `src:reddit` | r/RiseofKingdoms | T4 (posts longos: T3) | 2026-10-12 | **Arctic Shift API** (ver acima) | — | — | S05, SA09 (economia), PL01 (pains) | Na onda 2 usado para corroborar: frequência do More Than Gems, VIP cumulativo, envio de ouro, timing de KvK1. Viés: veteranos e reclamações sobre-representados. |
| `src:google-play` | Reviews Google Play (`com.lilithgame.roc.gp`) | T4 | 2026-10-12 | google-play-scraper | — | — | S07 | |
| `src:appstore-ios` | Reviews App Store (id1354260888) | T4 | 2026-10-11 | iTunes RSS | — | — | S07 | |
| `src:change-org` | Petição #BRINGBACKJUMPING | T4 | 2025-03-21 | curl | — | — | C04-S06 | Cita o e-mail in-game sobre o fim do Beginner's Immigration. |

### Ferramentas e concorrentes (C01/C02 — fonte para "o que a ferramenta diz de si")

| Slug | Fonte | Tier | IDs antigos | Notas |
|---|---|---|---|---|
| `src:metarok` | MetaRoK (meta-rok.com) | T3 | CS16 | `metarok.com` é domínio estacionado (CS18). |
| `src:rok-calculator` | rok-calculator.com | T3 | CS15 | © 2024. |
| `src:rokhub` | RoK Hub (rokhub.xyz) | T3 | CS17 | 402 DEPLOYMENT_DISABLED. |
| `src:codexhelper` | Codex Helper (+ docs FAQ) | T3 | CS19, CS20 | Patreon $5/mês. |
| `src:zoe-bot` | Zoe RoK bot (Discord Bot List) | T3 | CS22 | |
| `src:auctioneer-bot` | Auctioneer Bot | T3 | CS23 | |
| `src:rokstats-online` | ROKSTATS (app.rokstats.online) | T3 | CS24, CS25 | |
| `src:rokstats-com` | rokstats.com | T3 | CS26 | |
| `src:botals` | Botals scan service | T3 | CS27 | |
| `src:apo-rok` | APO RoK Data Analytics | T3 | CS28 | |
| `src:roksteward` | ROK Steward | T3 | CS29 | |
| `src:heroscroll` | Hero Scrolls | T3 (+T4 depoimentos) | CS30 | |
| `src:kingdomos` | KingdomOS | T3 | CS31 | login wall. |
| `src:github` | Repositórios GitHub (rok-suite, rokbattles, RokTracker ×2, Rise-of-Kingdoms-Bot, roka, rokmonster, rok-talents, rok-data, rok-scan-stats, …) | T3 | CS32–CS42, S08 | Evidência de viabilidade técnica e de dores (pains-leaders). |
| `src:apievangelist` | API Evangelist — Lilith Games | T3 | CS43 | Sem API pública. |
| `src:justia` | Justia trademark 88373088 | T2 | CS44 | 403; snippet. |
| `src:us-copyright` | US Copyright Office Circular 33 | T1 (jurídico, EUA) | CS45 | |
| `src:alternativeto` | AlternativeTo — Rokverse | T3 | CS46 | 403; snippet. |
| `src:everycalculators` | everycalculators.com | T3 | CS48 | |

## Mapa de IDs antigos → slug

Os IDs `SAxx` **colidem** entre a coleta de estratégia (A02, A06, A07, A08, A11, B01) e a de economia (A03, A12, A13). A migração v2 resolveu por **domínio da URL**, não pelo ID.

| ID antigo | Contexto | Slug |
|---|---|---|
| S01 | todos | `src:lilith-forum` |
| S02 | todos | `src:fandom` |
| S03 | todos | `src:rok-guide` |
| S04 | todos | `src:rkg` (exceto a página do Lyceum → `src:rkg-lyceum`) |
| S05 | todos | `src:reddit` |
| S06 | patches | `src:youtube` |
| S07 | pains-players | `src:google-play` / `src:appstore-ios` |
| S08 | pains-players, plano | `src:github` |
| S09 | plano | `src:lilith-tos` |
| SP01–SP05 | A-pilot | `src:gamerempire`, `src:bluestacks`, `src:lootbar`, `src:allclash`, `src:rkg-lyceum` |
| SA01–SA10 | **A-economy** (A03, A12, A13) | `src:allclash`, `src:heaven-guardian`, `src:pocketgamer`, `src:theriagames`, `src:lootbar`, `src:packsify`, `src:oldmanduck`, `src:appgamer`, `src:reddit`, `src:boostroom` |
| SA01–SA38 | **A-strategy** (A02, A06, A07, A08, A11, B01) | por site: riseofkingdomsguides → `src:rkg`; BlueStacks → `src:bluestacks`; Packsify → `src:packsify`; AllClash → `src:allclash`; Heaven-Guardian → `src:heaven-guardian`; LootBar → `src:lootbar`; OneChilledGamer → `src:onechilledgamer`; LDShop → `src:ldshop`; youtubesummary → `src:youtube-summary`; A Jack Of → `src:ajackof`; Theria → `src:theriagames`; Boostroom → `src:boostroom` |
| CS01–CS48 | competitors | ver tabela de ferramentas e oficiais |
| C04-S01…S06 | patches | `src:ldshop`, `src:allclash`, `src:nedese`, `src:lootbar`, `src:heaven-guardian`, `src:change-org` |
| PL01 | pains-leaders (B01–B09) | `src:reddit` |
| PL02 | pains-leaders | `src:lilith-forum` |
| PL03 | pains-leaders | `src:github` (READMEs de rok-scan-stats, RokTracker, roka, RoK-Title-Bot etc.) |
| PL04, PL05 | pains-leaders | `src:k2779-rules`, `src:k2708-rules` |
| PL06, PL07, PL08, PL09 | pains-leaders | `src:roksteward`, `src:rokstats-online`, `src:codexhelper`, `src:auctioneer-bot` |
| PL10 | pains-leaders | `src:lootbar` |
| PL11, PL12 | pains-leaders | `src:heaven-guardian` |
| PL13 | pains-leaders | `src:rkg` |

Fichas B02–B09 migradas para slugs em 2026-10-13 (PL01–PL13).

## Independência (para a regra "T2 confirmado por 2 fontes independentes")

- `src:rkg` **não** é independente de `src:fandom` em tabelas de prédios, VIP Shop e limiares VIP.
- `src:boostroom` **não** é independente de `src:rkg` em gem deposits.
- `src:heaven-guardian` declara copiar um guia-fonte; tabelas de Trading Post ≈ `src:rkg`.
- `src:rkg-lyceum` (texto oficial do quiz) **é** independente de `src:fandom`, mas pode estar desatualizado.
- `src:youtube-summary` é derivado de `src:youtube` e não é literal.

## Onda J (2026-10-13) — fontes novas por frente

Cada frente da onda J registra aqui, **só na sua subseção**, as fontes novas que cita (mesmas colunas da tabela de guias). Evita conflito de merge entre worktrees.

### J1 — Progressão tardia: comandantes e equipamento (A06, A07)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
| `src:topuplive` | TopUpLive blog (topuplive.com/news): "Rise of Kingdoms Commanders Tier List 2026" | T3 (vendedor de recarga: **conflito de interesse**) | pub 2026-08-14, mod 2026-08-18 | curl (UA padrão) | — | **sim** (top-up) | — | Mantém conteúdo antigo com data nova (ex.: recomenda Alexander/Saladin para KvK3). Versões em outros idiomas trazem listas diferentes. Não é independente de outras lojas (lootbar/topuplist) em formato, mas o texto não é cópia literal das que foram verificadas. |

<!-- separador J1/J2: não editar -->
<!-- . -->
<!-- . -->

### J2 — Progressão tardia: tropas, cura, pesquisa, economia de gemas (A08, A02, A04, B01)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|

Sem slugs novos. Notas de acesso da J2 (2026-10-13):

- `src:lilith-forum` · 832 official posts via list API (`limit=100`, offsets 0–800) — list pages already include full `content` · curl, header `language: en_US` · Latest English post still 2026-06-23 (1.1.09). Key late-game posts: 1030636, 1062616, 1071541, 1108303/1108923, 1359527, 1589003, 1599092, 1831889, 1868790, 1896244, 2030530, 2179486, 2213663.
- `src:rkg` · WordPress REST `wp-json/wp/v2/posts/<id>` and `?search=`; `date` = real publication, `modified` 2026-01-02 = mass edit · curl default UA · Calculator constants live in plugin JS (e.g. `plugins/healing-calculator/healing-calculator.js`) — literal but T3 tool data.
- `src:fandom` · `Buildings/Hospital`, `Technology/Medical_Corps`, `Technology/Royal_Guard`, `Buildings/Castle/Requirements`, `Frequently_Asked_Questions`, `Events/The_Mightiest_Governor` · MediaWiki API · No Hall of Heroes / Healing / Crystal Technology pages; no per-unit troop costs.
- `src:packsify`, `src:lootbar`, `src:boostroom` · late-game T5/healing/KvK-prep guides (2026) · curl Firefox UA · CoI (top-up / boosting sellers).
- `src:reddit` · — · Arctic Shift full-text search returned "Timeout"/"Too many requests" all session · Not used by J2.
- (appgamer.com, everycalculators.com) · — · Cloudflare 403 · Not cited.

<!-- separador J2/J3: não editar -->
<!-- . -->
<!-- . -->

### J3 — Compras baratas (Low spender) e valor por dólar (A12, A11)

| Slug | Fonte | Tier | Última atualização vista | Como acessar | copia_de | CoI | IDs antigos | Notas |
|---|---|---|---|---|---|---|---|---|
