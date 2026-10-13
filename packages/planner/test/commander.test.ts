import { describe, expect, it } from "vitest";
import {
  COMMANDER_CHECKLIST, COMMANDER_SHELF_LIFE, evaluateCommanderDecision, suggestAnswers, getShelfLife,
  type CommanderAnswers,
} from "../src/commander";
import { BUNDLED_FACTS } from "../src/facts";

const GOOD: CommanderAnswers = {
  sculptureType: "universal_gold",
  purpose: "field_main",
  mainMarch: "part_of_main",
  roleNeed: "yes",
  pairing: "owned",
  shelfLife: "long_term",
};

describe("checklist data", () => {
  it("rules reference real questions/options and real fact cards", () => {
    const ids = new Set(BUNDLED_FACTS.map((f) => f.id));
    for (const r of COMMANDER_CHECKLIST.rules) {
      for (const [q, opts] of Object.entries(r.when)) {
        const question = COMMANDER_CHECKLIST.questions.find((x) => x.id === q);
        expect(question, `${r.id}: ${q}`).toBeDefined();
        for (const o of opts) expect(question!.options.map((x) => x.id)).toContain(o);
      }
      for (const f of r.facts) expect(ids.has(f), `${r.id}: ${f}`).toBe(true);
    }
    for (const c of COMMANDER_SHELF_LIFE) {
      for (const f of c.facts) expect(ids.has(f), `${c.id}: ${f}`).toBe(true);
      expect(() => evaluateCommanderDecision(c.suggested)).not.toThrow();
    }
  });

  it("covers the five F-20 topics: role, pairing, shelf-life, F2P availability, swap", () => {
    const q = COMMANDER_CHECKLIST.questions.map((x) => x.id);
    expect(q).toEqual(expect.arrayContaining(["roleNeed", "pairing", "shelfLife", "availability", "swap"]));
  });
});

describe("evaluateCommanderDecision", () => {
  it("go: long-term field commander for the main march, with a pair", () => {
    const d = evaluateCommanderDecision(GOOD);
    expect(d.verdict).toBe("go");
    expect(d.facts).toEqual(expect.arrayContaining(["A06-0502", "A06-0500"]));
    expect(d.reasons[0]!.effect).toBe("go");
    expect(d.unanswered).toEqual([]);
    expect(["medium", "low"]).toContain(d.confidence);
  });

  it("avoid: universal gold sculptures on a gatherer (A06-0510)", () => {
    const d = evaluateCommanderDecision({ ...GOOD, purpose: "gatherer" });
    expect(d.verdict).toBe("avoid");
    expect(d.reasons[0]!.ruleId).toBe("gold-on-gatherer");
    expect(d.reasons[0]!.facts).toContain("A06-0510");
  });

  it("wait: main march incomplete → concentrate (A06-0500, unanimous)", () => {
    const d = evaluateCommanderDecision({ ...GOOD, mainMarch: "main_incomplete_other" });
    expect(d.verdict).toBe("wait");
    expect(d.reasons[0]!.ruleId).toBe("concentrate");
    expect(d.hasSplitViews).toBe(false);
  });

  it("wait with split views: gold on a KvK1-only legendary (A06-0503 divided)", () => {
    const d = evaluateCommanderDecision(suggestAnswers("richard-i", { ...GOOD, shelfLife: "kvk1_only" }));
    expect(d.verdict).toBe("wait");
    expect(d.hasSplitViews).toBe(true);
    expect(d.confidence).toBe("low");
    expect(d.facts).toContain("A06-0503");
  });

  it("wait: required answers missing", () => {
    const d = evaluateCommanderDecision({ sculptureType: "universal_gold" });
    expect(d.verdict).toBe("wait");
    expect(d.unanswered).toEqual(expect.arrayContaining(["purpose", "mainMarch", "roleNeed", "pairing", "shelfLife"]));
    expect(d.confidence).toBe("pending");
  });

  it("avoid beats wait", () => {
    const d = evaluateCommanderDecision({ ...GOOD, purpose: "pve_barbarians", mainMarch: "main_incomplete_other" });
    expect(d.verdict).toBe("avoid");
    expect(d.reasons.map((r) => r.effect).slice(0, 2)).toEqual(["avoid", "wait"]);
  });

  it("Sun Tzu with epic sculptures is a go (A06-0501); swap note only for legendaries", () => {
    const answers = suggestAnswers("sun-tzu", { mainMarch: "part_of_main", roleNeed: "yes", pairing: "free_pair" });
    const d = evaluateCommanderDecision(answers);
    expect(d.verdict).toBe("go");
    expect(d.facts).toContain("A06-0501");
  });

  it("cheaper route coming (Pelagius day 5, C04-0005) → wait", () => {
    const d = evaluateCommanderDecision({ ...GOOD, cheaperSoon: "yes" });
    expect(d.verdict).toBe("wait");
    expect(d.facts).toContain("C04-0005");
  });

  it("Season 2 commanders are not swappable (C04-0021)", () => {
    expect(getShelfLife("takeda")?.suggested.swap).toBe("not_eligible");
    const d = evaluateCommanderDecision(suggestAnswers("takeda", { ...GOOD, shelfLife: "kvk1_only" }));
    expect(d.reasons.some((r) => r.ruleId === "short-and-not-swappable")).toBe(true);
  });

  it("rejects unknown questions/options", () => {
    expect(() => evaluateCommanderDecision({ purpose: "whale" })).toThrow();
    expect(() => evaluateCommanderDecision({ nope: "x" })).toThrow();
  });
});
