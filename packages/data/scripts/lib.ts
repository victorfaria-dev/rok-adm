// Pure parsing helpers for the F-50 data pipeline. No file system access here, so
// everything is unit-testable; scripts/build.ts does the I/O.
import { parse as parseYaml } from "yaml";
import type { Fact, PatchEntry, SourceRef } from "@rokadm/core";
import { compareVersions, extractVersions } from "../src/version";

export const KINDS: readonly Fact["kind"][] = ["mecanica", "estrategia", "evento", "regra", "ferramenta", "derivado"];
export const CONFIDENCES: readonly Fact["confidence"][] = ["baixa", "media", "alta"];
export const STATUSES: readonly Fact["status"][] = ["bruto", "organizado", "verificado", "contestado", "parcialmente_obsoleto", "obsoleto"];
const PROFILES = new Set(["todos", "f2p", "low", "medium", "high", "whale", "kraken"]);
const ROLES = new Set(["todas", "lutador", "farm", "rally", "guarnicao", "lider"]);
const STAGES = new Set(["todos", "pre_kvk", "kvk1", "kvk2", "kvk3", "soc"]);

export const CARD_FILE_RE = /^[A-C]\d{2}-\d{4}\.md$/;

export class CardError extends Error {}

/** Extracts and parses the YAML front matter of a fact card. */
export function parseFrontMatter(raw: string): Record<string, unknown> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
  if (!m || m[1] === undefined) throw new CardError("no YAML front matter");
  const data: unknown = parseYaml(m[1]);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new CardError("front matter is not a mapping");
  return data as Record<string, unknown>;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  return s.trim() === "" ? null : s;
}

function list<T extends string>(v: unknown, allowed: Set<string>, field: string, id: string, fallback?: T[]): T[] {
  if (v === undefined || v === null) {
    if (fallback) return fallback;
    throw new CardError(`${id}: ${field} missing`);
  }
  if (!Array.isArray(v) || v.length === 0) throw new CardError(`${id}: ${field} must be a non-empty list`);
  for (const x of v) if (!allowed.has(String(x))) throw new CardError(`${id}: ${field} has invalid value '${String(x)}'`);
  return v.map((x) => String(x) as T);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string, id: string): T {
  if (!allowed.includes(v as T)) throw new CardError(`${id}: ${field} '${String(v)}' not in [${allowed.join(", ")}]`);
  return v as T;
}

/** Patch a fact refers to: versao_minima, else versao_jogo when it is a single plain version ("1.0.90" / "1.0.90+"). */
export function factPatch(versaoMinima: unknown, versaoJogo: unknown): string | null {
  const min = str(versaoMinima);
  if (min && extractVersions(min).length === 1) return extractVersions(min)[0] ?? null;
  const jogo = str(versaoJogo);
  if (jogo && /^\s*\d+\.\d+\.\d+\+?\s*$/.test(jogo)) return extractVersions(jogo)[0] ?? null;
  return null;
}

/** Maps one card's front matter (schema v2, research/schemas/fato.md) to the `Fact` contract. */
export function cardToFact(d: Record<string, unknown>, fileId?: string): Fact {
  const id = str(d.id) ?? "";
  if (!/^[A-C]\d{2}-\d{4}$/.test(id)) throw new CardError(`bad id '${id}'`);
  if (fileId !== undefined && fileId !== id) throw new CardError(`${id}: file name ${fileId} does not match id`);
  const domain = str(d.dominio) ?? "";
  if (domain !== id.slice(0, 3)) throw new CardError(`${id}: dominio '${domain}' does not match id`);
  const valores = Array.isArray(d.valores) ? d.valores : [];
  const fontes = Array.isArray(d.fontes) ? d.fontes : [];
  if (fontes.length === 0) throw new CardError(`${id}: no fontes`);
  const sources: SourceRef[] = fontes.map((s, i) => {
    if (!s || typeof s !== "object") throw new CardError(`${id}: fonte #${i + 1} is not a mapping`);
    const r = s as Record<string, unknown>;
    const sid = str(r.id);
    if (!sid || !sid.startsWith("src:")) throw new CardError(`${id}: fonte #${i + 1} id is not a slug`);
    return { id: sid, url: str(r.url), quote: str(r.trecho), accessedAt: str(r.acessado_em) };
  });
  return {
    id,
    domain,
    title: str(d.titulo) ?? "",
    kind: oneOf(d.tipo, KINDS, "tipo", id),
    statement: str(d.afirmacao) ?? "",
    values: valores.map((v, i) => {
      if (!v || typeof v !== "object") throw new CardError(`${id}: valores #${i + 1} is not a mapping`);
      const r = v as Record<string, unknown>;
      return { key: str(r.chave) ?? "", value: str(r.valor) ?? "", unit: str(r.unidade) };
    }),
    table: str(d.tabela),
    profiles: list(d.perfil, PROFILES, "perfil", id),
    roles: list(d.funcao, ROLES, "funcao", id, ["todas"]),
    stages: list(d.estagio_reino, STAGES, "estagio_reino", id),
    confidence: oneOf(d.confianca, CONFIDENCES, "confianca", id),
    status: oneOf(d.status, STATUSES, "status", id),
    patch: factPatch(d.versao_minima, d.versao_jogo),
    validUntil: str(d.data_validade),
    invalidatedBy: str(d.invalidado_por),
    sources,
  };
}

// ---------------------------------------------------------------- CSV

/** RFC 4180 CSV parser (quoted fields, doubled quotes, CRLF). Returns rows of raw strings. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (q) throw new Error("unterminated quoted CSV field");
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export type Cell = string | number | null;

/** Plain integers/decimals become numbers; empty cells become null; anything else ("2,000", "35%") stays text. */
export function toCell(s: string): Cell {
  const t = s.trim();
  if (t === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

export interface DataTable {
  name: string;
  /** Path relative to research/, as written in `tabela`. */
  source: string;
  columns: string[];
  rows: Array<Record<string, Cell>>;
  /** Cards whose `tabela` points to this CSV (or its directory). */
  factIds: string[];
}

export function csvToTable(name: string, source: string, text: string, factIds: string[]): DataTable {
  const [header, ...body] = parseCsv(text);
  if (!header) throw new Error(`${source}: empty CSV`);
  const rows = body.map((r, i) => {
    if (r.length !== header.length) throw new Error(`${source}: row ${i + 2} has ${r.length} cells, header has ${header.length}`);
    const o: Record<string, Cell> = {};
    header.forEach((h, j) => { o[h] = toCell(r[j] ?? ""); });
    return o;
  });
  return { name, source, columns: header, rows, factIds: [...factIds].sort() };
}

/** "facts/A01/data/buildings/hospital.csv" -> "A01-buildings-hospital". */
export function tableName(relPath: string): string {
  const m = /^facts\/([A-C]\d{2})\/data\/(.+)\.csv$/.exec(relPath);
  if (!m || !m[1] || !m[2]) throw new Error(`unexpected table path ${relPath}`);
  return `${m[1]}-${m[2].replace(/\//g, "-")}`;
}

// ---------------------------------------------------------------- patches

export interface TimelineRow {
  date: string | null;
  t3: boolean;
  version: string;
  change: string;
  cards: string[];
}

/** Reads the "Chronological timeline" table of research/context/game-state-and-patch-timeline.md. */
export function parseTimeline(md: string): TimelineRow[] {
  const out: TimelineRow[] = [];
  for (const line of md.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // | Date | Version | Change | Invalidates | Card |
    if (cells.length !== 7) continue;
    const [, date, version, change, , card] = cells;
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) continue;
    const dm = /^(\d{4}-\d{2}(?:-\d{2})?)/.exec(date ?? "");
    out.push({
      date: dm?.[1] ?? null,
      t3: /\(T3\)/.test(date ?? ""),
      version,
      change: (change ?? "").replace(/\*\*/g, "").trim(),
      cards: (card ?? "").match(/C04-\d{4}/g) ?? [],
    });
  }
  return out;
}

const RANK: Record<Fact["confidence"], number> = { baixa: 0, media: 1, alta: 2 };

/** One `PatchEntry` per version mentioned by a C04 card (versao_jogo, versao_minima, title, values).
 * - date: a `data_<version>` value on a card, else the timeline row's date.
 * - confidence: highest confidence among the cards that are *about* this version (versao_minima or title prefix),
 *   else among all cards mentioning it; capped at `baixa` when the timeline marks the date as T3-only.
 * - summary: timeline "Change" column, else the titles of the cards about this version. */
export function buildPatches(c04: Array<{ fact: Fact; raw: Record<string, unknown> }>, timeline: TimelineRow[]): PatchEntry[] {
  const byVersion = new Map<string, { all: Fact[]; primary: Fact[]; date: string | null }>();
  for (const { fact, raw } of c04) {
    const texts = [str(raw.versao_jogo), str(raw.versao_minima), fact.title, ...fact.values.map((v) => `${v.key} ${v.value}`)];
    // "~1.0.93" = approximate (version guessed from a date): not evidence for that patch.
    const versions = new Set(texts.flatMap((t) => extractVersions(t?.replace(/~\s*\d+\.\d+\.\d+/g, ""))));
    for (const v of versions) {
      const e = byVersion.get(v) ?? { all: [], primary: [], date: null };
      e.all.push(fact);
      if (str(raw.versao_minima) === v || fact.title.startsWith(`${v}:`)) e.primary.push(fact);
      const dv = fact.values.find((x) => x.key === `data_${v}`)?.value;
      if (dv && /^\d{4}-\d{2}-\d{2}$/.test(dv)) e.date = dv;
      byVersion.set(v, e);
    }
  }
  const tl = new Map(timeline.map((r) => [r.version, r]));
  const entries: PatchEntry[] = [];
  for (const [version, e] of byVersion) {
    const row = tl.get(version);
    const basis = e.primary.length ? e.primary : e.all;
    let conf = basis.reduce<Fact["confidence"]>((acc, f) => (RANK[f.confidence] > RANK[acc] ? f.confidence : acc), "baixa");
    if (row?.t3) conf = "baixa";
    const summary = row?.change || basis.map((f) => f.title.replace(new RegExp(`^${version.replace(/\./g, "\\.")}:\\s*`), "")).join("; ");
    entries.push({
      version,
      date: e.date ?? row?.date ?? null,
      confidence: conf,
      summary,
      factIds: [...new Set(e.all.map((f) => f.id))].sort(),
    });
  }
  return entries.sort((a, b) => compareVersions(a.version, b.version));
}

// ---------------------------------------------------------------- output

/** JSON with object keys sorted recursively (arrays keep their order) and a trailing newline. */
export function stableStringify(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) {
        const x = (v as Record<string, unknown>)[k];
        if (x !== undefined) o[k] = norm(x);
      }
      return o;
    }
    return v;
  };
  return JSON.stringify(norm(value), null, 2) + "\n";
}
