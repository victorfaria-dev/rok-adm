import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare, toBase64Url } from "../src/kingdom-codec";
import { RULES_TEMPLATES, RULES_TEMPLATE_VERSION, compactRulesShare, expandRulesShare, newCharterDoc, parseRulesDoc } from "../src/kingdom-rules";

const NOW = new Date("2026-10-13T10:00:00.000Z");

describe("compact rules share form (Q2 P2-1)", () => {
  it("template text of the current version is frozen: links made with it must keep expanding the same way", () => {
    // Changing a template? Copy the old text into RULES_TEMPLATE_HISTORY as "key@<old version>",
    // bump RULES_TEMPLATE_VERSION, then update this hash.
    expect(RULES_TEMPLATE_VERSION).toBe(1);
    expect(createHash("sha256").update(JSON.stringify(RULES_TEMPLATES)).digest("hex").slice(0, 16)).toBe("060fb41d24e62a91");
  });

  it("an untouched charter carries only references; round trip is exact", () => {
    const doc = newCharterDoc("c", NOW);
    const c = compactRulesShare(doc);
    expect(JSON.stringify(c)).not.toContain("[kingdom]");
    expect(JSON.stringify(c).length).toBeLessThan(300);
    expect(parseRulesDoc(JSON.parse(JSON.stringify(c)))).toEqual(doc);
  });

  it("an edited character that still decodes is reported as damaged (checksum, Q2 P3)", async () => {
    const doc = newCharterDoc("c", NOW);
    for (const compress of [true, false]) {
      const code = await encodeShare("rules", doc, { compress });
      let damaged = 0, other = 0;
      for (let i = 2; i < code.length - 1; i += 7) {
        const t = code.slice(0, i) + (code[i] === "A" ? "B" : "A") + code.slice(i + 1);
        const r = await decodeShare(t, "rules", parseRulesDoc);
        if (r.ok) other++;
        // A flip inside "rules" makes another kind: refused too, with its own message.
        else if (r.error === "bad_json" || r.error === "bad_encoding" || r.error === "wrong_kind") damaged++;
      }
      expect(other).toBe(0);
      expect(damaged).toBeGreaterThan(10);
    }
    // Links made before the checksum (no "h") still open.
    const legacy = "1j" + toBase64Url(new TextEncoder().encode(JSON.stringify({ k: "rules", d: doc })));
    expect(await decodeShare(legacy, "rules", parseRulesDoc)).toEqual({ ok: true, data: doc });
    // A damaged "h" key would otherwise read as a link without a checksum.
    const renamed = "1j" + toBase64Url(new TextEncoder().encode(JSON.stringify({ k: "rules", d: doc, i: 1 })));
    expect(await decodeShare(renamed, "rules", parseRulesDoc)).toEqual({ ok: false, error: "bad_json" });
  });

  it("rejects bad references and bad line operations", () => {
    expect(expandRulesShare({ c: 2, s: [] })).toBeNull();
    expect(expandRulesShare({ c: 1, s: [{ i: "a", f: "nope@1" }] })).toBeNull();
    expect(expandRulesShare({ c: 1, s: [{ i: "a", f: "kvk@1", b: [999] }] })).toBeNull();
    expect(expandRulesShare({ c: 1, s: [{ i: "a", f: "kvk@1", b: [{}] }] })).toBeNull();
    expect(parseRulesDoc({ c: 1, s: "x" })).toBeNull();
  });
});
