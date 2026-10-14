// @vitest-environment happy-dom
import { decodeProfile } from "@rokadm/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STEPS, SUMMARY } from "../../lib/questionnaire-flow";
import { STORE_KEY, readStore } from "../../lib/store";
import { LEADS } from "../../lib/sun-tzu";
import Questionnaire from "./Questionnaire";

const stepOf = (id: string): number => STEPS.findIndex((q) => q.id === id);
const label = (i: number): string => STEPS[i]!.label;
const title = (): HTMLElement => screen.getByRole("heading", { level: 1 });
const enter = (el: Element = document.body): boolean => fireEvent.keyDown(el, { key: "Enter" });

function setup(stored?: object) {
  if (stored) localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", ...stored }));
  const navigate = vi.fn();
  render(h(Questionnaire, { navigate }));
  return { navigate };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-role");
});
afterEach(cleanup);

describe("questionnaire island: keyboard", () => {
  it("Enter moves forward and focus goes to the new question's options, not the log", () => {
    setup();
    expect(title().textContent).toBe(label(0));
    expect(screen.getByText(/of 5/).textContent).toContain("1 of 5");
    enter();
    expect(title().textContent).toBe(label(1));
    // Spending has options and the default is picked: the picked quick reply.
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: /F2P/ }));
    expect(screen.getByRole("log").contains(document.activeElement)).toBe(false);
    expect(screen.getByText(/of 5/).textContent).toContain("2 of 5");
  });

  it("first load focuses the picked option of the first question", async () => {
    setup();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: /As a player/ }));
  });

  it("first load on a resumed number step focuses its field", async () => {
    setup({ draft: { step: stepOf("cityHall"), answers: {} } });
    await new Promise((r) => setTimeout(r, 0));
    expect(title().textContent).toBe(label(stepOf("cityHall")));
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  it("first load does not steal focus the user already placed", async () => {
    const other = document.createElement("button");
    document.body.append(other);
    other.focus();
    setup();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(other);
    other.remove();
  });

  it("the kingdom stage step notes how KvK2+ is covered", () => {
    setup({ draft: { step: stepOf("kingdomStage"), answers: {} } });
    expect(screen.getByText(/From KvK2 on, the guide uses the late-game plan/)).toBeTruthy();
  });

  it("Enter on a radio option commits the picked option", () => {
    setup({ draft: { step: stepOf("spending"), answers: {} } });
    const radio = screen.getByRole("radio", { name: /Whale/ });
    fireEvent.click(radio);
    enter(radio);
    expect(title().textContent).toBe(label(stepOf("minutesPerDay")));
    expect((readStore().draft as { answers: Record<string, unknown> }).answers.spending).toBe("whale");
  });

  it("Enter in the number field submits; Back keeps the typed answer", () => {
    setup({ draft: { step: stepOf("cityHall"), answers: {} } });
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "17" } });
    enter(input);
    expect(title().textContent).toBe(label(stepOf("kingdomStage")));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("17");
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  it("Esc closes to the home page and keeps the draft", () => {
    const { navigate } = setup({ draft: { step: 3, answers: { spending: "low" } } });
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(navigate).toHaveBeenCalledWith("/");
    expect(readStore().draft).toMatchObject({ step: 3, answers: { spending: "low" } });
  });

  it("Enter on a button keeps the button's own action", () => {
    setup({ draft: { step: 2, answers: {} } });
    const backBtn = screen.getByRole("button", { name: "Back" });
    enter(backBtn);
    expect(title().textContent).toBe(label(2));
  });
});

describe("questionnaire island: chat", () => {
  it("Sun Tzu asks in a polite log; answers appear as the player's bubbles", () => {
    setup();
    const log = screen.getByRole("log");
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.textContent).toContain("Sun Tzu");
    expect(log.textContent).toContain(LEADS.playingAs);
    fireEvent.click(screen.getByRole("radio", { name: /leader/ }));
    enter(screen.getByRole("radio", { name: /leader/ }));
    expect(log.textContent).toContain("You: As a kingdom or alliance leader");
    expect(log.textContent).toContain(LEADS.spending);
    // One page heading: the current question only.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("the mascot is decorative and the bot's name is text", () => {
    setup();
    const avatars = document.querySelectorAll(".st-avatar");
    expect(avatars.length).toBeGreaterThan(0);
    for (const a of avatars) expect(a.getAttribute("aria-hidden")).toBe("true");
  });

  it("Sun Tzu greets first, then nods (approve) at an accepted answer while the new bubble types", () => {
    setup();
    const stageState = () => document.querySelector(".st-stage")!.getAttribute("data-state");
    expect(stageState()).toBe("greet");
    enter();
    expect(stageState()).toBe("approve");
  });

  it("one stage, above the current question; history shows still posters", () => {
    setup();
    enter();
    const stages = document.querySelectorAll(".st-stage");
    expect(stages).toHaveLength(1);
    const current = document.querySelector(".q-msg-bot[data-current]")!;
    expect(current.firstElementChild).toBe(stages[0]);
    expect(stages[0]!.compareDocumentPosition(current.querySelector(".q-bubble")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const old of document.querySelectorAll(".q-msg-bot:not([data-current]) .st-avatar")) expect(old.hasAttribute("data-state")).toBe(false);
  });

  it("a tap on a quick reply answers and moves on in one go", () => {
    setup({ draft: { step: stepOf("spending"), answers: {} } });
    const radio = screen.getByRole("radio", { name: /Medium spender/ });
    fireEvent.pointerDown(radio.closest("label")!);
    fireEvent.click(radio);
    expect(title().textContent).toBe(label(stepOf("minutesPerDay")));
    expect((readStore().draft as { answers: Record<string, unknown> }).answers.spending).toBe("medium");
    // The late change event of the old step does not touch the new one.
    fireEvent.change(radio);
    expect((readStore().draft as { answers: Record<string, unknown> }).answers.minutesPerDay).toBeUndefined();
  });

  it("every option shows its one-line why", () => {
    setup();
    for (const r of screen.getAllByRole("radio")) {
      const help = document.getElementById(r.getAttribute("aria-describedby") ?? "");
      expect(help?.textContent?.length).toBeGreaterThan(0);
    }
  });

  it("no option is marked Recommended (decision QC-1)", () => {
    for (let step = 0; step <= STEPS.length; step++) {
      setup({ draft: { step, answers: {} } });
      expect(document.body.textContent).not.toMatch(/recommended/i);
      cleanup();
      localStorage.clear();
    }
  });

  it("the new message shows typing dots that any key skips; the reply is ready at once", () => {
    setup();
    enter();
    const current = document.querySelector(".q-msg-bot[data-current]")!;
    expect(current.hasAttribute("data-typing")).toBe(true);
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    fireEvent.keyDown(document.body, { key: "Shift" });
    expect(document.querySelector(".q-msg-bot[data-current]")!.hasAttribute("data-typing")).toBe(false);
  });

  it("Sun Tzu grumbles at an empty or invalid answer, next to the error text", () => {
    setup({ draft: { step: stepOf("cityHall"), answers: { cityHall: "" } } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(document.querySelector(".q-msg-bot[data-current] .st-avatar")!.getAttribute("data-state")).toBe("grumble");
    expect(screen.getByText(/Enter a number from 1 to 25/)).toBeTruthy();
  });
});

describe("questionnaire island: errors", () => {
  it("an invalid City Hall shows a how-to-fix error below the field and blocks Next", () => {
    setup({ draft: { step: stepOf("cityHall"), answers: {} } });
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(title().textContent).toBe(label(stepOf("cityHall")));
    const err = screen.getByText("30 is out of range. Enter a number from 1 to 25.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(err.id);
    expect(document.activeElement).toBe(input);
    // Error follows the field in the DOM (shown below it).
    expect(input.compareDocumentPosition(err) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.input(input, { target: { value: "25" } });
    expect(screen.queryByText(/out of range/)).toBeNull();
  });

  it("Skip is never offered: all five questions are needed", () => {
    for (let step = 0; step < STEPS.length; step++) {
      setup({ draft: { step, answers: {} } });
      expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
      cleanup();
      localStorage.clear();
    }
  });
});

describe("questionnaire island: summary", () => {
  it("shows warnings, saves the profile code and opens City Hall (player)", () => {
    const { navigate } = setup({
      draft: { step: SUMMARY, answers: { playingAs: "player", spending: "f2p", minutesPerDay: 10, cityHall: 25, kingdomStage: "pre_kvk" } },
    });
    expect(title().textContent).toBe("Check your answers");
    expect(document.querySelector(".st-stage")!.getAttribute("data-state")).toBe("victory");
    expect(screen.getByText(/Under 15 minutes a day/)).toBeTruthy();
    expect(screen.getByText(/optional: add them any time on the Me tab/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open my City Hall" }));
    const code = readStore().profileCode!;
    expect("profile" in decodeProfile(code)).toBe(true);
    expect(readStore().draft).toBeNull();
    expect(readStore().playingAs).toBe("player");
    expect(navigate).toHaveBeenCalledWith("/city-hall/");
  });

  it("a leader lands on Kingdom and the tabs switch at once", () => {
    const { navigate } = setup({ draft: { step: SUMMARY, answers: { playingAs: "leader" } } });
    fireEvent.click(screen.getByRole("button", { name: "Open my Kingdom" }));
    expect(readStore().playingAs).toBe("leader");
    expect(document.documentElement.getAttribute("data-role")).toBe("leader");
    expect(navigate).toHaveBeenCalledWith("/kingdom/");
  });

  it("Edit answers: a saved profile (old 10-answer code) opens pre-filled; Change returns to the summary", () => {
    setup({ profileCode: "1.1.2.1.12.30.2.140.250.china.1" });
    expect(title().textContent).toBe("Check your answers");
    expect(screen.getAllByRole("button", { name: /^Change answer/ })).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: `Change answer: ${label(stepOf("cityHall"))}` }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("12");
    expect(screen.getByRole("button", { name: "Review answers" })).toBeTruthy();
    enter(screen.getByRole("textbox"));
    expect(title().textContent).toBe("Check your answers");
    // The optional answers of the old code (civilization China, kingdom day 140) are kept.
    fireEvent.click(screen.getByRole("button", { name: "Open my City Hall" }));
    expect(readStore().profileCode).toBe("1.1.2.1.12.30.2.140.250.china.1");
  });
});
