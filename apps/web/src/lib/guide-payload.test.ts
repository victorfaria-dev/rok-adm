import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import type { GuideBlock } from "@rokadm/core";
import { BLOCK_SETS, buildBudgetPayload, buildGuideData, buildGuidePayload, patchBadge, renderMarkdown, vipByKvk1Text } from "./guide-payload";

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

  it("renders task lists as plain list items, without fake checkboxes", () => {
    for (const src of ["- [ ] one\n- [x] two", "- [ ] one\n\n- [x] two\n"]) {
      const html = renderMarkdown(src);
      expect(html).not.toContain("<input");
      expect(html.match(/<li class="ko-task[^"]*">/g)).toHaveLength(2);
      expect(html).toContain('<li class="ko-task ko-task-done">');
      expect(html).toContain('<span class="visually-hidden">Done: </span>');
    }
  });

  it("names each table region after its block, uniquely across the guide", () => {
    const one = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |", "Daily 15 minutes");
    expect(one).toContain('aria-label="Daily 15 minutes, table (scrolls sideways)"');
    const two = renderMarkdown("| a |\n|---|\n| 1 |\n\ntext\n\n| b |\n|---|\n| 2 |", "X");
    expect(two).toContain('aria-label="X, table 1 (scrolls sideways)"');
    expect(two).toContain('aria-label="X, table 2 (scrolls sideways)"');
    for (const set of Object.keys(BLOCK_SETS)) {
      const html = buildGuidePayload(set).blocks.flatMap((b) => [b.bodyHtml, b.whyHtml, b.uncertain_notes ?? "", b.low_spender_note ?? "", b.split_views ?? ""]).join("");
      const labels = [...html.matchAll(/role="region" aria-label="([^"]*)"/g)].map((m) => m[1]);
      if (set === "f2p") expect(labels.length, set).toBeGreaterThan(0);
      expect(new Set(labels).size, set).toBe(labels.length);
      expect(html, set).not.toContain('type="checkbox"');
    }
  });

  it("VIP by KvK1: one sentence when both routes reach the same level", () => {
    expect(vipByKvk1Text(7, 7)).toMatch(/^VIP 7 either way/);
    expect(vipByKvk1Text(7, 7).match(/VIP \d+/g)).toHaveLength(1);
    expect(vipByKvk1Text(6, 8)).toBe("VIP 6 with the daily chest only, VIP 8 if every guaranteed gem goes to VIP");
    const row = buildBudgetPayload().targets.find((t) => t.label.startsWith("VIP by day"))!;
    const levels = row.value.match(/VIP (\d+)/g)!;
    expect(new Set(levels).size).toBe(levels.length);
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
