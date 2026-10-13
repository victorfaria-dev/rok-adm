import { emptyMgeDoc, planMge } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { addCandidatesFromText, deleteMgePlan, listMgePlans, loadMgePlan, localDay, longDay, publishMge, readMgeLink, saveMgePlan } from "./kingdom-mge";
import { memoryStorage, saveDoc } from "./kingdom-store";

let n = 0;
const ids = () => `c${++n}`;

describe("MGE plans in the council store", () => {
  it("saves, lists, loads and deletes", () => {
    const st = memoryStorage();
    const d = { ...emptyMgeDoc("p1"), title: "K1 MGE" };
    saveMgePlan(d, st, new Date("2026-10-13T10:00:00Z"));
    expect(listMgePlans(st).map((x) => x.title)).toEqual(["K1 MGE"]);
    const back = loadMgePlan("p1", st)!;
    expect(back.title).toBe("K1 MGE");
    expect(back.updatedAt).toBe("2026-10-13T10:00:00.000Z");
    deleteMgePlan("p1", st);
    expect(loadMgePlan("p1", st)).toBeNull();
  });

  it("loads a corrupted plan tolerantly and ignores other kinds", () => {
    const st = memoryStorage();
    saveDoc({ id: "p2", kind: "mge", title: "x", data: { slotsPerEvent: "lots", candidates: "no" } }, st);
    saveDoc({ id: "r1", kind: "rules", title: "r", data: {} }, st);
    const d = loadMgePlan("p2", st)!;
    expect(d.slotsPerEvent).toBe(10);
    expect(d.candidates).toEqual([]);
    expect(loadMgePlan("r1", st)).toBeNull();
  });
});

describe("addCandidatesFromText", () => {
  it("adds new names, updates scores of listed names (any case) and reports bad lines", () => {
    const d0 = { ...emptyMgeDoc("p"), candidates: [{ id: "x", name: "Alpha", score: 1, tags: [] }, { id: "y", name: "Echo", score: 2, tags: [] }] };
    const r = addCandidatesFromText(d0, "alpha, 5\nBravo, 4.2m\nCharlie\nDelta, 1.5\necho", ids);
    expect(r.added).toBe(2);
    expect(r.updated).toEqual(["Alpha"]);
    expect(r.duplicates).toEqual(["echo"]);
    expect(r.errors.map((e) => e.line)).toEqual([4]);
    expect(r.doc.candidates.map((c) => [c.id, c.name, c.score])).toEqual([["x", "Alpha", 5], ["y", "Echo", 2], ["c1", "Bravo", 4_200_000], ["c2", "Charlie", null]]);
  });

  it("stops at the candidate limit", () => {
    const r = addCandidatesFromText(emptyMgeDoc("p"), Array.from({ length: 305 }, (_, i) => `G${i}`).join("\n"), ids);
    expect(r.added).toBe(300);
    expect(r.overLimit).toBe(5);
  });
});

describe("public link", () => {
  it("round-trips through the URL fragment, scores off by default", async () => {
    const d = {
      ...emptyMgeDoc("p"), title: "K1", policy: "score" as const, slotsPerEvent: 1,
      candidates: [{ id: "a", name: "Alpha", score: 4_200_000, tags: [] }],
      events: [{ id: "e", date: "2026-10-01", commander: "Cao Cao", applicants: [], overrides: [], locked: false, result: null }],
    };
    const link = await publishMge(d, planMge(d), false, "2026-10-13", "https://x.test");
    expect(link.url.startsWith("https://x.test/kingdom/mge/view/#d=1")).toBe(true);
    expect(link.hint).toBe("ok");
    const r = await readMgeLink(new URL(link.url).hash);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.events[0]!.slots).toEqual([{ slot: 1, name: "Alpha", reason: "score rank 1" }]);
      expect(r.data.publishedOn).toBe("2026-10-13");
    }
    const withScores = await publishMge(d, planMge(d), true, "2026-10-13", "https://x.test");
    const r2 = await readMgeLink(new URL(withScores.url).hash);
    expect(r2.ok && r2.data.events[0]!.slots[0]!.score).toBe(4_200_000);
  });

  it("bad and empty links give typed errors", async () => {
    expect(await readMgeLink("")).toEqual({ ok: false, error: "empty" });
    expect(await readMgeLink("#d=1z!!!")).toEqual({ ok: false, error: "bad_encoding" });
  });
});

describe("dates", () => {
  it("formats days", () => {
    expect(localDay(new Date(2026, 9, 3, 23, 0))).toBe("2026-10-03");
    expect(longDay("2026-10-01")).toBe("Thu, Oct 1, 2026");
  });
});
