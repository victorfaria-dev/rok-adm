# Contratos dos subagentes

Cada agente tem entrada, saída e critérios de aceitação definidos. Isso permite rodar vários em paralelo sem que um invente o formato do outro.

## 1. Coletor (um por domínio ou grupo de domínios)

- **Entrada:** código(s) de domínio, perguntas Q1–Q8 aplicáveis, lista de fontes (`fontes.md`).
- **Tarefa:** buscar e ler fontes; extrair afirmações atômicas com URL, trecho literal e data.
- **Saída:** `raw/<dominio>/<fonte>-<data>.md` (notas brutas) + atualização de `fontes.md` (fontes verificadas/novas).
- **Proibido:** preencher números de memória; resumir sem citar; descartar contradições.
- **Aceitação:** cada afirmação tem URL + trecho; lacunas registradas explicitamente.

## 2. Organizador

- **Entrada:** `raw/<dominio>/`.
- **Tarefa:** converter para fichas no `schemas/fato.md`; deduplicar; ligar conflitos; atribuir confiança pelas regras.
- **Saída:** `facts/<dominio>/*.md` com `status: organizado`; `facts/<dominio>/_indice.md` (lista de fichas + lacunas).
- **Aceitação:** 100% das fichas validam no schema; conflitos ligados nos dois sentidos.

## 3. Verificador (adversarial)

- **Entrada:** `facts/<dominio>/`.
- **Tarefa:** tentar **refutar** cada ficha: reabrir fontes, procurar fonte mais recente/oficial, checar se o fato ficou obsoleto após patches, checar se recomendações estratégicas valem só para um perfil (ex.: whale).
- **Saída:** fichas com `status` atualizado (`verificado`, `contestado`, `obsoleto`) e nota do porquê; `facts/<dominio>/_verificacao.md` com taxa de erros encontrada.
- **Aceitação:** amostra mínima revisada (100% no piloto; ≥30% depois, priorizando números e fichas de confiança alta).

## 4. Contextualizador

- **Entrada:** fichas verificadas/organizadas de um tema.
- **Tarefa:** produzir pacote no `schemas/context-pack.md`.
- **Saída:** `context/<tema>.md`.
- **Aceitação:** toda afirmação referencia ficha; lacunas e divergências explícitas; dentro do limite de tamanho.

## 5. Coletor de dores (voz do jogador)

- **Entrada:** fontes T4, domínios da taxonomia.
- **Tarefa:** encontrar relatos de problemas; agrupar por dor; contar frequência por canal; registrar como contornam hoje.
- **Saída:** `pains/*.md` no `schemas/dor.md` + `pains/_indice.md` ordenado por frequência × gravidade.
- **Aceitação:** cada dor tem ≥1 evidência literal com URL; dores inferidas marcadas.

## 6. Analista de concorrência e ToS

- **Entrada:** domínios C01 e C02.
- **Tarefa:** mapear ferramentas existentes (o que fazem, modelo de negócio, limitações, reclamações) e os ToS relevantes a automação/leitura de dados.
- **Saída:** `facts/C01/`, `facts/C02/` + `context/concorrencia-e-restricoes.md`.

## Orquestração

1. Piloto (F1): Coletor → Organizador → Verificador → Contextualizador em **um** domínio, sequencial. Revisão humana. Ajustar schemas/contratos.
2. Escala (F2–F5): Coletores em paralelo por grupo de domínios; Organizador e Verificador por domínio assim que o coletor termina (pipeline); Coletor de dores e Analista de concorrência em paralelo.
3. Cada fase termina com um commit e um checkpoint de revisão.
