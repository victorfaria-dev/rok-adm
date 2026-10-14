import { describe, expect, it } from "vitest";
import { BANNERS_KEY, BANNER_MAX_CHARS, accountKind, cropAt, defaultBanner, localBannerStore, parseBanners } from "./banner";

class Mem {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
const IMG = "data:image/webp;base64,AAAA";

describe("city card banners", () => {
  it("default banner by account type", () => {
    expect(defaultBanner("main")).toEqual({ src: "/banners/main-portrait-480.webp", srcset: "/banners/main-portrait-480.webp 480w, /banners/main-portrait-768.webp 768w" });
    expect(defaultBanner("farm").src).toBe("/banners/farm-portrait-480.webp");
  });

  it("account type: own field, else a farm profile role, else main for the first account", () => {
    expect(accountKind({ kind: "farm" }, 0)).toBe("farm");
    expect(accountKind({}, 0)).toBe("main");
    expect(accountKind({}, 2)).toBe("farm");
    expect(accountKind({}, 0, "farm")).toBe("farm");
  });

  it("get / set / reset per account id, behind the swappable interface", async () => {
    const st = new Mem();
    const store = localBannerStore(st);
    expect(await store.getBanner("main")).toBeNull();
    await store.setBanner("main", IMG);
    await store.setBanner("farm", IMG);
    expect(await store.getBanner("main")).toBe(IMG);
    await store.setBanner("main", null);
    expect(await store.getBanner("main")).toBeNull();
    expect(await store.getBanner("farm")).toBe(IMG);
    expect(JSON.parse(st.getItem(BANNERS_KEY)!)).toEqual({ v: 1, banners: { farm: IMG } });
  });

  it("refuses anything that is not a small image data URL; corrupted storage reads as none", async () => {
    const store = localBannerStore(new Mem());
    await expect(store.setBanner("x", "https://example.com/a.png")).rejects.toThrow(/too large or not a picture/);
    await expect(store.setBanner("x", `data:image/webp;base64,${"A".repeat(BANNER_MAX_CHARS)}`)).rejects.toThrow();
    expect(parseBanners("{bad")).toEqual({});
    expect(parseBanners(JSON.stringify({ v: 1, banners: { a: IMG, b: "javascript:1" } }))).toEqual({ a: IMG });
  });

  it("crops any picture to 3:4, centred by default and moved by the focal point", () => {
    expect(cropAt(600, 800)).toEqual({ sx: 0, sy: 0, sw: 600, sh: 800 });
    expect(cropAt(1920, 1080)).toEqual({ sx: 555, sy: 0, sw: 810, sh: 1080 });
    expect(cropAt(1920, 1080, 0, 0.5)).toEqual({ sx: 0, sy: 0, sw: 810, sh: 1080 });
    expect(cropAt(1920, 1080, 1, 0.5)).toEqual({ sx: 1110, sy: 0, sw: 810, sh: 1080 });
    expect(cropAt(1000, 2000, 0.5, 0)).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 1333 });
    expect(cropAt(1000, 2000, 0.5, 2)).toEqual({ sx: 0, sy: 667, sw: 1000, sh: 1333 });
  });
});
