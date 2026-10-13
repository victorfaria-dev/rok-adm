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
| B | F-15 rotina + Break Mode; F-20 checklist de comandante; `/me` (perfil, tema, exportar/importar/apagar); F-72 perfil efetivo; F-86 v0 (ICS gerado no aparelho) | `apps/web`, `packages/planner` | **concluída e integrada**: /routine, /commanders, /me, perfil efetivo e .ics; check, build (orçamento ok) e e2e verdes; decisões B1–B8 |
| C | Farms: F-65 escolha de variante, F-66 caminho de montagem, F-67 calculadora do Trading Post, F-68 metas diárias + checklist, F-69 registro de envios; guias de farm por recurso e geral (pares só como hipótese rotulada) | `apps/web/farms`, `packages/planner`, `guides/data` | concluída (2026-10-13): /farms/ (hub, choose, build, trading-post, log) + /guides/farms/ (geral + 4 recursos); check, build e e2e verdes |
| D | Kit de calculadoras (F-81) e trilha R1 do jogador: F-21, F-22, F-31, F-28, F-88 glossário, F-13, F-32 + F-82, F-11, F-18, F-25, F-26 | `apps/web/tools`, `packages/planner/tools` | **concluída** (branch `claude/kingdomops-wave-d`): /tools/ com 6 calculadoras (VIP, gemas, aceleradores, construções, cura, AP) + migração F-31, KvK F-26, reservas F-25, zerado F-13, segurança F-32+F-82; /glossary/ F-88; /changes/ F-28. Adiados: F-11, F-18 (dependem de T0), custos de pesquisa/treino (sem tabela), garantias da Roda |
| E | Kit do conselho: F-33 página de regras, F-34 card de requisitos + sandbox de fórmula, F-30 meus requisitos, F-35 MGE (v0 local), F-42 gerador de post de recrutamento, F-39 simulador de seed; guia de administração de reino | `apps/web/kingdom` | concluída (2026-10-13): /kingdom/ (hub + export/import/apagar), rules (+ view/print), requirements (sandbox DKP), my, mge (+ view), recruit, seed (experimental); revisão adversarial aplicada; check, build e e2e (399) verdes. Guia de administração fica com a onda H (`/guides/kingdom-admin/`). Adiado: regra por dia do K2779, ajustes por idade de conta/seed, CSV do ledger, edição inline de candidatos, traduções |
| F | **Backend** (decisão do Victor: dados do reino + sync de farms): `apps/api` com espaços de reino por código de convite, sync de farms e do MGE; sem senha (token por código); SQLite embutido do Node; só local, sem deploy | `apps/api`, `packages/core` (contratos) | pronta no ramo `claude/kingdomops-wave-f` (aguarda integração): `apps/api` local (node:http + node:sqlite, zero dependência de runtime), contratos e cliente tipado no `core`, OpenAPI 3.1 testado, 57 testes de API (fluxo, segurança, endurecimento) no `pnpm check`; ADR 0003 com STRIDE; decisões F1–F12; site não ligado (F9) |
| G | Integrações sem credenciais: ICS, CSV (importar/exportar, F-37 lite), webhook do Discord colado pelo próprio usuário, OCR local de prints próprios (F-54 experimental, Tesseract no navegador, imagem nunca sai do aparelho) | `apps/web`, `packages/planner` (csv) | **concluída** (2026-10-13): "Post to Discord" com webhook do conselho (MGE, regras, recrutamento, resumo semanal das farms; prévia exata, só no clique, 429/404 tratados); CSV RFC 4180 no planner (governadores e ledger do MGE, contas do sandbox de requisitos; farms já exportava); "Back up everything" em /me/ (todas as chaves `ko:*`, diff e confirmação); F-54 em /tools/screenshot/ (Tesseract servido pela própria origem, ~4,3 MB só após o clique); pendências da migração e do "More" sem JS corrigidas; check, build e e2e verdes; decisões G1–G10. ICS já existia (onda B) |
| H | Mais guias: delta Low pass-only (F-75), retornante (F-29 + F-28), primeiros 30 dias (F-11), recuperação após zerar (F-13), guia de administração de reino; só com fichas existentes e confiança exibida | `guides/data`, `packages/core` | **concluída** (2026-10-13): 5 conjuntos, 61 blocos (3 alta, 48 média, 3 baixa, 7 pendentes), cada guia com verificador adversarial; registro `guidesForProfile`/`selectGuide` no core com testes; 6 fichas novas (escudos, retornante) em `organizado`; lacunas em `research/STATUS.md`. Falta a renderização no site (outra frente) |
| I | 3D e motion: brasão 3D (F-61, experimental, Three.js sob demanda), torre de progresso (F-62, experimental), transições de tela | `apps/web` | planejada |

Ordem: A → B → C → D → E → F → G → H → I, com auditoria entre ondas. Itens que dependem de T0 (minutos por tarefa, ouro do Trading Post, upload de avatar) entram com o valor marcado como pendente, nunca inventado.

## Coordenadores em execução (sessões na nuvem)

| Onda | Sessão | Branch de saída |
|---|---|---|
| B | session_01M5YPP7uFGAY7w1pGsEdGsb | `claude/kingdomops-wave-b` (integrada) |
| C | session_018RZ5TxUuNcbZxB98xLoRnN | `claude/kingdomops-wave-c` (integrada) |
| H | session_01Lyh5XwMC41fqS3unC6F1GY | `claude/kingdomops-wave-h` (integrada; guias em /guides/) |
| D | session_01PfcmoBAphnvyuxaEFxSUdC | `claude/kingdomops-wave-d` (integrada) |
| E | session_01QbeBBwUnFmrJ7mFDqYj6P7 | `claude/kingdomops-wave-e` (integrada) |
| F | session_01MoSezpwQFqMWcdJEH5aXi3 | `claude/kingdomops-wave-f` (integrada) |
| J (pesquisa fim de jogo + low spender) | session_01W8Ban1K2K8Ncivz5B3w2e8 | `claude/kingdomops-wave-j` |

O diretor junta cada branch na `claude/rise-kingdoms-research-planning-bbpnz7` depois de `pnpm check`, build e e2e.

## Congelamento de funcionalidades (2026-10-13, decisão do Victor)
Nenhuma funcionalidade nova. Só terminam os dois trabalhos em andamento (palco do Sun Tzu no chat; guia visual com linha do tempo e calendário). Depois disso começa a fase de experiência do usuário: definir as 3 tarefas principais, teste de usabilidade com o Victor no preview e reorganização da navegação a partir dos resultados. O loop autônomo foi parado.

## Pendências para o próximo ciclo de correções
- ~~`/tools/migration/`: começa com valores de exemplo e mostra "Eligible" antes de o usuário digitar nada (onda D).~~ Corrigido na onda G (G9).
- Tabelas A01 com linhas corrompidas (ex.: Farm nível 25 = 2 de comida); as calculadoras excluem e avisam; precisa reextrair da fonte (onda D).
- ~~Botão "More" no celular não faz nada sem JS.~~ Corrigido na onda G (G10): link para `/more/`; o splash oculto que cobria a página sem JS também.
- Importar envios das farms por CSV (só exporta; o "Back up everything" cobre a restauração) (onda G, G4).
- Página de confiança e privacidade (`content/legal/`) ainda não cita o webhook do Discord nem o leitor de prints; texto jurídico final é com o Victor (onda G).
- Site ainda não usa a API local (decisão F9: falta UI de conflito).
