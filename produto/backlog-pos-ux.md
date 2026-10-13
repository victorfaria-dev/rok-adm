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
- Decidido (Victor, 2026-10-13): opção (c), aceitar o risco e usar os retratos oficiais dos comandantes. Escopo: só retratos de comandantes (o mascote e a identidade visual continuam próprios; logo e marca da Lilith seguem fora). Mitigações: aviso "Rise of Kingdoms © Lilith Games; site de fãs sem afiliação" nas páginas com retratos; retirar imediatamente se a Lilith pedir; não extrair imagens de arquivos ou tráfego do jogo (regra de ToS continua); servir os arquivos do próprio site, sem hotlink.
