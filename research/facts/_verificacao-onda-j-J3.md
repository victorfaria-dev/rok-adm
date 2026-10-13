# Verificação adversarial — Onda J, frente J3 (Low spender / valor por dólar)

Data: 2026-10-13. Verificador: J3. Escopo: 24 fichas (A12-0600..0618, A11-0600..0602, A05-0600, C04-0640).

## Método

- Todas as fontes foram buscadas de novo:
  - Reddit pelo Arctic Shift (`/api/{posts,comments}/ids`).
  - Fórum oficial por `/api/v2/posts/<id>`, mais a lista completa de 832 posts com grep local.
  - Fandom pela API MediaWiki (wikitext e revisões).
  - rkg, rokhandbook, LootBar, Packsify, igitems e GameRefinery por curl.
- As citações foram comparadas com o texto da página depois de normalizar espaços e aspas.
  - Resultado: **169/169 literais**, incluindo as 32 citações novas.
- Busca de contradições:
  - fórum oficial ("supply depot", "growth fund", "first purchase", "Daily Special", "Gem Rush/Road to Greatness/Recharge", "auto peacekeeping", "VIP19/special bundles");
  - Arctic Shift, por título de post ("growth", "gem supply", "supply", "coronation", "minamoto"), e as árvores de comentários dos fios relevantes. A busca de texto em comentários deu timeout.
- O heaven-guardian continuou inacessível (túnel fechado).

## Achados transversais

- **A página de bundles do rkg é de 2022.**
  - `datePublished` é 2022-01-14; o `dateModified` 2026-01-02 é um re-save em massa.
  - O `publicado_em` das citações dessa URL foi trocado para 2022-01-14 (`publicacao`).
- **1.0.87 (out/2024) mexeu nos bundles de VIP.** O post 1817043 diz: "updated the buffs, exclusive chests, and special bundles for different VIP levels".
  - A tabela da Fandom (VIP 0–18, sem VIP19) é anterior a essa versão.
- `A12/_lacunas.md` estava commitado **com marcadores de conflito de merge**. Resolvido assim:
  - ficou a versão da J3;
  - a linha L-A12-03 passou a apontar para C04-0640 e A12-0600.

## Tabela

| Ficha | Decisão | Confiança antes→depois | Problemas corrigidos |
|---|---|---|---|
| A12-0600 | verificado | baixa→baixa | Retirado "buying a bundle ... does not consume it" (sem fonte). "$10-class tier" virou "2,200-gem tier" (preço era inferido). |
| A12-0601 | verificado | baixa→baixa | +3 T4 de 2023: "2200 upfront", renovação acumula, 650/dia a $9.99. O valor de entrada continua 2,200 (T4) vs 2,000 (vendedor). |
| A12-0602 | verificado | baixa→baixa | +5 T4:<br>• $9.99 e $4.99 com cupom (2023);<br>• 9.99/4.99 EUR (2026);<br>• "CH7 or 8";<br>• **contra:** jogador em CH7 sem cupom vendo "$13.99" (moeda não dita).<br>Afirmação reescrita, números antigos mantidos. |
| A12-0603 | verificado | baixa→baixa | Nenhuma contradição achada. Continua fonte única de vendedor. |
| A12-0604 | verificado | baixa→baixa | +2 T4 (2026): as vantagens valem só nos 30 dias. |
| A12-0605 | verificado | baixa→baixa | +1 T4 (80k por $15). |
| A12-0606 | verificado | baixa→baixa | +3 T4 a favor (2023–2024). Packsify (vendedor) segue contra. |
| A12-0607 | verificado | baixa→baixa | "immediate part ~4,600 gems" não está na fonte. Reformulado; chave `immediate_gems` → `listed_gems_t4`. |
| A12-0608 | verificado | media→media | "eight" → **dez** famílias de 7 níveis. King's Coronation: LootBar 2026 = $185 / 12,525 VIP (5 níveis, 5,000 VIP a $100) vs rkg 2022 = $385 / 6,000. VIP a $100 = 5,000–6,000. A12-0004 (heaven-guardian) = cópia do rkg, **não independente**. |
| A12-0609 | verificado | baixa→baixa | "Ancestor's Legacy = trilha grátis" não está em T1. Reformulado. |
| A12-0610 | verificado | alta→alta | "Dia 43" vem de um parêntese sobre Pyrrhus na 1.0.71 (escopo incerto). Preço de abril/2025 = plano. +fonte 1.1.01. `data_validade` 2025-11-13. |
| A12-0611 | verificado | baixa→baixa | — |
| A12-0612 | verificado | baixa→baixa | — |
| A12-0613 | verificado | baixa→baixa | LootBar se contradiz: 1,050 gemas / 525 VIP no texto vs 1,100 / 500 implícitos nas linhas x8/x11. |
| A12-0614 | verificado | media→media | pbd5afk é uma reação incrédula a um valor citado por outra pessoa (anotado). |
| A12-0615 | verificado | media→media | "roughly 50$" vs soma de ~$30–45 (derivada) anotada. |
| A12-0616 | verificado | baixa→baixa | +Fandom Items/Army_Expansion (o 50% de Advanced Army Expansion). |
| A12-0617 | verificado | baixa→baixa | — |
| A12-0618 | verificado | baixa→baixa | Contas refeitas; mín. das entradas = baixa (ok). +"50 VIP/$ na variante 5,000". Piso sem entrada: 3,900 gemas/$. |
| A11-0600 | verificado | alta→alta | "Road to Greatness = S2+" só vale na 1.0.82. 1.0.86 lista Epic Glory para S2+. 1.0.87 RtG só com a nota de 21 dias. +3 fontes T1. |
| A11-0601 | verificado | baixa→baixa | "~3,000-3,600" → "~3,150-3,600". |
| A11-0602 | verificado | baixa→baixa | +T4 2023: o valor de entrada do supply conta no Gem Rush; o Growth Fund **não** conta. L-A11-08 atualizada. |
| A05-0600 | verificado | media→media | Tabela conferida linha a linha. Afirmação ganhou ressalva 1.0.87 / sem VIP19. VIP 10–18 marcados "unconfirmed". +T1 1817043, +LootBar ($8/$44/$200), +Reddit 2025 ($200). `data_fonte` 2024-02-23, `data_validade` 2026-03-20. |
| C04-0640 | verificado | alta→alta | — |

Contagem: 24 verificado, 0 contestado, 0 organizado.
- alta: 3
- media: 4
- baixa: 17

## Mudanças de texto numérico (antigo → novo)

| Ficha | Antigo | Novo |
|---|---|---|
| A12-0600 | "at the $10-class tier" | "at the 2,200-gem tier" |
| A12-0607 título | "immediate part ~4,600 gems (T4)" | "one player lists '4600 gems + 75h speedups + 11.8M resources' (T4)" |
| A12-0608 título | "and 525/1,000/2,000/4,000/6,000 VIP" | "and 525/1,000/2,000/4,000 VIP, then 6,000 (rkg 2022) or 5,000 (LootBar 2026) VIP at $100" |
| A12-0608 afirmação | "eight super-value bundle families" | "ten super-value bundle families" |
| A12-0608 afirmação | "(5,000 at $100 in some families)" | "(5,000 at $100 in one family, Mighty Conqueror/End of the Earth, and in the 5-tier $185 Hammer and Anvil)" |
| A11-0601 | "~3,000-3,600 gems a day" | "~3,150-3,600 gems a day" |
| A12-0602 | "$9.99 in one 2026 player post" | "$9.99 in player posts (2023 and 2026)" |
