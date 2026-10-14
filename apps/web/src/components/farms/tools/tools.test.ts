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
    expect(input("Prefeitura da principal").value).toBe("14");
    expect(input("Minutos por dia").value).toBe("120");
    expect((screen.getByLabelText("Perfil de gasto") as HTMLSelectElement).value).toBe("medium");
    expect(screen.getByText(/Preenchido a partir do seu perfil/)).toBeTruthy();
    // CH14 → gold + stone band; medium spender → gold farm "Possible".
    expect(summary()).toContain("ouro e pedra");
    expect(document.querySelector('[data-variant="gold"] [data-status]')!.textContent).toBe("Possível");
  });

  it("without a profile: no prefill note, bottleneck asks for City Hall, statuses as text", () => {
    render(h(FarmChooser, {}));
    expect(screen.queryByText(/Preenchido a partir do seu perfil/)).toBeNull();
    expect(screen.getByText(/Informe a Prefeitura da sua principal/)).toBeTruthy();
    expect(document.querySelector('[data-variant="general"] [data-status]')!.textContent).toBe("Recomendado");
    expect(document.querySelector('[data-variant="gold"] [data-status]')!.textContent).toBe("Não recomendado para você");
    expect(screen.getByRole("link", { name: "Adicionar esta conta farm a Minhas contas farm" }).getAttribute("href")).toBe("/farms/");
    expect(screen.getByRole("link", { name: "Guia de farm de ouro" }).getAttribute("href")).toBe("/guides/farms/gold/");
  });

  it("recalculates live: wanting more than one farm with a lot of time suggests 2", () => {
    render(h(FarmChooser, {}));
    type("Minutos por dia", "120");
    fireEvent.click(screen.getByLabelText("Quero mais de uma conta farm"));
    expect(document.querySelector("[data-count]")!.textContent).toBe("2");
    type("Minutos por dia", "5");
    expect(document.querySelector("[data-count]")!.textContent).toBe("0");
  });

  it("an invalid City Hall shows an inline error wired to the field, never NaN", () => {
    render(h(FarmChooser, {}));
    type("Prefeitura da principal", "30");
    const err = screen.getByText("30 está fora do intervalo. Digite um número de 1 a 25.");
    expect(input("Prefeitura da principal").getAttribute("aria-invalid")).toBe("true");
    expect(input("Prefeitura da principal").getAttribute("aria-describedby")).toContain(err.id);
    expect(summary()).toBe("Corrija os campos destacados para atualizar o conselho.");
    expect(document.body.textContent).not.toContain("NaN");
  });

  it("the food + wood pair appears only with Show hypotheses, and the choice is saved", () => {
    render(h(FarmChooser, {}));
    expect(document.querySelector('[data-variant="pair-food-wood"]')).toBeNull();
    fireEvent.click(screen.getByLabelText("Mostrar hipóteses"));
    const pair = document.querySelector('[data-variant="pair-food-wood"]')!;
    expect(pair.textContent).toContain(PAIR_SENTENCE);
    expect(pair.textContent).toContain("Hipótese, sem fonte");
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
    expect((screen.getByLabelText("Conta farm") as HTMLSelectElement).value).toBe("farm-1");
    expect(input("Prefeitura").value).toBe("17");
    expect(input("Entreposto Comercial").value).toBe("15");
    expect((screen.getByLabelText(/^Foco/) as HTMLSelectElement).value).toBe("food");
    // Goldmine 12 < 15 is the first step to do.
    expect(summary()).toContain("Próximo passo: Goldmine at the same level");
    expect(document.querySelector('[data-step="ch11"] [data-step-status]')!.textContent).toContain("Concluído");
    expect(document.querySelector('[data-step="goldmine"] [data-step-status]')!.textContent).toContain("A fazer");
    expect(document.querySelector('[data-step="academy-foodwood-15"] [data-step-status]')!.textContent).toContain("Informe seu nível para conferir");
    expect(document.querySelector('[data-step="civ"] [data-step-status]')!.textContent).toContain("Info");
    // Food focus drops the stone/gold Academy steps.
    expect(document.querySelector('[data-step="academy-stonegold-15"]')).toBeNull();
  });

  it("edits save back to the farm only with the explicit button", () => {
    seedFarms([farm()]);
    window.history.replaceState(null, "", "/farms/build/?farm=farm-1");
    render(h(BuildPathTool, {}));
    type("Mina de Ouro", "15");
    expect(readFarms().farms[0]!.levels.goldmine).toBe(12);
    fireEvent.click(screen.getByRole("button", { name: "Salvar níveis em Farm One" }));
    expect(readFarms().farms[0]!.levels.goldmine).toBe(15);
    expect(screen.getByRole("status").textContent).toBe("Salvo em Farm One.");
  });

  it("unknown ?farm= falls back to entering levels by hand", () => {
    window.history.replaceState(null, "", "/farms/build/?farm=nope");
    render(h(BuildPathTool, {}));
    expect(screen.getByText(/não está salva neste navegador/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Salvar níveis/ })).toBeNull();
    expect(summary()).toContain("Informe seus níveis para achar o próximo passo");
  });
});

describe("TradingPostCalc", () => {
  it("net 1,000,000 at Trading Post 15 → send 1,265,823, tax 265,823 at 21% from the table", () => {
    render(h(TradingPostCalc, {}));
    type(/Quantidade que a sua principal precisa/, "1,000,000");
    type("Nível do Entreposto Comercial da conta farm", "15");
    expect(summary()).toContain("Envie 1.265.823 comida para a sua principal receber 1.000.000.");
    const tax = document.querySelector('[data-row="tax"] dd')!.textContent;
    expect(tax).toBe("265.823 (21%, da tabela)");
    expect(document.querySelector('[data-row="capacity"] dd')!.textContent).toContain("da tabela");
    expect(document.querySelector('[data-warning="capacity_counts_gross"]')!.textContent).toContain("Hipótese, sem fonte");
    expect(document.querySelector('[data-warning="capacity_contested"]')).not.toBeNull();
  });

  it("accepts 1.5m / 300k, tax override wins, stock and protection give the shortfall", () => {
    render(h(TradingPostCalc, {}));
    type(/Quantidade que a sua principal precisa/, "1m");
    type("Taxa de imposto que você vê no jogo (%)", "20");
    type("Capacidade por viagem que você vê no jogo", "500k");
    type(/Estoque de/, "1.5m");
    type(/Proteção do Depósito/, "300k");
    type("Filas de marcha livres na conta farm", "2");
    expect(document.querySelector('[data-row="gross"] dd')!.textContent).toBe("1.250.000 comida");
    expect(document.querySelector('[data-row="tax"] dd')!.textContent).toBe("250.000 (20%, seu valor)");
    expect(document.querySelector('[data-row="capacity"] dd')!.textContent).toBe("500.000 (seu valor)");
    expect(document.querySelector('[data-row="trips"] dd')!.textContent).toBe("3");
    expect(document.querySelector('[data-row="rounds"] dd')!.textContent).toBe("2");
    expect(document.querySelector('[data-row="shippable"] dd')!.textContent).toBe("1.200.000 comida");
    expect(document.querySelector('[data-row="shortfall"] dd')!.textContent).toBe("50.000 comida");
  });

  it("invalid amounts show inline errors and no NaN; unknown tax says what to enter", () => {
    render(h(TradingPostCalc, {}));
    expect(summary()).toBe("Informe a quantidade que a sua principal precisa.");
    type(/Quantidade que a sua principal precisa/, "lots");
    expect(input(/Quantidade que a sua principal precisa/).getAttribute("aria-invalid")).toBe("true");
    expect(summary()).toBe("Corrija os campos destacados para atualizar o resultado.");
    type(/Quantidade que a sua principal precisa/, "300k");
    expect(summary()).toBe("Informe o nível do Entreposto Comercial da conta farm ou a taxa de imposto que você vê no jogo.");
    expect(document.querySelector('[data-row="tax"] dd')!.textContent).toContain("desconhecido");
    expect(document.body.textContent).not.toContain("NaN");
  });

  it("?farm=<id> prefills the Trading Post level and resource", () => {
    seedFarms([farm({ role: "stone", levels: { cityHall: 20, tradingPost: 21, goldmine: 21, academy: null, commanderLevel: null } })]);
    window.history.replaceState(null, "", "/farms/trading-post/?farm=farm-1");
    render(h(TradingPostCalc, {}));
    expect(input("Nível do Entreposto Comercial da conta farm").value).toBe("21");
    expect((screen.getByLabelText("Recurso") as HTMLSelectElement).value).toBe("stone");
    expect(screen.getByText("Nível do Entreposto Comercial preenchido a partir de Farm One.")).toBeTruthy();
  });
});
