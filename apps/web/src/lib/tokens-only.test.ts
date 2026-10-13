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

// WCAG 1.4.11: a control's boundary (inputs, selects, checkbox/radio option rows) needs 3:1 against
// its background. --ko-border is a decorative divider and falls short in the light theme;
// --ko-control-border is the token that holds in both themes.
const CONTROL_SELECTOR = /(?:^|[\s,>+~(])(?:input|select|textarea)\b|\.[\w-]*-(?:choice|choices|check|switch|radio|option|select|input|field)\b/;

/** Rules as [selector, body], flattening one level of @media/@supports nesting. */
function cssRules(css: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/([^{}]+)\{((?:[^{}]*\{[^{}]*\})+[^{}]*|[^{}]*)\}/g)) {
    const sel = m[1]!.trim();
    if (sel.startsWith("@")) out.push(...cssRules(m[2]!));
    else out.push([sel, m[2]!]);
  }
  return out;
}

describe("control boundaries", () => {
  it("parses nested rules", () => {
    expect(cssRules("a{color:red}@media (x){.b-input{border:1px solid var(--ko-border)}}")).toEqual([
      ["a", "color:red"],
      [".b-input", "border:1px solid var(--ko-border)"],
    ]);
    expect(CONTROL_SELECTOR.test(".me-choice")).toBe(true);
    expect(CONTROL_SELECTOR.test(".fm-field input")).toBe(true);
    expect(CONTROL_SELECTOR.test(".fm-card")).toBe(false);
  });

  it("use --ko-control-border, never --ko-border", () => {
    const offenders: string[] = [];
    for (const f of files(SRC)) {
      const text = readFileSync(f, "utf8");
      const styles = f.endsWith(".css") ? [text] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]!);
      for (const css of styles) {
        for (const [sel, body] of cssRules(css)) {
          if (!CONTROL_SELECTOR.test(sel)) continue;
          if (/border(?:-color)?\s*:[^;]*var\(--ko-border\)/.test(body)) offenders.push(`${f.slice(SRC.length)}: ${sel}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
