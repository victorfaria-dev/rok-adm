// Alliance crest (F-61, experimental): shield shape + alliance colour + tag + emblem, kept in its own key.
// All geometry is original and lives here as polygons in a 100 × 120 box (y down), so the in-page SVG,
// the exported SVG/PNG and the 3D extrusion draw exactly the same shapes. No game art.
import { ALLIANCE_COLORS, ALLIANCE_COLOR_NAMES, isAllianceColor, validateTag, type AllianceColor } from "./card";

export const CREST_KEY = "ko:crest:v1";
export const CREST_W = 100;
export const CREST_H = 120;

export type Point = readonly [number, number];

/** Sample a quadratic Bézier from a to b (excluding a) in n steps. */
function quad(a: Point, c: Point, b: Point, n = 12): Point[] {
  const out: Point[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

function circle(cx: number, cy: number, r: number, n = 48): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

/** Shield outlines, clockwise, inside the 100 × 120 box. */
export const SHIELDS = {
  heater: [[8, 8], [92, 8], [92, 60], ...quad([92, 60], [92, 96], [50, 114]), ...quad([50, 114], [8, 96], [8, 60])],
  kite: [[50, 6], [90, 26], [80, 80], [50, 114], [20, 80], [10, 26]],
  round: circle(50, 62, 48),
  banner: [[10, 8], [90, 8], [90, 112], [50, 96], [10, 112]],
  bastion: [[22, 8], [78, 8], [92, 22], [92, 80], [50, 114], [8, 80], [8, 22]],
} satisfies Record<string, Point[]>;
export type ShieldShape = keyof typeof SHIELDS;
export const SHIELD_SHAPES = Object.keys(SHIELDS) as ShieldShape[];
export const SHIELD_LABELS: Record<ShieldShape, string> = {
  heater: "Clássico", kite: "Pipa", round: "Redondo", banner: "Estandarte", bastion: "Bastião",
};

function star(points: number, outer: number, inner: number): Point[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    return [r * Math.cos(a), r * Math.sin(a)] as const;
  });
}

/** Emblems: one simple polygon each, in a unit box [-1, 1] (y down). Drawn for KingdomOps, not from the game. */
export const EMBLEMS = {
  star: star(5, 1, 0.42),
  crown: [[-0.9, 0.6], [0.9, 0.6], [1, -0.6], [0.5, -0.05], [0, -0.75], [-0.5, -0.05], [-1, -0.6]],
  tower: [
    [-0.7, 1], [0.7, 1], [0.55, -0.4], [0.75, -0.4], [0.75, -0.9], [0.45, -0.9], [0.45, -0.65], [0.15, -0.65],
    [0.15, -0.9], [-0.15, -0.9], [-0.15, -0.65], [-0.45, -0.65], [-0.45, -0.9], [-0.75, -0.9], [-0.75, -0.4], [-0.55, -0.4],
  ],
  chevron: [[-1, 0.2], [0, -0.6], [1, 0.2], [1, 0.65], [0, -0.15], [-1, 0.65]],
  bolt: [[0.2, -1], [-0.6, 0.15], [-0.05, 0.15], [-0.25, 1], [0.6, -0.2], [0.05, -0.2]],
  sword: [
    [0, -1], [0.12, -0.8], [0.12, 0.35], [0.45, 0.35], [0.45, 0.48], [0.1, 0.48], [0.1, 0.85], [0.2, 0.85], [0.2, 1],
    [-0.2, 1], [-0.2, 0.85], [-0.1, 0.85], [-0.1, 0.48], [-0.45, 0.48], [-0.45, 0.35], [-0.12, 0.35], [-0.12, -0.8],
  ],
} satisfies Record<string, Point[]>;
export type Emblem = keyof typeof EMBLEMS;
export const EMBLEM_NAMES = Object.keys(EMBLEMS) as Emblem[];
export const EMBLEM_LABELS: Record<Emblem, string> = {
  star: "Estrela", crown: "Coroa", tower: "Torre", chevron: "Divisa", bolt: "Raio", sword: "Espada",
};

/** Where the emblem and the tag band sit, the same for every shield (tested to stay inside each outline). */
export const EMBLEM_BOX = { cx: 50, cy: 44, half: 20 } as const;
export const TAG_BAND = { x: 26, y: 70, w: 48, h: 16 } as const;
export const TAG_FONT = 11;

export interface CrestV1 {
  v: 1;
  shape: ShieldShape;
  color: AllianceColor;
  tag: string;
  emblem: Emblem;
}

export function defaultCrest(): CrestV1 {
  return { v: 1, shape: "heater", color: "cobalt", tag: "", emblem: "star" };
}

export const isShieldShape = (x: unknown): x is ShieldShape => typeof x === "string" && Object.prototype.hasOwnProperty.call(SHIELDS, x);
export const isEmblem = (x: unknown): x is Emblem => typeof x === "string" && Object.prototype.hasOwnProperty.call(EMBLEMS, x);
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Tolerant parse: null when there is nothing usable; any bad field falls back to its default. */
export function parseCrest(raw: string | null | undefined): CrestV1 | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.v !== 1) return null;
  const c = defaultCrest();
  if (isShieldShape(data.shape)) c.shape = data.shape;
  if (isAllianceColor(data.color)) c.color = data.color;
  if (typeof data.tag === "string") c.tag = validateTag(data.tag).value;
  if (isEmblem(data.emblem)) c.emblem = data.emblem;
  return c;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** The saved crest, or null when none was saved (or it is unreadable). */
export function readSavedCrest(st: StorageLike | null = storage()): CrestV1 | null {
  try {
    return parseCrest(st?.getItem(CREST_KEY));
  } catch {
    return null;
  }
}

/** Merge a patch into the stored crest. Never touches other keys. Returns the new state even when storage fails. */
export function writeCrest(patch: Partial<Omit<CrestV1, "v">>, st: StorageLike | null = storage()): CrestV1 {
  const next: CrestV1 = { ...(readSavedCrest(st) ?? defaultCrest()), ...patch, v: 1 };
  try {
    st?.setItem(CREST_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep the in-memory state for this page.
  }
  return next;
}

const r2 = (n: number): string => String(Math.round(n * 100) / 100);

export function pathOf(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${r2(x)} ${r2(y)}`).join("") + "Z";
}

/** Emblem polygon placed in the emblem box (crest coordinates). */
export function emblemPoints(e: Emblem): Point[] {
  return EMBLEMS[e].map(([x, y]) => [EMBLEM_BOX.cx + x * EMBLEM_BOX.half, EMBLEM_BOX.cy + y * EMBLEM_BOX.half] as const);
}

/** Even–odd point-in-polygon. */
export function insidePolygon([x, y]: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export interface CrestLayout {
  shield: string;
  emblem: string;
  /** null when there is no tag: the band is not drawn. */
  tag: { text: string; band: typeof TAG_BAND; x: number; y: number; size: number } | null;
}

export function crestLayout(c: CrestV1): CrestLayout {
  return {
    shield: pathOf(SHIELDS[c.shape]),
    emblem: pathOf(emblemPoints(c.emblem)),
    tag: c.tag ? { text: `[${c.tag}]`, band: TAG_BAND, x: TAG_BAND.x + TAG_BAND.w / 2, y: TAG_BAND.y + TAG_BAND.h / 2, size: TAG_FONT } : null,
  };
}

/** Resolved colours for files that leave the page (SVG/PNG): read from the --ko-* tokens at export time. */
export interface CrestPalette {
  field: string;
  rim: string;
  emblem: string;
  band: string;
  ink: string;
}

export const TAG_FONT_STACK = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
export const RIM_WIDTH = 4;

const esc = (s: string): string => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** Standalone SVG file. Tag is already [A-Z0-9]{2,4}; escaped anyway. */
export function crestSvg(c: CrestV1, p: CrestPalette): string {
  const l = crestLayout(c);
  const tag = l.tag
    ? `<rect x="${l.tag.band.x}" y="${l.tag.band.y}" width="${l.tag.band.w}" height="${l.tag.band.h}" fill="${esc(p.band)}"/>` +
      `<text x="${l.tag.x}" y="${l.tag.y}" fill="${esc(p.ink)}" font-family='${TAG_FONT_STACK}' font-weight="700" font-size="${l.tag.size}" text-anchor="middle" dominant-baseline="central">${esc(l.tag.text)}</text>`
    : "";
  const title = c.tag ? `[${c.tag}] brasão da aliança` : "Brasão da aliança";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${CREST_W + 8} ${CREST_H + 8}" width="${(CREST_W + 8) * 4}" height="${(CREST_H + 8) * 4}">` +
    `<title>${esc(title)}</title>` +
    `<path d="${l.shield}" fill="${esc(p.field)}" stroke="${esc(p.rim)}" stroke-width="${RIM_WIDTH}" stroke-linejoin="round"/>` +
    `<path d="${l.emblem}" fill="${esc(p.emblem)}"/>` +
    tag +
    `</svg>`
  );
}

export const PNG_SIZE = 1024;
const PNG_FILL = 0.86;

/** Fit the 100 × 120 crest (plus the rim) centred in a square canvas. */
export function pngLayout(size = PNG_SIZE): { scale: number; x: number; y: number } {
  const w = CREST_W + RIM_WIDTH, h = CREST_H + RIM_WIDTH;
  const scale = (size * PNG_FILL) / Math.max(w, h);
  return { scale, x: (size - CREST_W * scale) / 2, y: (size - CREST_H * scale) / 2 };
}

/** File name: kingdomops-crest[-tag].ext */
export function crestFileName(c: CrestV1, ext: "svg" | "png"): string {
  return c.tag ? `kingdomops-crest-${c.tag.toLowerCase()}.${ext}` : `kingdomops-crest.${ext}`;
}

export function describeCrest(c: CrestV1): string {
  const tag = c.tag ? ` com a sigla [${c.tag}]` : "";
  return `Escudo ${SHIELD_LABELS[c.shape].toLowerCase()} em ${ALLIANCE_COLOR_NAMES[c.color].toLowerCase()}, emblema ${EMBLEM_LABELS[c.emblem].toLowerCase()}${tag}.`;
}

export { ALLIANCE_COLORS, ALLIANCE_COLOR_NAMES };
