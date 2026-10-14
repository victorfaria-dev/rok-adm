import { COMMANDER_CHECKLIST, COMMANDER_SHELF_LIFE, getShelfLife } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import {
  COMMANDER_CHOICES,
  OTHER_ID,
  SHELF_LIFE_TEXT,
  clearCommander,
  commanderFromHash,
  commanderName,
  confirmSuggestions,
  decide,
  prefill,
  sanitizeAnswers,
  savedChecks,
  setAnswer,
  stageLabel,
} from "./commander-state";

describe("commander choices", () => {
  it("lists every table commander once, A to Z, then Another commander", () => {
    const ids = COMMANDER_CHOICES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, -1).sort()).toEqual(COMMANDER_SHELF_LIFE.map((c) => c.id).sort());
    expect(ids.at(-1)).toBe(OTHER_ID);
    const names = COMMANDER_CHOICES.slice(0, -1).map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    expect(commanderName(OTHER_ID)).toBe("Outro comandante");
  });

  it("reads the commander from the URL hash and ignores anything else", () => {
    expect(commanderFromHash("#sun-tzu")).toBe("sun-tzu");
    expect(commanderFromHash("#other")).toBe(OTHER_ID);
    expect(commanderFromHash("")).toBeNull();
    expect(commanderFromHash("#main")).toBeNull();
    expect(commanderFromHash("#%E0%A4%A")).toBeNull(); // malformed escape
  });

  it("has a text for every shelf-life tag and stage in the table", () => {
    for (const c of COMMANDER_SHELF_LIFE) {
      expect(SHELF_LIFE_TEXT[c.shelfLife]).toBeTruthy();
      for (const s of c.usefulStages) expect(stageLabel(s)).not.toBe(s);
    }
  });
});

describe("sanitizeAnswers", () => {
  it("drops unknown questions, unknown options and non-string values", () => {
    expect(
      sanitizeAnswers({ purpose: "field_main", sculptureType: "diamonds", nope: "yes", roleNeed: 3, pairing: null }),
    ).toEqual({ purpose: "field_main" });
  });

  it("returns {} for anything that is not an object", () => {
    for (const raw of [null, undefined, "x", 3, ["purpose"], true]) expect(sanitizeAnswers(raw)).toEqual({});
  });

  it("keeps every valid option of every question", () => {
    for (const q of COMMANDER_CHECKLIST.questions) {
      for (const o of q.options) expect(sanitizeAnswers({ [q.id]: o.id })).toEqual({ [q.id]: o.id });
    }
  });
});

describe("prefill and decide", () => {
  it("prefills the table suggestions and marks them as suggested", () => {
    const tag = getShelfLife("sun-tzu")!;
    const p = prefill("sun-tzu", {});
    expect(p.answers).toEqual(tag.suggested);
    expect(p.suggested.sort()).toEqual(Object.keys(tag.suggested).sort());
  });

  it("player's own answers win and are no longer marked suggested", () => {
    const p = prefill("sun-tzu", { purpose: "gatherer" });
    expect(p.answers.purpose).toBe("gatherer");
    expect(p.suggested).not.toContain("purpose");
  });

  it("Another commander has no suggestions", () => {
    expect(prefill(OTHER_ID, {})).toEqual({ answers: {}, suggested: [] });
    expect(decide(OTHER_ID, {}).verdict).toBe("wait");
  });

  it("never throws on corrupted stored answers", () => {
    for (const raw of [{ purpose: "bogus" }, { bogus: "x" }, "garbage", null, [1, 2]]) {
      expect(() => decide("sun-tzu", raw)).not.toThrow();
    }
  });

  it("every table commander can be evaluated from its suggestions alone", () => {
    for (const c of COMMANDER_SHELF_LIFE) expect(() => decide(c.id, {})).not.toThrow();
  });

  it("answers change the verdict", () => {
    expect(decide(OTHER_ID, {}).verdict).toBe("wait");
    expect(decide(OTHER_ID, { sculptureType: "universal_gold", purpose: "gatherer" }).verdict).toBe("avoid");
    const go = {
      sculptureType: "epic_or_xp", purpose: "field_main", mainMarch: "part_of_main", roleNeed: "yes",
      pairing: "owned", shelfLife: "long_term",
    };
    expect(decide(OTHER_ID, go).verdict).toBe("go");
  });
});

describe("answer map updates", () => {
  it("setAnswer stores a valid answer and ignores invalid ones", () => {
    const m = setAnswer({}, "sun-tzu", "purpose", "gatherer");
    expect(m).toEqual({ "sun-tzu": { purpose: "gatherer" } });
    expect(setAnswer(m, "sun-tzu", "purpose", "bogus")).toBe(m);
    expect(setAnswer(m, "sun-tzu", "bogus", "yes")).toBe(m);
  });

  it("setAnswer drops corrupted answers of that commander and keeps other commanders", () => {
    const m = setAnswer({ "sun-tzu": { purpose: "bogus" }, lohar: { purpose: "gatherer" } }, "sun-tzu", "roleNeed", "yes");
    expect(m).toEqual({ "sun-tzu": { roleNeed: "yes" }, lohar: { purpose: "gatherer" } });
  });

  it("confirmSuggestions turns the suggestions into own answers", () => {
    const m = confirmSuggestions({ "sun-tzu": { purpose: "gatherer" } }, "sun-tzu");
    expect(m["sun-tzu"]).toEqual({ ...getShelfLife("sun-tzu")!.suggested, purpose: "gatherer" });
    expect(prefill("sun-tzu", m["sun-tzu"]).suggested).toEqual([]);
    const empty = {};
    expect(confirmSuggestions(empty, OTHER_ID)).toBe(empty);
  });

  it("clearCommander removes only that commander", () => {
    expect(clearCommander({ a: { x: "y" }, b: { x: "y" } }, "a")).toEqual({ b: { x: "y" } });
  });
});

describe("savedChecks", () => {
  it("lists known commanders with valid answers and their verdict", () => {
    const list = savedChecks({
      "sun-tzu": { purpose: "field_main" },
      lohar: { sculptureType: "universal_gold" },
      [OTHER_ID]: { purpose: "bogus" },
      "not-a-commander": { purpose: "field_main" },
      cao: "garbage",
    });
    expect(list.map((c) => c.id)).toEqual(["lohar", "sun-tzu"]);
    expect(list.find((c) => c.id === "lohar")).toMatchObject({ name: "Lohar", answered: 1, verdict: "avoid" });
  });

  it("is empty for corrupted maps", () => {
    for (const raw of [null, "x", [], 1]) expect(savedChecks(raw)).toEqual([]);
  });
});
