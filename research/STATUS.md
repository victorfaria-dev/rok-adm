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
5. **Guia F2P v1** (EN) e **guia de administração de reino v1**; depois deltas Low → Medium → High → Whale → Kraken (`perfis.md`).
6. **Especificação do sistema:** requisitos, modelo de dados, arquitetura.
