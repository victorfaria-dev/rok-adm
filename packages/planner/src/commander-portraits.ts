// Commander portraits (owner decision, produto/backlog-pos-ux.md § Comandantes): small square WebP files served
// from our own site (apps/web/public/commanders/). The manifest keeps the source URL, retrieval date and attribution.
import portraitsJson from "../data/commander-portraits.json";

export type PortraitSize = 96 | 192;

export interface CommanderPortraitSource {
  id: string;
  sourceUrl: string;
  sourcePage: string;
  retrievedOn: string;
  attribution: string;
}

interface PortraitsFile { attribution: string; sizes: PortraitSize[]; path: string; portraits: CommanderPortraitSource[] }
const DATA = portraitsJson as unknown as PortraitsFile;

/** Show next to any portrait: "Rise of Kingdoms © Lilith Games". */
export const PORTRAIT_ATTRIBUTION: string = DATA.attribution;
export const PORTRAIT_SIZES: readonly PortraitSize[] = DATA.sizes;
export const COMMANDER_PORTRAITS: readonly CommanderPortraitSource[] = DATA.portraits;

const IDS = new Set(DATA.portraits.map((p) => p.id));

export function hasCommanderPortrait(id: string): boolean {
  return IDS.has(id);
}

export interface CommanderPortrait {
  /** Path of the requested size, e.g. /commanders/sun-tzu-96.webp */
  src: string;
  /** 1x/2x srcset (96 → 192). */
  srcset: string;
  width: PortraitSize;
  height: PortraitSize;
  attribution: string;
}

const pathFor = (id: string, size: PortraitSize): string => DATA.path.replace("{id}", id).replace("{size}", String(size));

/** Portrait for a commander id, or null when we have none (show the name instead). */
export function commanderPortrait(id: string, size: PortraitSize = 96): CommanderPortrait | null {
  if (!IDS.has(id)) return null;
  const srcset = size === 96 ? `${pathFor(id, 96)} 1x, ${pathFor(id, 192)} 2x` : `${pathFor(id, 192)} 1x`;
  return { src: pathFor(id, size), srcset, width: size, height: size, attribution: DATA.attribution };
}
