// City card banners (UX stage 1). Every account shows a default banner by its type (main or
// farm/alt), portrait 3:4 on every screen size (owner decision 2026-10-14); the user can replace it
// with their own image, cropped to 3:4 around a focal point they pick and compressed on the device. Until sign-in exists the custom images live in this browser (ko:banners:v1).
// The rest of the app only uses the BannerStore interface, so the auth work can swap in a synced
// store (Supabase storage) without touching the City Hall code.
import type { SavedProfile } from "./store";

export type AccountKind = "main" | "farm";
export const ACCOUNT_KINDS: readonly AccountKind[] = ["main", "farm"];
export const ACCOUNT_KIND_LABEL: Readonly<Record<AccountKind, string>> = { main: "Main account", farm: "Farm or alt" };

export const BANNERS_KEY = "ko:banners:v1";
/** Output size of a custom banner (3:4) and the most a stored data URL may take. */
export const BANNER_WIDTH = 600;
export const BANNER_HEIGHT = 800;
export const BANNER_ASPECT = 3 / 4;
export const BANNER_MAX_CHARS = 200_000;

/** Default banner files by account type (public/banners/, our own art; no game assets). */
export function defaultBanner(kind: AccountKind): { src: string; srcset: string } {
  return { src: `/banners/${kind}-portrait-480.webp`, srcset: `/banners/${kind}-portrait-480.webp 480w, /banners/${kind}-portrait-768.webp 768w` };
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

/**
 * The largest 3:4 window of a w×h image, placed by a focal point (fx, fy in 0..1, 0.5 = centre).
 * Same rule as CSS object-position, so the cropper's preview matches the saved image.
 */
export function cropAt(w: number, h: number, fx = 0.5, fy = 0.5, aspect = BANNER_ASPECT): { sx: number; sy: number; sw: number; sh: number } {
  const clamp = (x: number): number => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0.5));
  const sw = w / h > aspect ? Math.round(h * aspect) : w;
  const sh = w / h > aspect ? h : Math.round(w / aspect);
  return { sx: Math.round((w - sw) * clamp(fx)), sy: Math.round((h - sh) * clamp(fy)), sw, sh };
}

/**
 * Read a picked file, crop it to 16:9, scale it down and compress it until it fits the cap.
 * Browser only (canvas). Throws a message the user can act on.
 */
export async function prepareBanner(file: File, fx = 0.5, fy = 0.5): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file (JPEG, PNG or WebP).");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be read. Try another file.");
  }
  const c = cropAt(bitmap.width, bitmap.height, fx, fy);
  for (const [w, q] of [[BANNER_WIDTH, 0.82], [BANNER_WIDTH, 0.65], [480, 0.6]] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = Math.round(w / BANNER_ASPECT);
    canvas.getContext("2d")?.drawImage(bitmap, c.sx, c.sy, c.sw, c.sh, 0, 0, canvas.width, canvas.height);
    let url = canvas.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= BANNER_MAX_CHARS) return url;
  }
  throw new Error("This image is too detailed to store on this device. Try a simpler or smaller image.");
}
