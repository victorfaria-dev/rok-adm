import { describe, expect, it } from "vitest";
import { BANNERS_KEY, BANNER_MAX_CHARS, accountKind, cropTo16x9, defaultBanner, localBannerStore, parseBanners } from "./banner";

class Mem {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
const IMG = "data:image/webp;base64,AAAA";

describe("city card banners", () => {
  it("default banner by account type", () => {
    expect(defaultBanner("main")).toEqual({ src: "/banners/main-640.webp", srcHd: "/banners/main-1280.webp" });
    expect(defaultBanner("farm").src).toBe("/banners/farm-640.webp");
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

  it("crops any picture to 16:9 around its centre", () => {
    expect(cropTo16x9(1920, 1080)).toEqual({ sx: 0, sy: 0, sw: 1920, sh: 1080 });
    expect(cropTo16x9(1000, 1000)).toEqual({ sx: 0, sy: 219, sw: 1000, sh: 563 });
    expect(cropTo16x9(4000, 1000)).toEqual({ sx: 1111, sy: 0, sw: 1778, sh: 1000 });
  });
});
