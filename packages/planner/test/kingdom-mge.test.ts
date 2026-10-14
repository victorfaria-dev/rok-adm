import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MGE_LIMITS, MGE_SOURCES, describeMgeRules, emptyMgeDoc, isDay, mgePublicPayload, orderedEvents, parseCandidateLines, parseMgeDoc, parseMgePublic,
  parseMgeScore, parseMgeTagsText, planMge, readCandidateInput, removeCandidate, scoreRankScope, setEventLocked, splitNameAndNumber, updateCandidate,
  type MgeCandidate, type MgeDoc, type MgeEvent,
  MGE_CSV_BOM, MGE_GOVERNORS_CSV_HEADER, MGE_LEDGER_CSV_HEADER, mgeCsvField, mgeCsvSafeText, mgeGovernorsCsv, mgeLedgerCsv,
} from "../src/kingdom-mge";
import { csvField, csvSafeText } from "../src/csv";

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
    expect(p.events[0]!.assignments[0]!.reason).toBe("rodízio: maior espera desde a última vaga (nunca teve uma)");
    expect(names(p, 1)).toEqual(["Charlie", "Delta"]);
    expect(names(p, 2)).toEqual(["Echo", "Alpha"]);
    expect(p.events[2]!.assignments[1]!.reason).toBe("rodízio: maior espera desde a última vaga (há 2 eventos, em 2026-10-01)");
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
    expect(p.events[0]!.assignments[2]!.reason).toBe("posição 3 por pontuação (300)");
    expect(p.events[0]!.assignments[2]!.publicReason).toBe("posição 3 por pontuação");
    expect(p.warnings.filter((w) => w.code === "no_score").map((w) => w.candidateId)).toEqual(["z"]);
    expect(planMge({ ...d, candidates: [cand("x", "X", 4_200_000)] }).events[0]!.assignments[0]!.reason).toBe("posição 1 por pontuação (4.200.000)");
  });

  it("says exactly who the rank is counted among (applicants, governors not placed by hand)", () => {
    const over = [{ slot: 1, candidateId: "a", reason: "Rally lead" }];
    const reasons = (d: MgeDoc) => planMge(d).events[0]!.assignments.map((a) => [a.name, a.reason, a.publicReason]);
    const d = doc({ policy: "score", slotsPerEvent: 2, candidates: FIVE, events: [ev("e1", "2026-10-01", { overrides: over })] });
    // Alpha (top score) is placed by hand, so Bravo is first among the rest, not first overall.
    expect(reasons(d)).toEqual([["Alpha", "manual: Rally lead", "manual: Rally lead"], ["Bravo", "posição 1 por pontuação entre os governadores não colocados à mão (400)", "posição 1 por pontuação entre os governadores não colocados à mão"]]);
    const apps = { ...d, applicationsRequired: true, events: [ev("e1", "2026-10-01", { applicants: ["c", "e"] })] };
    expect(reasons(apps)[0]).toEqual(["Charlie", "posição 1 por pontuação entre os candidatos (300)", "posição 1 por pontuação entre os candidatos"]);
    const both = { ...apps, events: [ev("e1", "2026-10-01", { applicants: ["c", "e"], overrides: over })] };
    expect(reasons(both)[1]).toEqual(["Charlie", "posição 1 por pontuação entre os candidatos não colocados à mão (300)", "posição 1 por pontuação entre os candidatos não colocados à mão"]);
    expect(scoreRankScope(false, false)).toBe("");
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
      events: [{ id: "e", date: "2026-10-01", commander: "C".repeat(60), applicants: ["a", "ghost", "a"], overrides: [{ slot: 1, candidateId: "a", reason: "" }, { slot: 2, candidateId: "a", reason: "ok" }, { slot: 3, candidateId: "ghost", reason: "x" }], locked: true, result: [{ slot: 1, candidateId: "a", name: "A", source: "score", reason: "posição 1 por pontuação (13)", publicReason: "posição 1 por pontuação", score: 13 }, { slot: 1, candidateId: "a", name: "dup", source: "score" }] }],
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
    expect(r.rows).toEqual([{ name: "Alpha", score: 4_200_000 }, { name: "Bravo", score: null }]);
    expect(r.errors.map((e) => e.line)).toEqual([4, 5, 6]);
    expect(r.errors[1]!.message).toMatch(/não é uma pontuação/);
    const bad = parseCandidateLines("Delta, 1.5");
    expect(bad.errors[0]!.message).toMatch(/não é um número/);
  });
});

describe("pasted list shapes (Q2 P2-2)", () => {
  it("reads trailing numbers, tabs (spreadsheet rows), semicolons and shorthand", () => {
    const r = parseCandidateLines("Dave 80\nAnna\t1.5m\n1\tFay\t80\t3\nCid; 300k\nEd, 4.2m\nGus 1.5m\nBob, 1,200,000\nSolo");
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { name: "Dave", score: 80 }, { name: "Anna", score: 1_500_000 }, { name: "Fay", score: 80 }, { name: "Cid", score: 300_000 },
      { name: "Ed", score: 4_200_000 }, { name: "Gus", score: 1_500_000 }, { name: "Bob", score: 1_200_000 }, { name: "Solo", score: null },
    ]);
  });

  it("reports lines it cannot read instead of creating odd governors", () => {
    const r = parseCandidateLines("Name\tDKP\nAna; lots\nBo, -5\n\t\t");
    expect(r.rows).toEqual([]);
    expect(r.errors.map((e) => e.line)).toEqual([1, 2, 3]);
  });
});

describe("public ledger", () => {
  const base = doc({ title: "K1 MGE", policy: "score", slotsPerEvent: 2, candidates: FIVE, events: [ev("e1", "2026-10-01", { commander: "Ramesses II" })] });

  it("leaves scores out by default", () => {
    const pub = mgePublicPayload(base, false, "2026-10-13");
    expect(pub.events[0]!.slots).toEqual([{ slot: 1, name: "Alpha", reason: "posição 1 por pontuação" }, { slot: 2, name: "Bravo", reason: "posição 2 por pontuação" }]);
    expect(JSON.stringify(pub)).not.toContain("500");
    expect(pub.events[0]!.commander).toBe("Ramesses II");
  });

  it("includes scores only when asked", () => {
    const pub = mgePublicPayload(base, true, "2026-10-13");
    expect(pub.events[0]!.slots[0]).toEqual({ slot: 1, name: "Alpha", reason: "posição 1 por pontuação (500)", score: 500 });
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
    expect(describeMgeRules({ policy: "rotation", slotsPerEvent: 10, cooldownEvents: 2, applicationsRequired: true })).toMatch(/10 vagas por evento \(definição do conselho\)\..*Período de espera: 2 eventos.*Só governadores que se candidataram/);
    expect(describeMgeRules({ policy: "rotation", slotsPerEvent: 1, cooldownEvents: 0, applicationsRequired: false })).toMatch(/1 vaga por evento.*Sem período de espera/);
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

describe("typed governor fields", () => {
  it("parseMgeScore: empty is no score, safe whole numbers pass, the rest is refused", () => {
    expect(parseMgeScore("  ")).toEqual({ ok: true, score: null });
    expect(parseMgeScore("4,200,000")).toEqual({ ok: true, score: 4_200_000 });
    expect(parseMgeScore("4.2m")).toEqual({ ok: true, score: 4_200_000 });
    expect(parseMgeScore(String(Number.MAX_SAFE_INTEGER))).toEqual({ ok: true, score: Number.MAX_SAFE_INTEGER });
    for (const big of ["9007199254740992", "9,007,199,254,740,992", "99999999999999999999", "9999999999b"]) {
      const r = parseMgeScore(big);
      expect(r.ok, big).toBe(false);
      if (!r.ok) {
        expect(r.tooBig, big).toBe(true);
        expect(r.message).toContain("9.007.199.254.740.991");
      }
    }
    for (const bad of ["lots", "-5", "1.5", "1,00"]) {
      const r = parseMgeScore(bad);
      expect(r.ok, bad).toBe(false);
      if (!r.ok) expect(r.tooBig, bad).toBe(false);
    }
  });

  it("pasted lists refuse scores above the safe limit too", () => {
    const r = parseCandidateLines("Big, 9,007,199,254,740,992\nOk, 5");
    expect(r.rows).toEqual([{ name: "Ok", score: 5 }]);
    expect(r.errors[0]!.message).toMatch(/grande demais/);
  });

  it("parseMgeTagsText lower-cases, drops duplicates and refuses too many or too long", () => {
    expect(parseMgeTagsText(" Rally Lead, rally lead ,, garrison lead")).toEqual({ tags: ["rally lead", "garrison lead"] });
    expect(parseMgeTagsText("a,b,c,d,e,f").error).toMatch(/no máximo 5 tags/);
    expect(parseMgeTagsText("x".repeat(25)).error).toMatch(/no máximo 24 caracteres/);
    expect(parseMgeTagsText("")).toEqual({ tags: [] });
  });

  it("readCandidateInput reports every bad field at once", () => {
    const r = readCandidateInput({ name: " ", score: "abc", tags: "a,b,c,d,e,f" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["name", "score", "tags"]);
    const long = readCandidateInput({ name: "N".repeat(41), score: "", tags: "" });
    expect(!long.ok && long.errors.name).toMatch(/no máximo 40/);
  });
});

describe("updateCandidate (inline edit)", () => {
  const base = () => doc({
    policy: "rotation", slotsPerEvent: 2, cooldownEvents: 0, candidates: FIVE,
    events: [ev("e1", "2026-10-01", { applicants: ["a", "b"] }), ev("e2", "2026-10-15", { overrides: [{ slot: 1, candidateId: "a", reason: "Rally lead" }] })],
  });

  it("renames in place: same id, applicants and overrides stay attached", () => {
    const r = updateCandidate(base(), "a", { name: "Alpha Prime", score: "1.5m", tags: "Rally Lead" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.previousName).toBe("Alpha");
    expect(r.duplicate).toBe(false);
    expect(r.doc.candidates[0]).toEqual({ id: "a", name: "Alpha Prime", score: 1_500_000, tags: ["rally lead"] });
    expect(r.doc.candidates).toHaveLength(5);
    expect(r.doc.events[0]!.applicants).toEqual(["a", "b"]);
    expect(r.doc.events[1]!.overrides[0]!.candidateId).toBe("a");
    const p = planMge(r.doc);
    expect(p.events[1]!.assignments[0]).toMatchObject({ candidateId: "a", name: "Alpha Prime", reason: "manual: Rally lead" });
  });

  it("never rewrites the stored names of locked events", () => {
    const locked = setEventLocked(base(), "e1", true);
    expect(locked.events[0]!.result!.map((a) => a.name)).toEqual(["Alpha", "Bravo"]);
    const r = updateCandidate(locked, "a", { name: "Renamed", score: "", tags: "" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.events[0]).toBe(locked.events[0]);
    expect(planMge(r.doc).events[0]!.assignments.map((a) => a.name)).toEqual(["Alpha", "Bravo"]);
    // The open event follows the new name, and rotation history (by id) still counts the locked slot.
    expect(planMge(r.doc).events[1]!.assignments[0]!.name).toBe("Renamed");
  });

  it("allows a duplicate name and keeps the plan warning", () => {
    const r = updateCandidate(base(), "b", { name: "alpha", score: "400", tags: "" });
    expect(r.ok && r.duplicate).toBe(true);
    if (r.ok) expect(planMge(r.doc).warnings.map((w) => w.code)).toContain("duplicate_name");
  });

  it("clearing the score sets it to null; bad input and unknown ids change nothing", () => {
    const r = updateCandidate(base(), "a", { name: "Alpha", score: "", tags: "" });
    expect(r.ok && r.candidate.score).toBeNull();
    const bad = updateCandidate(base(), "a", { name: "Alpha", score: "9007199254740992", tags: "" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.score).toMatch(/grande demais/);
    const gone = updateCandidate(base(), "zzz", { name: "X", score: "", tags: "" });
    expect(gone.ok).toBe(false);
  });
});

describe("CSV export", () => {
  /** Minimal RFC 4180 reader for the tests: BOM stripped, CRLF rows, quoted cells. */
  function readCsv(text: string): string[][] {
    expect(text.startsWith(MGE_CSV_BOM)).toBe(true);
    expect(text.endsWith("\r\n")).toBe(true);
    const body = text.slice(1);
    const rows: string[][] = [];
    let row: string[] = [], cell = "", q = false;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i]!;
      if (q) {
        if (ch === '"' && body[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\r" && body[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
      else cell += ch;
    }
    return rows;
  }

  it("uses the same safety rules as the farms ledger CSV (pinned)", () => {
    const samples = ["plain", "=SUM(A1)", "+1", "-1", "@cmd", "\tTab", "\rCR", "a,b", 'say "hi"', "line\nbreak", "ação 名前 🛡", "", " =lead"];
    for (const x of samples) {
      expect(mgeCsvSafeText(x), x).toBe(csvSafeText(x));
      expect(mgeCsvField(x), x).toBe(csvField(x));
    }
  });

  it("quotes commas, quotes and newlines; guards formulas; keeps unicode", () => {
    expect(mgeCsvField("a,b")).toBe('"a,b"');
    expect(mgeCsvField('He said "go"')).toBe('"He said ""go"""');
    expect(mgeCsvField("two\nlines")).toBe('"two\nlines"');
    expect(mgeCsvField("cr\rhere")).toBe('"cr\rhere"');
    for (const f of ["=1+1", "+cmd", "-2", "@SUM", "\tx", "\rx"]) expect(mgeCsvSafeText(f)).toBe(`'${f}`);
    expect(mgeCsvSafeText("Ålpha 王")).toBe("Ålpha 王");
  });

  const d = doc({
    policy: "score", slotsPerEvent: 3, title: "K1",
    candidates: [cand("a", "=HYPERLINK(\"x\")", 500, ["rally lead", "garrison lead"]), cand("b", "Bravo, Jr", 400), cand("c", "Ünïcödé 名前", null)],
    events: [
      ev("e2", "2026-10-15", { commander: '"Cao" Cao' }),
      ev("e1", "2026-10-01", { commander: "+Ramesses", overrides: [{ slot: 1, candidateId: "b", reason: "Garrison, Kingsland" }] }),
    ],
  });

  it("ledger CSV: oldest event first, one row per slot, scores left out by default", () => {
    const csv = mgeLedgerCsv(planMge(d), false);
    const rows = readCsv(csv);
    expect(rows[0]).toEqual([...MGE_LEDGER_CSV_HEADER]);
    expect(rows.slice(1)).toEqual([
      ["2026-10-01", "'+Ramesses", "1", "Bravo, Jr", "manual: Garrison, Kingsland", "no"],
      ["2026-10-01", "'+Ramesses", "2", "'=HYPERLINK(\"x\")", "posição 1 por pontuação entre os governadores não colocados à mão", "no"],
      ["2026-10-01", "'+Ramesses", "3", "", "não preenchida", "no"],
      ["2026-10-15", '"Cao" Cao', "1", "'=HYPERLINK(\"x\")", "posição 1 por pontuação", "no"],
      ["2026-10-15", '"Cao" Cao', "2", "Bravo, Jr", "posição 2 por pontuação", "no"],
      ["2026-10-15", '"Cao" Cao', "3", "", "não preenchida", "no"],
    ]);
    expect(csv).not.toContain("500");
    expect(csv).not.toContain("400");
  });

  it("ledger CSV: score column and scored reasons only when asked; locked events say yes", () => {
    const locked = setEventLocked(d, "e1", true);
    const rows = readCsv(mgeLedgerCsv(planMge(locked), true));
    expect(rows[0]).toEqual([...MGE_LEDGER_CSV_HEADER, "score"]);
    expect(rows[1]).toEqual(["2026-10-01", "'+Ramesses", "1", "Bravo, Jr", "manual: Garrison, Kingsland", "yes", ""]);
    expect(rows[2]).toEqual(["2026-10-01", "'+Ramesses", "2", "'=HYPERLINK(\"x\")", "posição 1 por pontuação entre os governadores não colocados à mão (500)", "yes", "500"]);
    expect(rows[4]![5]).toBe("no");
    expect(rows[4]![6]).toBe("500");
  });

  it("governors CSV: name, score, tags in list order, unicode kept", () => {
    const csv = mgeGovernorsCsv(d);
    expect(readCsv(csv)).toEqual([
      [...MGE_GOVERNORS_CSV_HEADER],
      ["'=HYPERLINK(\"x\")", "500", "rally lead; garrison lead"],
      ["Bravo, Jr", "400", ""],
      ["Ünïcödé 名前", "", ""],
    ]);
    expect(csv.split("\r\n")[2]).toBe('"Bravo, Jr",400,');
  });

  it("an empty plan gives a header-only file", () => {
    expect(mgeLedgerCsv(planMge(doc()), false)).toBe(`${MGE_CSV_BOM}${MGE_LEDGER_CSV_HEADER.join(",")}\r\n`);
    expect(mgeGovernorsCsv(doc())).toBe(`${MGE_CSV_BOM}name,score,tags\r\n`);
  });
});

describe("score format vs size", () => {
  it("a decimal comma is a format error, not 'too large'", async () => {
    const { parseMgeScore } = await import("../src/kingdom-mge");
    for (const t of ["1,5m", "4,2m", "1,234567890123456"]) {
      const r = parseMgeScore(t);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.tooBig, t).toBe(false);
    }
    const big = parseMgeScore("99,999,999,999,999,999");
    expect(!big.ok && big.tooBig).toBe(true);
    expect(parseMgeScore("1.5m")).toEqual({ ok: true, score: 1_500_000 });
  });
});
