import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "../src/kingdom-codec";
import {
  CHARTER_STARTER_KEYS, DEFAULT_LANGUAGE_NOTE, RULES_LIMITS, RULES_TEMPLATES, bodyToBlocks, emptyRulesDoc, hasPrompts, isCalendarDay,
  moveSection, newCharterDoc, parseRulesDoc, parseSigners, rulesDisplayTitle, rulesToPlainText, sectionFromTemplate, type RulesDoc,
} from "../src/kingdom-rules";

const NOW = new Date("2026-10-13T10:00:00.000Z");

function sample(): RulesDoc {
  return {
    ...emptyRulesDoc("doc-1", NOW),
    kingdom: "K1234",
    title: "K1234 rules",
    intro: "Read these first.",
    sections: [
      { id: "a", heading: "MGE policy", body: "Rotation.\n\n- Top 10 fixed\n- Others capped" },
      { id: "b", heading: "Farms", body: "Register farms." },
    ],
    charter: { agreedOn: "2026-10-01", signers: ["Ana", "Bo"] },
    lastReviewed: "2026-10-10",
  };
}

describe("isCalendarDay", () => {
  it.each(["2026-10-13", "2024-02-29"])("accepts %s", (d) => expect(isCalendarDay(d)).toBe(true));
  it.each(["2026-02-30", "2026-13-01", "13/10/2026", "", 5, null, "2026-1-1"])("rejects %j", (d) => expect(isCalendarDay(d)).toBe(false));
});

describe("parseRulesDoc", () => {
  it("round-trips a well-formed document", () => {
    const d = sample();
    expect(parseRulesDoc(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it("returns null for non-objects", () => {
    for (const x of [null, 5, "x", [], undefined]) expect(parseRulesDoc(x)).toBeNull();
  });

  it("fills defaults for an empty object", () => {
    const d = parseRulesDoc({})!;
    expect(d.id).toBe("shared");
    expect(d.sections).toEqual([]);
    expect(d.charter).toEqual({ agreedOn: null, signers: [] });
    expect(d.languageNote).toBe(DEFAULT_LANGUAGE_NOTE);
    expect(d.lastReviewed).toBeNull();
    expect(d.updatedAt).toBe(new Date(0).toISOString());
  });

  it("cuts fields to their limits and drops bad sections", () => {
    const d = parseRulesDoc({
      kingdom: "k".repeat(100),
      title: "  A\n\ntitle  ",
      intro: "i".repeat(5000),
      languageNote: "",
      sections: [
        { id: "x", heading: "h".repeat(200), body: "b".repeat(9000) },
        "junk",
        { id: "x", heading: "dup id" },
        ...Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, heading: `S${i}`, body: "" })),
      ],
      charter: { agreedOn: "2026-02-31", signers: ["  Ana ", "", 7, ...Array.from({ length: 30 }, (_, i) => `N${i}`)] },
      lastReviewed: "yesterday",
    })!;
    expect(d.kingdom).toHaveLength(RULES_LIMITS.kingdom);
    expect(d.title).toBe("A title");
    expect(d.intro).toHaveLength(RULES_LIMITS.intro);
    expect(d.languageNote).toBe("");
    expect(d.sections).toHaveLength(RULES_LIMITS.sections);
    expect(d.sections[0]!.heading).toHaveLength(RULES_LIMITS.heading);
    expect(d.sections[0]!.body).toHaveLength(RULES_LIMITS.body);
    expect(d.sections[1]!.heading).toBe("dup id");
    expect(d.sections[1]!.id).not.toBe("x");
    expect(new Set(d.sections.map((s) => s.id)).size).toBe(d.sections.length);
    expect(d.charter.agreedOn).toBeNull();
    expect(d.charter.signers[0]).toBe("Ana");
    expect(d.charter.signers).toHaveLength(RULES_LIMITS.signers);
    expect(d.lastReviewed).toBeNull();
  });
});

describe("parseSigners", () => {
  it("splits lines and commas, trims and caps names", () => {
    expect(parseSigners("Ana\n Bo , Cy\n\n")).toEqual(["Ana", "Bo", "Cy"]);
    expect(parseSigners(["x".repeat(60)])[0]).toHaveLength(RULES_LIMITS.signer);
    expect(parseSigners(42)).toEqual([]);
  });
});

describe("bodyToBlocks", () => {
  it("splits paragraphs on blank lines and keeps line breaks", () => {
    expect(bodyToBlocks("One\ntwo\n\nThree")).toEqual([{ type: "p", lines: ["One", "two"] }, { type: "p", lines: ["Three"] }]);
  });

  it("makes bullet and numbered lists", () => {
    expect(bodyToBlocks("Intro\n- a\n- b\n3. c\n4. d")).toEqual([
      { type: "p", lines: ["Intro"] },
      { type: "ul", items: ["a", "b"] },
      { type: "ol", start: 3, items: ["c", "d"] },
    ]);
  });

  it("continues a list item with an indented line, and a plain line ends the list", () => {
    expect(bodyToBlocks("- a\n  more\nAfter")).toEqual([{ type: "ul", items: ["a more"] }, { type: "p", lines: ["After"] }]);
  });

  it("accepts 1) numbering and CRLF; ignores empty input", () => {
    expect(bodyToBlocks("1) x\r\n2) y")).toEqual([{ type: "ol", start: 1, items: ["x", "y"] }]);
    expect(bodyToBlocks("")).toEqual([]);
    expect(bodyToBlocks("\n\n  \n")).toEqual([]);
  });

  it("keeps markup-looking text as plain strings (rendering escapes it)", () => {
    expect(bodyToBlocks("<script>alert(1)</script>\n-not a bullet")).toEqual([{ type: "p", lines: ["<script>alert(1)</script>", "-not a bullet"] }]);
  });
});

describe("templates", () => {
  it("are prompts with [brackets], unique keys, within limits", () => {
    expect(new Set(RULES_TEMPLATES.map((t) => t.key)).size).toBe(RULES_TEMPLATES.length);
    expect(RULES_TEMPLATES).toHaveLength(10);
    for (const t of RULES_TEMPLATES) {
      expect(hasPrompts(t.body), t.key).toBe(true);
      expect(t.heading.length).toBeLessThanOrEqual(RULES_LIMITS.heading);
      expect(t.body.length).toBeLessThanOrEqual(RULES_LIMITS.body);
    }
    expect(RULES_TEMPLATES.find((t) => t.key === "kvk")!.body).toContain("/kingdom/requirements/");
    expect(RULES_TEMPLATES.find((t) => t.key === "mge")!.body).toMatch(/fixed \/ on rotation \/ free-for-all/);
  });

  it("builds sections and a charter starter pack", () => {
    expect(sectionFromTemplate("farms", "z")).toEqual({ id: "z", heading: "Farms & alt accounts", body: RULES_TEMPLATES.find((t) => t.key === "farms")!.body });
    expect(sectionFromTemplate("nope", "z")).toBeNull();
    const c = newCharterDoc("c1", NOW);
    expect(c.sections.map((s) => s.heading)).toEqual(CHARTER_STARTER_KEYS.map((k) => RULES_TEMPLATES.find((t) => t.key === k)!.heading));
    expect(new Set(c.sections.map((s) => s.id)).size).toBe(c.sections.length);
    expect(c.title).toBe("Kingdom charter");
    expect(parseRulesDoc(c)).toEqual(c);
  });

  it("detects remaining prompts", () => {
    expect(hasPrompts("No prompts")).toBe(false);
    expect(hasPrompts("King: [name]")).toBe(true);
  });
});

describe("helpers", () => {
  it("moves sections within range only", () => {
    expect(moveSection(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveSection(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveSection(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveSection(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });

  it("picks a display title", () => {
    expect(rulesDisplayTitle({ title: "T", kingdom: "K1" })).toBe("T");
    expect(rulesDisplayTitle({ title: "", kingdom: "K1" })).toBe("K1 rules");
    expect(rulesDisplayTitle({ title: "", kingdom: "" })).toBe("Kingdom rules");
  });

  it("exports plain text with charter and review date", () => {
    const t = rulesToPlainText(sample());
    expect(t).toContain("K1234 rules\nK1234\n");
    expect(t).toContain("MGE policy\nRotation.");
    expect(t).toContain("Agreed on 2026-10-01");
    expect(t).toContain("Signed by: Ana, Bo");
    expect(t).toContain("Last reviewed: 2026-10-10");
    const bare = rulesToPlainText(emptyRulesDoc("e", NOW));
    expect(bare).not.toContain("Charter");
    expect(bare).not.toContain("Last reviewed");
  });
});

describe("share round trip", () => {
  it("encodes and decodes a rules document (compressed and plain)", async () => {
    for (const compress of [true, false]) {
      const code = await encodeShare("rules", sample(), { compress });
      const r = await decodeShare(code, "rules", parseRulesDoc);
      expect(r).toEqual({ ok: true, data: sample() });
    }
  });

  it("rejects a requirements link opened as rules", async () => {
    const code = await encodeShare("requirements", sample());
    expect(await decodeShare(code, "rules", parseRulesDoc)).toEqual({ ok: false, error: "wrong_kind" });
  });

  it("rejects a non-object document", async () => {
    const code = await encodeShare("rules", "text");
    expect(await decodeShare(code, "rules", parseRulesDoc)).toEqual({ ok: false, error: "bad_json" });
  });
});
