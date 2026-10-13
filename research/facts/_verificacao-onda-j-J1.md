# Verificação adversarial — onda J, frente J1 (A06/A07)

Data: 2026-10-13. Verificador: J1. Fichas: A06-0600..0611 e A07-0600..0606 (19).
Método: posts oficiais rebaixados um a um (`/api/v2/posts/<id>`, header `language: en_US`), lista oficial completa (832 posts) para busca de contradições, Arctic Shift (posts/comentários por ID e busca), curl de allclash, topuplive e riseofkingdomsguides. Toda citação foi checada por substring após normalizar espaços/aspas: **todas as citações originais eram literais**. Os problemas estavam nas afirmações, nas datas e na confiança.

| Ficha | Decisão | Confiança antes → depois | Correções |
|---|---|---|---|
| A06-0600 | verificado | alta → alta | Removido "regra de 2021 superada" (não está nas citações); adicionada remoção de 3 comandantes da WoF de SoC (1.0.94); T4 2025–26 confirma comandantes SoC na roda da Season 3; data do post 1935973 → 2025-02-06 |
| A06-0601 | verificado | alta → **baixa** | Fonte única T1 de dez/2024, sem confirmação posterior; T4 2026 cita Arthur via Gathering of Heroes, nunca King's Trials; data 1896244 → 2024-12-31 |
| A06-0602 | verificado | alta → alta | Preços literais do FAQ oficial (100 Gems/ticket, máx. 120; US$4,99 = 12, máx. 120). Adicionado 1.0.94 (4 comandantes não trocáveis) e T4 2026 confirmando 100 Gems/ticket, evento único e Revoke. US$4,99 e tetos não reconfirmados após jan/2025 |
| A06-0603 | verificado | media → media | +2 usuários T4 ("starts as soon as KvK 2 ends"); data 1862964 → 2024-11-27 |
| A06-0604 | verificado | alta → alta | T4 2026 confirma o evento; pool de comandantes muda (Sun Tzu Prime dentro/fora); data 1896244 |
| A06-0605 | verificado | media → media | Adicionada T3 (topuplive "Finish one march...") e T4; ressalva de comandante não trocável (CJ); "only strong in Season 2" → "Season 2 commanders" |
| A06-0606 | verificado | media → media | Os 6 nomes conferidos contra o HTML do allclash (entradas "Before SoC/KvK4 ONLY") |
| A06-0607 | verificado | media → media | Dissidência (trocar YSG por Zhuge Liang) confirmada no arquivo |
| A06-0608 | verificado | alta → alta | Versão resolvida: post 2197960 = 1.1.03, publicado 2026-01-13 |
| A06-0609 | verificado | alta → alta | Contexto "Silk Road" confirmado no texto |
| A06-0610 | verificado | baixa → baixa | IDs/autores conferidos; dividido mantido |
| A06-0611 | verificado | media → media | Generalização "Primes fora de MG/WoF" restrita a Prime Ragnar (T4 cita Sun Tzu/Scipio Prime na roda); +citação "more consistent"; datas 1820228/1862964 |
| A07-0600 | verificado | media → **baixa** | Regra de 2021 sem reconfirmação oficial; texto não diz se restringe uso ou obtenção; T4 2026 só confirma obtenção na loja de Conquest Coins em SoC; conselho removido da afirmação |
| A07-0601 | verificado | alta → **media** | **Correção de fato**: 1.0.56 (oficial) lista Artisan's Forge, Lost Canyon Shop e Crystal Quest como fontes de Iconic Crystal — a ficha dizia "só conquistas" e chamava o rkg de velho; +1.0.57; "escasso" removido (T4 dividido) |
| A07-0602 | verificado | baixa → baixa | Adicionada citação T1 (1.0.56) para a regra geral; números seguem T3 2022 |
| A07-0603 | verificado | baixa → baixa | T4 2026 usa outra lógica (set completo em Iconic II; botas IV/V) |
| A07-0604 | verificado | alta → **media** | **Removida** a afirmação "In Search of Wonders a partir da Season 2 (1.1.07)": a nota de rodapé é singular e segue o item Aural Appraiser; substituída pela última regra explícita (1.0.88: só Season 3/SoC) |
| A07-0605 | verificado | alta → alta | Datas 2030530/1935973 corrigidas; T4 2026 confirma a loja de SoC |
| A07-0606 | verificado | baixa → baixa | IDs conferidos; dividido mantido |

Totais: 19 verificado, 0 contestado, 0 mantido em organizado. Confiança final: alta 7, media 7, baixa 5.

Política aplicada à regra ">1 ano sem confirmação recente": T1 antigo mantém alta quando um texto oficial ou um T4 de até 12 meses confirma que o sistema/valor ainda vale; sem nenhuma confirmação → baixa (A06-0601, A07-0600); confirmação só parcial → media (A07-0601, A07-0604).

`python3 research/tools/validate_facts.py A06 A07` → 41 fichas, 0 erros, 0 avisos.
