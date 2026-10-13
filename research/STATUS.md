# Status do projeto (painel do administrador)

Atualizado: 2026-10-13

## Organização (delegação)

```
Victor (direção, ideias, decisões finais)
  └─ Admin geral (Claude): prioridades, integração, revisão, commits, interface com o Victor
       ├─ Sub-admin CONTA      → W1, W2, W6, W7 + verificadores → context packs → Guia F2P → deltas por perfil (perfis.md)
       ├─ Sub-admin REINO      → W4 + verificadores → Guia de administração de reino
       ├─ Sub-admin PRODUTO    → W3, W4 (dores), W5 → ranking de dores → MVP e especificação do megahub
       └─ Sub-admin ENGENHARIA (a partir da onda de especificação) → modelo de dados, arquitetura, protótipo
```

Regras: cada sub-admin recebe um objetivo e critérios de aceitação, dispara seus próprios workers, só escreve nas suas pastas e devolve um relatório curto. Só o admin geral faz commit e muda `00-PLANO.md`, `fontes.md` e schemas.

Onda 1 (abaixo) foi disparada diretamente pelo admin geral; a partir da onda 2 os sub-admins assumem.

## Frentes em execução (subagentes)

| # | Frente | Domínios | Saída | Status |
|---|--------|----------|-------|--------|
| W1 | Mecânicas F2P (piloto) | A01, A04, A05, A09, A10, A14 | `raw/A-pilot/`, `facts/A0x/` | **concluída** — 49 fichas; sem minutos por tarefa nem renda diária completa de gemas |
| W2 | Estratégia F2P / início de reino | A02, A06, A07, A08, A11, B01 | `raw/A-strategy/`, `facts/` (IDs ≥0500) | **concluída** — 55 fichas, todas ≤ media; fontes T1/T2 bloqueadas |
| W3 | Dores — jogadores | C03 | `pains/D-0001..0499`, `raw/pains-players/` | **concluída** — 44 dores; ~12,8 mil posts Reddit (arquivo), ~3,5 mil reviews, ~1 mil comentários do fórum oficial |
| W4 | Dores — líderes + administração | B01–B09, C03 | `pains/D-0500..0999`, `facts/B0x/`, `raw/pains-leaders/` | **concluída** — 26 dores (14 validadas), 38 fichas B, 10 fluxos de administração |
| W5 | Concorrência e ToS | C01, C02 | `facts/C01-C02/`, `context/competitors-and-constraints.md` | **concluída** — ~30 ferramentas, ToS lido; 51 fichas não verificadas |
| W6 | Economia, coleta, farms, gasto | A03, A12, A13 | `raw/A-economy/`, `facts/A03,A12,A13/` | **concluída** — 47 fichas; lacunas: taxas de coleta por nível, ouro via Trading Post |
| W7 | Histórico de patches / estado atual | C04 | `facts/C04/`, `context/game-state-and-patch-timeline.md` | **concluída** — 33 fichas; versão atual provável 1.1.12 (confiança baixa) |

## Onda 2 (em execução)

| Frente | Responsável | Escopo |
|--------|-------------|--------|
| Integração + verificação + lacunas + protocolo T0 + context packs de conta | Sub-admin CONTA | A01–A14, B01 |
| Verificação + dores de líderes + context packs de administração de reino | Sub-admin REINO | B02–B09, D-05xx |
| Soluções conceituais por dor (hipóteses) | Brainstorm | `brainstorm/solucoes/` |

## Bloqueios

- **rok.guide**: fora do ar na origem — o DNS do domínio falha (servidores de nome recusam a consulta, SERVFAIL via dns.google em 2026-10-13). Não é a política de rede (ambiente está em acesso completo). Possível domínio expirado/abandonado → relevante para concorrência (C01). Usar cópias em archive/buscadores quando possível.
- **Reddit, Fandom wiki**: respondem 403 (bloqueio do próprio site a bots) — impacta a coleta de dores. Alternativas: espelhos/buscadores, YouTube, reviews de loja.
- **Site oficial Lilith**: inacessível na W2.

## Próximas ondas (disparadas quando a anterior terminar)

1. **Integração:** consolidar `_sources.md` → `fontes.md`; resolver conflitos de IDs; consolidar índices.
2. **Verificação adversarial:** um verificador por grupo de domínios, cruzando com W7 (obsolescência).
3. **Síntese de dores:** ranking único jogadores + líderes → escolha do MVP do megahub (`brainstorm/`).
4. **Context packs:** `context/` por tema.
5. **Guia F2P v1** (EN) e **guia de administração de reino v1**; depois deltas Low → Medium → High → Whale → Kraken (`perfis.md`).
6. **Mapas de processo + árvore de funcionalidades** (Sub-admin PRODUTO): processo completo de conta e de reino → pontos de apoio do sistema → árvore de funcionalidades. Método: `produto/metodo-arvore-funcionalidades.md`.
7. **Especificação do sistema:** requisitos, modelo de dados, arquitetura.
