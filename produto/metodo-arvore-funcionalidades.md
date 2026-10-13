# Método: do processo à árvore de funcionalidades

Decisão do Victor (2026-10-13): depois da pesquisa, mapear **todo o processo de conta e de reino** e identificar onde o sistema pode ajudar em cada passo. Esse mapa é a base da árvore de funcionalidades.

## Etapa 1 — Mapas de processo (entrada: context packs + fluxos de administração)

Dois mapas, cada um com seus ciclos:

**Conta**
- Jornada: dia 0 → CH alvo → primeiro KvK → temporadas seguintes.
- Ciclo diário (rotina), ciclo semanal, ciclo de eventos (preparar → acumular → gastar), ciclo de KvK.
- Ramificações por perfil de gasto (`research/perfis.md`) e por função (lutador, farm, rally, guarnição).
- Subprocesso de farms.

**Reino**
- Ciclo de vida do reino (preparação → temporadas → Season of Conquest).
- Os 10 fluxos de administração (`research/raw/pains-leaders/_admin-workflows.md`, verificados na onda 2): pré-KvK, durante o KvK, DKP, expurgos, migração, MGE, títulos, manutenção de aliança, inscrições em eventos, diplomacia.

Para cada **passo** do mapa registrar:

| Campo | Exemplo |
|-------|---------|
| Ator | jogador F2P, R4, rei |
| Gatilho / frequência | diário, início de evento |
| Decisão que precisa tomar | gastar ou guardar aceleradores |
| Informação necessária | calendário, inventário, custo do próximo CH |
| Dores ligadas | IDs `D-xxxx` |
| Fatos ligados | IDs de fichas |
| Como é feito hoje | planilha, Discord, memória, nada |

## Etapa 2 — Pontos de apoio do sistema

Para cada passo, classificar como o sistema pode ajudar (um passo pode ter vários):

1. **Informar** — guia, explicação, "por quê".
2. **Calcular** — calculadora, simulação.
3. **Planejar** — plano/cronograma personalizado, metas.
4. **Acompanhar** — histórico, progresso, alertas e lembretes.
5. **Coordenar** — entre jogadores, aliança e reino (listas, inscrições, regras, transparência).
6. **Identidade/social** — perfil, aliança, reputação, compartilhamento.

Restrição fixa: nenhum apoio pode envolver automação no jogo, leitura de arquivos ou tráfego do jogo, senhas ou assets da Lilith (`research/context/competitors-and-constraints.md`).

## Etapa 3 — Árvore de funcionalidades

```
Produto
 └─ Área (Conta | Farms | Reino | Identidade | Plataforma)
     └─ Épico (ex.: Planejamento diário)
         └─ Funcionalidade (F-xx, em produto/backlog-sistema.md)
             └─ Histórias de usuário
```

Cada funcionalidade é rastreável até: passos do processo → dores → fatos. Funcionalidade sem dor ou passo ligado é marcada como "sem evidência".

Priorização: (gravidade × frequência da dor) × alcance (quantos passos/atores cobre) ÷ esforço, com perfil F2P e início de reino na frente.

## Entradas e saídas

- Entradas: `research/context/*`, `research/pains/*`, `research/brainstorm/solucoes/*`, `produto/backlog-sistema.md`.
- Saídas:
  - `produto/processos/conta.md`
  - `produto/processos/reino.md`
  - `produto/arvore-funcionalidades.md`
  - `produto/backlog-sistema.md` atualizado.
- Responsável: Sub-admin PRODUTO, disparado quando as ondas de verificação de CONTA e REINO terminarem.
