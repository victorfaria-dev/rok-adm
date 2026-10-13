# Backlog do sistema (megahub)

Funcionalidades do produto, separadas da pesquisa. Ideias do Victor entram aqui direto como requisito; a pesquisa só é acionada quando um item depende de um dado do jogo ainda não confirmado (coluna "Depende de").

- Análise detalhada das ideias do Victor: `research/brainstorm/backlog-ideias.md`.
- Árvore completa (épicos, rastreabilidade, histórias de usuário, MVP e releases): `produto/arvore-funcionalidades.md`.
- Mapas de processo: `produto/processos/conta.md`, `produto/processos/reino.md`.

## Colunas

- **Prioridade (dono)**: prioridade dada pelo Victor (só F-01..F-10). É decisão do dono e não foi alterada.
- **Score**: prioridade calculada pelo método = D × A × P ÷ E × Ev (dor, alcance, foco F2P/início de reino, esforço, evidência). Fórmula e faixas em `arvore-funcionalidades.md` §1. "hab." = habilitador de plataforma (herda a prioridade de quem depende dele).
- **Evidência**: forte / média / fraca / sem evidência.
- **Esf.**: S / M / L.
- **Release**: MVP, R1, R2, R3 (`arvore-funcionalidades.md` §6).

## Ideias do Victor (F-01..F-10)

Mantidas como decisões do dono. Onde a evidência é fraca, a árvore propõe um teste barato antes de construir (§7 da árvore); o item **não** sai do backlog.

| ID | Funcionalidade | Área / Épico | Módulo | Prioridade (dono) | Score | Evidência | Esf. | Depende de | Release | Status |
|----|----------------|--------------|--------|-------------------|------:|-----------|------|------------|---------|--------|
| F-01 | **Account Setup Questionnaire → Personalized Guide**: questionário de criação de conta (perfil de gasto, gasto acumulado, horas/dia, função, estágio do reino, civ, CH) → guia montado por blocos, com opções **Recommended** por perfil de gasto | Conta / E-C1 | M14 Guide Builder | alta | 9,0 | forte | M | F-51, F-02, F-50 | MVP | especificar |
| F-02 | **F2P Base Guide + Spend Deltas**: guia F2P (base, dia 0 → KvK1) + deltas Low → Medium → High → Whale → Kraken | Conta / E-C1 | M11 Guide Engine | alta | 9,0 | forte | M (F2P + Low); M por delta Medium+ | F-50, F-51; T0 Q1, Q4, Q6, Q16; pesquisa Medium+ | MVP (F2P), R2 (Low/Medium), R3 (High+) | em pesquisa |
| F-03 | **Farm Guide**: farm geral, de recurso único e de pares (só os que os dados sustentarem) + calculadora de transferência (taxa, capacidade, proteção do armazém) | Farms / E-F1 | M11 / M13 | média | 7,2 | média (pares = hipótese) | S | T0 Q10, Q13; L-A13-01 (rendimento/dia) | R1 | em pesquisa |
| F-04 | **Farm Hub**: cadastro de farms, metas diárias, checklist de 1 toque, total enviado à principal, alerta de farm ociosa (manual; sem automação) | Farms / E-F2 | M13 Farm Hub | média | 5,3 | forte | M | F-03; F-52 → F-53 (sync) | R2 | backlog |
| F-05 | **Player Profile**: nome, governor ID opcional, civilização, função, perfil de gasto, aliança; privado por padrão | Identidade / E-I1 | M15 Identity | alta | 3,6 | média | M | F-53 (backend + autenticação) | R2 | backlog |
| F-06 | **Alliance Page & Leadership Verification**: página, membros, cargos R1–R5, tag, cor, brasão; verificação de liderança por código no anúncio da aliança | Identidade / E-I2 | M15 Identity | alta | 0,8 | **fraca** (sem evidência pública de branding de aliança) | L | F-05, F-53, F-55 (T0 do código) | R3, condicionada à validação (árvore §7) | backlog — validar |
| F-07 | **Alliance-Aligned Avatar**: borda na cor da aliança, logo/brasão, tag | Identidade / E-I2 | M15 Identity | alta | 0,2 | **sem evidência** | M | F-05, F-06, F-08 | R3, condicionada à validação | backlog — validar |
| F-08 | **In-Game Avatar PNG Export**: PNG pronto para o jogo (tamanho, recorte, área segura da moldura); primeiro para o card pessoal (F-10) | Identidade / E-I1 | M15 Identity | alta | 0,6 | **fraca** (upload custom não confirmado) | S | **T0 avatar** (5 perguntas da I-07; fora do protocolo atual) | R2, se o T0 confirmar | backlog — validar |
| F-09 | **Crest Editor**: editor de brasão com arte original (sem assets da Lilith) | Identidade / E-I2 | M15 Identity | média | 0,2 | **sem evidência** | M | arte original; revisão visual | R3, condicionada à validação | backlog — validar |
| F-10 | **Shareable Profile Card**: cartão compartilhável (Reddit/Discord) com civ (inclusive "do coração"), função, idade da conta, marcos; gerado no navegador, sem login | Identidade / E-I1 | M15 Identity | média | 6,7 | média | S | F-57; arte original | R1 | backlog |

## Funcionalidades da árvore (F-11+)

| ID | Funcionalidade | Área / Épico | Módulo | Score | Evidência | Esf. | Depende de | Release | Status |
|----|----------------|--------------|--------|------:|-----------|------|------------|---------|--------|
| F-11 | **First 30 Days Path**: 3–5 objetivos e 1 conceito por dia | Conta / E-C1 | M11/M14 | 8,4 | média | S | F-51; T0 Q4, Q9 | R1 | backlog |
| F-12 | **New Kingdom Start Guide** (+ Day-1 Survival) | Conta / E-C1 | M11 | 10,5 | forte | S | F-51 | MVP | backlog |
| F-13 | **Zeroed Recovery Playbook + Risk Checklist** | Conta / E-C1 | M11 | 9,0 | forte | S | custos de escudo (lacuna) | R1 | backlog |
| F-14 | **Budget Reality Check**: metas realistas por perfil de gasto | Conta / E-C1 | M14/M11 | 10,5 | forte | S | T0 Q1, Q12, Q16 | MVP (seção do F-01) | backlog |
| F-15 | **Time-Boxed Routine** (+ Break Mode): "tenho 15/30/60 min" + "safe to skip" | Conta / E-C2 | M2 | 18,0 | forte | S | F-51; T0 §3 (minutos) | MVP | backlog |
| F-16 | **Account Snapshot**: estado da conta preenchido uma vez, reutilizado (local-first) | Conta / E-C3 | M1/M6 | 7,2 | média | M | F-52; F-54 opcional | R1 | backlog |
| F-17 | **Next 3 Actions** | Conta / E-C3 | M1 | 7,2 | média | M | F-16, F-50, F-51 | R1 | backlog |
| F-18 | **Milestone Benchmark** por idade do reino e perfil | Conta / E-C3 | M6 | 8,4 | média | S | T0 `kvk1-day0`, Q6; F-16 | R1 | backlog |
| F-19 | **Restart vs Continue Decision Tree** | Conta / E-C3 | M1/M14 | 3,0 | média | S | F-50 | R2 | backlog |
| F-20 | **Commander Decision Checklist** (+ Shelf-life por patch) | Conta / E-C3 | M5 | 9,0 | forte | S | F-50 | MVP | backlog |
| F-21 | **Gem & VIP Value Table** (+ Wheel guarantees) | Conta / E-C4 | M4 | 4,8 | média | S | T0 Q1, Q8, Q14; F-50 | R1 | backlog |
| F-22 | **Healing Cost Calculator** | Conta / E-C4 | M4 | 3,8 | média | S | L-A08-01; F-50 | R1 | backlog |
| F-23 | **Path-to-T4/T5 Planner** (CH e orçamento de aceleradores) | Conta / E-C3 | M4/M1 | 2,4 | média | M | T0 Q6, Q12; F-16 | R2 | backlog |
| F-24 | **Kingdom Clock & Personal Event Calendar** (hora local, fim exato) | Conta / E-C5 | M3 | 4,5 | média | M | T0 Q4, Q5; F-52 | R1 | backlog |
| F-25 | **Hoard Advisor** (regras por objetivo) | Conta / E-C5 | M3 | 6,0 | média | S | F-50; F-16 opcional | R1 | backlog |
| F-26 | **KvK Readiness Checklist** (+ Season Explainer) | Conta / E-C5 | M11/M4 | 4,8 | média | S | F-50; T0 Q15 | R1 | backlog |
| F-27 | **Hidden Lotus Planner** | Conta / E-C5 | M3/M1 | 3,0 | média | M | T0 Hidden Lotus (fora do protocolo) | R2 | backlog |
| F-28 | **What Changed Since…** (patch timeline por data de parada) | Conta / E-C6 | M11 | 7,2 | forte | S | F-50 | R1 | backlog |
| F-29 | **Returner Mode** (plano de 14 dias; ficar/migrar/recomeçar) | Conta / E-C6 | M1/M14 | 7,2 | forte | M | F-28, F-31, F-16, F-17 | R2 | backlog |
| F-30 | **My Requirements Tracker** | Conta / E-C7 | M6/M18 | 10,5 | forte | S | F-34 ou entrada manual; F-54 opcional | R1 | backlog |
| F-31 | **Migration Eligibility & Passport Checker** (regras por patch) | Conta / E-C7 | M9/M18 | 14,4 | forte | S | F-50; notas 1.1.10–1.1.12 | R1 | backlog |
| F-32 | **Play It Safe FAQ** (+ Account Safety) | Conta / E-C7 | M11 | 2,9 | média | S | F-56 | R1 | backlog |
| F-33 | **Kingdom Rules Page & Charter** | Reino / E-R1 | M16/M17 | 18,0 | forte | S | F-50, F-56, F-57; teste Google Doc com líderes | R1 | backlog |
| F-34 | **Requirements Card & Formula Sandbox** | Reino / E-R1 | M18 | 15,8 | forte | S | F-50; 15–20 fórmulas reais | R1 | backlog |
| F-35 | **MGE Ledger** (+ applications) | Reino / E-R1 | M8/M17 | 9,6 | forte | S→M | F-53 (v1); teste em planilha | R2 | backlog |
| F-36 | **Decision Log & Pact Registry** | Reino / E-R1 | M17 | 5,8 | média | M | F-53, F-55 | R2 | backlog |
| F-37 | **Data Intake** (import de exports, mapeamento, join por governor ID) | Reino / E-R2 | M19 | 7,2 | forte | M | **L-B08-01 ROK Toolkit**; F-56; F-53 | R2 | backlog |
| F-38 | **DKP Sheet Doctor** (deltas, exceções, alt↔main, anomalias, tiers) | Reino / E-R2 | M7 | 7,2 | forte | M | F-37, F-34 | R2 | backlog |
| F-39 | **Seed Simulator** | Reino / E-R2 | M18/M4 | 2,4 | média | S | F-50 | R3 | backlog |
| F-40 | **Exit Notice Kit** (+ appeal, critério de Lost Kingdom) | Reino / E-R3 | M7 | 4,2 | forte | M | F-38, F-36 | R2 | backlog |
| F-41 | **Migration Application Pipeline** | Reino / E-R3 | M9 | 2,4 | média | M | F-31, F-53, F-54 | R2 | backlog |
| F-42 | **Open Roles Board** (+ recruitment post generator) | Reino / E-R4 | M16 | 7,7 | média | S | F-57 | R2 | backlog |
| F-43 | **Kingdom Directory** | Reino / E-R4 | M16 | 6,0 | forte | L | F-33, F-55, F-53; moderação; cold start | R3 | backlog |
| F-44 | **Availability & Role Roster** (slots UTC) | Reino / E-R5 | M7 | 2,4 | média | M | F-53; F-58 | R2 | backlog |
| F-45 | **Activity Definition & Check-in** (sem duplicar Quick Checks/Notes) | Reino / E-R5 | M7/M10 | 2,4 | média | S | — | R2 | backlog |
| F-46 | **Leadership Weekly Cockpit** | Reino / E-R5 | M7 | 5,4 | forte | M | agrega F-33..F-45 | R3 | backlog |
| F-47 | **KvK Timeline Template** | Reino / E-R5 | M3 | 0,6 | fraca | S | verificar calendário oficial | — | congelada |
| F-48 | **Journey Timeline** | Identidade / E-I1 | M6/M15 | 2,9 | média | M | F-16, F-05 | R2 | backlog |
| F-49 | **Verified Official Channels** | Identidade / E-I2 | M15 | 1,5 | fraca | S | F-55, F-06 | R3 | backlog |
| F-50 | **Rules & Formula Library** ("verified on patch X") | Plataforma / E-P1 | M18 | hab. (crítico) | — | M | pipeline `facts/` com patch/data | MVP (v0) → R1 | backlog |
| F-51 | **Content Block Engine** (blocos com tags) | Plataforma / E-P1 | M11/M14 | hab. | — | M | F-50 | MVP | backlog |
| F-52 | **App Shell** (PWA, local-first, sem login) | Plataforma / E-P2 | — | hab. | — | M | — | MVP | backlog |
| F-53 | **Accounts & Sync** (backend, auth, estado compartilhado) | Plataforma / E-P2 | — | hab. | — | M | F-56 | R2 | backlog |
| F-54 | **Own-Screenshot OCR** (só prints do próprio usuário) | Plataforma / E-P2 | M19 | hab. | — | M | T0: qualidade do OCR (fora do protocolo) | R2 | backlog |
| F-55 | **Verification Code** (código curto, sem URL) | Plataforma / E-P2 | M15 | hab. | — | S | T0: código no anúncio da aliança (fora do protocolo) | R1 (teste) → R2 | backlog |
| F-56 | **Trust & Privacy Center** (ToS, consentimento, opt-out, LGPD/GDPR) | Plataforma / E-P3 | — | hab. | — | S | revisão jurídica antes de cobrar | MVP | backlog |
| F-57 | **Share & Discovery Kit** (nunca link no chat do jogo) | Plataforma / E-P3 | — | hab. | — | S | — | MVP | backlog |
| F-58 | **Discord Companion Bot** | Plataforma / E-P4 | M10 | 2,4 | média | M | F-53 | R3 | backlog |
| F-59 | **Ask-with-Context Assistant** (Q&A com citações) | Plataforma / E-P4 | M12 | 4,2 | média | L | F-50 maduro, F-16; custo de LLM | R3 | backlog |
| F-60 | **3D Profile Card** (inclinação + brilho holográfico) | Identidade | M15 | — | média | S | F-10 | MVP/R1 | backlog |
| F-61 | **3D Alliance Crest** (brasão em relevo, exporta PNG) | Identidade | M15 | — | fraca (depende de F-06) | M | F-09, F-08 | R2 | backlog |
| F-62 | **Progress Tower** (torre 3D da conta por nível de CH) | Conta | M1 | — | sem evidência | M | F-14 | R3 | backlog |
| F-63 | **3D Landing Hero** (mesa de guerra original) | Plataforma | — | — | sem evidência | S–M | — | R1 opcional | backlog |
| F-64 | **KvK Planning Map 2.5D/3D** (mapa esquemático original) | Reino | — | — | a validar com líderes | L | entrevistas | R3 | backlog |
