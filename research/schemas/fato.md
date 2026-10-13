# Schema: ficha de fato (`facts/<dominio>/<id>.md`) — v2 (2026-10-13)

Uma ficha = uma afirmação atômica (ou uma tabela coesa). Arquivo Markdown com front matter YAML.

```yaml
---
id: A01-0001                 # <dominio>-<sequencial>
dominio: A01                 # código da taxonomia
titulo: "Requisitos da Prefeitura nível 22"
tipo: mecanica               # mecanica | estrategia | evento | regra | ferramenta | derivado
metodo: ""                   # obrigatório se tipo=derivado: fórmula/script + IDs das fichas de entrada. Confiança = mínima das entradas
afirmacao: "Texto curto e objetivo da afirmação."
valores:                     # opcional: dados estruturados
  - {chave: "...", valor: "...", unidade: "..."}
tabela: ""                   # opcional: caminho para CSV em facts/<dom>/data/ (tabelas grandes, legíveis por máquina)
custo_tempo_min: null        # opcional: minutos de jogo da atividade
custo_tempo_origem: null     # medido | fonte | estimado
perfil: [todos]              # gasto: todos | f2p | low | medium | high | whale | kraken  (ver perfis.md)
funcao: [todas]              # todas | lutador | farm | rally | guarnicao | lider
estagio_reino: [todos]       # todos | pre_kvk | kvk1 | kvk2 | kvk3 | soc
fontes:
  - id: src:fandom            # slug da fonte em fontes.md (slugs evitam colisão entre agentes)
    url: "https://..."
    trecho: "citação literal curta que sustenta a afirmação"
    acessado_em: 2026-10-13
    publicado_em: 2026-01-02  # data de publicação/atualização da fonte, se visível (nem sempre confiável)
    copia_de: null            # slug da fonte original, se esta fonte copia outra (não conta como independente)
versao_jogo: "desconhecida"  # patch/temporada a que o fato se refere, se souber
data_fonte: 2026-10-13       # data de revisão/publicação da fonte principal
data_validade: 2026-10-13    # última data em que se sabe que o fato era verdadeiro
versao_minima: null          # patch a partir do qual vale
invalidado_por: null         # ID de ficha C04 ou versão do patch que tornou obsoleto
confianca: baixa             # baixa | media | alta  (regras abaixo)
status: bruto                # bruto | organizado | verificado | contestado | parcialmente_obsoleto | obsoleto
conflitos: []                # IDs de fichas que contradizem esta
consenso: n/a                # para estrategia: unanime | majoritario | dividido | minoritario | fonte_unica
n_fontes_pro: 0              # fontes independentes a favor
n_fontes_contra: 0           # fontes independentes contra
notas: ""
---
```

## Regras de confiança

- **alta**: T1 ou T0; ou T2 confirmado por 2 fontes independentes.
- **media**: uma fonte T2; ou T3 consistente com outras T3 e sem contradição.
- **baixa**: fonte única T3/T4; ou sem data; ou fonte com mais de 1 ano sem confirmação recente.

## Regras gerais

- Sem `url` + `trecho` → a ficha não pode sair de `bruto`.
- Números nunca são inferidos ou "arredondados de memória". Se não encontrado, registrar lacuna em `notas`.
- Estratégia (`tipo: estrategia`) sempre tem `consenso` e `perfil` preenchidos.
- Fontes à venda de recarga/contas (top-up, account shops) são marcadas em `notas` como possível conflito de interesse.
- Toda afirmação numérica é conferida contra a linha do tempo de patches (`context/game-state-and-patch-timeline.md`); datas de "atualizado em" de sites não são confiáveis.
- Comentários do organizador em notas brutas começam com `>>`.
- Lacunas viram itens em `facts/<dom>/_lacunas.md` (ID `L-<dom>-NN`, impacto alto|medio|baixo, método sugerido: medição T0, fonte específica).
- `data_referencia` (v1) migra para `data_validade`.
- Fichas antigas com `baixo|medio|alto` são lidas como `low|medium|high` (migração na integração).
