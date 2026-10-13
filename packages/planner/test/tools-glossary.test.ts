import { describe, expect, it } from "vitest";
import { conceptOfDay, countSentences, normalizeQuery, searchGlossary, utcDayIndex, type GlossaryTerm } from "../src/tools";

const T = (id: string, term: string, aliases: string[], definition: string): GlossaryTerm => ({ id, term, aliases, definition, facts: ["B08-0001"] });
const terms = [
  T("dkp", "DKP", ["Dead Kill Points"], "A kingdom score built from kills and deaths."),
  T("kill-points", "Kill Points", ["KP"], "The kill score scans collect."),
  T("lohars-trial", "Lohar's Trial", ["Lohar"], "An event where you kill barbarians."),
  T("t4-t5", "T4 / T5", ["T4", "T5"], "Troop tiers. DKP counts their kills."),
];

describe("normalizeQuery", () => {
  it("lowercases, drops apostrophes, accents and punctuation", () => {
    expect(normalizeQuery("  Lohar's   Trial ")).toBe("lohars trial");
    expect(normalizeQuery("Orléans")).toBe("orleans");
    expect(normalizeQuery("T4 / T5")).toBe("t4 t5");
  });
});

describe("countSentences", () => {
  it("counts sentences and ignores decimals and versions", () => {
    expect(countSentences("")).toBe(0);
    expect(countSentences("One.")).toBe(1);
    expect(countSentences("One. Two.")).toBe(2);
    expect(countSentences("Since 1.1.03 it has tiers. At 2.5M it stops.")).toBe(2);
    expect(countSentences("A. B. C.")).toBe(3);
  });
});

describe("searchGlossary", () => {
  it("returns every term for an empty query", () => {
    expect(searchGlossary(terms, "  ")).toHaveLength(4);
  });
  it("matches terms and aliases case-insensitively", () => {
    expect(searchGlossary(terms, "kp").map((t) => t.id)).toEqual(["kill-points", "dkp", "t4-t5"]);
    expect(searchGlossary(terms, "lohars").map((t) => t.id)).toEqual(["lohars-trial"]);
    expect(searchGlossary(terms, "lohar's trial").map((t) => t.id)).toEqual(["lohars-trial"]);
  });
  it("ranks name matches before definition matches", () => {
    expect(searchGlossary(terms, "dkp").map((t) => t.id)).toEqual(["dkp", "t4-t5"]);
    expect(searchGlossary(terms, "kill").map((t) => t.id)).toEqual(["kill-points", "dkp", "lohars-trial", "t4-t5"]);
  });
  it("returns nothing when nothing matches", () => {
    expect(searchGlossary(terms, "zzz")).toEqual([]);
  });
});

describe("conceptOfDay", () => {
  it("cycles through terms sorted by id, any day index", () => {
    expect(conceptOfDay(terms, 0)!.id).toBe("dkp");
    expect(conceptOfDay(terms, 1)!.id).toBe("kill-points");
    expect(conceptOfDay(terms, 4)!.id).toBe("dkp");
    expect(conceptOfDay(terms, -1)!.id).toBe("t4-t5");
    expect(conceptOfDay([], 3)).toBeNull();
  });
  it("uses whole UTC days", () => {
    expect(utcDayIndex(new Date("1970-01-02T23:59:59Z"))).toBe(1);
    expect(utcDayIndex(new Date("2026-10-13T00:00:00Z"))).toBe(utcDayIndex(new Date("2026-10-13T23:00:00Z")));
  });
});
