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
  it("one h1 (Me); no profile shows the empty state with Start", () => {
    setup();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Start" }).getAttribute("href")).toBe("/start/");
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

describe("Me island: playing as, details, share card (UX stage 1)", () => {
  it("the role switch saves the choice and swaps the tabs at once", () => {
    setup({ profileCode: CODE });
    expect((screen.getByRole("radio", { name: "Player" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Leader" }));
    expect(readStore().playingAs).toBe("leader");
    expect(document.documentElement.getAttribute("data-role")).toBe("leader");
    fireEvent.click(screen.getByRole("radio", { name: "Player" }));
    expect(readStore().playingAs).toBe("player");
  });

  it("shows only the 5 onboarding answers above; optional details are edited below", () => {
    setup({ profileCode: CODE });
    expect(screen.getByText("How much do you spend on Rise of Kingdoms per month?")).toBeTruthy();
    const kd = screen.getByLabelText("How many days old is your kingdom?") as HTMLInputElement;
    expect(kd.value).toBe("");
    fireEvent.input(kd, { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText("Which civilization do you play?"), { target: { value: "china" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));
    expect(screen.getByText("Saved.")).toBeTruthy();
    const saved = readStore().profileCode!;
    expect(saved).toBe("1.0.1.0.12.30..45..china.0");
  });

  it("a detail that breaks a core rule shows a how-to-fix error and saves nothing", () => {
    setup({ profileCode: "1.0.0.1.12.30.....0" }); // KvK 1
    fireEvent.input(screen.getByLabelText("How many days old is your kingdom?"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));
    expect(screen.getByText(/cannot be past pre-KvK/)).toBeTruthy();
    expect(readStore().profileCode).toBe("1.0.0.1.12.30.....0");
  });

  it("the hub rows: Guides near the top, Share card, then settings and trust rows", () => {
    setup();
    expect(screen.getByRole("link", { name: "Guides" }).getAttribute("href")).toBe("/guides/");
    expect(screen.getByRole("link", { name: "Share card" }).getAttribute("href")).toBe("/card/");
    expect(screen.getByRole("link", { name: "Trust & privacy" }).getAttribute("href")).toBe("/trust/");
    const groups = [...document.querySelectorAll(".me-group")].map((g) => g.getAttribute("aria-label"));
    expect(groups).toEqual(["You and your accounts", "Settings", "Trust and about"]);
    expect(document.querySelector(".me-group a")?.getAttribute("href")).toBe("/guides/");
  });

  it("the header shows the active account's initials, name and role line", () => {
    setup({ profileCode: CODE, savedProfiles: [{ id: "f1", name: "Farm One", code: CODE, override: null }], activeAccountId: "f1" });
    expect(document.querySelector(".me-avatar")?.textContent).toBe("FO");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Farm One");
    expect(document.querySelector(".me-hero-line")?.textContent).toBe("Player · F2P · CH 12");
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

  it("says how many saved accounts were skipped for a damaged code (Q2 P2-5)", async () => {
    setup({ profileCode: CODE });
    const file = JSON.stringify({
      app: "kingdomops", v: 1, theme: "dark", profileCode: CODE,
      savedProfiles: [{ id: "a", name: "Main", code: CODE, override: null }, { id: "b", name: "Bad", code: "zzz", override: null }],
    });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [fileWith(file)], configurable: true });
    fireEvent.change(input);
    await waitFor(() => expect(screen.getByText(/1 saved account in the file had a damaged profile code and was skipped/)).toBeTruthy());
    expect(readStore().savedProfiles.map((p) => p.name)).toEqual(["Main"]);
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
    expect(screen.getByRole("link", { name: "Start" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(true);
  });
});
