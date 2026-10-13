import { describe, expect, it } from "vitest";
import {
  QUESTIONS,
  decodeProfile,
  defaultProfile,
  encodeProfile,
  validateAnswers,
  type AccountProfile,
} from "../src/index";

const ok = (r: ReturnType<typeof validateAnswers>): AccountProfile => {
  if ("errors" in r) throw new Error(JSON.stringify(r.errors));
  return r.profile;
};

describe("questions", () => {
  it("cover every AccountProfile field, with unique ids", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(defaultProfile()).sort());
  });

  it("spending options carry the $ ranges from research/perfis.md", () => {
    const q = QUESTIONS.find((x) => x.id === "spending")!;
    if (q.type !== "choice") throw new Error();
    const labels = q.options.map((o) => o.label).join(" | ");
    for (const r of ["$0", "$5–$100", "$100–$500", "$500–$1,000", "$1,000–$5,000", "$5,000+"]) expect(labels).toContain(r);
  });
});

describe("validateAnswers", () => {
  it("empty answers give the default profile", () => {
    const r = validateAnswers({});
    expect(ok(r)).toEqual(defaultProfile());
    expect(defaultProfile()).toMatchObject({ spending: "f2p", minutesPerDay: 60, cityHall: 1, returningPlayer: false });
  });

  it("coerces form strings", () => {
    const p = ok(validateAnswers({
      spending: "Low", minutesPerDay: "30", cityHall: "12", kingdomDay: "", civilization: "China",
      returningPlayer: "yes", sessionsPerDay: "3", lifetimeSpendUsd: "250", role: "farm", kingdomStage: "pre_kvk",
    }));
    expect(p).toEqual({
      spending: "low", lifetimeSpendUsd: 250, minutesPerDay: 30, sessionsPerDay: 3, role: "farm",
      kingdomStage: "pre_kvk", kingdomDay: null, cityHall: 12, civilization: "china", returningPlayer: true,
    });
  });

  it("reports errors per field", () => {
    const r = validateAnswers({ spending: "dolphin", cityHall: 26, minutesPerDay: "abc", returningPlayer: "maybe", role: null, foo: 1 });
    if (!("errors" in r)) throw new Error("expected errors");
    const fields = r.errors.map((e) => e.field).sort();
    expect(fields).toEqual(["_", "cityHall", "minutesPerDay", "returningPlayer", "role", "spending"]);
    expect(r.errors.find((e) => e.field === "cityHall")!.message).toMatch(/between 1 and 25/);
  });

  it("rejects non-integers and non-objects", () => {
    expect("errors" in validateAnswers({ cityHall: 12.5 })).toBe(true);
    expect("errors" in validateAnswers(null)).toBe(true);
    expect("errors" in validateAnswers([1])).toBe(true);
  });

  it("cross-field: a young kingdom cannot be past pre-KvK", () => {
    const r = validateAnswers({ kingdomStage: "kvk2", kingdomDay: 20 });
    expect("errors" in r && r.errors[0]!.field).toBe("kingdomDay");
  });

  it("warns about past spending on a F2P account", () => {
    const r = validateAnswers({ spending: "f2p", lifetimeSpendUsd: 10000 });
    if ("errors" in r) throw new Error();
    expect(r.warnings.join(" ")).toMatch(/spent about \$10000/);
  });
});

describe("URL-safe profile code", () => {
  const full: AccountProfile = {
    spending: "whale", lifetimeSpendUsd: 25000, minutesPerDay: 120, sessionsPerDay: 4, role: "rally",
    kingdomStage: "kvk1", kingdomDay: 110, cityHall: 25, civilization: "britain", returningPlayer: true,
  };

  it("round-trips", () => {
    for (const p of [defaultProfile(), full, { ...full, civilization: null, kingdomDay: null, sessionsPerDay: null, lifetimeSpendUsd: null }]) {
      const code = encodeProfile(p);
      expect(code).toMatch(/^[A-Za-z0-9._~-]+$/);
      expect(ok(decodeProfile(code))).toEqual(p);
    }
  });

  it("is compact and readable", () => {
    expect(encodeProfile(defaultProfile())).toBe("1.0.0.0.1.60.....0");
    expect(encodeProfile(full)).toBe("1.4.2.1.25.120.4.110.25000.britain.1");
    expect(encodeProfile(full).length).toBeLessThan(40);
  });

  it("rejects bad codes without throwing", () => {
    for (const bad of ["", "2.0.0.0.1.60.....0", "1.0.0", "1.9.0.0.1.60.....0", "1.0.0.0.30.60.....0", "1.0.0.0.1.60.....x", "1.0.0.0.1.60.....0/", "1.0.0.0.1.60....atlantis.0", "1.0.0.0.1.60.-1....0"]) {
      const r = decodeProfile(bad);
      expect("errors" in r).toBe(true);
    }
  });
});
