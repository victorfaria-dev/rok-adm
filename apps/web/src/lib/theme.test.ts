import { describe, expect, it } from "vitest";
import { defaultStore, STORE_KEY } from "./store";
import { THEME_BOOT_SCRIPT, themeAttribute } from "./theme";

/** Run the inline boot script against a fake document + storage and return the data-theme it set. */
function boot(stored: string | null): string | null {
  let attr: string | null = null;
  const document = { documentElement: { setAttribute: (_: string, v: string) => { attr = v; } } };
  const localStorage = { getItem: (k: string) => (k === STORE_KEY ? stored : null) };
  new Function("document", "localStorage", THEME_BOOT_SCRIPT)(document, localStorage);
  return attr;
}

describe("theme", () => {
  it("maps preferences to the html attribute", () => {
    expect(themeAttribute("dark")).toBe("dark");
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("system")).toBeNull();
  });

  it("boot script matches themeAttribute for every stored preference", () => {
    for (const theme of ["dark", "light", "system"] as const) {
      expect(boot(JSON.stringify({ ...defaultStore(), theme }))).toBe(themeAttribute(theme));
    }
  });

  it("boot script defaults to dark on first visit and on bad data", () => {
    expect(boot(null)).toBe("dark");
    expect(boot("{broken")).toBe("dark");
    expect(boot(JSON.stringify({ v: 1, theme: "neon" }))).toBe("dark");
  });
});
