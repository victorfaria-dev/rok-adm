// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultProfile, encodeProfile, type KingdomStage } from "@rokadm/core";
import { buildPickerRoster } from "../../lib/commander-roster";
import { STORE_KEY, readStore } from "../../lib/store";
import Commanders from "./Commanders";

const roster = buildPickerRoster();

function setup(opts: { hash?: string; commanders?: unknown; stage?: KingdomStage } = {}) {
  if (opts.commanders !== undefined || opts.stage) {
    const profileCode = opts.stage ? encodeProfile({ ...defaultProfile(), kingdomStage: opts.stage }) : null;
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", commanders: opts.commanders ?? {}, profileCode }));
  }
  history.replaceState(null, "", `/commanders/${opts.hash ?? ""}`);
  render(h(Commanders, { roster }));
}

const verdictText = (): string => document.querySelector(".cmd-verdict-word")?.textContent ?? "";
const verdictWord = (): string => verdictText().replace(/^Verdict for [^:]+: /, "");
const group = (text: RegExp): HTMLElement => screen.getByRole("group", { name: text });

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("commanders island", () => {
  it("starts with nothing picked and explains what to do", () => {
    setup();
    expect(document.querySelectorAll('.ckt[aria-pressed="true"]')).toHaveLength(0);
    expect(screen.getByRole("button", { name: /^Sun Tzu, Epic/ })).toBeTruthy();
    expect(screen.getByText(/Pick the commander/)).toBeTruthy();
    expect(screen.getByText(/Nothing saved yet/)).toBeTruthy();
  });

  it("opens the commander from the URL hash with its tag and marked suggestions", () => {
    setup({ hash: "#sun-tzu" });
    expect(screen.getByRole("heading", { level: 2, name: "Sun Tzu" })).toBeTruthy();
    expect(screen.getByText("Useful until KvK1: loses value later")).toBeTruthy();
    expect(screen.getByText(/A06-0501, A06-0509, A14-0001/)).toBeTruthy();
    const purpose = group(/What job will this commander do/);
    expect(within(purpose).getByText("Suggested")).toBeTruthy();
    expect((within(purpose).getByRole("radio", { name: /Open-field fighting/ }) as HTMLInputElement).checked).toBe(true);
    expect(readStore().commanders).toEqual({}); // suggestions are not saved until the player acts
  });

  it("answering changes the verdict, saves the answer and drops the Suggested mark", () => {
    setup({ hash: "#lohar" });
    expect(verdictWord()).toBe("Wait");
    fireEvent.click(within(group(/What are you about to spend/)).getByRole("radio", { name: /Universal legendary/ }));
    expect(verdictWord()).toBe("Avoid");
    expect(readStore().commanders.lohar).toEqual({ sculptureType: "universal_gold" });
    fireEvent.click(within(group(/What job will this commander do/)).getByRole("radio", { name: /Barbarians/ }));
    expect(within(group(/What job will this commander do/)).queryByText("Suggested")).toBeNull();
    expect(readStore().commanders.lohar).toEqual({ sculptureType: "universal_gold", purpose: "pve_barbarians" });
  });

  it("Keep suggested answers saves every suggestion", () => {
    setup({ hash: "#sun-tzu" });
    fireEvent.click(screen.getByRole("button", { name: "Keep suggested answers" }));
    expect(Object.keys(readStore().commanders["sun-tzu"] ?? {})).toHaveLength(5);
    expect(screen.queryByText("Suggested")).toBeNull();
  });

  it("lists saved checks; clear removes them and Undo restores", () => {
    setup({ commanders: { lohar: { sculptureType: "universal_gold" } } });
    const row = screen.getByRole("link", { name: "Lohar" }).closest("li")!;
    expect(row.textContent).toContain("Avoid");
    fireEvent.click(within(row).getByRole("button", { name: "Clear answers for Lohar" }));
    expect(readStore().commanders).toEqual({});
    expect(screen.queryByRole("link", { name: "Lohar" })).toBeNull();
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(document.activeElement).toBe(undo);
    fireEvent.click(undo);
    expect(readStore().commanders).toEqual({ lohar: { sculptureType: "universal_gold" } });
    expect(screen.getByRole("link", { name: "Lohar" })).toBeTruthy();
  });

  it("survives corrupted stored answers", () => {
    setup({ hash: "#sun-tzu", commanders: { "sun-tzu": { purpose: "bogus", nope: 3 }, ghost: "x" } });
    expect(screen.getByRole("heading", { level: 2, name: "Sun Tzu" })).toBeTruthy();
    expect(["Go", "Wait", "Avoid"]).toContain(verdictWord());
    expect(screen.getByText(/Nothing saved yet/)).toBeTruthy();
  });

  it("Another commander has nothing prefilled and lists the questions to answer", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Another commander/ }));
    expect(location.hash).toBe("#other");
    expect(screen.getByText(/not in our table, so nothing is prefilled/)).toBeTruthy();
    expect(screen.queryByText("Suggested")).toBeNull();
    expect(verdictWord()).toBe("Wait");
    expect(screen.getByRole("heading", { name: "Still to answer" })).toBeTruthy();
    expect(verdictText()).toBe("Verdict for Another commander: Wait");
  });

  it("picking a portrait opens the checklist for that commander", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /^Lohar, Epic/ }));
    expect(location.hash).toBe("#lohar");
    expect(screen.getByRole("heading", { level: 2, name: "Lohar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Lohar, Epic/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("a commander outside the shelf-life table keeps its name and gets no prefill", () => {
    setup({ hash: "#baibars" });
    expect(screen.getByRole("heading", { level: 2, name: "Baibars" })).toBeTruthy();
    expect(screen.getByText(/not in our table, so nothing is prefilled/)).toBeTruthy();
  });

  it("a future commander asks nothing: the tile explains when it arrives and a link shows the period", () => {
    setup({ stage: "pre_kvk" });
    const tile = screen.getByRole("button", { name: /^Guan Yu, Legendary, coming in Season 3/ });
    expect(tile.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(tile);
    expect(screen.getByText("Guan Yu arrives in Season 3 (KvK3). Nothing to decide yet.")).toBeTruthy();
    expect(location.hash).toBe("");
    cleanup();
    setup({ stage: "pre_kvk", hash: "#guan-yu" });
    expect(screen.getByRole("heading", { level: 2, name: "Guan Yu" })).toBeTruthy();
    expect(screen.getByText("This commander arrives in Season 3 (KvK3); nothing to decide yet.")).toBeTruthy();
    expect(screen.queryAllByRole("radio", { name: /Open-field/ })).toHaveLength(0);
    expect(document.querySelector(".cmd-verdict")).toBeNull();
  });

  it("once the kingdom reaches the period the questions come back", () => {
    setup({ stage: "kvk3", hash: "#guan-yu" });
    expect(screen.queryByText(/nothing to decide yet/)).toBeNull();
    expect(document.querySelector(".cmd-verdict")).not.toBeNull();
  });
});
