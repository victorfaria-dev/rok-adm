import { summarizeLedger, type MgePublic, type ShipmentEntry } from "@rokadm/planner";
import { describe, expect, it, vi } from "vitest";
import {
  DISCORD_MAX, checkWebhookUrl, discordPayload, farmsWeekMessage, maskWebhook, mgeResultsMessage, recruitMessage, rulesLinkMessage, sendToDiscord,
} from "./discord";
import { forgetWebhook, memoryStorage, readWebhook, saveWebhook, WEBHOOK_KEY, KINGDOM_KEY, exportKingdom, readKingdom } from "./kingdom-store";

const ID = "123456789012345678";
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdEfGhIjKlMnOpQrStUvWxYz0123";
const URL_OK = `https://discord.com/api/webhooks/${ID}/${TOKEN}`;

describe("checkWebhookUrl", () => {
  it("accepts discord.com and discordapp.com webhooks and canonicalises them", () => {
    expect(checkWebhookUrl(`  ${URL_OK}/ `)).toEqual({ ok: true, url: URL_OK, id: ID });
    expect(checkWebhookUrl(URL_OK.replace("discord.com", "discordapp.com"))).toMatchObject({ ok: true });
  });

  it.each([
    ["", "Cole"],
    [URL_OK.replace("https", "http"), "https://"],
    [URL_OK.replace("discord.com", "evil.com"), "Só webhooks"],
    [URL_OK.replace("discord.com", "discord.com.evil.com"), "Só webhooks"],
    [URL_OK.replace("discord.com", "ptb.discord.com"), "Só webhooks"],
    [URL_OK.replace("discord.com", "discord.com:8443"), "Só webhooks"],
    [URL_OK.replace("https://", "https://user:pw@"), "Só webhooks"],
    [`${URL_OK}?wait=true`, "Remova"],
    [`${URL_OK}#x`, "Remova"],
    [`https://discord.com/api/webhooks/${ID}`, "não é uma URL de webhook do Discord"],
    [`https://discord.com/api/webhooks/abc/${TOKEN}`, "não é uma URL de webhook do Discord"],
    [`https://discord.com/api/webhooks/${ID}/short`, "não é uma URL de webhook do Discord"],
    [`https://discord.com/api/webhooks/${ID}/${TOKEN}/slack`, "não é uma URL de webhook do Discord"],
    [`https://discord.com/channels/${ID}/${ID}`, "não é uma URL de webhook do Discord"],
    ["javascript:alert(1)", "https://"],
  ])("refuses %s", (raw, msg) => {
    const r = checkWebhookUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(msg);
  });

  it("masks the token and most of the id", () => {
    const m = maskWebhook(URL_OK);
    expect(m).toBe("discord.com/api/webhooks/1234…5678 (token oculto)");
    expect(m).not.toContain(TOKEN.slice(0, 10));
  });
});

describe("webhook storage", () => {
  it("lives in its own key, outside the council export", () => {
    const st = memoryStorage();
    expect(readWebhook(st)).toBeNull();
    expect(saveWebhook(URL_OK, st)).toBe(true);
    expect(readWebhook(st)).toBe(URL_OK);
    expect(st.getItem(KINGDOM_KEY)).toBeNull();
    expect(exportKingdom(readKingdom(st))).not.toContain(TOKEN);
    st.setItem(WEBHOOK_KEY, "{bad");
    expect(readWebhook(st)).toBeNull();
    forgetWebhook(st);
    expect(st.getItem(WEBHOOK_KEY)).toBeNull();
  });
});

describe("message builders", () => {
  const pub: MgePublic = {
    title: "K1 *MGE*", policy: "score", slotsPerEvent: 2, cooldownEvents: 0, applicationsRequired: false, includeScores: false, publishedOn: "2026-10-13",
    events: [
      { date: "2026-10-01", commander: "Cao Cao", locked: true, slots: [{ slot: 1, name: "@everyone", reason: "score rank 1", score: 5 }], unfilled: [2] },
    ],
  };

  it("MGE: title, rule, slots in order, escaped names, no scores unless included", () => {
    const r = mgeResultsMessage(pub, "https://x.test/kingdom/mge/view/#d=1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content).toBe([
      "**Resultados do MGE: K1 \\*MGE\\***\nRegra: Pontuação, 2 vagas por evento.",
      "**qui., 1 de out. de 2026, Cao Cao** (final)\n1. @​everyone — score rank 1\n2. não preenchida",
      "Registro completo: https://x.test/kingdom/mge/view/#d=1",
    ].join("\n\n"));
    const withScores = mgeResultsMessage({ ...pub, includeScores: true }, null);
    expect(withScores.ok && withScores.content).toContain("@​everyone (5) — score rank 1");
    expect(mgeResultsMessage({ ...pub, events: [] }, null)).toMatchObject({ ok: false });
  });

  it("MGE: long plans stay within 2,000 characters and say how many events were left out", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      date: `2026-${String(1 + (i % 12)).padStart(2, "0")}-10`, commander: "X".repeat(30), locked: false,
      slots: Array.from({ length: 5 }, (_, j) => ({ slot: j + 1, name: `Governor ${i}-${j}`, reason: "rotation: longest wait since last slot (never had one)" })),
      unfilled: [],
    }));
    const r = mgeResultsMessage({ ...pub, events: many }, "https://x.test/" + "a".repeat(2000));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.content.length).toBeLessThanOrEqual(DISCORD_MAX);
    expect(r.content).toMatch(/…e mais \d+ eventos\./);
    expect(r.content).toContain("o link é longo demais para esta mensagem");
    // One huge event alone is cut by lines.
    const huge = mgeResultsMessage({ ...pub, events: [{ ...many[0]!, slots: Array.from({ length: 60 }, (_, j) => ({ slot: j + 1, name: "N".repeat(40), reason: "R".repeat(60) })) }] }, null);
    expect(huge.ok && huge.content.length).toBeLessThanOrEqual(DISCORD_MAX);
    expect(huge.ok && huge.content).toContain("\n…");
  });

  it("rules and recruitment", () => {
    expect(rulesLinkMessage("K1 rules", null)).toMatchObject({ ok: false });
    expect(rulesLinkMessage("K1 rules", "https://x.test/r#d=1")).toEqual({ ok: true, content: "**K1 rules**\nLeia as regras do nosso reino (somente leitura): https://x.test/r#d=1" });
    expect(rulesLinkMessage("x", `https://x.test/${"a".repeat(2000)}`)).toMatchObject({ ok: false });
    expect(recruitMessage("  ")).toMatchObject({ ok: false });
    expect(recruitMessage("a".repeat(2001))).toMatchObject({ ok: false });
    expect(recruitMessage("Join K1")).toEqual({ ok: true, content: "Join K1" });
  });

  it("farms week summary", () => {
    const e = (id: string, farmId: string, resource: ShipmentEntry["resource"], gross: number, net: number): ShipmentEntry =>
      ({ id, farmId, date: "2026-10-06", resource, taxRate: 0.1, gross, net, note: "" });
    const range = { from: "2026-10-05", to: "2026-10-11" };
    const s = summarizeLedger([e("1", "f1", "food", 1_000_000, 900_000), e("2", "f2", "wood", 500_000, 450_000)], range);
    const r = farmsWeekMessage(s, range, { f1: "Farm_1", f2: "Farm 2" });
    expect(r).toEqual({
      ok: true,
      content: [
        "**Envios das contas farm, seg., 5 de out. de 2026 – dom., 11 de out. de 2026**\nRecebido pela principal: **1.350.000** (2 envios, imposto pago 150.000)",
        "Comida: enviado 1.000.000, recebido 900.000\nMadeira: enviado 500.000, recebido 450.000",
        "Por conta farm:\nFarm\\_1: recebido 900.000\nFarm 2: recebido 450.000",
      ].join("\n\n"),
    });
    expect(farmsWeekMessage(summarizeLedger([], range), range, {})).toMatchObject({ ok: false });
  });

  it("payload never pings", () => {
    expect(discordPayload("@everyone hi")).toEqual({ content: "@everyone hi", allowed_mentions: { parse: [] } });
  });
});

describe("sendToDiscord", () => {
  const res = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
    new Response(body === undefined ? null : JSON.stringify(body), { status, headers });

  it("POSTs JSON with no mentions, no credentials and no referrer", async () => {
    const f = vi.fn(async () => res(204));
    expect(await sendToDiscord(`${URL_OK}/`, "hi", f as unknown as typeof fetch)).toEqual({ ok: true });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(URL_OK);
    expect(init).toMatchObject({ method: "POST", credentials: "omit", referrerPolicy: "no-referrer" });
    expect(JSON.parse(init.body as string)).toEqual({ content: "hi", allowed_mentions: { parse: [] } });
  });

  it("maps 429, 404, 400, 500 and network errors to messages without the URL", async () => {
    const run = (r: Response | Error) => sendToDiscord(URL_OK, "hi", (async () => { if (r instanceof Error) throw r; return r; }) as typeof fetch);
    const rate = await run(res(429, { retry_after: 2.3, global: false }));
    expect(rate).toMatchObject({ ok: false, kind: "rate", retryAfter: 3 });
    expect(await run(res(429, undefined, { "Retry-After": "7" }))).toMatchObject({ kind: "rate", retryAfter: 7 });
    expect(await run(res(404, { code: 10015 }))).toMatchObject({ kind: "gone" });
    expect(await run(res(400, { content: ["bad"] }))).toMatchObject({ kind: "refused" });
    expect(await run(res(503))).toMatchObject({ kind: "server" });
    expect(await run(new TypeError("Failed to fetch"))).toMatchObject({ kind: "network" });
    for (const r of [rate, await run(res(404))]) expect(JSON.stringify(r)).not.toContain(TOKEN);
  });

  it("refuses bad URLs and empty or long text without calling fetch", async () => {
    const f = vi.fn();
    expect(await sendToDiscord("https://evil.com/api/webhooks/1/2", "hi", f as unknown as typeof fetch)).toMatchObject({ ok: false });
    expect(await sendToDiscord(URL_OK, "", f as unknown as typeof fetch)).toMatchObject({ ok: false });
    expect(await sendToDiscord(URL_OK, "a".repeat(2001), f as unknown as typeof fetch)).toMatchObject({ ok: false });
    expect(f).not.toHaveBeenCalled();
  });
});
