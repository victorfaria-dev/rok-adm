# Backlog de ideias do Victor (com análise do admin)

Ideias registradas como chegam. Status: `aceita` (entra no roadmap), `hipótese` (depende de dados), `descartada`.

## I-01 — Guias por perfil de gasto (2026-10-13) — aceita
F2P como base; deltas Low → Medium → High → Whale → Kraken. Ver `perfis.md`.

## I-02 — Sub-admins (2026-10-13) — aceita
Ver organograma em `STATUS.md`.

## I-03 — Guia de farms (2026-10-13) — aceita, variantes = hipótese
Guia separado do guia de conta principal, com variantes:
- **Farm de recurso único** (uma por recurso: food, wood, stone, gold).
- **Farm geral** (todos os recursos).
- **Farm de par de recursos** — só os pares que fizerem sentido.

Análise: quais variantes "fazem sentido" é pergunta empírica, não de preferência. Depende de (a) qual recurso é gargalo da conta principal em cada estágio de CH, (b) diferença de velocidade/rendimento de coleta por recurso, (c) taxa/limite de transporte. Pares só entram se os dados mostrarem vantagem (ex.: pares que compartilham gargalo no mesmo estágio). Coleta pedida à frente W6 (`raw/A-economy/_farm-variants.md`).

## I-04 — Hub de administração de farms (2026-10-13) — aceita (módulo M13)
Cadastro de farms, metas diárias por farm (coleta, transporte, tempo), checklist de rotina, totais enviados à conta principal, alerta de farm ociosa. Entrada manual (restrição de ToS a confirmar pela W5).

## I-05 — Questionário → guia personalizado em HTML (2026-10-13) — aceita (módulo M14 "Guide Builder")
Usuário responde: perfil de gasto, estilo de jogo/função, horas/dia, estágio do reino, civilização, CH atual, etc. → recebe o guia correspondente, com opções marcadas **Recommended** conforme o perfil de gasto.

Decisão de arquitetura (admin): **não** escrever um guia por combinação de respostas (explosão combinatória: 6 perfis × 5 funções × 4 estágios × faixas de horas = centenas de guias impossíveis de manter). Em vez disso:
1. O guia é feito de **blocos** (passos/recomendações) com metadados: `perfil`, `funcao`, `estagio_reino`, `horas_min`, `fichas_base`, `recommended_para`.
2. O questionário gera um filtro; o HTML monta o guia filtrando e ordenando blocos.
3. Os mesmos blocos alimentam depois o Account Planner (M1) e o Farm Hub (M13).

Isso mantém uma única fonte de verdade (fichas → blocos → guias) e permite adicionar perfis sem reescrever nada.

Primeira entrega: HTML estático (sem backend) com os blocos em JSON, publicado como página. Backend só quando houver estado do usuário a salvar.

## I-06 — Identidade: perfis de jogador e aliança (2026-10-13) — aceita como hipótese forte (módulo M15 "Identity")
Ideia: jogador cria perfil (nome, governor ID opcional, civilização, função, perfil de gasto), entra/cria aliança dentro do hub; foto de perfil alinhada à aliança (borda na cor da aliança, logo/brasão da aliança, tag).

Análise do admin:
- **Por que importa além do cosmético:** identidade de aliança é um vetor de distribuição. Se um R4/R5 cria a página da aliança e convida os membros, o hub ganha usuários em grupo (efeito de rede), e o perfil vira a "conta" que liga planner, farms e admin de reino.
- **Evidência:** ainda hipótese. A validar nas dores/voz do jogador (gasto em cosméticos, molduras, skins de cidade, tags, cargos de Discord por aliança). Pedido enviado à frente de dores dos jogadores.
- **Consequências de arquitetura:** exige contas de usuário, autenticação e armazenamento → o backend entra mais cedo do que o "HTML estático" previsto em I-05. Proposta: o Guide Builder segue estático; Identity é o primeiro módulo com backend.
- **Riscos:**
  - **Direitos de imagem/marca:** brasões, molduras e avatares do jogo são conteúdo da Lilith (ToS 17.1.9 e licença pessoal não comercial). Não reproduzir assets do jogo; usuário faz upload do próprio logo ou usa um editor de brasão próprio do hub (formas/cores/ícones originais).
  - **Dados de terceiros:** perfil criado pelo próprio jogador = consentimento. Nunca criar perfis de outros jogadores a partir de scans sem permissão (ToS 17.1.13; LGPD/GDPR).
  - **Moderação:** upload de imagem e nomes exigem moderação básica (conteúdo ofensivo).
  - **Impersonação:** alguém criar a "aliança X" falsa → verificação de liderança da aliança (ex.: código colocado na descrição da aliança no jogo, conferido por print).
- **Recursos candidatos:** editor de brasão; borda/cor de aliança no avatar; tag `[TAG]`; cartão de perfil compartilhável (imagem para Discord); página da aliança com membros e cargos (R1–R5); página do reino.

## I-07 — Exportar avatar personalizado para usar no jogo (2026-10-13) — aceita (parte do M15)
O hub gera a imagem do avatar (foto/brasão + borda na cor da aliança + logo/tag) e o jogador baixa um PNG pronto para enviar como avatar dentro do jogo.

Viabilidade: o jogo **parece** permitir avatar personalizado. Uma resposta da comunidade descreve o caminho (perfil do governador → ícone azul de imagem → "+" → álbum/câmera) e um guia diz que cada jogador pode escolher a própria imagem (fontes T3/T4: appgamer.com/rise-of-kingdoms/answers/11524, riseofkingdomsguides.com/governor-profile-in-rok/). Relatos de limite de tamanho de arquivo, não confirmados.

A confirmar no jogo (T0, conta nova do Victor):
1. Existe o upload de avatar personalizado hoje? Há requisito de nível de CH/VIP ou custo?
2. Formato aceito, tamanho máximo, recorte (quadrado/círculo) e resolução final exibida.
3. Há revisão/moderação da imagem pela Lilith (tempo de aprovação)?
4. Como a moldura do jogo (avatar frame) se sobrepõe à imagem → define a "área segura" onde a borda da aliança não é coberta.
5. Frequência permitida de troca / cooldown.

Requisitos de design: exportar no tamanho e recorte exatos do jogo; área segura respeitando a moldura do jogo; arquivo abaixo do limite; usar apenas arte original ou enviada pelo usuário (nada de assets da Lilith).
