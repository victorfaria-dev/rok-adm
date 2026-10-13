import { useEffect, useRef, useState } from "preact/hooks";
import { decodeShare, encodeShare, readToolsStore, writeInventory, writeToolInputs, type ToolInputs } from "../../../lib/tools-store";

/** Largest number accepted from storage or a link. */
const MAX_INPUT = 1e9;

export interface ToolInputsApi<T extends ToolInputs> {
  values: T;
  set: (patch: Partial<T>) => void;
  /** True when the values came from a ?s= share link (not saved until the user edits). */
  shared: boolean;
  shareUrl: () => string;
}

/**
 * Inputs of one calculator: defaults → saved values (ko:tools:v1) → keys carried by a ?s= share link.
 * Keys listed in `inventoryKeys` are read from and written to the shared inventory, so
 * other calculators see them (F-81 c). Saved values load after mount (static HTML shows defaults).
 */
export function useToolInputs<T extends ToolInputs>(tool: string, defaults: T, inventoryKeys: readonly (keyof T & string)[] = []): ToolInputsApi<T> {
  const [values, setValues] = useState<T>(defaults);
  const [shared, setShared] = useState(false);
  const ref = useRef(values);
  ref.current = values;

  useEffect(() => {
    // Only keys the calculator knows, with the default's type; numbers must be finite, >= 0 and sane
    // (links and storage can carry anything; each field still enforces its own limits on edit).
    const pick = (src: ToolInputs): Partial<T> => {
      const out: Partial<T> = {};
      for (const k of Object.keys(defaults) as (keyof T & string)[]) {
        const v = src[k];
        if (v === undefined || typeof v !== typeof defaults[k]) continue;
        if (typeof v === "number" && !(Number.isFinite(v) && v >= 0 && v <= MAX_INPUT)) continue;
        (out as ToolInputs)[k] = v;
      }
      return out;
    };
    const s = readToolsStore();
    const inv: ToolInputs = {};
    for (const k of inventoryKeys) if (s.inventory[k] !== undefined) inv[k] = s.inventory[k]!;
    const saved = { ...defaults, ...pick(s.inputs[tool] ?? {}), ...pick(inv) };
    // A share link overrides only the keys it carries; saved values are untouched until an edit.
    const fromLink = decodeShare(new URLSearchParams(window.location.search).get("s"));
    if (fromLink) setShared(true);
    const next = fromLink ? { ...saved, ...pick(fromLink) } : saved;
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
    if (shared) {
      // First edit after opening a link: keep everything on screen and drop ?s= so a reload shows saved values.
      setShared(false);
      persist(next);
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("s");
        window.history.replaceState(window.history.state, "", u.toString());
      } catch {
        // ignore
      }
      return;
    }
    persist(patch);
  };

  const shareUrl = (): string => {
    const u = new URL(window.location.href);
    u.search = `?s=${encodeShare(ref.current)}`;
    u.hash = "";
    return u.toString();
  };

  return { values, set, shared, shareUrl };
}
