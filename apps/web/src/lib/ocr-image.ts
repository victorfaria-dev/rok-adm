// F-54 (experimental): pixel preparation before text reading. Pure: works on plain RGBA arrays, so the
// same code runs in the browser (from a canvas) and in tests. Each mode turns the text we want into dark
// strokes on white, which is what the English model reads best.

export interface Img {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row by row. */
  data: Uint8ClampedArray;
}

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * - `gray`: plain grey levels (dark text stays dark, e.g. a red code on a white photo).
 * - `light`: pixels whose darkest channel is above `level` become black: white or light-grey text on
 *   any colour (labels, numbers, the City Hall banner, the VIP points bar).
 * - `notDark`: pixels whose red channel is above `level` become black: also catches the pale-blue
 *   "(ID: …)" text on the blue profile panel, which is too faint for `light`.
 * - `gold`: yellow/gold pixels become black (the "VIP n" badge in the top-left corner).
 */
export type PrepMode = "gray" | "light" | "notDark" | "gold";

export interface Prep {
  /** Part of the source image, in source pixels. Defaults to the whole image. */
  rect?: Rect;
  /** Enlargement factor; small text reads better at 2 to 4. */
  scale: number;
  mode: PrepMode;
  /** Threshold for `light` and `notDark` (0..255). */
  level?: number;
}

export function clampRect(r: Rect, w: number, h: number): Rect {
  const x0 = Math.max(0, Math.min(w - 1, Math.floor(r.x0)));
  const y0 = Math.max(0, Math.min(h - 1, Math.floor(r.y0)));
  const x1 = Math.max(x0 + 1, Math.min(w, Math.ceil(r.x1)));
  const y1 = Math.max(y0 + 1, Math.min(h, Math.ceil(r.y1)));
  return { x0, y0, x1, y1 };
}

/** Crop, enlarge (bilinear) and turn into black-on-white (or grey) pixels. */
export function prepare(src: Img, p: Prep): { img: Img; rect: Rect; scale: number } {
  const rect = clampRect(p.rect ?? { x0: 0, y0: 0, x1: src.width, y1: src.height }, src.width, src.height);
  const scale = p.scale;
  const w = Math.max(1, Math.round((rect.x1 - rect.x0) * scale));
  const h = Math.max(1, Math.round((rect.y1 - rect.y0) * scale));
  const out = new Uint8ClampedArray(w * h * 4);
  const level = p.level ?? (p.mode === "notDark" ? 55 : 150);
  const sw = src.width, sd = src.data;
  const maxX = rect.x1 - 1, maxY = rect.y1 - 1;
  const px = [0, 0, 0];
  for (let y = 0; y < h; y++) {
    const fy = Math.min(maxY, Math.max(rect.y0, rect.y0 + (y + 0.5) / scale - 0.5));
    const iy = Math.floor(fy), ty = fy - iy, iy2 = Math.min(maxY, iy + 1);
    for (let x = 0; x < w; x++) {
      const fx = Math.min(maxX, Math.max(rect.x0, rect.x0 + (x + 0.5) / scale - 0.5));
      const ix = Math.floor(fx), tx = fx - ix, ix2 = Math.min(maxX, ix + 1);
      const a = (iy * sw + ix) * 4, b = (iy * sw + ix2) * 4, c = (iy2 * sw + ix) * 4, d = (iy2 * sw + ix2) * 4;
      for (let k = 0; k < 3; k++) {
        const top = sd[a + k]! + (sd[b + k]! - sd[a + k]!) * tx;
        const bot = sd[c + k]! + (sd[d + k]! - sd[c + k]!) * tx;
        px[k] = top + (bot - top) * ty;
      }
      const [r, g, bl] = px as [number, number, number];
      let v: number;
      if (p.mode === "gray") v = 0.299 * r + 0.587 * g + 0.114 * bl;
      else if (p.mode === "light") v = Math.min(r, g, bl) > level ? 0 : 255;
      else if (p.mode === "notDark") v = r > level ? 0 : 255;
      else v = r > 170 && g > 110 && bl < 120 && r - bl > 90 ? 0 : 255;
      const o = (y * w + x) * 4;
      out[o] = out[o + 1] = out[o + 2] = v;
      out[o + 3] = 255;
    }
  }
  return { img: { width: w, height: h, data: out }, rect, scale };
}
