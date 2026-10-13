import { decodeShare, evaluatePlayer, parseRequirementsCard, shareFromHash } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_PERCENT, cardTitle, cardToForm, deleteCard, emptyBand, emptySample, formToCard, latestMine, listCards, newCard, parseMyDoc,
  emptyGroup, newGroupId, parseExcluded, parseGroupPct, parsePct, parseQty, publishLink, saveCard, saveMine,
} from "./kingdom-requirements";
import { listDocs, memoryStorage } from "./kingdom-store";

describe("inputs", () => {
  it("parseQty accepts game quantities", () => {
    expect(parseQty("")).toBeNull();
    expect(parseQty("10.5m")).toEqual({ ok: true, value: 10_500_000 });
    expect(parseQty("1,200,000")).toEqual({ ok: true, value: 1_200_000 });
    expect(parseQty("abc")).toMatchObject({ ok: false });
    expect(parseQty("9999999b")).toMatchObject({ ok: false, error: "This number is too large." });
  });
  it("parsePct", () => {
    expect(parsePct("250")).toEqual({ ok: true, value: 250 });
    expect(parsePct("312.5 %")).toEqual({ ok: true, value: 312.5 });
    expect(parsePct("0")).toMatchObject({ ok: false });
    expect(parsePct("x")).toMatchObject({ ok: false });
    expect(parsePct(" ")).toBeNull();
  });
});

describe("new card and form round trip", () => {
  it("new card: first preset, example 250% band, three fictional samples", () => {
    const c = newCard();
    expect(c.formula).toBe("t4 * 10 + t5 * 20 + deads * 50");
    expect(c.requirement).toEqual({ mode: "percent", bands: [{ minPower: 0, maxPower: null, percent: EXAMPLE_PERCENT }] });
    expect(c.sampleAccounts.map((s) => s.name)).toEqual(["Sample A", "Sample B", "Sample C"]);
    for (const s of c.sampleAccounts) expect(evaluatePlayer(c, s.stats).ok).toBe(true);
  });

  it("card → form → card keeps everything", () => {
    const c = newCard(new Date("2026-10-13T00:00:00Z"));
    c.kingdom = "K1234";
    c.notes = "Farms are exempt.";
    const back = formToCard(cardToForm(c), new Date("2026-10-13T00:00:00Z"));
    expect(back.errors).toEqual({});
    expect(back.bandIssues).toEqual([]);
    expect(back.card).toEqual(c);
  });

  it("reports field and band errors", () => {
    const f = cardToForm(newCard());
    f.bands = [{ ...emptyBand("0"), max: "20m", pct: "250" }, { ...emptyBand("10m"), pct: "300" }];
    expect(formToCard(f).bandIssues[0]!.message).toMatch(/overlaps/);
    expect(formToCard(f).errors).toEqual({ "band-1-min": "Band 2 overlaps band 1: start it at or above where band 1 ends." });
    f.bands = [{ ...emptyBand("x"), pct: "" }];
    const r = formToCard(f);
    expect(r.errors["band-0-min"]).toMatch(/whole number/);
    expect(r.errors["band-0-pct"]).toMatch(/percent/);
    f.bands = [];
    expect(formToCard(f).bandIssues[0]!.message).toMatch(/at least one/);
    f.mode = "fixed";
    expect(formToCard(f).errors.fixed).toBe("Enter the DKP target.");
    f.fixed = "5m";
    expect(formToCard(f).card.requirement).toEqual({ mode: "fixed", target: 5_000_000 });
    const s = emptySample(3);
    expect(s.name).toBe("Sample D");
    s.values.t4 = "lots";
    f.samples = [s];
    expect(formToCard(f).errors[`sample-${s.id}-t4`]).toMatch(/whole number/);
  });

  it("titles", () => {
    expect(cardTitle({ title: "", kingdom: "" })).toBe("Untitled requirements card");
    expect(cardTitle({ title: "", kingdom: "K1" })).toBe("K1 requirements");
    expect(cardTitle({ title: "T", kingdom: "K1" })).toBe("T");
  });
});

describe("store", () => {
  it("saves, lists and deletes cards", () => {
    const st = memoryStorage();
    const c = newCard();
    c.kingdom = "K1234";
    saveCard(c, st);
    expect(listCards(st)).toHaveLength(1);
    expect(listCards(st)[0]!.kingdom).toBe("K1234");
    expect(listDocs("requirements", st)[0]!.title).toBe("K1234 requirements");
    deleteCard(c.id, st);
    expect(listCards(st)).toEqual([]);
  });

  it("my requirements: saves without sandbox data and loads the latest", () => {
    const st = memoryStorage();
    expect(latestMine(st)).toBeNull();
    const c = newCard();
    saveMine({ card: c, myStats: { power: "10m", t4: "1k" }, selfMade: false }, st, );
    const m = latestMine(st)!;
    expect(m.card.formula).toBe(c.formula);
    expect(m.card.sampleAccounts).toEqual([]);
    expect(m.myStats).toEqual({ power: "10m", t4: "1k" });
    expect(parseMyDoc({ card: "x" })).toBeNull();
    expect(parseMyDoc({ card: {}, myStats: { t4: 5, t5: "2" }, selfMade: "yes" })).toMatchObject({ myStats: { t5: "2" }, selfMade: false });
  });
});

describe("requirement groups", () => {
  it("parseGroupPct", () => {
    expect(parseGroupPct("")).toBeNull();
    expect(parseGroupPct("80")).toEqual({ ok: true, value: 80 });
    expect(parseGroupPct("112.5%")).toEqual({ ok: true, value: 112.5 });
    expect(parseGroupPct("0")).toMatchObject({ ok: false });
    expect(parseGroupPct("1001")).toEqual({ ok: false, error: "Enter more than 0 and at most 1,000." });
    expect(parseGroupPct("eighty")).toEqual({ ok: false, error: "Enter a percent like 80." });
  });

  it("new group ids are short and unique", () => {
    const seq = [0, 0, 0.5];
    const rnd = () => seq.shift()!;
    const a = newGroupId([], () => 0);
    expect(a).toBe("g000000");
    expect(newGroupId([a], rnd)).not.toBe(a);
    expect(emptyGroup([])).toMatchObject({ name: "", pct: "", id: expect.stringMatching(/^g[0-9a-z]{6}$/) });
  });

  it("form round trip and field errors", () => {
    const f = cardToForm(newCard());
    expect(f.groups).toEqual([]);
    f.groups = [{ ...emptyGroup([]), id: "young", name: "Accounts under 6 months", pct: "80" }];
    const c = formToCard(f);
    expect(c.errors).toEqual({});
    expect(c.card.groups).toEqual([{ id: "young", name: "Accounts under 6 months", percent: 80 }]);
    expect(cardToForm(c.card).groups[0]).toMatchObject({ id: "young", name: "Accounts under 6 months", pct: "80" });

    f.groups = [{ ...emptyGroup([]), name: "", pct: "" }, { ...emptyGroup([]), name: "A", pct: "x" }, { ...emptyGroup([]), name: "a", pct: "90" }, { ...emptyGroup([]), name: "B", pct: "90" }];
    const r = formToCard(f);
    expect(r.errors["group-0-name"]).toBe("Enter a name for this group.");
    expect(r.errors["group-0-pct"]).toBe("Enter the percent of the normal target.");
    expect(r.errors["group-1-pct"]).toBe("Enter a percent like 80.");
    expect(r.errors["group-2-name"]).toBe("Group 3 has the same name as group 2.");
    expect(r.errors["group-3-name"]).toBeUndefined();
  });

  it("my doc keeps the picked group only when the card has it", () => {
    const c = { ...newCard(), groups: [{ id: "young", name: "Young", percent: 80 }] };
    expect(parseMyDoc({ card: c, group: "young" })!.group).toBe("young");
    expect(parseMyDoc({ card: c, group: "gone" })!.group).toBeUndefined();
  });
});

describe("excluded deads", () => {
  it("form round trip keeps the rule and its label", () => {
    const f = cardToForm(newCard());
    expect(f.excludedOn).toBe(false);
    expect(f.excludedLabel).toBe("zeroed in a 'terrible trade'");
    f.excludedOn = true;
    f.excludedLabel = "zeroed by a bad trade";
    const c = formToCard(f).card;
    expect(c.excludedDeads).toEqual({ enabled: true, label: "zeroed by a bad trade" });
    expect(cardToForm(c)).toMatchObject({ excludedOn: true, excludedLabel: "zeroed by a bad trade" });
    f.excludedLabel = "  ";
    expect(formToCard(f).card.excludedDeads.label).toBe("zeroed in a 'terrible trade'");
  });

  it("parseExcluded: empty, bad text, more than deads", () => {
    expect(parseExcluded("", 100)).toBeNull();
    expect(parseExcluded("50", 100)).toEqual({ ok: true, value: 50 });
    expect(parseExcluded("1k", 1000)).toEqual({ ok: true, value: 1000 });
    expect(parseExcluded("x", 100)).toMatchObject({ ok: false, error: expect.stringMatching(/whole number/) });
    expect(parseExcluded("101", 100)).toEqual({ ok: false, error: "This can't be more than your deads (100)." });
    expect(parseExcluded("1", null)).toEqual({ ok: false, error: "This can't be more than your deads (0)." });
  });

  it("my doc keeps the excluded deads text", () => {
    const st = memoryStorage();
    saveMine({ card: newCard(), myStats: { deads: "300" }, selfMade: false, excludedDeads: "100" }, st);
    expect(latestMine(st)!.excludedDeads).toBe("100");
    expect(parseMyDoc({ card: {}, excludedDeads: 5 })!.excludedDeads).toBeUndefined();
  });
});

describe("publish link", () => {
  it("points at /kingdom/my/ and decodes back without sample accounts", async () => {
    const c = newCard();
    c.kingdom = "K1234";
    const url = await publishLink(c, "https://example.test");
    expect(url.startsWith("https://example.test/kingdom/my/#d=")).toBe(true);
    const r = await decodeShare(shareFromHash(new URL(url).hash), "requirements", parseRequirementsCard);
    expect(r.ok && r.data.kingdom).toBe("K1234");
    expect(r.ok && r.data.sampleAccounts).toEqual([]);
    expect(url).not.toContain("Sample");
  });
});
