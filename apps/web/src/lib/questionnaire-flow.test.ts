import { QUESTIONS, decodeProfile, encodeProfile, getQuestion, type NumberQuestion, type QuestionId } from "@rokadm/core";
import { describe, expect, it } from "vitest";
import {
  ONBOARDING_IDS,
  OPTIONAL_IDS,
  PLAYING_AS_QUESTION,
  STEPS,
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
  homeUrl,
  initialState,
  next,
  parseNumberAnswer,
  questionAt,
  resume,
  setAnswer,
  skip,
  toDraft,
  type FlowState,
  type StepId,
} from "./questionnaire-flow";

const stepOf = (id: StepId): number => STEPS.findIndex((q) => q.id === id);
const at = (id: StepId, s: FlowState = initialState()): FlowState => ({ ...s, step: stepOf(id) });
const numQ = (id: QuestionId) => getQuestion(id) as NumberQuestion;

describe("onboarding steps (UX stage 1)", () => {
  it("asks at most 5 questions: role, spending, minutes, City Hall, kingdom stage", () => {
    expect(STEPS.map((q) => q.id)).toEqual(["playingAs", "spending", "minutesPerDay", "cityHall", "kingdomStage"]);
    expect(TOTAL).toBe(5);
    expect(questionAt(0)).toBe(PLAYING_AS_QUESTION);
    expect(questionAt(1)).toBe(getQuestion("spending"));
    expect(questionAt(SUMMARY)).toBeNull();
  });

  it("every other core question is optional (edited on /me), none is lost", () => {
    expect([...ONBOARDING_IDS, ...OPTIONAL_IDS].sort()).toEqual(QUESTIONS.map((q) => q.id).sort());
    expect(OPTIONAL_IDS).toEqual(expect.arrayContaining(["kingdomDay", "civilization", "sessionsPerDay"]));
  });
});

describe("navigation", () => {
  it("next commits the answer (or the default) and moves one step", () => {
    const s1 = next(initialState());
    expect(s1.step).toBe(1);
    expect(s1.answers.playingAs).toBe("player");
    const s2 = next(setAnswer(at("spending"), "whale"));
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
    let s = next(setAnswer(at("minutesPerDay"), 30));
    s = setAnswer(s, "12");
    s = back(s);
    expect(s.step).toBe(stepOf("minutesPerDay"));
    expect(s.answers).toEqual({ minutesPerDay: 30, cityHall: "12" });
    expect(currentValue(s, getQuestion("minutesPerDay"))).toBe(30);
    expect(back(initialState()).step).toBe(0);
  });

  it("no onboarding step can be skipped (all five are needed)", () => {
    for (let i = 0; i < TOTAL; i++) expect(canSkip({ ...initialState(), step: i })).toBe(false);
    expect(skip(initialState())).toEqual(initialState());
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
    expect(s.error).toBe("30 está fora do intervalo. Digite um número de 1 a 25.");
    expect(s.answers.cityHall).toBe("30");
    expect(setAnswer(s, "3").error).toBeNull();
  });

  it("messages for blank, non-digit and fractional input use the core limits", () => {
    const ch = numQ("cityHall");
    expect(parseNumberAnswer(ch, "")).toEqual({ error: "Digite um número de 1 a 25." });
    expect(parseNumberAnswer(ch, "abc")).toEqual({ error: "Use só dígitos: um número inteiro de 1 a 25." });
    expect(parseNumberAnswer(ch, "2.5")).toEqual({ error: "Use um número inteiro de 1 a 25." });
    expect(parseNumberAnswer(numQ("lifetimeSpendUsd"), "10,000,001")).toEqual({
      error: "10.000.001 está fora do intervalo. Digite um número de 0 a 10.000.000 USD.",
    });
  });

  it("accepts the worst case values and digit grouping", () => {
    expect(parseNumberAnswer(numQ("lifetimeSpendUsd"), "10,000,000")).toEqual({ value: 10_000_000 });
    expect(parseNumberAnswer(numQ("kingdomDay"), "5000")).toEqual({ value: 5000 });
    expect(parseNumberAnswer(numQ("minutesPerDay"), "1440")).toEqual({ value: 1440 });
    expect(parseNumberAnswer(numQ("cityHall"), 25)).toEqual({ value: 25 });
  });

  it("a role that is not an option is rejected", () => {
    expect(next(setAnswer(initialState(), "king")).error).toBe("Escolha uma das opções.");
  });
});

describe("draft and resume", () => {
  it("round-trips through the stored draft on the same step", () => {
    const s = next(next(setAnswer(initialState(), "leader")));
    const back2 = fromDraft(JSON.parse(JSON.stringify(toDraft(s))));
    expect(back2).toEqual({ ...s, error: null, review: false });
    expect(resume({ draft: toDraft(s), profileCode: null }).step).toBe(2);
  });

  it("ignores malformed drafts and unknown keys; an old 10-step draft opens the summary", () => {
    expect(fromDraft(null)).toBeNull();
    expect(fromDraft({ step: 2 })).toBeNull();
    expect(fromDraft({ step: 99, answers: { bogus: 1, cityHall: { x: 1 }, role: "farm" } })).toEqual({
      step: SUMMARY, answers: { role: "farm" }, review: false, error: null,
    });
    expect(fromDraft({ step: -1, answers: {} })?.step).toBe(0);
  });

  it("opens a saved profile pre-filled on the summary; old codes decode and keep their optional answers", () => {
    const code = "1.1.2.1.12.30.2.140.250.china.1";
    const s = resume({ draft: null, profileCode: code });
    expect(s.step).toBe(SUMMARY);
    expect(s.answers.playingAs).toBe("player");
    const out = finish(s.answers);
    expect(out.ok && out.code).toBe(code);
    expect(resume({ draft: null, profileCode: code, playingAs: "leader" }).answers.playingAs).toBe("leader");
  });

  it("draft wins over the saved profile; bad code starts fresh", () => {
    expect(resume({ draft: { step: 4, answers: {} }, profileCode: "1.0.0.0.1.60.....0" }).step).toBe(4);
    expect(resume({ draft: null, profileCode: "junk" })).toEqual(initialState());
  });
});

describe("finish", () => {
  it("returns the encoded profile and core warnings; optional answers default", () => {
    const out = finish({ playingAs: "player", spending: "f2p", minutesPerDay: 10, cityHall: 25, kingdomStage: "pre_kvk" });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.profile.kingdomDay).toBeNull();
    expect(out.profile.civilization).toBeNull();
    expect(out.warnings.length).toBe(1);
    expect(decodeProfile(out.code)).toEqual({ profile: out.profile, warnings: out.warnings });
    expect(out.code).toBe(encodeProfile(out.profile));
    expect(guideUrl(out.code)).toBe(`/guide/?p=${out.code}`);
  });

  it("lands on City Hall for a player and Kingdom for a leader, never on the long guide", () => {
    const player = finish({ playingAs: "player" });
    const leader = finish({ playingAs: "leader" });
    expect(player.ok && homeUrl(player.playingAs)).toBe("/city-hall/");
    expect(leader.ok && homeUrl(leader.playingAs)).toBe("/kingdom/");
  });

  it("a leader's profile role is the kingdom leader; a player's leader role goes back to the default", () => {
    const leader = finish({ playingAs: "leader", role: "farm" });
    expect(leader.ok && leader.profile.role).toBe("lider");
    const player = finish({ playingAs: "player", role: "lider" });
    expect(player.ok && player.profile.role).toBe("lutador");
    const farm = finish({ playingAs: "player", role: "farm" });
    expect(farm.ok && farm.profile.role).toBe("farm");
  });

  it("an optional answer that no longer fits is cleared with a note, not blocking", () => {
    const out = finish({ kingdomStage: "kvk1", kingdomDay: 3 });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.profile.kingdomDay).toBeNull();
    expect(out.warnings[0]).toMatch(/deixou de combinar/);
  });

  it("answer text uses core labels", () => {
    expect(answerText(getQuestion("spending"), "f2p")).toBe(QUESTIONS[0]!.type === "choice" ? QUESTIONS[0]!.options[0]!.label : "");
    expect(answerText(getQuestion("civilization"), null)).toBe("Not chosen yet / not sure");
    expect(answerText(getQuestion("lifetimeSpendUsd"), 10_000_000)).toBe("10.000.000 USD");
    expect(answerText(getQuestion("kingdomDay"), null)).toBe("Pulada");
    expect(answerText(getQuestion("returningPlayer"), true)).toBe("Sim");
    expect(answerText(PLAYING_AS_QUESTION, "leader")).toBe("Como líder de reino ou de aliança");
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
