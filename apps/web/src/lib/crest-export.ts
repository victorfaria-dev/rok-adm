// Crest exports (F-61): SVG file and 1024 × 1024 transparent PNG. Loaded on demand by the island.
// Colours are read from the --ko-* tokens at export time, so no literal colour lives here.
import {
  crestLayout, crestSvg, pngLayout, PNG_SIZE, RIM_WIDTH, TAG_FONT_STACK, type CrestPalette, type CrestV1,
} from "./crest";

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--ko-${name}`).trim();
}

export function crestPalette(c: CrestV1): CrestPalette {
  const ink = token("alliance-ink") || token("graphite");
  return { field: token(`alliance-${c.color}`), rim: token("bronze"), emblem: token("ivory"), band: ink, ink: token("ivory") };
}

export function crestSvgBlob(c: CrestV1): Blob {
  return new Blob([crestSvg(c, crestPalette(c))], { type: "image/svg+xml" });
}

/** Draw the flat crest on a canvas context of size × size (transparent background). */
export function drawCrest(ctx: CanvasRenderingContext2D, c: CrestV1, size = PNG_SIZE): void {
  const p = crestPalette(c);
  const l = crestLayout(c);
  const { scale, x, y } = pngLayout(size);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const shield = new Path2D(l.shield);
  ctx.fillStyle = p.field;
  ctx.fill(shield);
  ctx.lineWidth = RIM_WIDTH;
  ctx.lineJoin = "round";
  ctx.strokeStyle = p.rim;
  ctx.stroke(shield);
  ctx.fillStyle = p.emblem;
  ctx.fill(new Path2D(l.emblem));
  if (l.tag) {
    ctx.fillStyle = p.band;
    ctx.fillRect(l.tag.band.x, l.tag.band.y, l.tag.band.w, l.tag.band.h);
    ctx.fillStyle = p.ink;
    ctx.font = `700 ${l.tag.size}px ${TAG_FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(l.tag.text, l.tag.x, l.tag.y + 0.5);
  }
  ctx.restore();
}

export async function crestPngBlob(c: CrestV1, size = PNG_SIZE): Promise<Blob> {
  try {
    await document.fonts.load(`700 40px ${TAG_FONT_STACK}`);
  } catch {
    // Fallback font still draws.
  }
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu desenhar o brasão.");
  drawCrest(ctx, c, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Seu navegador não conseguiu salvar o PNG."))), "image/png");
  });
}

/** Start a browser download of a blob. */
export function saveBlob(blob: Blob, file: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
