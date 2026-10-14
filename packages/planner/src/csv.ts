// Generic CSV (RFC 4180) export and import, shared by the farm ledger, the MGE planner and the
// requirements sandbox. Pure. Export guards against spreadsheet formula injection; import undoes
// that guard and reads files saved by Excel/Sheets in any common locale (comma, semicolon or tab).

export type CsvCell = string | number | boolean | null | undefined;

/** Text cells starting with = + - @ TAB or CR are prefixed with ' so spreadsheets do not run them. */
export function csvSafeText(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Quote a field when it holds a comma, quote or line break (RFC 4180). */
export function csvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function cell(c: CsvCell): string {
  if (c === null || c === undefined) return "";
  if (typeof c === "number") return Number.isFinite(c) ? String(c) : "";
  if (typeof c === "boolean") return c ? "yes" : "no";
  return csvField(csvSafeText(c));
}

/** Header + rows → CSV text with CRLF line ends. Numbers are written as plain digits, text is guarded. */
export function toCsv(header: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [header.map((h) => csvField(csvSafeText(h))).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  return lines.join("\r\n") + "\r\n";
}

/** Undo csvSafeText: "'=SUM(A1)" read back is "=SUM(A1)" (shown as text, never evaluated by us). */
export function csvUnguard(s: string): string {
  return /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s;
}

export const CSV_MAX_CHARS = 1_000_000;
export const CSV_MAX_ROWS = 5_000;

export type CsvParse = { ok: true; rows: string[][] } | { ok: false; error: string };

/** Delimiter of the first record: the most frequent of , ; TAB outside quotes (comma on a tie). */
export function detectDelimiter(text: string): "," | ";" | "\t" {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch in counts) counts[ch as keyof typeof counts]++;
  }
  if (counts[";"] > counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  return ",";
}

/**
 * Parse CSV text into rows of cells. Handles a UTF-8 BOM, quoted fields with "" escapes and line
 * breaks, CRLF/LF/CR line ends and a missing final newline. Blank lines are skipped. Never throws.
 */
export function parseCsv(input: string, delimiter?: "," | ";" | "\t"): CsvParse {
  if (input.length > CSV_MAX_CHARS) return { ok: false, error: "Este arquivo é grande demais (mais de 1 MB de texto)." };
  const text = input.replace(/^﻿/, "");
  const d = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let wasQuoted = false;
  const endField = (): void => {
    row.push(csvUnguard(wasQuoted ? field : field.trim()));
    field = "";
    wasQuoted = false;
  };
  const endRow = (): boolean => {
    endField();
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
    return rows.length <= CSV_MAX_ROWS;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && !wasQuoted && field.trim() === "") { quoted = true; wasQuoted = true; field = ""; }
    else if (wasQuoted && (ch === " " || ch === "\t") && ch !== d) continue;
    else if (ch === d) endField();
    else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (!endRow()) return { ok: false, error: `Este arquivo tem mais de ${CSV_MAX_ROWS.toLocaleString("pt-BR")} linhas.` };
    } else field += ch;
  }
  if (quoted) return { ok: false, error: "Uma célula entre aspas nunca é fechada: o arquivo parece cortado." };
  if ((field !== "" || row.length > 0) && !endRow()) return { ok: false, error: `Este arquivo tem mais de ${CSV_MAX_ROWS.toLocaleString("pt-BR")} linhas.` };
  return { ok: true, rows };
}

/** "Governor name" / "governor_name" / "GOVERNOR-NAME" → "governorname". */
export const normHeader = (h: string): string => h.toLowerCase().replace(/[^a-z0-9]/g, "");

export interface CsvRecord<K extends string> {
  /** 1-based row number in the file (the header is row 1). */
  line: number;
  values: Record<K, string>;
}

export type CsvTable<K extends string> =
  | { ok: true; records: CsvRecord<K>[]; columns: K[] }
  | { ok: false; error: string };

/**
 * Read a CSV with a header row into records keyed by column. `columns` maps each key to the
 * accepted header spellings (compared with normHeader); `required` keys must be present.
 * Missing optional columns read as "".
 */
export function readCsvTable<C extends Readonly<Record<string, readonly string[]>>, K extends keyof C & string = keyof C & string>(
  text: string, columns: C, required: readonly K[],
): CsvTable<keyof C & string> {
  type Key = keyof C & string;
  const p = parseCsv(text);
  if (!p.ok) return p;
  if (p.rows.length === 0) return { ok: false, error: "Este arquivo está vazio." };
  const header = p.rows[0]!.map(normHeader);
  const index = {} as Record<Key, number>;
  const found: Key[] = [];
  for (const k of Object.keys(columns) as Key[]) {
    const i = header.findIndex((h) => (columns[k] ?? []).map(normHeader).includes(h));
    index[k] = i;
    if (i >= 0) found.push(k);
  }
  const missing = required.filter((k) => index[k] < 0);
  if (missing.length) {
    const want = missing.map((k) => `"${columns[k]?.[0] ?? k}"`).join(" e ");
    return { ok: false, error: `A primeira linha deve nomear as colunas. Faltando: ${want}.` };
  }
  const records = p.rows.slice(1).map((r, i) => {
    const values = {} as Record<Key, string>;
    for (const k of Object.keys(columns) as Key[]) values[k] = index[k] >= 0 ? (r[index[k]] ?? "").trim() : "";
    return { line: i + 2, values };
  });
  return { ok: true, records, columns: found };
}
