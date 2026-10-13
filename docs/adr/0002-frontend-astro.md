# ADR 0002 — Frontend: Astro estático + ilhas Preact

Data: 2026-10-13 · Status: aceito (Victor: "Tudo aprovado, segue o recomendado")

## Decisão
- `apps/web` (`@rokadm/web`): **Astro 5** gerando site estático, com **Preact** só nas partes interativas (ilhas). Comparação e motivos em `produto/plano-app-shell.md` §1.
- CSS puro sobre `design/tokens/tokens.css` (importado, nunca copiado). Sem Tailwind.
- Fontes self-hosted (Fontsource): Chakra Petch, IBM Plex Sans, IBM Plex Mono.
- `@rokadm/data` só em código de build; o navegador recebe JSON enxuto.
- Estado no aparelho, chave `ko:v1` em `localStorage`; sem login e sem backend no MVP.

## Decisões do dono que acompanham (recomendações aceitas)
1. Hospedagem estática gratuita (Cloudflare Pages ou GitHub Pages) até a busca de marca de "KingdomOps"; o site não depende de caminho base.
2. Tema escuro na primeira visita; o usuário escolhe Dark, Light ou System.
3. Orçamento de JS: 200 KB **gzip por rota** na primeira carga; `/` ≤ 30 KB.
4. Link `?p=` compartilhado só mostra o guia; não troca o perfil salvo de quem abre.
5. Detector da impeccable: uso local e opcional, fora do CI.
6. Banner de consentimento de analytics: depois das 3 primeiras telas, antes do lançamento.

## Consequências
- Versões fixadas (Astro 5.18, Preact 10) porque o ADR 0001 pede reprodutibilidade; migrar para Astro 7 é uma decisão separada.
- O CI ganha build do site, checagem de orçamento de JS e smoke test com Playwright.
