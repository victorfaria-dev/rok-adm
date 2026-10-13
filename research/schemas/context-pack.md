# Schema: pacote de contexto (`context/<tema>.md`)

Documento compacto, destinado a ser carregado como contexto para escrever guias e, depois, projetar o sistema.

```markdown
---
tema: "Progressão de Prefeitura"
dominios: [A01, A04]
gerado_em: 2026-10-13
fichas_base: [A01-0001, A01-0002, ...]
cobertura: "o que está coberto / lacunas conhecidas"
---

## Resumo (≤ 10 linhas)
## Fatos verificados (mecânicas, com IDs das fichas)
## Recomendações por perfil e estágio (com nível de consenso)
## Divergências e incertezas
## Lacunas
```

## Regras

- Somente fichas `verificado` ou `organizado` com `confianca >= media`; o resto vai em "Divergências e incertezas" ou "Lacunas".
- Toda afirmação aponta para o ID da ficha de origem.
- Limite: ~3–5 mil palavras por pack. Se passar, dividir o tema.
