import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { defaultProfile, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { lowSpenderTargets } from "@rokadm/planner";
import { BLOCK_SETS, buildBudgetPayload, buildGuideData, buildLowBudgetPayload, buildGuidePayload, patchBadge, renderMarkdown, vipByKvk1Text } from "./guide-payload";

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });
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
      expect(html).toContain('<span class="visually-hidden">Feito: </span>');
    }
  });

  it("names each table region after its block, uniquely across the guide", () => {
    const one = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |", "Daily 15 minutes");
    expect(one).toContain('aria-label="Daily 15 minutes, tabela (rola para os lados)"');
    const two = renderMarkdown("| a |\n|---|\n| 1 |\n\ntext\n\n| b |\n|---|\n| 2 |", "X");
    expect(two).toContain('aria-label="X, tabela 1 (rola para os lados)"');
    expect(two).toContain('aria-label="X, tabela 2 (rola para os lados)"');
    for (const set of Object.keys(BLOCK_SETS)) {
      const html = buildGuidePayload(set).blocks.flatMap((b) => [b.bodyHtml, b.whyHtml, b.uncertain_notes ?? "", b.low_spender_note ?? "", b.split_views ?? ""]).join("");
      const labels = [...html.matchAll(/role="region" aria-label="([^"]*)"/g)].map((m) => m[1]);
      if (set === "f2p") expect(labels.length, set).toBeGreaterThan(0);
      expect(new Set(labels).size, set).toBe(labels.length);
      expect(html, set).not.toContain('type="checkbox"');
    }
  });

  it("VIP by KvK1: one sentence when both routes reach the same level", () => {
    expect(vipByKvk1Text(7, 7)).toMatch(/^VIP 7 de qualquer jeito/);
    expect(vipByKvk1Text(7, 7).match(/VIP \d+/g)).toHaveLength(1);
    expect(vipByKvk1Text(6, 8)).toBe("VIP 6 só com o baú diário, VIP 8 se todas as gemas garantidas forem para o VIP");
    const row = buildBudgetPayload().targets.find((t) => t.label.startsWith("VIP até o dia"))!;
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

describe("Low spender targets payload (wave J)", () => {
  const low = buildLowBudgetPayload();
  const text = JSON.stringify(low);
  const t = lowSpenderTargets(make({ spending: "low" }));

  it("is its own lean file: ≤ 15 KB gzip, no fact-dataset markers", () => {
    expect(gzipSync(text).length).toBeLessThanOrEqual(15 * 1024);
    for (const marker of ["invalidatedBy", "accessedAt"]) expect(text).not.toContain(marker);
  });

  it("carries the planner's pass-only and low-full tiers with the same numbers", () => {
    expect(low.tiers.map((x) => x.id)).toEqual(["pass-only", "low-full"]);
    for (const tier of t.tiers) {
      const row = low.tiers.find((x) => x.id === tier.id)!;
      expect(row.monthlyUsd.value).toBe(tier.monthlyUsd.value);
      expect(row.monthlyGems.value).toBe(tier.monthlyGems.value);
      expect(row.oneTimeUsd.value).toBe(tier.oneTimeUsd.value);
      expect(row.lines.map((l) => l.purchaseId)).toEqual(tier.lines.map((l) => l.purchase.id));
    }
  });

  it("every purchase row has a price, confidence and fact ids; ratios cite the A12-0618 method", () => {
    expect(low.priceWarning).toMatch(/região/);
    for (const p of low.purchases) {
      expect(p.priceUsd.value, p.id).toBeGreaterThan(0);
      expect(p.facts.length, p.id).toBeGreaterThan(0);
      expect(["high", "medium", "low", "pending"]).toContain(p.confidence);
      for (const r of [p.gemsPerUsd, p.vipPerUsd]) if (r) expect(r.facts, p.id).toContain("A12-0618");
    }
    expect(low.purchases.find((p) => p.id === "gem-supply-30d")!.gemsPerUsd!.value).toBe(1952);
    expect(low.valueMethod.facts).toContain("A12-0618");
  });

  it("lists the daily-offers ceiling apart from the tiers, and a VIP timeline with the supply", () => {
    expect(low.outsideTiers).toContain("daily-special-offers");
    for (const tier of low.tiers) expect(tier.lines.map((l) => l.purchaseId)).not.toContain("daily-special-offers");
    expect(low.vip.rows.length).toBeGreaterThan(10);
    expect(low.vip.facts).toContain("A12-0601");
  });

  it("does not change the F2P reality check: Low is still not a researched profile there", () => {
    expect(buildBudgetPayload().researched).toEqual(["f2p"]);
    expect(text).not.toContain("byDay");
  });
});
