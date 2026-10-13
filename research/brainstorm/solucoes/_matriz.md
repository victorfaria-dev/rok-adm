---
tipo: matriz-brainstorm
gerado_em: 2026-10-13
status: hipotese
cobertura: "D-0001..D-0044 (índice de jogadores final) + D-0500..D-0525 (líderes) = 70 dores, 34 fichas S-*"
---
# Brainstorm de soluções — matriz, ideias transversais e top 10

> **Tudo aqui é hipótese pré-pesquisa.** Cada ideia será comparada com fatos (`facts/`), testes T0 e entrevistas. Viáveis seguem; as outras são adaptadas ou refeitas.
> Restrições duras aplicadas em todas as fichas: sem bots/automação, sem ler arquivos/tráfego do jogo, sem credenciais, sem arte/marca Lilith, sem perfis de terceiros sem consentimento. Dados = entrada manual, print do próprio usuário (OCR nosso) ou arquivos exportados por ferramentas existentes.
> **Restrição de distribuição (nova, D-0022):** postar/pedir link de Discord no chat do jogo gera mute/ban ("third party information"). A descoberta do hub tem de acontecer **fora do chat do jogo** (Reddit, Discord, busca, YouTube); nenhuma feature pode depender de colar links no jogo. Códigos de verificação in-game devem ser curtos e sem URL (testar no T0 se não disparam o filtro).
> **Identidade (índice final):** evidência forte para identidade **pessoal** (skins ~118, showcases ~70, civilização ~102); **nenhuma evidência pública** para branding de aliança → ideias de aliança (I-06/F-06/F-07) tratadas como **não testadas**.

## Módulos

Existentes: M1 Account Planner · M2 Daily Checklist · M3 Event Calendar & Hoard Advisor · M4 Calculadoras · M5 Commander Path Planner · M6 Progress Tracker · M7 Kingdom Admin Suite · M8 MGE Rotation Manager · M9 Migration Screening · M10 Discord Bot · M11 Guide Engine · M12 Q&A (IA) · M13 Farm Hub · M14 Guide Builder · M15 Identity.

**Propostos neste brainstorm:**
| # | Módulo | Por quê |
|---|---|---|
| M16 | **Kingdom Page & Directory** | Página pública do reino (regras, requisitos, idioma, estilo, contatos verificados) que também alimenta um diretório para jogadores. Junta D-0518, D-0018/0037/0025, D-0508/0510, D-0513. |
| M17 | **Ledger** | Registro append-only de decisões e acordos (MGE, expurgos, regras, pactos, permissões). Legitimidade: D-0506, D-0507, D-0513, D-0521, D-0525, D-0514. |
| M18 | **Rules & Formula Library** | Fórmulas e regras versionadas e publicáveis (DKP, requisitos, MGE, seed, migração, custos). Serve calculadoras de jogador e regras de líder. |
| M19 | **Data Intake** | Um importador único: CSV/xlsx de scanners/exports, print próprio com OCR, mapeamento de colunas, join por governor ID. |

## Ideias transversais (resolvem muitas dores de uma vez)

| ID | Ideia | O que é | Dores atendidas | Premissa crítica |
|---|---|---|---|---|
| **X1** | **Account Snapshot** (um inventário, muitas ferramentas) | Modelo de dados único da conta do jogador (CH, pesquisas-chave, tropas, comandantes, speedups, gemas, cabeças, VIP, idade do reino, perfil de gasto, horas/dia), preenchido uma vez (manual/print próprio) e reutilizado por planner, calculadoras, benchmark, timeline, requisitos. Local-first (navegador), conta opcional. | D-0006, 0007, 0008, 0010, 0011, 0012, 0015, 0027, 0028, 0029, 0042, 0043, 0004, 0016 | Jogadores atualizam o snapshot com frequência suficiente; OCR do print próprio funciona bem (T0). |
| **X2** | **Rules-as-data + selo "verified on patch"** (M18) | Toda regra/fórmula/número vira dado versionado com fonte, data e patch; calculadoras e regras de reino leem daí; blocos "envelhecem" quando sai patch do domínio. | D-0031, 0032, 0010, 0012, 0019, 0509, 0501, 0502, 0505, 0520, 0009, 0013, 0016 | Pipeline `facts/` mantém patch/data por número; cadência de revisão sustentável. |
| **X3** | **Kingdom Clock** | Data de abertura do reino / início do KvK como âncora única: calendário pessoal, timeline de KvK, marcos por idade, eventos de início de reino, Hidden Lotus, hoard advisor. | D-0011, 0014, 0013, 0516, 0007, 0030, 0042, 0006 | Eventos/fases com offsets previsíveis desde a abertura (forte para KvK por história; **fraca** para rotação de eventos). |
| **X4** | **Ledger** (M17) | Log público/visível ao reino de decisões com regra aplicada, autor, data, evidência e direito de resposta. | D-0506, 0505, 0507, 0513, 0521, 0525, 0514, 0503, 0524 | Líderes aceitam transparência (o "fair MGE/DKP" dos anúncios sugere que os bons aceitam). |
| **X5** | **Requirements Card (ponte líder↔membro)** | Líder publica requisitos com fórmula (M18) → membros importam no tracker pessoal; migrantes comparam antes de mudar. Um artefato, três usos. | D-0501, 0502, 0004, 0005, 0508, 0518, 0037, 0507 | Reinos publicam requisitos; regras reais cabem em presets. |
| **X6** | **Verification Code primitive** | Hub gera código curto; o líder/jogador coloca no anúncio da aliança/descrição do perfil no jogo e envia print. Sem credenciais, sem links no jogo. | D-0515, 0514, 0518, 0508, 0513 (assinaturas), M15 (F-06), D-0522 (prova de farms) | **T0**: campo editável, visível em print, código não dispara filtro anti-"third party". |
| **X7** | **Content blocks com tags** (I-05) | Blocos de guia com `perfil`, `funcao`, `estagio_reino`, `horas_min`, `retornante`, `recommended_para` — montam guia, rotina, planner e farm hub. | D-0001, 0002, 0006, 0016, 0018, 0030, 0031, 0003, 0041, 0020 | Blocos suficientemente granulares; manutenção por patch. |
| **X8** | **Budget & Time lens** | Todo output parametrizado por perfil de gasto **e** minutos/dia; seção "safe to skip" padrão. | D-0001, 0002, 0026, 0034, 0010, 0020, 0008 | Dá para estimar renda (gemas/cabeças/speedups) por perfil (A04/A05/A06/A12 + diário T0). |

**Mais forte:** **X2 Rules-as-data (M18)** — é a única peça que sustenta ao mesmo tempo as calculadoras de jogador, as regras/fórmulas de reino e o argumento de confiança ("verificado no patch X"), que o mapa de concorrência aponta como lacuna (G2, G5, G8). **X1 Account Snapshot** é a segunda: é o que torna o planner (G1, diferencial central) possível sem redigitar dados.

## Matriz dor → ideia recomendada → módulo

Legenda: G = gravidade (A/M/B), F = frequência do coletor (escalas diferentes entre jogadores e líderes — não comparar diretamente). Esf = esforço da ideia recomendada.

### Jogadores (D-0001…D-0044)
| Dor | Resumo | G/F | Ficha | Ideia recomendada | Módulo | Esf |
|---|---|---|---|---|---|---|
| D-0001 | Abismo P2W | A/286 | S-D-0001 | Budget Reality Check | M14/M11 | S |
| D-0002 | Segundo emprego | A/152 | S-D-0002 | Time-Boxed Routine | M2 | S |
| D-0003 | Ser zerado | A/139 | S-D-0003 | Zeroed Recovery Playbook + Risk Checklist | M11 | S |
| D-0004 | Coerção/cotas do reino | A/110 | S-D-0004 | My Requirements Tracker | M6/M18 | S |
| D-0005 | Kick por offline | M/25 | S-D-0004 | My Requirements Tracker (+ Alliance Schedule Match) | M6/M11 | S |
| D-0006 | O que fazer agora | M/196 | S-D-0006 | Next 3 Actions | M1 | M |
| D-0007 | Estou no caminho? | M/166 | S-D-0007 | Milestone Benchmark por idade do reino | M6 | S |
| D-0008 | Comandante errado | A/159 | S-D-0008 | Commander Decision Checklist + Shelf-life | M5 | S |
| D-0009 | Power creep | M/20 | S-D-0008 | Shelf-life tag (mesma ideia) | M5 | S |
| D-0010 | Onde gastar gemas | M/144 | S-D-0010 | Gem Value Table | M4 | S |
| D-0011 | Usar vs guardar speedups | B/46 | S-D-0011 | Hoard Advisor por regras | M3 | S–M |
| D-0012 | Preparação KvK | M/124 | S-D-0012 | Healing Cost Calculator (+ Readiness Checklist) | M4 | S |
| D-0013 | Mecânicas de temporada | B/22 | S-D-0012 | Kingdom Lifecycle Explainer | M11 | M |
| D-0014 | Janelas/fuso | M/37 | S-D-0011 | Personal Event Calendar (horário exato de fim) | M3 | M |
| D-0015 | Recomeçar ou continuar | M/105 | S-D-0015 | Restart vs Continue Decision Tree | M1/M14 | S–M |
| D-0016 | Retornante | M/209 | S-D-0016 | What changed since… (+ Returner Mode) | M11 | S |
| D-0017 | Conta perdida | A/85 | S-D-0016 | Account Safety Checklist | M11 | S |
| D-0018 | Reinos novos dominados | A/154 | S-D-0018 | New Kingdom Start Guide por estratégia | M11 | S |
| D-0019 | Migrar é difícil | M/112 | S-D-0509 | Migration Eligibility & Passport Checker | M9/M18 | S |
| D-0020 | Farms trabalhosas | M/163 | S-D-0020 | Farm Board (manual, 1 toque) | M13 | S–M |
| D-0021 | Bots/cheaters impunes | M/137 | S-D-0021 | Play it safe FAQ (fora de escopo, só info) | M11 | S |
| D-0022 | Bans/mutes opacos | M/14 | S-D-0021 | Play it safe FAQ | M11 | S |
| D-0023 | Suporte ruim | M/93 | S-D-0021 | Modelo de ticket (FAQ) | M11 | S |
| D-0024 | Chat tóxico/menores | A/65 | S-D-0021 | Normas seguras no próprio hub | M15/M16 | M |
| D-0025 | Barreira de idioma | M/24 | S-D-0018 | Filtro de idioma + tradução de regras | M16 | S |
| D-0026 | Burnout/dano real | A/130 | S-D-0002 | Time-Boxed Routine + Break Mode | M2 | S |
| D-0027 | Timers longos | M/49 | S-D-0027 | Path-to-T5 Planner | M4 | S–M |
| D-0028 | Custo de cura KvK | M/37 | S-D-0012 | Healing Cost Calculator | M4 | S |
| D-0029 | Cabeças escassas | M/7 | S-D-0008 | Gold-Head Budget Projection | M5/M4 | M |
| D-0030 | Onboarding | M/62 | S-D-0006 | First 30 Days Path | M11/M14 | S–M |
| D-0031 | Conselho desatualizado | M/26 | S-D-0031 | "Verified on patch X" em tudo | M11 | S |
| D-0032 | Calculadoras ruins | B/23 | S-D-0031 | Calculator Suite mobile-first | M4 | M |
| D-0033 | RNG/rodas | M/45 | S-D-0010 | Wheel Guarantee Calculator | M4 | S |
| D-0034 | FOMO/pressão de gasto | M/42 | S-D-0010 | Budget & Bundle Guard | M4/M6 | M |
| D-0035 | Anúncios enganosos | B/54 | S-D-0021 | "What this game actually is" | M11/M14 | S |
| D-0036 | Sair do jogo | B/125 | S-D-0002 | Break Mode / estacionar conta (sem venda) | M2/M11 | S |
| D-0037 | Reino casual/F2P | M/89 | S-D-0018 | Kingdom Directory com tags | M16 | M–L |
| D-0038 | Civilização ausente | B/102 | S-D-0038 | Personal Profile Card com motivo de civ | M15 | S |
| D-0039 | Crashes | M/73 | S-D-0021 | Fora de escopo | — | — |
| D-0040 | Oficiais esgotados | M/2 | S-D-0519 | Leadership Weekly Cockpit | M7 | S |
| D-0041 | Novato atacado | A/15 | S-D-0003 | Day-1 Survival (no playbook) | M11 | S |
| D-0042 | Skins de prestígio | M/118 | S-D-0042 | Hidden Lotus Day-by-Day Planner | M3/M1 | M |
| D-0043 | Mostrar jornada | B/70 | S-D-0007 | Journey Timeline compartilhável | M6/M15 | M |
| D-0044 | Customização | B/15 | S-D-0038 | Personal Profile Card | M15 | S |

### Líderes (D-0500…D-0525)
| Dor | Resumo | G/F | Ficha | Ideia recomendada | Módulo | Esf |
|---|---|---|---|---|---|---|
| D-0500 | DKP manual | A/9 | S-D-0500 | DKP Sheet Doctor (import, sem scan) | M7/M19 | M |
| D-0501 | Requisitos justos | A/11 | S-D-0501 | Requirements Card + Formula Sandbox | M18 | S |
| D-0502 | DKP ignora não-kill | M/5 | S-D-0501 | Pesos de honra/fortes/rallies na fórmula | M18 | S–M |
| D-0503 | Dados manipuláveis | M/7 | S-D-0500 | Flags de anomalia + trilha de auditoria | M7/M17 | M |
| D-0504 | Coleta frágil/ToS | M/6 | S-D-0500 | Import-first (não escanear) | M19 | M |
| D-0505 | Impor MGE fixo | A/6 | S-D-0505 | MGE Ledger (+ rule-breaker log) | M8/M17 | S |
| D-0506 | MGE "hoarding" | A/10 | S-D-0505 | MGE Ledger público | M8/M17 | S |
| D-0507 | Expurgos pós-KvK | A/13 | S-D-0507 | Exit Notice Kit | M7 | S–M |
| D-0508 | Triagem de migrantes | M/8 | S-D-0508 | Migration Application Form c/ checagem | M9 | M |
| D-0509 | Regras de migração | M/6 | S-D-0509 | Migration Eligibility Checker | M9/M18 | S |
| D-0510 | Recrutar papéis | M/14 | S-D-0508 | Recruitment Post Generator → Open Roles | M16 | S |
| D-0511 | Inativos | M/6 | S-D-0511 | Activity Definition + Check-in | M7/M10 | S |
| D-0512 | Atividade contestada | M/3 | S-D-0511 | Activity Definition + Check-in | M7/M10 | S |
| D-0513 | Guerra civil | A/19 | S-D-0513 | Kingdom Charter | M16/M17 | S |
| D-0514 | Sabotagem interna | A/7 | S-D-0514 | Officer Trust Ledger (2ª) / Verified Channels | M15/M17 | S |
| D-0515 | Golpistas imitando líder | M/4 | S-D-0514 | Verified Official Channels (sem link no jogo) | M15 | S |
| D-0516 | Timeline de KvK | M/9 | S-D-0516 | KvK Timeline Template ancorado | M3 | S |
| D-0517 | Inscrições AoO/KvK | M/5 | S-D-0517 | Signup Sheet Import → Availability Roster | M7 | S→M |
| D-0518 | Regras invisíveis | M/6 | S-D-0518 | Kingdom Rules Page | M16 | S |
| D-0519 | Liderança = 2º emprego | A/5 | S-D-0519 | Leadership Weekly Cockpit | M7 | S |
| D-0520 | Gerir seed | A/6 | S-D-0520 | Seed Simulator | M18/M4 | S |
| D-0521 | Coerção entre alianças | M/6 | S-D-0513 | Pact Registry | M17 | S–M |
| D-0522 | Farms/alts distorcem | M/6 | S-D-0500 | Alt↔Main Self-Declaration | M15/M7 | M |
| D-0523 | Fila de títulos | B/3 | S-D-0523 | Title Request Queue (não priorizar) | M10 | S |
| D-0524 | Quem entra no LK | M/2 | S-D-0507 | LK Roster Criteria | M7/M18 | S |
| D-0525 | Legitimidade | M/8 | S-D-0513 | Public Decision Log & Reputation | M17/M16 | M |

## Top 10 (hipóteses pré-pesquisa)

**Método:** score = peso da gravidade (alta 3, média 2, baixa 1) × faixa de frequência × simplicidade (S 3, M 2, L 1). Faixa de frequência calculada **dentro de cada coletor** porque as escalas diferem: jogadores ≥100 → 3, 30–99 → 2, <30 → 1; líderes ≥10 → 3, 5–9 → 2, <5 → 1. Empates desfeitos pela soma dos scores dos índices das dores cobertas e pela amplitude (nº de dores). Máximo = 27.

| # | Ideia | Ficha | Dores | Score | Por que está aqui | Hipótese que mais pode quebrar |
|---|---|---|---|---|---|---|
| 1 | **Time-Boxed Routine** ("tenho 15/30/60 min") + Break Mode | S-D-0002 | D-0002, D-0026, D-0036 (+D-0020) | 27 | Duas dores altas (score índice 456 + 390); lista parametrizada sem backend | Existe ranking defensável de valor/minuto (precisa cronometragem T0) |
| 2 | **Budget Reality Check** (metas realistas por perfil de gasto) | S-D-0001 | D-0001 (+D-0034, D-0018) | 27 | Dor nº 1 dos jogadores (858); alimenta o Guide Builder | Renda por perfil (gemas/cabeças/speedups) estimável com confiança |
| 3 | **Commander Decision Checklist + Shelf-life** | S-D-0008 | D-0008, D-0009, D-0029 | 27 | Decisão irreversível e escassa (477); diferencia de tier lists por data e "esperar" | Consenso T3 suficiente para etiquetar vida útil |
| 4 | **New Kingdom Start Guide por estratégia** | S-D-0018 | D-0018 (+D-0037) | 27 | 462 de score; só conteúdo | Regras pós-Beginner's Immigration conhecidas e estáveis |
| 5 | **Zeroed Recovery Playbook + Day-1 Survival** | S-D-0003 | D-0003, D-0041 | 27 | Gravidade alta e gatilho de abandono (417 + 45) | Parcela relevante das zeragens é evitável (sono sem escudo) vs política |
| 6 | **Requirements Card ↔ My Requirements Tracker** (ponte X5) | S-D-0501 + S-D-0004 | D-0501, D-0502, D-0004, D-0005 | 27 | Mesmo artefato serve líder (#3 dos líderes) e membro (330); cria efeito de rede | Regras reais cabem em presets; líderes aceitam publicar |
| 7 | **Kingdom Charter** | S-D-0513 | D-0513, D-0525 (+D-0521) | 27 | Maior score dos líderes (57); testável como Google Doc antes de código | Conflitos nascem de ambiguidade e não só de poder; R5 rivais assinam |
| 8 | **MGE Ledger público** | S-D-0505 | D-0506, D-0505 | 27 | CRUD simples; transforma acusação em fato checável | Reinos "fair MGE" expõem histórico de verdade |
| 9 | **What changed since… + Returner Mode** | S-D-0016 | D-0016, D-0017 (+D-0019) | 18 | Segmento grande e mal atendido (≈270 posts, 418); reaproveita patch timeline existente | Patch timeline cobre 2–3 anos com datas suficientes |
| 10 | **Gem Value Table** (+ Wheel Guarantee) | S-D-0010 | D-0010, D-0033, D-0034 | 18 | Pergunta F2P recorrente (288); 1 tabela | Equivalência gema↔speedup defensável e explicável |

**Logo abaixo (score 18):** Healing Cost Calculator (S-D-0012), Migration Eligibility Checker (S-D-0509, serve jogador e líder), Seed Simulator (S-D-0520), Hidden Lotus Planner (S-D-0042, alta intenção, M).
**Exceções estratégicas (score menor, mas importantes):** **Next 3 Actions** (S-D-0006, score 12 só por ser M — é o MVP do diferencial G1 e deve entrar logo após o Guide Builder); **DKP Sheet Doctor** (S-D-0500, 12 — base de dados de toda a camada de reino, mercado lotado).

**Leitura do top 10:** 6 de 10 são **conteúdo estruturado + filtro** (sem backend) → o MVP natural é Guide Engine/Builder (M11/M14) com calculadoras pontuais, como `megahub-v0` previa. Na camada de reino, o top é **transparência** (Charter, Ledger, Requirements Card), não cálculo — o cálculo de DKP é a área mais disputada por concorrentes.

## Premissas com maior chance de quebrar

1. **Rotação de eventos previsível** (Hoard Advisor com datas, forecast, calendário) — fontes T3 dizem que eventos são imprevisíveis. Mitigação: regras de reserva por objetivo, sem datas.
2. **Líderes aceitam transparência** (publicar fórmula, MGE ledger, charter, decision log). Bons líderes talvez; os que geram as dores (D-0004, D-0525) não aderem → o produto vira sinal de seleção, não cura.
3. **Usuários mantêm dados manuais** (snapshot, farm board, check-in, timeline). Fricção é o maior risco de M1/M6/M13.
4. **Renda e custos estimáveis por perfil** (gemas, cabeças, speedups, cura) sem dataset — depende de fichas A04–A12 e do diário T0.
5. **T0 de identidade/verificação**: avatar custom aceito (recorte, tamanho, moderação) e código de verificação no anúncio da aliança sem disparar o filtro anti-"third party".
6. **Distribuição**: o hub não pode ser divulgado no chat do jogo (D-0022) — aquisição depende de Reddit/Discord/busca; as ideias com efeito de rede (Directory, Open Roles, Formula Gallery) sofrem cold start.
7. **Export oficial de stats existe** (C02-0016, baixa confiança) — sem ele, DKP depende de scanners de terceiros (risco ToS deles, reputacional nosso).
8. **Branding de aliança** como vetor de crescimento (I-06) — sem evidência pública; construir backend de Identity por isso é aposta.
9. **Absorção pela Lilith** (rosters, Notes, Quick Checks, títulos, LK roster) — features de reino puramente "in-game-like" podem morrer.

## Cobertura

- **Cobertas (70/70):** D-0001…D-0044 (índice final de jogadores, todas) e D-0500…D-0525 (todas).
- **Não cobertas:** nenhuma. Fora de escopo declarado (só informação): D-0021, D-0023, D-0039 (e parcialmente D-0017, D-0024).
- **Fichas:** S-D-0001, 0002, 0003, 0004, 0006, 0007, 0008, 0010, 0011, 0012, 0015, 0016, 0018, 0020, 0021, 0027, 0031, 0038, 0042 (jogadores); S-D-0500, 0501, 0505, 0507, 0508, 0509, 0511, 0513, 0514, 0516, 0517, 0518, 0519, 0520, 0523 (líderes).

## Próximos testes baratos sugeridos (antes de construir)

- Rodar a árvore do Next 3 Actions em 30 posts "what next?" e comparar com a resposta mais votada.
- Cronometrar 1 semana de tarefas diárias na conta T0 (valida a Time-Boxed Routine).
- Classificar 19 relatos de guerra civil por causa (ambiguidade vs tomada de poder) → valida Charter.
- Classificar 15–20 fórmulas reais de DKP/requisito em presets → valida Requirements Card.
- T0: avatar custom, código no anúncio da aliança, print do próprio perfil (KP/mortes) + OCR.
- Mostrar MGE Ledger e Charter (como Google Doc/Sheet) a 3–5 líderes; perguntar se publicariam.
