# Motion do logo KingdomOps — roteiro v1

Animatic gerado por `design/tools/build_logo_motion.py` a partir dos vetores do kit (`design/brand/svg/`), sem alterar as formas.
Saídas: `storyboard.png`, `keyframes/`, `kingdomops-intro.mp4` (4,2 s) e `kingdomops-sting.mp4` (1,6 s), em 1920×1080 a 30 fps.

**Ideia:** "operações + reino". O K é montado como uma peça de engenharia: as três facetas encaixam, travam, e o nome entra em ordem.
**Tom:** preciso, pesado, rápido. Sem partículas, fogo, brilho exagerado ou pergaminho.

## Versões

| Versão | Duração | Uso |
|---|---|---|
| Intro | 4,2 s | abertura de vídeo, landing page, apresentação |
| Sting | 1,6 s | splash do app, transições, fim de vídeo curto (só o K, cenas 1–3) |

## Cenas (intro)

| # | Tempo | Cena | O que acontece | Movimento | Som |
|---|---|---|---|---|---|
| 1 | 0,05–1,05 s | Corte | Fundo grafite com vinheta suave. Uma linha bronze fina corta a tela na diagonal do braço do K. Ela some quando a peça principal chega. | Desenho da linha com ease-out cubic (0,5 s); fade-out 0,75–1,05 s | "shhk" metálico curto, como uma lâmina |
| 2 | 0,35–1,10 s | Montagem | As três facetas entram pelos próprios eixos. Haste e braço vêm de cima-direita, ao longo da diagonal; o bloco de cima desce; a perna vem de baixo-direita. | 0,55 s cada, ease-out-back (overshoot leve); entradas em 0,35 / 0,45 / 0,55 s | três "tk" secos, um por faceta |
| 3 | 1,02–1,40 s | Trava | O K trava: pulso de escala de 4,5% e uma faixa de luz que cruza só o K. | pulso em seno (0,2 s); faixa com ease-out cubic | "clank" grave de trava |
| 4 | 1,30–2,40 s | Desliza | O K desliza para a esquerda até a posição do lockup. KINGDOM sobe letra por letra, saindo de uma linha de base cortada. | K: ease-in-out cubic (0,65 s). Letras: ease-out quint (0,45 s), 60 ms entre letras | whoosh baixo + ticks curtos por letra |
| 5 | 2,20–2,75 s | OPS | O, P e S batem em bronze: escala 135% → 100% com dois rastros. Tremida de câmera de 6 px que se dissipa. | 0,22 s por letra, 70 ms entre letras; tremida 2,40–2,75 s | impacto grave ("boom" curto) no S |
| 6 | 2,95–4,20 s | Assinatura | Uma faixa de luz atravessa o lockup inteiro; depois o lockup fica parado. | ease-in-out cubic (0,7 s); hold ≥ 0,5 s | cauda do impacto, silêncio no hold |

## Regras

- O frame final é sempre o lockup oficial (`kingdomops-horizontal-dark.svg`), sem escala, giro ou efeito residual.
- A luz das varreduras só existe durante a animação. O logo parado continua plano, como o kit pede.
- Fundo: grafite `#101214` com vinheta leve. Sobre fundo claro, use a versão light e corte as varreduras (elas somem no marfim).
- Respeite reduced-motion no app: mostre o logo parado ou faça só um fade de 200 ms.
- Nada de assets da Lilith/Rise of Kingdoms: nem som, nem música, nem textura.

## Próximos passos (produção final)

1. Revisar este animatic: ritmo, ordem das facetas, intensidade da tremida.
2. Produção final em After Effects ou Rive, partindo dos SVGs do kit. Para web/app, exportar Lottie ou Rive (vetorial, leve). Para vídeo, MP4/ProRes com alfa.
3. Design de som: biblioteca livre de royalties (ex.: licença própria ou CC0); os efeitos acima são a lista de busca.
4. Formatos extras: 1:1 e 9:16 (logo compacto, cenas 4–5 em duas linhas) para redes sociais.
