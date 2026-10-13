// F-54 (experimental): turn text read from the player's OWN profile screenshot into suggestions.
// Pure. The suggestions are shown in editable fields and never saved without a click.

export interface OcrSuggestions {
  cityHall: number | null;
  power: number | null;
  vip: number | null;
}

export const OCR_LIMITS = { cityHallMax: 25, vipMax: 20, powerMin: 1_000, powerMax: 1_000_000_000_000 } as const;

/** Common OCR slips inside numbers: O→0, l/I/|→1. */
function digits(s: string): string {
  return s.replace(/[Oo]/g, "0").replace(/[lI|]/g, "1");
}

const NUM = "[0-9OolI|][0-9OolI|,.\\s]*";

/** First whole number after a label, read with OCR slips fixed. Separators (, . space) are dropped. */
function after(text: string, label: string, maxDigits: number): number | null {
  const m = new RegExp(`${label}\\s*[:\\-]?\\s*(${NUM})`, "i").exec(text);
  if (!m) return null;
  const raw = digits(m[1]!).replace(/\s+$/, "");
  // Stop at a line break or a run of spaces (the next field on the same line).
  const first = raw.split(/\n|\s{2,}/)[0]!;
  const clean = first.replace(/[,.\s]/g, "");
  if (!/^\d+$/.test(clean) || clean.length > maxDigits) return null;
  return Number(clean);
}

const inRange = (n: number | null, lo: number, hi: number): number | null => (n !== null && Number.isInteger(n) && n >= lo && n <= hi ? n : null);

/** Read City Hall level, power and VIP level from OCR text. Anything not found or out of range is null. */
export function parseProfileText(text: string): OcrSuggestions {
  const t = text.replace(/\r/g, "");
  const ch = after(t, "city\\s*ha[l1I|]{2}\\s*(?:level|lv[l.]?\\.?)?", 2) ?? after(t, "\\bCH", 2);
  const power = after(t, "\\bpower", 13);
  const vip = after(t, "\\bVIP\\s*(?:level|lv[l.]?\\.?)?", 2);
  return {
    cityHall: inRange(ch, 1, OCR_LIMITS.cityHallMax),
    power: inRange(power, OCR_LIMITS.powerMin, OCR_LIMITS.powerMax),
    vip: inRange(vip, 0, OCR_LIMITS.vipMax),
  };
}

/** Accepts only image files the browser can decode, up to 15 MB. */
export function checkImageFile(f: { type: string; size: number }): string | null {
  if (!/^image\/(png|jpeg|webp|bmp|gif)$/.test(f.type)) return "Pick a screenshot image (PNG, JPEG or WebP).";
  if (f.size > 15_000_000) return "This image is larger than 15 MB. Take a normal screenshot and try again.";
  return null;
}
