# Roadmap do desenvolvimento autônomo

Pedido do Victor (2026-10-13, antes de dormir): "Crie os sistemas necessários, planeje o desenvolvimento e implemente. Faça sem pressa, com testes e auditorias. Quero o sistema rico, com todas as funcionalidades, outros guias, integração de APIs. Siga com o projeto até concluir."

Base: `produto/arvore-funcionalidades.md` (MVP, R1, R2, R3), `produto/plano-app-shell.md`, `produto/apis-integracoes.md`, `produto/ideias-3d.md`. Decisões tomadas sem o Victor: `produto/decisoes-autonomas.md`.

## Como cada onda roda
1. **Construção:** no máximo 3 subagentes por vez, cada um numa cópia isolada (worktree), donos de pastas diferentes.
2. **Integração:** o admin junta, roda `pnpm check`, build do site (com orçamento de JS) e Playwright, e só então faz push.
3. **Auditoria:** agentes Fable navegam no site como personas (F2P novo, low spender, líder de aliança, jogador que voltou, farmer), com checklist de UX, acessibilidade (axe), desempenho e textos. Achados viram correções na onda seguinte.
4. **Registro:** `research/STATUS.md` e este arquivo são atualizados a cada onda.

## Limites (não cruzar sem o Victor)
Merge na main; publicar/hospedar; serviços pagos, chaves ou contas; qualquer coisa contra os Termos da Lilith (sem bots, sem arquivos/tráfego do jogo, sem assets, sem dados de terceiros sem consentimento); textos jurídicos finais.

## Ondas

| Onda | Escopo (IDs da árvore) | Sistemas | Status |
|---|---|---|---|
| A | F-01 questionário; F-02 + F-14 guia personalizado; F-12 guia de reino novo; F-60/F-10 cartão 3D; sting do logo | `apps/web` | **concluída** (auditoria por personas em andamento) |
| B | F-15 rotina + Break Mode; F-20 checklist de comandante; `/me` (perfil, tema, exportar/importar/apagar); F-72 perfil efetivo; F-86 v0 (ICS gerado no aparelho) | `apps/web`, `packages/planner` | pronta no ramo `claude/kingdomops-wave-b` (aguarda integração): /routine, /commanders, /me, perfil efetivo e .ics; check, build (orçamento ok) e e2e verdes; decisões B1–B8 |
| C | Farms: F-65 escolha de variante, F-66 caminho de montagem, F-67 calculadora do Trading Post, F-68 metas diárias + checklist, F-69 registro de envios; guias de farm por recurso e geral (pares só como hipótese rotulada) | `apps/web/farms`, `packages/planner`, `guides/data` | concluída (2026-10-13): /farms/ (hub, choose, build, trading-post, log) + /guides/farms/ (geral + 4 recursos); check, build e e2e verdes |
| D | Kit de calculadoras (F-81) e trilha R1 do jogador: F-21, F-22, F-31, F-28, F-88 glossário, F-13, F-32 + F-82, F-11, F-18, F-25, F-26 | `apps/web/tools`, `packages/data` | planejada |
| E | Kit do conselho: F-33 página de regras, F-34 card de requisitos + sandbox de fórmula, F-30 meus requisitos, F-35 MGE (v0 local), F-42 gerador de post de recrutamento, F-39 simulador de seed; guia de administração de reino | `apps/web/kingdom` | planejada |
| F | **Backend** (decisão do Victor: dados do reino + sync de farms): `apps/api` com espaços de reino por código de convite, sync de farms e do MGE; sem senha (token por código); SQLite embutido do Node; só local, sem deploy | `apps/api`, `packages/core` (contratos) | planejada |
| G | Integrações sem credenciais: ICS, CSV (importar/exportar, F-37 lite), webhook do Discord colado pelo próprio usuário, OCR local de prints próprios (F-54 experimental, Tesseract no navegador, imagem nunca sai do aparelho) | `apps/web` | planejada |
| H | Mais guias: delta Low pass-only (F-75), retornante (F-29 + F-28), primeiros 30 dias (F-11), recuperação após zerar (F-13), guia de administração de reino; só com fichas existentes e confiança exibida | `guides/data`, `packages/core` | **concluída** (2026-10-13): 5 conjuntos, 61 blocos (3 alta, 48 média, 3 baixa, 7 pendentes), cada guia com verificador adversarial; registro `guidesForProfile`/`selectGuide` no core com testes; 6 fichas novas (escudos, retornante) em `organizado`; lacunas em `research/STATUS.md`. Falta a renderização no site (outra frente) |
| I | 3D e motion: brasão 3D (F-61, experimental, Three.js sob demanda), torre de progresso (F-62, experimental), transições de tela | `apps/web` | planejada |

Ordem: A → B → C → D → E → F → G → H → I, com auditoria entre ondas. Itens que dependem de T0 (minutos por tarefa, ouro do Trading Post, upload de avatar) entram com o valor marcado como pendente, nunca inventado.

## Coordenadores em execução (sessões na nuvem)

| Onda | Sessão | Branch de saída |
|---|---|---|
| B | session_01M5YPP7uFGAY7w1pGsEdGsb | `claude/kingdomops-wave-b` (integrada) |
| C | session_018RZ5TxUuNcbZxB98xLoRnN | `claude/kingdomops-wave-c` (integrada) |
| H | session_01Lyh5XwMC41fqS3unC6F1GY | `claude/kingdomops-wave-h` (integrada; guias em /guides/) |
| D | session_01PfcmoBAphnvyuxaEFxSUdC | `claude/kingdomops-wave-d` |
| E | session_01QbeBBwUnFmrJ7mFDqYj6P7 | `claude/kingdomops-wave-e` |
| F | session_01MoSezpwQFqMWcdJEH5aXi3 | `claude/kingdomops-wave-f` |

O diretor junta cada branch na `claude/rise-kingdoms-research-planning-bbpnz7` depois de `pnpm check`, build e e2e.
