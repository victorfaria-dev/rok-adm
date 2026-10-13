// @vitest-environment happy-dom
import { FARM_DAILY_TASKS } from "@rokadm/planner";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FARMS_KEY, MAX_FARMS, emptyLevels, readFarms, type Farm } from "../../../lib/farms-store";
import FarmHub from "./FarmHub";

let current = new Date(2026, 9, 13, 10, 0);
const clock = (): Date => current;

function farm(id: string, name: string, extra: Partial<Farm> = {}): Farm {
  return { id, name, role: "general", note: "", levels: emptyLevels(), gatheringUntil: null, daily: null, goal: null, createdAt: new Date(0).toISOString(), ...extra };
}
function seed(farms: Farm[], shipments: unknown[] = []): void {
  localStorage.setItem(FARMS_KEY, JSON.stringify({ v: 1, farms, shipments, showHypotheses: false }));
}
const setup = () => render(h(FarmHub, { clock }));
const input = (label: string | RegExp) => screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => {
  localStorage.clear();
  current = new Date(2026, 9, 13, 10, 0);
});
afterEach(cleanup);

describe("FarmHub: empty state and adding", () => {
  it("shows the empty state with links, then adds a farm", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Track your farm accounts" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Which farm should I build?" }).getAttribute("href")).toBe("/farms/choose/");
    fireEvent.click(screen.getByRole("button", { name: "Add a farm" }));
    expect(document.activeElement).toBe(input("Name"));
    fireEvent.input(input("Name"), { target: { value: "Farm Food" } });
    fireEvent.click(screen.getByRole("radio", { name: "Food" }));
    fireEvent.input(input("Trading Post"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Add farm" }));
    const stored = readFarms().farms;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ name: "Farm Food", role: "food", levels: { tradingPost: 5, cityHall: null } });
    const heading = screen.getByRole("heading", { level: 3, name: "Farm Food" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole("link", { name: /Build path/ }).getAttribute("href")).toBe(`/farms/build/?farm=${stored[0]!.id}`);
    expect(screen.getByRole("link", { name: /Trading Post calculator/ }).getAttribute("href")).toBe(`/farms/trading-post/?farm=${stored[0]!.id}`);
    expect(screen.getByRole("status").textContent).toBe("Farm Food added.");
  });

  it("validation: empty name and out-of-range level show errors tied by aria-describedby", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add a farm" }));
    fireEvent.input(input("City Hall"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Add farm" }));
    expect(screen.getByRole("alert").textContent).toBe("Fix 2 fields below.");
    const name = input("Name");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const nameErr = screen.getByText("Give the farm a name.");
    expect(name.getAttribute("aria-describedby")).toContain(nameErr.id);
    expect(document.activeElement).toBe(name);
    const ch = input("City Hall");
    const chErr = screen.getByText(/City Hall: enter a whole number from 1 to 25/);
    expect(ch.getAttribute("aria-describedby")).toContain(chErr.id);
    expect(readFarms().farms).toHaveLength(0);
  });

  it("shows the limit message at 10 farms", () => {
    seed(Array.from({ length: MAX_FARMS }, (_, i) => farm(`f${i}`, `Farm ${i}`)));
    setup();
    expect(screen.queryByRole("button", { name: "Add a farm" })).toBeNull();
    expect(screen.getByText(/You track 10 farms, the limit/)).toBeTruthy();
  });

  it("delete asks inline, then removes the farm and its shipments", () => {
    seed([farm("a", "Alpha"), farm("b", "Beta")], [{ id: "s1", farmId: "a", date: "2026-10-13", resource: "food", gross: 100, taxRate: 0.2, net: 80 }]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete Alpha" }));
    const group = screen.getByRole("group", { name: "Delete Alpha and its shipments?" });
    fireEvent.click(within(group).getByRole("button", { name: "No, keep it" }));
    expect(readFarms().farms).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Delete Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    const s = readFarms();
    expect(s.farms.map((f) => f.name)).toEqual(["Beta"]);
    expect(s.shipments).toHaveLength(0);
    expect(document.activeElement?.id).toBe("fh-list-h");
  });
});

describe("FarmHub: gathering and checklist", () => {
  it("Visit next: idle first, then soonest return", () => {
    const at = (min: number) => new Date(current.getTime() + min * 60000).toISOString();
    seed([farm("a", "Alpha", { gatheringUntil: at(200) }), farm("b", "Beta", { gatheringUntil: at(80) }), farm("c", "Gamma"), farm("d", "Delta", { gatheringUntil: at(-5) })]);
    setup();
    const list = screen.getByRole("heading", { name: "Visit next" }).parentElement!.querySelector("ol")!;
    const items = [...list.querySelectorAll("li")].map((li) => li.textContent ?? "");
    expect(items.map((t) => t.split(/idle|marches|back/)[0])).toEqual(["Gamma", "Delta", "Beta", "Alpha"]);
    expect(items[2]).toContain("back in 1 h 20 min");
    expect(items[3]).toContain("back in 3 h 20 min");
  });

  it("+2 h sets gatheringUntil from now; Clear removes it", () => {
    seed([farm("a", "Alpha")]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "+2 h" }));
    expect(Date.parse(readFarms().farms[0]!.gatheringUntil!) - current.getTime()).toBe(2 * 3_600_000);
    expect(screen.getByText(/Gathering: back in 2 h/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(readFarms().farms[0]!.gatheringUntil).toBeNull();
  });

  it("checklist ticks persist today and reset the next day", () => {
    seed([farm("a", "Alpha")]);
    const first = FARM_DAILY_TASKS[0]!;
    const { unmount } = setup();
    const box = screen.getByRole("checkbox", { name: first.label }) as HTMLInputElement;
    fireEvent.click(box);
    expect(readFarms().farms[0]!.daily).toEqual({ date: "2026-10-13", done: [first.id] });
    expect((screen.getByRole("checkbox", { name: first.label }) as HTMLInputElement).checked).toBe(true);
    unmount();

    current = new Date(2026, 9, 13, 23, 0);
    const again = setup();
    expect((screen.getByRole("checkbox", { name: first.label }) as HTMLInputElement).checked).toBe(true);
    again.unmount();

    current = new Date(2026, 9, 14, 0, 5);
    setup();
    expect((screen.getByRole("checkbox", { name: first.label }) as HTMLInputElement).checked).toBe(false);
    // Optional tasks are marked; the pending-minutes note appears once.
    expect(screen.getAllByText("Optional").length).toBe(FARM_DAILY_TASKS.filter((t) => t.optional).length);
    expect(screen.getAllByText(/L-A13-01\), so the checklist shows no times/)).toHaveLength(1);
  });

  it("daily goal shows progress from today's net shipments", () => {
    seed([farm("a", "Alpha", { goal: { resource: "food", amount: 400000 } })], [
      { id: "s1", farmId: "a", date: "2026-10-13", resource: "food", gross: 125000, taxRate: 0.2, net: 100000 },
      { id: "s2", farmId: "a", date: "2026-10-12", resource: "food", gross: 125000, taxRate: 0.2, net: 100000 },
    ]);
    setup();
    expect(screen.getByText(/received today/).textContent).toContain("100,000 of 400,000 food received today (25%), 300,000 to go.");
    expect((document.querySelector("progress") as HTMLProgressElement).getAttribute("value")).toBe("25");
  });

  it("goal validation and save", () => {
    seed([farm("a", "Alpha")]);
    setup();
    fireEvent.input(input("Amount received"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Save goal/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/above 0, e.g. 500000, 500k or 1.5m/);
    fireEvent.change(screen.getByLabelText("Resource"), { target: { value: "wood" } });
    fireEvent.input(input("Amount received"), { target: { value: "1,000,000" } });
    fireEvent.click(screen.getByRole("button", { name: /Save goal/ }));
    expect(readFarms().farms[0]!.goal).toEqual({ resource: "wood", amount: 1_000_000 });
  });
});
