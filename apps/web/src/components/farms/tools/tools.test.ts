// @vitest-environment happy-dom
import { encodeProfile, type AccountProfile } from "@rokadm/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FARMS_KEY, readFarms } from "../../../lib/farms-store";
import { STORE_KEY } from "../../../lib/store";
import BuildPathTool from "./BuildPathTool";
import FarmChooser, { PAIR_SENTENCE } from "./FarmChooser";
import TradingPostCalc from "./TradingPostCalc";

const profile: AccountProfile = {
  spending: "medium", lifetimeSpendUsd: null, minutesPerDay: 120, sessionsPerDay: null, role: "lutador",
  kingdomStage: "kvk1", kingdomDay: null, cityHall: 14, civilization: null, returningPlayer: false,
};

const farm = (over: object = {}) => ({
  id: "farm-1", name: "Farm One", role: "food", note: "",
  levels: { cityHall: 17, tradingPost: 15, goldmine: 12, academy: null, commanderLevel: null },
  gatheringUntil: null, daily: null, goal: null, createdAt: "2026-10-01T00:00:00.000Z", ...over,
});

const seedFarms = (farms: object[], extra: object = {}) =>
  localStorage.setItem(FARMS_KEY, JSON.stringify({ v: 1, farms, shipments: [], showHypotheses: false, ...extra }));

const input = (label: string | RegExp) => screen.getByLabelText(label) as HTMLInputElement;
const type = (label: string | RegExp, value: string) => fireEvent.input(input(label), { target: { value } });
const summary = () => document.querySelector("[data-summary]")!.textContent ?? "";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

describe("FarmChooser", () => {
  it("prefills City Hall, minutes and spending from the saved profile and says so", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", profileCode: encodeProfile(profile) }));
    render(h(FarmChooser, {}));
    expect(input("Main City Hall").value).toBe("14");
    expect(input("Minutes per day").value).toBe("120");
    expect((screen.getByLabelText("Spending profile") as HTMLSelectElement).value).toBe("medium");
    expect(screen.getByText(/Prefilled from your profile/)).toBeTruthy();
    // CH14 → gold + stone band; medium spender → gold farm "Possible".
    expect(summary()).toContain("gold and stone");
    expect(document.querySelector('[data-variant="gold"] [data-status]')!.textContent).toBe("Possible");
  });

  it("without a profile: no prefill note, bottleneck asks for City Hall, statuses as text", () => {
    render(h(FarmChooser, {}));
    expect(screen.queryByText(/Prefilled from your profile/)).toBeNull();
    expect(screen.getByText(/Enter your main's City Hall/)).toBeTruthy();
    expect(document.querySelector('[data-variant="general"] [data-status]')!.textContent).toBe("Recommended");
    expect(document.querySelector('[data-variant="gold"] [data-status]')!.textContent).toBe("Not recommended for you");
    expect(screen.getByRole("link", { name: "Add this farm to My farms" }).getAttribute("href")).toBe("/farms/");
    expect(screen.getByRole("link", { name: "Gold farm guide" }).getAttribute("href")).toBe("/guides/farms/gold/");
  });

  it("recalculates live: wanting more than one farm with a lot of time suggests 2", () => {
    render(h(FarmChooser, {}));
    type("Minutes per day", "120");
    fireEvent.click(screen.getByLabelText("I want more than one farm"));
    expect(document.querySelector("[data-count]")!.textContent).toBe("2");
    type("Minutes per day", "5");
    expect(document.querySelector("[data-count]")!.textContent).toBe("0");
  });

  it("an invalid City Hall shows an inline error wired to the field, never NaN", () => {
    render(h(FarmChooser, {}));
    type("Main City Hall", "30");
    const err = screen.getByText("30 is out of range. Enter a number from 1 to 25.");
    expect(input("Main City Hall").getAttribute("aria-invalid")).toBe("true");
    expect(input("Main City Hall").getAttribute("aria-describedby")).toContain(err.id);
    expect(summary()).toBe("Fix the highlighted fields to update the advice.");
    expect(document.body.textContent).not.toContain("NaN");
  });

  it("the food + wood pair appears only with Show hypotheses, and the choice is saved", () => {
    render(h(FarmChooser, {}));
    expect(document.querySelector('[data-variant="pair-food-wood"]')).toBeNull();
    fireEvent.click(screen.getByLabelText("Show hypotheses"));
    const pair = document.querySelector('[data-variant="pair-food-wood"]')!;
    expect(pair.textContent).toContain(PAIR_SENTENCE);
    expect(pair.textContent).toContain("Hypothesis, not sourced");
    expect(readFarms().showHypotheses).toBe(true);
    cleanup();
    render(h(FarmChooser, {}));
    expect(document.querySelector('[data-variant="pair-food-wood"]')).not.toBeNull();
  });
});

describe("BuildPathTool", () => {
  it("?farm=<id> preselects the stored farm and loads its levels and focus", () => {
    seedFarms([farm(), farm({ id: "farm-2", name: "Other" })]);
    window.history.replaceState(null, "", "/farms/build/?farm=farm-1");
    render(h(BuildPathTool, {}));
    expect((screen.getByLabelText("Farm") as HTMLSelectElement).value).toBe("farm-1");
    expect(input("City Hall").value).toBe("17");
    expect(input("Trading Post").value).toBe("15");
    expect((screen.getByLabelText(/^Focus/) as HTMLSelectElement).value).toBe("food");
    // Goldmine 12 < 15 is the first step to do.
    expect(summary()).toContain("Next step: Goldmine at the same level");
    expect(document.querySelector('[data-step="ch11"] [data-step-status]')!.textContent).toContain("Done");
    expect(document.querySelector('[data-step="goldmine"] [data-step-status]')!.textContent).toContain("To do");
    expect(document.querySelector('[data-step="academy-foodwood-15"] [data-step-status]')!.textContent).toContain("Enter your level to check");
    expect(document.querySelector('[data-step="civ"] [data-step-status]')!.textContent).toContain("Info");
    // Food focus drops the stone/gold Academy steps.
    expect(document.querySelector('[data-step="academy-stonegold-15"]')).toBeNull();
  });

  it("edits save back to the farm only with the explicit button", () => {
    seedFarms([farm()]);
    window.history.replaceState(null, "", "/farms/build/?farm=farm-1");
    render(h(BuildPathTool, {}));
    type("Goldmine", "15");
    expect(readFarms().farms[0]!.levels.goldmine).toBe(12);
    fireEvent.click(screen.getByRole("button", { name: "Save levels to Farm One" }));
    expect(readFarms().farms[0]!.levels.goldmine).toBe(15);
    expect(screen.getByRole("status").textContent).toBe("Saved to Farm One.");
  });

  it("unknown ?farm= falls back to entering levels by hand", () => {
    window.history.replaceState(null, "", "/farms/build/?farm=nope");
    render(h(BuildPathTool, {}));
    expect(screen.getByText(/not saved in this browser/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Save levels/ })).toBeNull();
    expect(summary()).toContain("Enter your levels to find your next step");
  });
});

describe("TradingPostCalc", () => {
  it("net 1,000,000 at Trading Post 15 → send 1,265,823, tax 265,823 at 21% from the table", () => {
    render(h(TradingPostCalc, {}));
    type(/Amount your main needs/, "1,000,000");
    type("Farm Trading Post level", "15");
    expect(summary()).toContain("Send 1,265,823 food so your main receives 1,000,000.");
    const tax = document.querySelector('[data-row="tax"] dd')!.textContent;
    expect(tax).toBe("265,823 (21%, from table)");
    expect(document.querySelector('[data-row="capacity"] dd')!.textContent).toContain("from table");
    expect(document.querySelector('[data-warning="capacity_counts_gross"]')!.textContent).toContain("Hypothesis, not sourced");
    expect(document.querySelector('[data-warning="capacity_contested"]')).not.toBeNull();
  });

  it("accepts 1.5m / 300k, tax override wins, stock and protection give the shortfall", () => {
    render(h(TradingPostCalc, {}));
    type(/Amount your main needs/, "1m");
    type("Tax rate you see in game (%)", "20");
    type("Capacity per trip you see in game", "500k");
    type(/Farm stock of/, "1.5m");
    type(/Storehouse protection/, "300k");
    type("Free march queues on the farm", "2");
    expect(document.querySelector('[data-row="gross"] dd')!.textContent).toBe("1,250,000 food");
    expect(document.querySelector('[data-row="tax"] dd')!.textContent).toBe("250,000 (20%, your value)");
    expect(document.querySelector('[data-row="capacity"] dd')!.textContent).toBe("500,000 (your value)");
    expect(document.querySelector('[data-row="trips"] dd')!.textContent).toBe("3");
    expect(document.querySelector('[data-row="rounds"] dd')!.textContent).toBe("2");
    expect(document.querySelector('[data-row="shippable"] dd')!.textContent).toBe("1,200,000 food");
    expect(document.querySelector('[data-row="shortfall"] dd')!.textContent).toBe("50,000 food");
  });

  it("invalid amounts show inline errors and no NaN; unknown tax says what to enter", () => {
    render(h(TradingPostCalc, {}));
    expect(summary()).toBe("Enter the amount your main needs.");
    type(/Amount your main needs/, "lots");
    expect(input(/Amount your main needs/).getAttribute("aria-invalid")).toBe("true");
    expect(summary()).toBe("Fix the highlighted fields to update the result.");
    type(/Amount your main needs/, "300k");
    expect(summary()).toBe("Enter the farm's Trading Post level or the tax rate you see in game.");
    expect(document.querySelector('[data-row="tax"] dd')!.textContent).toContain("unknown");
    expect(document.body.textContent).not.toContain("NaN");
  });

  it("?farm=<id> prefills the Trading Post level and resource", () => {
    seedFarms([farm({ role: "stone", levels: { cityHall: 20, tradingPost: 21, goldmine: 21, academy: null, commanderLevel: null } })]);
    window.history.replaceState(null, "", "/farms/trading-post/?farm=farm-1");
    render(h(TradingPostCalc, {}));
    expect(input("Farm Trading Post level").value).toBe("21");
    expect((screen.getByLabelText("Resource") as HTMLSelectElement).value).toBe("stone");
    expect(screen.getByText("Trading Post level prefilled from Farm One.")).toBeTruthy();
  });
});
