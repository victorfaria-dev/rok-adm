import { QUESTIONS, decodeProfile, encodeProfile, getQuestion, type NumberQuestion, type QuestionId } from "@rokadm/core";
import { describe, expect, it } from "vitest";
import {
  SUMMARY,
  TOTAL,
  answerText,
  back,
  canSkip,
  closeTarget,
  currentValue,
  edit,
  finish,
  fromDraft,
  guideUrl,
  initialState,
  next,
  parseNumberAnswer,
  questionAt,
  resume,
  setAnswer,
  skip,
  toDraft,
  type FlowState,
} from "./questionnaire-flow";

const stepOf = (id: QuestionId): number => QUESTIONS.findIndex((q) => q.id === id);
const at = (id: QuestionId, s: FlowState = initialState()): FlowState => ({ ...s, step: stepOf(id) });
const numQ = (id: QuestionId) => getQuestion(id) as NumberQuestion;

describe("navigation", () => {
  it("has one step per core question plus the summary", () => {
    expect(TOTAL).toBe(QUESTIONS.length);
    expect(questionAt(0)).toBe(QUESTIONS[0]);
    expect(questionAt(SUMMARY)).toBeNull();
  });

  it("next commits the answer (or the core default) and moves one step", () => {
    const s1 = next(initialState());
    expect(s1.step).toBe(1);
    expect(s1.answers.spending).toBe(QUESTIONS[0]!.default);
    const s2 = next(setAnswer(initialState(), "whale"));
    expect(s2.answers.spending).toBe("whale");
  });

  it("pressing next on every step reaches the summary with a valid profile", () => {
    let s = initialState();
    for (let i = 0; i < TOTAL; i++) s = next(s);
    expect(s.step).toBe(SUMMARY);
    expect(next(s)).toBe(s);
    const out = finish(s.answers);
    expect(out.ok).toBe(true);
  });

  it("back keeps answers, including text being typed", () => {
    let s = next(setAnswer(initialState(), "low"));
    s = setAnswer(s, "12");
    s = back(s);
    expect(s.step).toBe(0);
    expect(s.answers).toEqual({ spending: "low", lifetimeSpendUsd: "12" });
    expect(currentValue(s, QUESTIONS[0]!)).toBe("low");
    expect(back(s).step).toBe(0);
  });

  it("skip stores null only for nullable questions", () => {
    expect(canSkip(initialState())).toBe(false);
    expect(skip(initialState())).toEqual(initialState());
    const s = skip(at("lifetimeSpendUsd"));
    expect(s.answers.lifetimeSpendUsd).toBeNull();
    expect(s.step).toBe(stepOf("lifetimeSpendUsd") + 1);
  });

  it("edit from the summary returns to the summary on next", () => {
    const s = edit({ ...initialState(), step: SUMMARY }, stepOf("cityHall"));
    expect(s.step).toBe(stepOf("cityHall"));
    const done = next(setAnswer(s, "20"));
    expect(done.step).toBe(SUMMARY);
    expect(done.answers.cityHall).toBe(20);
    expect(done.review).toBe(false);
  });
});

describe("per-step validation", () => {
  it("blocks an out-of-range City Hall with a how-to-fix message", () => {
    const s = next(setAnswer(at("cityHall"), "30"));
    expect(s.step).toBe(stepOf("cityHall"));
    expect(s.error).toBe("30 is out of range. Enter a number from 1 to 25.");
    expect(s.answers.cityHall).toBe("30");
    expect(setAnswer(s, "3").error).toBeNull();
  });

  it("messages for blank, non-digit and fractional input use the core limits", () => {
    const ch = numQ("cityHall");
    expect(parseNumberAnswer(ch, "")).toEqual({ error: "Enter a number from 1 to 25." });
    expect(parseNumberAnswer(ch, "abc")).toEqual({ error: "Use digits only: a whole number from 1 to 25." });
    expect(parseNumberAnswer(ch, "2.5")).toEqual({ error: "Use a whole number from 1 to 25." });
    expect(parseNumberAnswer(numQ("lifetimeSpendUsd"), "10,000,001")).toEqual({
      error: "10,000,001 is out of range. Enter a number from 0 to 10,000,000 USD.",
    });
  });

  it("accepts the worst case values and digit grouping", () => {
    expect(parseNumberAnswer(numQ("lifetimeSpendUsd"), "10,000,000")).toEqual({ value: 10_000_000 });
    expect(parseNumberAnswer(numQ("kingdomDay"), "5000")).toEqual({ value: 5000 });
    expect(parseNumberAnswer(numQ("minutesPerDay"), "1440")).toEqual({ value: 1440 });
    expect(parseNumberAnswer(numQ("cityHall"), 25)).toEqual({ value: 25 });
  });

  it("blank nullable number counts as skipped", () => {
    const s = next(at("kingdomDay"));
    expect(s.answers.kingdomDay).toBeNull();
  });

  it("applies core cross-field rules on the step (kingdom day vs stage)", () => {
    let s: FlowState = { ...initialState(), answers: { kingdomStage: "kvk2" } };
    s = next(setAnswer(at("kingdomDay", s), "10"));
    expect(s.step).toBe(stepOf("kingdomDay"));
    expect(s.error).toMatch(/cannot be past pre-KvK/);
  });
});

describe("draft and resume", () => {
  it("round-trips through the stored draft on the same step", () => {
    const s = next(next(setAnswer(initialState(), "medium")));
    const back2 = fromDraft(JSON.parse(JSON.stringify(toDraft(s))));
    expect(back2).toEqual({ ...s, error: null, review: false });
    expect(resume({ draft: toDraft(s), profileCode: null }).step).toBe(2);
  });

  it("ignores malformed drafts and unknown keys", () => {
    expect(fromDraft(null)).toBeNull();
    expect(fromDraft({ step: 2 })).toBeNull();
    expect(fromDraft({ step: 99, answers: { bogus: 1, cityHall: { x: 1 }, role: "farm" } })).toEqual({
      step: 0, answers: { role: "farm" }, review: false, error: null,
    });
  });

  it("opens a saved profile pre-filled on the summary when there is no draft", () => {
    const code = "1.1.2.1.12.30.2.140.250.china.1";
    const s = resume({ draft: null, profileCode: code });
    expect(s.step).toBe(SUMMARY);
    const out = finish(s.answers);
    expect(out.ok && out.code).toBe(code);
  });

  it("draft wins over the saved profile; bad code starts fresh", () => {
    expect(resume({ draft: { step: 4, answers: {} }, profileCode: "1.0.0.0.1.60.....0" }).step).toBe(4);
    expect(resume({ draft: null, profileCode: "junk" })).toEqual(initialState());
  });
});

describe("summary", () => {
  it("returns the encoded profile and core warnings", () => {
    const out = finish({ spending: "f2p", lifetimeSpendUsd: "10,000,000", minutesPerDay: 1440, kingdomDay: 5000, cityHall: 25, civilization: null });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.warnings.length).toBe(2);
    expect(decodeProfile(out.code)).toEqual({ profile: out.profile, warnings: out.warnings });
    expect(out.code).toBe(encodeProfile(out.profile));
    expect(guideUrl(out.code)).toBe(`/guide/?p=${out.code}`);
  });

  it("maps core errors back to the step to fix", () => {
    const out = finish({ kingdomStage: "kvk1", kingdomDay: 3 });
    expect(out).toEqual({ ok: false, errors: [{ step: stepOf("kingdomDay"), message: expect.stringMatching(/day 3/) }] });
  });

  it("answer text uses core labels", () => {
    expect(answerText(getQuestion("spending"), "f2p")).toBe(QUESTIONS[0]!.type === "choice" ? QUESTIONS[0]!.options[0]!.label : "");
    expect(answerText(getQuestion("civilization"), null)).toBe("Not chosen yet / not sure");
    expect(answerText(getQuestion("lifetimeSpendUsd"), 10_000_000)).toBe("10,000,000 USD");
    expect(answerText(getQuestion("kingdomDay"), null)).toBe("Skipped");
    expect(answerText(getQuestion("returningPlayer"), true)).toBe("Yes");
  });
});

describe("close", () => {
  it("goes back to a same-origin page, else home", () => {
    const o = "https://ko.test";
    expect(closeTarget("https://ko.test/me/", o)).toBe("/me/");
    expect(closeTarget("https://ko.test/guide/?p=1#budget", o)).toBe("/guide/?p=1#budget");
    expect(closeTarget("https://ko.test/start/", o)).toBe("/");
    expect(closeTarget("https://elsewhere.test/me/", o)).toBe("/");
    expect(closeTarget("", o)).toBe("/");
  });
});
