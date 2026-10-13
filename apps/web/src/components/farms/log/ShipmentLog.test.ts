// @vitest-environment happy-dom
import { LEDGER_CSV_HEADER } from "@rokadm/planner";
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FARMS_KEY, emptyLevels, readFarms, type Farm } from "../../../lib/farms-store";
import ShipmentLog from "./ShipmentLog";

const now = new Date(2026, 9, 14, 12, 0); // Wednesday; ISO week Mon 12 Oct – Sun 18 Oct
const clock = (): Date => now;

function farm(id: string, name: string, tp: number | null): Farm {
  return { id, name, role: "food", note: "", levels: { ...emptyLevels(), tradingPost: tp }, gatheringUntil: null, daily: null, goal: null, createdAt: new Date(0).toISOString() };
}
function seed(farms: Farm[], shipments: unknown[] = []): void {
  localStorage.setItem(FARMS_KEY, JSON.stringify({ v: 1, farms, shipments, showHypotheses: false }));
}
const setup = () => render(h(ShipmentLog, { clock }));
const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShipmentLog", () => {
  it("without farms, points to /farms/", () => {
    setup();
    expect(screen.getByRole("link", { name: /Add your farm on My farms/ }).getAttribute("href")).toBe("/farms/");
  });

  it("prefills tax from the farm's Trading Post level and logs gross → net", () => {
    seed([farm("a", "Alpha", 1), farm("b", "Beta", null)]);
    setup();
    expect(field("Date sent").value).toBe("2026-10-14");
    const tax = field("Trading Post tax (%)");
    expect(tax.value).not.toBe("");
    const rate = Number(tax.value) / 100;
    expect(screen.getByText(/From table: Trading Post level 1/)).toBeTruthy();
    fireEvent.input(field("Amount"), { target: { value: "100,000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add shipment" }));
    const s = readFarms().shipments;
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ farmId: "a", date: "2026-10-14", resource: "food", gross: 100000, taxRate: rate });
    expect(s[0]!.net).toBe(Math.floor(100000 * (1 - rate) + 1e-6));
    expect(document.activeElement).toBe(field("Amount"));
    expect(screen.getByRole("status").textContent).toMatch(/^Saved: Alpha sent 100,000 food/);
    expect(screen.getByText(/Total received this week/).textContent).toContain(s[0]!.net.toLocaleString("en-US"));

    // Typing a tax marks it as the user's value; a farm without TP level asks for it.
    fireEvent.input(tax, { target: { value: "10" } });
    expect(screen.getByText("Your value.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Use table value/ }));
    expect(screen.getByText(/From table/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Farm"), { target: { value: "b" } });
    expect(field("Trading Post tax (%)").value).toBe("");
    expect(screen.getByText(/No Trading Post level saved/)).toBeTruthy();
  });

  it("net mode computes gross; validation errors are announced", () => {
    seed([farm("b", "Beta", null)]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add shipment" }));
    expect(screen.getByRole("alert").textContent).toBe("Fix 2 fields below.");
    expect(document.activeElement).toBe(field("Amount"));
    fireEvent.click(screen.getByRole("radio", { name: "Received by the main (net)" }));
    fireEvent.input(field("Amount"), { target: { value: "79" } });
    fireEvent.input(field("Trading Post tax (%)"), { target: { value: "21" } });
    expect(document.querySelector("[data-preview]")!.textContent).toBe("Farm sends 100, tax 21, main receives 79.");
    fireEvent.click(screen.getByRole("button", { name: "Add shipment" }));
    expect(readFarms().shipments[0]).toMatchObject({ gross: 100, net: 79, taxRate: 0.21 });
  });

  it("gold shows the pending warning", () => {
    seed([farm("a", "Alpha", 5)]);
    setup();
    expect(document.querySelector("[data-warning]")).toBeNull();
    fireEvent.change(screen.getByLabelText("Resource"), { target: { value: "gold" } });
    const w = document.querySelector("[data-warning='gold_pending_t0']")!;
    expect(w.textContent).toContain("not yet confirmed in game");
    expect(w.textContent).toContain("A03-0027");
  });

  it("week filter, summary per resource and farm, delete with confirm", () => {
    seed([farm("a", "Alpha", 5), farm("b", "Beta", 5)], [
      { id: "s1", farmId: "a", date: "2026-10-12", resource: "food", gross: 1000, taxRate: 0.2, net: 800 },
      { id: "s2", farmId: "b", date: "2026-10-15", resource: "wood", gross: 500, taxRate: 0.2, net: 400 },
      { id: "s3", farmId: "a", date: "2026-10-05", resource: "food", gross: 100, taxRate: 0.2, net: 80 },
    ]);
    setup();
    const ids = () => [...document.querySelectorAll("[data-shipment]")].map((e) => e.getAttribute("data-shipment"));
    expect(ids()).toEqual(["s2", "s1"]);
    expect(document.querySelector("[data-total-net]")!.textContent).toBe("1,200");
    const byRes = screen.getByRole("table", { name: "By resource" });
    expect(byRes.textContent).toContain("Food1,000200800Wood500100400");
    const byFarm = screen.getByRole("table", { name: "By farm" });
    expect(byFarm.textContent).toContain("Alpha");
    expect(byFarm.textContent).toContain("Beta");

    fireEvent.change(screen.getByLabelText("Show farm"), { target: { value: "a" } });
    expect(ids()).toEqual(["s1"]);
    expect(document.querySelector("[data-total-net]")!.textContent).toBe("800");
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(ids()).toEqual(["s3"]);
    fireEvent.click(screen.getByRole("button", { name: "This week" }));
    expect(ids()).toEqual(["s1"]);

    fireEvent.click(screen.getByRole("button", { name: /^Delete shipment/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(readFarms().shipments.map((e) => e.id)).toEqual(["s2", "s3"]);
    expect(document.activeElement?.id).toBe("fl-list-h");
  });

  it("CSV export downloads the shown entries with header and farm names", async () => {
    seed([farm("a", "Alpha", 5)], [{ id: "s1", farmId: "a", date: "2026-10-13", resource: "food", gross: 1000, taxRate: 0.2, net: 800, note: "=sum" }]);
    let blob: Blob | null = null;
    const create = vi.fn((b: Blob) => { blob = b; return "blob:x"; });
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    let filename = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { filename = this.download; });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Export CSV: shown (1)" }));
    expect(filename).toBe("kingdomops-shipments-2026-10-14.csv");
    const text = await (blob as unknown as Blob).text();
    const lines = text.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe(LEDGER_CSV_HEADER.join(","));
    expect(lines[1]).toBe("2026-10-13,Alpha,food,1000,0.2,800,'=sum");
  });
});
