# Perfis de gasto (eixo de expansão dos guias)

Ordem de construção dos guias: **F2P (base) → Low → Medium → High → Whale → Kraken**.
Cada guia de perfil é um **delta** sobre o anterior: o que muda quando há mais dinheiro (o que comprar, o que deixa de ser gargalo, quais prioridades se invertem), e não um guia reescrito do zero.

| Código | Perfil | Gasto mensal (USD) | Ícone |
|--------|--------|--------------------|-------|
| `f2p` | F2P | $0 | 🎁 |
| `low` | Low Spender | $5 – $100 | baú prata |
| `medium` | Medium Spender | $100 – $500 | baú pedra |
| `high` | High Spender | $500 – $1.000 | baú verde |
| `whale` | Whale | $1.000 – $5.000 | 🐳 |
| `kraken` | Kraken | $5.000+ | 🐙 |

Fonte da classificação: definição do projeto (imagem enviada pelo Victor em 2026-10-13), alinhada a uma convenção comum na comunidade. As fronteiras exatas são convenção, não mecânica do jogo.

## Limitações conhecidas (tratar no desenho do planner)

- **Gasto acumulado importa tanto quanto o mensal**: uma conta que gastou $10k no passado e hoje é F2P não se comporta como F2P. O planner deve pedir também uma estimativa de gasto acumulado/estado atual.
- **A faixa Low ($5–100) é larga**: $5 (um passe mensal) e $100 compram coisas muito diferentes. Provável divisão interna (ex.: "pass-only" vs "low pleno") — decidir quando houver dados de valor por pacote (A12).
- **Preços variam por região/moeda**: armazenar valores em USD com data e nota de região.

## Uso no schema

`perfil` em `schemas/fato.md` e `schemas/dor.md` usa estes códigos. Recomendação válida para vários perfis lista todos eles; `todos` quando não depende de gasto.
