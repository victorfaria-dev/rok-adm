import { describe, expect, it } from "vitest";
import {
  CREST_H, CREST_KEY, CREST_W, crestFileName, crestLayout, crestSvg, defaultCrest, EMBLEM_BOX, EMBLEM_NAMES, emblemPoints,
  insidePolygon, parseCrest, pngLayout, readSavedCrest, RIM_WIDTH, SHIELD_SHAPES, SHIELDS, TAG_BAND, writeCrest,
  type CrestPalette, type Point,
} from "./crest";

const memory = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
};

describe("parseCrest (tolerant)", () => {
  it("returns null for nothing usable", () => {
    for (const raw of [null, undefined, "", "not json", "[]", "42", '{"v":2,"shape":"kite"}', "null"]) expect(parseCrest(raw)).toBeNull();
  });

  it("keeps valid fields and defaults the rest", () => {
    expect(parseCrest('{"v":1,"shape":"kite","color":"rose","tag":"[k9x]","emblem":"tower"}')).toEqual({
      v: 1, shape: "kite", color: "rose", tag: "K9X", emblem: "tower",
    });
    expect(parseCrest('{"v":1,"shape":"hexagon","color":"#fff","tag":"TOOLONG","emblem":"dragon","extra":1}')).toEqual(defaultCrest());
    expect(parseCrest('{"v":1,"shape":"toString","emblem":"__proto__","tag":5}')).toEqual(defaultCrest());
  });

  it("reads and writes its own key only, and survives a throwing storage", () => {
    const st = memory({ "ko:v1": '{"v":1}' });
    expect(readSavedCrest(st)).toBeNull();
    const c = writeCrest({ shape: "banner", tag: "OPS" }, st);
    expect(c).toMatchObject({ v: 1, shape: "banner", tag: "OPS", color: "cobalt" });
    expect(JSON.parse(st.map.get(CREST_KEY)!)).toEqual(c);
    expect(st.map.get("ko:v1")).toBe('{"v":1}');
    expect(writeCrest({ emblem: "bolt" }, st)).toMatchObject({ shape: "banner", emblem: "bolt" });
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readSavedCrest(broken)).toBeNull();
    expect(writeCrest({ shape: "round" }, broken).shape).toBe("round");
  });
});

describe("crest geometry", () => {
  const inBox = ([x, y]: Point) => x >= 0 && x <= CREST_W && y >= 0 && y <= CREST_H;

  it("every shield fits the 100 × 120 box (rim included) and is a closed path", () => {
    for (const s of SHIELD_SHAPES) {
      const pts = SHIELDS[s];
      expect(pts.length).toBeGreaterThanOrEqual(5);
      for (const [x, y] of pts) {
        expect(x - RIM_WIDTH / 2).toBeGreaterThanOrEqual(0);
        expect(x + RIM_WIDTH / 2).toBeLessThanOrEqual(CREST_W);
        expect(y - RIM_WIDTH / 2).toBeGreaterThanOrEqual(0);
        expect(y + RIM_WIDTH / 2).toBeLessThanOrEqual(CREST_H);
      }
      expect(crestLayout({ ...defaultCrest(), shape: s }).shield).toMatch(/^M[\d. ]+(L[\d. ]+)+Z$/);
    }
  });

  it("emblem and tag band sit inside every shield", () => {
    const band: Point[] = [
      [TAG_BAND.x, TAG_BAND.y], [TAG_BAND.x + TAG_BAND.w, TAG_BAND.y],
      [TAG_BAND.x, TAG_BAND.y + TAG_BAND.h], [TAG_BAND.x + TAG_BAND.w, TAG_BAND.y + TAG_BAND.h],
    ];
    for (const s of SHIELD_SHAPES) {
      for (const e of EMBLEM_NAMES) {
        for (const p of emblemPoints(e)) expect(insidePolygon(p, SHIELDS[s]), `${e} in ${s}`).toBe(true);
      }
      for (const p of band) expect(insidePolygon(p, SHIELDS[s]), `band in ${s}`).toBe(true);
    }
  });

  it("emblems stay in their box and do not overlap the tag band", () => {
    for (const e of EMBLEM_NAMES) {
      for (const p of emblemPoints(e)) {
        expect(inBox(p)).toBe(true);
        expect(Math.abs(p[0] - EMBLEM_BOX.cx)).toBeLessThanOrEqual(EMBLEM_BOX.half);
        expect(p[1]).toBeLessThan(TAG_BAND.y);
      }
    }
  });

  it("point-in-polygon", () => {
    const sq: Point[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(insidePolygon([5, 5], sq)).toBe(true);
    expect(insidePolygon([15, 5], sq)).toBe(false);
  });
});

describe("exports", () => {
  const pal: CrestPalette = { field: "rgb(1 2 3)", rim: "gold", emblem: "white", band: "black", ink: "white" };

  it("SVG: standalone, titled, with the tag band only when there is a tag", () => {
    const svg = crestSvg({ ...defaultCrest(), tag: "ABC", emblem: "crown" }, pal);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain("<title>[ABC] brasão da aliança</title>");
    expect(svg).toContain(">[ABC]</text>");
    expect(svg).toContain('fill="rgb(1 2 3)"');
    expect((svg.match(/<path /g) ?? []).length).toBe(2);
    const bare = crestSvg(defaultCrest(), pal);
    expect(bare).not.toContain("<text");
    expect(bare).not.toContain("<rect");
    expect(crestLayout(defaultCrest()).tag).toBeNull();
  });

  it("SVG escapes palette values", () => {
    expect(crestSvg(defaultCrest(), { ...pal, field: '"><script>' })).not.toContain("<script>");
  });

  it("PNG layout centres the crest and keeps it (rim included) inside the canvas", () => {
    for (const size of [256, 1024]) {
      const { scale, x, y } = pngLayout(size);
      expect(x + (CREST_W * scale) / 2).toBeCloseTo(size / 2);
      expect(y + (CREST_H * scale) / 2).toBeCloseTo(size / 2);
      expect(x - (RIM_WIDTH / 2) * scale).toBeGreaterThan(0);
      expect(y - (RIM_WIDTH / 2) * scale).toBeGreaterThan(0);
      expect(y + (CREST_H + RIM_WIDTH / 2) * scale).toBeLessThan(size);
    }
  });

  it("file names", () => {
    expect(crestFileName({ ...defaultCrest(), tag: "K9X" }, "svg")).toBe("kingdomops-crest-k9x.svg");
    expect(crestFileName(defaultCrest(), "png")).toBe("kingdomops-crest.png");
  });
});
