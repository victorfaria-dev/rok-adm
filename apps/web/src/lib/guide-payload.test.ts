import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import type { GuideBlock } from "@rokadm/core";
import { BLOCK_SETS, buildBudgetPayload, buildGuideData, buildGuidePayload, patchBadge, renderMarkdown } from "./guide-payload";

const GUIDES = join(__dirname, "../../../../guides/data");
const files = readdirSync(GUIDES).filter((f) => /^blocks\..+\.json$/.test(f) && f !== "blocks.schema.json");

describe("guide payload (build time)", () => {
  it("covers every blocks file in guides/data", () => {
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(Object.keys(BLOCK_SETS)).toContain(f.replace(/^blocks\.|\.json$/g, ""));
  });

  for (const f of files) {
    const set = f.replace(/^blocks\.|\.json$/g, "");
    const raw = JSON.parse(readFileSync(join(GUIDES, f), "utf8")) as GuideBlock[];

    it(`${f}: includes every block id, each with a patch badge and rendered HTML`, () => {
      const p = buildGuidePayload(set);
      expect(p.blocks.map((b) => b.id).sort()).toEqual(raw.map((b) => b.id).sort());
      for (const b of p.blocks) {
        expect(b.patch.version, b.id).toMatch(/^\d+\.\d+\.\d+$/);
        expect(b.patch.asOf, b.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(b.bodyHtml.length, b.id).toBeGreaterThan(0);
        expect(b.body_md, b.id).toBe("");
      }
    });

    it(`${f}: every cited card has a badge with a label`, () => {
      const p = buildGuidePayload(set);
      for (const b of p.blocks) {
        for (const c of [...b.cards, ...b.patch_cards]) {
          expect(p.badges[c], `${b.id} → ${c}`).toBeDefined();
          expect(p.badges[c]!.label.length).toBeGreaterThan(0);
        }
      }
    });
  }

  it("stays lean: blocks + badges ≤ 40 KB gzip, and no fact-dataset fields", () => {
    const { guide, budget } = buildGuideData();
    const text = JSON.stringify(guide);
    expect(gzipSync(text).length).toBeLessThanOrEqual(40 * 1024);
    expect(text).not.toContain("invalidatedBy");
    expect(JSON.stringify(budget)).not.toContain("invalidatedBy");
  });

  it("labels task-list checkboxes", () => {
    const html = renderMarkdown("- [ ] one\n- [x] two");
    expect(html.match(/<input [^>]*type="checkbox"[^>]*>/g)?.every((i) => i.includes("aria-label="))).toBe(true);
  });

  it("parses the patch reference into a version and a note", () => {
    const b = { patch_ref: "1.1.09 (latest official EN notes); 1.1.12 reported live (T3)", as_of: "2026-10-13" } as GuideBlock;
    expect(patchBadge(b)).toEqual({ version: "1.1.09", note: "latest official EN notes; 1.1.12 reported live (T3)", asOf: "2026-10-13" });
    expect(patchBadge({ ...b, patch_ref: null }).version).toBe("unknown");
  });

  it("renders Markdown with scrollable tables and mono fact ids", () => {
    const html = renderMarkdown("See [A04-0001].\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain('<span class="ko-ref">A04-0001</span>');
    expect(html).toMatch(/<div class="ko-table" tabindex="0"[^>]*><table>/);
  });

  it("precomputes the VIP table and a row for every day to KvK1", () => {
    const b = buildBudgetPayload();
    expect(b.vip.rows.length).toBeGreaterThan(10);
    expect(b.byDay).toHaveLength(b.kvk1Day.value);
    expect(b.byDay[0]!.day).toBe(1);
    expect(b.unchanged.length).toBeGreaterThan(0);
    for (const u of b.unchanged) expect(u.text).not.toMatch(/https?:|buy now|\$/i);
    expect(b.researched).toEqual(["f2p"]);
  });
});
