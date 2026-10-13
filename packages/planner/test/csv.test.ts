import { describe, expect, it } from "vitest";
import { CSV_MAX_ROWS, csvUnguard, detectDelimiter, normHeader, parseCsv, readCsvTable, toCsv } from "../src/csv";

describe("toCsv", () => {
  it("writes a header, CRLF rows, raw numbers and quoted text", () => {
    expect(toCsv(["name", "score"], [["Ana", 1200], ["Bo, Jr", null], ['Say "hi"', 3.5]])).toBe(
      'name,score\r\nAna,1200\r\n"Bo, Jr",\r\n"Say ""hi""",3.5\r\n',
    );
  });

  it("guards text that a spreadsheet would run as a formula, never numbers", () => {
    const out = toCsv(["a", "b"], [["=HYPERLINK(\"x\")", -5], ["@cmd", 0], ["+1", Number.NaN]]);
    expect(out).toContain(`"'=HYPERLINK(""x"")",-5`);
    expect(out).toContain("'@cmd,0");
    expect(out).toContain("'+1,\r\n");
  });

  it("writes booleans as yes/no and line breaks inside quotes", () => {
    expect(toCsv(["x"], [[true], [false], ["a\nb"]])).toBe('x\r\nyes\r\nno\r\n"a\nb"\r\n');
  });
});

describe("parseCsv", () => {
  it("round-trips toCsv output, including guarded formulas", () => {
    const rows = [["=SUM(A1)", "Bo, Jr"], ['q "x"', "line\r\nbreak"], ["-3", "@x"]];
    const p = parseCsv(toCsv(["a", "b"], rows));
    expect(p).toEqual({ ok: true, rows: [["a", "b"], ...rows] });
  });

  it("strips a BOM, accepts LF, CR and a missing final newline, skips blank lines", () => {
    expect(parseCsv("﻿a,b\n1,2\r\r\n3,4")).toEqual({ ok: true, rows: [["a", "b"], ["1", "2"], ["3", "4"]] });
  });

  it("detects semicolon and tab files (Excel in many locales)", () => {
    expect(detectDelimiter("name;score\nAna;1,5")).toBe(";");
    expect(parseCsv("name;score\nAna;\"1,5\"")).toEqual({ ok: true, rows: [["name", "score"], ["Ana", "1,5"]] });
    expect(parseCsv("name\tscore\nAna\t7")).toEqual({ ok: true, rows: [["name", "score"], ["Ana", "7"]] });
    expect(detectDelimiter('"a;b",c')).toBe(",");
  });

  it("trims unquoted cells only", () => {
    expect(parseCsv(' a , " b " \n')).toEqual({ ok: true, rows: [["a", " b "]] });
  });

  it("reports an unclosed quote and oversized input instead of throwing", () => {
    expect(parseCsv('a,"b\n1,2')).toEqual({ ok: false, error: expect.stringContaining("never closed") });
    expect(parseCsv("x".repeat(1_000_001)).ok).toBe(false);
    expect(parseCsv("a\n".repeat(CSV_MAX_ROWS + 2)).ok).toBe(false);
    expect(parseCsv("a\n".repeat(CSV_MAX_ROWS)).ok).toBe(true);
  });

  it("csvUnguard only removes the apostrophe added before a formula character", () => {
    expect(csvUnguard("'=1")).toBe("=1");
    expect(csvUnguard("'hello")).toBe("'hello");
    expect(csvUnguard("it's")).toBe("it's");
  });
});

describe("readCsvTable", () => {
  const COLS = { name: ["name", "governor"], score: ["score", "dkp"] } as const;

  it("maps columns by header spelling and order, with 1-based line numbers", () => {
    const t = readCsvTable("DKP,Governor Name,extra\n100,Ana,x\n,Bo,y\n", { name: ["governor name", "name"], score: ["score", "dkp"] }, ["name"]);
    expect(t).toEqual({
      ok: true,
      columns: ["name", "score"],
      records: [{ line: 2, values: { name: "Ana", score: "100" } }, { line: 3, values: { name: "Bo", score: "" } }],
    });
  });

  it("names the missing required column", () => {
    expect(readCsvTable("who,score\nAna,1", COLS, ["name"])).toEqual({ ok: false, error: expect.stringContaining('"name"') });
    expect(readCsvTable("", COLS, ["name"])).toEqual({ ok: false, error: "This file is empty." });
  });

  it("optional columns read as empty", () => {
    const t = readCsvTable("governor\nAna", COLS, ["name"]);
    expect(t.ok && t.records[0]!.values).toEqual({ name: "Ana", score: "" });
    expect(normHeader("Governor_Name ")).toBe("governorname");
  });
});
