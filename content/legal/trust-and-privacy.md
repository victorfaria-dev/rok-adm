# Confiança e privacidade

> **RASCUNHO — precisa de revisão jurídica antes de qualquer monetização.** Esta página descreve como o hub funciona no MVP. Não é aconselhamento jurídico e precisa ser revisada por um advogado (LGPD, GDPR, Termos de Serviço da Lilith) antes de o hub cobrar dinheiro, exibir anúncios ou guardar qualquer dado em um servidor.
>
> Funcionalidade: F-56 Central de Confiança e Privacidade. Fontes: `research/context/competitors-and-constraints.md` (fichas de ToS C02-0001 … C02-0021). Última atualização: 2026-10-13.

## Resumo

- **Não guardamos nada sobre você em nossos servidores.** No MVP, tudo o que você digita fica no seu próprio navegador.
- **Somos um projeto de fãs.** Não temos afiliação, aval nem patrocínio da Lilith Games.
- **Nunca vamos pedir o seu login do jogo**, nunca vamos automatizar o jogo e nunca vamos varrer reinos.
- **Você pode apagar tudo** com **Apagar todos os dados** na página Eu, ou limpando os dados deste site no seu navegador.

## 1. Quais dados guardamos

### MVP (agora)

Tudo abaixo fica no armazenamento do seu navegador, neste dispositivo. Só você pode ver, a menos que você mesmo exporte um arquivo ou compartilhe um link. A página **Eu** (`/me/`) tem **Fazer backup de tudo** (um arquivo com todas as linhas marcadas "sim" abaixo) e **Apagar todos os dados** (remove todas as linhas abaixo, inclusive o webhook do Discord, e também pode remover a cópia offline).

#### Perfil e respostas, contas, marcações da rotina, checagens de comandantes, modo de uso (jogador/líder) e tema

- **O que há nele:** suas respostas do questionário (gasto, função, minutos por dia, etapa do reino, nível da Prefeitura, civilização), qualquer questionário inacabado, suas contas (principal, farms, alternativas), cada uma com as marcações da rotina de hoje e as respostas da lista de comandantes, configurações da rotina, se você usa o site como jogador ou como líder, o seu tema
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** página Eu: **Exportar arquivo de perfil**
- **Como apagar:** **Apagar todos os dados** na página Eu (as marcações da rotina também são zeradas a cada dia; uma conta salva pode ser removida sozinha)

#### Cartão do governador

- **O que há nele:** o nome, a tag e as cores que você digitou para o seu cartão
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** página do Cartão: salvar como PNG
- **Como apagar:** sem botão separado; **Apagar todos os dados** na página Eu remove junto com todo o resto

#### Brasão da aliança

- **O que há nele:** formato do escudo, cores, emblema e tag que você escolheu
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** página do Brasão: salvar como SVG ou PNG
- **Como apagar:** sem botão separado; **Apagar todos os dados** na página Eu remove junto com todo o resto

#### Dados das ferramentas (calculadoras, inventário compartilhado, checklists)

- **O que há nele:** os números que você digitou nas calculadoras, o inventário que elas compartilham e as marcações das listas
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** em cada calculadora: **Copiar link com estas entradas** (contém apenas as entradas)
- **Como apagar:** sem botão separado; **Apagar todos os dados** na página Eu remove junto com todo o resto

#### Farms e registro de envios

- **O que há nele:** suas contas farm (nomes, níveis, anotações) e cada envio que você registrou
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** página de Farms: **Exportar farms (JSON)**; registro de envios: **Exportar CSV**
- **Como apagar:** página de Farms: apagar uma farm, ou **Apagar todos os dados de farms**; registro de envios: apagar um envio

#### Documentos do conselho do reino (regras, requisitos, registro do MGE, anúncio de recrutamento, planos de seed)

- **O que há nele:** o que o conselho digita: regras, faixas de requisitos, o registro de MGE, posts de recrutamento, planos de seed. **Isso pode incluir nomes de governadores e pontuações de outros jogadores que o conselho digita.**
- **Em "Fazer backup de tudo":** Sim
- **Outras formas de exportar:** página do kit do conselho (`/kingdom/`): **Exportar (.json)**; cada ferramenta: link de compartilhamento ou CSV
- **Como apagar:** em cada ferramenta: apagar um documento; página do kit do conselho: **Apagar todos os dados do conselho** (também esquece o webhook)

#### Banners dos cartões das cidades

- **O que há nele:** imagens que você escolheu como banner do cartão da cidade de uma conta, recortadas e reduzidas no seu dispositivo (os banners padrão não são guardados)
- **Em "Fazer backup de tudo":** **Não** (imagens são grandes; escolha-as de novo depois de restaurar)
- **Outras formas de exportar:** nenhuma
- **Como apagar:** **Voltar ao padrão** em **Editar banner** no cartão da Prefeitura, ou **Apagar todos os dados** na página Eu

#### URL do webhook do Discord

- **O que há nele:** o webhook do Discord que o conselho colou para publicar a partir do KingdomOps
- **Em "Fazer backup de tudo":** **Não** (é um segredo: quem o tem pode publicar naquele canal)
- **Outras formas de exportar:** nenhuma, de propósito
- **Como apagar:** **Esquecer webhook**, ao lado de qualquer botão de publicar no Discord, ou **Apagar todos os dados do conselho**

#### Sessão de login

- **O que há nele:** só quando as contas estão ativadas e você entrou: o token de login que mantém você conectado neste dispositivo, e o e-mail e o id da sua conta
- **Em "Fazer backup de tudo":** **Não** (é um segredo: mantém você conectado)
- **Outras formas de exportar:** nenhuma, de propósito
- **Como apagar:** **Sair**, ou **Apagar todos os dados** na página Eu

#### Escolhas de envio para a conta

- **O que há nele:** só quando as contas estão ativadas: se você já enviou os dados deste dispositivo para a sua conta ou escolheu mantê-los só aqui, para não perguntarmos duas vezes sobre os mesmos dados
- **Em "Fazer backup de tudo":** Não (diz respeito só a este dispositivo)
- **Outras formas de exportar:** nenhuma
- **Como apagar:** **Apagar todos os dados** na página Eu (você será perguntado de novo no próximo login)


- **Discord.** Nada é publicado no Discord a menos que você aperte um botão de publicar depois de colar uma URL de webhook. Aí a publicação que você vê (por exemplo, um registro de MGE ou o link das regras) vai direto do seu navegador para o Discord, e os termos e a política de privacidade do próprio Discord se aplicam a ela. O KingdomOps não tem servidor no meio.
- **Leitor de capturas de tela (experimental).** Quando você escolhe uma captura de tela do seu próprio perfil em `/tools/screenshot/`, o reconhecimento de texto (OCR) roda **no seu dispositivo**. A imagem nunca sai do seu navegador e não é salva; só os números que você escolhe usar são levados em um link de calculadora.
- **Cópia offline.** Depois da sua primeira visita, um service worker guarda no seu navegador uma cópia das páginas e dos arquivos de dados do site para ele abrir offline. Ela não contém nada sobre você. Remova-a com a opção em **Apagar todos os dados**, ou nas configurações do site no seu navegador.
- **Pequenos sinalizadores.** Um sinalizador só da aba lembra que a animação do logotipo já tocou; ele some quando você fecha a aba.
- **Sem conta, sem login, sem banco de dados em servidor** até as contas serem ativadas (veja "Contas" abaixo). Os guias são páginas estáticas; a filtragem acontece no seu navegador.
- **Nenhum dado do jogo sai do seu dispositivo** a menos que você mesmo exporte um arquivo, copie um link ou publique no Discord. Se você limpar os dados do site ou usar uma janela anônima, ele some.
- **Logs de hospedagem:** a empresa que hospeda os arquivos estáticos pode manter logs técnicos padrão (endereço IP, horário, página solicitada) por segurança. *[Revisão jurídica: nomear a hospedagem e o prazo de retenção antes do lançamento.]*
- **Análise de uso e anúncios:** nenhum no MVP. Se isso mudar, esta página muda primeiro e pediremos consentimento onde a lei exigir.

### Contas (construídas, desativadas até serem revisadas)

O login com e-mail ou Google e um perfil da comunidade estão construídos, mas não ativados. Quando forem:

- **Nunca um login do jogo.** Não existe login da Lilith / Rise of Kingdoms e o KingdomOps nunca pede a sua senha do jogo.
- **Sua conta guarda:** seu e-mail (do provedor de login), suas cidades (principal, farms, alternativas: nível da Prefeitura, etapa do reino, perfil de gasto, lista de comandantes), seu perfil (identificador, nome de exibição, número do reino, bio, foto, banner, conquistas, quem pode vê-lo), os jogadores que você bloqueou, as denúncias que você fez e cópias dos dados deste dispositivo **só se você escolher "Enviar para a minha conta"** no seu primeiro login. Nada no dispositivo é apagado por esse envio.
- **Seu perfil começa privado.** Você escolhe: só você, jogadores logados ou qualquer pessoa com o link. Não há busca de jogadores nem mensagens.
- **Conquistas:** os dados do jogo não podem ser lidos. As conquistas que você digita aparecem como "Não verificada (autodeclarada)"; só as "Conquistadas no KingdomOps" são conferidas pelo site.
- **Fotos:** redimensionadas no seu dispositivo antes do envio, o que também remove dados ocultos da foto, como a localização. Os arquivos de imagem são públicos para quem tem o endereço deles, como qualquer foto de perfil.
- **Denunciar e bloquear** estão em todo perfil. As denúncias guardam uma cópia do perfil como era. As denúncias sobre a segurança de crianças são revisadas primeiro.
- **Seus direitos:** "Baixar os dados da minha conta" dá uma cópia de tudo o que está acima; "Excluir minha conta" apaga tudo (as denúncias que você fez ficam, sem o seu nome). Os dois ficam na página de perfil (`/me/profile/`).
- **Menores** jogam este jogo. Se você tem menos de 18 anos, peça a um responsável antes de criar uma conta. *[Revisão jurídica: LGPD art. 14 (crianças e adolescentes), idade mínima, fluxo de consentimento dos pais e o operador de dados (Supabase) e sua região antes de ativar as contas.]*

### Versões futuras (planejadas, ainda não no ar)

Funcionalidades com servidor (páginas de reino compartilhadas, ferramentas de aliança) só serão lançadas depois que esta página for atualizada, revisada e publicada, e você será avisado **antes** de qualquer coisa que digitar sair do seu dispositivo.

## 2. Sem afiliação com a Lilith Games

Rise of Kingdoms é marca registrada da Lilith Games. Este hub é um planejador independente, feito por fãs, e **não tem afiliação, aval nem patrocínio da Lilith Games**. Nomes de comandantes, eventos e itens são usados apenas para descrever o jogo. Usamos texto próprio e arte própria; não usamos logotipos nem arte do jogo da Lilith.

Os Termos de Serviço da Lilith valem para a sua conta do jogo; nada neste site os altera. Quando descrevemos regras do jogo, indicamos a fonte e o patch que conferimos.

## 3. O que nunca vamos fazer

Estas são regras de projeto, não apenas promessas. Elas decorrem dos Termos de Serviço da Lilith.

| Nunca vamos… | Por quê |
|---|---|
| Pedir o seu login do jogo, a senha ou dados de vinculação da conta | Compartilhar conta e pedir credenciais é proibido (ToS 17.1.21, 4.4, 17.1.15). Quem pedir isso — inclusive quem disser que é a gente — não somos nós. |
| Criar ou indicar bots, scripts, auto-clickers ou ferramentas de "farm" | Bots e programas de terceiros que dão vantagem são proibidos (ToS 17.1.18), e o jogo pune scripts pela Pontuação de Conduta. |
| Varrer rankings ou reinos com emuladores, bots de OCR ou contas de serviço | Acesso automatizado e ferramentas de mineração de dados são proibidos (ToS 17.1.7, 17.1.15). |
| Ler arquivos do jogo, tráfego de rede ou memória | Engenharia reversa e contornos são proibidos (ToS 17.1.12, 17.1.6). |
| Comprar, vender ou intermediar contas ou itens | Contas e itens virtuais não são propriedade do usuário e não podem ser vendidos (ToS §4.5, §12.2). |
| Postar links deste site no chat do jogo, nem pedir que você o faça | Jogadores relatam silenciamentos e banimentos por compartilhar "informação de terceiros" no chat. Divulgue o hub no Reddit, no Discord ou no YouTube. |

Tudo o que entra no hub, você mesmo digita.

## 4. Capturas de tela (planejadas, ainda não no ar)

Uma versão futura pode permitir que você **envie suas próprias capturas de tela** (inventário, comandante, cidade) para o hub ler os números por você, em vez de você digitá-los. Quando isso for lançado:

- **Apenas as suas telas.** Envie telas da sua própria conta. Não envie telas que mostrem dados pessoais de outros jogadores.
- **Você tira a captura.** O hub nunca se conecta ao jogo.
- **Números mantidos, imagem apagada.** Vamos processar a imagem, guardar só os números que você confirmar e oferecer a exclusão imediata da imagem. *[Revisão jurídica: definir o prazo máximo de retenção e dizer onde o processamento acontece.]*
- **Opcional.** A entrada manual sempre continuará disponível.

## 5. Dados de reino (planejados para a R2, ainda não no ar)

Ferramentas de reino (listas de membros, DKP, páginas do reino) envolvem **dados de outros jogadores**. Os termos da Lilith proíbem coletar ou guardar dados pessoais de outros usuários sem a permissão expressa deles (ToS 17.1.13), e a lei de proteção de dados também se aplica. Antes de lançar qualquer funcionalidade de reino, valem estes princípios:

1. **Importar, não varrer.** Aceitamos arquivos que o seu reino já produz; não varremos nada.
2. **Declaração da liderança.** Quem envia dados do reino confirma que está autorizado pela liderança do reino e que os membros foram avisados.
3. **Aviso aos membros e recusa.** Todo membro listado pode pedir para ser ocultado ou removido de uma página de reino, pelo ID de governador, sem precisar de conta. As recusas são respeitadas em todas as importações futuras.
4. **Minimização de dados.** Só as colunas de que uma funcionalidade precisa (por exemplo, ID de governador, nome, poder, abates, mortes). Nada de nomes reais, e-mails ou dados de contato a partir dos dados do jogo.
5. **Limites de retenção.** Os dados do reino são apagados após um prazo fixo ou quando a página do reino for excluída. *[Revisão jurídica: definir o prazo.]*
6. **Sem ranking público de indivíduos**, a menos que o reino escolha publicar e os membros tenham sido avisados.

## 6. Seus direitos (LGPD e GDPR)

Se você está no Brasil (LGPD) ou na UE/EEE/Reino Unido (GDPR), você tem o direito de:

- **saber** se guardamos dados sobre você e receber uma cópia deles;
- **corrigir** dados incorretos;
- **excluir** seus dados ou pedir que sejam anonimizados;
- **se opor** ao tratamento ou **restringi-lo**, e **retirar o consentimento** a qualquer momento;
- **levar** seus dados para outro serviço (portabilidade);
- **reclamar** à sua autoridade de proteção de dados: a ANPD (Brasil) ou a autoridade de supervisão local (UE/EEE/Reino Unido).

No MVP não guardamos dados pessoais em nossos servidores, então você exerce a maior parte desses direitos sozinho, limpando os dados do site no navegador. Para qualquer outra coisa, fale com a gente: *[Revisão jurídica: incluir o nome do controlador e um e-mail ou formulário de contato; indicar o contato de proteção de dados (encarregado/DPO) se for exigido.]*

Responderemos no prazo que a lei estabelecer (*[revisão jurídica: confirmar 15 dias na LGPD / um mês no GDPR]*).

## 7. Crianças

O hub não é voltado a crianças. *[Revisão jurídica: definir a idade mínima e conferir com a classificação etária do próprio jogo e com a lei aplicável.]*

## 8. Mudanças nesta página

Vamos datar toda mudança no topo desta página. Uma mudança relevante (por exemplo, começar a guardar dados em um servidor) será anunciada no hub **antes** de entrar em vigor.

## 9. Contato

*[A completar antes do lançamento.]*
