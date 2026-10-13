# Backlog de ideias do Victor (com análise do admin)

Ideias registradas como chegam. Status: `aceita` (entra no roadmap), `hipótese` (depende de dados), `descartada`.

## I-01 — Guias por perfil de gasto (2026-10-13) — aceita
F2P como base; deltas Low → Medium → High → Whale → Kraken. Ver `perfis.md`.

## I-02 — Sub-admins (2026-10-13) — aceita
Ver organograma em `STATUS.md`.

## I-03 — Guia de farms (2026-10-13) — aceita, variantes = hipótese
Guia separado do guia de conta principal, com variantes:
- **Farm de recurso único** (uma por recurso: food, wood, stone, gold).
- **Farm geral** (todos os recursos).
- **Farm de par de recursos** — só os pares que fizerem sentido.

Análise: quais variantes "fazem sentido" é pergunta empírica, não de preferência. Depende de (a) qual recurso é gargalo da conta principal em cada estágio de CH, (b) diferença de velocidade/rendimento de coleta por recurso, (c) taxa/limite de transporte. Pares só entram se os dados mostrarem vantagem (ex.: pares que compartilham gargalo no mesmo estágio). Coleta pedida à frente W6 (`raw/A-economy/_farm-variants.md`).

## I-04 — Hub de administração de farms (2026-10-13) — aceita (módulo M13)
Cadastro de farms, metas diárias por farm (coleta, transporte, tempo), checklist de rotina, totais enviados à conta principal, alerta de farm ociosa. Entrada manual (restrição de ToS a confirmar pela W5).

## I-05 — Questionário → guia personalizado em HTML (2026-10-13) — aceita (módulo M14 "Guide Builder")
Usuário responde: perfil de gasto, estilo de jogo/função, horas/dia, estágio do reino, civilização, CH atual, etc. → recebe o guia correspondente, com opções marcadas **Recommended** conforme o perfil de gasto.

Decisão de arquitetura (admin): **não** escrever um guia por combinação de respostas (explosão combinatória: 6 perfis × 5 funções × 4 estágios × faixas de horas = centenas de guias impossíveis de manter). Em vez disso:
1. O guia é feito de **blocos** (passos/recomendações) com metadados: `perfil`, `funcao`, `estagio_reino`, `horas_min`, `fichas_base`, `recommended_para`.
2. O questionário gera um filtro; o HTML monta o guia filtrando e ordenando blocos.
3. Os mesmos blocos alimentam depois o Account Planner (M1) e o Farm Hub (M13).

Isso mantém uma única fonte de verdade (fichas → blocos → guias) e permite adicionar perfis sem reescrever nada.

Primeira entrega: HTML estático (sem backend) com os blocos em JSON, publicado como página. Backend só quando houver estado do usuário a salvar.
