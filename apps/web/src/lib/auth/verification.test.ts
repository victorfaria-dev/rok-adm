import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fakeSupabase } from "./fake-supabase";
import {
  CODE_CARD, CODE_CARD_SAFE, SCREENSHOT_MAX_BYTES, claimJson, codeCardFileName, countdown, crossCheck, drawCodeCard, emptyClaim, fitWithin,
  mergeOcr, startVerification, submitVerification, uploadScreenshot,
} from "./verification";

const sql = readFileSync(new URL("../../../../../supabase/migrations/20261013200007_verification.sql", import.meta.url), "utf8");

describe("code image", () => {
  function fakeCtx() {
    const ops: { op: string; args: unknown[]; fillStyle?: string; font?: string }[] = [];
    const ctx: Record<string, unknown> = { fillStyle: "", strokeStyle: "", font: "", lineWidth: 0, textAlign: "", textBaseline: "" };
    for (const m of ["fillRect", "strokeRect", "fillText"]) ctx[m] = (...args: unknown[]) => ops.push({ op: m, args, fillStyle: ctx.fillStyle as string, font: ctx.font as string });
    return { ctx: ctx as unknown as CanvasRenderingContext2D, ops };
  }
  it("is a 4:3 white card with the request's code in big red digits inside a 10% safe margin", () => {
    expect(CODE_CARD.width / CODE_CARD.height).toBeCloseTo(4 / 3);
    expect(CODE_CARD_SAFE.x).toBeCloseTo(CODE_CARD.width * 0.1);
    expect(CODE_CARD_SAFE.y).toBeCloseTo(CODE_CARD.height * 0.1);
    const { ctx, ops } = fakeCtx();
    drawCodeCard(ctx, "042719");
    expect(ops[0]).toMatchObject({ op: "fillRect", args: [0, 0, 1200, 900], fillStyle: "rgb(255, 255, 255)" });
    const texts = ops.filter((o) => o.op === "fillText");
    // Only this code's digits (thin-spaced), in red, large.
    expect(String(texts[0]!.args[0]).replace(/ /g, "")).toBe("042719");
    expect(texts[0]!.fillStyle).toBe("rgb(200, 16, 32)");
    expect(Number(/(\d+)px/.exec(texts[0]!.font!)![1])).toBeGreaterThanOrEqual(200);
    // Every text is centred with a max width inside the safe area.
    for (const t of texts) {
      expect(t.args[1]).toBe(CODE_CARD.width / 2);
      expect(Number(t.args[3])).toBeLessThanOrEqual(CODE_CARD.width - 2 * CODE_CARD_SAFE.x);
      expect(Number(t.args[2])).toBeGreaterThan(CODE_CARD_SAFE.y);
      expect(Number(t.args[2])).toBeLessThan(CODE_CARD.height - CODE_CARD_SAFE.y);
    }
    expect(() => drawCodeCard(ctx, "12345")).toThrow();
    expect(codeCardFileName("042719")).toBe("kingdomops-code-042719.png");
  });
});

describe("checks before sending", () => {
  const filled = { ...emptyClaim(), governorId: "12345678", name: "Big Bob", cityHall: "22", albumName: "big  bob", albumCode: "042 719" };
  it("level 3 needs this request's code and matching names", () => {
    const ok = crossCheck(filled, 3, "042719");
    expect(ok.every((c) => c.ok)).toBe(true);
    const other = crossCheck({ ...filled, albumCode: "111111" }, 3, "042719");
    expect(other.find((c) => c.id === "album_code")!.ok).toBe(false);
    expect(crossCheck({ ...filled, albumName: "Someone" }, 3, "042719").find((c) => c.id === "album_name")!.ok).toBe(false);
    expect(crossCheck({ ...filled, cityHall: "26" }, 3, "042719").find((c) => c.id === "city_hall")!.ok).toBe(false);
  });
  it("level 2 does not ask for the Album", () => {
    expect(crossCheck(filled, 2, "000000").map((c) => c.id)).toEqual(["governor_id", "city_hall"]);
  });
  it("OCR fills only empty fields", () => {
    const f = mergeOcr({ ...emptyClaim(), name: "Typed" }, "profile", { governorId: "987654", name: "Read", power: 1200000 });
    expect(f).toMatchObject({ governorId: "987654", name: "Typed", power: "1200000" });
    expect(mergeOcr(emptyClaim(), "album", { name: "Bob", code: "123456" })).toMatchObject({ albumName: "Bob", albumCode: "123456" });
    expect(mergeOcr(emptyClaim(), "city_hall", { cityHall: 21, vip: 8, power: 5 })).toMatchObject({ cityHall: "21", vip: "8", power: "5" });
  });
  it("claim JSON parses numbers and records where values came from", () => {
    const j = claimJson({ ...filled, power: "1,200,000" }, crossCheck(filled, 3, "042719"), true) as Record<string, unknown>;
    expect(j).toMatchObject({ governorId: "12345678", power: 1200000, cityHall: 22, source: "device-ocr+typed" });
    expect(j.checks).toEqual({ governor_id: true, city_hall: true, album_code: true, album_name: true });
  });
  it("countdown", () => {
    const t = Date.parse("2026-10-13T12:00:00Z");
    expect(countdown("2026-10-13T13:00:00Z", t)).toEqual({ text: "60:00", over: false });
    expect(countdown("2026-10-13T12:00:05Z", t)).toEqual({ text: "0:05", over: false });
    expect(countdown("2026-10-13T11:59:00Z", t).over).toBe(true);
  });
  it("screenshots are scaled down, never up", () => {
    expect(fitWithin(1170, 2532, 2000)).toEqual({ width: 924, height: 2000 });
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
});

describe("rules shared with the database", () => {
  it("1-hour window, single-use code, moderator-only levels, private bucket", () => {
    expect(sql).toContain("now() + interval '1 hour'");
    expect(sql).toContain("check (code_expires_at <= created_at + interval '1 hour')");
    expect(sql).toContain("create unique index verification_requests_code_once on public.verification_requests (code);");
    expect(sql).toMatch(/\('verification', 'verification', false, 3145728/);
    expect(sql).toContain(`${SCREENSHOT_MAX_BYTES}`);
    expect(sql).toContain("if not public.is_moderator() then raise exception 'Moderators only.'");
  });
});

describe("verification api (fake client)", () => {
  const req = { id: "r1", user_id: "u1", account_id: "a1", requested_level: 3, code: "042719", code_expires_at: "2026-10-13T13:00:00Z", status: "awaiting_screenshots" };
  it("start returns the new request with its own code", async () => {
    const f = fakeSupabase({ rpc: { start_verification: () => ({ data: req }) } });
    expect(await startVerification(f.client, "a1", 3)).toEqual({ ok: true, request: req });
    expect(f.calls[0]).toEqual({ op: "rpc.start_verification", args: [{ p_account_id: "a1", p_level: 3 }] });
    const busy = fakeSupabase({ rpc: { start_verification: () => ({ error: { message: "This city already has a verification in progress.", code: "23505" } }) } });
    expect(await startVerification(busy.client, "a1", 3)).toEqual({ ok: false, message: "Esta cidade já tem uma verificação em andamento." });
  });
  it("screenshots go to the private bucket under user/request/slot", async () => {
    const f = fakeSupabase();
    const r = await uploadScreenshot(f.client, "u1", "r1", "album", new Blob([new Uint8Array(10)], { type: "image/jpeg" }));
    expect(r).toEqual({ ok: true, path: "u1/r1/album.jpg" });
    expect(f.files.has("verification/u1/r1/album.jpg")).toBe(true);
    expect((await uploadScreenshot(f.client, "u1", "r1", "album", new Blob([new Uint8Array(SCREENSHOT_MAX_BYTES + 1)], { type: "image/jpeg" }))).ok).toBe(false);
  });
  it("submit sends the album code; database refusals become plain words", async () => {
    const f = fakeSupabase({ rpc: { submit_verification: () => ({ data: req }) } });
    expect(await submitVerification(f.client, "r1", { a: 1 }, ["u1/r1/album.jpg"], "042719")).toEqual({ ok: true });
    expect(f.calls[0]!.args[0]).toEqual({ p_request_id: "r1", p_claimed: { a: 1 }, p_paths: ["u1/r1/album.jpg"], p_album_code: "042719" });
    for (const [message, want] of [
      ["This code has expired. Start again.", /expirou/],
      ["The code in the Album screenshot does not match this verification's code.", /não confere/],
      ["This code was already used. Start again.", /já foi usado/],
    ] as const) {
      const g = fakeSupabase({ rpc: { submit_verification: () => ({ error: { message, code: "22023" } }) } });
      const r = await submitVerification(g.client, "r1", {}, ["p"], "1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toMatch(want);
    }
  });
});
