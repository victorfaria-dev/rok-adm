# Backlog pedido pelo Victor durante o congelamento (2026-10-13)

Nada aqui entra antes de terminar a fase de experiência do usuário. Decisões pendentes estão marcadas.

## Idiomas
- Pedido: pacote de traduções para o público global.
- Proposta: escolher línguas pelo público de RoK (não pelas mais faladas no mundo); infraestrutura i18n + interface na etapa 1; guias só depois da compressão de conteúdo; glossário com os termos oficiais do jogo por idioma.
- Pesquisa: `research/idiomas-publico-rok.md`.
- Decidido (Victor, 2026-10-13, revisão): usar todas as línguas do Discord oficial que conseguirmos: EN, PT, ES, FR, DE, IT, RU, TR, ID, VI, KO, ZH, AR. Ordem de entrega por custo técnico: latinas (EN, PT, ES, FR, DE, IT, TR, ID, VI) → RU (cirílico) → KO, ZH (fontes CJK) → AR (RTL). Traduções por IA marcadas como sem revisão nativa até haver revisor; glossário de termos do jogo por idioma marcado como não verificado quando não houver fonte.
- Decisão anterior (substituída): foco em Américas e Europa primeiro; Ásia (KO, JA, ZH, VI) depois. Proposta de conjunto inicial: EN, PT-BR, ES, FR, DE (+ RU como 6º, a confirmar). Todos são idiomas oficiais do cliente do jogo.

## Login
- Pedido: e-mail, Google e, se possível, conta Lilith.
- Conta Lilith: sem login público conhecido para terceiros; pedir credenciais do jogo é proibido (ToS e segurança). Fora.
- Proposta: opcional para jogador (sincronizar), obrigatório para modo líder; serviço gerenciado com plano gratuito (ex.: Supabase), conta criada pelo Victor; política de privacidade LGPD.
- Decidido (Victor, 2026-10-13): serviço = Supabase (e-mail + Google). Conta criada pelo Victor quando a etapa chegar; chaves só em variáveis de ambiente (Netlify / ambiente da sessão), nunca no chat nem no repositório.
- Decidido (Victor, 2026-10-13): login obrigatório para jogador e líder. Impacto: o app deixa de ser local-first sem conta; dados locais existentes precisam migrar para a conta no primeiro login; links de compartilhamento e modo offline precisam ser revistos.
- Decidido (Victor, 2026-10-13): guias públicos, sem login.

## Landing page
- Decidido (Victor, 2026-10-13): página pública de apresentação do sistema antes do login.
- Proposta: o que é, para quem (jogador / líder), 3 exemplos reais do que resolve, prova de confiança (fontes, sem bots, conforme os termos da Lilith), botão de entrar. Sun Tzu como apresentador.

## Perfil público / comunidade
- Pedido: perfil público com foto, banner, conquistas, biografia.
- Riscos a resolver antes: moderação de imagens e texto, denúncia e bloqueio, público com menores de idade, LGPD, custo de armazenamento.
- Conquistas: dados do jogo não podem ser lidos (ToS); só autodeclarados (marcados como não verificados) ou conquistas do próprio site.
- Base existente: o Governor card pode virar o embrião do perfil público.
- Pendente: escopo do MVP e ordem em relação a login e modo líder.

## Comandantes (Victor, 2026-10-13)
- Separar guia de comandantes (público, aba Guides) da administração dos comandantes próprios (dentro do hub da cidade, por conta: principal, farms e alts têm comandantes diferentes). Estrutura passada para a etapa UX 1.
- Cada cidade do carrossel é um contexto próprio: trocar de cidade troca funções, status, avisos e tarefas. Passado para a etapa UX 1.
- Agrupar comandantes pelo período em que aparecem (temporada/KvK). Fora do período, não fazer perguntas. Próxima etapa.
- Fotos dos comandantes: pedido do Victor para reconhecimento visual. Retratos do jogo são arte da Lilith (proibido pelas regras do projeto). Política de conteúdo de fãs da Lilith não encontrada em busca. Opções: (a) arte própria por comandante; (b) retratos históricos em domínio público; (c) Victor revisar a regra se a Lilith permitir uso por fãs. Pendente.
- Decidido (Victor, 2026-10-13): opção (c), aceitar o risco e usar imagens do jogo como conteúdo editorial (retratos de comandantes, ícones de itens, edifícios, equipamentos, capturas de tela). Ampliado na mesma data: "não tem como criar conteúdo sobre um jogo sem usar imagens do jogo". Continua fora: logo e marca da Lilith como identidade do site, qualquer coisa que faça o site parecer oficial; mascote e identidade visual seguem próprios. Mitigações: aviso "Rise of Kingdoms © Lilith Games; site de fãs sem afiliação" nas páginas com retratos; retirar imediatamente se a Lilith pedir; não extrair imagens de arquivos ou tráfego do jogo (regra de ToS continua); servir os arquivos do próprio site, sem hotlink.

## Verificação de perfil (proposta, 2026-10-13)
- Níveis: (1) declarado, "não verificado"; (2) conferido por print, OCR no servidor com imagem guardada para auditoria; (3) conta comprovada.
- Conta comprovada via Álbum do governador (achado do Victor): o jogo permite enviar qualquer foto ao Álbum. O site gera uma imagem com código aleatório; o jogador a envia ao Álbum e manda print do Álbum + print do Perfil do Governador (que mostra o ID fixo). Dispensa trocar o nome (que custa item).
- Limite: prints podem ser editados; nível 3 prova controle da conta, não autenticidade de cada número. Moderador revisa por amostragem e em denúncias.
- Achado de OCR com prints reais (4 contas do Victor, cliente em PT): o Tesseract lê bem ID, poder e pontos de abate, mas a tela de perfil não mostra nível da prefeitura e o VIP fica parcialmente coberto; o parser atual (rótulos em inglês) não serve. Reescrita em andamento (trilha OCR). Prints reais ficam fora do repositório (IDs e foto pessoal).
- Decidido (Victor, 2026-10-13): os 3 níveis aprovados. Fluxo de prints: Perfil do Governador (ID, nome, poder, abates, civilização) + cidade com a prefeitura tocada ("Prefeitura · Nível N", VIP e poder no HUD) + Álbum com o código (posse da conta, ligada ao ID pelo nome). Código: validade de 1 hora e válido só para a requisição que o gerou (uso único; nova tentativa = novo código).

## Leitura de inventário (adiado, Victor 2026-10-14)
- Ideia: somar aceleradores e pacotes de recursos a partir de prints do inventário.
- Dificuldade: identificar itens exige reconhecer ícones (comparação com biblioteca de referência); quantidades já são legíveis.
- Próximo passo quando retomar: 2–3 prints (abas de aceleradores e recursos) para avaliar viabilidade antes de construir.

## Uso pessoal, português, sem servidor de OCR (Victor, 2026-10-14)

- **Uso só do Victor.** Some a meta de comunidade por enquanto.
- **Idioma: só português (pt-BR).** A interface passa a ser escrita em português direto no código, sem camada de i18n. O plano de 13 idiomas (`produto/i18n-plano.md`) fica arquivado; o glossário (`packages/data/i18n/glossary.json`) continua como fonte dos termos do jogo em pt-BR.
- **Login, perfil público, verificação por Álbum e Supabase: desligados e congelados.** O código fica no repositório; sem as variáveis de ambiente nada disso aparece (comportamento que já existe). Dados ficam no navegador + backup. Não configurar Supabase por agora.
- **RokVision não será usado.** É um servidor (C# + Python/PaddleOCR em Docker), sem CORS, e no inventário só lê XP e Pontos de Ação. Seguimos com o nosso leitor de prints no navegador (tesseract.js). Pesquisa: `research/integracao-jogo-github.md`.
