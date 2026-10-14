import { describe, expect, it } from "vitest";
import {
  checkImageFile, groupRows, matchCivilization, parseAlbum, parseBuildingBanner, parseNumber, parseProfile, parseVip, rowNumbers,
  type OcrWord, type ProfileRead, type VipRead,
} from "./ocr";
import { prepare } from "./ocr-image";
import { readScreenshot, type CityRead, type Recognize, type ScreenRead } from "./ocr-read";
import { combineReads } from "./ocr-combine";
import profileA from "./__fixtures__/ocr/profile-a.json";
import profileB from "./__fixtures__/ocr/profile-b.json";
import album from "./__fixtures__/ocr/album.json";
import city from "./__fixtures__/ocr/city.json";
import vip from "./__fixtures__/ocr/vip.json";

// Fixtures: word boxes as Tesseract returned them for real Portuguese-client screenshots, in source
// pixels, per reading ("first", "panel", …). Every number of 3+ digits and every name was replaced by
// fake values, and the bottom of the screen (chat) was dropped. No image is stored.
interface Fixture {
  width: number;
  height: number;
  expected: Record<string, unknown>;
  parts: Record<string, OcrWord[]>;
}

/** Plays a fixture back: returns the words of the requested reading that fall inside its crop, in crop pixels. */
function replay(fx: Fixture): Recognize {
  return async (_img, _layout, part) =>
    (fx.parts[part.name] ?? [])
      .filter((w) => {
        const cx = (w.bbox.x0 + w.bbox.x1) / 2, cy = (w.bbox.y0 + w.bbox.y1) / 2;
        return cx >= part.rect.x0 && cx <= part.rect.x1 && cy >= part.rect.y0 && cy <= part.rect.y1;
      })
      .map((w) => ({
        ...w,
        bbox: {
          x0: (w.bbox.x0 - part.rect.x0) * part.scale, y0: (w.bbox.y0 - part.rect.y0) * part.scale,
          x1: (w.bbox.x1 - part.rect.x0) * part.scale, y1: (w.bbox.y1 - part.rect.y0) * part.scale,
        },
      }));
}

const blank = (fx: Fixture) => ({ width: fx.width, height: fx.height, data: new Uint8ClampedArray(fx.width * fx.height * 4) });

/** A word on a 1560×720 screen, 20 px high. */
const w = (text: string, x: number, y: number, width = text.length * 10, confidence = 90): OcrWord => ({ text, confidence, bbox: { x0: x, y0: y, x1: x + width, y1: y + 20 } });

describe("parseNumber", () => {
  it("reads every client's thousands separators", () => {
    expect(parseNumber("1.189.358")).toBe(1_189_358);
    expect(parseNumber("1,189,358")).toBe(1_189_358);
    expect(parseNumber("1 189 358")).toBe(1_189_358);
    expect(parseNumber("1 189 358")).toBe(1_189_358);
    expect(parseNumber("1'189'358")).toBe(1_189_358);
    expect(parseNumber("١٬١٨٩٬٣٥٨")).toBe(1_189_358);
    expect(parseNumber("(ID: 0)")).toBeNull();
    expect(parseNumber("205759497)")).toBe(205_759_497);
    expect(parseNumber("0")).toBe(0);
  });

  it("fixes O/l slips but refuses short forms, decimals and mixed groups", () => {
    expect(parseNumber("1O.5O0")).toBe(10_500);
    expect(parseNumber("lOO")).toBeNull();
    expect(parseNumber("869.7K")).toBeNull();
    expect(parseNumber("1.3M")).toBeNull();
    expect(parseNumber("12.34")).toBeNull();
    expect(parseNumber("1.234,567")).toBeNull();
    expect(parseNumber("Poder")).toBeNull();
  });

  it("joins a number split by a thousands space into one", () => {
    const row = groupRows([w("2", 100, 100, 10), w("595", 115, 100, 30), w("066", 150, 100, 30)])[0]!;
    expect(rowNumbers(row, 20).map((n) => n.value)).toEqual([2_595_066]);
  });
});

describe("matchCivilization", () => {
  it("matches the Latin-script client names, with icon noise and accents", () => {
    expect(matchCivilization("#3China")).toBe("china");
    expect(matchCivilization("França")).toBe("france");
    expect(matchCivilization("Franca")).toBe("france");
    expect(matchCivilization("Vikings")).toBe("vikings");
    expect(matchCivilization("Wikinger")).toBe("vikings");
    expect(matchCivilization("España")).toBe("spain");
    expect(matchCivilization("Japonya")).toBe("japan");
    expect(matchCivilization("Tây Ban Nha")).toBe("spain");
    expect(matchCivilization("Bizancio")).toBe("byzantium");
  });

  it("leaves unknown or non-Latin text empty", () => {
    expect(matchCivilization("Китай")).toBeNull();
    expect(matchCivilization("中国")).toBeNull();
    expect(matchCivilization("-")).toBeNull();
    expect(matchCivilization("Atlantis")).toBeNull();
  });
});

describe("readScreenshot on real-layout fixtures (fake values)", () => {
  const cases: [string, Fixture][] = [["profile A", profileA], ["profile B", profileB], ["album", album], ["city view", city], ["VIP", vip]];
  for (const [label, fx] of cases) {
    it(`recognises the ${label} screen and reads its values`, async () => {
      const r = await readScreenshot(blank(fx), replay(fx));
      expect(r).toMatchObject({ ok: true, ...fx.expected });
    });
  }

  it("takes the ID from the \"(ID: …)\" line on the profile, with a bare 0 for kill points", async () => {
    const r = await readScreenshot(blank(profileA), replay(profileA));
    expect(r).toMatchObject({ screen: "profile", idSource: "id-line", killPoints: 0, notes: [] });
  });

  it("falls back to the default name's digits when the ID line is missing, and says so", async () => {
    const noIdLine: Fixture = { ...profileA, parts: Object.fromEntries(Object.entries(profileA.parts).map(([k, ws]) => [k, ws.filter((x) => !/ID|\)$/i.test(x.text))])) };
    const r = await readScreenshot(blank(noIdLine), replay(noIdLine));
    expect(r).toMatchObject({ screen: "profile", idSource: "name", governorId: profileA.expected.governorId });
    expect(r.ok && r.screen === "profile" && r.notes.join(" ")).toMatch(/default name/);
  });

  it("the city view reads the era and says when the banner is not the City Hall", async () => {
    const r = await readScreenshot(blank(city), replay(city));
    expect(r).toMatchObject({ screen: "city", cityHallNamed: true });
    expect(r.ok && r.screen === "city" && r.era).toMatch(/Idade/);
    const other: Fixture = { ...city, parts: { ...city.parts, centre: city.parts.centre!.map((x) => (x.text === "Prefeitura" ? { ...x, text: "Quartel" } : x)) } };
    const r2 = await readScreenshot(blank(other), replay(other));
    expect(r2).toMatchObject({ screen: "city", cityHall: 12, cityHallNamed: false });
    expect(r2.ok && r2.notes.join(" ")).toMatch(/not recognised as the City Hall/);
  });

  it("rejects a screen that matches none of the layouts, and says why", async () => {
    const fx: Fixture = { width: 1560, height: 720, expected: {}, parts: { first: [w("Hello", 100, 100), w("world", 200, 100), w("2024", 100, 300)], gray: [] } };
    const r = await readScreenshot(blank(fx), replay(fx));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/does not match a supported screen.*Governor Profile/);
  });
});

describe("profile layout without readable labels (Cyrillic, Korean, Chinese, Arabic clients)", () => {
  // Labels come out as noise; only positions and digits are used.
  const words = [
    w("~#", 610, 150, 60), w("(ID:", 680, 150, 40), w("123456789)", 725, 150, 90),
    w("Rhgk", 610, 180, 120),
    w("%^", 612, 225, 40), w("Ue", 846, 225, 40), w("yy", 1061, 225, 40),
    w("-", 613, 252, 8), w("1.234.567", 846, 250, 100), w("45.678.901", 1061, 250, 110),
    w("&*", 613, 290, 40), w("Ee", 846, 290, 40), w("ww", 1061, 290, 40),
    w("Kkk", 609, 314, 50), w("12.345", 845, 314, 60), w("67.890", 1060, 314, 60),
  ];
  it("still finds ID, power, kill points and merit by position; leaves the civilization empty", () => {
    const r = parseProfile(words, { width: 1560, height: 720 });
    expect(r).toMatchObject({ ok: true, governorId: 123_456_789, power: 45_678_901, killPoints: 1_234_567, merit: 12_345, highestMerit: 67_890, civilization: null });
  });

  it("refuses numbers that do not sit in the profile's columns", () => {
    const shifted = words.map((x) => (x.text === "67.890" ? { ...x, bbox: { ...x.bbox, x0: 1300, x1: 1360 } } : x));
    expect(parseProfile(shifted.filter((x) => x.text !== "45.678.901"), { width: 1560, height: 720 }).ok).toBe(false);
    expect(parseProfile([], { width: 1560, height: 720 })).toMatchObject({ ok: false, reason: expect.stringMatching(/No text/) });
  });
});

describe("other screens from plain word boxes", () => {
  it("VIP: \"VIPS\" in both titles still reads as VIP 5; points from the bar", () => {
    const r = parseVip([
      w("Today:", 500, 140), w("40", 570, 140, 20), w("Login", 860, 140), w("days:", 920, 140), w("1", 980, 140, 8),
      w("6,080/11,500", 690, 180, 110),
      w("BUFFS", 470, 260), w("VIPS", 640, 260, 40), w("CHESTS", 890, 260), w("VIPS", 1060, 260, 40),
    ]);
    expect(r).toMatchObject({ ok: true, vip: 5, points: 6080, nextLevelPoints: 11_500, todayPoints: 40, loginStreak: 1 });
  });

  it("album: the big six-digit code and the name in the header row", () => {
    const code = { ...w("004217", 330, 260, 230), bbox: { x0: 330, y0: 260, x1: 560, y1: 320 } };
    const r = parseAlbum([w("Governor12345678", 430, 115, 200), w("Photos:", 900, 115), w("1", 980, 115, 8), code, w("ALBUM", 730, 30)]);
    expect(r).toMatchObject({ ok: true, name: "Governor12345678", codes: ["004217"] });
    expect(parseAlbum([w("Governor", 430, 115)]).ok).toBe(false);
  });

  it("building banner: City Hall names in several languages, level right under the title", () => {
    for (const title of ["City Hall", "Prefeitura", "Rathaus", "Ayuntamiento"]) {
      const parts = title.split(" ").map((t, i) => w(t, 730 + i * 60, 255, t.length * 10));
      const r = parseBuildingBanner([...parts, w("Lv.", 740, 285, 30), w("17", 775, 285, 20)]);
      expect(r).toMatchObject({ cityHall: true, level: 17 });
    }
    expect(parseBuildingBanner([w("Nothing", 100, 100)])).toEqual({ cityHall: false, title: null, level: null });
  });
});

describe("combineReads", () => {
  const levels = [{ vip: 5, threshold: 5_000 }, { vip: 6, threshold: 11_500 }];
  const reads = async () => Promise.all([profileA, city, vip, album].map(async (fx) => readScreenshot(blank(fx), replay(fx))));

  it("puts the four screens together, with the source of every value", async () => {
    const c = combineReads((await reads()).filter((r) => r.ok) as ScreenRead[], levels);
    expect(c.screens).toEqual(["profile", "city", "vip", "album"]);
    expect(c.values).toMatchObject({
      governorId: profileA.expected.governorId, power: profileA.expected.power, killPoints: 0, civilization: "china",
      cityHall: 12, vip: 5, vipPoints: vip.expected.points, streakDay: 1,
    });
    expect(c.sources).toMatchObject({ governorId: "profile", power: "profile", cityHall: "city", vip: "vip", vipPoints: "vip" });
    expect(c.album).toEqual({ name: album.expected.name, codes: album.expected.codes, sameNameAsProfile: true });
  });

  it("notes disagreements and checks the VIP bar against the threshold table", () => {
    const p: ProfileRead = { ok: true, screen: "profile", governorId: 1234567, idSource: "id-line", name: "Gov1234567", power: 2_000_000, killPoints: 5, civilization: null, merit: 0, highestMerit: 0, notes: [], panel: { x0: 0, y0: 0, x1: 1, y1: 1 } };
    const ci: CityRead = { ok: true, screen: "city", cityHall: 20, cityHallNamed: true, bannerTitle: "City Hall", vip: 7, power: 1_990_000, era: null, notes: [] };
    const v: VipRead = { ok: true, screen: "vip", vip: null, points: 6_000, nextLevelPoints: 11_500, todayPoints: 40, loginStreak: 2, notes: [], bar: null };
    const c = combineReads([p, ci, v], levels);
    expect(c.values).toMatchObject({ power: 2_000_000, vip: 5 });
    expect(c.notes.join(" ")).toMatch(/Power differs/);
    expect(c.notes.join(" ")).toMatch(/worked out from the points bar/);
    const c2 = combineReads([{ ...v, vip: 9 }, ci], levels);
    expect(c2.notes.join(" ")).toMatch(/not the VIP 10 threshold/);
    expect(c2.notes.join(" ")).toMatch(/VIP level differs/);
    expect(combineReads([], levels)).toMatchObject({ screens: [], values: {}, album: null });
  });
});

describe("prepare", () => {
  it("crops, enlarges and turns light text black on white", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(0);
    data.set([255, 255, 255, 255], (1 * 4 + 1) * 4); // one white pixel at (1,1)
    const { img } = prepare({ width: 4, height: 4, data }, { rect: { x0: 1, y0: 1, x1: 3, y1: 3 }, scale: 2, mode: "light", level: 150 });
    expect([img.width, img.height]).toEqual([4, 4]);
    expect(img.data[0]).toBe(0);
    expect(img.data[(3 * 4 + 3) * 4]).toBe(255);
  });
});

describe("checkImageFile", () => {
  it("accepts screenshots, refuses other files and huge images", () => {
    expect(checkImageFile({ type: "image/png", size: 100 })).toBeNull();
    expect(checkImageFile({ type: "image/jpeg", size: 100 })).toBeNull();
    expect(checkImageFile({ type: "application/pdf", size: 100 })).toMatch(/screenshot image/);
    expect(checkImageFile({ type: "image/svg+xml", size: 100 })).toMatch(/screenshot image/);
    expect(checkImageFile({ type: "image/png", size: 20_000_000 })).toMatch(/15 MB/);
  });
});
