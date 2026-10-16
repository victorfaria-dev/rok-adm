# guides/ — guias modulares (I-05)

Os guias **não** são escritos uma vez para cada combinação de respostas. Eles são montados a partir de **blocos com tags** (decisão de arquitetura I-05 em `research/brainstorm/backlog-ideias.md`). Um bloco = uma recomendação ou passo, com o seu raciocínio, a sua evidência (IDs de fichas de fatos) e as tags de que um questionário precisa para decidir se o mostra. Os mesmos blocos vão alimentar depois o Planejador de Conta (M1) e o Farm Hub (M13).

Pipeline: `research/facts/` (fichas) → `guides/data/blocks.*.json` (blocos) → guia montado (Markdown agora, HTML a partir do Guide Builder M14 depois).

## Arquivos

| Caminho | O quê |
|---|---|
| `data/blocks.f2p.json` | Blocos-base F2P, v1 (43 blocos). **A fonte da verdade**: edite aqui. |
| `data/blocks.newkingdom.json` | F-12 Guia de Início em Reino Novo + Sobrevivência do Dia 1 + ramo de jogador que voltou, v1 (14 blocos, ids `nk-*`). |
| `data/blocks.low.json` | F-75 delta **só passes** de quem gasta pouco (Low) sobre a base F2P (mesmo `id` substitui, ids novos `low-*`). |
| `data/blocks.first30.json` | F-11 Caminho dos Primeiros 30 Dias (ids `f30-*`). |
| `data/blocks.returning.json` | F-29 Modo Jogador que Voltou + F-28 "O que mudou desde…" (ids `ret-*`). |
| `data/blocks.recovery.json` | F-13 Manual de Recuperação de Zeragem + lista de risco ao sair do jogo (ids `rz-*`). |
| `data/blocks.kingdomadmin.json` | Guia v1 de administração do reino para reis e conselho (ids `ka-*`, função `lider`). |
| `data/blocks.schema.json` | JSON Schema de um arquivo de blocos. |
| `f2p-early-kingdom-guide.md` | Guia F2P legível por humanos, **gerado** a partir dos blocos. Não edite à mão. |
| `tools/validate_blocks.py` | Validador: schema mais regras editoriais conferidas contra `research/facts`. Sem argumentos, confere todo `data/blocks.*.json` e se os ids são únicos entre os arquivos (arquivos delta de perfil são exceção). Só biblioteca padrão. |
| `tools/assemble_guide.py` | Monta o guia em Markdown a partir de um arquivo de blocos (filtra por perfil, ordena por fase). |
| `tools/factlib.py` | Auxiliares compartilhados: ler o front matter das fichas e os IDs de lacunas. |

```bash
python3 guides/tools/validate_blocks.py            # deve imprimir "0 errors"
python3 guides/tools/assemble_guide.py             # reescreve f2p-early-kingdom-guide.md
```

Qual guia é oferecido a qual perfil é decidido em `packages/core/src/guideSets.ts` (registro + `guidesForProfile`); todo arquivo de blocos novo precisa ser registrado ali.

## Campos do bloco

| Campo | Significado | O questionário usa? |
|---|---|---|
| `id` | Slug estável. Nunca reutilize um ID aposentado. | alvo de link |
| `title`, `body_md`, `why_md` | O que fazer, e **por quê** (todo bloco declara o seu raciocínio). | — |
| `phase` | Quando na vida do reino: `overview`, `day0-3`, `day4-14`, `day15-40`, `day41-90`, `pre-kvk1`, `daily`, `event`, `anytime`. | dia do reino |
| `section`, `order` | Capítulo do guia montado e chave de ordenação. | — |
| `stage` | Etapa do reino (`pre_kvk`, `kvk1` … `soc`, `todos`), mesmos códigos de `research/schemas/fato.md`. | etapa do reino |
| `perfil` | Perfis de gasto que veem o bloco (`f2p` … `kraken`, `todos`); veja `research/perfis.md`. | perfil de gasto |
| `recommended_for` | Perfis para os quais a opção principal do bloco recebe o selo **Recomendado**. | perfil de gasto |
| `low_spender_note` | Onde o conselho para quem gasta pouco (Low) muda de forma relevante (até existir o arquivo delta Low). | perfil de gasto |
| `funcao` | Função (`todas`, `lutador`, `farm`, `rally`, `guarnicao`, `lider`). | função |
| `hours_min_per_day` | Tempo mínimo de jogo por dia (horas) a partir do qual o bloco vale; `null` = qualquer. | horas/dia |
| `time_cost_min` | Minutos que o bloco custa, **medidos** (só T0); `null` até serem medidos. | horas/dia (depois) |
| `ch_range` | `[mín, máx]` de Prefeitura em que o bloco é relevante; `null` = qualquer. | Prefeitura atual |
| `civ` | Civilizações a que o bloco é específico; vazio = todas. | civilização |
| `priority` | 1–5; 5 = fazer primeiro. | ordenação / "plano mínimo" |
| `consensus`, `split_views` | `unanimous` / `majority` / `split` / `minority` / `single-source` / `mechanic`. As duas visões são obrigatórias quando `split`. | — |
| `cards` | Toda ficha de fatos citada em qualquer ponto do bloco. | — |
| `patch_cards` | Fichas de mudança de patch C04 citadas enquanto ainda estão `bruto` (exibidas como "Estado do patch"). | — |
| `confidence` | `high` / `medium` / `low` / `pending`. | alternância opcional "ocultar baixa" |
| `uncertain_notes` | Nomeia cada ficha mais fraca usada, e por quê. | — |
| `gaps` | IDs de lacunas (`L-<domínio>-NN` de `research/facts/*/_lacunas.md`, ou `PROPOSED-*`). | — |
| `as_of`, `patch_ref` | Data e patch com que o bloco foi conferido. | selo "verificado no patch" |

## Regras editoriais (aplicadas por `validate_blocks.py`)

1. Todo ID de ficha mencionado no texto está em `cards` e existe em `research/facts`.
2. Afirmações firmes se apoiam apenas em fichas com status `verificado` **e** confiança `media`/`alta`. Toda outra ficha citada deve ser nomeada em `uncertain_notes` (exibida como **Incerto**). A exceção são as fichas de patch C04 com confiança ≥ `media`, que são listadas em `patch_cards` e exibidas como **Estado do patch** até a frente de patches verificá-las.
3. Um bloco `high`/`medium` precisa de pelo menos uma ficha firme ou de patch. Um bloco `high` não pode citar fichas não firmes.
4. `consensus: split` exige `split_views`.
5. IDs de lacunas devem existir em um `_lacunas.md` (lacunas `PROPOSED-*` só geram um aviso, para o lado da pesquisa poder registrá-las).
6. `time_cost_min` fica `null` até existir um valor de cronômetro do T0. Blocos diários sem ele devem listar `L-A10-01`.
7. Números nunca são inventados. Números ausentes viram uma referência de lacuna ("Pendente de medição no jogo (T0)").

## Como o questionário (F-01, M14 Guide Builder) vai filtrar os blocos

O questionário faz seis perguntas. Cada resposta é um filtro ou uma ordenação sobre os campos do bloco. Uma página HTML estática consegue fazer isso no navegador com o arquivo JSON, sem backend.

| Pergunta | Códigos de resposta | Regra |
|---|---|---|
| **Perfil de gasto** | `f2p`, `low`, `medium`, `high`, `whale`, `kraken` | Carrega o arquivo-base F2P mais os arquivos delta até o perfil escolhido (`blocks.low.json`, …, quando existirem; um bloco delta com o mesmo `id` substitui o bloco-base). Mantém o bloco se `perfil` contém a resposta ou `todos`. Dá o selo **Recomendado** se `recommended_for` a contém. Mostra `low_spender_note` quando a resposta é `low` (até o delta Low existir). |
| **Função** | `lutador`, `farm`, `rally`, `guarnicao`, `lider` | Mantém o bloco se `funcao` contém a resposta ou `todas`. Quem joga só de farm ainda recebe os blocos `todas` (rotina, segurança). |
| **Horas por dia** | 0,25 / 0,5 / 1 / 2+ | Mantém o bloco se `hours_min_per_day` é `null` ou ≤ a resposta. Para blocos `daily`, mostra o **maior nível que cabe**, com os níveis menores incorporados a ele. Quando o T0 preencher `time_cost_min`, soma os custos e sinaliza um plano que ultrapasse o tempo. |
| **Etapa do reino** | `pre_kvk`, `kvk1`, `kvk2`, `kvk3`, `soc` | Mantém o bloco se `stage` contém a resposta ou `todos`. Uma resposta de dia do reino (opcional) recolhe as fases que já passaram. |
| **Prefeitura atual** | 1–25 | Mantém o bloco se `ch_range` é `null` ou contém a Prefeitura. Blocos cujo intervalo termina abaixo da Prefeitura vão para uma lista recolhida "Já feito?" em vez de ficarem ocultos, para o jogador pegar o que deixou passar. |
| **Civilização** | p. ex. `china`, `spain`, … | Mantém o bloco se `civ` está vazio ou contém a resposta. O bloco de escolha de civilização só aparece para quem está na Prefeitura ≤ 10 (seu `ch_range`), quando a troca grátis ainda está por vir. |

Ordenação após a filtragem: `phase` (na ordem listada acima), depois `order`. Uma visão de "plano mínimo" mostra só `priority ≥ 4`. Uma alternância opcional oculta os blocos `confidence: low` e `pending`; ela vem desligada por padrão, para a incerteza continuar visível.

Esboço:

```js
const keep = b =>
  (b.perfil.includes(a.perfil) || b.perfil.includes("todos")) &&
  (b.funcao.includes(a.funcao) || b.funcao.includes("todas")) &&
  (b.stage.includes(a.stage) || b.stage.includes("todos")) &&
  (b.hours_min_per_day === null || b.hours_min_per_day <= a.hours) &&
  (b.ch_range === null || a.ch <= b.ch_range[1]) &&      // intervalos passados -> "Já feito?"
  (b.civ.length === 0 || b.civ.includes(a.civ));
```

## Adicionar um perfil ou atualizar para um patch

- **Perfil novo (Low, depois Medium, …):** escreva `blocks.<perfil>.json` só com os blocos que mudam (mesmo `id` para substituir, `id` novo para acrescentar), como descrito em `research/perfis.md`. Não copie o arquivo F2P.
- **Patch novo:** blocos cujas fichas são invalidadas por uma nova ficha C04 recebem texto novo e novos `as_of` / `patch_ref`. O validador pega fichas que caíram abaixo do filtro firme, porque os status são lidos ao vivo de `research/facts`.
- **Resultados do T0:** quando uma lacuna se fecha, o lado da pesquisa atualiza ou acrescenta a ficha. Então o bloco move o número de "Pendente" para o corpo e, nas tarefas de rotina, preenche `time_cost_min`.
