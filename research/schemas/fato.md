# Schema: ficha de fato (`facts/<dominio>/<id>.md`)

Uma ficha = uma afirmação atômica (ou uma tabela coesa). Arquivo Markdown com front matter YAML.

```yaml
---
id: A01-0001                 # <dominio>-<sequencial>
dominio: A01                 # código da taxonomia
titulo: "Requisitos da Prefeitura nível 22"
tipo: mecanica               # mecanica | estrategia | evento | regra | ferramenta
afirmacao: "Texto curto e objetivo da afirmação."
valores:                     # opcional: dados estruturados
  - {chave: "...", valor: "...", unidade: "..."}
perfil: [todos]              # gasto: todos | f2p | low | medium | high | whale | kraken  (ver perfis.md)
funcao: [todas]              # todas | lutador | farm | rally | guarnicao | lider
estagio_reino: [todos]       # todos | pre_kvk | kvk1 | kvk2 | kvk3 | soc
fontes:
  - id: S03                  # ID em fontes.md
    url: "https://..."
    trecho: "citação literal curta que sustenta a afirmação"
    acessado_em: 2026-10-13
versao_jogo: "desconhecida"  # patch/temporada a que o fato se refere, se souber
data_referencia: 2026-10-13  # quando o fato era verdadeiro
confianca: baixa             # baixa | media | alta  (regras abaixo)
status: bruto                # bruto | organizado | verificado | contestado | obsoleto
conflitos: []                # IDs de fichas que contradizem esta
consenso: n/a                # para estrategia: unanime | majoritario | dividido | minoritario
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
- Fichas antigas com `baixo|medio|alto` são lidas como `low|medium|high` (migração na integração).
