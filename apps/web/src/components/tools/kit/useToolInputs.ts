import { useEffect, useRef, useState } from "preact/hooks";
import { decodeShare, encodeShare, readToolsStore, writeInventory, writeToolInputs, type ToolInputs } from "../../../lib/tools-store";

export interface ToolInputsApi<T extends ToolInputs> {
  values: T;
  set: (patch: Partial<T>) => void;
  /** True when the values came from a ?s= share link (not saved until the user edits). */
  shared: boolean;
  shareUrl: () => string;
}

/**
 * Inputs of one calculator: defaults → saved values (ko:tools:v1) → ?s= share link.
 * Keys listed in `inventoryKeys` are read from and written to the shared inventory, so
 * other calculators see them (F-81 c). Saved values load after mount (static HTML shows defaults).
 */
export function useToolInputs<T extends ToolInputs>(tool: string, defaults: T, inventoryKeys: readonly (keyof T & string)[] = []): ToolInputsApi<T> {
  const [values, setValues] = useState<T>(defaults);
  const [shared, setShared] = useState(false);
  const ref = useRef(values);
  ref.current = values;

  useEffect(() => {
    const pick = (src: ToolInputs): Partial<T> => {
      const out: Partial<T> = {};
      for (const k of Object.keys(defaults) as (keyof T & string)[]) {
        const v = src[k];
        if (v !== undefined && typeof v === typeof defaults[k]) (out as ToolInputs)[k] = v;
      }
      return out;
    };
    const fromLink = decodeShare(new URLSearchParams(window.location.search).get("s"));
    if (fromLink) {
      setShared(true);
      setValues({ ...defaults, ...pick(fromLink) });
      return;
    }
    const s = readToolsStore();
    const inv: ToolInputs = {};
    for (const k of inventoryKeys) if (s.inventory[k] !== undefined) inv[k] = s.inventory[k]!;
    setValues({ ...defaults, ...pick(s.inputs[tool] ?? {}), ...pick(inv) });
    // defaults/inventoryKeys are static per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  const set = (patch: Partial<T>): void => {
    const next = { ...ref.current, ...patch } as T;
    ref.current = next;
    setValues(next);
    setShared(false);
    const own: ToolInputs = {}, inv: ToolInputs = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      if ((inventoryKeys as string[]).includes(k)) inv[k] = v as ToolInputs[string];
      else own[k] = v as ToolInputs[string];
    }
    if (Object.keys(own).length) writeToolInputs(tool, own);
    if (Object.keys(inv).length) writeInventory(inv);
  };

  const shareUrl = (): string => {
    const u = new URL(window.location.href);
    u.search = `?s=${encodeShare(ref.current)}`;
    u.hash = "";
    return u.toString();
  };

  return { values, set, shared, shareUrl };
}
