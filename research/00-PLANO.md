# Plano de Pesquisa — Rise of Kingdoms (RoK)

> Status: **estrutura (Fase 0)**. Nenhum dado coletado ainda.
> Data de criação: 2026-10-13.

## 1. Objetivo

Construir uma base de conhecimento verificável sobre Rise of Kingdoms que sirva de contexto para:

1. **Guia de conta** — o que fazer, passo a passo, para ter a melhor conta possível em um horizonte de tempo `T`, jogando `h` horas/dia, com orçamento `$`.
2. **Guia de administração de reino** — como liderar/gerir um reino (organização, KvK, regras, MGE, migração, etc.).
3. **Mapa de dores** — dificuldades reais de jogadores e líderes, com evidência de frequência e gravidade.
4. **Requisitos de um sistema** de gestão e planejamento que resolva as dores mais relevantes.

A pesquisa é o insumo; os guias e o sistema são produtos derivados dela.

## 2. Premissas a questionar antes de coletar

Estas são as decisões/hipóteses que mais podem invalidar o trabalho se forem assumidas sem teste:

| # | Premissa | Por que é arriscada | Como tratar |
|---|----------|---------------------|-------------|
| P1 | Existe uma "melhor conta" única | "Melhor" depende de objetivo (lutar no KvK, farmar, liderar rally, guarnição) e de gasto | Definir **função objetivo por perfil** (ver §4) antes de escrever o guia |
| P2 | Poder (power) mede qualidade de conta | Poder infla com prédios/tropas baixas; jogadores experientes valorizam T5, comandantes com expertise, equipamento, KP | Usar métricas compostas, não poder |
| P3 | O conhecimento é estável | Patches, novas temporadas de KvK, novos comandantes e eventos mudam o meta | Todo fato recebe **data + versão/temporada**; revisão periódica |
| P4 | Guias da comunidade = verdade | Muito conteúdo é opinião, desatualizado ou cópia de cópia | Classificar fatos como *mecânica* (verificável) vs *estratégia* (opinião/consenso) e registrar nível de confiança |
| P5 | As dores dos jogadores podem ser deduzidas dos guias | Guias mostram complexidade, não dor real; dor precisa de voz do jogador | Coleta separada de **voz do jogador** (fóruns, Reddit, Discord, reviews da loja) |
| P6 | O sistema pode ler dados da conta automaticamente | Scanners/bots/OCR podem violar os Termos de Serviço da Lilith | Pesquisar ToS e o que ferramentas existentes fazem **antes** de projetar integrações |
| P7 | O guia vale igual para qualquer reino | Idade do reino (pré-KvK, KvK1…KvK3, Season of Conquest) muda prioridades | Indexar recomendações por **estágio do reino** |

## 3. Perguntas de pesquisa

**Q1 – Mecânicas:** quais são os sistemas do jogo, seus custos, requisitos e retornos (números)?
**Q2 – Economia de tempo:** quais atividades têm maior retorno por minuto jogado? Quais são fixas (diárias) e quais escalam com tempo?
**Q3 – Progressão:** qual a ordem ótima de prédios, pesquisas, comandantes e equipamentos por perfil e estágio do reino?
**Q4 – Eventos:** quais eventos valem participação, quanto preparar (acumular aceleradores/recursos) e para quais?
**Q5 – Administração de reino:** que funções, rituais e regras um reino bem gerido tem? Onde reinos falham?
**Q6 – Dores:** quais problemas jogadores e líderes relatam, com que frequência e gravidade?
**Q7 – Concorrência:** que ferramentas já existem (calculadoras, trackers, planilhas, bots de Discord), o que resolvem e onde falham?
**Q8 – Restrições:** o que os ToS permitem (automação, leitura de dados, scanners)?

## 4. Modelo de otimização do guia de conta (hipótese inicial)

O guia é, no fundo, um problema de alocação de recursos escassos (tempo, aceleradores, recursos, gemas, AP, dinheiro) ao longo do tempo. Formalização de trabalho:

- **Entradas do jogador:** `h` horas/dia, janelas de jogo (ex.: 3×20 min), orçamento ($0 / baixo / médio / alto), estágio do reino, objetivo (lutador, farm, rally, guarnição, líder).
- **Restrições:** tempo de construção/pesquisa, filas, capacidade de recursos, limite de AP, calendário de eventos.
- **Função objetivo (por perfil), candidatas:**
  - prontidão para KvK: nº de tropas T5 (ou T4), comandantes-chave com expertise, equipamento lendário, VIP;
  - velocidade de chegar à Prefeitura 25 (CH25);
  - capacidade de gerar Kill Points sem morrer excessivamente.
- **Saída:** cronograma diário/semanal priorizado, com o "porquê" de cada passo.

> Isso define o que coletar: para cada atividade precisamos de **custo em tempo**, **retorno**, **frequência** e **dependências**. Fatos sem essas dimensões têm valor menor para o guia.

## 5. Escopo e taxonomia

Ver [`taxonomia.md`](taxonomia.md). Cada fato coletado é classificado em um domínio dessa taxonomia.

Fora de escopo (por ora): lore/história, cosmética sem efeito, detalhes de servidores chineses/versões regionais.

## 6. Fontes e confiabilidade

Ver [`fontes.md`](fontes.md). Hierarquia:

- **T1 – Oficial:** notas de patch, anúncios e textos do jogo (Lilith Games).
- **T2 – Dados primários de comunidade:** tabelas/calculadoras que citam valores do jogo e são verificáveis.
- **T3 – Guias de comunidade/criadores:** estratégia, opinião experiente.
- **T4 – Voz do jogador:** Reddit, Discord, comentários, reviews de loja — fonte para **dores**, não para mecânicas.

Regra: mecânica só é "verificada" com T1, T2 confirmado por 2 fontes independentes, ou observação direta no jogo.

## 7. Pipeline de dados e subagentes

Ver [`agentes.md`](agentes.md) para o contrato de cada agente.

```
 Coletor (por domínio) ──► raw/          (notas brutas + URL + data de acesso)
        │
 Organizador ───────────► facts/         (fichas normalizadas, deduplicadas, com conflitos marcados)
        │
 Verificador (adversarial)► facts/       (confiança ajustada; contradições e fatos desatualizados apontados)
        │
 Contextualizador ──────► context/       (pacotes de contexto compactos por tema, prontos para escrever guias)

 Coletor de dores ──────► pains/         (relatos de jogadores + classificação)
```

Formatos em [`schemas/`](schemas/).

## 8. Fases e checkpoints

| Fase | Entrega | Critério de "pronto" (checkpoint) |
|------|---------|-----------------------------------|
| **F0** Estrutura | Este plano, taxonomia, fontes, schemas, contratos de agentes | Revisado e aprovado por você |
| **F1** Piloto | 1 domínio completo (sugestão: *Prefeitura/prédios + aceleradores*) passando por todo o pipeline | Fichas no schema; ≥80% das mecânicas com fonte T1/T2; problemas do pipeline anotados e corrigidos |
| **F2** Coleta de mecânicas | Todos os domínios da taxonomia | Cobertura mínima por domínio (ver taxonomia); conflitos listados |
| **F3** Coleta de estratégia | Consenso/divergências por perfil e estágio do reino | Cada recomendação com nível de consenso e fontes |
| **F4** Voz do jogador | Banco de dores com frequência/gravidade | ≥ N relatos por dor relevante (definir N no piloto, sugestão 5) de ≥2 canais |
| **F5** Concorrência + ToS | Mapa de ferramentas existentes e restrições legais | Lista de ferramentas com o que resolvem/falham; resumo dos ToS relevantes |
| **F6** Context packs | `context/` por tema | Cada pack ≤ ~3–5 mil palavras, só fatos verificados/consensuais, com links às fichas |
| **F7** Guia de conta v1 | Guia por perfil × estágio × horas/dia | Cada passo justificado com fichas; revisão adversarial |
| **F8** Guia de admin de reino v1 | Guia de liderança/administração | Idem |
| **F9** Requisitos do sistema | Dores priorizadas → funcionalidades | Matriz dor × frequência × gravidade × viabilidade × concorrência |

Por que um piloto antes de escalar: rodar todos os coletores em paralelo com um schema não testado gera retrabalho em massa. O piloto valida schema, prompts e critérios em um domínio pequeno.

## 9. Riscos

- **Desatualização rápida** → campo obrigatório de data/versão; revisão por temporada.
- **Alucinação dos subagentes** (valores inventados) → toda ficha exige URL e trecho citado; verificador amostra e confere.
- **Viés de fonte** (só criadores populares/whales) → buscar explicitamente perspectiva F2P e de baixo gasto.
- **Volume sem utilidade** → coletar guiado pelas perguntas Q1–Q8 e pelo modelo do §4, não "tudo sobre RoK".
- **Bloqueio de acesso a fontes** (Discord fechado, sites com bot-protection) → registrar lacunas em vez de preencher com suposição.

## 10. Decisões em aberto (suas)

1. Idioma dos guias finais (PT-BR, EN ou ambos)?
2. Perfis prioritários para o guia v1 (ex.: F2P lutador e baixo gasto)?
3. Estágio de reino prioritário (reino novo vs. reinos em KvK/SoC)?
4. Você tem acesso a um reino/conta/Discord de aliança para observação direta e entrevistas? Isso é a fonte mais forte para dores.
5. Domínio do piloto (sugestão acima) — confirmar ou trocar.
