# ADR 0003 — Backend local (`apps/api`): espaços de reino e sync

Data: 2026-10-13 · Status: aceito (coordenador da onda F, com autonomia delegada; escopo aprovado pelo Victor: "dados do reino + sync de farms")

## Contexto
Até a onda E tudo vive no aparelho (`ko:v1`, `ko:farms:v1`). Líderes precisam juntar dados do reino (requisitos do conselho, plano do MGE) e jogadores querem sincronizar as farms entre aparelhos. O `produto/apis-integracoes.md` previa Supabase + Discord OAuth no R2. Os limites do roadmap proíbem nesta onda: deploy, hospedagem, serviço pago, credencial de terceiros.

## Decisão
- **`apps/api` (`@rokadm/api`)**, só local: Node 22 + TypeScript, `node:http` e **`node:sqlite`** embutido (sem flag desde o Node 22.13; o CI usa Node 22). **Zero dependência de runtime** além de `@rokadm/core`. Rodado com `tsx` (já é devDependency da raiz).
  - O vite/vitest remove o prefixo `node:` e não acha `sqlite`; o módulo é carregado por `createRequire` num único arquivo (`src/db.ts`).
- **Contratos em `packages/core/src/contracts.ts`**: tabela de rotas, tipos de request/response, limites e validadores escritos à mão (sem zod: menos dependência, e a validação recusa em vez de "consertar"). O cliente tipado (`contracts-client.ts`) e o teste do OpenAPI usam a mesma tabela de rotas.
- **Espaço de reino**: criar devolve um token de admin e um código de convite. Membros entram pelo código e escolhem um apelido. Sem senha, e-mail ou dado pessoal além do que o usuário digita.
- **Documentos sincronizados**: `farms` (forma das entradas de `ko:farms:v1`, validação estrita), `mge-plan`, `council-requirements` e `kingdom` (JSON genérico com limite de tamanho e profundidade até as lojas da onda E estabilizarem). Cada documento tem `id`, `kind`, `version`, `updatedAt`. Escrita com **concorrência otimista**: o cliente manda `baseVersion`; diferente da versão atual → **409** com o documento atual, e o cliente decide (mesclar ou sobrescrever reenviando com a versão nova). Na prática é "último que escreve vence", mas nunca por cima de algo que ele não viu.
- **Permissões**: `farms` só o dono escreve; `mge-plan`, `council-requirements` e `kingdom` só admin escreve; todos os membros leem.
- **Auditoria** por espaço (quem fez o quê, sem conteúdo). **Exportar** (JSON completo) e **apagar espaço** (cascade) atendem ao direito de apagamento; o membro pode sair e leva junto os documentos dele.
- **OpenAPI 3.1** escrito à mão em `apps/api/openapi.json`, validado no teste contra a tabela de rotas e os limites dos contratos.
- O site **não** é ligado ao servidor nesta onda.

## Alternativas descartadas
- **Supabase/Postgres + OAuth**: exige conta, credencial e hospedagem (fora do limite desta onda). Continua sendo a opção do R2; os contratos não dependem do banco.
- **better-sqlite3**: dependência nativa (compilação no CI); o `node:sqlite` embutido basta para uso local.
- **Fastify/Hono**: mais uma dependência para ~15 rotas; `node:http` com um roteador de 30 linhas é suficiente e mais fácil de auditar.
- **zod**: ~60 KB e uma dependência no `core` usado pelo navegador; os validadores à mão têm testes próprios.
- **Senha por membro / JWT**: senha vira dado sensível; JWT exigiria revogação. Token opaco com hash no banco revoga apagando a linha.
- **CRDT/merge automático**: complexo demais para documentos editados por poucas pessoas; o 409 com o documento atual resolve o caso real (dois aparelhos do mesmo jogador).

## Segurança
- Token: `kot_` + 32 bytes aleatórios (base64url), mostrado uma vez. No banco fica só **HMAC-SHA256** com um segredo local (`KO_API_SECRET` ou `apps/api/.data/secret`, gerado no primeiro uso com modo 600 e fora do git). O HMAC é determinístico, então a busca é por índice e não depende de comparação de strings.
- Código de convite: 12 símbolos de um alfabeto de 30 sem caracteres parecidos (~59 bits), também guardado como HMAC; expira (padrão 72 h, máx. 14 dias), tem limite de usos e pode ser revogado. Código desconhecido, expirado, revogado ou esgotado dá a **mesma** resposta (404 `invite_invalid`).
- Limite de taxa por IP (sem confiar em `X-Forwarded-For`): geral e um mais estrito para criar espaço e entrar. Corpo limitado (413), só JSON (415), CORS só para as origens configuradas, servidor ligado em `127.0.0.1` por padrão.
- SQL só com statements preparados. Logs em JSON com a rota-modelo (`/v1/spaces/{spaceId}`), status e tempo; nunca IP, token, código, corpo ou apelido.

### Modelo de ameaças (STRIDE resumido)
| Ameaça | Exemplo | Mitigação | Risco restante |
|---|---|---|---|
| **S**poofing | Usar o token de outro membro; adivinhar convite | Tokens de 256 bits; convites de ~59 bits com expiração, limite de usos e limite de taxa | Token vazado (print, link) vale até o membro ser removido; não há rotação de token nesta onda |
| **T**ampering | Membro sobrescreve farm de outro ou o plano do MGE; injeção de SQL; JSON com `__proto__` | Dono/admin por tipo de documento; statements preparados; validação estrita; chaves proibidas no JSON genérico; `baseVersion` | Admin pode apagar qualquer documento (por desenho) |
| **R**epudiation | "Não fui eu que apaguei" | Auditoria por espaço com membro, ação, alvo e horário | Auditoria apaga junto com o espaço (apagamento vence) |
| **I**nformation disclosure | Ler outro espaço; descobrir se um espaço existe; logs com dados | 403 igual para espaço alheio e inexistente; resposta única para convite inválido; logs sem PII; hashes nunca saem no export | Qualquer membro lê todos os documentos do espaço (por desenho); o banco local não é criptografado em disco |
| **D**enial of service | Corpo gigante, muitas requisições, muitos documentos | 413, limites de taxa, limites por espaço (500 docs, 300 membros), timeouts do servidor | Limite de taxa em memória (zera ao reiniciar); suficiente para uso local |
| **E**levation of privilege | Membro chama rota de admin; último admin sai | Papel checado em toda rota; último admin não sai com outros membros no espaço | Não há troca de admin nesta onda |

## Consequências
- `pnpm check` passa a rodar os testes da API (integração com servidor em porta efêmera e banco temporário).
- Antes de qualquer hospedagem: TLS, armazenamento de segredo fora do disco, limite de taxa compartilhado, rotação de token, termos e política de privacidade (decisão do Victor).
- Ligar o site ao servidor (toggle "Sync (local server)") fica para uma onda seguinte, junto com a UI de conflito.
