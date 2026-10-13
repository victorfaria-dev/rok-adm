// UI helpers for the farm tools (/farms/choose/, /farms/build/, /farms/trading-post/).
// Pure: parsing what the player types, formatting numbers, and the saved-profile prefill.
// From @rokadm/planner: types plus the shared number parser (readQuantity, no fact data).
import type { SpendingProfile } from "@rokadm/core";
import { QUANTITY_ERROR_TEXT, readQuantity, type Resource } from "@rokadm/planner";
import { profileFromCode } from "./profile";

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
  return { ok: false, error: r.error === "fraction" ? "Use a whole number of resources." : QUANTITY_ERROR_TEXT[r.error] };
}

/** Whole number in [min, max] ("1,000" style commas not accepted: levels and counts are small). */
export function parseIntInRange(text: string, min: number, max: number): Parsed<number> {
  const s = text.trim();
  if (s === "") return null;
  if (!/^-?\d+$/.test(s)) return { ok: false, error: `Enter a whole number from ${min} to ${max}.` };
  const n = Number(s);
  if (n < min || n > max) return { ok: false, error: `${s} is out of range. Enter a number from ${min} to ${max}.` };
  return { ok: true, value: n };
}

/** Tax as a percent the player reads in game ("21", "21%", "12.5") → rate 0.21. Must be 0 to below 100. */
export function parsePercent(text: string): Parsed<number> {
  const s = text.trim().replace(/%$/, "").trim();
  if (s === "") return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Enter a percentage like 21 or 12.5." };
  const n = Number(s);
  if (n >= 100) return { ok: false, error: "Enter a percentage below 100." };
  return { ok: true, value: Math.round(n * 1e6) / 1e8 };
}

/** Value of a parse result, or null when empty or invalid. */
export const valueOf = <T,>(p: Parsed<T>): T | null => (p && p.ok ? p.value : null);
/** Error text of a parse result, or undefined. */
export const errorOf = <T,>(p: Parsed<T>): string | undefined => (p && !p.ok ? p.error : undefined);

const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** 1265823 → "1,265,823". */
export function formatAmount(n: number): string {
  return NUM.format(n);
}

/** 0.21 → "21%". */
export function formatPercent(rate: number): string {
  return `${PCT.format(rate * 100)}%`;
}

export const RESOURCE_LABEL: Record<Resource, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

/** "byzantium" → "Byzantium". */
export function civName(code: string): string {
  return code.charAt(0).toUpperCase() + code.slice(1);
}

/** "food", "wood", "stone" → "food, wood and stone". */
export function listText(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
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
