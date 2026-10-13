# Clipes do mascote Sun Tzu

Gerados pelo Victor com o Veo 3 (imagem para vídeo, a partir da referência que ele criou). Roteiros: ver a conversa de 2026-10-13 (idle, talk, grumble, approve, greet, victory).

| Clipe | Fonte | Saída no site (`apps/web/public/mascot/`) |
|---|---|---|
| idle | `source/idle-veo.mp4` (1280×720, 10 s, 24 fps) | `idle-720.mp4`, `idle-480.mp4`, `idle-poster.webp` |

Processamento (ffmpeg): recorte quadrado 720×720 centrado no personagem (x=216), sem áudio, loop por crossfade de 0,6 s (fim → início), H.264 CRF 26/27, `+faststart`; poster = primeiro quadro (WebP).

Regras de uso: MP4 mudo, `muted playsinline loop`, `preload="metadata"`, poster, `aria-hidden` (o texto da bolha carrega o sentido), só o poster com `prefers-reduced-motion`, pausar fora da tela.
