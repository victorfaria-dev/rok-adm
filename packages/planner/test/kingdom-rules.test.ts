import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "../src/kingdom-codec";
import {
  CHARTER_STARTER_KEYS, DEFAULT_LANGUAGE_NOTE, RULES_LIMITS, RULES_TEMPLATES, bodyToBlocks, emptyRulesDoc, hasPrompts, isCalendarDay,
  moveSection, newCharterDoc, parseRulesDoc, parseSigners, rulesDisplayTitle, rulesToPlainText, sectionFromTemplate, type RulesDoc,
  TRANSLATION_NOTE, UNTRANSLATED_NOTE, cleanLangCode, emptyTranslation, isLangCode, originalName, pickVersion, pruneTranslations, resolveRules,
  rulesVersions, rulesWithOnly, setTranslatedSection, translationName, versionsWithPrompts,
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

describe("language versions", () => {
  function multi(): RulesDoc {
    return {
      ...sample(),
      originalLabel: "English",
      originalLang: "en",
      translations: [
        {
          id: "es", label: "Español", lang: "es", title: "Reglas de K1234", intro: "Lee esto primero.",
          sections: [{ id: "a", heading: "Política de MGE", body: "Rotación." }],
        },
      ],
    };
  }

  it("old documents parse with no translations; new ones round-trip", () => {
    const old: Record<string, unknown> = { ...sample() };
    delete old.translations;
    delete old.originalLabel;
    delete old.originalLang;
    const d = parseRulesDoc(old)!;
    expect(d.translations).toEqual([]);
    expect(d.originalLabel).toBe("");
    expect(d.originalLang).toBe("");
    expect(parseRulesDoc(JSON.parse(JSON.stringify(multi())))).toEqual(multi());
  });

  it("validates lang codes with a simple BCP-47 shape", () => {
    for (const ok of ["es", "pt-BR", "zh-Hant", "sr-Latn-RS", "fil"]) expect(isLangCode(ok), ok).toBe(true);
    for (const bad of ["", "e", "español", "es_ES", "es-", "-es", "1x", "a".repeat(40), 5, null]) expect(isLangCode(bad), String(bad)).toBe(false);
    expect(cleanLangCode("  pt-BR ")).toBe("pt-BR");
    expect(cleanLangCode("<x>")).toBe("");
  });

  it("parses translations tolerantly: caps, invalid codes, orphan and duplicate sections, ids", () => {
    const d = parseRulesDoc({
      ...sample(),
      originalLang: "not a code",
      translations: [
        { id: "x", label: "L".repeat(80), lang: "es_ES", sections: [{ id: "a", heading: "A", body: "B" }, { id: "a", heading: "dup" }, { id: "gone", heading: "orphan" }, "junk"] },
        { id: "x", label: "Dup id" },
        "junk",
        ...Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, label: `N${i}` })),
      ],
    })!;
    expect(d.originalLang).toBe("");
    expect(d.translations).toHaveLength(RULES_LIMITS.translations);
    const [t0, t1] = d.translations;
    expect(t0!.label).toHaveLength(RULES_LIMITS.langLabel);
    expect(t0!.lang).toBe("");
    expect(t0!.sections).toEqual([{ id: "a", heading: "A", body: "B" }]);
    expect(t1!.id).not.toBe("x");
    expect(new Set(d.translations.map((t) => t.id)).size).toBe(d.translations.length);
  });

  it("resolves a translation and falls back to the original per section", () => {
    const v = resolveRules(multi(), "es");
    expect(v.isOriginal).toBe(false);
    expect(v.name).toBe("Español");
    expect(v.lang).toBe("es");
    expect(v.title).toBe("Reglas de K1234");
    expect(v.intro).toBe("Lee esto primero.");
    expect(v.sections).toEqual([
      { id: "a", heading: "Política de MGE", body: "Rotación.", fallback: false },
      { id: "b", heading: "Farms", body: "Register farms.", fallback: true },
    ]);
    expect(v.untranslated).toBe(1);
    // A heading without its body is not a translation yet.
    const half = setTranslatedSection(multi().translations[0]!, "b", { heading: "Granjas" });
    expect(resolveRules({ ...multi(), translations: [half] }, "es").sections[1]!.fallback).toBe(true);
    // Untranslated title and intro fall back to the original.
    const bare = resolveRules({ ...multi(), translations: [emptyTranslation("t", "Português", "pt-BR")] }, "t");
    expect(bare.title).toBe("K1234 rules");
    expect(bare.titleFallback).toBe(true);
    expect(bare.introFallback).toBe(true);
    expect(bare.untranslated).toBe(3);
    // An unknown key reads the original.
    expect(resolveRules(multi(), "nope").isOriginal).toBe(true);
    expect(rulesVersions(multi()).map((x) => x.name)).toEqual(["English", "Español"]);
  });

  it("sets, clears and prunes translated sections", () => {
    let t = emptyTranslation("t");
    t = setTranslatedSection(t, "a", { heading: "H" });
    t = setTranslatedSection(t, "a", { body: "B" });
    expect(t.sections).toEqual([{ id: "a", heading: "H", body: "B" }]);
    t = setTranslatedSection(t, "a", { heading: "", body: "" });
    expect(t.sections).toEqual([]);
    const pruned = pruneTranslations({ ...multi(), sections: multi().sections.filter((s) => s.id !== "a") });
    expect(pruned.translations[0]!.sections).toEqual([]);
  });

  it("names versions and picks the reader's language", () => {
    expect(translationName({ label: "", lang: "uk" }, 0)).toBe("uk");
    expect(translationName({ label: "", lang: "" }, 1)).toBe("Language 3");
    expect(originalName({ originalLabel: "", originalLang: "" })).toBe("Original");
    const d = { ...multi(), translations: [...multi().translations, emptyTranslation("br", "Português", "pt-BR")] };
    expect(pickVersion(d, ["es-MX", "en"])).toBe("es");
    expect(pickVersion(d, ["pt"])).toBe("br");
    expect(pickVersion(d, ["pt-br"])).toBe("br");
    expect(pickVersion(d, ["fr", "en-GB"])).toBe("original");
    expect(pickVersion(d, ["ru"])).toBe("original");
  });

  it("lists versions with prompts left and keeps one translation for a shorter link", () => {
    const d = multi();
    expect(versionsWithPrompts(d)).toEqual([]);
    d.translations[0]!.intro = "Rey: [nombre]";
    d.intro = "King: [name]";
    expect(versionsWithPrompts(d)).toEqual(["English", "Español"]);
    const two = { ...d, translations: [...d.translations, emptyTranslation("pt", "Português")] };
    expect(rulesWithOnly(two, "pt").translations.map((t) => t.id)).toEqual(["pt"]);
    expect(rulesWithOnly(two, null).translations).toEqual([]);
  });

  it("exports one version or all versions as plain text", () => {
    const es = rulesToPlainText(multi(), { version: "es" });
    expect(es).toContain("Language: Español\n\nReglas de K1234");
    expect(es).toContain(TRANSLATION_NOTE);
    expect(es).toContain(`Farms\n(${UNTRANSLATED_NOTE})\nRegister farms.`);
    const all = rulesToPlainText(multi(), { all: true });
    expect(all.startsWith("Language: English (original)\n\nK1234 rules")).toBe(true);
    expect(all).toContain("----------------------------------------");
    expect(rulesToPlainText(sample())).not.toContain("Language:");
  });

  it("share links carry every version", async () => {
    const code = await encodeShare("rules", multi());
    expect(await decodeShare(code, "rules", parseRulesDoc)).toEqual({ ok: true, data: multi() });
  });
});
