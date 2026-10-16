// Device-local state of the /tools/ kit (F-81), in its own key so the app store (ko:v1) is untouched.
// Tolerant like lib/store.ts: missing, corrupted or blocked storage falls back to defaults.

export type ToolValue = number | string | boolean;
export type ToolInputs = Record<string, ToolValue>;

export interface ToolsStoreV1 {
  v: 1;
  /** Shared inventory (F-81 c): values typed in one calculator show up in the others. */
  inventory: ToolInputs;
  /** Per-tool inputs, keyed by tool id. */
  inputs: Record<string, ToolInputs>;
  /** Checklists: list id → checked item ids. */
  checks: Record<string, string[]>;
}

export const TOOLS_KEY = "ko:tools:v1";

export function defaultToolsStore(): ToolsStoreV1 {
  return { v: 1, inventory: {}, inputs: {}, checks: {} };
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isValue = (x: unknown): x is ToolValue =>
  (typeof x === "number" && Number.isFinite(x)) || typeof x === "boolean" || (typeof x === "string" && x.length <= 500);

/** Keep only well-formed primitive values (drops NaN, objects, long strings). */
export function cleanInputs(x: unknown): ToolInputs {
  const out: ToolInputs = {};
  if (!isRecord(x)) return out;
  for (const [k, v] of Object.entries(x)) if (k.length <= 64 && isValue(v)) out[k] = v;
  return out;
}

export function parseToolsStore(raw: string | null | undefined): ToolsStoreV1 {
  const s = defaultToolsStore();
  if (!raw) return s;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return s;
  }
  if (!isRecord(data) || data.v !== 1) return s;
  s.inventory = cleanInputs(data.inventory);
  if (isRecord(data.inputs)) for (const [k, v] of Object.entries(data.inputs)) s.inputs[k] = cleanInputs(v);
  if (isRecord(data.checks)) {
    for (const [k, v] of Object.entries(data.checks)) {
      if (Array.isArray(v)) s.checks[k] = [...new Set(v.filter((x): x is string => typeof x === "string"))];
    }
  }
  return s;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readToolsStore(st: StorageLike | null = storage()): ToolsStoreV1 {
  try {
    return parseToolsStore(st?.getItem(TOOLS_KEY));
  } catch {
    return defaultToolsStore();
  }
}

function save(next: ToolsStoreV1, st: StorageLike | null): ToolsStoreV1 {
  try {
    st?.setItem(TOOLS_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep working in memory.
  }
  return next;
}

/** Merge values into one tool's inputs. */
export function writeToolInputs(tool: string, patch: ToolInputs, st: StorageLike | null = storage()): ToolsStoreV1 {
  const s = readToolsStore(st);
  s.inputs[tool] = { ...(s.inputs[tool] ?? {}), ...cleanInputs(patch) };
  return save(s, st);
}

/** Merge values into the shared inventory. */
export function writeInventory(patch: ToolInputs, st: StorageLike | null = storage()): ToolsStoreV1 {
  const s = readToolsStore(st);
  s.inventory = { ...s.inventory, ...cleanInputs(patch) };
  return save(s, st);
}

/** Replace the checked items of one checklist. */
export function writeChecks(list: string, ids: readonly string[], st: StorageLike | null = storage()): ToolsStoreV1 {
  const s = readToolsStore(st);
  s.checks[list] = [...new Set(ids)];
  return save(s, st);
}

export function clearToolsStore(st: StorageLike | null = storage()): void {
  try {
    st?.removeItem(TOOLS_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------- share links

/** Encode inputs for a share link (?s=). URL-safe base64 of compact JSON. */
export function encodeShare(inputs: ToolInputs): string {
  const json = JSON.stringify(cleanInputs(inputs));
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a share code; null when it isn't one. */
export function decodeShare(code: string | null | undefined): ToolInputs | null {
  if (!code || code.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const data: unknown = JSON.parse(json);
    return isRecord(data) ? cleanInputs(data) : null;
  } catch {
    return null;
  }
}
