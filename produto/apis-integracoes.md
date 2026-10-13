---
tema: "APIs e serviços externos para o megahub"
gerado_em: 2026-10-13
autor: API Scout (agente)
entradas: produto/arvore-funcionalidades.md, produto/backlog-sistema.md, research/context/competitors-and-constraints.md, research/fontes.md, research/brainstorm/backlog-ideias.md
notas_brutas: research/raw/apis/_acessos-2026-10-13.md
---

# APIs e integrações: o que dá para plugar no megahub

> Pesquisa feita em 2026-10-13. Preços, limites e termos foram conferidos na página oficial de cada serviço nessa data, salvo quando está marcado **não verificado**. Preço de nuvem muda com frequência, então confira de novo antes de assinar qualquer coisa. Isto é pesquisa de produto, não parecer jurídico.
>
> **Filtro aplicado em tudo (ToS da Lilith):** nada de automação dentro do jogo, nada de ler arquivos do cliente ou tráfego de rede, nada de pedir credenciais do jogo, nada de assets da Lilith e nada de dados de terceiros sem consentimento (ToS 17.1.6, 17.1.7, 17.1.12, 17.1.13, 17.1.15, 17.1.18, §8; ver `research/context/competitors-and-constraints.md`). Tudo o que depende disso está em §5, "Excluídas".

## 1. Resumo e principais recomendações

1. **Não existe API oficial de Rise of Kingdoms, e nenhuma ferramenta da comunidade tem API pública que possamos consumir.** ROKSTATS, Hero Scrolls, Botals, APO, ROK Steward, Codex Helper e Zoe não publicam API. Todos os dados "ao vivo" que eles têm vêm de scanners automatizados (ADB/emulador, contas em reino), da leitura de arquivos do cliente (ROK Battles) ou de uploads. **Nossa base de dados do jogo continua sendo a nossa** (`facts/`, T0, notas de patch). APIs externas de RoK só entram no **pipeline editorial**, e nunca como fonte exibida ao vivo.
2. **MVP (estático, sem login):** não precisa de nenhuma API paga. Usar só bibliotecas: **Satori** para gerar as imagens OG do Share Kit (F-57) no build, **@date-fns/tz ou Luxon** para o relógio UTC do reino e **PostHog** (plano gratuito de 1M eventos/mês) ou **Plausible** para medir o critério de saída (retorno D7). Atenção: o Plausible não rastreia indivíduos, então **não mede D7 por usuário**. Ver §3.9.
3. **R1 (ainda sem backend):** **exportação ICS** gerada no cliente para o calendário do reino e para os lembretes de evento (F-24, F-25), o que dispensa push e servidor. **PapaParse e SheetJS** no cliente para colar ou importar planilhas no Requirements Card e no teste do MGE Ledger em planilha (F-34, F-35). Pipeline editorial com a **API JSON do fórum Lilith** e a **API MediaWiki da Fandom**, usadas só como insumo humano para F-28 e F-50, em baixo volume. **Canvas/Satori no cliente** para o Profile Card (F-10).
4. **R2 (entra o backend):** **Supabase** (Postgres + Auth + Storage, com RLS) para F-53. **Discord OAuth2** como login principal, com e-mail por magic link (**Resend**) como alternativa. **Web Push** (VAPID) para lembretes e alerta de farm ociosa. **OCR de print próprio (F-54)** com **PaddleOCR ou Tesseract self-hosted** como primeira opção, e **Google Cloud Vision** ou **Claude (visão)** como fallback pago. **Google Sheets API com escopo `drive.file`** para importar as planilhas que os líderes já usam (F-37). **Webhooks do Discord** para avisos de reino. **Moderação de imagem** (Google SafeSearch ou AWS Rekognition) no upload de avatar.
5. **R3 (rede e escala):** **Discord bot** com slash commands e **Linked Roles** (F-58, F-49, F-55). **Claude API com Citations** para o Ask-with-Context Assistant (F-59). A base de fatos é pequena, então **cache de prompt resolve antes de precisar de vector DB**. Se a base crescer, usar **Voyage AI** para embeddings com **pgvector** no próprio Supabase. **Stripe** só depois de revisão jurídica (o §8 do ToS proíbe uso comercial de Lilith Content).
6. **Maiores riscos:** (a) o próprio ToS da Lilith (17.1.7) proíbe "crawlers/data mining tools" sobre Lilith Content, e isso alcança até a **API do fórum oficial** se for usada de forma automatizada em produção. (b) Dados de terceiros (17.1.13 e LGPD/GDPR) no Data Intake e no OCR. (c) Dependência de planos gratuitos que mudam: o SendGrid acabou com o plano free em 2025, e o Google avisa que o uso acima da cota do Sheets e do Calendar "passará a ser cobrado" a partir de 2026.

## 2. Matriz

Legenda de recomendação: **MVP / R1 / R2 / R3** (entra nessa release), **avaliar** (prova de conceito ou decisão antes), **excluir**. "Só editorial" quer dizer que a fonte é usada pelo time para checar e atualizar fatos, e o produto nunca a consome ao vivo.

| API / serviço | Categoria | O que oferece | Features (F-xx) | Custo / limites (verificado em 2026-10-13) | Termos / licença | Risco (ToS · privacidade · dependência) | Recomendação |
|---|---|---|---|---|---|---|---|
| **Lilith forum JSON API** (`forum-global.lilithgame.com/api/v2`) | Dados RoK | Posts oficiais (notas de patch, anúncios) e comentários | F-28, F-50, F-31, F-02 (só editorial) | Grátis; sem documentação nem limite publicados; 832 posts oficiais em 2026-10-13 | Sem termos de API. O conteúdo é Lilith Content (§8: uso pessoal e não comercial). 17.1.7 proíbe crawlers e "data mining tools" | ToS **médio** se automatizado em produção; baixo para leitura humana pontual. API não documentada pode mudar | **R1 só editorial** (puxada manual ou semi-manual, guardar link e paráfrase, nunca republicar) |
| **Fandom MediaWiki API** (`riseofkingdoms.fandom.com/api.php`) | Dados RoK | Wikitext, histórico de revisões, diffs | F-50 (checagem cruzada), F-28 | Grátis; limite não publicado (não verificado); HTML dá 402/403, a API responde | Texto em **CC-BY-SA** (confirmado via `siprop=rightsinfo`). Termos de uso da Fandom **não verificados** (403). Imagens são assets da Lilith | Baixo para fatos. Copiar texto obriga a atribuição e share-alike. Wiki fraca (cerca de 2 editores ativos) | **R1 só editorial**. Não copiar texto nem imagens |
| **Arctic Shift API** (arquivo do Reddit) | Pesquisa | Busca em posts e comentários do r/RiseofKingdoms | Validação de F-17 ("30 posts what next?"), dores, F-29 | Grátis; rate limit dinâmico (header `x-ratelimit-reset`); `limit` de 1 a 100 ou "auto" | Projeto pessoal com doações. O conteúdo é do Reddit e dos usuários. Os Data API Terms do Reddit (3.1) exigem acordo próprio para uso comercial da API oficial | Dependência: um único mantenedor. Usar dados do Reddit no produto exigiria acordo com o Reddit | **Só pesquisa interna** (nunca exibir nem alimentar o produto) |
| **Reddit Data API** (oficial) | Pesquisa / distribuição | OAuth, posts, comentários | F-57 (talvez) | Limites "a critério do Reddit" (2.9); 100 QPM/OAuth segundo anúncio de 2023 (**não verificado** na fonte primária) | Data API Terms: uso comercial exige acordo separado (3.1); proibido treinar IA com User Content sem permissão (3.2) | Alto para uso comercial sem acordo | **Excluir** do produto; avaliar só se surgir caso concreto |
| **ROK Steward** | Dados RoK (admin) | Relatórios a partir do xlsx de stats que o líder sobe | Referência de formato para F-37, F-38 | $4.99/pacote, $9.99/mês, $89/ano (C01-0017); **sem API** | Proprietário | Concorrente. O formato de entrada é o "xlsx exportado do jogo" (existência oficial **não verificada**, C02-0016) | **Avaliar**: aceitar o mesmo formato de arquivo no F-37 (interoperar, não integrar) |
| **rok-suite** (avweigel, GitHub) | Código de referência | Suíte de admin (DKP, emigração, calendário com iCal, Supabase) | F-24, F-37, F-38, F-41 | Grátis | README declara MIT | Projeto de um reino só | **Avaliar** como referência de arquitetura (e não como dependência) |
| **RokVision** (feels-dev, GitHub) | OCR RoK | API de OCR (PaddleOCR + .NET) para perfil, inventário, relatórios e mapa | F-54, F-16, F-30 | Self-host (Docker) | MIT (badge do README) | Endpoints de mapa, rally e relatório de batalha extraem **dados de terceiros** e ficam vedados. Projeto pequeno (cerca de 7 estrelas) | **Avaliar (R2)**: usar só os extratores de perfil e inventário próprios |
| **rokmonster/ocr** | OCR RoK | OCR por templates de zona em screenshots (Go, Tesseract) | F-54 | Self-host | GPL-3.0 | GPL: rodar no servidor não obriga a abrir o código, mas distribuir obriga | **Avaliar** só como referência |
| **ROKSTATS, Hero Scrolls, Botals, APO** | Dados RoK | Stats de reino e governador | — | ROKSTATS: AIO $40/mês, Kingdom Pro $70/mês, Title Manager $20/mês, KvK a partir de $25 (página inicial, 2026-10-13); **nenhuma API pública encontrada** | Proprietário | Dados vêm de **scans automatizados** (17.1.7, 17.1.15, 17.1.13) | **Excluir** como fonte (ver §5). Aceitar só arquivo exportado pelo líder, sob as regras do F-37/F-56 |
| **ROK Battles** | Dados RoK | Relatórios de batalha | — | Grátis | Termos próprios | Lê a pasta **mailcache do cliente** no PC e intercepta DNS no celular (Intra/perfil iOS) → 17.1.6/17.1.12 | **Excluir** |
| **Discord OAuth2** | Identidade | Login (`identify`, `email`, `guilds`, `guilds.members.read`) | F-53, F-05, F-06, F-44 | Grátis; limite global de 50 req/s por bot; 10.000 requisições inválidas a cada 10 min por IP | Developer Terms e Developer Policy (**não verificados**: 403) | Baixo. Público já vive no Discord. Dependência de plataforma | **R2** (login principal) |
| **Discord bot + slash commands + webhooks** | Comunidade | Comandos (100 globais), webhooks, Guild Scheduled Events | F-58, F-24, F-44, F-35, F-33, F-42 | Grátis; interações não contam no limite global | Idem | Mercado lotado (Codex Helper, Zoe). Message Content é intent privilegiado | **Webhooks R2**; **bot R3** |
| **Discord Linked Roles** (role connection metadata) | Identidade | O app publica metadados e o servidor exige isso para dar um cargo | F-49, F-55, F-06 | Grátis; máx. 5 registros de metadata por app | Idem | Bom contra impersonação: o cargo "R4 verificado pelo hub" sai sem senha | **R3** |
| **Google OAuth / Apple / e-mail magic link** | Identidade | Logins alternativos | F-53 | Incluído no Supabase/Clerk | — | — | **R2** (e-mail + Google como alternativa ao Discord); Apple só se houver app nativo |
| **Google Sheets API** | Planilhas | Ler e escrever planilhas dos líderes | F-37, F-38, F-35, F-34, F-46 | Grátis; 300 leituras e 300 escritas/min por projeto, 60/min por usuário; sem limite diário. Excedente "planejado para ser cobrado" em 2026 | Escopos `spreadsheets` = **sensitive** (exige verificação do app pelo Google); `drive.file` = **non-sensitive, recomendado** | Planilha tem dados de terceiros (17.1.13). Mudança de cobrança | **R2** com `drive.file` + Google Picker; no R1, importar via "Publicar na web → CSV" ou colar |
| **Microsoft Graph (Excel)** | Planilhas | CRUD em workbooks | F-37 | Incluído no M365; throttling não detalhado na página | Só OneDrive for Business e SharePoint; **OneDrive pessoal não é suportado**; só .xlsx | Público de RoK raramente usa M365 business | **Excluir** do roadmap (upload de .xlsx resolve) |
| **PapaParse** | Planilhas (lib) | Parser CSV no navegador | F-34, F-30, F-37, F-38, F-16 (colar em lote) | Grátis | MIT; v5.7.0 (2026-08-24) | Nenhum | **R1** |
| **SheetJS (xlsx)** / **ExcelJS** | Planilhas (lib) | Ler e escrever .xlsx no navegador | F-37, F-38, F-35 | Grátis | SheetJS CE: Apache-2.0, mas **o npm parou em 0.18.5 (2022)**; versões novas saem pelo CDN próprio (cdn.sheetjs.com). ExcelJS: MIT, 4.4.0 (2023) | Manutenção do pacote npm | **R1** (SheetJS via CDN oficial) |
| **Tesseract / tesseract.js** | OCR | OCR open source; roda no navegador (wasm) | F-54, F-16, F-30 | Grátis | Apache-2.0; tesseract.js 7.0.0 (2025-12-15) | Precisa de pré-processamento (fonte estilizada, fundo texturizado). Usado pelos scanners RokTracker | **R2** (opção no cliente: a imagem nem sai do aparelho) |
| **PaddleOCR** | OCR | OCR por deep learning (servidor Python) | F-54 | Grátis (self-host) | Apache-2.0; 3.7.0 (2026-06-11) | Precisa de servidor com CPU ou GPU | **R2** (opção principal no servidor; base do RokVision) |
| **Google Cloud Vision** (Text / Document Text, SafeSearch) | OCR + moderação | OCR e detecção de conteúdo explícito | F-54, F-05, F-06 | 1.000 unidades/mês grátis por recurso; depois $1,50 por 1.000 (até 5M). SafeSearch é grátis junto com Label Detection | Google Cloud ToS | Imagem sai para terceiro (registrar no F-56) | **R2 fallback** (OCR e moderação) |
| **AWS Textract** | OCR | Detect Document Text | F-54 | $0,0015/página (us-west-2, primeiro 1M); free tier de 1.000 páginas/mês por 3 meses | AWS | Feito para documentos, não para UI de jogo | **Excluir** (Vision ou self-host atendem melhor) |
| **Azure AI Vision (Read)** | OCR | Read OCR | F-54 | F0: 5.000 transações/mês, 20/min; preço S1 **não verificado** (página mostra "$-") | Azure | Igual aos outros | **Avaliar** só se o Vision falhar no teste T0 |
| **Claude API (visão)** | OCR / extração | Ler o print e devolver JSON estruturado | F-54, F-16, F-30 | Haiku 5.5: $0,10 / $0,50 por MTok (prompts até 100k); tokens por imagem **não verificados** (medir com `count_tokens`) | Commercial Terms da Anthropic | Pode errar número (precisa validação e confirmação do usuário) | **Avaliar R2** como fallback para telas difíceis |
| **DeepL API** | Tradução | Tradução de alta qualidade, glossários | F-33, F-40, F-42, i18n do conteúdo | Free: 500.000 caracteres/mês (fontes secundárias). Pro: $5,49/mês + $25/1M (G2/eesel). **Não verificado**: há relato de mudança de planos em meados de 2026 | Termos DeepL; Pro "não usa para treino" | Preço incerto | **Avaliar** (comparar com Claude no teste de qualidade) |
| **Google Cloud Translation** | Tradução | NMT e Translation LLM | F-33, F-40, F-42 | NMT: 500.000 caracteres/mês grátis (crédito de $10), depois $20/1M. Translation LLM: $10/1M de entrada + $10/1M de saída | Google Cloud | Baixo | **R2** (tradução on-demand barata) |
| **LibreTranslate** | Tradução | Tradução open source | — | Hospedado: Pro $29/mês (até 80 chamadas/min em pico, 2.000 caracteres por chamada); self-host grátis | **AGPL-3.0** | Qualidade inferior; AGPL obriga a abrir modificações se o serviço for oferecido em rede | **Excluir** (salvo exigência de self-host) |
| **Claude API (texto)** | Tradução + IA | Tradução com contexto (glossário RoK), Q&A com **Citations**, Batch -50%, cache | F-59, F-33, F-40, F-42, F-50 (apoio editorial), F-51 | Haiku 5.5 $0,10/$0,50; Sonnet 5.5 $2/$10; Opus 5.5 $4/$20 por MTok; leitura de cache: Haiku $0,01, Sonnet $0,10; Batch: 50% de desconto | Commercial Terms da Anthropic | Custo variável. Alucinação mitigada com Citations + base `facts/` | **MVP no build** (tradução de conteúdo revisada por humano); **R3** para F-59 |
| **Voyage AI** (via MongoDB Atlas) | Embeddings | `voyage-4`, `-lite`, `-large`; rerank | F-59 | 200M tokens grátis; voyage-4-lite $0,02/1M, voyage-4 $0,06/1M, voyage-4-large $0,12/1M | Termos MongoDB/Voyage | Base pequena pode dispensar embeddings | **Avaliar R3** (só se a base passar do que cabe em contexto com cache) |
| **pgvector** (no Supabase) | Vector DB | Busca vetorial no Postgres | F-59 | Incluído no Postgres | Open source | — | **R3** (se houver embeddings) |
| **Web Push** (Push API + VAPID; lib `web-push`) | Notificações | Push no navegador e na PWA | F-24, F-15, F-04, F-44 | Grátis | Padrão W3C; `web-push` MPL-2.0, **sem release desde 2024-01** | iOS/iPadOS só a partir do **16.4** e **só com o app na Tela de Início**; permissão só com gesto do usuário | **R2** (envio exige servidor) |
| **ICS (RFC 5545)** + `ical-generator` | Calendário | Arquivo ou feed .ics para qualquer calendário | F-24, F-25, F-35, F-44 | Grátis | `ical-generator` MIT, 11.1.2 (2026-09-28) | Nenhum | **R1** (arquivo gerado no cliente); feed por URL no R2 |
| **Google Calendar API** | Calendário | Criar eventos na agenda do usuário | F-24 | Grátis; 10.000 req/min por projeto, 600/min por usuário; teto de 1M/dia antes de cobrança (2026) | Google APIs ToS; escopo de calendário exige OAuth | Mais atrito que o ICS | **Avaliar R3** (o ICS cobre o caso) |
| **Resend** | E-mail | E-mail transacional (magic link, avisos) | F-53, F-40, F-24 | Free: 3.000/mês, 100/dia, 3 domínios; Pro $20/mês para 50.000 | Termos Resend; SDK MIT | Baixo | **R2** |
| **SendGrid** | E-mail | E-mail transacional | — | **Plano free aposentado em 2025-05-27** (changelog Twilio); hoje há trial e planos pagos | Twilio | Mudança de plano recente | **Excluir** (Resend atende) |
| **@date-fns/tz** / **Luxon** | Fuso horário | Converter UTC do reino para o horário local | F-15, F-24, F-12, F-44 | Grátis | MIT; @date-fns/tz 1.5.0 (2026-05), Luxon 3.7.2 (2025-09) | Nenhum | **MVP** |
| **Satori** / **@vercel/og** | Imagens | HTML/CSS → SVG (→ PNG) para OG e cards | F-57, F-10, F-42, F-33 | Grátis | MPL-2.0; satori 0.52.0 (2026-10-13). Fontes TTF/OTF/WOFF (sem WOFF2); CSS parcial | Nenhum | **MVP** (OG no build); **R1** (Profile Card) |
| **Sharp** | Imagens | Resize, recorte e PNG no servidor | F-08, F-05, F-54 (pré-processamento) | Grátis | Apache-2.0; 0.35.5 (2026-09-27) | Nenhum | **R2** |
| **Cloudinary** | Imagens | CDN e transformações | F-05, F-10 | Free: 25 créditos/mês; Plus $99/mês | Proprietário | Lock-in; custo alto para o caso | **Excluir** (Sharp + Storage resolvem) |
| **AWS Rekognition** (DetectModerationLabels) | Moderação | Moderação de imagem | F-05, F-06, F-07, F-09 | $0,001/imagem (primeiro 1M/mês); free tier de 1.000/mês por 12 meses | AWS | Imagem sai para terceiro | **Avaliar R2** (alternativa ao SafeSearch) |
| **nsfwjs** | Moderação (lib) | Classificador NSFW no navegador | F-05, F-10 | Grátis | MIT; 4.4.0 (2026-08) | Precisão limitada; serve de pré-filtro | **Avaliar R2** (pré-filtro no cliente) |
| **Supabase** | Plataforma | Postgres, Auth (Discord, Google, e-mail), Storage, RLS, Realtime | F-53, F-35..F-46, F-04, F-05, F-54 | Free: 50k MAU, 500 MB de DB, 1 GB de storage, 5 GB de egress, 2 projetos, **pausa após 1 semana inativo**. Pro: a partir de $25/mês (100k MAU, 8 GB) | supabase-js MIT; plataforma open source | Lock-in moderado (é Postgres, migrável) | **R2** (plano Pro em produção) |
| **Clerk** | Auth | Auth gerenciado | F-53 | Hobby: 50.000 MRU por app, até 3 conexões sociais (Discord no free **não verificado**). Pro $25/mês (+$0,02/MRU) | Proprietário; SDK MIT | Lock-in de identidade | **Avaliar** (só se não usarmos Supabase Auth) |
| **Better Auth** (que agora inclui o Auth.js) | Auth | Auth self-hosted em TypeScript | F-53 | Grátis | MIT; better-auth 1.7.7 (2026-09-30). A página do Auth.js diz que o projeto "agora é parte do Better Auth" | Mais trabalho de operação | **Avaliar** (alternativa sem lock-in) |
| **Firebase** | Plataforma | Firestore, Auth, FCM | F-53 | **Não verificado** | Google | NoSQL encaixa pior em ledgers e relatórios | **Excluir** (Supabase preferido) |
| **PostHog** | Analytics | Eventos, retenção, funis, feature flags | Critério do MVP (D7), §7 da árvore (fake doors, contadores) | Free todo mês: 1M eventos, 5k replays, 1M requisições de flag | posthog-js Apache-2.0/MIT | Cookies e consentimento LGPD/GDPR se identificar o usuário | **MVP** (modo anônimo + banner de consentimento) |
| **Plausible** | Analytics | Pageviews sem cookie | Tráfego e SEO | Starter $9/mês (10k pageviews); trial de 30 dias; self-host AGPL-3.0 | Sem cookies, sem rastrear indivíduos | **Não mede retenção D7 por usuário** | **Avaliar** (complemento de privacidade) |
| **Stripe** | Pagamentos | Cartão, Pix, boleto | Monetização futura | BR: 3,99% + R$0,39 (cartão nacional); +2% internacional; Pix 1,19% (só por convite); boleto R$3,45; sem mensalidade | Stripe | **Cobrar exige revisão jurídica** (§8, 17.1.10 do ToS da Lilith) | **R3**, condicionado ao jurídico |

## 3. Notas detalhadas por categoria

Todas as URLs foram acessadas em **2026-10-13**.

### 3.1 Dados de Rise of Kingdoms

Ver também §4 (avaliação de ToS) e §5 (excluídas).

- **Lilith forum JSON API.** `GET https://forum-global.lilithgame.com/api/v2/posts?account_id=10000000&limit=N&offset=N` respondeu 200 em 2026-10-13 com `total: 832` posts da conta oficial (GM "Rise of Kingdoms"). O texto completo vem em `/api/v2/posts/<id>` com o header `language: en_US`, e os comentários em `/api/v2/comments?post_id=` (técnica em `research/fontes.md`). Não há documentação, termos de API nem `robots.txt` (a URL devolve o HTML da SPA). O ToS 17.1.7 proíbe "engines, crawlers ou data mining tools" para acessar Lilith Content, salvo software da Lilith ou um navegador normal. Por isso, o uso aceitável é **editorial e de baixo volume**: alguém do time dispara a consulta, lê a nota de patch e atualiza `facts/` com paráfrase e link. Um job automático que alimente o produto não é aceitável. Isso serve a F-28 (What Changed), F-50 (selo "verificado no patch X") e F-31 (regras de migração por patch).
- **Fandom MediaWiki API.** `api.php?action=query&meta=siteinfo&siprop=rightsinfo` devolve `"text":"CC-BY-SA"` (MediaWiki 1.43.9). Funciona via curl com UA não-navegador; o HTML das páginas retorna 402/403. Os Termos de Uso da Fandom e a página de licenciamento retornaram 402/403, então os limites da API e as regras de uso automatizado da Fandom estão **não verificados**. Uso: checagem cruzada e diff de revisões (os comentários de edição são evidência útil). Não copiar texto, o que acionaria atribuição e share-alike, e **nunca** usar imagens, que são assets da Lilith.
- **Arctic Shift.** `GET https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=RiseofKingdoms&limit=1` respondeu 200 com `x-ratelimit-reset` (limite dinâmico). O README (github.com/ArthurHeitmann/arctic_shift) descreve uma API "(limited)", dumps para pesquisa e um formulário de remoção. Não declara licença dos dados nem termos comerciais (**não verificado**). O conteúdo é do Reddit, cujos Data API Terms 3.1 dizem: "If you are interested in using the Data APIs for commercial purposes … you will need to enter into a separate agreement with Reddit" (redditinc.com/policies/data-api-terms). Conclusão: usar **só para pesquisa interna** (coleta de dores, o teste "30 posts what next?" do F-17), sem exibir conteúdo nem alimentar o produto.
- **ROK Steward** (roksteward.com). A página inicial diz "Drag in the xlsx you exported from Rise of Kingdoms" e "Raw scan data goes in". Não tem API. Interesse para nós: **interoperar por arquivo** (F-37 aceita o mesmo xlsx). A existência de uma exportação oficial no jogo continua **não verificada** (C02-0016), e isso é decisivo.
- **ROKSTATS** (app.rokstats.online). A página inicial mostra a versão 3.16.1 e preços: AIO $40/mês, Kingdom Pro $70/mês, Title Manager $20/mês, KvK a partir de $25. Diz que governadores e alianças são "free to browse". Não encontramos API pública (busca e página inicial). Os dados vêm de scans gerenciados (C01-0013). Fica excluído como fonte.
- **Hero Scrolls.** Conexão resetada em 2026-10-13. Não encontramos API (busca). Dados por scans de serviço e launcher/overlay "Ultra" (C01-0014). Excluído.
- **ROK Battles** (rokbattles.com/docs). "Connect your mailcache folder … The desktop app watches your mailcache folder and uploads battle reports automatically". No Android usa Intra com DNS customizado `dns.rokbattles.com`, e no iOS um perfil de configuração. Isso é leitura de arquivos do cliente e interceptação de rede. **Excluído.**
- **docs.rokmonster.dev.** "ROK Monster OCR (GoLang)": CLI e servidor web que extraem dados de screenshots por zonas, com licença GPL-3.0. O `rok-scanner` é "a CLI Tool for scanning a folder with images", ou seja, não automatiza o jogo. Serve como referência técnica para F-54, mas os casos de uso divulgados (power, kills e deaths de vários governadores) envolvem dados de terceiros.
- **RokVision** (github.com/feels-dev/RokVision, README). "Cognitive OCR API for Rise of Kingdoms screenshots", com PaddleOCR v4 e .NET 9 em Docker, licença MIT. Extrai perfil de governador, inventário (AP, livros de XP), relatórios de batalha, mapa e rally. Serve a F-54 **se limitado ao perfil e inventário do próprio usuário**. Mapa, rally e relatórios trazem dados de terceiros e ficam vetados.
- **Repositórios GitHub** (`research/raw/competitors/github-open-source.md`). **Não há dataset aberto** de comandantes, talentos ou equipamentos. O mais próximo é `KingRider/lyceum-of-wisdom`, sem licença, logo não reutilizável, e com conteúdo que é texto da Lilith. `thesimonho/rok-talents` e `rok-data` são GPL-3.0 e servem só de referência. `rok-suite` (MIT) é a melhor referência de arquitetura de admin: Supabase, ingestão do arquivo de stats, iCal, multi-fuso com UTC como "game time".
- **RoK Hub** (rokhub.xyz): 402 em 2026-10-13, fora do ar. **Codex Helper** (codexhelper.com): bot de Discord com plano Patreon de $5 e 220 servidores declarados; nenhuma API pública encontrada. **Davor's Toolkit**: nenhuma API encontrada (**não verificado** além da página).

### 3.2 Identidade e comunidade (Discord)

- **OAuth2** (docs.discord.com/developers/topics/oauth2). Escopos úteis: `identify` (`/users/@me` sem e-mail), `email`, `guilds` (lista de servidores), `guilds.members.read` (dados de membro num servidor) e `role_connections.write` (atualizar a conexão e os metadados do usuário para o app, o que não funciona com o fluxo implicit). Suporte a PKCE: a página não menciona (**não verificado**). Recomendação: login via **Supabase Auth com provedor Discord** (incluído nos planos Free e Pro conforme a página de preços, que fala em "social OAuth providers"; o Discord não aparece nominalmente) e escopos mínimos `identify` + `email`. Pedir `guilds` só quando o usuário for ligar uma aliança.
- **Rate limits** (docs.discord.com/developers/topics/rate-limits): "All bots can make up to 50 requests per second". Requisições inválidas (401/403/429) têm limite de 10.000 a cada 10 minutos, com bloqueio de IP. Endpoints de interação não contam no limite global. Um webhook que devolver 404 não deve ser reusado.
- **Slash commands** (application-commands): até 100 comandos CHAT_INPUT globais, 15 USER e 15 MESSAGE; limite de 200 criações de comando por dia. Comandos de servidor ficam isolados por servidor.
- **Webhooks** (resources/webhook): "Execute Webhook" serve para publicar avisos do reino (Charter publicado, rodada do MGE Ledger, lembrete de evento) sem bot. O líder cola a URL do webhook do canal. O produto precisa guardar essa URL como segredo, então isso fica para o R2.
- **Guild Scheduled Events** (resources/guild-scheduled-event): criar eventos nativos do servidor, com regra de recorrência. Complementa o F-24 dentro do Discord (R3, com o bot).
- **Linked Roles** (resources/application-role-connection-metadata): quando o bot configura `role_connections_verification_url`, o app aparece como método de verificação nos cargos do servidor. O limite é "maximum of 5 metadata records". Uso no R3: a aliança exige no Discord o cargo "R4/R5 verificado pelo hub (F-55)" ou "perfil ligado". Isso resolve a impersonação (F-49, D-0514) sem senha nenhuma.
- **Developer Policy e Developer Terms**: as páginas retornaram 403. Retenção de dados, obrigação de política de privacidade e o limite para verificação do app (o número de servidores mudou ao longo dos anos) estão **não verificados**. Ler antes do R2.
- **Concorrência**: Codex Helper e Zoe já fazem lembretes, MGE e AoO no Discord. O bot (F-58) só se justifica como **ponte para o estado do hub** (Charter, Ledger, roster), e não como mais um bot de calculadora.
- **Outros provedores**: Google (Supabase/Clerk) e e-mail com magic link. Apple só interessa se houver app nativo (**não verificado**: regra da App Store para "Sign in with Apple").

### 3.3 Planilhas (dados que os líderes já têm)

- **Google Sheets API** (developers.google.com/workspace/sheets/api/limits): 300 leituras e 300 escritas por minuto por projeto, 60 por minuto por usuário e projeto, "no limit to the number of requests … per day". Exceder a cota "is planned to incur charges … later in 2026". **Escopos** (…/sheets/api/scopes): `spreadsheets` e `spreadsheets.readonly` são **Sensitive** (exigem verificação do app pelo Google), e `drive.file` é **Non-sensitive, "Recommended"**, com acesso só aos arquivos que o usuário abre pelo app. Desenho recomendado: **Google Picker + `drive.file`** (o líder escolhe a planilha). No R1, sem backend, usar "Arquivo → Publicar na web → CSV" e colar o link, ou colar as células direto (PapaParse).
- **Microsoft Graph/Excel** (learn.microsoft.com, atualizado em 2024-11-21): só OneDrive for Business, SharePoint ou drive de grupo. "Support for workbooks stored in OneDrive Consumer platform is still not available". Só .xlsx. Os jogadores usam contas pessoais, então não vale a pena. O upload do arquivo cobre o caso.
- **Bibliotecas**: PapaParse 5.7.0 (MIT, 2026-08-24). SheetJS: o pacote npm `xlsx` está parado em 0.18.5 (2022-03-24), e as versões atuais são distribuídas pelo CDN do SheetJS (**não verificado** qual é a versão atual). ExcelJS 4.4.0 (MIT, 2023-10-19, pouco ativo). Para o F-37: mapear colunas, juntar por governor ID e validar, tudo no cliente quando possível. Assim os dados de terceiros só vão para o servidor depois do atestado da liderança (F-56).

### 3.4 OCR de prints do próprio usuário (F-54)

- **O que sabemos sobre telas de RoK.** Os scanners da comunidade usam Tesseract com tessdata e exigem resolução e DPI fixos e cliente em inglês (RokTracker: BlueStacks 1600x900, DPI 450). O RokTracker avisa que "the game doesn't guarantee name accuracy" e por isso também salva um recorte do nome. O RokVision usa PaddleOCR com re-scan regional e filtros ("White Isolation, Inverted Binary") nas áreas de baixa confiança. Leitura: **números em fundo estilizado exigem pré-processamento e templates por tela**, e nomes de governador (Unicode, símbolos) são o ponto fraco. **Não temos medição própria de acurácia**: isso é o T0 já previsto no backlog ("qualidade do OCR em prints próprios").
- **Tesseract / tesseract.js** (Apache-2.0, tesseract.js 7.0.0 de 2025-12-15). Roda **no navegador**, então a imagem nem sai do aparelho, o que é o melhor cenário de privacidade e casa com o "apaga a imagem" do F-54.
- **PaddleOCR** (Apache-2.0, 3.7.0 de 2026-06-11). Mais robusto em UI de jogo, segundo o RokVision (sem benchmark independente: **não verificado**). Exige servidor.
- **Google Cloud Vision** (cloud.google.com/vision/pricing): Text e Document Text Detection têm 1.000 unidades/mês grátis e depois $1,50 por 1.000 unidades até 5M.
- **AWS Textract** (aws.amazon.com/textract/pricing): Detect Document Text custa $0,0015/página em us-west-2 (o primeiro 1M), com free tier de 1.000 páginas/mês por 3 meses para contas novas. É feito para documentos, então não compensa.
- **Azure AI Vision**: F0 com "5,000 free transactions per month", 20/min. O preço do S1 para Read aparece como "$-" na página: **não verificado**.
- **Claude (visão)**: extrai e estrutura em uma chamada só (JSON com schema), útil para telas que mudam com patch. O custo por imagem depende do tamanho (**não verificado**; medir com `count_tokens`). O Haiku 5.5 custa $0,10 de entrada por MTok.
- **Proposta**: tesseract.js no cliente para telas simples (perfil, inventário), um template por tela versionado por patch (F-50) e confirmação humana campo a campo. Fallback opcional no servidor (PaddleOCR self-hosted, ou Vision/Claude) com aviso no Trust Center. A imagem é apagada depois de processada.

### 3.5 Tradução

- Contexto: reinos são multilíngues, e Charter, Exit Notice e posts de recrutamento (F-33, F-40, F-42) precisam sair em vários idiomas. O conteúdo do guia tem i18n próprio.
- **Google Cloud Translation** (cloud.google.com/translate/pricing): NMT "First 500,000 characters per month Free (applied as $10 credit every month)" e depois $20 por 1M caracteres. Translation LLM custa "$10 per million characters input and $10 per million characters output".
- **DeepL API**: a página oficial de preços da API não renderizou (só os planos do Translator). Fontes secundárias falam em Free com 500.000 caracteres/mês e Pro a $5,49/mês + $25/1M, e uma fonte de 2026 afirma que os planos Free e Pro foram descontinuados para novos cadastros em meados de 2026. **Tudo não verificado.** Os limites de documento estão verificados (developers.deepl.com/docs/resources/usage-limits): no plano free, .docx até 10 MB e 500.000 caracteres.
- **LibreTranslate** (portal.libretranslate.com): Pro $29/mês e Business $58/mês, 2.000 caracteres por chamada. Self-host sob **AGPL-3.0** (PyPI 1.9.6). Fica excluído pela qualidade e pela AGPL.
- **Claude API**: o melhor encaixe para **texto de regra com jargão RoK** (glossário no prompt, tom preservado), a custo baixo no Haiku 5.5. Batch com 50% de desconto serve para traduzir o conteúdo do guia no build. Recomendação: no **MVP**, traduzir o conteúdo próprio no build com revisão humana, sem chamada em runtime. No **R2**, tradução on-demand do Charter pelo servidor (Claude ou Google NMT), sempre com o aviso "tradução automática; a versão original prevalece".

### 3.6 Assistente de IA (F-59) e embeddings

- **Preços** (platform.claude.com/docs/en/about-claude/pricing, por MTok):

  | Modelo | Entrada | Saída | Leitura de cache | Batch (entrada/saída) |
  |---|---|---|---|---|
  | Claude Haiku 5.5 (até 100k de prompt) | $0,10 | $0,50 | $0,01 | $0,05 / $0,25 |
  | Claude Sonnet 5.5 | $2 | $10 | $0,10 | $1 / $5 |
  | Claude Opus 5.5 | $4 | $20 | $0,20 | $2 / $10 |

  Escrita de cache de 5 minutos custa 1,25x a entrada. Web search custa $10 por 1.000 buscas.
- **Citations** (sem beta): `citations: {enabled: true}` nos blocos `document`. As respostas trazem `cited_text` e a localização no documento. Isso casa com o princípio do F-50 ("todo número mostra a fonte"). Não funciona junto com structured outputs (`output_config.format`).
- **Estimativa**, apenas ilustrativa: base de 50k tokens em cache, pergunta de 500 tokens, resposta de 500 tokens. No Haiku 5.5 sai por cerca de $0,001 por pergunta (leitura de cache de 50k ≈ $0,0005 + saída ≈ $0,00025 + entrada). No Sonnet 5.5, cerca de $0,011. A primeira escrita de cache e o "thinking" somam a isso. Medir com o uso real antes de prometer o plano gratuito.
- **Embeddings**: a Anthropic "does not offer its own embedding model" e indica a **Voyage AI** (platform.claude.com/docs/en/build-with-claude/embeddings). Preços (mongodb.com/docs/voyageai/management/billing): voyage-4-lite $0,02/1M, voyage-4 $0,06/1M, voyage-4-large $0,12/1M, com 200M tokens grátis. Avaliação: o `facts/` + blocos do F-51 provavelmente **cabem no contexto com cache** (os modelos 4.6+ têm 1M de contexto, e o Haiku 5.5 cobra mais acima de 100k tokens de prompt). Começar sem vector DB. Adotar Voyage + pgvector só se a base crescer ou se o snapshot do usuário (F-16) exigir recuperação seletiva.
- Risco: o assistente pode "inventar" números. Mitigar com Citations obrigatórias, recusa quando não houver fonte, e o selo de patch de cada fato.

### 3.7 Notificações e tempo

- **Web Push** (webkit.org/blog/13878): "with iOS and iPadOS 16.4, we are adding support for Web Push to Home Screen web apps". A permissão só pode ser pedida "in response to direct user interaction". Usa Push API + Notifications API + Service Workers. O envio precisa de um servidor com chaves VAPID, logo é **R2**. A lib `web-push` (MPL-2.0) não tem release desde 2024-01-16, mas o protocolo é estável. Alternativa: a função de push do provedor de backend (**não verificado** no Supabase).
- **ICS**: o arquivo gerado no cliente (`ical-generator`, MIT, 11.1.2) dispensa backend e funciona em Google, Apple e Outlook. Serve para o **R1** (F-24 Kingdom Clock, F-25 Hoard Advisor com "evento provável", MGE agendado). O rok-suite já oferece "iCal subscription URLs", o que mostra que líderes usam isso. No R2, um **feed .ics por URL** atualiza sozinho.
- **Google Calendar API** (…/calendar/api/guides/quota): 10.000 req/min por projeto, 600/min por usuário, "available at no additional cost". Exige OAuth com escopo de calendário. Fica em "avaliar" porque o ICS cobre o caso.
- **E-mail**: **Resend** (resend.com/pricing) tem free de 3.000/mês, 100/dia e 3 domínios, e Pro a $20/mês para 50.000. O **SendGrid** aposentou o plano gratuito em 2025-05-27 (twilio.com/en-us/changelog/sendgrid-free-plan), então fica excluído.
- **Fuso**: o jogo opera em UTC. O rok-suite chama UTC de "game time". **@date-fns/tz** (MIT, 1.5.0) ou **Luxon** (MIT, 3.7.2) cuidam da conversão para o horário local e dos slots UTC do F-44. A API nativa `Temporal` do navegador fica como opção futura (suporte nos navegadores **não verificado**).

### 3.8 Imagens

- **Satori** (github.com/vercel/satori): "convert HTML and CSS to SVG", sob MPL-2.0. Fontes TTF/OTF/WOFF ("WOFF2 is not supported"), CSS parcial (sem `display: table`, sem pseudo-elementos). Para PNG, recomenda o Sharp. Usar no **build do MVP** para as imagens OG (F-57) e no **R1** para o Profile Card (F-10), que pode rodar no cliente.
- **Sharp** (Apache-2.0, 0.35.5): recorte e resize do avatar exportado (F-08, tamanho e área segura depois do T0) e pré-processamento do OCR no servidor.
- **Cloudinary** (cloudinary.com/pricing): free de 25 créditos (1 crédito = 1.000 transformações, 1 GB de storage ou 1 GB de banda) e Plus a $99/mês. Excluído: Sharp + Supabase Storage resolvem.
- **Moderação** (uploads de avatar e brasão: F-05, F-06, F-07, F-09):
  - **Google SafeSearch** custa $1,50 por 1.000, mas é grátis junto com Label Detection, e há 1.000 grátis por mês.
  - **AWS Rekognition** custa "$0.0010 per image" (primeiro 1M) e oferece 1.000 imagens por mês grátis durante 12 meses.
  - **nsfwjs** (MIT) serve de pré-filtro no cliente.
  - **Azure AI Content Safety**: **não verificado**.
  - Nomes, tags e textos também precisam de filtro (lista de bloqueio ou classificação por LLM).
  - **Não usar assets da Lilith**: molduras e brasões são arte original.

### 3.9 Plataforma

- **Supabase** (supabase.com/pricing): Free com 50.000 MAU, 500 MB de DB, 1 GB de storage, 5 GB de egress, 2 projetos ativos e "paused after 1 week of inactivity". Pro a partir de $25/mês com 100.000 MAU, 8 GB de disco e 100 GB de storage. Por que encaixa: Postgres + RLS servem a ledgers e logs de decisão (F-35, F-36) com permissões por papel (R4/R5, oficial). O Realtime atende à sincronização entre oficiais. O Storage com TTL atende ao "apaga a imagem" do F-54 (TTL automático **não verificado**). O rok-suite usa a mesma pilha. Em produção, usar o **Pro**, por causa da pausa do Free.
- **Clerk** (clerk.com/pricing): Hobby com 50.000 MRU por app e até 3 conexões sociais (Discord no free **não verificado**). Pro a $25/mês. Só se o Supabase Auth não bastar.
- **Better Auth**: a página do Auth.js diz que "The Auth.js project is now part of Better Auth". better-auth 1.7.7 (MIT). É a alternativa self-hosted.
- **Firebase**: não pesquisado a fundo (**não verificado**). Preterido porque o modelo NoSQL encaixa pior em relatórios e ledgers.
- **Analytics**:
  - **PostHog** (posthog.com/pricing) dá todo mês "Analytics 1M events, Session replay 5K recordings, Feature flags 1M requests". Mede retenção D7, funis e os "fake doors" do §7 da árvore (F-06, F-05). É a opção para o critério de saída do MVP. Configurar sem identificar o usuário e com consentimento (LGPD/GDPR).
  - **Plausible** (plausible.io) custa $9/mês por 10k pageviews e é sem cookies ("no cookie banner"). Self-host sob AGPL-3.0 (LICENSE do repositório). Bom para tráfego e SEO, mas não mede D7 por usuário.
- **Stripe** (stripe.com/br/pricing): cartão nacional a 3,99% + R$0,39, +2% para cartão internacional, Pix a 1,19% (só por convite), boleto a R$3,45, sem mensalidade. Merchant of record (Paddle, Lemon Squeezy) não pesquisado. **Bloqueio:** o §8 e o 17.1.10 do ToS da Lilith proíbem uso comercial de Lilith Content, então **revisão jurídica antes de qualquer cobrança** (já registrado no F-56).

## 4. Fontes de dados específicas de RoK: avaliação de ToS

| Fonte | Que dado | Como o dado é obtido | ToS Lilith | Licença do dado | Integração aceitável? |
|---|---|---|---|---|---|
| Observação própria (T0) | Números, telas, tempos | Prints da conta do Victor e de contribuidores | OK (uso pessoal; publicamos fatos com fonte, sem copiar arte) | Nossa compilação | ✅ fonte primária |
| Fórum oficial Lilith (API JSON) | Notas de patch, anúncios, Q&A de devs | API pública não documentada | 17.1.7 restringe crawlers e mineração de Lilith Content. Leitura humana ou pontual é baixo risco; job automatizado em produção é médio | Lilith Content (§8, não comercial) | ◐ **só editorial**, paráfrase + link |
| Fandom (API MediaWiki) | Tabelas e histórico de edições | API pública | Não é Lilith; os dados de origem são do jogo | CC-BY-SA (texto); imagens da Lilith | ◐ **só checagem cruzada**; não copiar |
| Arctic Shift / Reddit | Voz do jogador | Arquivo de terceiros | n/a | Conteúdo dos usuários; uso comercial da API do Reddit exige acordo | ◐ **só pesquisa interna** |
| Sites de guia (rkg, AllClash, MetaRoK…) | Estratégia, consenso | Páginas (sem API) | n/a | Copyright dos autores | ◐ T3 para consenso; não copiar (já em `fontes.md`) |
| ROK Steward | Relatórios de KvK | Upload do xlsx pelo líder | Depende da origem do xlsx (exportação oficial **não verificada**) | Proprietário | ◐ **interoperar por formato** (F-37), sem API |
| rok-suite (MIT) | Código | — | n/a | MIT | ✅ referência de código |
| RokVision (MIT), rokmonster/ocr (GPL-3.0) | OCR de screenshot | Screenshot enviado pelo usuário | OK se a tela for **do próprio usuário**; 17.1.13 se tiver outros jogadores | MIT / GPL-3.0 | ◐ **avaliar**, só perfil e inventário próprios |
| ROKSTATS, Hero Scrolls, Botals, APO | Stats de reino e governador | Scans automatizados (emulador/ADB, contas do serviço) | 17.1.7, 17.1.15, 17.1.13 | Proprietário | ❌ como fonte ou API. ◐ aceitar **arquivo exportado pelo líder** sob atestado e opt-out (F-37 + F-56) |
| RokTracker (família) | Rankings | ADB + OCR no emulador | 17.1.7, 17.1.15, 17.1.13 | MIT | ❌ integrar ou recomendar. ◐ o F-37 pode aceitar o .xlsx resultante sob a mesma regra acima (decisão do Victor; ver §6) |
| ROK Battles | Relatórios de batalha | Pasta mailcache do cliente e DNS | 17.1.6, 17.1.12 | — | ❌ |
| Codex Helper, Zoe | Guias, lembretes no Discord | Curadoria própria e prints | — | Proprietário, sem API | ❌ integração (são concorrentes) |
| lyceum-of-wisdom | Respostas do quiz | Transcrição | Texto do jogo (Lilith Content) | **Sem licença** | ❌ reutilização |
| API oficial Lilith | — | Não existe (C02-0015) | — | — | ❌ (a parceria é a rota de longo prazo) |

## 5. Excluídas (com motivo)

| Item | Motivo |
|---|---|
| Qualquer scanner próprio ou integração com scanners (RokTracker, rok-scan-stats, Nexor256/RoK-Tracker, ROKSTATS e Hero Scrolls como fonte) | Automação via ADB/emulador e coleta de dados de outros jogadores: ToS 17.1.7, 17.1.15, 17.1.13 |
| ROK Battles e qualquer leitura de mailcache, DNS, proxy ou memória | Leitura de arquivos do cliente e de tráfego: 17.1.6, 17.1.12 |
| Bots de farm (Rise-of-Kingdoms-Bot, ROKBOT, OSROKBOT, 4x-game-agent) | Automação de gameplay: 17.1.18, 17.1.15; precedente de banimento (C02-0012). Não linkar nem promover |
| Login com conta do jogo, "pilotos", venda de conta | 17.1.15, 17.1.21, §12.2 |
| Imagens da Fandom, ícones e arte do jogo | Assets da Lilith (§8, 17.1.9) |
| Reddit Data API no produto | Data API Terms 3.1: uso comercial exige acordo separado |
| Microsoft Graph (Excel) | Não suporta OneDrive pessoal; o público não usa M365 business |
| AWS Textract | Feito para documentos; Vision e self-host atendem melhor |
| LibreTranslate | Qualidade inferior e AGPL-3.0 |
| SendGrid | Plano free aposentado em 2025-05-27 |
| Cloudinary | $99/mês no primeiro plano pago; Sharp + Storage cobrem |
| Firebase | Encaixe pior que Postgres para ledgers; sem vantagem para o caso |
| lyceum-of-wisdom | Sem licença e conteúdo da Lilith |

## 6. Perguntas em aberto

1. **Existe exportação oficial de stats (xlsx) no jogo?** (C02-0016, **não verificado**.) Decide se o F-37 interopera com um formato "oficial" ou só com arquivos de scanners, que trazem a questão de ToS.
2. **Aceitamos arquivos produzidos por scanners de terceiros no F-37?** O `competitors-and-constraints.md` diz "ingerimos, não escaneamos", com atestado e opt-out. É decisão do Victor, de preferência com o jurídico, porque aceitar o arquivo pode ser lido como incentivo ao scan.
3. **Uso da API do fórum Lilith em produção**: vale pedir autorização à Lilith, ou ficamos só no uso editorial manual?
4. **Discord Developer Policy e Developer Terms** (403 para nós): retenção, política de privacidade obrigatória, limite de verificação do app. Ler antes do R2.
5. **DeepL**: os planos de API mudaram em 2026? Confirmar na página oficial antes de comparar com Claude e Google.
6. **Acurácia de OCR em telas de RoK**: rodar o T0 com cerca de 30 prints próprios (perfil, inventário, comandante) em tesseract.js, PaddleOCR, Vision e Claude Haiku 5.5, medindo acerto por campo e o custo.
7. **Custo de tokens por imagem no Claude** e por consulta do F-59 com a base real: medir com `count_tokens`.
8. **Supabase**: TTL automático no Storage (para apagar prints) e envio de Web Push pelo próprio backend (**não verificados**).
9. **Termos de uso da Fandom** para acesso via API (403 para nós).
10. **Pagamentos**: Stripe direto ou merchant of record (impostos internacionais)? Depende do jurídico sobre monetizar um fan tool (§8).
11. **Linked Roles**: o fluxo de verificação do R4/R5 (F-55) passa no T0, ou seja, o código fica editável no anúncio da aliança sem disparar o filtro?
