# Backlog pedido pelo Victor durante o congelamento (2026-10-13)

Nada aqui entra antes de terminar a fase de experiência do usuário. Decisões pendentes estão marcadas.

## Idiomas
- Pedido: pacote de traduções para o público global.
- Proposta: escolher línguas pelo público de RoK (não pelas mais faladas no mundo); infraestrutura i18n + interface na etapa 1; guias só depois da compressão de conteúdo; glossário com os termos oficiais do jogo por idioma.
- Pendente: lista de idiomas (pesquisar ou definida pelo Victor).

## Login
- Pedido: e-mail, Google e, se possível, conta Lilith.
- Conta Lilith: sem login público conhecido para terceiros; pedir credenciais do jogo é proibido (ToS e segurança). Fora.
- Proposta: opcional para jogador (sincronizar), obrigatório para modo líder; serviço gerenciado com plano gratuito (ex.: Supabase), conta criada pelo Victor; política de privacidade LGPD.
- Decidido (Victor, 2026-10-13): serviço = Supabase (e-mail + Google). Conta criada pelo Victor quando a etapa chegar; chaves só em variáveis de ambiente (Netlify / ambiente da sessão), nunca no chat nem no repositório.
- Pendente: modelo opcional-para-jogador / obrigatório-para-líder.

## Perfil público / comunidade
- Pedido: perfil público com foto, banner, conquistas, biografia.
- Riscos a resolver antes: moderação de imagens e texto, denúncia e bloqueio, público com menores de idade, LGPD, custo de armazenamento.
- Conquistas: dados do jogo não podem ser lidos (ToS); só autodeclarados (marcados como não verificados) ou conquistas do próprio site.
- Base existente: o Governor card pode virar o embrião do perfil público.
- Pendente: escopo do MVP e ordem em relação a login e modo líder.
