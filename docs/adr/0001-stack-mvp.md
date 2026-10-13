# ADR 0001 — Stack do MVP

Data: 2026-10-13 · Status: aceito (admin, com autonomia delegada pelo Victor)

## Contexto
O MVP ("F2P Early Kingdom Companion") é estático, sem login e sem backend (`produto/arvore-funcionalidades.md` §6). A identidade visual ainda não existe; o frontend virá depois com as skills de `produto/skills-frontend.md`.

## Decisão
- **TypeScript** em monorepo **pnpm** (`packages/*`), lógica "headless" separada da UI:
  - `@rokadm/core` — tipos de domínio, motor de blocos (F-51), questionário (F-01).
  - `@rokadm/data` — pipeline que transforma `research/facts` e `guides/data` em JSON versionado (F-50 v0).
  - `@rokadm/planner` — rotina por tempo (F-15), Budget Reality Check (F-14), checklist de comandante (F-20).
- Testes com **Vitest**; checagem de tipos com `tsc --noEmit` (strict).
- Validadores Python existentes (`research/tools`, `guides/tools`) continuam e rodam no CI.

## Por quê
- O MVP roda no navegador: a mesma lógica em TS serve o site estático agora e o backend (R2) depois.
- Separar lógica de UI permite construir e testar tudo antes da identidade visual.
- C#/.NET (stack que o Victor conhece) fica como opção para o backend no R2; a decisão será revista lá.

## Consequências
- Tipos compartilhados em `packages/core/src/types.ts` são o contrato entre pacotes.
- O dataset gerado é versionado no git para o site estático não depender de build em runtime.
