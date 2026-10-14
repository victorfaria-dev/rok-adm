// F-54 (experimental): turn the words read from the player's OWN game screenshots into suggestions.
// Pure. Nothing here checks anything against the game: every value is a suggestion that the player
// compares with the screen and fixes before using it.
//
// The reader works on word POSITIONS, not on English labels: the game client has 13 languages
// (EN, PT, ES, FR, DE, IT, RU, TR, ID, VI, KO, ZH, AR) and only the English model ships (4 MB budget).
// Latin-script labels are read but never required; numbers and their places on the screen are what
// count. Cyrillic, Korean, Chinese and Arabic labels come out as noise and are ignored; the digits
// still read, so the same layouts work, but the civilization name is left empty there.

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** One word as Tesseract returns it (`blocks → paragraphs → lines → words`), in source-image pixels. */
export interface OcrWord {
  text: string;
  confidence: number;
  bbox: Box;
}

export interface Row {
  words: OcrWord[];
  y0: number;
  y1: number;
  yc: number;
  text: string;
}

const height = (b: Box) => b.y1 - b.y0;
const ycOf = (b: Box) => (b.y0 + b.y1) / 2;

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

/** Typical text height: the median height of words that look like real text. */
export function textHeight(words: readonly OcrWord[]): number {
  const good = words.filter((w) => w.confidence >= 50 && /[\p{L}\p{N}]{2,}/u.test(w.text));
  return median((good.length >= 3 ? good : words).map((w) => height(w.bbox))) || 16;
}

/** Group words into visual rows by vertical overlap. Very tall noise (icons read as letters) is left out. */
export function groupRows(words: readonly OcrWord[], h = textHeight(words), maxTall = 2.6): Row[] {
  const usable = words.filter((w) => w.text.trim() && height(w.bbox) <= h * maxTall);
  const sorted = [...usable].sort((a, b) => ycOf(a.bbox) - ycOf(b.bbox));
  const rows: { words: OcrWord[]; yc: number }[] = [];
  for (const w of sorted) {
    const yc = ycOf(w.bbox);
    const row = rows.find((r) => Math.abs(r.yc - yc) <= h * 0.55);
    if (row) {
      row.words.push(w);
      row.yc = median(row.words.map((x) => ycOf(x.bbox)));
    } else rows.push({ words: [w], yc });
  }
  return rows
    .map((r) => {
      const ws = r.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      return {
        words: ws,
        y0: Math.min(...ws.map((w) => w.bbox.y0)),
        y1: Math.max(...ws.map((w) => w.bbox.y1)),
        yc: r.yc,
        text: ws.map((w) => w.text).join(" "),
      };
    })
    .sort((a, b) => a.yc - b.yc);
}

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const toAscii = (s: string) =>
  s.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));

/** Common OCR slips inside numbers: O/o→0, l/I/|/i→1, S→5, B→8, Z→2. Only used on mostly-digit tokens. */
function fixDigits(s: string): string {
  return s.replace(/[Oo]/g, "0").replace(/[lI|i!]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2");
}

/**
 * A whole number in any of the client's formats: 1189358, 1,189,358, 1.189.358, 1 189 358 (also with
 * narrow/no-break spaces), 1'189'358, Arabic-Indic digits. Surrounding brackets and colons are ignored.
 * Decimals and short forms (1.3M, 869.7K) are refused: those are rounded and not what we want.
 */
export function parseNumber(raw: string): number | null {
  let s = toAscii(raw.trim()).replace(/^[([{:;'"`«]+|[)\]}:;'"`»,.]+$/g, "");
  if (!s) return null;
  const digits = (s.match(/\d/g) ?? []).length;
  if (digits === 0 || digits < s.replace(/[.,\s'’  ٬]/g, "").length / 2) return null;
  s = fixDigits(s);
  if (/^\d+$/.test(s)) return s.length <= 15 ? Number(s) : null;
  if (/^\d{1,3}(?:([.,'’  ٬ ])\d{3})(?:\1\d{3})*$/.test(s)) return Number(s.replace(/\D/g, ""));
  return null;
}

interface Num {
  value: number;
  box: Box;
  text: string;
}

/** Numbers in a row; neighbours split by a thousands space ("1 189 358") are joined first. */
export function rowNumbers(row: Row, h: number): Num[] {
  const out: Num[] = [];
  for (const w of row.words) {
    const prev = out[out.length - 1];
    if (prev && /^\d{3}$/.test(w.text) && w.bbox.x0 - prev.box.x1 < h * 0.6) {
      const joined = parseNumber(`${prev.text} ${w.text}`);
      if (joined !== null) {
        out[out.length - 1] = { value: joined, text: `${prev.text} ${w.text}`, box: { ...prev.box, x1: w.bbox.x1, y1: Math.max(prev.box.y1, w.bbox.y1) } };
        continue;
      }
    }
    const v = parseNumber(w.text);
    // A one- or two-digit guess the reader doubts, or one wrapped in brackets (a lone "0" often reads
    // as "[1]" or "(1)"), is left out rather than suggested wrong.
    if (v !== null && !(v < 100 && (w.confidence < 25 || /[[\](){}]/.test(w.text)))) out.push({ value: v, box: w.bbox, text: w.text });
  }
  return out;
}

/** Lower case, accents removed, letters only. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}]+/gu, "");
}

function editDistance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]!;
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]!;
      d[j] = Math.min(d[j]! + 1, d[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length]!;
}

/**
 * Civilization names in the Latin-script clients. Only the Portuguese "China", "França" and "Vikings"
 * were seen on real screenshots; the other spellings are our best knowledge of the localisation and are
 * matched loosely (accents ignored, one slip allowed on longer names). Unknown text → no suggestion.
 */
export const CIVILIZATIONS: Readonly<Record<string, readonly string[]>> = {
  rome: ["Rome", "Roma", "Rom", "Romawi", "La Mã"],
  germany: ["Germany", "Alemanha", "Alemania", "Germanie", "Allemagne", "Deutschland", "Germanien", "Germania", "Almanya", "Jerman", "Đức"],
  britain: ["Britain", "Grã-Bretanha", "Bretanha", "Britânia", "Britania", "Bretagne", "Grande-Bretagne", "Britannien", "Britannia", "Britanya", "Inggris", "Anh"],
  france: ["France", "França", "Francia", "Frankreich", "Fransa", "Prancis", "Pháp"],
  spain: ["Spain", "Espanha", "España", "Espagne", "Spanien", "Spagna", "İspanya", "Spanyol", "Tây Ban Nha"],
  china: ["China", "Chine", "Cina", "Çin", "Tiongkok", "Trung Hoa", "Trung Quốc"],
  japan: ["Japan", "Japão", "Japón", "Japon", "Giappone", "Japonya", "Jepang", "Nhật Bản"],
  korea: ["Korea", "Coreia", "Corea", "Corée", "Kore", "Triều Tiên", "Hàn Quốc"],
  arabia: ["Arabia", "Arábia", "Arabie", "Arabien", "Arabistan", "Arab", "Ả Rập"],
  ottoman: ["Ottoman", "Otomano", "Otomanos", "Ottomans", "Osmanen", "Ottomano", "Ottomani", "Osmanlı", "Utsmaniyah", "Ottoman Empire"],
  byzantium: ["Byzantium", "Bizâncio", "Bizancio", "Byzance", "Byzanz", "Bisanzio", "Bizans", "Bizantium", "Byzantine"],
  vikings: ["Vikings", "Vikingos", "Wikinger", "Vichinghi", "Vikingler", "Viking"],
  maya: ["Maya", "Maia", "Mayas", "Maias", "Mayans", "Maya-Reich"],
};

/** Match OCR text against the civilization names. Icon noise glued to the name ("#3China") is tolerated. */
export function matchCivilization(text: string): string | null {
  const words = text.split(/\s+/).map(fold).filter(Boolean);
  const joined = words.join("");
  let best: { id: string; score: number } | null = null;
  for (const [id, names] of Object.entries(CIVILIZATIONS)) {
    for (const n of names) {
      const f = fold(n);
      if (!f) continue;
      let score = -1;
      if (words.includes(f) || joined === f) score = 3;
      else if (f.length >= 4 && words.some((w) => w.endsWith(f) && w.length - f.length <= 3)) score = 2;
      else if (f.length >= 5 && words.some((w) => editDistance(w, f) <= 1 || (w.length > f.length && editDistance(w.slice(-f.length), f) <= 1))) score = 1;
      if (score > 0 && (!best || score > best.score || (score === best.score && f.length > fold(CIVILIZATIONS[best.id]![0]!).length))) best = { id, score };
    }
  }
  return best?.id ?? null;
}

export const CIVILIZATION_NAMES: Readonly<Record<string, string>> = {
  rome: "Rome", germany: "Germany", britain: "Britain", france: "France", spain: "Spain", china: "China", japan: "Japan",
  korea: "Korea", arabia: "Arabia", ottoman: "Ottoman", byzantium: "Byzantium", vikings: "Vikings", maya: "Maya",
};

// ---------------------------------------------------------------------------------------------
// Screens. Each parser returns either values or a plain reason why the words do not fit its layout.

export type Rejection = { ok: false; reason: string };

export interface ProfileRead {
  ok: true;
  screen: "profile";
  governorId: number | null;
  /** Where the ID came from: the "(ID: n)" line, or the digits of a default name ("Governor123…"). */
  idSource: "id-line" | "name" | null;
  name: string | null;
  power: number | null;
  killPoints: number | null;
  civilization: string | null;
  merit: number | null;
  highestMerit: number | null;
  notes: string[];
  /** Panel area in source pixels, for a closer second reading. */
  panel: Box;
}

const ID_RE = /(?:^|[^\p{L}])[Ii1l|][Dd]\s*[:;.,]?\s*([0-9OolI|]{6,12})/u;
const NAME_ID_RE = /([0-9lI|O]{6,12})$/;

/**
 * Governor Profile: a row of three labels, a row of values (alliance | kill points | power), again
 * labels, then values (civilization | merit | highest merit). Found by two value rows whose numbers
 * line up in the same two right-hand columns. Above them: "(ID: n)" and the name.
 */
export function parseProfile(words: readonly OcrWord[], size?: { width: number; height: number }): ProfileRead | Rejection {
  if (!words.length) return { ok: false, reason: "No text was found in the image." };
  const h = textHeight(words);
  const rows = groupRows(words, h);
  const nums = rows.map((r) => rowNumbers(r, h));
  const tol = Math.max(6, h * 1.1);
  let best: { a: number; b: number; col2: number; col3: number; score: number } | null = null;
  for (let a = 0; a < rows.length; a++) {
    for (let b = a + 1; b < rows.length; b++) {
      const gap = rows[b]!.yc - rows[a]!.yc;
      if (gap < h * 1.6) continue;
      if (gap > h * 6) break;
      // Proportions of the real screen (any resolution): the value rows sit below the top bar, about
      // 0.09 screen-heights apart, and the two number columns about 0.3 screen-heights apart.
      if (size && (rows[a]!.yc < size.height * 0.15 || gap < size.height * 0.05 || gap > size.height * 0.16)) continue;
      const xs = [...nums[a]!, ...nums[b]!].map((n) => n.box.x0).sort((p, q) => q - p);
      if (xs.length < 3) continue;
      const col3 = xs[0]!;
      const col2 = xs.find((x) => col3 - x >= h * 3);
      if (col2 === undefined) continue;
      if (size && (col3 - col2 < size.height * 0.2 || col3 - col2 > size.height * 0.5)) continue;
      const inCol = (n: Num, c: number) => Math.abs(n.box.x0 - c) <= tol;
      const filled = [col2, col3].map((c) => [nums[a]!.some((n) => inCol(n, c)), nums[b]!.some((n) => inCol(n, c))]);
      const aligned = filled.filter(([p, q]) => p && q).length;
      // Every number in the two rows must sit in one of the two columns or left of them (alliance tag).
      const stray = [...nums[a]!, ...nums[b]!].some((n) => n.box.x0 > col2 + tol && !inCol(n, col3));
      if (aligned < 1 || stray || filled.flat().filter(Boolean).length < 3) continue;
      const score = aligned * 2 + filled.flat().filter(Boolean).length;
      if (!best || score > best.score) best = { a, b, col2, col3, score };
    }
  }
  if (!best) {
    return {
      ok: false,
      reason: "This does not look like the Governor Profile screen: the two rows of numbers (kill points and power, then merit) were not found in their columns.",
    };
  }
  const { a, b, col2, col3 } = best;
  const rowA = rows[a]!, rowB = rows[b]!;
  const pick = (i: number, c: number) => nums[i]!.find((n) => Math.abs(n.box.x0 - c) <= tol)?.value ?? null;
  const left = col2 - 1.3 * (col3 - col2);
  const right = col3 + 1.3 * (col3 - col2);
  const notes: string[] = [];

  // ID line and name: the rows above the first value row (labels row first, then name, then ID).
  const inPanel = (r: Row): Row | null => {
    const ws = r.words.filter((w) => w.bbox.x0 >= left - h && w.bbox.x1 <= right + h);
    return ws.length ? { ...r, words: ws, text: ws.map((w) => w.text).join(" ") } : null;
  };
  const above = rows.slice(0, a).filter((r) => r.yc >= rowA.yc - h * 9).map(inPanel).filter((r): r is Row => r !== null).reverse();
  let governorId: number | null = null;
  let idSource: ProfileRead["idSource"] = null;
  let idRow = -1;
  above.forEach((r, i) => {
    if (governorId !== null) return;
    const text = r.words.filter((w) => w.bbox.x1 >= left).map((w) => w.text).join(" ");
    const m = ID_RE.exec(text);
    if (m) {
      const v = parseNumber(m[1]!);
      if (v !== null) {
        governorId = v;
        idSource = "id-line";
        idRow = i;
      }
    }
  });
  const nameRowAt = idRow >= 1 ? idRow - 1 : above.length >= 2 ? 1 : -1;
  const nameRow = nameRowAt >= 0 ? above[nameRowAt] : undefined;
  const nameWords = nameRow?.words.filter((w) => w.bbox.x0 >= left - h && w.bbox.x1 <= right && w.text.trim().length > 0) ?? [];
  // The edit (pencil) icon after the name reads as a stray symbol.
  while (nameWords.length && !/[\p{L}\p{N}]{2,}|^[\p{L}\p{N}]$/u.test(nameWords[nameWords.length - 1]!.text)) nameWords.pop();
  const name = nameWords.length ? nameWords.map((w) => w.text).join(" ").trim() : null;
  const nameRun = name ? NAME_ID_RE.exec(name.replace(/\s+/g, ""))?.[1] : undefined;
  const nameDigits = nameRun && /\d{5}/.test(nameRun) ? fixDigits(nameRun) : undefined;
  if (governorId === null && nameDigits) {
    governorId = Number(nameDigits);
    idSource = "name";
    notes.push("The ID was taken from the default name (the \"(ID: …)\" line was not readable).");
  } else if (governorId !== null && nameDigits && Number(nameDigits) !== governorId && nameDigits.length === String(governorId).length) {
    notes.push("The \"(ID: …)\" line and the name show different digits; check the ID.");
  }

  const civText = rowB.words.filter((w) => w.bbox.x0 >= left && w.bbox.x1 <= col2 - h * 0.3).map((w) => w.text).join(" ");
  const civilization = matchCivilization(civText);
  if (!civilization && /\p{L}/u.test(civText)) notes.push("Civilization name not recognised: pick it yourself.");

  const power = pick(a, col3);
  const killPoints = pick(a, col2);
  const panel: Box = {
    x0: left - h,
    y0: Math.min(rowA.y0 - h * 7.5, (above[Math.max(idRow, nameRowAt, 0)]?.y0 ?? rowA.y0) - h * 1.5),
    x1: right,
    y1: rowB.y1 + h * 3,
  };
  return {
    ok: true,
    screen: "profile",
    governorId: governorId !== null && String(governorId).length >= 6 ? governorId : null,
    idSource,
    name,
    power,
    killPoints,
    civilization,
    merit: pick(b, col2),
    highestMerit: pick(b, col3),
    notes,
    panel,
  };
}

export interface AlbumRead {
  ok: true;
  screen: "album";
  name: string | null;
  /** Six-digit codes seen on the photo tiles, top-left first. */
  codes: string[];
  notes: string[];
}

/**
 * Album: a header row with the governor name, then photo tiles. The code is a six-digit number drawn
 * much larger than the interface text. The name is the first group of words in the nearest row above.
 */
export function parseAlbum(words: readonly OcrWord[]): AlbumRead | Rejection {
  const h = textHeight(words);
  const big = words
    .filter((w) => /^[0-9OolI|SB]{6}$/.test(w.text.trim()) && /\d{4}/.test(w.text) && height(w.bbox) >= h * 1.6)
    .sort((p, q) => p.bbox.y0 - q.bbox.y0 || p.bbox.x0 - q.bbox.x0);
  if (!big.length) return { ok: false, reason: "No six-digit code was found on the album photos." };
  const codes = [...new Set(big.map((w) => fixDigits(w.text.trim())))];
  const top = big[0]!;
  const rows = groupRows(words.filter((w) => !big.includes(w)), h);
  const header = rows.filter((r) => r.y1 <= top.bbox.y0 && r.words.some((w) => /\p{L}{3,}|\d{6,}/u.test(w.text) && w.confidence >= 40)).pop();
  let name: string | null = null;
  if (header) {
    const ws = header.words.filter((w) => (w.confidence >= 30 || /[\p{L}\p{N}]{4,}/u.test(w.text)) && /[\p{L}\p{N}]/u.test(w.text) && height(w.bbox) <= h * 1.6);
    const group: OcrWord[] = [];
    for (const w of ws) {
      const last = group[group.length - 1];
      if (last && w.bbox.x0 - last.bbox.x1 > h * 1.2) break;
      group.push(w);
    }
    name = group.map((w) => w.text).join(" ").trim() || null;
  }
  const notes: string[] = [];
  if (codes.length > 1) notes.push("More than one code is on the album; the site's code must be one of them.");
  if (!name) notes.push("The name above the photos was not readable.");
  return { ok: true, screen: "album", name, codes, notes };
}

export interface VipRead {
  ok: true;
  screen: "vip";
  vip: number | null;
  points: number | null;
  nextLevelPoints: number | null;
  todayPoints: number | null;
  loginStreak: number | null;
  notes: string[];
  /** Where the points bar should be (between the "today" row and the titles), for a closer reading. */
  bar: Box | null;
}

const VIP_RE = /\bV[I1l|]P\s*[:.]?\s*([0-9SBOZ]{1,2})\b/gi;
const FRACTION_RE = /(\d[\d.,'’\s]*\d|\d)\s*[/|]\s*(\d[\d.,'’\s]*\d|\d)/;

/** VIP screen: "VIP n" in the two section titles, a points bar "a/b", and "label: n" pairs above it. */
export function parseVip(words: readonly OcrWord[]): VipRead | Rejection {
  const h = textHeight(words);
  const rows = groupRows(words, h);
  // Titles: a row with "VIP n" at least twice (buffs and chests). The top-left HUD has only one.
  let vip: number | null = null;
  let titleRow = -1;
  rows.forEach((r, i) => {
    // "VIPS" is a common slip for "VIP 5" (and B for 8, O for 0).
    const found = [...r.text.matchAll(VIP_RE)].map((m) => Number(fixDigits(m[1]!))).filter((n) => n >= 0 && n <= 20);
    const joined = r.text.replace(/\s+/g, " ");
    const loose = (joined.match(/\bV[I1l|]P/gi) ?? []).length;
    if (vip === null && loose >= 2 && found.length >= 1) {
      vip = found.sort((p, q) => found.filter((x) => x === q).length - found.filter((x) => x === p).length)[0]!;
      titleRow = i;
    }
  });
  if (vip === null) {
    // Titles without a readable digit: use the big digit on the badge, above them.
    const t = rows.findIndex((r) => (r.text.match(/\bV[I1l|]P/gi) ?? []).length >= 2);
    const badge = t >= 0 ? words.filter((w) => /^\d{1,2}$/.test(w.text) && height(w.bbox) >= h * 1.4 && w.bbox.y1 <= rows[t]!.y0) : [];
    if (badge.length === 1) {
      vip = Number(badge[0]!.text);
      titleRow = t;
    }
  }
  let points: number | null = null, next: number | null = null, fracRow = -1;
  rows.forEach((r, i) => {
    if (points !== null) return;
    const m = FRACTION_RE.exec(r.text.replace(/\s*\/\s*/g, "/"));
    if (m) {
      const p = parseNumber(m[1]!.trim()), q = parseNumber(m[2]!.trim());
      if (p !== null && q !== null && q >= 100 && p <= q * 1.01) {
        points = p;
        next = q;
        fracRow = i;
      }
    }
  });
  // "label: n" pairs: today's points (left) and login streak (right), in the row above the bar
  // (or above the titles when the bar was not read).
  const anchor = fracRow >= 0 ? fracRow : titleRow;
  let todayPoints: number | null = null, loginStreak: number | null = null, pairRow = -1;
  if (anchor >= 0) {
    for (let i = anchor - 1; i >= 0 && rows[anchor]!.yc - rows[i]!.yc <= h * (fracRow >= 0 ? 4 : 9); i--) {
      const pairs: number[] = [];
      const ws = rows[i]!.words;
      ws.forEach((w, k) => {
        const glued = /:\s*(\d[\d.,]*)$/.exec(w.text);
        if (glued) {
          const v = parseNumber(glued[1]!);
          if (v !== null) pairs.push(v);
        } else if (k > 0 && /[:：]$/.test(ws[k - 1]!.text)) {
          const v = parseNumber(w.text);
          if (v !== null) pairs.push(v);
        }
      });
      if (pairs.length >= 2) {
        todayPoints = pairs[0]!;
        loginStreak = pairs[pairs.length - 1]!;
        pairRow = i;
        break;
      }
    }
  }
  if (vip === null && points === null) {
    return { ok: false, reason: "This does not look like the VIP screen: neither \"VIP n\" in the section titles nor the points bar was found." };
  }
  if (vip === null && pairRow < 0) {
    return { ok: false, reason: "A points bar was found, but not the rest of the VIP screen." };
  }
  const notes: string[] = [];
  let bar: Box | null = null;
  if (pairRow >= 0 && titleRow > pairRow) {
    const pr = rows[pairRow]!, tr = rows[titleRow]!;
    bar = { x0: pr.words[0]!.bbox.x0 - h * 2, y0: pr.y1, x1: pr.words[pr.words.length - 1]!.bbox.x1 + h, y1: tr.y0 };
  }
  return { ok: true, screen: "vip", vip, points, nextLevelPoints: next, todayPoints, loginStreak, notes, bar };
}

export interface HudRead {
  power: number | null;
  powerBox: Box | null;
  era: string | null;
}

/** The top-left HUD of the city/map view: power in a box, the era to its right, the VIP badge below. */
export function parseHud(words: readonly OcrWord[], width: number, imgHeight: number): HudRead {
  const h = textHeight(words);
  const cand = words
    .map((w) => ({ w, v: parseNumber(w.text) }))
    .filter((x) => x.v !== null && x.v >= 1000 && /[.,\s'’]/.test(x.w.text) && x.w.bbox.x1 < width * 0.4 && x.w.bbox.y1 < imgHeight * 0.12)
    .sort((p, q) => p.w.bbox.y0 - q.w.bbox.y0);
  const top = cand[0];
  if (!top) return { power: null, powerBox: null, era: null };
  const row = groupRows(words, h).find((r) => r.words.includes(top.w));
  const eraWords = row?.words.filter((w) => w.bbox.x0 > top.w.bbox.x1 + h * 0.5 && w.bbox.x0 < top.w.bbox.x1 + h * 14 && /\p{L}{2,}/u.test(w.text)) ?? [];
  return { power: top.v, powerBox: top.w.bbox, era: eraWords.map((w) => w.text).join(" ") || null };
}

/** "VIP 5" from the badge under the HUD power (read alone from a gold-only crop). */
export function parseVipBadge(words: readonly OcrWord[]): number | null {
  const text = words.map((w) => w.text).join(" ");
  const m = /V[I1l|]P\s*[:.]?\s*(\d{1,2})\b/i.exec(text) ?? /V[I1l|]P(\d{1,2})\b/i.exec(text);
  if (m) return Number(m[1]);
  const lone = words.filter((w) => /^\d{1,2}$/.test(w.text) && w.confidence >= 60);
  return lone.length === 1 ? Number(lone[0]!.text) : null;
}

/** City Hall name on the building banner, in the Latin-script clients (Portuguese seen on a real screenshot). */
export const CITY_HALL_NAMES = [
  "City Hall", "Prefeitura", "Ayuntamiento", "Hôtel de ville", "Mairie", "Rathaus", "Municipio", "Municipio", "Belediye Binası",
  "Belediye", "Balai Kota", "Tòa Thị Chính", "Thị Chính",
] as const;

export interface BannerRead {
  /** True when the banner title matches a known City Hall name. */
  cityHall: boolean;
  title: string | null;
  level: number | null;
}

/**
 * The banner over a tapped building: its name, and right under it the level ("Nível 12", "Lv. 12",
 * "Level 12"…). The level is the number in the row right under the title, near its centre.
 */
export function parseBuildingBanner(words: readonly OcrWord[]): BannerRead {
  const names = CITY_HALL_NAMES.map((n) => n.split(/\s+/).map(fold));
  const good = words.filter((w) => /\p{L}{3,}/u.test(w.text));
  // Title: a word (or two neighbouring words) that spells a City Hall name, accents and one slip allowed.
  let title: OcrWord[] | null = null;
  for (const w of good) {
    const f = fold(w.text);
    for (const parts of names) {
      const whole = parts.join("");
      if (f === whole || (whole.length >= 6 && editDistance(f, whole) <= 1)) title = [w];
      else if (parts.length > 1 && f === parts[0]) {
        const next = good.find((x) => x !== w && fold(x.text) === parts[1] && x.bbox.x0 > w.bbox.x1 && x.bbox.x0 - w.bbox.x1 < height(w.bbox) * 1.5 && Math.abs(ycOf(x.bbox) - ycOf(w.bbox)) < height(w.bbox) * 0.6);
        if (next) title = [w, next];
      }
      if (title) break;
    }
    if (title) break;
  }
  const cityHall = title !== null;
  const levelUnder = (t: OcrWord[]): number | null => {
    const box = { x0: t[0]!.bbox.x0, y0: Math.min(...t.map((w) => w.bbox.y0)), x1: t[t.length - 1]!.bbox.x1, y1: Math.max(...t.map((w) => w.bbox.y1)) };
    const th = box.y1 - box.y0, cx = (box.x0 + box.x1) / 2, span = box.x1 - box.x0;
    // Sparse reading gives tall boxes to short words ("12"): place words by their centre only.
    const under = words
      .filter((w) => !t.includes(w) && ycOf(w.bbox) > box.y1 && ycOf(w.bbox) < box.y1 + th * 3 && Math.abs((w.bbox.x0 + w.bbox.x1) / 2 - cx) <= span)
      .sort((p, q) => p.bbox.x0 - q.bbox.x0);
    // The last short token is the level; small text often turns 1 into L/l/I and 2 into Z.
    const last = under[under.length - 1]?.text ?? "";
    const lastFixed = /^[\dlLI|!iZSOoB]{1,2}$/.test(last) && /[\dZL]/.test(last) ? last.replace(/[lLI|!i]/g, "1").replace(/Z/g, "2").replace(/S/g, "5").replace(/[Oo]/g, "0").replace(/B/g, "8") : last;
    const text = [...under.slice(0, -1).map((w) => w.text), lastFixed].join(" ");
    const m = /(?:^|\D)(\d{1,2})\s*$/.exec(text) ?? /\b(?:lv|lvl|level)\.?\s*(\d{1,2})/i.exec(text);
    const v = m ? Number(m[1]) : NaN;
    return v >= 1 && v <= 25 ? v : null;
  };
  if (title) return { cityHall, title: title.map((w) => w.text).join(" "), level: levelUnder(title) };
  // Unknown building name (another language or another building): any word with a level right under it.
  for (const w of good) {
    if (!/\p{L}{4,}/u.test(w.text)) continue;
    const level = levelUnder([w]);
    if (level !== null) return { cityHall: false, title: w.text, level };
  }
  return { cityHall: false, title: null, level: null };
}

/** Accepts only image files the browser can decode, up to 15 MB. */
export function checkImageFile(f: { type: string; size: number }): string | null {
  if (!/^image\/(png|jpeg|webp|bmp|gif)$/.test(f.type)) return "Pick a screenshot image (PNG, JPEG or WebP).";
  if (f.size > 15_000_000) return "This image is larger than 15 MB. Take a normal screenshot and try again.";
  return null;
}
