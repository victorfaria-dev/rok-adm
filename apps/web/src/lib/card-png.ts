// Flat 1080×1080 PNG of the governor card (the downloadable avatar in F-60). Loaded on demand by the island.
// Colors come from the --ko-* tokens at draw time, so the PNG matches the brand without any literal color here.
import type { CardData } from "./card";
import { K_PATHS, K_VIEWBOX } from "./k-icon";
import { RARITY_LABELS } from "./rarity";

export const PNG_SIZE = 1080;

const DISPLAY = '"Chakra Petch", "Segoe UI", system-ui, sans-serif';
const BODY = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

/** Read a --ko-* token's computed value ("" when missing). */
export function token(name: string, root: Element = document.documentElement): string {
  return getComputedStyle(root).getPropertyValue(`--ko-${name}`).trim();
}

type RGB = [number, number, number];

/** Parse "#rgb", "#rrggbb" or "rgb(r g b)" / "rgb(r, g, b)". Falls back to mid gray. */
export function parseColor(s: string): RGB {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map((c) => c + c).join("") : hex[1]!;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const nums = s.match(/[\d.]+/g)?.map(Number);
  if (nums && nums.length >= 3) return [nums[0]!, nums[1]!, nums[2]!];
  return [128, 128, 128];
}

const rgba = ([r, g, b]: RGB, a = 1): string => `rgba(${r}, ${g}, ${b}, ${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * t)) as RGB;

/** Ensure the three brand fonts are usable on the canvas before drawing. Never throws. */
export async function fontsReady(): Promise<void> {
  try {
    await document.fonts.ready;
    await Promise.all([`700 80px ${DISPLAY}`, `600 36px ${DISPLAY}`, `500 36px ${BODY}`, `400 32px ${MONO}`].map((f) => document.fonts.load(f)));
  } catch {
    // Fonts missing: the fallback stack still draws.
  }
}

/** Shorten text until it fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let t = text;
  while (t.length > 1 && ctx.measureText(t).width > maxWidth) t = t.slice(0, -2) + "…";
  return t;
}

function chamfer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.beginPath();
  ctx.moveTo(x + c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c);
  ctx.closePath();
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, bg: string | null, font: string): number {
  ctx.font = font;
  const padX = 22, h = 56;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  ctx.lineWidth = 3;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); }
  else { ctx.strokeStyle = color; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
  ctx.fillStyle = color;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  return w;
}

/** Draw the card flat (no tilt) on a square canvas. */
export function drawCard(ctx: CanvasRenderingContext2D, d: CardData, size = PNG_SIZE): void {
  const ink = parseColor(token("alliance-ink") || token("graphite"));
  const ivory = parseColor(token("ivory"));
  const bronze = parseColor(token("bronze"));
  const ally = parseColor(token(`alliance-${d.color}`));
  const rar = parseColor(token(`rarity-${d.rarity}`));
  const frame: RGB = d.rarity === "common" ? mix(rar, ink, 0.2) : d.rarity === "rare" ? mix(rar, ivory, 0.45) : rar;

  // Table + face: ink with the alliance color glowing from the top.
  ctx.fillStyle = rgba(ink);
  ctx.fillRect(0, 0, size, size);
  const face = ctx.createLinearGradient(0, 0, size * 0.4, size);
  face.addColorStop(0, rgba(mix(ally, ink, 0.3)));
  face.addColorStop(0.6, rgba(mix(ally, ink, 0.82)));
  face.addColorStop(1, rgba(ink));
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, size, size);
  const halo = ctx.createRadialGradient(size / 2, 0, 0, size / 2, 0, size * 0.75);
  halo.addColorStop(0, rgba(ally, 0.55));
  halo.addColorStop(1, rgba(ally, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Foil: rare = silver, epic = violet, legendary = gold. Common stays matte.
  if (d.rarity !== "common") {
    const foil = ctx.createLinearGradient(0, size, size, 0);
    const a = d.rarity === "rare" ? 0.14 : 0.22;
    const c1 = d.rarity === "legendary" ? parseColor(token("alliance-amber")) : d.rarity === "epic" ? parseColor(token("alliance-indigo")) : ivory;
    const c2 = d.rarity === "legendary" ? ivory : d.rarity === "epic" ? parseColor(token("alliance-orchid")) : parseColor(token("rarity-rare"));
    foil.addColorStop(0, rgba(c1, 0)); foil.addColorStop(0.35, rgba(c1, a)); foil.addColorStop(0.5, rgba(ivory, a * 0.8));
    foil.addColorStop(0.65, rgba(c2, a)); foil.addColorStop(1, rgba(c2, 0));
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, size, size);
  }
  // Legendary: a light sweep frozen mid-way.
  if (d.rarity === "legendary") {
    const sweep = ctx.createLinearGradient(size * 0.2, 0, size * 0.8, size);
    sweep.addColorStop(0.42, rgba(ivory, 0)); sweep.addColorStop(0.5, rgba(ivory, 0.28)); sweep.addColorStop(0.58, rgba(ivory, 0));
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, size, size);
  }

  // Frame: chamfered, rarity colored, thicker as the tier rises.
  const inset = 36, width = d.rarity === "legendary" ? 16 : d.rarity === "common" ? 8 : 12;
  chamfer(ctx, inset, inset, size - inset * 2, size - inset * 2, 40);
  ctx.lineWidth = width;
  ctx.strokeStyle = rgba(frame);
  ctx.stroke();
  if (d.rarity !== "common") {
    chamfer(ctx, inset + width + 6, inset + width + 6, size - (inset + width + 6) * 2, size - (inset + width + 6) * 2, 32);
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(frame, 0.55);
    ctx.stroke();
  }

  // Top row: rarity pill (left), proof (right).
  const label = `${RARITY_LABELS[d.rarity].toUpperCase()} · CITY HALL ${d.cityHall}`;
  pill(ctx, label, 92, 92, rgba(mix(rar, ivory, d.rarity === "common" ? 0.5 : 0.3)), null, `600 30px ${DISPLAY}`);
  ctx.font = `400 28px ${MONO}`;
  ctx.fillStyle = rgba(ivory, 0.75);
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillText("SELF-REPORTED", size - 92, 120);
  if (d.example) {
    ctx.fillStyle = rgba(ivory, 0.9);
    ctx.font = `600 26px ${DISPLAY}`;
    ctx.fillText("EXAMPLE", size - 92, 164);
  }

  // Avatar: alliance ring with the brand K.
  const cx = size / 2, cy = 400, r = 170;
  ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.fillStyle = rgba(frame); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = rgba(ally); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.fillStyle = rgba(mix(ink, ally, 0.12)); ctx.fill();
  const kScale = (r * 1.05) / Math.max(K_VIEWBOX.w, K_VIEWBOX.h);
  ctx.save();
  ctx.translate(cx - (K_VIEWBOX.w * kScale) / 2 - K_VIEWBOX.x * kScale, cy - (K_VIEWBOX.h * kScale) / 2 - K_VIEWBOX.y * kScale);
  ctx.scale(kScale, kScale);
  ctx.fillStyle = rgba(bronze);
  for (const p of K_PATHS) ctx.fill(new Path2D(p));
  ctx.restore();

  // Name and tag.
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = rgba(d.rarity === "legendary" ? mix(ivory, rar, 0.25) : ivory);
  ctx.font = `700 ${d.name.length > 12 ? 72 : 88}px ${DISPLAY}`;
  ctx.fillText(fit(ctx, d.name, size - 200), cx, 712);
  if (d.tag) {
    ctx.font = `700 40px ${MONO}`;
    const t = `[${d.tag}]`;
    const w = ctx.measureText(t).width + 40;
    ctx.fillStyle = rgba(ally);
    ctx.fillRect(cx - w / 2, 744, w, 62);
    ctx.fillStyle = rgba(ink);
    ctx.textBaseline = "middle";
    ctx.fillText(t, cx, 777);
  }

  // Marks: spending profile and F2P Achiever, centered.
  const marks: Array<[string, boolean]> = [[d.spendingLabel.toUpperCase(), false]];
  if (d.f2pAchiever) marks.push(["F2P ACHIEVER", true]);
  ctx.font = `600 30px ${DISPLAY}`;
  const widths = marks.map(([t]) => Math.ceil(ctx.measureText(t).width) + 44);
  let x = cx - (widths.reduce((a, b) => a + b, 0) + (marks.length - 1) * 16) / 2;
  for (const [t, strong] of marks) {
    const color = strong ? rgba(mix(parseColor(token("profile-f2p") || token("success")), ivory, 0.35)) : rgba(ivory, 0.9);
    x += pill(ctx, t, x, 856, color, strong ? rgba(ink, 0.45) : null, `600 30px ${DISPLAY}`) + 16;
  }

  // Footer.
  ctx.font = `400 26px ${MONO}`;
  ctx.fillStyle = rgba(ivory, 0.6);
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("KINGDOMOPS · GOVERNOR CARD", 92, size - 108);
  ctx.textAlign = "right";
  ctx.fillText("NOT AFFILIATED WITH LILITH GAMES", size - 92, size - 108);
}

/** Render to a PNG blob at 1080×1080. Rejects when the canvas is unavailable. */
export async function renderCardPng(d: CardData): Promise<Blob> {
  await fontsReady();
  const canvas = document.createElement("canvas");
  canvas.width = PNG_SIZE; canvas.height = PNG_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not draw the card.");
  drawCard(ctx, d);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Your browser could not save the PNG."))), "image/png");
  });
}
