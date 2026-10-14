// Resize and re-encode a picked image in the browser before upload: center crop to the target
// shape, scale down, WebP (JPEG when the browser cannot encode WebP), quality lowered until it fits
// the bucket limit. Re-encoding through a canvas also drops photo metadata (EXIF, GPS location).
import { IMAGE_KINDS, type ImageKind } from "./profile-rules";

export interface CropPlan {
  /** Source rectangle. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Output size (never larger than the source crop). */
  width: number;
  height: number;
}

/** Center-crop (cover) a w×h source to the target aspect and scale it down to at most target size. */
export function planCrop(w: number, h: number, targetW: number, targetH: number): CropPlan {
  if (!(w > 0 && h > 0)) throw new Error("Image has no size.");
  const target = targetW / targetH;
  let sw = w, sh = h;
  if (w / h > target) sw = Math.round(h * target);
  else sh = Math.round(w / target);
  const sx = Math.floor((w - sw) / 2), sy = Math.floor((h - sh) / 2);
  const scale = Math.min(1, targetW / sw);
  return { sx, sy, sw, sh, width: Math.max(1, Math.round(sw * scale)), height: Math.max(1, Math.round(sh * scale)) };
}

export const QUALITY_STEPS: readonly number[] = [0.85, 0.75, 0.65, 0.5, 0.4];

type Encode = (type: string, quality: number) => Promise<Blob | null>;

/** Try WebP, then JPEG, lowering quality until the blob fits. Null when nothing fits. */
export async function encodeToFit(encode: Encode, maxBytes: number): Promise<Blob | null> {
  for (const type of ["image/webp", "image/jpeg"]) {
    for (const q of QUALITY_STEPS) {
      const blob = await encode(type, q);
      // Browsers that cannot encode WebP silently return PNG: skip to JPEG.
      if (!blob || blob.type !== type) break;
      if (blob.size <= maxBytes) return blob;
    }
  }
  return null;
}

export const extensionOf = (type: string): string => (type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg");

/** Browser only: decode, crop, scale and encode a picked file for the given slot. */
export async function prepareImage(file: Blob, kind: ImageKind): Promise<Blob> {
  const spec = IMAGE_KINDS[kind];
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be read. Try a JPEG or PNG.");
  });
  try {
    const plan = planCrop(bitmap.width, bitmap.height, spec.width, spec.height);
    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot resize images.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, plan.sx, plan.sy, plan.sw, plan.sh, 0, 0, plan.width, plan.height);
    const blob = await encodeToFit((type, q) => new Promise((res) => canvas.toBlob(res, type, q)), spec.maxBytes);
    if (!blob) throw new Error("This image is still too big after resizing. Try a simpler picture.");
    return blob;
  } finally {
    bitmap.close();
  }
}
