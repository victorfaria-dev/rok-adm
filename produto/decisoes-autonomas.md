# Decisões autônomas (para o Victor revisar)

Victor pediu (2026-10-13) um loop autônomo: testar fluxos, corrigir bugs, criar funcionalidades, animações e 3D, usando um agente "procurador de decisões" no lugar dele. Cada decisão abaixo pode ser revertida; marque ✗ e o motivo, e o loop desfaz.

Limites que o loop não cruza sem o Victor: merge na main, publicar/hospedar o site, serviços pagos ou credenciais, qualquer coisa que viole os Termos da Lilith, textos jurídicos finais.

| # | Data | Decisão | Alternativas | Por quê | Quem decidiu | Revisão do Victor |
|---|---|---|---|---|---|---|
| 1 | 2026-10-13 | Cartão de perfil 3D no app em CSS 3D (sem Three.js); brasão 3D em Three.js só quando houver tela de aliança | Three.js para os dois | Three.js custa ~150 KB gz e o cartão funciona bem em CSS 3D (protótipo já validado no celular) | admin | |
| 2 | 2026-10-13 | Animação do logo no app: só a versão curta (K, 1,2–1,6 s) na primeira abertura do app instalado (splash), desligada com reduced-motion | intro completa em toda visita | intro em toda visita atrasa quem só quer o guia | admin | |
| D1 | 2026-10-13 | Onda D: fórmulas das calculadoras em `packages/planner/src/tools/` (sem JSON nem dataset; importável pelas ilhas via `@rokadm/planner/tools`) e números de entrada em `packages/planner/tools-data/*.json` com `evidence` literal checada por teste | fórmulas em `@rokadm/data` (puxaria `facts.json` para o cliente) | regra do orçamento: o dataset nunca vai para o navegador; o padrão `evidence` já existe em `budget-inputs.json` | coordenador D | |
| D2 | 2026-10-13 | Estado das ferramentas na chave própria `ko:tools:v1` (inventário compartilhado + entradas por ferramenta + checklists); link `?s=` mostra os valores sem salvar até o usuário editar | reutilizar `ko:v1` | separar evita conflito com as ondas B/C; mesmo comportamento do `?p=` do guia | coordenador D | |
| D3 | 2026-10-13 | "Re-verify" numa citação quando a ficha foi confirmada pela última vez antes do último patch oficial (ou foi invalidada) | sem selo de vencimento | F-81 (b) pede "re-verificar quando vencido"; o critério usa só datas que já estão nos dados | coordenador D | |
| D4 | 2026-10-13 | O hub `/tools/` lista só as páginas que existem no build (`import.meta.glob`) | lista fixa | cada head publicado fica sem link quebrado enquanto as páginas chegam | coordenador D | |
| D5 | 2026-10-13 | Custos de pesquisa e de treino de tropas ficam fora: não há tabela nos dados; o planejador de cura usa capacidade de hospital da tabela (A01-0008) e custo por tropa digitado pelo usuário, marcado "pending measurement" | inventar custos por tier | regra do Victor: valor que depende de medição no jogo fica pendente, nunca inventado | coordenador D | |
