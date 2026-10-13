import { describe, expect, it } from "vitest";
import { getFact, guideBlocks, manifest } from "../src";

const ID_RE = /\b[ABC]\d{2}-\d{4}\b/g;

describe("guide blocks", () => {
  it("are all loaded", () => {
    expect(guideBlocks.length).toBe(manifest.counts.blocks);
    expect(guideBlocks.length).toBeGreaterThan(0);
  });

  it("every fact id referenced by a block exists", () => {
    const missing: string[] = [];
    for (const b of guideBlocks) {
      const text = [b.body_md, b.why_md, b.uncertain_notes ?? "", b.low_spender_note ?? "", typeof b.split_views === "string" ? b.split_views : ""].join("\n");
      const ids = new Set([...b.cards, ...b.patch_cards, ...(text.match(ID_RE) ?? [])]);
      for (const id of ids) if (!getFact(id)) missing.push(`${b.id}: ${id}`);
    }
    expect(missing).toEqual([]);
  });

  it("patch_cards point to C04 cards", () => {
    for (const b of guideBlocks) for (const id of b.patch_cards) expect(getFact(id)?.domain, `${b.id}: ${id}`).toBe("C04");
  });
});
