import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MGE_LIMITS, MGE_SOURCES, describeMgeRules, emptyMgeDoc, isDay, mgePublicPayload, orderedEvents, parseCandidateLines, parseMgeDoc, parseMgePublic,
  planMge, removeCandidate, setEventLocked, splitNameAndNumber,
  type MgeCandidate, type MgeDoc, type MgeEvent,
} from "../src/kingdom-mge";

const cand = (id: string, name: string, score: number | null = null, tags: string[] = []): MgeCandidate => ({ id, name, score, tags });
const ev = (id: string, date: string, over: Partial<MgeEvent> = {}): MgeEvent => ({ id, date, commander: "", applicants: [], overrides: [], locked: false, result: null, ...over });
function doc(over: Partial<MgeDoc> = {}): MgeDoc {
  return { ...emptyMgeDoc("p1", new Date("2026-10-13T00:00:00Z")), ...over };
}
const names = (p: ReturnType<typeof planMge>, i: number) => p.events[i]!.assignments.map((a) => a.name);

const FIVE = [cand("a", "Alpha", 500), cand("b", "Bravo", 400), cand("c", "Charlie", 300), cand("d", "Delta", 200), cand("e", "Echo", 100)];

describe("rotation policy", () => {
  it("first event: never-had-one candidates by name; next events rotate by longest wait", () => {
    const d = doc({ slotsPerEvent: 2, cooldownEvents: 0, candidates: FIVE, events: [ev("e1", "2026-10-01"), ev("e2", "2026-10-15"), ev("e3", "2026-10-29")] });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Alpha", "Bravo"]);
    expect(p.events[0]!.assignments[0]!.reason).toBe("rotation: longest wait since last slot (never had one)");
    expect(names(p, 1)).toEqual(["Charlie", "Delta"]);
    expect(names(p, 2)).toEqual(["Echo", "Alpha"]);
    expect(p.events[2]!.assignments[1]!.reason).toBe("rotation: longest wait since last slot (2 events ago, on 2026-10-01)");
  });

  it("cooldown keeps recent winners out even when slots stay empty", () => {
    const d = doc({ slotsPerEvent: 2, cooldownEvents: 1, candidates: FIVE.slice(0, 3), events: [ev("e1", "2026-10-01"), ev("e2", "2026-10-15"), ev("e3", "2026-10-29")] });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Alpha", "Bravo"]);
    expect(names(p, 1)).toEqual(["Charlie"]);
    expect(p.events[1]!.unfilled).toEqual([2]);
    expect(p.events[1]!.warnings.map((w) => w.code)).toContain("unfilled");
    // Alpha and Bravo waited 2 events (cooldown 1 passed); Charlie is on cooldown.
    expect(names(p, 2)).toEqual(["Alpha", "Bravo"]);
  });

  it("orders events by date, not by input order", () => {
    const d = doc({ slotsPerEvent: 1, cooldownEvents: 0, candidates: FIVE.slice(0, 2), events: [ev("late", "2026-11-01"), ev("early", "2026-10-01")] });
    const p = planMge(d);
    expect(p.events.map((e) => e.eventId)).toEqual(["early", "late"]);
    expect(orderedEvents(d).map((e) => e.id)).toEqual(["early", "late"]);
    expect(names(p, 0)).toEqual(["Alpha"]);
    expect(names(p, 1)).toEqual(["Bravo"]);
  });

  it("applications: only applicants are considered", () => {
    const d = doc({ slotsPerEvent: 3, applicationsRequired: true, candidates: FIVE, events: [ev("e1", "2026-10-01", { applicants: ["e", "c"] })] });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Charlie", "Echo"]);
    expect(p.events[0]!.unfilled).toEqual([3]);
  });
});

describe("score policy", () => {
  it("ranks by score with the score in the reason, and warns for missing scores", () => {
    const d = doc({ policy: "score", slotsPerEvent: 3, candidates: [...FIVE, cand("z", "Zulu")], events: [ev("e1", "2026-10-01")] });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(p.events[0]!.assignments[2]!.reason).toBe("score rank 3 (300)");
    expect(p.events[0]!.assignments[2]!.publicReason).toBe("score rank 3");
    expect(p.warnings.filter((w) => w.code === "no_score").map((w) => w.candidateId)).toEqual(["z"]);
    expect(planMge({ ...d, candidates: [cand("x", "X", 4_200_000)] }).events[0]!.assignments[0]!.reason).toBe("score rank 1 (4,200,000)");
  });

  it("score policy has no cooldown: the same top scores win every event", () => {
    const d = doc({ policy: "score", slotsPerEvent: 2, cooldownEvents: 3, candidates: FIVE, events: [ev("e1", "2026-10-01"), ev("e2", "2026-10-15")] });
    const p = planMge(d);
    expect(names(p, 1)).toEqual(["Alpha", "Bravo"]);
  });
});

describe("ties", () => {
  it("break by name, then id", () => {
    const tied = [cand("2", "Same", 10), cand("1", "Same", 10), cand("3", "Able", 10)];
    const p = planMge(doc({ policy: "score", slotsPerEvent: 3, candidates: tied, events: [ev("e1", "2026-10-01")] }));
    expect(p.events[0]!.assignments.map((a) => a.candidateId)).toEqual(["3", "1", "2"]);
    const r = planMge(doc({ policy: "rotation", slotsPerEvent: 3, candidates: tied, events: [ev("e1", "2026-10-01")] }));
    expect(r.events[0]!.assignments.map((a) => a.candidateId)).toEqual(["3", "1", "2"]);
    expect(r.warnings.map((w) => w.code)).toEqual(["duplicate_name"]);
  });

  it("is deterministic regardless of candidate order", () => {
    const d = doc({ slotsPerEvent: 2, candidates: [...FIVE].reverse(), events: [ev("e1", "2026-10-01"), ev("e2", "2026-10-15")] });
    expect(planMge(d)).toEqual(planMge({ ...d, candidates: FIVE }));
  });
});

describe("overrides", () => {
  it("place a governor by hand with the reason, and the policy fills the rest", () => {
    const d = doc({ slotsPerEvent: 3, cooldownEvents: 0, candidates: FIVE, events: [ev("e1", "2026-10-01", { overrides: [{ slot: 1, candidateId: "e", reason: "Garrison lead for Kingsland" }] })] });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Echo", "Alpha", "Bravo"]);
    expect(p.events[0]!.assignments[0]!.reason).toBe("manual: Garrison lead for Kingsland");
    expect(p.events[0]!.assignments[0]!.source).toBe("manual");
  });

  it("warn when the governor is on cooldown, or did not apply", () => {
    const d = doc({
      slotsPerEvent: 1, cooldownEvents: 2, applicationsRequired: true, candidates: FIVE,
      events: [ev("e1", "2026-10-01", { applicants: ["a"] }), ev("e2", "2026-10-15", { applicants: ["b"], overrides: [{ slot: 1, candidateId: "a", reason: "Only rally lead online" }] })],
    });
    const p = planMge(d);
    expect(names(p, 1)).toEqual(["Alpha"]);
    const codes = p.events[1]!.warnings.map((w) => w.code);
    expect(codes).toContain("override_on_cooldown");
    expect(codes).toContain("override_not_applicant");
  });

  it("ignore conflicting placements (slot past count, same slot twice, same governor twice)", () => {
    const d = doc({
      slotsPerEvent: 2, policy: "manual", candidates: FIVE,
      events: [ev("e1", "2026-10-01", { overrides: [
        { slot: 1, candidateId: "a", reason: "r" }, { slot: 1, candidateId: "b", reason: "r" }, { slot: 2, candidateId: "a", reason: "r" }, { slot: 5, candidateId: "c", reason: "r" },
      ] })],
    });
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Alpha"]);
    expect(p.events[0]!.unfilled).toEqual([2]);
    expect(p.events[0]!.warnings.filter((w) => w.code === "override_conflict")).toHaveLength(3);
  });

  it("manual policy fills nothing on its own", () => {
    const p = planMge(doc({ policy: "manual", slotsPerEvent: 2, candidates: FIVE, events: [ev("e1", "2026-10-01")] }));
    expect(p.events[0]!.assignments).toEqual([]);
    expect(p.events[0]!.unfilled).toEqual([1, 2]);
  });
});

describe("locking", () => {
  it("keeps the stored result as history and counts it for rotation", () => {
    let d = doc({ slotsPerEvent: 2, cooldownEvents: 0, candidates: FIVE, events: [ev("e1", "2026-10-01"), ev("e2", "2026-10-15")] });
    d = setEventLocked(d, "e1", true);
    expect(d.events[0]!.locked).toBe(true);
    expect(d.events[0]!.result!.map((a) => a.name)).toEqual(["Alpha", "Bravo"]);
    // Adding a new candidate who sorts first does not change locked history.
    d = { ...d, candidates: [cand("aa", "Aaron", 1), ...d.candidates] };
    const p = planMge(d);
    expect(names(p, 0)).toEqual(["Alpha", "Bravo"]);
    expect(p.events[0]!.locked).toBe(true);
    expect(names(p, 1)).toEqual(["Aaron", "Charlie"]);
    // Removing a candidate keeps their name in locked history.
    d = removeCandidate(d, "a");
    expect(names(planMge(d), 0)).toEqual(["Alpha", "Bravo"]);
    // Unlocking recomputes.
    d = setEventLocked(d, "e1", false);
    expect(d.events[0]!.result).toBeNull();
    expect(names(planMge(d), 0)).toEqual(["Aaron", "Bravo"]);
  });

  it("removeCandidate drops applicants and overrides", () => {
    const d = removeCandidate(doc({ candidates: FIVE, events: [ev("e1", "2026-10-01", { applicants: ["a", "b"], overrides: [{ slot: 1, candidateId: "a", reason: "x" }] })] }), "a");
    expect(d.events[0]!.applicants).toEqual(["b"]);
    expect(d.events[0]!.overrides).toEqual([]);
  });
});

describe("empty and limits", () => {
  it("empty plan has no events and no warnings", () => {
    expect(planMge(emptyMgeDoc("x"))).toEqual({ events: [], warnings: [] });
  });

  it("an event with no candidates reports every slot unfilled", () => {
    const p = planMge(doc({ slotsPerEvent: 3, events: [ev("e1", "2026-10-01")] }));
    expect(p.events[0]!.unfilled).toEqual([1, 2, 3]);
  });

  it("parse clamps settings, caps lists and drops bad rows", () => {
    const many = Array.from({ length: 320 }, (_, i) => ({ id: `c${i}`, name: `G${i}`, score: i }));
    const events = Array.from({ length: 65 }, (_, i) => ({ id: `e${i}`, date: "2026-10-01" }));
    const d = parseMgeDoc({
      id: "p", title: "  My   plan ", slotsPerEvent: 50, policy: "nope", cooldownEvents: -1, applicationsRequired: "yes",
      candidates: [...many, { id: "bad" }, { id: "c0", name: "dup" }],
      events: [{ id: "x", date: "2026-02-30" }, ...events],
    });
    expect(d.title).toBe("My plan");
    expect(d.slotsPerEvent).toBe(10);
    expect(d.policy).toBe("rotation");
    expect(d.cooldownEvents).toBe(1);
    expect(d.applicationsRequired).toBe(false);
    expect(d.candidates).toHaveLength(MGE_LIMITS.candidates);
    expect(d.events).toHaveLength(MGE_LIMITS.events);
    expect(d.events.some((e) => e.id === "x")).toBe(false);
  });

  it("parse keeps valid fields, cuts long text and filters unknown references", () => {
    const d = parseMgeDoc({
      id: "p", slotsPerEvent: 20, policy: "score", cooldownEvents: 10, applicationsRequired: true,
      candidates: [{ id: "a", name: "A".repeat(60), score: 12.6, tags: ["Rally Lead", "rally lead", "x".repeat(40), 5, "a", "b", "c", "d"] }],
      events: [{ id: "e", date: "2026-10-01", commander: "C".repeat(60), applicants: ["a", "ghost", "a"], overrides: [{ slot: 1, candidateId: "a", reason: "" }, { slot: 2, candidateId: "a", reason: "ok" }, { slot: 3, candidateId: "ghost", reason: "x" }], locked: true, result: [{ slot: 1, candidateId: "a", name: "A", source: "score", reason: "score rank 1 (13)", publicReason: "score rank 1", score: 13 }, { slot: 1, candidateId: "a", name: "dup", source: "score" }] }],
    });
    expect(d.slotsPerEvent).toBe(20);
    expect(d.cooldownEvents).toBe(10);
    expect(d.candidates[0]!.name).toHaveLength(MGE_LIMITS.name);
    expect(d.candidates[0]!.score).toBe(13);
    expect(d.candidates[0]!.tags).toEqual(["rally lead", "x".repeat(24), "a", "b", "c"]);
    const e = d.events[0]!;
    expect(e.commander).toHaveLength(MGE_LIMITS.commander);
    expect(e.applicants).toEqual(["a"]);
    expect(e.overrides).toEqual([{ slot: 2, candidateId: "a", reason: "ok" }]);
    expect(e.result).toHaveLength(1);
    expect(parseMgeDoc(null).candidates).toEqual([]);
    expect(parseMgeDoc("junk", "fb").id).toBe("fb");
  });

  it("isDay accepts only real calendar days", () => {
    expect(isDay("2026-10-13")).toBe(true);
    expect(isDay("2026-13-01")).toBe(false);
    expect(isDay("2026-02-29")).toBe(false);
    expect(isDay("20261013")).toBe(false);
  });
});

describe("pasted candidate list", () => {
  it("splits name and number, including thousands commas", () => {
    expect(splitNameAndNumber("Bob, 1,200,000")).toEqual({ name: "Bob", number: "1,200,000" });
    expect(splitNameAndNumber("Ann\t4.2m")).toEqual({ name: "Ann", number: "4.2m" });
    expect(splitNameAndNumber("Smith, Jr; 300k")).toEqual({ name: "Smith, Jr", number: "300k" });
    expect(splitNameAndNumber("Solo")).toEqual({ name: "Solo", number: null });
  });

  it("parses rows and reports bad lines with their number", () => {
    const r = parseCandidateLines("Alpha, 4,200,000\n\nBravo\n, 5\nCharlie, lots\n" + "L".repeat(41) + ", 1");
    expect(r.rows).toEqual([{ name: "Alpha", score: 4_200_000 }, { name: "Bravo", score: null }, { name: "Charlie, lots", score: null }]);
    expect(r.errors.map((e) => e.line)).toEqual([4, 6]);
    const bad = parseCandidateLines("Delta, 1.5");
    expect(bad.errors[0]!.message).toMatch(/not a number/);
  });
});

describe("public ledger", () => {
  const base = doc({ title: "K1 MGE", policy: "score", slotsPerEvent: 2, candidates: FIVE, events: [ev("e1", "2026-10-01", { commander: "Ramesses II" })] });

  it("leaves scores out by default", () => {
    const pub = mgePublicPayload(base, false, "2026-10-13");
    expect(pub.events[0]!.slots).toEqual([{ slot: 1, name: "Alpha", reason: "score rank 1" }, { slot: 2, name: "Bravo", reason: "score rank 2" }]);
    expect(JSON.stringify(pub)).not.toContain("500");
    expect(pub.events[0]!.commander).toBe("Ramesses II");
  });

  it("includes scores only when asked", () => {
    const pub = mgePublicPayload(base, true, "2026-10-13");
    expect(pub.events[0]!.slots[0]).toEqual({ slot: 1, name: "Alpha", reason: "score rank 1 (500)", score: 500 });
  });

  it("round-trips through parseMgePublic and rejects junk", () => {
    const pub = mgePublicPayload(base, true, "2026-10-13");
    expect(parseMgePublic(JSON.parse(JSON.stringify(pub)))).toEqual(pub);
    expect(parseMgePublic({ policy: "x", events: [] })).toBeNull();
    expect(parseMgePublic([])).toBeNull();
    const noScores = parseMgePublic({ ...pub, includeScores: false });
    expect(noScores!.events[0]!.slots[0]!.score).toBeUndefined();
  });

  it("describes the rules in plain language", () => {
    expect(describeMgeRules({ policy: "rotation", slotsPerEvent: 10, cooldownEvents: 2, applicationsRequired: true })).toMatch(/10 slots per event, set by the council\..*Cooldown: 2 events.*Only governors who applied/);
    expect(describeMgeRules({ policy: "rotation", slotsPerEvent: 1, cooldownEvents: 0, applicationsRequired: false })).toMatch(/1 slot per event.*No cooldown/);
  });
});

describe("sources", () => {
  const card = (id: string) => readFileSync(join(__dirname, "../../../research/facts", id.slice(0, 3), `${id}.md`), "utf8");
  it.each(MGE_SOURCES.map((s) => [s.id, s.confidence] as const))("%s confidence shown (%s) matches the card file", (id, conf) => {
    expect(/^confianca:\s*(\S+)/m.exec(card(id))?.[1]).toBe(conf);
  });
  it("B05-0002 still carries the 'list of 10' quote behind the default slot count", () => {
    expect(card("B05-0002")).toContain("list of 10 people that are allowed to be the top ten");
    expect(MGE_LIMITS.slotsDefault).toBe(10);
  });
});

describe("locked history after lowering slots", () => {
  it("keeps every stored slot of a locked event in the public ledger", () => {
    const many = Array.from({ length: 20 }, (_, i) => cand(`c${i}`, `Gov ${String(i).padStart(2, "0")}`));
    let d = doc({ slotsPerEvent: 20, candidates: many, events: [ev("e1", "2026-10-01")] });
    d = setEventLocked(d, "e1", true);
    d = { ...d, slotsPerEvent: 10 };
    const pub = parseMgePublic(JSON.parse(JSON.stringify(mgePublicPayload(d, false, "2026-10-13"))));
    expect(pub!.events[0]!.slots).toHaveLength(20);
    expect(planMge(d).events[0]!.assignments).toHaveLength(20);
  });
});
