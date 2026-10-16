# Backlog do sistema (megahub)

Funcionalidades do produto, separadas da pesquisa. Ideias do Victor entram aqui direto como requisito; a pesquisa só é acionada quando um item depende de um dado do jogo ainda não confirmado (coluna "Depende de").

- Análise detalhada das ideias do Victor: `research/brainstorm/backlog-ideias.md`.
- Árvore completa (épicos, rastreabilidade, histórias de usuário, ranking, MVP e releases, grafo de dependências, jobs-to-be-done): `produto/arvore-funcionalidades.md`.
- Ficha de cada funcionalidade (critérios de aceite, métrica, entradas, integrações, risco de ToS/privacidade): `produto/arvore-funcionalidades-detalhe.md`.
- Mapas de processo: `produto/processos/conta.md`, `produto/processos/reino.md`. APIs: `produto/apis-integracoes.md`. 3D: `produto/ideias-3d.md`.

Atualizado em 2026-10-13: 89 funcionalidades (F-01..F-89), 5 áreas, 21 épicos.

## Colunas

- **Prioridade (dono)**: prioridade dada pelo Victor (só F-01..F-10). É decisão do dono e não foi alterada.
- **Score**: prioridade calculada pelo método = D × A × P ÷ E × Ev (dor, alcance, foco F2P/início de reino, esforço, evidência). Fórmula e faixas em `arvore-funcionalidades.md` §1. "hab." = habilitador de plataforma (herda a prioridade de quem depende dele).
- **Evidência**: forte / média / fraca / sem evidência.
- **Esf.**: S / M / L.
- **Release**: MVP, R1, R2, R3 (`arvore-funcionalidades.md` §6).
- **Risco ToS/priv.** (nova): nenhum / baixo / médio / alto. Motivo na ficha de detalhe.
- **Status** (agora é o status de construção, conferido no repositório em 2026-10-13):
  - `construindo`: há código ou conteúdo em `packages/`, `guides/` ou `content/`;
  - `backlog`: especificação suficiente, espera a release;
  - `especificar`: falta dado (T0, pesquisa), validação com usuários ou decisão do dono.

## Ideias do Victor (F-01..F-10)

Mantidas como decisões do dono. Onde a evidência é fraca, a árvore propõe um teste barato antes de construir (§7 da árvore); o item **não** sai do backlog.

| ID | Funcionalidade | Área / Épico | Módulo | Prioridade (dono) | Score | Evidência | Esf. | Depende de | Release | Risco ToS/priv. | Status |
|----|----------------|--------------|--------|-------------------|------:|-----------|------|------------|---------|-----------------|--------|
| F-01 | **Account Setup Questionnaire → Personalized Guide**: questionário de criação de conta (perfil de gasto, gasto acumulado, horas/dia, função, estágio do reino, civ, CH) → guia montado por blocos, com opções **Recommended** por perfil de gasto | Conta / E-C1 | M14 Guide Builder | alta | 9,0 | forte | M | F-51, F-02, F-50; F-52 (telas) | MVP | nenhum | construindo (lógica em `packages/core`) |
| F-02 | **F2P Base Guide + Spend Deltas**: guia F2P (base, dia 0 → KvK1) + deltas Low → Medium → High → Whale → Kraken (deltas agora são F-75, F-76, F-77) | Conta / E-C1 | M11 Guide Engine | alta | 9,0 | forte | M | F-50, F-51; T0 Q1, Q4, Q6, Q16 | MVP (F2P); deltas: ver F-75..F-77 | baixo | construindo (base F2P: 43 blocos) |
| F-03 | **Farm Guide** (guarda-chuva): variantes só onde os dados sustentam + transporte; entregue por F-65, F-66, F-67, F-71 | Farms / E-F1 | M11 / M13 | média | 7,2 | média (pares = hipótese) | S | F-65, F-66, F-67; T0 Q10, Q13; L-A13-01 | R1 | baixo | especificar |
| F-04 | **Farm Hub** (guarda-chuva): cadastro, metas diárias, checklist de 1 toque, total enviado, alerta de ociosa, declaração ao reino; entregue por F-68, F-69, F-70, F-89 (manual; sem automação) | Farms / E-F2 | M13 Farm Hub | média | 5,3 | forte | M | F-03; F-52 → F-53 (sync); teste 5 × 1 semana | R2 | baixo | especificar |
| F-05 | **Player Profile**: nome, governor ID opcional, civilização, função, perfil de gasto, aliança; privado por padrão | Identidade / E-I1 | M15 Identity | alta | 3,6 | média | M | F-53 (backend + autenticação) | R2 | baixo | backlog |
| F-06 | **Alliance Page & Leadership Verification**: página, membros, cargos R1–R5, tag, cor, brasão; verificação de liderança por código no anúncio da aliança | Identidade / E-I2 | M15 Identity | alta | 0,8 | **fraca** (sem evidência pública de branding de aliança) | L | F-05, F-53, F-55 (T0 do código), F-83 | R3, condicionada à validação (árvore §7) | baixo | especificar (validar) |
| F-07 | **Alliance-Aligned Avatar**: borda na cor da aliança, logo/brasão, tag | Identidade / E-I2 | M15 Identity | alta | 0,2 | **sem evidência** | M | F-05, F-06, F-08 | R3, condicionada à validação | baixo | especificar (validar) |
| F-08 | **In-Game Avatar PNG Export**: PNG pronto para o jogo (tamanho, recorte, área segura da moldura); primeiro para o card pessoal (F-10) | Identidade / E-I1 | M15 Identity | alta | 0,6 | **fraca** (upload custom não confirmado) | S | **T0 avatar** (5 perguntas da I-07; fora do protocolo atual) | R2, se o T0 confirmar | baixo | especificar (validar) |
| F-09 | **Crest Editor**: editor de brasão com arte original (sem assets da Lilith) | Identidade / E-I2 | M15 Identity | média | 0,2 | **sem evidência** | M | arte original; revisão visual | R3, condicionada à validação | baixo | especificar (validar) |
| F-10 | **Shareable Profile Card**: cartão compartilhável (Reddit/Discord) com civ (inclusive "do coração"), função, idade da conta, marcos; gerado no navegador, sem login | Identidade / E-I1 | M15 Identity | média | 6,7 | média | S | F-57; arte original | R1 | baixo | backlog |

## Funcionalidades da árvore (F-11+)

| ID | Funcionalidade | Área / Épico | Módulo | Score | Evidência | Esf. | Depende de | Release | Risco ToS/priv. | Status |
|----|----------------|--------------|--------|------:|-----------|------|------------|---------|-----------------|--------|
| F-11 | **First 30 Days Path**: 3–5 objetivos e 1 conceito por dia | Conta / E-C1 | M11/M14 | 8,4 | média | S | F-51, F-88; T0 Q4, Q9 | R1 | nenhum | backlog |
| F-12 | **New Kingdom Start Guide** (+ Day-1 Survival) | Conta / E-C1 | M11 | 10,5 | forte | S | F-51 | MVP | nenhum | construindo (14 blocos) |
| F-13 | **Zeroed Recovery Playbook + Risk Checklist** | Conta / E-C1 | M11 | 9,0 | forte | S | custos de escudo (lacuna) | R1 | nenhum | especificar |
| F-14 | **Budget Reality Check**: metas realistas por perfil de gasto | Conta / E-C1 | M14/M11 | 10,5 | forte | S | T0 Q1, Q12, Q16 | MVP (seção do F-01) | nenhum | construindo |
| F-15 | **Time-Boxed Routine** (+ Break Mode): "tenho 15/30/60 min" + "safe to skip" | Conta / E-C2 | M2 | 18,0 | forte | S | F-51; T0 §3 (minutos) | MVP | nenhum | construindo |
| F-16 | **Account Snapshot**: estado da conta preenchido uma vez, reutilizado (local-first) | Conta / E-C3 | M1/M6 | 7,2 | média | M | F-52; F-54 opcional | R1 | baixo | backlog |
| F-17 | **Next 3 Actions** | Conta / E-C3 | M1 | 7,2 | média | M | F-16, F-50, F-51; teste com 30 posts | R1 | nenhum | especificar |
| F-18 | **Milestone Benchmark** por idade do reino e perfil | Conta / E-C3 | M6 | 8,4 | média | S | T0 `kvk1-day0`, Q6; F-16 | R1 | nenhum | especificar |
| F-19 | **Restart vs Continue Decision Tree** | Conta / E-C3 | M1/M14 | 3,0 | média | S | F-50 | R2 | nenhum | backlog |
| F-20 | **Commander Decision Checklist** (+ Shelf-life por patch) | Conta / E-C3 | M5 | 9,0 | forte | S | F-50 | MVP | baixo | construindo |
| F-21 | **Gem & VIP Value Table** (+ Wheel guarantees) | Conta / E-C4 | M4 | 4,8 | média | S | T0 Q1, Q8, Q14; F-50, F-81 | R1 | nenhum | especificar |
| F-22 | **Healing Cost Calculator** | Conta / E-C4 | M4 | 3,8 | média | S | L-A08-01; F-50, F-81 | R1 | nenhum | especificar |
| F-23 | **Path-to-T4/T5 Planner** (CH e orçamento de aceleradores) | Conta / E-C3 | M4/M1 | 2,4 | média | M | T0 Q6, Q12; F-16 | R2 | nenhum | especificar |
| F-24 | **Kingdom Clock & Personal Event Calendar** (hora local, fim exato) | Conta / E-C5 | M3 | 4,5 | média | M | T0 Q4, Q5; F-52, F-86 | R1 | nenhum | backlog |
| F-25 | **Hoard Advisor** (regras por objetivo) | Conta / E-C5 | M3 | 6,0 | média | S | F-50; F-16 opcional | R1 | nenhum | backlog |
| F-26 | **KvK Readiness Checklist** (+ Season Explainer) | Conta / E-C5 | M11/M4 | 4,8 | média | S | F-50; T0 Q15 | R1 | nenhum | backlog |
| F-27 | **Hidden Lotus Planner** | Conta / E-C5 | M3/M1 | 3,0 | média | M | T0 Hidden Lotus (fora do protocolo) | R2 | nenhum | especificar |
| F-28 | **What Changed Since…** (patch timeline por data de parada) | Conta / E-C6 | M11 | 7,2 | forte | S | F-50 | R1 | baixo (médio se o pipeline editorial for automatizado) | backlog |
| F-29 | **Returner Mode** (plano de 14 dias; ficar/migrar/recomeçar) | Conta / E-C6 | M1/M14 | 7,2 | forte | M | F-28, F-31, F-16, F-17 | R2 | nenhum | backlog |
| F-30 | **My Requirements Tracker** | Conta / E-C7 | M6/M18 | 10,5 | forte | S | F-34 ou entrada manual; F-54 opcional | R1 | nenhum | backlog |
| F-31 | **Migration Eligibility & Passport Checker** (regras por patch) | Conta / E-C7 | M9/M18 | 14,4 | forte | S | F-50, F-81; notas 1.1.10–1.1.12 | R1 | nenhum | especificar |
| F-32 | **Play It Safe FAQ** (+ Account Safety) | Conta / E-C7 | M11 | 2,9 | média | S | F-56 | R1 | baixo | backlog |
| F-33 | **Kingdom Rules Page & Charter** | Reino / E-R1 | M16/M17 | 18,0 | forte | S | F-50, F-56, F-57, F-84; teste Google Doc com líderes | R1 | baixo | backlog |
| F-34 | **Requirements Card & Formula Sandbox** | Reino / E-R1 | M18 | 15,8 | forte | S | F-50; 15–20 fórmulas reais | R1 | nenhum | especificar |
| F-35 | **MGE Ledger** (+ applications) | Reino / E-R1 | M8/M17 | 9,6 | forte | S→M | F-53 (v1); teste em planilha | R2 | baixo | especificar |
| F-36 | **Decision Log & Pact Registry** | Reino / E-R1 | M17 | 5,8 | média | M | F-53, F-55, F-83 | R2 | médio | backlog |
| F-37 | **Data Intake** (import de exports, mapeamento, join por governor ID) | Reino / E-R2 | M19 | 7,2 | forte | M | **L-B08-01 ROK Toolkit**; F-56; F-53; decisão sobre arquivos de scanners | R2 | médio | especificar |
| F-38 | **DKP Sheet Doctor** (deltas, exceções, alt↔main, anomalias, tiers) | Reino / E-R2 | M7 | 7,2 | forte | M | F-37, F-34, F-89 | R2 | médio | backlog |
| F-39 | **Seed Simulator** | Reino / E-R2 | M18/M4 | 2,4 | média | S | F-50, F-81 | R3 | nenhum | backlog |
| F-40 | **Exit Notice Kit** (+ appeal, critério de Lost Kingdom) | Reino / E-R3 | M7 | 4,2 | forte | M | F-38, F-36 | R2 | médio | backlog |
| F-41 | **Migration Application Pipeline** | Reino / E-R3 | M9 | 2,4 | média | M | F-31, F-53, F-54 | R2 | médio | backlog |
| F-42 | **Open Roles Board** (+ recruitment post generator) | Reino / E-R4 | M16 | 7,7 | média | S | F-57, F-83 | R2 | baixo | backlog |
| F-43 | **Kingdom Directory** | Reino / E-R4 | M16 | 6,0 | forte | L | F-33, F-55, F-53, F-83; cold start | R3 | baixo | backlog |
| F-44 | **Availability & Role Roster** (slots UTC) | Reino / E-R5 | M7 | 2,4 | média | M | F-53; F-86; F-58 | R2 | baixo | backlog |
| F-45 | **Activity Definition & Check-in** (sem duplicar Quick Checks/Notes) | Reino / E-R5 | M7/M10 | 2,4 | média | S | — | R2 | médio | backlog |
| F-46 | **Leadership Weekly Cockpit** | Reino / E-R5 | M7 | 5,4 | forte | M | agrega F-33..F-45 | R3 | baixo | backlog |
| F-47 | **KvK Timeline Template** | Reino / E-R5 | M3 | 0,6 | fraca | S | verificar calendário oficial | — | nenhum | backlog (congelada) |
| F-48 | **Journey Timeline** | Identidade / E-I1 | M6/M15 | 2,9 | média | M | F-16, F-05 | R2 | baixo | backlog |
| F-49 | **Verified Official Channels** | Identidade / E-I2 | M15 | 1,5 | fraca | S | F-55, F-06 | R3 | nenhum | especificar |
| F-50 | **Rules & Formula Library** ("verified on patch X") | Plataforma / E-P1 | M18 | hab. (crítico) | — | M | pipeline `facts/` com patch/data | MVP (v0) → R1 | baixo | construindo (v0 em `packages/data`) |
| F-51 | **Content Block Engine** (blocos com tags) | Plataforma / E-P1 | M11/M14 | hab. | — | M | F-50 | MVP | nenhum | construindo |
| F-52 | **App Shell** (PWA, local-first, sem login) | Plataforma / E-P2 | — | hab. | — | M | identidade visual; F-85 | MVP | baixo | backlog (bloqueado pela identidade visual) |
| F-53 | **Accounts & Sync** (backend, auth, estado compartilhado) | Plataforma / E-P2 | — | hab. | — | M | F-52, F-56; primeiro backend = reino + sync de farms (decidido 2026-10-13) | R2 | médio | especificar |
| F-54 | **Own-Screenshot OCR** (só prints do próprio usuário) | Plataforma / E-P2 | M19 | hab. | — | M | T0: qualidade do OCR (fora do protocolo) | R2 | baixo | especificar |
| F-55 | **Verification Code** (código curto, sem URL) | Plataforma / E-P2 | M15 | hab. | — | S | T0: código no anúncio da aliança (fora do protocolo) | R1 (teste) → R2 | baixo | especificar |
| F-56 | **Trust & Privacy Center** (ToS, consentimento, opt-out, LGPD/GDPR) | Plataforma / E-P3 | — | hab. | — | S | revisão jurídica antes de cobrar | MVP | nenhum | construindo (`content/legal/`) |
| F-57 | **Share & Discovery Kit** (nunca link no chat do jogo) | Plataforma / E-P3 | — | hab. | — | S | — | MVP | baixo | construindo (`content/share/`) |
| F-58 | **Discord Companion Bot** | Plataforma / E-P4 | M10 | 2,4 | média | M | F-53, F-86 | R3 | baixo | backlog |
| F-59 | **Ask-with-Context Assistant** (Q&A com citações) | Plataforma / E-P4 | M12 | 4,2 | média | L | F-50 maduro, F-16; custo de LLM | R3 | baixo | especificar |
| F-60 | **3D Profile Card** (inclinação + brilho holográfico; **raridade v2 por City Hall**: Common CH1–16, Rare 17–21, Epic 22–24, Legendary 25; Verified por print, senão Self-reported; marca F2P Achiever) | Identidade / E-I1 | M15 | 3,4 | média | S | F-10; F-54 + T0 de OCR para o selo Verified | R1 (Self-reported); Verified no R2 | baixo | backlog (protótipo em `prototipos/`) |
| F-61 | **3D Alliance Crest** (brasão em relevo, exporta PNG) | Identidade / E-I2 | M15 | 0,2 | sem evidência | M | F-09, F-08; validação do §7 | junto do F-09 (R3 condicionada; R2 se o kit concierge passar) | baixo | especificar (protótipo em `prototipos/`) |
| F-62 | **Progress Tower** (torre 3D da conta por faixa de CH) | Conta / E-C3 | M1/M6 | 0,7 | sem evidência | M | F-16, F-18 | R3 | baixo | especificar |
| F-63 | **3D Landing Hero** (mesa de guerra original) | Plataforma / E-P3 | — | 0,2 | sem evidência | S–M | F-57; critérios de 3D | R1 opcional | baixo | backlog |
| F-64 | **KvK Planning Map 2.5D/3D** (mapa esquemático original; planejamento, não coordenação ao vivo) | Reino / E-R5 | M7 | 1,0 | fraca | L | ≥ 5 entrevistas com líderes; F-53 | R3 | médio (não copiar o mapa do jogo) | especificar |
| F-65 | **Farm Variant Picker** (0/1/2 farms; geral = padrão; recurso único = fraca; ouro = não para F2P até T0; par = oculto até T0) | Farms / E-F1 | M11/M13 | 7,2 | média | S | T0 Q10, Q13, L-A13-03 | R1 | baixo | especificar |
| F-66 | **Farm Setup Path** (civ; CH11 → CH17 → CH22; TP ≥ 15; Goldmine; comandante de coleta 37) | Farms / E-F1 | M11/M13 | 9,0 | forte | S | — | R1 | baixo | backlog |
| F-67 | **Trading Post Transfer Calculator** (taxa por nível, bruto a enviar, capacidade, proteção do armazém, viagens) | Farms / E-F1 | M4/M13 | 9,0 | forte | S | F-81; T0 Q10 só para ouro e capacidade L1–L24 | R1 | nenhum | backlog (tabela pronta em `packages/data`) |
| F-68 | **Farm Daily Targets & One-Tap Checklist** | Farms / E-F2 | M13 | 4,2 | média | M | F-52, F-15; teste 5 × 1 semana | R2 (teste local no R1) | nenhum | especificar |
| F-69 | **Farm-to-Main Shipment Ledger** (bruto/líquido, total vs meta de cura, resumo para o reino) | Farms / E-F2 | M13 | 5,0 | média | M | F-67, F-22 | R2 | nenhum | backlog |
| F-70 | **Idle Farm Reminder** (1 por farm por ciclo; silêncio; limite) | Farms / E-F2 | M13 | 2,1 | média | M | F-68, F-86 | R2 | nenhum | especificar |
| F-71 | **Farm ROI Calculator** (vale outra farm?) | Farms / E-F1 | M4/M13 | 3,6 | média | S | L-A13-01; F-67 | R2 | nenhum | especificar |
| F-72 | **Lifetime Spend Adjustment** (perfil efetivo) | Conta / E-C8 | M14 | 5,8 | média | S | F-01; limiares (decisão do Victor) | R1 | baixo | especificar |
| F-73 | **Pack Value Advisor** (gemas/$ e VIP/$; "pular" como padrão; sem link de compra) | Conta / E-C8 | M4 | 8,4 | média | S | **T0 Q16**; F-81; decisão 2 do Victor | R1 (se T0 Q16; senão R2) | baixo (ético: médio) | especificar |
| F-74 | **Monthly Spend Cap & Purchase Log** | Conta / E-C8 | M4/M6 | 2,9 | média | M | F-52; F-53 opcional | R2 | médio (dado financeiro pessoal) | especificar |
| F-75 | **Low Delta Guide** (pass-only / low pleno) | Conta / E-C8 | M11 | 3,6 | média | M | F-02, F-51; T0 Q16 | R1 (pass-only); R2 (low pleno) | nenhum | backlog |
| F-76 | **Medium Delta Guide** | Conta / E-C8 | M11 | 0,8 | média | M | pesquisa Medium | R2, após pesquisa | nenhum | especificar |
| F-77 | **High / Whale / Kraken Delta Guides** | Conta / E-C8 | M11 | 0,4 | média | M | pesquisa High+ | R3, após pesquisa | nenhum | especificar |
| F-78 | **Gold-Head Budget Projection** | Conta / E-C3 | M5/M4 | 3,6 | média | M | F-16, F-81; T0 renda de cabeças | R2 | nenhum | especificar |
| F-79 | **Day-0 → KvK1 Season Plan** (14 semanas; lacuna G7) | Conta / E-C3 | M1/M3 | 7,2 | média | M | F-16, F-18, F-23, F-24, F-25; T0 Q4, Q5, Q6 | R2 | nenhum | especificar |
| F-80 | **Event Rotation Forecast** (30–60 dias com probabilidade) | Conta / E-C5 | M3 | 1,3 | média | L | diário T0; registros opt-in; F-53 | R3 | baixo | especificar |
| F-81 | **Calculator Kit** (inventário compartilhado + selo de patch + offline; lacuna G2) | Plataforma / E-P1 | M4/M18 | hab. (herda 15,8) | — | M | F-16, F-50 | R1 | nenhum | especificar |
| F-82 | **Support Ticket & Report Builder** (texto para o canal oficial; nada guardado) | Conta / E-C7 | M11 | 2,9 | média | S | F-32 | R1 | baixo | backlog |
| F-83 | **Community Safety Baseline** (denúncia, moderação, sem DM, política de idade) | Plataforma / E-P3 | M15/M16 | hab. (herda 7,7) | — | M | F-56, F-53 | R2 (antes de qualquer conteúdo de usuário) | baixo | especificar |
| F-84 | **Multilingual Content & Docs (i18n)** | Plataforma / E-P3 | M11/M16 | hab. (herda 18,0) | — | M | F-51, F-88 | R1 (2ª língua) → R2 (sob demanda) | baixo | especificar |
| F-85 | **Accessibility & Performance Budget** (WCAG 2.2 AA, movimento reduzido, orçamento de JS) | Plataforma / E-P2 | — | hab. (herda 18,0) | — | S | F-52 | MVP (requisito das telas) | nenhum | especificar |
| F-86 | **Reminder Service** (ICS → feed ICS/Web Push → webhooks do Discord) | Plataforma / E-P4 | M3/M10 | hab. (herda 9,6) | — | M | F-52 (ICS); F-53 (push) | R1 (ICS) → R2 | baixo | especificar |
| F-87 | **"What This Game Actually Is" Primer** | Conta / E-C1 | M11/M14 | 2,4 | média | S | F-14, F-15, F-57 | R1 | nenhum | backlog |
| F-88 | **RoK Glossary & Concept Cards** | Conta / E-C1 | M11 | 7,2 | média | S | F-50 | R1 | nenhum | backlog |
| F-89 | **Alt↔Main Self-Declaration** (o dono declara as próprias farms com prova por código) | Farms / E-F2 | M13/M15 | 3,6 | média | M | F-55, F-53, F-54 | R2 | baixo | especificar |

## Resumo por status

| Status | Quantidade | IDs |
|---|---:|---|
| construindo | 10 | F-01, F-02, F-12, F-14, F-15, F-20, F-50, F-51, F-56, F-57 |
| backlog | 36 | F-05, F-10, F-11, F-16, F-19, F-24, F-25, F-26, F-28, F-29, F-30, F-32, F-33, F-36, F-38, F-39, F-40, F-41, F-42, F-43, F-44, F-45, F-46, F-47, F-48, F-52, F-58, F-60, F-63, F-66, F-67, F-69, F-75, F-82, F-87, F-88 |
| especificar | 43 | demais |

## Decisões do dono em aberto

1. **Primeiro backend:** estado compartilhado do reino (F-35/F-36/F-37 + sync de farms) ou identidade (I-06)? **Decidido (2026-10-13): reino + sync de farms.**
2. **F-73 Pack Value Advisor:** o hub compara valor por dólar de pacotes? Recomendação: sim, anti-FOMO, sem link de compra.
3. **F-37:** aceitar arquivos de scanners de terceiros com atestado e opt-out?
4. **F-84:** segunda língua (PT-BR é candidata; decidir pelo tráfego do MVP).
5. **F-72:** limiares do perfil efetivo.
6. **F-65:** manter oculta a hipótese do par alimento + madeira até o T0 (recomendação) ou publicar rotulada?
