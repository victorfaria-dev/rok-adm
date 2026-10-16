# Hospedagem do site (preview no celular)

O site é estático: `pnpm --filter @rokadm/web build` gera `apps/web/dist`. Não há servidor nem chave de API. Os dados do usuário ficam no navegador de cada aparelho.

## Netlify (usa o `netlify.toml` da raiz)
1. Add new site → Import an existing project → GitHub → `rok-adm`.
2. Branch to deploy: `claude/kingdomops-wave-e` (ou a que você quiser ver). O resto vem do `netlify.toml`.
3. Cada push na branch gera uma nova versão; o link aparece no painel.

## Cloudflare Pages (mesmos valores, no painel)
- Framework preset: None
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @rokadm/web build`
- Build output directory: `apps/web/dist`
- Variável de ambiente: `NODE_VERSION` = `22`

## Observações
- Publicar na raiz do domínio (`https://nome.pages.dev`). Em subcaminho (GitHub Pages em `/rok-adm/`) as rotas e o PWA quebram, porque assumem `/`.
- `site` em `apps/web/astro.config.mjs` ainda é o placeholder `https://kingdomops.example`; troque quando houver domínio definitivo.
- O link do guia de administração (`/guides/kingdom-admin/`) só existe depois que a onda H for renderizada.
