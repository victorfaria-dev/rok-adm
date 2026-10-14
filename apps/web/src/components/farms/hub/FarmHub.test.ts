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
    expect(screen.getByRole("heading", { name: "Acompanhe suas contas farm" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Qual farm devo criar?" }).getAttribute("href")).toBe("/farms/choose/");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar uma conta farm" }));
    expect(document.activeElement).toBe(input("Nome"));
    fireEvent.input(input("Nome"), { target: { value: "Farm Food" } });
    fireEvent.click(screen.getByRole("radio", { name: "Comida" }));
    fireEvent.input(input("Entreposto Comercial"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar conta farm" }));
    const stored = readFarms().farms;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ name: "Farm Food", role: "food", levels: { tradingPost: 5, cityHall: null } });
    const heading = screen.getByRole("heading", { level: 3, name: "Farm Food" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole("link", { name: /Caminho de construção/ }).getAttribute("href")).toBe(`/farms/build/?farm=${stored[0]!.id}`);
    expect(screen.getByRole("link", { name: /Calculadora do Entreposto Comercial/ }).getAttribute("href")).toBe(`/farms/trading-post/?farm=${stored[0]!.id}`);
    expect(screen.getByRole("status").textContent).toBe("Farm Food adicionada.");
  });

  it("validation: empty name and out-of-range level show errors tied by aria-describedby", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar uma conta farm" }));
    fireEvent.input(input("Prefeitura"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar conta farm" }));
    expect(screen.getByRole("alert").textContent).toBe("Corrija 2 campos abaixo.");
    const name = input("Nome");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const nameErr = screen.getByText("Dê um nome à conta farm.");
    expect(name.getAttribute("aria-describedby")).toContain(nameErr.id);
    expect(document.activeElement).toBe(name);
    const ch = input("Prefeitura");
    const chErr = screen.getByText(/Prefeitura: digite um número inteiro de 1 a 25/);
    expect(ch.getAttribute("aria-describedby")).toContain(chErr.id);
    expect(readFarms().farms).toHaveLength(0);
  });

  it("shows the limit message at 10 farms", () => {
    seed(Array.from({ length: MAX_FARMS }, (_, i) => farm(`f${i}`, `Farm ${i}`)));
    setup();
    expect(screen.queryByRole("button", { name: "Adicionar uma conta farm" })).toBeNull();
    expect(screen.getByText(/Você acompanha 10 contas farm, o limite/)).toBeTruthy();
  });

  it("delete asks inline, then removes the farm and its shipments", () => {
    seed([farm("a", "Alpha"), farm("b", "Beta")], [{ id: "s1", farmId: "a", date: "2026-10-13", resource: "food", gross: 100, taxRate: 0.2, net: 80 }]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Excluir Alpha" }));
    const group = screen.getByRole("group", { name: "Excluir Alpha e seus envios?" });
    fireEvent.click(within(group).getByRole("button", { name: "Não, manter" }));
    expect(readFarms().farms).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Excluir Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Sim, excluir" }));
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
    const list = screen.getByRole("heading", { name: "Visitar em seguida" }).parentElement!.querySelector("ol")!;
    const items = [...list.querySelectorAll("li")].map((li) => li.textContent ?? "");
    expect(items.map((t) => t.split(/parada|as marchas|volta/)[0])).toEqual(["Gamma", "Delta", "Beta", "Alpha"]);
    expect(items[2]).toContain("volta em 1 h 20 min");
    expect(items[3]).toContain("volta em 3 h 20 min");
  });

  it("+2 h sets gatheringUntil from now; Clear removes it", () => {
    seed([farm("a", "Alpha")]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "+2 h" }));
    expect(Date.parse(readFarms().farms[0]!.gatheringUntil!) - current.getTime()).toBe(2 * 3_600_000);
    expect(screen.getByText(/Coletando: volta em 2 h/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Limpar/ }));
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
    expect(screen.getAllByText("Opcional").length).toBe(FARM_DAILY_TASKS.filter((t) => t.optional).length);
    expect(screen.getAllByText(/L-A13-01\), então a lista não mostra tempos/)).toHaveLength(1);
  });

  it("daily goal shows progress from today's net shipments", () => {
    seed([farm("a", "Alpha", { goal: { resource: "food", amount: 400000 } })], [
      { id: "s1", farmId: "a", date: "2026-10-13", resource: "food", gross: 125000, taxRate: 0.2, net: 100000 },
      { id: "s2", farmId: "a", date: "2026-10-12", resource: "food", gross: 125000, taxRate: 0.2, net: 100000 },
    ]);
    setup();
    expect(screen.getByText(/recebidos hoje/).textContent).toContain("100.000 de 400.000 (comida) recebidos hoje (25%), faltam 300.000.");
    expect((document.querySelector("progress") as HTMLProgressElement).getAttribute("value")).toBe("25");
  });

  it("goal validation and save", () => {
    seed([farm("a", "Alpha")]);
    setup();
    fireEvent.input(input("Quantidade recebida"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar meta/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/acima de 0, por exemplo 500000, 500k ou 1.5m/);
    fireEvent.change(screen.getByLabelText("Recurso"), { target: { value: "wood" } });
    fireEvent.input(input("Quantidade recebida"), { target: { value: "1,000,000" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar meta/ }));
    expect(readFarms().farms[0]!.goal).toEqual({ resource: "wood", amount: 1_000_000 });
  });
});
