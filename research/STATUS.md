# Status do projeto (painel do administrador)

Atualizado: 2026-10-13

## Frentes em execução (subagentes)

| # | Frente | Domínios | Saída | Status |
|---|--------|----------|-------|--------|
| W1 | Mecânicas F2P (piloto) | A01, A04, A05, A09, A10, A14 | `raw/A-pilot/`, `facts/A0x/` | em execução |
| W2 | Estratégia F2P / início de reino | A02, A06, A07, A08, A11, B01 | `raw/A-strategy/`, `facts/` (IDs ≥0500) | em execução |
| W3 | Dores — jogadores | C03 | `pains/D-0001..0499`, `raw/pains-players/` | em execução |
| W4 | Dores — líderes + administração | B01–B09, C03 | `pains/D-0500..0999`, `facts/B0x/`, `raw/pains-leaders/` | em execução |
| W5 | Concorrência e ToS | C01, C02 | `facts/C01-C02/`, `context/competitors-and-constraints.md` | em execução |
| W6 | Economia, coleta, farms, gasto | A03, A12, A13 | `raw/A-economy/`, `facts/A03,A12,A13/` | em execução |
| W7 | Histórico de patches / estado atual | C04 | `facts/C04/`, `context/game-state-and-patch-timeline.md` | em execução |

## Próximas ondas (disparadas quando a anterior terminar)

1. **Integração:** consolidar `_sources.md` → `fontes.md`; resolver conflitos de IDs; consolidar índices.
2. **Verificação adversarial:** um verificador por grupo de domínios, cruzando com W7 (obsolescência).
3. **Síntese de dores:** ranking único jogadores + líderes → escolha do MVP do megahub (`brainstorm/`).
4. **Context packs:** `context/` por tema.
5. **Guia F2P v1** (EN) e **guia de administração de reino v1**.
6. **Especificação do sistema:** requisitos, modelo de dados, arquitetura.
