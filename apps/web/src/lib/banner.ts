// City card banners (UX stage 1). Every account shows a default banner by its type (main or
// farm/alt); the user can replace it with their own image, which is cropped to 16:9 and compressed
// on the device. Until sign-in exists the custom images live in this browser (ko:banners:v1).
// The rest of the app only uses the BannerStore interface, so the auth work can swap in a synced
// store (Supabase storage) without touching the City Hall code.
import type { SavedProfile } from "./store";

export type AccountKind = "main" | "farm";
export const ACCOUNT_KINDS: readonly AccountKind[] = ["main", "farm"];
export const ACCOUNT_KIND_LABEL: Readonly<Record<AccountKind, string>> = { main: "Main account", farm: "Farm or alt" };

export const BANNERS_KEY = "ko:banners:v1";
/** Output size of a custom banner (16:9) and the most a stored data URL may take. */
export const BANNER_WIDTH = 960;
export const BANNER_HEIGHT = 540;
export const BANNER_MAX_CHARS = 160_000;

/** Default banner files by account type (our own art; no game assets). Missing files fall back to the token pattern. */
export function defaultBanner(kind: AccountKind): { src: string; srcHd: string } {
  return { src: `/banners/${kind}-640.webp`, srcHd: `/banners/${kind}-1280.webp` };
}

/** The account's type: its own field, else a farm role on its profile, else main for the first account. */
export function accountKind(a: Pick<SavedProfile, "kind">, index: number, profileRole?: string): AccountKind {
  if (a.kind && ACCOUNT_KINDS.includes(a.kind)) return a.kind;
  if (profileRole === "farm") return "farm";
  return index === 0 ? "main" : "farm";
}

/** Swappable banner storage, keyed by account id. A null image means "use the default". */
export interface BannerStore {
  getBanner(accountId: string): Promise<string | null>;
  setBanner(accountId: string, image: string | null): Promise<void>;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

const isImage = (x: unknown): x is string => typeof x === "string" && /^data:image\/(webp|jpeg|png);base64,/.test(x) && x.length <= BANNER_MAX_CHARS;

export function parseBanners(raw: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const d = raw ? JSON.parse(raw) : null;
    if (d && d.v === 1 && d.banners && typeof d.banners === "object") {
      for (const [id, img] of Object.entries(d.banners as Record<string, unknown>)) if (isImage(img)) out[id] = img;
    }
  } catch {
    // corrupted: no custom banners
  }
  return out;
}

/** This browser's banner store (compact data URLs in localStorage). */
export function localBannerStore(st: StorageLike | null = storage()): BannerStore {
  const read = (): Record<string, string> => {
    try {
      return parseBanners(st?.getItem(BANNERS_KEY));
    } catch {
      return {};
    }
  };
  return {
    async getBanner(id) {
      return read()[id] ?? null;
    },
    async setBanner(id, image) {
      if (image !== null && !isImage(image)) throw new Error("This image is too large or not a picture. Try a smaller one.");
      const all = read();
      if (image === null) delete all[id];
      else all[id] = image;
      try {
        st?.setItem(BANNERS_KEY, JSON.stringify({ v: 1, banners: all }));
      } catch {
        throw new Error("This browser has no room left for the image. Remove a custom banner or use a smaller image.");
      }
    },
  };
}

/** Centre crop of a w×h image to 16:9: the source rectangle to draw. */
export function cropTo16x9(w: number, h: number): { sx: number; sy: number; sw: number; sh: number } {
  const target = 16 / 9;
  if (w / h > target) {
    const sw = Math.round(h * target);
    return { sx: Math.round((w - sw) / 2), sy: 0, sw, sh: h };
  }
  const sh = Math.round(w / target);
  return { sx: 0, sy: Math.round((h - sh) / 2), sw: w, sh };
}

/**
 * Read a picked file, crop it to 16:9, scale it down and compress it until it fits the cap.
 * Browser only (canvas). Throws a message the user can act on.
 */
export async function prepareBanner(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file (JPEG, PNG or WebP).");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be read. Try another file.");
  }
  const c = cropTo16x9(bitmap.width, bitmap.height);
  for (const [w, q] of [[BANNER_WIDTH, 0.82], [BANNER_WIDTH, 0.65], [640, 0.6]] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = Math.round((w * 9) / 16);
    canvas.getContext("2d")?.drawImage(bitmap, c.sx, c.sy, c.sw, c.sh, 0, 0, canvas.width, canvas.height);
    let url = canvas.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= BANNER_MAX_CHARS) return url;
  }
  throw new Error("This image is too detailed to store on this device. Try a simpler or smaller image.");
}
