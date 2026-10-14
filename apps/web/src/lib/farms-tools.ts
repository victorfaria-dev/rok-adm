// UI helpers for the farm tools (/farms/choose/, /farms/build/, /farms/trading-post/).
// Pure: parsing what the player types, formatting numbers, and the saved-profile prefill.
// From @rokadm/planner: types plus the shared number parser (readQuantity, no fact data).
import type { SpendingProfile } from "@rokadm/core";
import { readQuantity, type QuantityError, type Resource } from "@rokadm/planner";
import { profileFromCode } from "./profile";

/** Plain-language fix for each QuantityError (pt-BR copy). */
const QUANTITY_ERROR_TEXT: Readonly<Record<QuantityError, string>> = {
  empty: "Digite um número.",
  negative: "Digite 0 ou mais.",
  format: "Digite um número como 1500000, 1.5m ou 300k.",
  fraction: "Use um número inteiro.",
  too_large: "Esse número é grande demais.",
};

/** Parse result: null = the field is empty; otherwise a value or a how-to-fix error. */
export type Parsed<T> = null | { ok: true; value: T } | { ok: false; error: string };

/** Largest amount the tools accept (keeps every result finite and readable). */
export const MAX_AMOUNT = 1e15;

/**
 * Parse an amount the way players write it: "1500000", "1,500,000", "1.5m", "300k", "2B".
 * Same parser as every other number field (readQuantity in @rokadm/planner); whole numbers >= 0.
 */
export function parseAmount(text: string): Parsed<number> {
  const r = readQuantity(text, { max: MAX_AMOUNT });
  if (r.ok) return { ok: true, value: r.value };
  if (r.error === "empty") return null;
  return { ok: false, error: r.error === "fraction" ? "Use um número inteiro de recursos." : QUANTITY_ERROR_TEXT[r.error] };
}

/** Whole number in [min, max] ("1,000" style commas not accepted: levels and counts are small). */
export function parseIntInRange(text: string, min: number, max: number): Parsed<number> {
  const s = text.trim();
  if (s === "") return null;
  if (!/^-?\d+$/.test(s)) return { ok: false, error: `Digite um número inteiro de ${min} a ${max}.` };
  const n = Number(s);
  if (n < min || n > max) return { ok: false, error: `${s} está fora do intervalo. Digite um número de ${min} a ${max}.` };
  return { ok: true, value: n };
}

/** Tax as a percent the player reads in game ("21", "21%", "12.5") → rate 0.21. Must be 0 to below 100. */
export function parsePercent(text: string): Parsed<number> {
  const s = text.trim().replace(/%$/, "").trim();
  if (s === "") return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Digite uma porcentagem como 21 ou 12.5." };
  const n = Number(s);
  if (n >= 100) return { ok: false, error: "Digite uma porcentagem abaixo de 100." };
  return { ok: true, value: Math.round(n * 1e6) / 1e8 };
}

/** Value of a parse result, or null when empty or invalid. */
export const valueOf = <T,>(p: Parsed<T>): T | null => (p && p.ok ? p.value : null);
/** Error text of a parse result, or undefined. */
export const errorOf = <T,>(p: Parsed<T>): string | undefined => (p && !p.ok ? p.error : undefined);

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** 1265823 → "1.265.823". */
export function formatAmount(n: number): string {
  return NUM.format(n);
}

/** 0.21 → "21%". */
export function formatPercent(rate: number): string {
  return `${PCT.format(rate * 100)}%`;
}

export const RESOURCE_LABEL: Record<Resource, string> = { food: "Comida", wood: "Madeira", stone: "Pedra", gold: "Ouro" };

const CIV_NAMES: Readonly<Record<string, string>> = {
  rome: "Roma", germany: "Alemanha", britain: "Grã-Bretanha", france: "França", spain: "Espanha", china: "China", japan: "Japão",
  korea: "Coreia", arabia: "Arábia", ottoman: "Otomanos", ottomans: "Otomanos", byzantium: "Bizâncio", vikings: "Vikings",
  maya: "Maias", egypt: "Egito", greece: "Grécia",
};

/** "byzantium" → "Bizâncio" (unknown codes are capitalised). */
export function civName(code: string): string {
  return CIV_NAMES[code.toLowerCase()] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

/** "comida", "madeira", "pedra" → "comida, madeira e pedra". */
export function listText(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

export interface ProfilePrefill {
  spending: SpendingProfile;
  minutesPerDay: number;
  cityHall: number;
}

/** The fields the farm tools take from the saved profile code (read-only), or null without a valid profile. */
export function prefillFromProfile(code: string | null): ProfilePrefill | null {
  const p = profileFromCode(code);
  return p ? { spending: p.spending, minutesPerDay: p.minutesPerDay, cityHall: p.cityHall } : null;
}

/** The ?farm=<id> query value, or null. */
export function farmIdFromSearch(search: string): string | null {
  try {
    const id = new URLSearchParams(search).get("farm");
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}
