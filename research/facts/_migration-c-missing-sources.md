# Migration C: sources without a slug in fontes.md

Date: 2026-10-13. Scope: C01, C02, C04, and B01-0001…0003.

**Every cited source mapped to an existing slug.** No source is missing from `fontes.md`.

The old IDs were resolved with the "Mapa de IDs antigos" table, plus four IDs that are not in that table:

| Old ID | Slug used |
|---|---|
| PL02 | `src:lilith-forum` |
| PL14 | `src:onechilledgamer` |
| PL15 | `src:heroscroll` |
| CS21 | `src:davor-toolkit` |

Suggested refinements for the integrator. `fontes.md` was not edited.

Three non-GitHub sites currently sit under `src:github` because of the `CS32–CS42 → src:github` mapping. If they are ever counted as independent sources, they deserve their own slugs:

| URL | Card | Proposed slug | Tier |
|---|---|---|---|
| https://rokbattles.com/docs, https://rokbattles.com/docs/quick-start | C01-0020 | `src:rokbattles` | T3 |
| https://docs.rokmonster.dev | C01-0022 | `src:rokmonster` | T3 |
| https://github.com/feels-dev/RokVision | C01-0022 | stays `src:github` | T3 |

RokVision is not listed in `raw/competitors/_sources.md`; the card cited it as CS35.

The `fontes.md` "Como acessar" table could also add these access routes:
- `github.com` HTML and API are blocked in this environment, but `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md` works.
- `ldshop.gg` returned 403 "Access Denied" on 2026-10-13, even with a Firefox user agent and `--http1.1`.
- `everycalculators.com`, `alternativeto.net`, `appgamer.com`, `justia.com` and `allclash.com` (category page) are behind a Cloudflare block or challenge.
