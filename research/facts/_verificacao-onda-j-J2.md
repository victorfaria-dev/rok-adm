# Verificação adversarial — Onda J, frente J2 (tropas tardias, cura, pesquisa, economia de gemas)

Verificador: J2 · data: 2026-10-13 · 23 fichas (A08-0600..0608, A02-0600..0602, A04-0600..0605, B01-0900..0902, C04-0620/0621).

Método: todas as fontes rebaixadas de novo com curl (fórum oficial `/api/v2/posts/<id>` com `language: en_US`; Fandom via MediaWiki API, wikitext + texto renderizado + revisões; riseofkingdomsguides com UA do curl, datas reais pelo JSON-LD; lootbar/packsify/boostroom com UA Firefox) e cada `trecho` foi procurado literalmente (só normalização de espaços/aspas) por script. Resultado: **todos os trechos originais eram literais e os IDs de post estavam corretos**. Busca de contradição: lista completa de posts oficiais (832) por palavras-chave; Fandom (Barracks, Technology/*, Academy/City Hall/Watchtower/Trading Post Requirements); Reddit via Arctic Shift (busca por título funcionou para "hall of heroes"; buscas de texto completo e várias de título deram "Timeout" mesmo com esperas de 30 s).

| Ficha | Decisão | Confiança antes → depois | Problemas corrigidos |
|---|---|---|---|
| A08-0600 | verificado | media → media | "slightly wounded heal at no cost" → "healed instantly on return" (Fandom não fala de custo); post 1014483 era **plano** dos devs, não patch — nota corrigida; afirmação marca que as linhas de santuário/altar/passo/Lost Temple são só Fandom 2020 (passos Lv11 desde 1.0.94). |
| A08-0601 | verificado | alta → alta | Afirmação não diz mais, como oficial, que o Hall guarda tropas mortas (nenhum texto T1 diz isso); "Imperium power" precisado (cálculo de designação de Imperium Kingdoms). |
| A08-0602 | verificado | baixa → baixa | +2 fontes T4 (Reddit 2021/2022 citam "50%" no SoC); continua baixa (T4 não eleva mecânica; >1 ano). |
| A08-0603 | verificado | baixa → baixa | **Erro**: "same totals" (arqueiro/cavalaria somam 210 vs infantaria 240 no T4); faltava cerco (usa 3 recursos). Peculiaridades da calculadora registradas. |
| A08-0604 | **contestado** | baixa → baixa | Nota dizia que nenhuma unidade usa 3 recursos (falso: cerco). Descoberto que os valores da packsify = tabela da rkg ×6 (comida/madeira/pedra) e ×9 (ouro) → a razão 20× de ouro **não** é corroboração independente. |
| A08-0605 | verificado | media → media | Aritmética refeita (4 × 50k/65k/75k = 200k/260k/300k). Sem mudanças. |
| A08-0606 | verificado | media → media | — |
| A08-0607 | verificado | media → media | **Contradição encontrada**: Fandom Buildings/Barracks diz que promover custa **mais** no total que treinar o tier superior direto; rkg diz "o mesmo". Título/afirmação agora reportam a disputa; +fonte Fandom; n_fontes_contra 1; lacuna L-A08-07. |
| A08-0608 | verificado | alta → alta | "instead of lowering base costs" → ausência de evidência; Recovery Potions limitadas ao pioneer do Acclaim Shop em Heroic Anthem (1.1.04). |
| A02-0600 | verificado | media → media | **Erro**: 231d 14h é só o passo Lv10 do Medical Corps; níveis 1–10 somam ≈ 461,5 dias brutos. Faltavam pré-requisitos do Lv10 (Combined Arms 10, Encampment 10). Trechos trocados pelas linhas literais da tabela renderizada (agora citam os números). Confirmado nas outras linhas: Pavise/Plate Armor/Heavy Frame 10; Trebuchet 150d 1h. |
| A02-0601 | verificado | alta → alta | "Crystals go only into the unit type you use" → "can invest… without researching unused ones"; rework 2025 era Pioneer em histórias específicas e depois "select Stories" (1.1.02); "own queue" → fila no painel Queue Management (1.1.04). +3 fontes T1 (1055096, 1241934, 2213663). |
| A02-0602 | verificado | baixa → baixa | Removida inferência sem fonte ("speedups have a second payoff"). |
| A04-0600 | verificado | media → **baixa** | rkg põe Wheel of Fortune **acima** de VIP 14 (não "last"); revisão 2026-06-25 do FAQ da Fandom é só um revert de link (texto ≤ 2023-08) → sem confirmação recente, economia de gemas mudou (tickets de WoF, VIP 19/SVIP). Cadeia Castle 25 → Academy 25 confirmada pelas tabelas. |
| A04-0601 | verificado | baixa → baixa | Soma refeita (20.045 livros; Lv25 = 5.000). "Out of reach" → razão explícita ≈ 500 dias de 100 gemas/dia. |
| A04-0602 | verificado | baixa → baixa | — |
| A04-0603 | verificado | media → media | Origem do "2 horas" localizada (lootbar). |
| A04-0604 | verificado | media → media | lootbar diz "500M Food and Wood" — ficha tinha dividido em 500M cada; agora marcado como ambíguo. |
| A04-0605 | verificado | alta → alta | — (posts 1108303/1108923 e 1107790 conferidos). |
| B01-0900 | verificado | alta → alta | Nota: modo Mini-Season existe (duração desconhecida); não apresentar 49/50 dias como duração atual de toda temporada. |
| B01-0901 | verificado | alta → alta | "shipped in 1.0.89" suavizado (Q&A fala "each KvK", 1.0.89 fala "Lost Kingdom"); nota agora lista os cortes pequenos (1.0.90, 1.0.91). |
| B01-0902 | verificado | baixa → baixa | — |
| C04-0620 | verificado | alta → alta | — |
| C04-0621 | verificado | alta → alta | "next to the hospital" → "in addition to the hospital". |

Contagem: 22 verificado, 1 contestado (A08-0604). Confiança final: alta 8 (A08-0601, A08-0608, A02-0601, A04-0605, B01-0900, B01-0901, C04-0620, C04-0621); media 7 (A08-0600, A08-0605, A08-0606, A08-0607, A02-0600, A04-0603, A04-0604); baixa 8 (A08-0602, A08-0603, A08-0604, A02-0602, A04-0600, A04-0601, A04-0602, B01-0902). Única mudança de nível: A04-0600 media → baixa.

Lacuna nova: L-A08-07 (custo de promover T4→T5 vs treinar T5).

Fichas T1 antigas (2020–2021) mantidas em `alta` porque a afirmação está escrita como histórico datado de patch (mesma prática de A03-0030); isso não confirma o estado atual.
