import { describe, expect, it } from "vitest";
import { cleanLine, cleanText, formatCompact, formatInt, parseQuantity } from "../src/kingdom-common";

describe("parseQuantity", () => {
  it.each([
    ["1,500,000", 1_500_000], ["1500000", 1_500_000], ["1 500 000", 1_500_000], ["1.5m", 1_500_000],
    ["300k", 300_000], ["2.4B", 2_400_000_000], ["10.5M", 10_500_000], ["0", 0], [" 42 ", 42],
  ])("%s → %d", (t, v) => expect(parseQuantity(t)).toBe(v));

  it.each(["", "abc", "-5", "1.5", "1,50,000", "1e6", "NaN", "12,34", "1.5x", "99999999999999999999", "999999999999b"])("rejects %j", (t) => {
    expect(parseQuantity(t)).toBeNull();
  });
});

describe("format", () => {
  it("formats integers and compact numbers", () => {
    expect(formatInt(12345678.4)).toBe("12,345,678");
    expect(formatInt(NaN)).toBe("—");
    expect(formatCompact(10_500_000)).toBe("10.5M");
    expect(formatCompact(300_000)).toBe("300K");
    expect(formatCompact(2_350_000_000)).toBe("2.35B");
    expect(formatCompact(150_000_000)).toBe("150M");
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(-1_200_000)).toBe("-1.2M");
  });

  it("cleans text", () => {
    expect(cleanText("  a\r\nb  ", 10)).toBe("a\nb");
    expect(cleanText(5, 10)).toBe("");
    expect(cleanText("abcdef", 3)).toBe("abc");
    expect(cleanLine(" a \n  b ", 10)).toBe("a b");
  });
});

describe("bundle rule", () => {
  it("no kingdom module imports fact data (facts-meta.json carries the dataset marker)", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(__dirname, "../src");
    const files = readdirSync(dir).filter((f) => /^kingdom.*\.ts$/.test(f));
    expect(files.length).toBeGreaterThan(1);
    for (const f of files) {
      const code = readFileSync(join(dir, f), "utf8");
      expect(code, f).not.toMatch(/facts-meta\.json|BUNDLED_FACTS/);
      for (const m of code.matchAll(/^import\s+(?!type\b)[^;]*from\s+["']\.\/facts["']/gm)) expect.fail(`${f} imports values from ./facts: ${m[0]}`);
    }
  });
});
