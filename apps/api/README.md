# @rokadm/api — backend local do KingdomOps

Servidor **só local** (Node 22, `node:http` + `node:sqlite`, sem dependências externas) para
espaços de reino e sincronização dos documentos de farms, plano de MGE, requisitos do conselho e
dados do reino. Não há deploy: ele roda na sua máquina e escuta em `127.0.0.1` por padrão.

- Decisão e limites: [`docs/adr/0003-backend-local.md`](../../docs/adr/0003-backend-local.md)
- Contrato HTTP: [`openapi.json`](./openapi.json) (OpenAPI 3.1). Tipos, rotas e validadores ficam
  em `packages/core/src/contracts.ts`; o cliente tipado (`createApiClient`) em
  `packages/core/src/contracts-client.ts`.

## Rodar

```sh
pnpm install
pnpm api:dev
```

| Variável | Padrão | Uso |
| --- | --- | --- |
| `KO_API_PORT` | `8787` | Porta. |
| `KO_API_HOST` | `127.0.0.1` | Interface. Mantenha local. |
| `KO_API_DB` | `apps/api/.data/kingdomops.sqlite` | Arquivo SQLite. |
| `KO_API_ORIGINS` | `http://localhost:4321,http://127.0.0.1:4321` | Origens permitidas no CORS (lista separada por vírgula). |
| `KO_API_SECRET` | gerado em `apps/api/.data/secret` (modo 600) | Segredo do HMAC, em hex. |

`apps/api/.data/` guarda o banco e o segredo; não versione essa pasta.

## Exemplos (curl)

```sh
API=http://127.0.0.1:8787

# Criar um espaço: devolve o token do admin e o primeiro convite (mostrados uma vez só)
curl -s -X POST "$API/v1/spaces" -H 'content-type: application/json' \
  -d '{"name":"Reino 1234","kingdom":1234,"displayName":"Rei"}'

# Entrar com o código do convite (maiúsculas/minúsculas e traços tanto faz)
curl -s -X POST "$API/v1/join" -H 'content-type: application/json' \
  -d '{"inviteCode":"ABCD-EFGH-JKMN","displayName":"Farm Lord"}'

# Gravar um documento (baseVersion 0 cria; depois envie a versão que você leu)
SPACE=sp_xxxxxxxxxxxxxxxx; TOKEN=...
curl -s -X PUT "$API/v1/spaces/$SPACE/docs/farms/main" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"baseVersion":0,"data":{"farms":[],"shipments":[]}}'
```

Se outra pessoa gravou antes, a resposta é `409 version_conflict` com o documento atual em
`current`, para o cliente mesclar ou sobrescrever.

## Modelo de segurança

- **Tokens** aparecem uma única vez (ao criar o espaço ou entrar) e ficam guardados só como HMAC
  com o segredo do servidor. Vão sempre no cabeçalho `Authorization: Bearer`, nunca na URL.
- **Códigos de convite** também ficam só como hash; têm validade, limite de usos e podem ser
  revogados. Convite desconhecido, expirado, revogado ou esgotado recebe a mesma resposta.
- **Papéis**: admin gerencia convites, membros, auditoria, exportação e documentos de admin;
  membro lê tudo do espaço e grava só os próprios farms.
- **Limites**: rate limit por cliente (mais rígido para criar espaço e entrar), corpo de até
  ~528 KB, só `application/json`, validação estrita de cada campo (campos desconhecidos são
  recusados).
- **CORS** só para as origens de `KO_API_ORIGINS`.
- **Logs** sem dados pessoais, tokens ou códigos.
- **Exportação e exclusão**: o admin baixa todos os dados do espaço (`GET …/export`) e pode
  apagar o espaço inteiro (`DELETE /v1/spaces/{id}`), o que remove membros, tokens, convites,
  documentos e auditoria. Quem sai do espaço (`DELETE …/members/me`) perde o acesso na hora.

## Testes

```sh
pnpm --filter @rokadm/api test
```
