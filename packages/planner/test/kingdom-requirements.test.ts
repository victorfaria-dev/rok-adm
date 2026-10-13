import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_POWER_BASIS, EXCLUDED_DEADS_DEFAULT_LABEL, EXCLUDED_DEADS_FACT_ID, EXCLUDED_DEADS_LABEL_MAX, REQ_MAX_BANDS, bandFor, cardSharePayload,
  REQ_GROUP_MAX_PERCENT, REQ_GROUP_NAME_MAX, REQ_MAX_GROUPS,
  countedStats, defaultExcludedDeads, defaultRequirementsCard, evaluatePlayer, excludedDeadsIssue, excludedDeadsText, groupFor, groupText,
  normaliseBands, normaliseGroups, parseRequirementsCard, rankSamples, stageLabel, targetFor, validateBands, validateGroups, type PowerBand, type RequirementsCard,
} from "../src/kingdom-requirements";
import { decodeShare, encodeShare } from "../src/kingdom-codec";

const BANDS: PowerBand[] = [
  { minPower: 0, maxPower: 20_000_000, percent: 250 },
  { minPower: 20_000_000, maxPower: 50_000_000, percent: 300 },
  { minPower: 50_000_000, maxPower: null, percent: 400 },
];
const card = (over: Partial<RequirementsCard> = {}): RequirementsCard =>
  defaultRequirementsCard({ formula: "t4 * 10 + t5 * 20 + deads * 50", requirement: { mode: "percent", bands: BANDS }, ...over }, new Date("2026-10-13T00:00:00Z"));

describe("bands", () => {
  it("valid bands pass", () => {
    expect(validateBands(BANDS)).toEqual([]);
    expect(validateBands([{ minPower: 0, maxPower: null, percent: 250 }])).toEqual([]);
    expect(validateBands([{ minPower: 0, maxPower: 10, percent: 1 }, { minPower: 20, maxPower: null, percent: 2 }])).toEqual([]); // gap allowed
  });

  it("flags empty, too many, overlap, unsorted, open middle, bad percent and bounds", () => {
    expect(validateBands([])[0]!.message).toMatch(/at least one/);
    const many = Array.from({ length: REQ_MAX_BANDS + 1 }, (_, i) => ({ minPower: i * 10, maxPower: i * 10 + 10, percent: 100 }));
    expect(validateBands(many).some((x) => x.index === -1)).toBe(true);
    expect(validateBands([{ minPower: 0, maxPower: 30, percent: 1 }, { minPower: 20, maxPower: null, percent: 1 }])[0]).toMatchObject({ index: 1, field: "min", message: expect.stringMatching(/overlaps band 1/) });
    expect(validateBands([{ minPower: 50, maxPower: 60, percent: 1 }, { minPower: 0, maxPower: 10, percent: 1 }])[0]!.message).toMatch(/sort/);
    expect(validateBands([{ minPower: 0, maxPower: null, percent: 1 }, { minPower: 10, maxPower: null, percent: 1 }]).map((x) => x.message).join(" ")).toMatch(/only the last band/);
    expect(validateBands([{ minPower: 0, maxPower: null, percent: 0 }])[0]!.message).toMatch(/percent/);
    expect(validateBands([{ minPower: 0, maxPower: null, percent: 20_000 }])[0]!.message).toMatch(/percent/);
    expect(validateBands([{ minPower: 10, maxPower: 10, percent: 1 }])[0]!.message).toMatch(/upper limit/);
    expect(validateBands([{ minPower: -1, maxPower: null, percent: 1 }])[0]!.message).toMatch(/lowest power/);
  });

  it("each band issue names the field at fault; list-level issues have none", () => {
    expect(validateBands([])[0]).toEqual({ index: -1, message: "Add at least one power band." });
    const fields = (b: PowerBand[]) => validateBands(b).map((x) => `${x.index}:${x.field}`);
    expect(fields([{ minPower: -1, maxPower: null, percent: 1 }])).toEqual(["0:min"]);
    expect(fields([{ minPower: 10, maxPower: 5, percent: 1 }])).toEqual(["0:max"]);
    expect(fields([{ minPower: 0, maxPower: null, percent: 1 }, { minPower: 10, maxPower: null, percent: 1 }])).toEqual(["0:max", "1:min"]);
    expect(fields([{ minPower: 0, maxPower: null, percent: 0 }])).toEqual(["0:pct"]);
    expect(fields([{ minPower: 50, maxPower: 60, percent: 1 }, { minPower: 0, maxPower: 10, percent: 1 }])).toEqual(["1:min"]);
  });

  it("normaliseBands drops bad ones, sorts and removes overlaps", () => {
    expect(normaliseBands("x")).toEqual([]);
    expect(normaliseBands([
      { minPower: 50, maxPower: null, percent: 400 },
      { minPower: 0, maxPower: 20, percent: 250 },
      { minPower: 10, maxPower: 30, percent: 300 },
      { minPower: 20, maxPower: 50, percent: "x" },
      { minPower: 30, maxPower: 25, percent: 100 },
      null,
    ])).toEqual([{ minPower: 0, maxPower: 20, percent: 250 }, { minPower: 50, maxPower: null, percent: 400 }]);
    expect(normaliseBands(Array.from({ length: 15 }, (_, i) => ({ minPower: i, maxPower: i + 1, percent: 1 })))).toHaveLength(REQ_MAX_BANDS);
  });

  it("bandFor: inclusive min, exclusive max", () => {
    expect(bandFor(BANDS, 0)!.percent).toBe(250);
    expect(bandFor(BANDS, 19_999_999)!.percent).toBe(250);
    expect(bandFor(BANDS, 20_000_000)!.percent).toBe(300);
    expect(bandFor(BANDS, 9e12)!.percent).toBe(400);
    expect(bandFor([{ minPower: 10, maxPower: 20, percent: 1 }], 5)).toBeUndefined();
  });
});

describe("targetFor", () => {
  it("percent of power (B08-0002 example: 250% for a 10.5M player)", () => {
    expect(targetFor(card(), 10_500_000)).toEqual({ target: 26_250_000, baseTarget: 26_250_000, band: BANDS[0] });
    expect(targetFor(card(), 60_000_000)!.target).toBe(240_000_000);
  });
  it("fixed target ignores power; gaps give null; zero power gives 0", () => {
    expect(targetFor(card({ requirement: { mode: "fixed", target: 5_000_000 } }), 1)).toEqual({ target: 5_000_000, baseTarget: 5_000_000 });
    expect(targetFor(card({ requirement: { mode: "percent", bands: [{ minPower: 10, maxPower: null, percent: 100 }] } }), 5)).toBeNull();
    expect(targetFor(card(), 0)!.target).toBe(0);
    expect(targetFor(card(), Number.NaN)!.target).toBe(0);
  });
});

describe("evaluatePlayer", () => {
  it("computes DKP, target, percent, remaining and ways to close the gap", () => {
    const r = evaluatePlayer(card(), { power: 10_000_000, t4: 500_000, t5: 100_000, deads: 50_000 });
    expect(r).toMatchObject({ ok: true, dkp: 9_500_000, target: 25_000_000, remaining: 15_500_000, met: false, linear: true });
    if (!r.ok) throw new Error();
    expect(r.percentOfTarget).toBeCloseTo(38);
    expect(r.percentOfPower).toBeCloseTo(95);
    expect(r.ways).toEqual([{ variable: "t4", unitsNeeded: 1_550_000 }, { variable: "t5", unitsNeeded: 775_000 }, { variable: "deads", unitsNeeded: 310_000 }]);
  });

  it("met exactly", () => {
    const r = evaluatePlayer(card({ requirement: { mode: "fixed", target: 1000 } }), { deads: 20 });
    expect(r).toMatchObject({ ok: true, dkp: 1000, target: 1000, remaining: 0, met: true, percentOfTarget: 100, ways: [] });
  });

  it("zero power: target 0, percent unknown, met", () => {
    const r = evaluatePlayer(card(), { power: 0 });
    expect(r).toMatchObject({ ok: true, dkp: 0, target: 0, percentOfTarget: null, percentOfPower: null, remaining: 0, met: true });
  });

  it("huge numbers stay finite or become a typed error", () => {
    const r = evaluatePlayer(card(), { power: 1e15, t5: 1e15, deads: 1e15 });
    expect(r.ok && Number.isFinite(r.dkp) && Number.isFinite(r.target!)).toBe(true);
    const bad = evaluatePlayer(card({ formula: "t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4 * t4" }), { t4: 1e15 });
    expect(bad).toMatchObject({ ok: false, error: { code: "not_finite" } });
  });

  it("formula errors and division by zero are typed errors", () => {
    expect(evaluatePlayer(card({ formula: "t4 +" }), {})).toMatchObject({ ok: false, error: { code: "expected_value" } });
    expect(evaluatePlayer(card({ formula: "t4 / deads" }), { t4: 1 })).toMatchObject({ ok: false, error: { code: "div_zero" } });
  });

  it("non-linear formula: no ways; power and negative weights are never suggested", () => {
    const r = evaluatePlayer(card({ formula: "max(t4, deads)", requirement: { mode: "fixed", target: 10 } }), { t4: 1 });
    expect(r).toMatchObject({ ok: true, linear: false, ways: [], remaining: 9 });
    const r2 = evaluatePlayer(card({ formula: "deads * 10 - t1 + power * 0.1", requirement: { mode: "fixed", target: 100 } }), { power: 0 });
    expect(r2.ok && r2.ways).toEqual([{ variable: "deads", unitsNeeded: 10 }]);
  });

  it("no band for this power: target unknown", () => {
    const r = evaluatePlayer(card({ requirement: { mode: "percent", bands: [{ minPower: 10, maxPower: null, percent: 100 }] } }), { power: 5 });
    expect(r).toMatchObject({ ok: true, target: null, met: null, remaining: null, percentOfTarget: null });
  });
});

describe("parse and share", () => {
  it("tolerant parse fixes or drops bad fields", () => {
    expect(parseRequirementsCard(null)).toBeNull();
    expect(parseRequirementsCard([])).toBeNull();
    const c = parseRequirementsCard({
      id: 5, kingdom: "  K1234  extra   spaces ".repeat(5), stage: "KvK9", stageOther: "Kingsland", formula: 42, notes: "a\r\nb".padEnd(3000, "x"),
      requirement: { mode: "fixed", target: -1 }, powerBasis: "", sampleAccounts: [{ name: "A", stats: { t4: 5, t5: "x", power: -1 } }, "bad"],
    })!;
    expect(c.kingdom.length).toBeLessThanOrEqual(40);
    expect(c.stage).toBe("other");
    expect(c.stageOther).toBe("Kingsland");
    expect(c.formula).toBe("");
    expect(c.notes.length).toBe(1000);
    expect(c.notes.startsWith("a\nb")).toBe(true);
    expect(c.requirement).toEqual({ mode: "percent", bands: [] });
    expect(c.powerBasis).toBe(DEFAULT_POWER_BASIS);
    expect(c.sampleAccounts).toHaveLength(1);
    expect(c.sampleAccounts[0]!.stats).toEqual({ t4: 5 });
    expect(typeof c.id).toBe("string");
    expect(c.updatedAt).toBe(new Date(0).toISOString());
  });

  it("round-trips a full card", () => {
    const c = card({ kingdom: "K1234", stage: "KvK2", notes: "Farms excluded.", sampleAccounts: [{ id: "s1", name: "Sample A", stats: { power: 1, t4: 2 } }] });
    expect(parseRequirementsCard(JSON.parse(JSON.stringify(c)))).toEqual(c);
    expect(stageLabel(c)).toBe("KvK2");
    expect(stageLabel({ stage: "other", stageOther: "" })).toBe("Other");
  });

  it("share payload excludes sample accounts and the compare formula by default", async () => {
    const c = card({ compareFormula: "deads", sampleAccounts: [{ id: "s1", name: "Real Player", stats: { power: 1 } }] });
    const p = cardSharePayload(c);
    expect(p).not.toHaveProperty("sampleAccounts");
    expect(p).not.toHaveProperty("compareFormula");
    expect(JSON.stringify(p)).not.toContain("Real Player");
    expect(cardSharePayload(c, { includeSamples: true })).toHaveProperty("sampleAccounts");
    const code = await encodeShare("requirements", p);
    const back = await decodeShare(code, "requirements", parseRequirementsCard);
    expect(back.ok && back.data.formula).toBe(c.formula);
    expect(back.ok && back.data.sampleAccounts).toEqual([]);
    expect(back.ok && back.data.requirement).toEqual(c.requirement);
    expect((await decodeShare(code, "rules", parseRequirementsCard)).ok).toBe(false);
  });
});

describe("rankSamples", () => {
  const samples = [
    { id: "a", name: "A", stats: { t4: 100, deads: 0 } },
    { id: "b", name: "B", stats: { t4: 0, deads: 30 } },
    { id: "c", name: "C", stats: { t4: 0, deads: 30 } },
  ];
  it("ranks highest first with shared ranks for ties", () => {
    expect(rankSamples("t4 * 10 + deads * 50", samples).map((r) => r.rank)).toEqual([3, 1, 1]);
    expect(rankSamples("t4 * 10 + deads * 10", samples).map((r) => r.rank)).toEqual([1, 2, 2]);
    expect(rankSamples("t4 +", samples).every((r) => r.rank === null && r.dkp === null)).toBe(true);
  });
});

describe("requirement groups (B08-0002: adjusted by account age, seed or player group)", () => {
  // Every value below is a test value typed as if by a council; none is a sourced game number.
  const G = [{ id: "young", name: "Accounts under 6 months", percent: 80 }, { id: "seed", name: "Seed group", percent: 150 }];

  it("default and old cards have no groups", () => {
    expect(defaultRequirementsCard().groups).toEqual([]);
    expect(parseRequirementsCard({ formula: "deads" })!.groups).toEqual([]);
    expect(parseRequirementsCard({ groups: "x" })!.groups).toEqual([]);
  });

  it("validateGroups: names required and distinct, percent in range", () => {
    expect(validateGroups(G)).toEqual([]);
    expect(validateGroups([{ name: " ", percent: 80 }])).toEqual([{ index: 0, field: "name", message: "Group 1: enter a name." }]);
    expect(validateGroups([{ name: "A", percent: 80 }, { name: " a ", percent: 90 }])).toEqual([{ index: 1, field: "name", message: "Group 2 has the same name as group 1." }]);
    for (const percent of [0, -5, REQ_GROUP_MAX_PERCENT + 1, Number.NaN]) {
      expect(validateGroups([{ name: "A", percent }])).toEqual([{ index: 0, field: "pct", message: "Group 1: the percent must be more than 0 and at most 1,000." }]);
    }
  });

  it("normaliseGroups drops bad ones, de-duplicates ids and names, caps the count", () => {
    expect(normaliseGroups([
      { id: "a", name: "  Old   accounts ", percent: 90 },
      { id: "a", name: "Seed", percent: 120 },
      { id: "bad id!", name: "Third", percent: 50 },
      { name: "old accounts", percent: 70 },
      { name: "", percent: 70 },
      { name: "Zero", percent: 0 },
      { name: "Str", percent: "80" },
      null,
    ])).toEqual([
      { id: "a", name: "Old accounts", percent: 90 },
      { id: "g2", name: "Seed", percent: 120 },
      { id: "g3", name: "Third", percent: 50 },
    ]);
    expect(normaliseGroups(Array.from({ length: 12 }, (_, i) => ({ name: `G${i}`, percent: 100 })))).toHaveLength(REQ_MAX_GROUPS);
    expect(normaliseGroups([{ name: "x".repeat(100), percent: 1 }])[0]!.name).toHaveLength(REQ_GROUP_NAME_MAX);
  });

  it("targetFor scales the band target by the group percent, rounding up", () => {
    const c = card({ groups: G });
    expect(targetFor(c, 10_500_000, "young")).toEqual({ target: 21_000_000, baseTarget: 26_250_000, band: BANDS[0], group: G[0] });
    expect(targetFor(c, 10_500_000, "seed")!.target).toBe(39_375_000);
    expect(targetFor(c, 10_500_000, "nope")).toEqual({ target: 26_250_000, baseTarget: 26_250_000, band: BANDS[0] });
    expect(targetFor(c, 10_500_000, null)!.group).toBeUndefined();
    expect(targetFor(card({ groups: [{ id: "x", name: "X", percent: 33 }], requirement: { mode: "fixed", target: 10 } }), 0, "x")!.target).toBe(4); // 3.3 → 4
    expect(groupFor(c, "seed")).toEqual(G[1]);
    expect(groupFor(c, undefined)).toBeUndefined();
  });

  it("evaluatePlayer uses the group target", () => {
    const r = evaluatePlayer(card({ groups: G }), { power: 10_000_000, deads: 400_000 }, { groupId: "young" });
    expect(r).toMatchObject({ ok: true, dkp: 20_000_000, target: 20_000_000, met: true, group: G[0] });
  });

  it("plain text and share round trip", async () => {
    expect(groupText(G[0]!)).toBe("Accounts under 6 months: 80% of the normal target");
    const c = card({ groups: G });
    const back = await decodeShare(await encodeShare("requirements", cardSharePayload(c)), "requirements", parseRequirementsCard);
    expect(back.ok && back.data.groups).toEqual(G);
  });
});

describe("excluded deads (K2779 rule, B08-0001)", () => {
  const on = { enabled: true, label: EXCLUDED_DEADS_DEFAULT_LABEL };
  it("default is off with the K2779 wording; the wording matches the fact card", () => {
    expect(defaultRequirementsCard().excludedDeads).toEqual({ enabled: false, label: "zeroed in a 'terrible trade'" });
    const fact = readFileSync(join(__dirname, "../../../research/facts/B08/B08-0001.md"), "utf8");
    expect(fact).toContain("zeroed in a 'terrible trade'");
    expect(EXCLUDED_DEADS_FACT_ID).toBe("B08-0001");
  });

  it("tolerant parse: old cards without the field stay off; bad values are fixed", () => {
    expect(parseRequirementsCard({ formula: "deads" })!.excludedDeads).toEqual(defaultExcludedDeads());
    expect(parseRequirementsCard({ excludedDeads: "yes" })!.excludedDeads).toEqual(defaultExcludedDeads());
    expect(parseRequirementsCard({ excludedDeads: { enabled: "true", label: 5 } })!.excludedDeads).toEqual(defaultExcludedDeads());
    expect(parseRequirementsCard({ excludedDeads: { enabled: true, label: "  sent to   help a farm " } })!.excludedDeads).toEqual({ enabled: true, label: "sent to help a farm" });
    expect(parseRequirementsCard({ excludedDeads: { enabled: true, label: "x".repeat(200) } })!.excludedDeads.label).toHaveLength(EXCLUDED_DEADS_LABEL_MAX);
  });

  it("plain-language rule", () => {
    expect(excludedDeadsText(on)).toBe("Deads on days you were zeroed in a 'terrible trade' don't count: they are taken off your deads before your DKP is worked out.");
    expect(excludedDeadsText({ enabled: true, label: "" })).toContain("terrible trade");
  });

  it("validates excluded deads against deads", () => {
    expect(excludedDeadsIssue(100, 0)).toBeNull();
    expect(excludedDeadsIssue(100, 100)).toBeNull();
    expect(excludedDeadsIssue(100, 101)).toBe("This can't be more than your deads (100).");
    expect(excludedDeadsIssue(Number.NaN, 1)).toBe("This can't be more than your deads (0).");
    expect(excludedDeadsIssue(100, -1)).toBe("Enter 0 or more.");
  });

  it("subtracts excluded deads before the formula only when the rule is on", () => {
    const c = card({ requirement: { mode: "fixed", target: 10_000 }, excludedDeads: on });
    expect(evaluatePlayer(c, { deads: 300 }, { excludedDeads: 100 })).toMatchObject({ ok: true, dkp: 10_000, met: true });
    expect(evaluatePlayer({ ...c, excludedDeads: { ...on, enabled: false } }, { deads: 300 }, { excludedDeads: 100 })).toMatchObject({ dkp: 15_000 });
    expect(evaluatePlayer(c, { deads: 300 })).toMatchObject({ dkp: 15_000 });
    expect(countedStats(c, { deads: 50 }, { excludedDeads: 80 })).toEqual({ deads: 0 }); // clamped
    expect(countedStats(c, { t4: 5 }, { excludedDeads: Number.NaN })).toEqual({ t4: 5 });
    expect(countedStats({}, { deads: 5 }, { excludedDeads: 1 })).toEqual({ deads: 5 });
  });

  it("travels in the share payload and round-trips", async () => {
    const c = card({ excludedDeads: { enabled: true, label: "zeroed by a bad trade" } });
    expect(cardSharePayload(c)).toHaveProperty("excludedDeads");
    const back = await decodeShare(await encodeShare("requirements", cardSharePayload(c)), "requirements", parseRequirementsCard);
    expect(back.ok && back.data.excludedDeads).toEqual({ enabled: true, label: "zeroed by a bad trade" });
  });
});

describe("ceilPercent", () => {
  it("is exact for large targets with two-decimal percents and still rounds real fractions up", async () => {
    const { ceilPercent } = await import("../src/kingdom-requirements");
    expect(ceilPercent(4_000_000_000, 1.07)).toBe(42_800_000);
    expect(ceilPercent(123_456_789_000, 1.1)).toBe(1_358_024_679);
    expect(ceilPercent(10_000_001, 250)).toBe(25_000_003);
    expect(ceilPercent(3, 50)).toBe(2);
    expect(ceilPercent(0, 250)).toBe(0);
  });
});
