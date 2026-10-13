// @vitest-environment happy-dom
import { QUESTIONS, decodeProfile } from "@rokadm/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORE_KEY, readStore } from "../../lib/store";
import Questionnaire from "./Questionnaire";

const stepOf = (id: string): number => QUESTIONS.findIndex((q) => q.id === id);
const label = (i: number): string => QUESTIONS[i]!.label;
const title = (): HTMLElement => screen.getByRole("heading", { level: 1 });
const enter = (el: Element = document.body): boolean => fireEvent.keyDown(el, { key: "Enter" });

function setup(stored?: object) {
  if (stored) localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", ...stored }));
  const navigate = vi.fn();
  render(h(Questionnaire, { navigate }));
  return { navigate };
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("questionnaire island: keyboard", () => {
  it("Enter moves forward and focus goes to the new question heading", () => {
    setup();
    expect(title().textContent).toBe(label(0));
    expect(screen.getByText(/of 10/).textContent).toContain("1 of 10");
    enter();
    expect(title().textContent).toBe(label(1));
    expect(document.activeElement).toBe(title());
    expect(screen.getByText(/of 10/).textContent).toContain("2 of 10");
  });

  it("Enter on a radio option commits the picked option", () => {
    setup();
    const radio = screen.getByRole("radio", { name: /Whale/ });
    fireEvent.click(radio);
    enter(radio);
    expect(title().textContent).toBe(label(1));
    expect((readStore().draft as { answers: Record<string, unknown> }).answers.spending).toBe("whale");
  });

  it("Enter in the number field submits; Back keeps the typed answer", () => {
    setup({ draft: { step: stepOf("kingdomDay"), answers: {} } });
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "5000" } });
    enter(input);
    expect(title().textContent).toBe(label(stepOf("cityHall")));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5000");
    expect(document.activeElement).toBe(title());
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

  it("Skip is offered only on nullable questions", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    enter();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(title().textContent).toBe(label(2));
  });
});

describe("questionnaire island: summary", () => {
  it("shows warnings and saves the profile code before opening the guide", () => {
    const { navigate } = setup({
      draft: {
        step: QUESTIONS.length,
        answers: { spending: "f2p", lifetimeSpendUsd: 10_000_000, minutesPerDay: 1440, kingdomDay: 5000, cityHall: 25, civilization: null },
      },
    });
    expect(title().textContent).toBe("Check your answers");
    expect(screen.getByText(/You spent about \$10000000/)).toBeTruthy();
    expect(screen.getByText("10,000,000 USD")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See my guide" }));
    const code = readStore().profileCode!;
    expect("profile" in decodeProfile(code)).toBe(true);
    expect(readStore().draft).toBeNull();
    expect(navigate).toHaveBeenCalledWith(`/guide/?p=${code}`);
  });

  it("Edit answers: a saved profile opens pre-filled; Change returns to the summary", () => {
    setup({ profileCode: "1.1.2.1.12.30.2.140.250.china.1" });
    expect(title().textContent).toBe("Check your answers");
    expect(screen.getByText("China")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Change answer: ${label(stepOf("cityHall"))}` }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("12");
    expect(screen.getByRole("button", { name: "Review answers" })).toBeTruthy();
    enter(screen.getByRole("textbox"));
    expect(title().textContent).toBe("Check your answers");
  });
});
