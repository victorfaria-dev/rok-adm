# Schema: ficha de dor (`pains/<id>.md`)

Uma dor = um problema recorrente de jogador ou líder. Diferente de "funcionalidade desejada": registra o **problema**, não a solução.

```yaml
---
id: D-0001
titulo: "Dificuldade em saber onde gastar aceleradores"
quem: jogador               # jogador | lider_alianca | rei_conselho | farm
perfil: [f2p, baixo]
estagio_reino: [todos]
dominios: [A04, A10]        # taxonomia
descricao: "Descrição do problema em 1–3 frases, nas palavras do jogador quando possível."
evidencias:
  - fonte: S05
    url: "https://..."
    trecho: "citação literal"
    data: 2026-09-01
frequencia: 0               # nº de relatos independentes encontrados
canais: []                  # canais distintos onde apareceu (ex.: [S05, S07])
gravidade: media            # baixa | media | alta  (custo em tempo, dinheiro, abandono do jogo, conflito)
solucao_atual: "Como os jogadores contornam hoje (planilha, bot, nada...)"
ferramentas_existentes: []  # IDs/links de C01 que já atacam a dor
hipotese_solucao: ""        # opcional, marcada como hipótese
status: bruto               # bruto | validada | descartada
---
```

## Regras

- `validada` exige `frequencia >= 5` (ajustável após o piloto) em `>= 2` canais.
- Dor inferida só de guias (sem relato de jogador) fica `bruto` com nota "inferida".
- Não misturar dores: se o relato cita dois problemas, criar duas fichas.
