// i18n glossary (packages/data/i18n/glossary.json): the real file passes, and the validator catches the failures it must.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  GLOSSARY_LANGUAGES, GLOSSARY_PATH, loadEnGlossaryIds, validateGlossary, type GlossaryDoc, type GlossaryTerm,
} from "../scripts/check-glossary";

const load = (): GlossaryDoc => JSON.parse(readFileSync(GLOSSARY_PATH, "utf8")) as GlossaryDoc;
const nth = (doc: GlossaryDoc, i: number): GlossaryTerm => {
  const t = doc.terms[i];
  if (!t) throw new Error(`no term ${i}`);
  return t;
};

describe("i18n glossary", () => {
  it("is valid", () => {
    expect(validateGlossary(load(), loadEnGlossaryIds())).toEqual([]);
  });

  it("covers the 13 site languages", () => {
    expect(GLOSSARY_LANGUAGES).toHaveLength(13);
    expect(load().languages.map((l) => l.code)).toEqual([...GLOSSARY_LANGUAGES]);
  });

  it("keeps the owner's PT screenshot strings as verified-official", () => {
    const doc = load();
    const pt = (id: string) => doc.terms.find((t) => t.id === id)?.translations["pt-BR"];
    expect(pt("city-hall")).toMatchObject({ text: "Prefeitura", status: "verified-official", source: "owner screenshot 2026-10-13" });
    expect(pt("kill-points")).toMatchObject({ text: "Pontos de Abate", status: "verified-official" });
  });

  it("fails on an empty string", () => {
    const doc = load();
    nth(doc, 0).translations.ko.text = "  ";
    expect(validateGlossary(doc).some((e) => e.includes("[ko]: empty string"))).toBe(true);
  });

  it("fails on a missing language", () => {
    const doc = load();
    delete (nth(doc, 1).translations as Partial<GlossaryTerm["translations"]>).ar;
    expect(validateGlossary(doc).some((e) => e.includes("[ar]: missing language"))).toBe(true);
  });

  it("fails on a missing or unknown status", () => {
    const doc = load();
    (nth(doc, 2).translations.fr as { status?: string }).status = undefined;
    (nth(doc, 3).translations.de as { status: string }).status = "official";
    const errors = validateGlossary(doc);
    expect(errors.some((e) => e.includes("[fr]: missing status"))).toBe(true);
    expect(errors.some((e) => e.includes("[de]: bad status official"))).toBe(true);
  });

  it("fails when a sourced status has no source", () => {
    const doc = load();
    const cell = nth(doc, 0).translations.es;
    cell.status = "community";
    cell.source = null;
    expect(validateGlossary(doc).some((e) => e.includes("[es]: community needs a source"))).toBe(true);
  });
});
