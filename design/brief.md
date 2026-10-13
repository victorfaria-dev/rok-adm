# Brief de identidade — rodada 1 (2026-10-13)

Processo: skill `logo-design` (kaankiziltug/logo-design-skill), modo Design, trilha rápida (premissas declaradas, sem rodada de perguntas).

## Premissas
- **Produto:** hub web para jogadores e líderes de Rise of Kingdoms: guias, planejador de conta, calculadoras, farms, administração de reino. Interface em inglês, uso principal no celular, tema escuro padrão.
- **Nome:** ainda não definido (provisório "rok-adm"). Cada conceito vem com um nome candidato; nome e marca podem ser trocados entre si.
- **Adjetivos:** estratégico, confiável, preciso, organizado, competitivo.
- **Restrições:** nada da Lilith/Rise of Kingdoms; nome sem "Rise of Kingdoms"/"RoK"; precisa funcionar a 16 px, em uma cor e invertido.
- **Clichês da categoria (evitar sem releitura):** escudo genérico, coroa dourada, espadas cruzadas, dragão, castelo detalhado, louros, dourado em excesso.
- **Mapa de palavras:** governador, conselho, plano, tempo, estandarte, fortaleza, registro, marcha, reino, aliança, ordem, clareza, progresso.

## Conceitos (tipo de marca)
| | Nome candidato | Marca | Tipo | Ideia |
|---|---|---|---|---|
| A | Castellan | Rising Keep | pictórica abstrata | Ameias que sobem como um gráfico de progresso: a conta crescendo. |
| B | Vexil | Banner Check | pictórica + espaço negativo | Estandarte de aliança com um check vazado: identidade + plano cumprido. |
| C | Reignwise | Crowned Hourglass | pictórica combinada | Coroa sobre ampulheta: governar gastando bem o tempo. |

Riscos: A — torre com gráfico pode lembrar marcas de dados; B — o check é comum em apps de tarefa; C — mais detalhe, mais fraco a 16 px.

Nomes: nenhuma busca de marca registrada foi feita. Antes de adotar, fazer busca em bases de marcas e de domínios.

## Rodada 2 — direção "gamer" (2026-10-13)

Feedback do Victor: rodada 1 institucional demais; quer algo mais gamer.
Ajuste no brief: adjetivos passam a incluir **competitivo, ousado, energético**; formas angulares, tipografia pesada em itálico, linguagem de insígnia/esports, mantendo simplicidade a 16 px.

| | Nome candidato | Marca | Ideia | Risco |
|---|---|---|---|---|
| A | Warpath | Iron Visor | Elmo de comandante, todo em ângulos: você dá as ordens. | Elmos são comuns em logos de esports (Spartan/knight). |
| B | Ascent | Rank-Up Shield | Escudo de batalha com chevrons de "subir de rank": a conta evoluindo. | Escudo + chevron é linguagem conhecida; o diferencial vem da cor e do nome. |
| C | Crownbit | Pixel Crown | Coroa em 8-bit: o jogo de reino jogado como gamer. | Pode ler como muralha de castelo; estética retrô não combina com o visual do jogo. |

## Rodada 3 — KingdomOps (2026-10-13)

Decisão do Victor: nome **KingdomOps** (operações + reino) e referência visual própria: escudo vermelho com topo de castelo (3 ameias), K em aço, acabamento metálico 3D, wordmark pesado em prata.

Tradução para um master vetorial (`design/tools/build_logo.py`, saída em `design/logo/`):
- **Symbol:** escudo com 3 ameias + K clássico (haste + braços a 45°). O K em cunha da referência foi trocado porque, sozinho, lia como "I◀" (ícone de voltar) em tamanho pequeno.
- **Cores provisórias:** Ops Red `#D1242F`, Steel `#D5DAE1`, Iron `#15181E`.
- **Versões:** flat (master, todos os tamanhos), metal (gradiente + bisel, só ≥ 64 px, hero/landing), uma cor (K vazado), branco.
- **Wordmark:** candidatos OFL convertidos em path: Russo One (recomendado, mais próximo da referência) e Chakra Petch Bold.
- **Risco:** o vermelho da marca não pode ser o mesmo vermelho de "erro/perigo" da interface; a paleta de UI vai separar os dois.
- Busca de marca registrada para "KingdomOps" ainda não feita.
