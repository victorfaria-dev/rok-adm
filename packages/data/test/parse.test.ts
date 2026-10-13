import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CardError, buildPatches, cardToFact, csvToTable, factPatch, parseCsv, parseFrontMatter, parseTimeline, stableStringify, tableName, toCell,
} from "../scripts/lib";
import { compareVersions, extractVersions } from "../src/version";
import { ROOT } from "./helpers";

const CARD = `---
id: A99-0001
dominio: A99
titulo: 'Test: card'
tipo: mecanica
afirmacao: "Statement, with comma."
valores:
- {chave: VIP1, valor: '200', unidade: VIP points}
- {chave: x, valor: 1.1.09, unidade: ''}
tabela: ''
perfil: [todos]
estagio_reino: [pre_kvk, kvk1]
fontes:
- {id: 'src:fandom', url: 'https://example.org', trecho: 'quote', acessado_em: 2026-10-13}
versao_jogo: 1.0.90+
data_validade: 2026-08-02
versao_minima: null
invalidado_por: null
confianca: media
status: verificado
---

# Body ignored
`;

describe("fact cards", () => {
  it("parses front matter and maps to Fact", () => {
    const f = cardToFact(parseFrontMatter(CARD), "A99-0001");
    expect(f).toMatchObject({
      id: "A99-0001", domain: "A99", title: "Test: card", kind: "mecanica", statement: "Statement, with comma.",
      table: null, profiles: ["todos"], roles: ["todas"], stages: ["pre_kvk", "kvk1"], confidence: "media", status: "verificado",
      patch: "1.0.90", validUntil: "2026-08-02", invalidatedBy: null,
    });
    expect(f.values).toEqual([{ key: "VIP1", value: "200", unit: "VIP points" }, { key: "x", value: "1.1.09", unit: null }]);
    expect(f.sources).toEqual([{ id: "src:fandom", url: "https://example.org", quote: "quote", accessedAt: "2026-10-13" }]);
  });

  it("rejects invalid cards", () => {
    expect(() => parseFrontMatter("no front matter")).toThrow(CardError);
    expect(() => cardToFact(parseFrontMatter(CARD.replace("confianca: media", "confianca: medium")))).toThrow(/confianca/);
    expect(() => cardToFact(parseFrontMatter(CARD.replace("perfil: [todos]", "perfil: [rich]")))).toThrow(/perfil/);
    expect(() => cardToFact(parseFrontMatter(CARD), "A99-0002")).toThrow(/file name/);
  });

  it("parses a real card (A05-0001)", () => {
    const raw = readFileSync(join(ROOT, "research/facts/A05/A05-0001.md"), "utf8");
    const f = cardToFact(parseFrontMatter(raw), "A05-0001");
    expect(f.table).toBe("facts/A05/data/vip-levels.csv");
    expect(f.values.find((v) => v.key === "VIP10")?.value).toBe("150,000");
    expect(f.sources.length).toBeGreaterThan(1);
  });

  it("derives the fact patch only from unambiguous fields", () => {
    expect(factPatch("1.1.09", "desconhecida")).toBe("1.1.09");
    expect(factPatch(null, "1.0.90+")).toBe("1.0.90");
    expect(factPatch(null, "1.1.09 (T1) / 1.1.12 (T3)")).toBeNull();
    expect(factPatch(null, "desconhecida (Fandom page revised 2026-01-04)")).toBeNull();
  });
});

describe("CSV", () => {
  it("handles quotes, embedded commas, doubled quotes and CRLF", () => {
    expect(parseCsv('a,b,c\r\n1,"2,000","say ""hi"""\n,,\n')).toEqual([["a", "b", "c"], ["1", "2,000", 'say "hi"'], ["", "", ""]]);
  });
  it("converts plain numbers only", () => {
    expect([toCell("12"), toCell("0.03"), toCell(""), toCell("2,000"), toCell("35%")]).toEqual([12, 0.03, null, "2,000", "35%"]);
  });
  it("builds tables and rejects ragged rows", () => {
    const t = csvToTable("X", "facts/A01/data/x.csv", "Level,Time\n1,15\n2,90\n", ["B", "A"]);
    expect(t.rows).toEqual([{ Level: 1, Time: 15 }, { Level: 2, Time: 90 }]);
    expect(t.factIds).toEqual(["A", "B"]);
    expect(() => csvToTable("X", "x", "a,b\n1\n", [])).toThrow(/row 2/);
  });
  it("names tables from their path", () => {
    expect(tableName("facts/A01/data/city-hall.csv")).toBe("A01-city-hall");
    expect(tableName("facts/A01/data/buildings/hospital.csv")).toBe("A01-buildings-hospital");
  });
});

describe("versions and patches", () => {
  it("compares and extracts versions", () => {
    expect(compareVersions("1.1.10", "1.1.09")).toBeGreaterThan(0);
    expect(compareVersions("1.0.99", "1.1.00")).toBeLessThan(0);
    expect(extractVersions("1.0.67–1.1.10 / 1.0.67")).toEqual(["1.0.67", "1.1.10"]);
  });

  it("parses the timeline and groups C04 cards by version", () => {
    const md = [
      "| Date | Version | Change | Invalidates | Card |",
      "|---|---|---|---|---|",
      "| 2026-06-30 | 1.1.09 | **Boosts removed**. | A03 | C04-0004 |",
      "| 2026-07-30 (T3) | 1.1.10 | Pincer. | A07 | C04-0003 |",
    ].join("\n");
    const tl = parseTimeline(md);
    expect(tl).toEqual([
      { date: "2026-06-30", t3: false, version: "1.1.09", change: "Boosts removed.", cards: ["C04-0004"] },
      { date: "2026-07-30", t3: true, version: "1.1.10", change: "Pincer.", cards: ["C04-0003"] },
    ]);
    const mk = (id: string, title: string, conf: "alta" | "media" | "baixa", vj: string, vmin: string | null) => {
      const raw = parseFrontMatter(CARD.replace("A99-0001", id).replace("A99-0001", id).replace("dominio: A99", "dominio: C04")
        .replace("A99", "C04").replace("titulo: 'Test: card'", `titulo: '${title}'`).replace("confianca: media", `confianca: ${conf}`)
        .replace("versao_jogo: 1.0.90+", `versao_jogo: '${vj}'`).replace("versao_minima: null", `versao_minima: ${vmin ?? "null"}`));
      return { raw, fact: cardToFact(raw) };
    };
    const patches = buildPatches([
      mk("C04-0004", "1.1.09: boosts", "alta", "1.1.09", "1.1.09"),
      mk("C04-0003", "1.1.10: pincer", "alta", "1.1.10", "1.1.10"),
      mk("C04-0026", "jumping removed", "media", "~1.0.93 (data)", null),
    ], tl);
    // 1.1.09 also appears in the shared fixture values -> mentioned by every card; ~1.0.93 is ignored.
    expect(patches.map((p) => p.version)).toEqual(["1.1.09", "1.1.10"]);
    expect(patches[0]).toMatchObject({ date: "2026-06-30", confidence: "alta", summary: "Boosts removed." });
    expect(patches[1]).toMatchObject({ date: "2026-07-30", confidence: "baixa", factIds: ["C04-0003"] });
  });
});

describe("stableStringify", () => {
  it("sorts keys recursively and keeps array order", () => {
    expect(stableStringify({ b: 1, a: { d: [3, 1], c: null } })).toBe('{\n  "a": {\n    "c": null,\n    "d": [\n      3,\n      1\n    ]\n  },\n  "b": 1\n}\n');
  });
});
