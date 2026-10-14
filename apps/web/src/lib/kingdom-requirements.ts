// Web glue for the requirements card (F-34) and My requirements (F-30): defaults, form text ↔ card,
// and the device store (ko:kingdom:v1, kinds "requirements" and "my-requirements").
import {
  FORMULA_PRESETS, FORMULA_VARS, REQ_GROUP_MAX_PERCENT, REQ_MAX_BANDS, REQ_MAX_GROUPS, REQ_MAX_NUMBER, REQ_MAX_PERCENT, REQ_MAX_SAMPLES,
  cardSharePayload, defaultRequirementsCard, encodeShare, evaluatePlayer, excludedDeadsIssue, isRecord, newDocId, parseQuantity, parseRequirementsCard,
  readCsvTable, toCsv, validateBands, validateGroups,
  type BandIssue, type FormulaVar, type FormulaVars, type PowerBand, type ReqStage, type RequirementGroup, type RequirementsCard, type SampleAccount,
} from "@rokadm/planner";
import { listDocs, removeDoc, saveDoc, type StorageLike } from "./kingdom-store";
import { shareUrl } from "./kingdom-share";

export const MY_PATH = "/kingdom/my/";
export const SHARE_KIND = "requirements";

/** Example requirement used to pre-fill a new card: "250% of power" (B08-0002). The council sets its own. */
export const EXAMPLE_PERCENT = 250;

/** Clearly fictional sandbox accounts (stable ids so server and browser render the same). */
export function sampleAccounts(): SampleAccount[] {
  return [
    { id: "sample-a", name: "Exemplo A", stats: { power: 10_500_000, t4: 600_000, t5: 0, deads: 300_000 } },
    { id: "sample-b", name: "Exemplo B", stats: { power: 35_000_000, t4: 2_000_000, t5: 1_500_000, deads: 900_000 } },
    { id: "sample-c", name: "Exemplo C", stats: { power: 80_000_000, t4: 1_000_000, t5: 6_000_000, deads: 2_500_000 } },
  ];
}

/** A new card pre-filled with the first preset, the example requirement and three sample accounts. */
export function newCard(now: Date = new Date()): RequirementsCard {
  const p = FORMULA_PRESETS[0]!;
  return defaultRequirementsCard({
    formula: p.formula,
    presetId: p.id,
    stage: p.stage as ReqStage,
    requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: null, percent: EXAMPLE_PERCENT }] },
    sampleAccounts: sampleAccounts(),
  }, now);
}

// ---------------------------------------------------------------------------
// Text inputs

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string } | null;

const QTY_ERROR = "Digite um número inteiro como 1200000, 10.5m ou 300k.";

/** A well-formed quantity that parseQuantity refused only for its size (past the safe-integer range). */
function looksTooLarge(text: string): boolean {
  const m = /^(\d[\d,\s]*(?:\.\d+)?)\s*([kmb]?)$/i.exec(text.trim());
  if (!m) return false;
  const mult = { "": 1, k: 1e3, m: 1e6, b: 1e9 }[m[2]!.toLowerCase() as "" | "k" | "m" | "b"];
  return Number(m[1]!.replace(/[,\s]/g, "")) * mult > Number.MAX_SAFE_INTEGER;
}

/** Optional game quantity ("10.5m", "1,200,000"); null when empty. */
export function parseQty(text: string): Parsed<number> {
  if (!text.trim()) return null;
  const v = parseQuantity(text);
  if (v === null) return { ok: false, error: looksTooLarge(text) ? "Este número é grande demais." : QTY_ERROR };
  if (v > REQ_MAX_NUMBER) return { ok: false, error: "Este número é grande demais." };
  return { ok: true, value: v };
}

/** Percent such as "250" or "312.5" (a trailing % is allowed). */
export function parsePct(text: string): Parsed<number> {
  const s = text.trim().replace(/%$/, "").trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Digite uma porcentagem como 250." };
  const v = Number(s);
  if (v <= 0 || v > REQ_MAX_PERCENT) return { ok: false, error: `Digite mais que 0 e no máximo ${REQ_MAX_PERCENT.toLocaleString("pt-BR")}.` };
  return { ok: true, value: v };
}

/** Group percent of the normal target, e.g. "80" (a trailing % is allowed). Bounds only; the value is the council's. */
export function parseGroupPct(text: string): Parsed<number> {
  const s = text.trim().replace(/%$/, "").trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Digite uma porcentagem como 80." };
  const v = Number(s);
  if (v <= 0 || v > REQ_GROUP_MAX_PERCENT) return { ok: false, error: `Digite mais que 0 e no máximo ${REQ_GROUP_MAX_PERCENT.toLocaleString("pt-BR")}.` };
  return { ok: true, value: v };
}

export const errorOf =(p: Parsed<unknown>): string | undefined => (p && !p.ok ? p.error : undefined);
export const valueOf = <T>(p: Parsed<T>): T | null => (p && p.ok ? p.value : null);

const qtyText = (n: number | null | undefined): string => (typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "");

// ---------------------------------------------------------------------------
// Form state (strings, as typed) ↔ card

export interface BandRow { key: string; min: string; max: string; pct: string }
export interface GroupRow { key: string; id: string; name: string; pct: string }
export interface SampleRow { id: string; name: string; values: Record<FormulaVar, string> }

export interface CardForm {
  id: string;
  kingdom: string;
  title: string;
  stage: ReqStage;
  stageOther: string;
  formula: string;
  presetId: string | null;
  mode: "percent" | "fixed";
  bands: BandRow[];
  fixed: string;
  /** Deads on excluded days don't count (K2779 rule, B08-0001). */
  excludedOn: boolean;
  excludedLabel: string;
  /** Requirement groups (B08-0002); every value typed by the council. */
  groups: GroupRow[];
  powerBasis: string;
  notes: string;
  samples: SampleRow[];
  compare: string;
}

let keySeq = 0;
export const rowKey = (): string => `k${++keySeq}`;

export function statsToValues(stats: FormulaVars): Record<FormulaVar, string> {
  return Object.fromEntries(FORMULA_VARS.map((v) => [v, qtyText(stats[v])])) as Record<FormulaVar, string>;
}

export function emptyBand(min = ""): BandRow {
  return { key: rowKey(), min, max: "", pct: "" };
}

/** Short random id for a new group, unique among `taken` (players' saved picks refer to it). */
export function newGroupId(taken: readonly string[], rnd: () => number = Math.random): string {
  for (;;) {
    const id = `g${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, "0")}`;
    if (!taken.includes(id)) return id;
  }
}

export function emptyGroup(taken: readonly string[]): GroupRow {
  return { key: rowKey(), id: newGroupId(taken), name: "", pct: "" };
}

export function emptySample(n: number): SampleRow {
  return { id: newDocId(), name: `Exemplo ${String.fromCharCode(65 + (n % 26))}`, values: statsToValues({}) };
}

export function cardToForm(c: RequirementsCard): CardForm {
  return {
    id: c.id,
    kingdom: c.kingdom,
    title: c.title,
    stage: c.stage,
    stageOther: c.stageOther,
    formula: c.formula,
    presetId: c.presetId,
    mode: c.requirement.mode,
    bands: c.requirement.mode === "percent"
      ? c.requirement.bands.map((b) => ({ key: rowKey(), min: qtyText(b.minPower), max: b.maxPower === null ? "" : qtyText(b.maxPower), pct: String(b.percent) }))
      : [{ key: rowKey(), min: "0", max: "", pct: String(EXAMPLE_PERCENT) }],
    fixed: c.requirement.mode === "fixed" ? qtyText(c.requirement.target) : "",
    excludedOn: c.excludedDeads.enabled,
    excludedLabel: c.excludedDeads.label,
    groups: c.groups.map((g) => ({ key: rowKey(), id: g.id, name: g.name, pct: String(g.percent) })),
    powerBasis: c.powerBasis,
    notes: c.notes,
    samples: c.sampleAccounts.map((s) => ({ id: s.id, name: s.name, values: statsToValues(s.stats) })),
    compare: c.compareFormula,
  };
}

export interface FormCheck {
  card: RequirementsCard;
  /** Field errors keyed by input id suffix, e.g. "fixed", "band-0-min", "group-0-pct", "sample-<id>-t4". Band issues tied to a field appear here too. */
  errors: Record<string, string>;
  bandIssues: BandIssue[];
}

/** Build a card from the form; errors list every field that blocks saving or publishing. */
export function formToCard(f: CardForm, now: Date = new Date()): FormCheck {
  const errors: Record<string, string> = {};
  const bands: PowerBand[] = [];
  let bandIssues: BandIssue[] = [];
  if (f.mode === "percent") {
    f.bands.forEach((b, i) => {
      const min = b.min.trim() ? parseQty(b.min) : { ok: true as const, value: 0 };
      const max = parseQty(b.max);
      const pct = parsePct(b.pct);
      if (errorOf(min)) errors[`band-${i}-min`] = errorOf(min)!;
      if (errorOf(max)) errors[`band-${i}-max`] = errorOf(max)!;
      if (errorOf(pct)) errors[`band-${i}-pct`] = errorOf(pct)!;
      else if (!pct) errors[`band-${i}-pct`] = "Digite a porcentagem do poder para esta faixa.";
      bands.push({ minPower: valueOf(min) ?? 0, maxPower: valueOf(max), percent: valueOf(pct) ?? 0 });
    });
    if (Object.keys(errors).length === 0) bandIssues = validateBands(bands);
    if (f.bands.length === 0) bandIssues = validateBands([]);
    // Tie each band issue to the input at fault (aria-invalid + its own message under the field).
    for (const x of bandIssues) {
      if (x.index < 0 || !x.field) continue;
      const k = `band-${x.index}-${x.field}`;
      if (!errors[k]) errors[k] = x.message;
    }
  }
  const groups: RequirementGroup[] = [];
  const groupRows = f.groups.slice(0, REQ_MAX_GROUPS);
  groupRows.forEach((g, i) => {
    const pct = parseGroupPct(g.pct);
    if (!g.name.trim()) errors[`group-${i}-name`] = "Digite um nome para este grupo.";
    if (errorOf(pct)) errors[`group-${i}-pct`] = errorOf(pct)!;
    else if (!pct) errors[`group-${i}-pct`] = "Digite a porcentagem da meta normal.";
    groups.push({ id: g.id, name: g.name, percent: valueOf(pct) ?? 0 });
  });
  for (const x of validateGroups(groups)) {
    const k = `group-${x.index}-${x.field}`;
    if (!errors[k]) errors[k] = x.message;
  }
  const fixed = parseQty(f.fixed);
  if (f.mode === "fixed") {
    if (errorOf(fixed)) errors.fixed = errorOf(fixed)!;
    else if (!fixed) errors.fixed = "Digite a meta de DKP.";
  }
  const samples: SampleAccount[] = f.samples.slice(0, REQ_MAX_SAMPLES).map((s) => {
    const stats: FormulaVars = {};
    for (const v of FORMULA_VARS) {
      const p = parseQty(s.values[v] ?? "");
      if (errorOf(p)) errors[`sample-${s.id}-${v}`] = errorOf(p)!;
      const x = valueOf(p);
      if (x !== null) stats[v] = x;
    }
    return { id: s.id, name: s.name.replace(/\s+/g, " ").trim().slice(0, 40), stats };
  });
  const card = parseRequirementsCard({
    id: f.id,
    updatedAt: now.toISOString(),
    kingdom: f.kingdom,
    title: f.title,
    stage: f.stage,
    stageOther: f.stageOther,
    formula: f.formula,
    presetId: f.presetId,
    requirement: f.mode === "fixed" ? { mode: "fixed", target: valueOf(fixed) ?? 0 } : { mode: "percent", bands },
    excludedDeads: { enabled: f.excludedOn, label: f.excludedLabel },
    groups,
    powerBasis: f.powerBasis,
    notes: f.notes,
    sampleAccounts: samples,
    compareFormula: f.compare,
  })!;
  return { card, errors, bandIssues };
}

/** Text title for the store list. */
export function cardTitle(c: Pick<RequirementsCard, "title" | "kingdom">): string {
  return c.title || (c.kingdom ? `Requisitos de ${c.kingdom}` : "Cartão de requisitos sem título");
}

// ---------------------------------------------------------------------------
// Store

export function listCards(st: StorageLike | null): RequirementsCard[] {
  return listDocs("requirements", st).map((d) => parseRequirementsCard({ ...(isRecord(d.data) ? d.data : {}), id: d.id, updatedAt: d.updatedAt })).filter((c): c is RequirementsCard => c !== null);
}

export function saveCard(card: RequirementsCard, st: StorageLike | null): void {
  saveDoc({ id: card.id, kind: "requirements", title: cardTitle(card), data: card }, st);
}

export function deleteCard(id: string, st: StorageLike | null): void {
  removeDoc(id, st);
}

/** Publish link for players: /kingdom/my/#d=... (sample accounts never included). */
export async function publishLink(card: RequirementsCard, origin?: string): Promise<string> {
  const code = await encodeShare(SHARE_KIND, cardSharePayload(card));
  return shareUrl(MY_PATH, code, origin);
}

// ---------------------------------------------------------------------------
// My requirements (player side)

export interface MyRequirementsDoc {
  card: RequirementsCard;
  /** Raw text the player typed, per variable. */
  myStats: Partial<Record<FormulaVar, string>>;
  /** true when the player built the card themselves (no council link). */
  selfMade: boolean;
  /** Raw text for "Deads on excluded days" (only used when the card's rule is on). */
  excludedDeads?: string;
  /** Id of the requirement group the player picked on this card. */
  group?: string;
}

export function parseMyDoc(x: unknown): MyRequirementsDoc | null {
  if (!isRecord(x)) return null;
  const card = parseRequirementsCard(x.card);
  if (!card) return null;
  const myStats: Partial<Record<FormulaVar, string>> = {};
  if (isRecord(x.myStats)) {
    for (const v of FORMULA_VARS) {
      const s = x.myStats[v];
      if (typeof s === "string") myStats[v] = s.slice(0, 30);
    }
  }
  const doc: MyRequirementsDoc = { card: { ...card, sampleAccounts: [], compareFormula: "" }, myStats, selfMade: x.selfMade === true };
  if (typeof x.excludedDeads === "string") doc.excludedDeads = x.excludedDeads.slice(0, 30);
  if (typeof x.group === "string" && card.groups.some((g) => g.id === x.group)) doc.group = x.group;
  return doc;
}

/** "Deads on excluded days" as typed: null when empty, an error when it is not a quantity or exceeds the deads. */
export function parseExcluded(text: string, deads: number | null): Parsed<number> {
  const p = parseQty(text);
  if (!p || !p.ok) return p;
  const issue = excludedDeadsIssue(deads ?? 0, p.value);
  return issue ? { ok: false, error: issue } : p;
}

export function saveMine(doc: MyRequirementsDoc, st: StorageLike | null): void {
  const card = { ...doc.card, sampleAccounts: [], compareFormula: "" };
  saveDoc({ id: `my-${card.id}`.slice(0, 64), kind: "my-requirements", title: cardTitle(card), data: { ...doc, card } }, st);
}

/** The most recently saved My requirements document on this device. */
export function latestMine(st: StorageLike | null): MyRequirementsDoc | null {
  for (const d of listDocs("my-requirements", st)) {
    const m = parseMyDoc(d.data);
    if (m) return m;
  }
  return null;
}

export const MAX_BANDS = REQ_MAX_BANDS;
export const MAX_GROUPS = REQ_MAX_GROUPS;

// ---------------------------------------------------------------------------
// Sandbox roster as CSV (stays on this device; never in the published link)

/** Roster columns: name, then every formula variable (power first). */
export const ROSTER_VARS: readonly FormulaVar[] = ["power", ...FORMULA_VARS.filter((v) => v !== "power")];

/** The sample accounts with their stats and the card's verdict, one row each. */
export function rosterToCsv(card: Pick<RequirementsCard, "formula" | "requirement" | "sampleAccounts">): string {
  const header = ["name", ...ROSTER_VARS, "dkp", "target", "percent_of_target", "result"];
  const rows = card.sampleAccounts.map((s) => {
    const r = evaluatePlayer(card, s.stats);
    const verdict = r.ok ? [r.dkp, r.target, r.percentOfTarget === null ? null : Math.floor(r.percentOfTarget), r.met === null ? "no band" : r.met ? "pass" : "below"] : [null, null, null, "formula error"];
    return [s.name, ...ROSTER_VARS.map((v) => s.stats[v] ?? null), ...verdict];
  });
  return toCsv(header, rows);
}

const ROSTER_COLUMNS = {
  name: ["name", "governor", "account", "player", "nome", "governador", "conta", "jogador"],
  power: ["power"], t1: ["t1", "t1 kills"], t2: ["t2", "t2 kills"], t3: ["t3", "t3 kills"], t4: ["t4", "t4 kills"], t5: ["t5", "t5 kills"],
  deads: ["deads", "dead", "dead troops"], kp: ["kp", "kill points", "killpoints"],
} as const;

export interface RosterImport {
  samples: SampleRow[];
  added: number;
  updated: number;
  /** Rows left out because the sandbox holds REQ_MAX_SAMPLES accounts. */
  overLimit: number;
  errors: Array<{ line: number; message: string }>;
}

/**
 * Merge a roster CSV into the sandbox rows: same name (any case) updates the values it carries,
 * new names are added up to REQ_MAX_SAMPLES. Values stay text and are checked like typed ones.
 * Throws with a user-facing message when the file has no "name" column or cannot be read.
 */
export function rosterFromCsv(current: readonly SampleRow[], text: string, makeId: () => string = newDocId): RosterImport {
  const t = readCsvTable(text, ROSTER_COLUMNS, ["name"]);
  if (!t.ok) throw new Error(t.error);
  const samples = current.map((s) => ({ ...s, values: { ...s.values } }));
  const errors: RosterImport["errors"] = [];
  let added = 0, updated = 0, overLimit = 0;
  for (const { line, values } of t.records) {
    const name = values.name.replace(/\s+/g, " ").trim();
    if (!name) { errors.push({ line, message: "Nenhum nome nesta linha." }); continue; }
    if (name.length > 40) { errors.push({ line, message: "O nome tem mais de 40 caracteres." }); continue; }
    const bad = ROSTER_VARS.filter((v) => values[v] && errorOf(parseQty(values[v])));
    if (bad.length) { errors.push({ line, message: `Não é um número: ${bad.join(", ")}.` }); continue; }
    const i = samples.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
    if (i >= 0) {
      for (const v of ROSTER_VARS) if (values[v]) samples[i]!.values[v] = values[v];
      updated++;
    } else if (samples.length >= REQ_MAX_SAMPLES) overLimit++;
    else {
      const row: SampleRow = { id: makeId(), name, values: statsToValues({}) };
      for (const v of ROSTER_VARS) if (values[v]) row.values[v] = values[v];
      samples.push(row);
      added++;
    }
  }
  return { samples, added, updated, overLimit, errors };
}
