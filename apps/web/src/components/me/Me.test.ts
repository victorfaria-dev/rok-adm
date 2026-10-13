// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORE_KEY, exportStore, importStore, readStore } from "../../lib/store";
import { DELETED_MESSAGE, IMPORTED_MESSAGE } from "../../lib/me";
import Me from "./Me";

const CODE = "1.0.1.0.12.30.....0";
const RICH = "1.0.0.0.12.30...10000..0";

function setup(stored?: object) {
  if (stored) localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", ...stored }));
  const navigate = vi.fn();
  const download = vi.fn();
  render(h(Me, { navigate, download, now: () => new Date(2026, 9, 13, 12) }));
  return { navigate, download };
}

function fileWith(text: string): File {
  return new File([text], "backup.json", { type: "application/json" });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
afterEach(cleanup);

describe("You island: profile", () => {
  it("one h1; no profile shows the empty state with Build my guide", () => {
    setup();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Build my guide" }).getAttribute("href")).toBe("/start/");
    expect(screen.queryByRole("button", { name: "Edit answers" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Automatic (recommended)" })).toBeNull();
  });

  it("shows the saved answers in words", () => {
    setup({ profileCode: CODE });
    expect(screen.getByText("Farm account")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
    expect(screen.getByText("Before the first KvK")).toBeTruthy();
  });

  it("Edit answers clears the draft before opening the questionnaire", () => {
    const { navigate } = setup({ profileCode: CODE, draft: { step: 2, answers: { spending: "low" } } });
    fireEvent.click(screen.getByRole("button", { name: "Edit answers" }));
    expect(readStore().draft).toBeNull();
    expect(readStore().profileCode).toBe(CODE);
    expect(navigate).toHaveBeenCalledWith("/start/");
  });
});

describe("You island: effective profile (F-72)", () => {
  it("shows declared, lifetime and effective profile with the product rule", () => {
    setup({ profileCode: RICH });
    expect(screen.getByText("High (about $10,000 in total)")).toBeTruthy();
    expect(screen.getByText("High (raised by total spend)")).toBeTruthy();
    expect(screen.getByText("Product rule, not a game fact")).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Automatic (recommended)" }) as HTMLInputElement).checked).toBe(true);
  });

  it("a manual pick is saved and Automatic clears it", () => {
    setup({ profileCode: RICH });
    fireEvent.click(screen.getByRole("radio", { name: /^Whale/ }));
    expect(readStore().profileOverride).toBe("whale");
    expect(screen.getByText("Whale (set by hand)")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Automatic (recommended)" }));
    expect(readStore().profileOverride).toBeNull();
  });
});

describe("You island: theme", () => {
  it("applies, saves and syncs the header pickers", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<details data-theme-picker id="hp"><input type="radio" name="theme-top" value="dark" checked><input type="radio" name="theme-top" value="light"></details>`,
    );
    setup();
    fireEvent.click(screen.getByRole("radio", { name: "Light" }));
    expect(readStore().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect((document.querySelector("#hp input[value=light]") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "System" }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    document.getElementById("hp")!.remove();
  });
});

describe("You island: export and import", () => {
  it("exports the whole store under a dated file name", () => {
    const { download } = setup({ profileCode: CODE, theme: "light" });
    fireEvent.click(screen.getByRole("button", { name: "Export profile file" }));
    expect(download).toHaveBeenCalledTimes(1);
    const [name, text] = download.mock.calls[0]!;
    expect(name).toBe("kingdomops-2026-10-13.json");
    expect(importStore(text)).toMatchObject({ profileCode: CODE, theme: "light" });
    expect(screen.getByText(/Exported kingdomops-2026-10-13\.json/)).toBeTruthy();
  });

  it("a valid file replaces the state and applies its theme", async () => {
    setup({ profileCode: CODE, profileOverride: "low", commanders: { a: { q: "x" } } });
    const backup = exportStore({ ...readStore(), profileCode: RICH, profileOverride: null, theme: "light", commanders: {} });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [fileWith(backup)], configurable: true });
    fireEvent.change(input);
    await waitFor(() => expect(screen.getByText(IMPORTED_MESSAGE)).toBeTruthy());
    expect(readStore()).toMatchObject({ profileCode: RICH, profileOverride: null, theme: "light", commanders: {} });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByText("High (raised by total spend)")).toBeTruthy();
  });

  it("an invalid file shows the error and changes nothing", async () => {
    setup({ profileCode: CODE });
    const before = localStorage.getItem(STORE_KEY);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [fileWith("{\"hello\":1}")], configurable: true });
    fireEvent.change(input);
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert.textContent).toMatch(/not a KingdomOps export/));
    expect(localStorage.getItem(STORE_KEY)).toBe(before);
  });
});

describe("You island: delete", () => {
  it("asks in the page; Escape cancels and focus returns", () => {
    setup({ profileCode: CODE });
    const trigger = screen.getByRole("button", { name: "Delete all data" });
    fireEvent.click(trigger);
    const heading = screen.getByRole("heading", { name: "Delete everything?" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(/cannot be undone/)).toBeTruthy();
    fireEvent.keyDown(heading, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Delete everything" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete all data" }));
    expect(readStore().profileCode).toBe(CODE);
  });

  it("Cancel keeps the data", () => {
    setup({ profileCode: CODE });
    fireEvent.click(screen.getByRole("button", { name: "Delete all data" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem(STORE_KEY)).not.toBeNull();
  });

  it("confirm clears the store, resets to dark and shows the empty state", () => {
    setup({ profileCode: CODE, theme: "light" });
    document.documentElement.setAttribute("data-theme", "light");
    fireEvent.click(screen.getByRole("button", { name: "Delete all data" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete everything" }));
    expect(localStorage.getItem(STORE_KEY)).toBeNull();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByText(DELETED_MESSAGE)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Build my guide" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(true);
  });
});
