# Megahub — brainstorm v0 (hipóteses, antes da evidência)

> Status: **hipóteses**. Cada módulo será mantido, fundido ou descartado conforme as dores coletadas em `pains/` (frequência × gravidade) e o mapa de concorrência (`context/competitors-and-constraints.md`).
> Escrito antes dos resultados dos agentes, de propósito: serve para comparar o que imaginávamos com o que os jogadores realmente relatam (viés de confirmação fica visível).

## Visão

Um único lugar onde um jogador F2P (e, depois, qualquer perfil) e a liderança de um reino:
1. **sabem o que fazer agora** (plano diário personalizado),
2. **não desperdiçam recursos** (calculadoras e regras de decisão),
3. **se preparam para eventos/KvK** (calendário + metas),
4. **coordenam o reino** (DKP, MGE, migração, regras, comunicação).

## Camadas

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Conhecimento   Guias (EN), base de fatos versionada, meta │
│ 2. Ferramentas    Calculadoras, simuladores, builders        │
│ 3. Planejamento   Perfil da conta → plano diário/semanal     │
│ 4. Reino          DKP/KP, MGE, migração, regras, calendário  │
│ 5. Comunidade     Bot de Discord, alertas, multi-idioma      │
└──────────────────────────────────────────────────────────────┘
```

## Módulos candidatos

| # | Módulo | Dor hipotética | Dependência crítica |
|---|--------|----------------|---------------------|
| M1 | **Account Planner** — entra estado da conta + horas/dia → plano do dia ("faça X, guarde Y para o evento Z") | "não sei o que fazer em seguida", desperdício | modelo de dados do jogo + entrada de estado da conta |
| M2 | **Daily Checklist** com tempo estimado por tarefa, ordenado por valor/minuto | grind, tempo | dados A10 |
| M3 | **Event Calendar & Hoard Advisor** — o que guardar para cada evento e quando gastar | gastar speedups na hora errada | ciclo de eventos (A11), timeline do reino |
| M4 | **Calculadoras** — speedups, recursos para CH/pesquisa, VIP, AP, cura/mortes, materiais | contas manuais | tabelas A01/A02/A07 |
| M5 | **Commander Path Planner (F2P)** — quais comandantes, ordem de investimento, talentos | arrependimento de escolha | estratégia A06 com consenso |
| M6 | **Progress Tracker** — histórico da conta, metas até o KvK | não enxergar progresso | entrada manual/screenshot |
| M7 | **Kingdom Admin Suite** — DKP/KP, mortes, metas por jogador, relatórios | planilhas manuais | dados de stats (ToS!) |
| M8 | **MGE Rotation Manager** | disputas/brigas | regras do reino |
| M9 | **Migration Screening** — formulário + verificação | recrutar sem padrão | dados do jogador |
| M10 | **Discord Bot** — lembretes de eventos, checklist, consultas de guia | comunicação fragmentada | integração Discord |
| M11 | **Guide Engine** — guias gerados da base de fatos, com versão/data | informação desatualizada/espalhada | pipeline `facts/` → `context/` |
| M12 | **Q&A assistente (IA)** respondendo com citações da base | perguntas repetidas de iniciantes | context packs confiáveis |

## Questões a responder com evidência

1. Quais 3 dores têm maior frequência × gravidade para F2P/início de reino? → define o MVP.
2. Quais módulos já são bem resolvidos por concorrentes (não vale competir de frente)?
3. Como obter o estado da conta sem violar ToS: entrada manual, upload de print com OCR feito pelo usuário, ou nada?
4. Líderes pagariam/adotariam? (o Kingdom Admin Suite é a parte com possível modelo de negócio B2B-de-reino).

## Princípio de construção

"Megahub completo" é o destino; a ordem de construção segue evidência: **núcleo de dados → guia F2P → planner → calculadoras → admin de reino → bot/IA**. Cada módulo só entra quando a dor que ele resolve estiver `validada`.
