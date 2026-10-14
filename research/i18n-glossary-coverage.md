# Cobertura do glossário de termos do jogo (i18n) — 2026-10-14

Arquivo de dados: `packages/data/i18n/glossary.json` (249 termos × 13 idiomas). Validador: `packages/data/scripts/check-glossary.ts`, rodando em `pnpm validate` / `pnpm check`. Formato e uso na interface: `produto/i18n-plano.md`.

## Resumo
- 249 termos: 210 termos do jogo, 35 nomes de comandantes (nomes próprios) e 4 gírias de jogador (DKP, seed, zerar, conta farm).
- 13 idiomas: en, pt-BR, es, fr, de, it, ru, tr, id, vi, ko, zh-Hant, ar.
- Nos 12 idiomas-alvo (sem contar o EN), **41% das células têm fonte**: 7% `verified-official` e 34% `community`. Os outros **59% são `unverified`**: tradução inferida, sem fonte. Nenhuma célula passou de `unverified` sem um texto que a sustente.
- **Chinês: zh-Hant (tradicional).** O app global (`com.lilithgame.roc.gp`) tem anúncio em zh-TW em chinês tradicional, com o nome do jogo 萬國覺醒. Jogadores da China continental usam outro app (万国觉醒), com servidores próprios. Por isso o site usa zh-Hant. Um zh-Hans pode sair depois, convertido com OpenCC e revisado por alguém nativo; ele **não** cobre os termos do app da China continental.
- **Coreano:** a Coreia tem um app próprio na App Store (id1474599374) e um Naver cafe oficial. Os termos coreanos podem diferir dos do cliente global, por isso o coreano é o idioma com menos fonte (28%).

## Método
1. **Lista de termos.** Montada a partir de `apps/web/src`, `packages/planner/data`, `packages/planner/tools-data` (inclui o glossário EN do F-88, ligado por `enGlossaryId`), `packages/data/src` e `guides/`, mais as categorias pedidas no briefing. 45 termos ainda não aparecem no site, mas estão no backlog (perfil do governador e verificação por print, guia de comandantes, eras, equipamento): Defeat, Scout Times, Resources Gathered, Album, Builder's Hut, os 4 tipos de aceleração, Economic/Military Technology, Tome of Knowledge, Territorial Teleport, chaves e baús, Alliance Technology/Fortress, Talent Tree/Point, Rage, Universal Sculpture, Elite, Secondary Commander, 3 árvores de talento, 4 materiais, Mysterious Cave, Tribal Village, as 5 eras, Osiris League, Ian's Ballads, Kingdom Title, Honor Points, Merits e Season Coins.
2. **Candidatos.** Para cada termo e idioma escrevemos de 1 a 4 variantes prováveis.
3. **Busca literal nos textos-fonte** (tratados como dados não confiáveis; só fizemos casamento de string):
   - **Oficiais:** anúncios da App Store (US, BR, ES, FR, DE, IT, RU e o app KR) e do Google Play (en, pt-BR, tr, id, vi, ko, zh-TW, ar); posts oficiais do fórum global (conta 10000000, só em EN); 16 strings do cliente em PT vistas nos prints do dono ("owner screenshot 2026-10-13").
   - **Comunitários:** guias da BlueStacks em 12 idiomas (108 páginas); posts de jogadores no fórum oficial filtrados por idioma (até 650 por idioma); wiki RU da Fandom (19 páginas); rbtips.com (赤黑攻略站, zh-Hant, 33 páginas, inclusive o banco de perguntas do Lyceum); títulos da wiki EN da Fandom.
4. **Revisão manual de contexto.** Cada acerto em anúncio de loja foi lido no contexto e só foi aceito quando a palavra tinha o sentido de jogo (91 rejeitados; exemplo: 覺醒 "Awaken" casava com o nome do jogo 萬國覺醒). Acertos comunitários com outro sentido também foram rejeitados (≈180; exemplos: menus da BlueStacks, perguntas de história do quiz, nomes de layout de cidade, verbos onde a interface pede substantivo). Entre as variantes, vence a primeira da lista que tiver fonte.
5. **Ressalva sobre as fontes oficiais.** Texto de loja é marketing, não a interface do jogo. Ele confirma a palavra que a Lilith usa naquele idioma, mas não garante o rótulo exato da tela. Só prints do cliente garantem isso.

## Idiomas × status

| Idioma | verified-official | community | unverified | com fonte |
|---|---:|---:|---:|---:|
| en | 173 | 45 | 31 | 88% |
| pt-BR | 32 | 49 | 168 | 33% |
| es | 20 | 62 | 167 | 33% |
| fr | 17 | 65 | 167 | 33% |
| de | 16 | 85 | 148 | 41% |
| it | 17 | 77 | 155 | 38% |
| ru | 12 | 157 | 80 | 68% |
| tr | 15 | 74 | 160 | 36% |
| id | 11 | 79 | 159 | 36% |
| vi | 9 | 108 | 132 | 47% |
| ko | 19 | 51 | 179 | 28% |
| zh-Hant | 19 | 144 | 86 | 65% |
| ar | 23 | 63 | 163 | 35% |
| **12 idiomas-alvo** | 210 (7%) | 1014 (34%) | 1764 (59%) | 41% |

| Tipo | Termos | verified-official | community | unverified |
|---|---:|---:|---:|---:|
| game | 210 | 154 | 851 | 1515 |
| proper (comandantes) | 35 | 56 | 155 | 209 |
| jargon | 4 | 0 | 8 | 40 |

RU e zh-Hant têm mais cobertura porque contam com uma wiki ou um site de guias grande. pt-BR tem as 16 strings do dono, mas pouco texto comunitário (os guias BlueStacks em PT são de 2019).

## Os 30 termos mais citados no site
Legenda: **O** = verified-official, C = community, · = unverified. O número entre parênteses é a quantidade de menções nos arquivos varridos. A linha "Farm" mistura o prédio Fazenda com "conta farm".

| Termo | pt-BR | es | fr | de | it | ru | tr | id | vi | ko | zh-Hant | ar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kingdom (826) | **O** | **O** | **O** | **O** | **O** | **O** | **O** | **O** | C | C | C | **O** |
| Farm (662) | C | C | C | C | C | C | C | C | · | C | C | C |
| Research (658) | C | C | C | C | C | C | C | C | C | C | C | C |
| Seasons 1 to 3 (598) | · | · | · | · | · | · | · | · | · | · | · | · |
| Gems (597) | C | C | C | C | C | C | C | C | C | C | C | C |
| VIP (539) | C | C | C | C | C | C | C | C | C | · | C | C |
| Commander (351) | **O** | C | C | C | C | C | **O** | C | **O** | **O** | **O** | C |
| City Hall (343) | **O** | C | C | C | C | C | C | C | C | C | C | C |
| Alliance (329) | **O** | **O** | **O** | C | **O** | C | **O** | C | C | **O** | C | **O** |
| Items (321) | C | C | C | · | C | C | C | C | C | **O** | **O** | · |
| Legendary (285) | C | · | · | C | C | C | C | · | C | C | C | C |
| Civilization (264) | **O** | **O** | **O** | **O** | **O** | C | **O** | **O** | **O** | **O** | **O** | **O** |
| Action Points (264) | · | C | C | C | C | C | C | C | C | C | C | C |
| Season of Conquest (263) | · | · | · | · | · | · | · | · | C | · | C | · |
| Power (251) | **O** | C | C | · | · | C | C | · | C | C | C | · |
| T4 / T5 (234) | · | · | · | · | · | · | · | · | · | · | · | · |
| Gold (227) | C | C | · | C | C | C | C | C | C | · | C | C |
| Resources (215) | C | **O** | C | C | C | **O** | C | C | C | **O** | **O** | **O** |
| KvK (207) | C | · | · | C | · | C | C | C | C | C | C | · |
| Events (195) | C | C | C | C | C | C | C | C | C | C | C | C |
| Gathering (194) | C | C | C | **O** | C | C | **O** | C | C | **O** | **O** | **O** |
| Food (193) | C | C | C | C | C | C | C | C | C | C | · | C |
| Speedups (175) | · | C | C | · | C | C | · | C | C | **O** | **O** | C |
| The Mightiest Governor (172) | · | · | · | C | · | C | C | · | C | · | C | · |
| Migration (171) | · | · | · | · | · | · | · | · | C | · | C | · |
| Governor (161) | C | · | C | C | C | C | C | · | **O** | **O** | **O** | C |
| Wood (140) | **O** | C | C | C | · | C | **O** | **O** | C | C | C | C |
| Trading Post (135) | · | · | C | C | · | C | C | · | · | · | C | · |
| Sculptures (130) | C | C | C | C | C | C | C | C | C | C | C | C |
| Healing (129) | · | C | · | C | C | C | · | · | · | C | C | · |

## Termos que mais precisam de revisor nativo
Em ordem de prioridade (impacto no site × falta de fonte):

1. **Campos do Perfil do Governador:** Kill Points, Dead, Highest Power, Victory/Defeat, Scout Times, Resources Gathered, Resource Assistance, Governor ID. O leitor de print (F-54) e a verificação de perfil pelo Álbum dependem do rótulo **exato** de cada idioma. Hoje só o PT tem fonte oficial para "Pontos de Abate" e "Perfil do Governador"; nos outros idiomas quase tudo está `unverified`.
2. **Temporadas e KvK:** Season of Conquest, Preparation Season, "Seasons 1 to 3", Lost Kingdom, Eve of the Crusade, Honor Points, Merits, Crystal Technology, Season Coins, Kingdom Title. Estão entre os termos mais usados pelo site e não têm fonte em 10 a 12 idiomas.
3. **Nomes de eventos** (traduções criativas, difíceis de adivinhar): The Mightiest Governor, Wheel of Fortune, More Than Gems, Lohar's Trial, Sunset Canyon, Champions of Olympia, Ark of Osiris, Osiris League, Ceroli Crisis, Karuak Ceremony, Ian's Ballads, Golden Kingdom, Peerless Scholar. Em zh-Hant temos só os apelidos da comunidade (埃及戰, 轉盤).
4. **Economia e itens:** Trading Post, Storehouse protection, Speedups e os 5 tipos de aceleração, Peace Shield, Teleport/Territorial Teleport, Passport Page, Vacation Permit, Book of Covenant, Tome of Knowledge, Migration.
5. **Coreano inteiro:** 28% com fonte, e o app KR é separado. Vale um revisor dedicado.
6. **Árabe:** RTL, nomes de comandantes transliterados (só 7 vistos no anúncio oficial) e a prefeitura (قاعة المدينة na comunidade; o termo do cliente não foi confirmado).
7. **Pontos marcados no próprio JSON:**
   - pt-BR "Idade do Aço" ligado a Iron Age: o mapeamento é inferido pela ordem das eras.
   - RU "Губернатор" vs "Правитель": as fontes divergem.
   - TR "Birlik" vs "İttifak" para Aliança.
   - vi: as fontes comunitárias costumam tratar da edição Gamota.
   - id: o anúncio mistura malaio; palavras só malaias foram rejeitadas.
8. **Nomes de comandantes** em ko, vi e ar, onde o cliente localiza nomes próprios (exemplo: KO 시저/카이사르; VI Tào Tháo, Tôn Tử).

### Protocolo sugerido para revisores
Print do cliente conta como fonte oficial, como no caso do dono. O validador já aceita a fonte `reviewer <id> screenshot AAAA-MM-DD`. Uma lista curta de telas cobre a maior parte dos 249 termos:

1. Perfil do Governador e "Mais informações".
2. Menu de construção e tela de melhoria da Prefeitura.
3. Itens, nas abas de recursos, aceleração e outros.
4. Calendário ou central de eventos.
5. Tela de comandante: talentos, habilidades, especialização e esculturas.
6. Hospital e tropas.
7. Menu da aliança, com loja, tecnologia e presentes.
8. Mapa do reino e menu de temporada.
9. Classificações.
10. Tela VIP.

O revisor manda os prints, e nós atualizamos as células para `verified-official` com essa fonte e a data.

## Onde recrutar revisores
- **Discord oficial de RoK** (discord.gg/riseofkingdoms, ~250 mil membros): os canais por idioma, que o dono mostrou que existem, são o primeiro lugar a tentar, em todos os 12 idiomas.
- **Fórum oficial global** (forum-global.lilithgame.com): o filtro por idioma tem jogadores ativos. Encontramos 500+ posts em pt/pt_BR, es, fr, de, it, ru, tr, id, vi, zh_TW e ar, e 246 em ko.
- **Coreano:** o Naver cafe oficial (cafe.naver.com/riseofkingdoms, citado no anúncio do app KR).
- **Vietnamita:** o Discord "Rise of Kingdoms Quang Rise" (~6,6 mil) e a página/comunidade da Gamota. Confirmar se o revisor joga no cliente global ou no Gamota.
- **Alemão:** o Discord AppGaming (~1 mil).
- **pt-BR:** servidores BR de Discord (tag no disboard) e o próprio reino do dono.
- **zh-Hant:** o autor do rbtips.com (赤黑攻略站) e o fórum de 萬國覺醒 no Bahamut (gamer.com.tw).
- **Russo:** os editores da wiki RU da Fandom (riseofkingdoms.fandom.com/ru).
- **Geral:** r/RiseofKingdoms (~176 mil) para uma chamada aberta por idioma.

## Fontes
- App Store: https://apps.apple.com/{us,br,es,fr,de,it,ru}/app/id1354260888 e https://apps.apple.com/kr/app/id1474599374
- Google Play: https://play.google.com/store/apps/details?id=com.lilithgame.roc.gp&hl={en,pt-BR,tr,id,vi,ko,zh-TW,ar}
- Fórum oficial (API): https://forum-global.lilithgame.com/api/v2/posts?account_id=10000000 (oficial) e `?language=<código>` (jogadores)
- BlueStacks: https://www.bluestacks.com/{pt-br,es,fr,de,it,ru,tr,id,vi,ko,tw,ar}/blog/game-guides/rise-of-kingdoms.html
- Wiki RU: https://riseofkingdoms.fandom.com/ru/ (API MediaWiki)
- rbtips: https://www.rbtips.com/p/rise-of-kingdoms.html
- Wiki EN: https://riseofkingdoms.fandom.com/wiki/Special:AllPages
- Prints do cliente PT: owner screenshot 2026-10-13 (imagens não guardadas)
