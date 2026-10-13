import { describe, expect, it } from "vitest";
import {
  MAX_SHARE_CHARS, SHARE_ERROR_TEXT, ShareTooLargeError, decodeShare, encodeShare, fromBase64Url, shareFromHash, toBase64Url,
} from "../src/kingdom-codec";

const asDoc = (d: unknown): { title: string } | null =>
  typeof d === "object" && d !== null && typeof (d as { title?: unknown }).title === "string" ? { title: (d as { title: string }).title } : null;

describe("base64url", () => {
  it("round-trips every length 0..64 and every byte value", () => {
    for (let n = 0; n <= 64; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
      const text = toBase64Url(bytes);
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/);
      expect([...fromBase64Url(text)!]).toEqual([...bytes]);
    }
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect([...fromBase64Url(toBase64Url(all))!]).toEqual([...all]);
  });

  it("matches the standard alphabet without padding", () => {
    expect(toBase64Url(new TextEncoder().encode("hello?>"))).toBe("aGVsbG8_Pg");
  });

  it("rejects foreign characters and impossible lengths", () => {
    expect(fromBase64Url("ab+c")).toBeNull();
    expect(fromBase64Url("abc=")).toBeNull();
    expect(fromBase64Url("abcde")).toBeNull();
  });
});

describe("share codec", () => {
  const doc = { title: "Kingdom 1234 rules — ação, 中文, emoji 🛡️", body: "x".repeat(2000) };

  it("round-trips compressed and plain, with unicode", async () => {
    for (const compress of [true, false]) {
      const s = await encodeShare("rules", doc, { compress });
      expect(s).toMatch(compress ? /^1z/ : /^1j/);
      expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
      const r = await decodeShare(s, "rules", (d) => d as typeof doc);
      expect(r).toEqual({ ok: true, data: doc });
    }
  });

  it("compresses repetitive text well below the plain size", async () => {
    const z = await encodeShare("rules", doc);
    const j = await encodeShare("rules", doc, { compress: false });
    expect(z.length).toBeLessThan(j.length / 4);
  });

  it("refuses a link for another tool", async () => {
    const s = await encodeShare("mge", { title: "x" });
    expect(await decodeShare(s, "rules", asDoc)).toEqual({ ok: false, error: "wrong_kind" });
  });

  it("returns typed errors instead of throwing", async () => {
    expect(await decodeShare("", "rules", asDoc)).toEqual({ ok: false, error: "empty" });
    expect(await decodeShare(null, "rules", asDoc)).toEqual({ ok: false, error: "empty" });
    expect(await decodeShare("2zAAAA", "rules", asDoc)).toEqual({ ok: false, error: "bad_version" });
    expect(await decodeShare("1qAAAA", "rules", asDoc)).toEqual({ ok: false, error: "bad_encoding" });
    expect(await decodeShare("1z!!!!", "rules", asDoc)).toEqual({ ok: false, error: "bad_encoding" });
    expect(await decodeShare("1zAAAAAAAA", "rules", asDoc)).toEqual({ ok: false, error: "bad_encoding" });
    expect(await decodeShare(`1j${toBase64Url(new TextEncoder().encode("not json"))}`, "rules", asDoc)).toEqual({ ok: false, error: "bad_json" });
    expect(await decodeShare(`1j${toBase64Url(new TextEncoder().encode("[1,2]"))}`, "rules", asDoc)).toEqual({ ok: false, error: "bad_json" });
    expect(await decodeShare("1" + "j".repeat(MAX_SHARE_CHARS), "rules", asDoc)).toEqual({ ok: false, error: "too_long" });
  });

  it("rejects a truncated link (copied only partly)", async () => {
    const s = await encodeShare("rules", doc);
    const r = await decodeShare(s.slice(0, Math.floor(s.length / 2)), "rules", asDoc);
    expect(r.ok).toBe(false);
  });

  it("lets the parser reject a malformed document", async () => {
    const s = await encodeShare("rules", { title: 42 });
    expect(await decodeShare(s, "rules", asDoc)).toEqual({ ok: false, error: "bad_json" });
  });

  it("refuses to encode what decodeShare would refuse (no dead links)", async () => {
    await expect(encodeShare("rules", { title: "a".repeat(300 * 1024) })).rejects.toBeInstanceOf(ShareTooLargeError);
    // Incompressible text past the character limit.
    const noise = Array.from({ length: 20_000 }, (_, i) => ((i * 7919) % 65521).toString(36)).join("");
    await expect(encodeShare("rules", { title: noise })).rejects.toThrow(/too large for a link/);
    const ok = await encodeShare("rules", { title: "a".repeat(100 * 1024) });
    expect(ok.length).toBeLessThanOrEqual(MAX_SHARE_CHARS);
    expect((await decodeShare(ok, "rules", asDoc)).ok).toBe(true);
  });

  it("stops decompressing a payload that expands past the limit", async () => {
    // Hand-built fragment (encodeShare refuses to make one).
    const json = new TextEncoder().encode(JSON.stringify({ k: "rules", d: { title: "a".repeat(300 * 1024) } }));
    const cs = new CompressionStream("deflate-raw");
    const z = new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(cs)).arrayBuffer());
    const s = `1z${toBase64Url(z)}`;
    expect(s.length).toBeLessThan(MAX_SHARE_CHARS);
    expect(await decodeShare(s, "rules", asDoc)).toEqual({ ok: false, error: "too_big" });
  });

  it("has text for every error", () => {
    for (const v of Object.values(SHARE_ERROR_TEXT)) expect(v.length).toBeGreaterThan(10);
  });

  it("reads d= from a hash with other params", () => {
    expect(shareFromHash("#d=1zabc")).toBe("1zabc");
    expect(shareFromHash("#x=1&d=1jxyz")).toBe("1jxyz");
    expect(shareFromHash("")).toBeNull();
  });
});
