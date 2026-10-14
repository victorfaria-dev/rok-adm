// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { KingdomProgress } from "@rokadm/planner";
import { buildPickerRoster } from "../../lib/commander-roster";
import { CommanderPicker } from "./CommanderPicker";
import { CommanderTile } from "./CommanderTile";

const roster = buildPickerRoster();
afterEach(cleanup);

const tile = (name: string): HTMLElement => screen.getByRole("button", { name: new RegExp(`^${name},`) });
const tiles = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("button.ckt")];

function single(progress: KingdomProgress | null = null, value: string | null = null) {
  const onChange = vi.fn();
  render(h(CommanderPicker, { roster, progress, value, onChange }));
  return onChange;
}

describe("CommanderPicker", () => {
  it("shows every commander under its period header, with a portrait or initials and the credit", () => {
    single();
    expect(tiles()).toHaveLength(roster.commanders.length);
    expect(screen.getByRole("group", { name: "From kingdom start" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Season 3 (KvK3)" })).toBeTruthy();
    const img = tile("Sun Tzu").querySelector("img")!;
    expect(img.getAttribute("width")).toBe("56");
    expect(img.getAttribute("height")).toBe("56");
    expect(img.getAttribute("alt")).toBe("");
    const noPortrait = roster.commanders.find((c) => !c.portrait)!;
    expect(tile(noPortrait.name).querySelector("img")).toBeNull();
    expect(tile(noPortrait.name).querySelector(".ckt-initials")).not.toBeNull();
    expect(screen.getByText("Portraits: Rise of Kingdoms © Lilith Games. Fan site, not affiliated.")).toBeTruthy();
  });

  it("searches without accents and filters by rarity", () => {
    single();
    fireEvent.input(screen.getByLabelText("Search by name"), { target: { value: "SÚN tz" } });
    expect(tiles().map((t) => t.dataset.id)).toEqual(["sun-tzu"]);
    fireEvent.input(screen.getByLabelText("Search by name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("radio", { name: "Epic" }));
    expect(tiles().every((t) => t.dataset.rarity === "epic")).toBe(true);
    fireEvent.input(screen.getByLabelText("Search by name"), { target: { value: "qqq" } });
    expect(screen.getByText(/No commander matches/)).toBeTruthy();
  });

  it("only offers 'available to me now' when the stage is known", () => {
    single();
    expect(screen.queryByRole("checkbox", { name: /Only what I can get now/ })).toBeNull();
    cleanup();
    single({ stage: "pre_kvk" });
    fireEvent.click(screen.getByRole("checkbox", { name: /Only what I can get now/ }));
    expect(tiles().some((t) => t.hasAttribute("data-future"))).toBe(false);
    expect(screen.queryByRole("group", { name: /Season 3/ })).toBeNull();
  });

  it("single select reports the id; the picked tile is pressed", () => {
    const onChange = single(null, "lohar");
    expect(tile("Lohar").getAttribute("aria-pressed")).toBe("true");
    expect(tile("Sun Tzu").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(tile("Sun Tzu"));
    expect(onChange).toHaveBeenCalledWith("sun-tzu");
  });

  it("future commanders are dimmed, cannot be picked and explain when they arrive", () => {
    const onChange = single({ stage: "pre_kvk" });
    const guan = tile("Guan Yu");
    expect(guan.getAttribute("aria-disabled")).toBe("true");
    expect(guan.textContent).toContain("Season 3");
    expect(screen.getByRole("group", { name: /Season 3 \(KvK3\) Coming later/ })).toBeTruthy();
    fireEvent.click(guan);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Guan Yu arrives in Season 3 (KvK3). Nothing to decide yet.");
  });

  it("multi select toggles ids", () => {
    const onChange = vi.fn();
    render(h(CommanderPicker, { roster, progress: null, mode: "multi", value: ["lohar"], onChange }));
    fireEvent.click(tile("Sun Tzu"));
    expect(onChange).toHaveBeenLastCalledWith(["lohar", "sun-tzu"]);
    fireEvent.click(tile("Lohar"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("keeps one tile in tab order and moves with arrow keys, Home and End", () => {
    single(null, "lohar");
    const tabbable = tiles().filter((t) => t.tabIndex === 0);
    expect(tabbable.map((t) => t.dataset.id)).toEqual(["lohar"]);
    const order = tiles().map((t) => t.dataset.id);
    const i = order.indexOf("lohar");
    tile("Lohar").focus();
    fireEvent.keyDown(tile("Lohar"), { key: "ArrowRight" });
    expect((document.activeElement as HTMLElement).dataset.id).toBe(order[i + 1]);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect((document.activeElement as HTMLElement).dataset.id).toBe("lohar");
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect((document.activeElement as HTMLElement).dataset.id).toBe(order[order.length - 1]);
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect((document.activeElement as HTMLElement).dataset.id).toBe(order[0]);
    expect(tiles().filter((t) => t.tabIndex === 0).map((t) => t.dataset.id)).toEqual([order[0]]);
  });
});

describe("CommanderTile", () => {
  it("renders as a plain figure without onClick", () => {
    render(h(CommanderTile, { commander: roster.commanders[0]! }));
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(roster.commanders[0]!.name)).toBeTruthy();
  });
});
