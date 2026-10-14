# Integração com o jogo: o que existe no GitHub (2026-10-14)

Pesquisa feita para responder "dá para logar com a Lilith e sincronizar a conta?". Estrelas e datas vêm da busca do GitHub em 2026-10-14; os READMEs foram lidos por resumo, não na íntegra.

## Conclusão

- **API oficial / OAuth da Lilith: nenhuma encontrada.** Nenhum projeto usa login Lilith. A única fonte que fala disso é secundária (providers.apievangelist.com/providers/lilith-games/: sem portal ou API pública).
- O ecossistema inteiro funciona de dois jeitos: **OCR de prints do próprio jogador** ou **automação do cliente** (ADB/emulador, bots). Automação é o que regras de jogo costumam banir; o bot mais popular avisa que não sabe se a conta será banida.

## Projetos úteis como referência (sem automação)

| Projeto | O que faz | Licença | Uso para nós |
|---|---|---|---|
| [feels-dev/RokVision](https://github.com/feels-dev/RokVision) | API REST de OCR (PaddleOCR) sobre prints enviados: perfil, relatório de batalha, **inventário**, mapa, rally | MIT | Referência para a leitura de inventário adiada |
| [rokmonster/ocr](https://github.com/rokmonster/ocr) | OCR de prints com Tesseract + template matching | GPL-3.0 | Só ideias; não copiar código (GPL) |
| [rokbattles/rokbattles](https://github.com/rokbattles/rokbattles) | Plataforma comunitária de relatórios de batalha | MIT/Apache-2.0 | Captura dos relatórios não verificada |
| [thesimonho/rok-data](https://github.com/thesimonho/rok-data), [rok-talents](https://github.com/thesimonho/rok-talents) | Dados e análises estáticas, árvore de talentos | GPL-3.0 | Só ideias |
| [TheMaxi7/RoK-discord-bots](https://github.com/TheMaxi7/RoK-discord-bots) | Bots de Discord; usa a API de terceiros rokstats.online | MIT | rokstats.online não é da Lilith; origem dos dados não verificada |

## Fora do nosso limite (automação do cliente)

Dylan-Zheng/Rise-of-Kingdoms-Bot (148★), GabrielAgrela/ROKBOT e OSROKBOT, sonpiaz/4x-game-agent, RokTracker (ADB + OCR), roka, rok-scan-stats: tocam o jogo por emulador/ADB. Não usamos (regra do projeto: sem bots ou automação).
