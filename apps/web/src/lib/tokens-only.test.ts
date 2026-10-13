import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Plan §4, screen 1 criterion 8: styles use --ko-* tokens only, never literal hex colors.
const SRC = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(astro|css|tsx)$/.test(f) ? [p] : [];
  });
}

describe("styles", () => {
  it("contain no hex colors outside design/tokens", () => {
    const offenders: string[] = [];
    for (const f of files(SRC)) {
      const text = readFileSync(f, "utf8");
      const styles = f.endsWith(".css") ? [text] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]!);
      const inline = [...text.matchAll(/style="([^"]*)"/g)].map((m) => m[1]!);
      for (const css of [...styles, ...inline]) {
        for (const hex of css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) offenders.push(`${f.slice(SRC.length)}: ${hex}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("only use smooth scrolling under prefers-reduced-motion: no-preference", () => {
    const offenders: string[] = [];
    for (const f of files(SRC)) {
      const text = readFileSync(f, "utf8");
      // Drop every no-preference block (one level of nesting), then nothing smooth may remain.
      const rest = text.replace(/@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
      if (/scroll-behavior:\s*smooth/.test(rest)) offenders.push(f.slice(SRC.length));
    }
    expect(offenders).toEqual([]);
  });
});
