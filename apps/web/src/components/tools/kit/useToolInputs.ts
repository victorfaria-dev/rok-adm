import { useEffect, useRef, useState } from "preact/hooks";
import { decodeShare, encodeShare, readToolsStore, writeInventory, writeToolInputs, type ToolInputs } from "../../../lib/tools-store";

/** Largest number accepted from storage or a link. */
const MAX_INPUT = 1e9;

export interface ToolInputsApi<T extends ToolInputs> {
  values: T;
  set: (patch: Partial<T>) => void;
  /** True while the screen shows values from a ?s= share link and the user has not chosen yet. */
  shared: boolean;
  shareUrl: () => string;
  /** Leave the link: show the saved values (plus any field edited meanwhile) and drop ?s=. Writes nothing. */
  keepMine: () => void;
  /** Save every value on screen (link values and edits) as the user's own, and drop ?s=. */
  useLink: () => void;
}

/** Only keys the calculator knows, with the default's type; numbers must be finite, >= 0 and sane. */
export function pickInputs<T extends ToolInputs>(defaults: T, src: ToolInputs): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(defaults) as (keyof T & string)[]) {
    const v = src[k];
    if (v === undefined || typeof v !== typeof defaults[k]) continue;
    if (typeof v === "number" && !(Number.isFinite(v) && v >= 0 && v <= MAX_INPUT)) continue;
    (out as ToolInputs)[k] = v;
  }
  return out;
}

function dropShareParam(): void {
  try {
    const u = new URL(window.location.href);
    u.searchParams.delete("s");
    window.history.replaceState(window.history.state, "", u.toString());
  } catch {
    // ignore
  }
}

/**
 * Inputs of one calculator: defaults → saved values (ko:tools:v1) → keys carried by a ?s= share link.
 * Keys listed in `inventoryKeys` are read from and written to the shared inventory, so
 * other calculators see them (F-81 c). Saved values load after mount (static HTML shows defaults).
 *
 * Share links never overwrite saved values on their own (Q2 P1-2): while the link's values are on
 * screen, an edit saves only the edited key; everything else waits for "Keep mine" / "Use link values".
 */
export function useToolInputs<T extends ToolInputs>(tool: string, defaults: T, inventoryKeys: readonly (keyof T & string)[] = []): ToolInputsApi<T> {
  const [values, setValues] = useState<T>(defaults);
  const [shared, setShared] = useState(false);
  const ref = useRef(values);
  ref.current = values;

  const readSaved = (): T => {
    const s = readToolsStore();
    const inv: ToolInputs = {};
    for (const k of inventoryKeys) if (s.inventory[k] !== undefined) inv[k] = s.inventory[k]!;
    return { ...defaults, ...pickInputs(defaults, s.inputs[tool] ?? {}), ...pickInputs(defaults, inv) };
  };

  useEffect(() => {
    const saved = readSaved();
    // A share link overrides only the keys it carries; saved values are untouched until the user chooses.
    const fromLink = decodeShare(new URLSearchParams(window.location.search).get("s"));
    if (fromLink) setShared(true);
    const next = fromLink ? { ...saved, ...pickInputs(defaults, fromLink) } : saved;
    ref.current = next;
    setValues(next);
    // defaults/inventoryKeys are static per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  const persist = (vals: Partial<T>): void => {
    const own: ToolInputs = {}, inv: ToolInputs = {};
    for (const [k, v] of Object.entries(vals)) {
      if (v === undefined) continue;
      if ((inventoryKeys as string[]).includes(k)) inv[k] = v as ToolInputs[string];
      else own[k] = v as ToolInputs[string];
    }
    if (Object.keys(own).length) writeToolInputs(tool, own);
    if (Object.keys(inv).length) writeInventory(inv);
  };

  const set = (patch: Partial<T>): void => {
    const next = { ...ref.current, ...patch } as T;
    ref.current = next;
    setValues(next);
    // Link or not, only what the user typed is saved.
    persist(patch);
  };

  const keepMine = (): void => {
    const next = readSaved();
    ref.current = next;
    setValues(next);
    setShared(false);
    dropShareParam();
  };

  const useLink = (): void => {
    persist(ref.current);
    setShared(false);
    dropShareParam();
  };

  const shareUrl = (): string => {
    const u = new URL(window.location.href);
    u.search = `?s=${encodeShare(ref.current)}`;
    u.hash = "";
    return u.toString();
  };

  return { values, set, shared, shareUrl, keepMine, useLink };
}
