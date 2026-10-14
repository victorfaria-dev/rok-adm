// F-54 (experimental): which game screen is this, and what does it show? A first reading of the whole
// screenshot finds the screen from the POSITIONS of what was read (not from English words); then small
// parts are read again, cropped and enlarged with the colour treatment that suits them. Pure apart from
// the `recognize` callback (Tesseract in the browser, a stub in tests), so the whole flow is testable.
import { prepare, type Img, type Prep, type Rect } from "./ocr-image";
import {
  groupRows, parseAlbum, parseBuildingBanner, parseHud, parseProfile, parseVip, parseVipBadge, textHeight,
  type AlbumRead, type OcrWord, type ProfileRead, type VipRead,
} from "./ocr";

/** How Tesseract should split the page: a normal page, scattered words, or one line. */
export type Layout = "auto" | "sparse" | "line";

/** Which reading this is, and where it comes from in the source image (for stubs and the text panel). */
export interface Part {
  name: "first" | "panel" | "bar" | "badge" | "centre" | "era" | "gray";
  rect: Rect;
  scale: number;
}

/** Read the words in a prepared image. Boxes are in the prepared image's pixels. */
export type Recognize = (img: Img, layout: Layout, part: Part) => Promise<OcrWord[]>;

export interface CityRead {
  ok: true;
  screen: "city";
  cityHall: number | null;
  /** False when the banner name was not recognised as the City Hall (another building, or a non-Latin client). */
  cityHallNamed: boolean;
  bannerTitle: string | null;
  vip: number | null;
  power: number | null;
  era: string | null;
  notes: string[];
}

export type ScreenRead = ProfileRead | VipRead | AlbumRead | CityRead;
export type ScreenKind = ScreenRead["screen"];
export interface ReadRejection {
  ok: false;
  reason: string;
}
export type ReadResult = ScreenRead | ReadRejection;

export interface ReadHooks {
  /** Plain-English step for the status line. */
  onStep?: (step: string) => void;
  /** Every reading, with boxes in source pixels (for the "text read" panel). */
  onPart?: (part: Part, words: OcrWord[]) => void;
}

const SCREENS = "Governor Profile, VIP, Album, or the city view with the City Hall tapped";

/** Recognise the screen and read its values. Every value is a suggestion for the player to check. */
export async function readScreenshot(src: Img, recognize: Recognize, hooks: ReadHooks = {}): Promise<ReadResult> {
  const W = src.width, H = src.height;
  // Scales are tuned on 720-pixel-high phone screenshots; bigger screenshots need less enlargement.
  const k = (s: number) => Math.max(0.5, Math.min(4, (s * 720) / H));
  const read = async (name: Part["name"], prep: Prep, layout: Layout): Promise<OcrWord[]> => {
    const { img, rect, scale } = prepare(src, prep);
    const part = { name, rect, scale };
    const raw = await recognize(img, layout, part);
    const words = raw.map((w) => ({
      ...w,
      bbox: { x0: w.bbox.x0 / scale + rect.x0, y0: w.bbox.y0 / scale + rect.y0, x1: w.bbox.x1 / scale + rect.x0, y1: w.bbox.y1 / scale + rect.y0 },
    }));
    hooks.onPart?.(part, words);
    return words;
  };
  const step = (s: string) => hooks.onStep?.(s);

  step("Reading the whole screenshot");
  const first = await read("first", { mode: "light", level: 150, scale: k(1.5) }, "auto");

  const profile = parseProfile(first, src);
  if (profile.ok) {
    step("Reading the profile panel closely");
    const close = await read("panel", { rect: profile.panel, mode: "notDark", level: 55, scale: k(2) }, "auto");
    const p2 = parseProfile(close, src);
    return mergeProfile(profile, p2.ok ? p2 : null);
  }

  const vip = parseVip(first);
  if (vip.ok) {
    if (vip.bar && (vip.points === null || vip.nextLevelPoints === null)) {
      step("Reading the VIP points bar");
      const barWords = await read("bar", { rect: vip.bar, mode: "light", level: 150, scale: k(2) }, "line");
      const again = parseVip([...first, ...barWords]);
      if (again.ok && again.points !== null) return { ...vip, points: again.points, nextLevelPoints: again.nextLevelPoints };
      vip.notes.push("The points bar was not readable: type your VIP points yourself.");
    }
    return vip;
  }

  const album = parseAlbum(first);
  if (album.ok) return album;

  const hud = parseHud(first, W, H);
  if (hud.power !== null && hud.powerBox) {
    step("Reading the City Hall banner and the VIP badge");
    const b = hud.powerBox, h = b.y1 - b.y0;
    const badge = await read("badge", { rect: { x0: b.x0 - h * 0.6, y0: b.y1 + h * 0.6, x1: b.x0 + h * 4.6, y1: b.y1 + h * 2.7 }, mode: "gold", scale: k(4) }, "line");
    const centre = await read("centre", { rect: { x0: W * 0.3, y0: H * 0.15, x1: W * 0.7, y1: H * 0.65 }, mode: "light", level: 150, scale: k(3) }, "sparse");
    const eraWords = hud.era ? [] : await read("era", { rect: { x0: b.x1 + h * 0.3, y0: b.y0 - h * 0.4, x1: b.x1 + h * 10, y1: b.y1 + h * 0.6 }, mode: "gray", scale: k(3) }, "line");
    const era = hud.era ?? (eraWords.filter((w) => /\p{L}{2,}/u.test(w.text)).map((w) => w.text).join(" ") || null);
    const banner = parseBuildingBanner(centre);
    const notes: string[] = [];
    if (banner.level !== null && !banner.cityHall) notes.push("The building name on the banner was not recognised as the City Hall. Make sure you tapped the City Hall.");
    if (banner.level === null) notes.push("No building level was found. Tap your City Hall so its name and level show above it, then take the screenshot.");
    return {
      ok: true, screen: "city",
      cityHall: banner.level, cityHallNamed: banner.cityHall, bannerTitle: banner.title,
      vip: parseVipBadge(badge), power: hud.power, era, notes,
    };
  }

  step("Looking for an album code");
  const gray = await read("gray", { mode: "gray", scale: k(1.5) }, "auto");
  const album2 = parseAlbum(gray);
  if (album2.ok) return album2;

  return { ok: false, reason: `This screenshot does not match a supported screen (${SCREENS}). ${profile.reason}` };
}

/** Fill the gaps of the first reading with the closer second one (the second wins when both have a value). */
function mergeProfile(first: ProfileRead, second: ProfileRead | null): ProfileRead {
  if (!second) return first;
  const pick = <K extends keyof ProfileRead>(key: K) => (second[key] ?? first[key]) as ProfileRead[K];
  const fromLine = second.idSource === "id-line" ? second : first.idSource === "id-line" ? first : null;
  const governorId = fromLine ? fromLine.governorId : pick("governorId");
  const idSource = fromLine ? "id-line" : pick("idSource");
  const civilization = pick("civilization");
  const notes = [...new Set([...second.notes, ...first.notes])]
    .filter((n) => !(idSource === "id-line" && n.startsWith("The ID was taken")))
    .filter((n) => !(civilization && n.startsWith("Civilization")));
  return {
    ...first,
    governorId, idSource, civilization, notes,
    name: pick("name"),
    power: pick("power"),
    killPoints: pick("killPoints"),
    merit: pick("merit"),
    highestMerit: pick("highestMerit"),
  };
}

/** Rebuild plain text, row by row, from word boxes (for the "text read" panel). */
export function wordsToText(words: readonly OcrWord[]): string {
  return groupRows(words, textHeight(words)).map((r) => r.text).join("\n");
}
