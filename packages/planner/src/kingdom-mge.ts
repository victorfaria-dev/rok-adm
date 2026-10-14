// F-35 MGE planner v0: a council's own ranking/rotation plan and a public, view-only ledger.
// Sources: B05-0002 ("fixed MGE": a published list of who may take the top N ranks), B05-0003
// (breaking ranks is punished), B05-0004 (DKP used as currency for ranks), pains D-0505/D-0506.
// How a "rotation" works in practice is not described anywhere (gap L-B05-02), so the rotation
// rule here is the planner's own, plain and checkable: longest wait since the last slot.
// No MGE point or reward value is sourced, so none appears here. Pure functions, no fact data.

import { cleanLine, formatInt, isRecord, readQuantity, type KingdomDocBase } from "./kingdom-common";

/** Confidence of a fact card as written in its file (`confianca:`), and the English label shown. */
export type CardConfidence = "alta" | "media" | "baixa";
export const CONFIDENCE_LABEL: Readonly<Record<CardConfidence, string>> = { alta: "high", media: "medium", baixa: "low" };

export interface KingdomSource {
  id: string;
  /** Pinned to the card file by a unit test, so drift fails the build. */
  confidence: CardConfidence;
  text: string;
}

/** Cards the MGE planner page cites. */
export const MGE_SOURCES: readonly KingdomSource[] = [
  { id: "B05-0002", confidence: "media", text: "Muitos reinos publicam uma lista fixa de quem pode ficar com as primeiras posições do MGE (geralmente 10), por DKP, função ou rodízio." },
  { id: "B05-0003", confidence: "baixa", text: "Governadores que quebram um MGE fixo são punidos (expulsos, zerados ou multados)." },
  { id: "B05-0004", confidence: "media", text: "Alguns reinos leiloam as posições do MGE por DKP." },
];

export type MgePolicy = "rotation" | "score" | "manual";
export const MGE_POLICIES: readonly MgePolicy[] = ["rotation", "score", "manual"];

export const MGE_LIMITS = {
  slotsMin: 1,
  slotsMax: 20,
  slotsDefault: 10,
  cooldownMax: 10,
  candidates: 300,
  events: 60,
  name: 40,
  commander: 40,
  reason: 200,
  title: 80,
  tags: 5,
  tag: 24,
} as const;

/** Common roles kingdoms give fixed MGE slots to (B05-0002). Any short tag is accepted. */
export const MGE_TAG_SUGGESTIONS = ["rally lead", "garrison lead"] as const;

export interface MgeCandidate {
  id: string;
  name: string;
  /** The council's own contribution number (e.g. DKP). null = not entered. */
  score: number | null;
  tags: string[];
}

export interface MgeOverride {
  /** 1-based slot (rank) number. */
  slot: number;
  candidateId: string;
  /** Why the council placed this governor by hand. Required. */
  reason: string;
}

export type MgeSource = "rotation" | "score" | "manual";

export interface MgeAssignment {
  slot: number;
  candidateId: string;
  /** Name at planning time (kept so a locked event still reads right if the candidate is removed). */
  name: string;
  source: MgeSource;
  /** Full reason, may contain the score. */
  reason: string;
  /** Reason without the score, for a public link that leaves scores out. */
  publicReason: string;
  /** Score used when the slot was given by score policy, else null. */
  score: number | null;
}

export interface MgeEvent {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** Commander of the event, as typed by the council. */
  commander: string;
  applicants: string[];
  overrides: MgeOverride[];
  locked: boolean;
  /** Stored ledger of a locked event (history). null while the event is open. */
  result: MgeAssignment[] | null;
}

export interface MgeDoc extends KingdomDocBase {
  title: string;
  slotsPerEvent: number;
  policy: MgePolicy;
  /** Rotation only: events a governor waits after getting a slot before being eligible again. */
  cooldownEvents: number;
  /** When true, only governors listed as applicants of an event can get a slot in it. */
  applicationsRequired: boolean;
  candidates: MgeCandidate[];
  events: MgeEvent[];
}

export type MgeWarningCode =
  | "duplicate_name"
  | "no_score"
  | "override_on_cooldown"
  | "override_not_applicant"
  | "override_unknown"
  | "override_conflict"
  | "unfilled";

export interface MgeWarning {
  code: MgeWarningCode;
  message: string;
  eventId?: string;
  candidateId?: string;
}

export interface MgeEventPlan {
  eventId: string;
  date: string;
  commander: string;
  locked: boolean;
  assignments: MgeAssignment[];
  /** Slot numbers nobody got. */
  unfilled: number[];
  warnings: MgeWarning[];
}

export interface MgePlan {
  events: MgeEventPlan[];
  /** Plan-wide warnings (duplicate names, missing scores). */
  warnings: MgeWarning[];
}

/** Plain-language explanation of each policy (UI and public ledger). */
export const MGE_POLICY_TEXT: Readonly<Record<MgePolicy, { label: string; text: string }>> = {
  rotation: {
    label: "Rodízio",
    text: "As vagas vão para os governadores que esperam há mais tempo desde a última vaga. Quem nunca teve uma vem primeiro. Depois de receber uma vaga, o governador fica de fora durante o período de espera antes de poder ser escolhido de novo.",
  },
  score: {
    label: "Pontuação",
    text: "As vagas vão para as maiores pontuações, usando o número que o seu conselho mantém (por exemplo, DKP). Governadores sem pontuação informada não são colocados.",
  },
  manual: {
    label: "Manual",
    text: "O conselho coloca cada vaga à mão e escreve o motivo de cada uma.",
  },
};

export function emptyMgeDoc(id: string, now: Date = new Date()): MgeDoc {
  return {
    id,
    updatedAt: now.toISOString(),
    title: "Plano de MGE",
    slotsPerEvent: MGE_LIMITS.slotsDefault,
    policy: "rotation",
    cooldownEvents: 1,
    applicationsRequired: false,
    candidates: [],
    events: [],
  };
}

// ---------------------------------------------------------------------------
// Tolerant parsing

const intIn = (x: unknown, min: number, max: number, dflt: number): number =>
  typeof x === "number" && Number.isInteger(x) && x >= min && x <= max ? x : dflt;

/** A real calendar day written YYYY-MM-DD. */
export function isDay(x: unknown): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

const isId = (x: unknown): x is string => typeof x === "string" && x.length > 0 && x.length <= 64;
const isScore = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= Number.MAX_SAFE_INTEGER;

function parseTags(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  const out: string[] = [];
  for (const t of x) {
    const s = cleanLine(t, MGE_LIMITS.tag).toLowerCase();
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= MGE_LIMITS.tags) break;
  }
  return out;
}

export function parseCandidate(x: unknown): MgeCandidate | null {
  if (!isRecord(x) || !isId(x.id)) return null;
  const name = cleanLine(x.name, MGE_LIMITS.name);
  if (!name) return null;
  return { id: x.id, name, score: isScore(x.score) ? Math.round(x.score) : null, tags: parseTags(x.tags) };
}

const isSource = (x: unknown): x is MgeSource => x === "rotation" || x === "score" || x === "manual";

function parseAssignment(x: unknown): MgeAssignment | null {
  if (!isRecord(x) || !isId(x.candidateId) || !isSource(x.source)) return null;
  const slot = intIn(x.slot, 1, MGE_LIMITS.slotsMax, 0);
  const name = cleanLine(x.name, MGE_LIMITS.name);
  if (!slot || !name) return null;
  const reason = cleanLine(x.reason, MGE_LIMITS.reason + 40);
  const publicReason = cleanLine(x.publicReason, MGE_LIMITS.reason + 40) || reason;
  return { slot, candidateId: x.candidateId, name, source: x.source, reason, publicReason, score: isScore(x.score) ? x.score : null };
}

function parseEvent(x: unknown, known: Set<string>): MgeEvent | null {
  if (!isRecord(x) || !isId(x.id) || !isDay(x.date)) return null;
  const applicants = Array.isArray(x.applicants) ? [...new Set(x.applicants.filter((a): a is string => typeof a === "string" && known.has(a)))] : [];
  const overrides: MgeOverride[] = [];
  if (Array.isArray(x.overrides)) {
    for (const o of x.overrides) {
      if (!isRecord(o) || typeof o.candidateId !== "string" || !known.has(o.candidateId)) continue;
      const slot = intIn(o.slot, 1, MGE_LIMITS.slotsMax, 0);
      const reason = cleanLine(o.reason, MGE_LIMITS.reason);
      if (!slot || !reason) continue;
      overrides.push({ slot, candidateId: o.candidateId, reason });
    }
  }
  const locked = x.locked === true;
  let result: MgeAssignment[] | null = null;
  if (locked && Array.isArray(x.result)) {
    const seen = new Set<number>();
    result = [];
    for (const r of x.result) {
      const a = parseAssignment(r);
      if (a && !seen.has(a.slot)) {
        seen.add(a.slot);
        result.push(a);
      }
    }
    result.sort((a, b) => a.slot - b.slot);
  }
  return { id: x.id, date: x.date, commander: cleanLine(x.commander, MGE_LIMITS.commander), applicants, overrides, locked, result };
}

/** Tolerant parse of a stored or imported MGE plan; bad fields get defaults, bad rows are dropped. */
export function parseMgeDoc(x: unknown, fallbackId = "mge"): MgeDoc {
  const r = isRecord(x) ? x : {};
  const base = emptyMgeDoc(isId(r.id) ? r.id : fallbackId, new Date(0));
  const slots = intIn(r.slotsPerEvent, MGE_LIMITS.slotsMin, MGE_LIMITS.slotsMax, MGE_LIMITS.slotsDefault);
  const candidates: MgeCandidate[] = [];
  const ids = new Set<string>();
  if (Array.isArray(r.candidates)) {
    for (const c of r.candidates) {
      const p = parseCandidate(c);
      if (p && !ids.has(p.id)) {
        ids.add(p.id);
        candidates.push(p);
      }
      if (candidates.length >= MGE_LIMITS.candidates) break;
    }
  }
  const events: MgeEvent[] = [];
  const eids = new Set<string>();
  if (Array.isArray(r.events)) {
    for (const e of r.events) {
      const p = parseEvent(e, ids);
      if (p && !eids.has(p.id)) {
        eids.add(p.id);
        events.push(p);
      }
      if (events.length >= MGE_LIMITS.events) break;
    }
  }
  return {
    id: base.id,
    updatedAt: typeof r.updatedAt === "string" && Number.isFinite(Date.parse(r.updatedAt)) ? r.updatedAt : base.updatedAt,
    title: cleanLine(r.title, MGE_LIMITS.title) || base.title,
    slotsPerEvent: slots,
    policy: MGE_POLICIES.includes(r.policy as MgePolicy) ? (r.policy as MgePolicy) : base.policy,
    cooldownEvents: intIn(r.cooldownEvents, 0, MGE_LIMITS.cooldownMax, base.cooldownEvents),
    applicationsRequired: r.applicationsRequired === true,
    candidates,
    events,
  };
}

// ---------------------------------------------------------------------------
// Pasted lists

export interface LineError {
  /** 1-based line number in the pasted text. */
  line: number;
  text: string;
  message: string;
}

const NUMBER_TEXT = /^\d[\d.,\s]*[kmb]?$/i;
const looksNumeric = (t: string): boolean => NUMBER_TEXT.test(t.trim());

/**
 * Split one pasted line into name and score text (Q2 P2-2). Accepted shapes:
 * - tab-separated cells (a spreadsheet row): the first cell that is not a number is the name, the
 *   first number after it is the score ("1\tDave\t80\t3" → Dave, 80);
 * - "Name; score";
 * - "Name, score", where the score may have thousands commas ("Bob, 1,200,000");
 * - "Name score" with the number last ("Dave 80", "Ann 1.5m").
 * A separator followed by something that is not a number is reported as `problem` instead of being
 * folded into the name, so "Charlie, lots" never becomes a governor called "Charlie, lots".
 */
export function splitNameAndNumber(line: string): { name: string; number: string | null; problem?: string } {
  const s = line.trim();
  if (s.includes("\t")) {
    const cells = s.split("\t").map((c) => c.trim()).filter(Boolean);
    const at = cells.findIndex((c) => !looksNumeric(c));
    if (at < 0) return { name: "", number: cells[0] ?? null };
    const score = cells.slice(at + 1).find(looksNumeric) ?? null;
    const rest = cells.slice(at + 1);
    if (score === null && rest.length > 0) return { name: cells[at]!, number: null, problem: "As colunas depois do nome não têm pontuação. Ponha a pontuação na segunda coluna (por exemplo Dave<TAB>4.2m)." };
    return { name: cells[at]!, number: score };
  }
  const semi = s.lastIndexOf(";");
  if (semi >= 0) {
    const name = s.slice(0, semi).trim(), num = s.slice(semi + 1).trim();
    if (!num) return { name, number: null };
    if (!looksNumeric(num)) return { name: s, number: null, problem: "A parte depois de \";\" não é uma pontuação (use 4200000, 4.200.000 ou 4.2m)." };
    return { name, number: num };
  }
  const comma = /^(.*?)\s*,\s*(\d[\d.,\s]*[kmb]?)\s*$/i.exec(s);
  if (comma && comma[1]!.trim()) return { name: comma[1]!.trim(), number: comma[2]!.trim() };
  if (comma) return { name: "", number: comma[2]!.trim() };
  if (s.includes(",")) {
    const after = s.slice(s.lastIndexOf(",") + 1).trim();
    if (after) return { name: s, number: null, problem: "A parte depois da última vírgula não é uma pontuação (use 4200000, 4.200.000 ou 4.2m)." };
    return { name: s.slice(0, s.lastIndexOf(",")).trim(), number: null };
  }
  const space = /^(.*\S)\s+(\d[\d.,]*[kmb]?)$/i.exec(s);
  if (space) return { name: space[1]!, number: space[2]! };
  return { name: s, number: null };
}

/**
 * Parse a pasted candidate list, one governor per line: "Name, score", "Name; score", "Name<TAB>score"
 * or "Name score" (score optional, 1.5m shorthand allowed). Lines that cannot be read are reported.
 */
export function parseCandidateLines(text: string): { rows: Array<{ name: string; score: number | null }>; errors: LineError[] } {
  const rows: Array<{ name: string; score: number | null }> = [];
  const errors: LineError[] = [];
  text.split(/\r\n?|\n/).forEach((raw, i) => {
    if (!raw.trim()) return;
    const { name, number, problem } = splitNameAndNumber(raw);
    const text = raw.trim().replace(/\t/g, " ");
    if (problem) return void errors.push({ line: i + 1, text, message: problem });
    const clean = cleanLine(name, MGE_LIMITS.name + 1);
    if (!clean) return void errors.push({ line: i + 1, text, message: "Não há nome nesta linha." });
    if (clean.length > MGE_LIMITS.name) return void errors.push({ line: i + 1, text, message: `O nome tem mais de ${MGE_LIMITS.name} caracteres.` });
    let score: number | null = null;
    if (number !== null) {
      const r = parseMgeScore(number);
      if (!r.ok) return void errors.push({ line: i + 1, text, message: r.tooBig ? r.message : "A pontuação não é um número (use 4200000, 4.200.000 ou 4.2m)." });
      score = r.score;
    }
    rows.push({ name: clean, score });
  });
  return { rows, errors };
}

// ---------------------------------------------------------------------------
// Typed governor fields (add form and inline edit)

export const MGE_SCORE_HELP = "Digite um número inteiro, por exemplo 4200000, 4.200.000 ou 4.2m.";

/**
 * A score typed by the council. Empty = no score. Anything that is not a whole number, or is above
 * Number.MAX_SAFE_INTEGER (where JavaScript numbers stop being exact), is refused at entry.
 */
export function parseMgeScore(text: string): { ok: true; score: number | null } | { ok: false; tooBig: boolean; message: string } {
  if (!text.trim()) return { ok: true, score: null };
  // readQuantity only reports "too_large" for well-formed numbers: "1.5m" (decimal comma) is a format error.
  const r = readQuantity(text);
  if (r.ok) return { ok: true, score: r.value };
  if (r.error === "too_large") return { ok: false, tooBig: true, message: `A pontuação é grande demais (no máximo ${formatInt(Number.MAX_SAFE_INTEGER)}).` };
  return { ok: false, tooBig: false, message: MGE_SCORE_HELP };
}

/** Comma-separated tags, lower case, duplicates dropped. Too many or too long is an error, not a silent cut. */
export function parseMgeTagsText(text: string): { tags: string[]; error?: string } {
  const tags: string[] = [];
  for (const t of text.split(",")) {
    const s = cleanLine(t, 1000).toLowerCase();
    if (!s) continue;
    if (s.length > MGE_LIMITS.tag) return { tags, error: `Cada tag pode ter no máximo ${MGE_LIMITS.tag} caracteres ("${s.slice(0, MGE_LIMITS.tag)}…").` };
    if (!tags.includes(s)) tags.push(s);
  }
  if (tags.length > MGE_LIMITS.tags) return { tags: tags.slice(0, MGE_LIMITS.tags), error: `Use no máximo ${MGE_LIMITS.tags} tags.` };
  return { tags };
}

export interface MgeCandidateInput {
  name: string;
  score: string;
  tags: string;
}

export type MgeCandidateErrors = Partial<Record<keyof MgeCandidateInput, string>>;

/** Check the three typed fields of a governor. */
export function readCandidateInput(input: MgeCandidateInput): { ok: true; name: string; score: number | null; tags: string[] } | { ok: false; errors: MgeCandidateErrors } {
  const errors: MgeCandidateErrors = {};
  const name = cleanLine(input.name, MGE_LIMITS.name + 1);
  if (!name) errors.name = "Digite o nome do governador.";
  else if (name.length > MGE_LIMITS.name) errors.name = `Use no máximo ${MGE_LIMITS.name} caracteres.`;
  const score = parseMgeScore(input.score);
  if (!score.ok) errors.score = score.message;
  const tags = parseMgeTagsText(input.tags);
  if (tags.error) errors.tags = tags.error;
  if (errors.name || errors.score || errors.tags || !score.ok) return { ok: false, errors };
  return { ok: true, name, score: score.score, tags: tags.tags };
}

export type UpdateCandidateResult =
  | { ok: true; doc: MgeDoc; candidate: MgeCandidate; previousName: string; duplicate: boolean }
  | { ok: false; errors: MgeCandidateErrors };

/**
 * Edit an existing governor's name, score and tags. The id stays, so applicants, manual placements
 * and rotation history stay attached. Locked events keep the name stored when they were locked.
 * Renaming to a name already listed is allowed (the plan shows the duplicate-name warning).
 */
export function updateCandidate(doc: MgeDoc, candidateId: string, input: MgeCandidateInput): UpdateCandidateResult {
  const i = doc.candidates.findIndex((c) => c.id === candidateId);
  if (i < 0) return { ok: false, errors: { name: "Este governador não está mais no plano." } };
  const r = readCandidateInput(input);
  if (!r.ok) return r;
  const previousName = doc.candidates[i]!.name;
  const candidate: MgeCandidate = { id: candidateId, name: r.name, score: r.score, tags: r.tags };
  const candidates = [...doc.candidates];
  candidates[i] = candidate;
  const k = r.name.toLowerCase();
  const duplicate = candidates.some((c) => c.id !== candidateId && c.name.toLowerCase() === k);
  return { ok: true, doc: { ...doc, candidates }, candidate, previousName, duplicate };
}

// ---------------------------------------------------------------------------
// Planning

const byNameThenId = (a: MgeCandidate, b: MgeCandidate): number => {
  const n = a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  if (n !== 0) return n;
  return a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/** Events in ledger order: by date, then by position in the plan (stable). */
export function orderedEvents(doc: Pick<MgeDoc, "events">): MgeEvent[] {
  return doc.events.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i)).map((x) => x.e);
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Who a score rank is counted among, written out so the ledger is exact: "" when every listed
 * governor competes, else " entre os candidatos", " entre os governadores não colocados à mão" or both.
 */
export function scoreRankScope(applicationsRequired: boolean, someoneManual: boolean): string {
  if (applicationsRequired && someoneManual) return " entre os candidatos não colocados à mão";
  if (applicationsRequired) return " entre os candidatos";
  if (someoneManual) return " entre os governadores não colocados à mão";
  return "";
}

/**
 * Deterministic ledger for every event, in date order. Locked events keep their stored result
 * (history) and still count toward rotation. Ties break by name, then id.
 */
export function planMge(doc: MgeDoc): MgePlan {
  const warnings: MgeWarning[] = [];
  const byId = new Map(doc.candidates.map((c) => [c.id, c]));

  const names = new Map<string, MgeCandidate[]>();
  for (const c of doc.candidates) {
    const k = c.name.toLowerCase();
    names.set(k, [...(names.get(k) ?? []), c]);
  }
  for (const list of names.values()) {
    if (list.length > 1) warnings.push({ code: "duplicate_name", message: `${plural(list.length, "candidato")} com o nome "${list[0]!.name}". Renomeie um deles para o registro ficar claro.`, candidateId: list[1]!.id });
  }
  if (doc.policy === "score") {
    for (const c of doc.candidates) {
      if (c.score === null) warnings.push({ code: "no_score", message: `${c.name} não tem pontuação, então a política por pontuação não consegue colocá-lo.`, candidateId: c.id });
    }
  }

  /** Index (in ledger order) of the last event where each candidate got a slot. */
  const last = new Map<string, { index: number; date: string }>();
  const slots = doc.slotsPerEvent;
  const events = orderedEvents(doc);
  const out: MgeEventPlan[] = [];

  const onCooldown = (id: string, index: number): boolean => {
    const l = last.get(id);
    return doc.cooldownEvents > 0 && l !== undefined && index - l.index <= doc.cooldownEvents;
  };

  events.forEach((ev, index) => {
    const ew: MgeWarning[] = [];
    let assignments: MgeAssignment[];

    if (ev.locked && ev.result) {
      assignments = ev.result.filter((a) => a.slot <= MGE_LIMITS.slotsMax);
    } else {
      assignments = [];
      const taken = new Set<string>();
      const usedSlots = new Set<number>();

      for (const o of ev.overrides) {
        const c = byId.get(o.candidateId);
        if (!c) {
          ew.push({ code: "override_unknown", message: `Uma colocação manual aponta para um candidato removido e foi ignorada.`, eventId: ev.id });
          continue;
        }
        if (o.slot > slots || usedSlots.has(o.slot) || taken.has(c.id)) {
          ew.push({ code: "override_conflict", message: `A colocação manual de ${c.name} na vaga ${o.slot} foi ignorada (a vaga ${o.slot > slots ? "passa do número de vagas" : "já está em uso"}${taken.has(c.id) ? ", ou o governador já foi colocado" : ""}).`, eventId: ev.id, candidateId: c.id });
          continue;
        }
        if (doc.policy === "rotation" && onCooldown(c.id, index)) {
          ew.push({ code: "override_on_cooldown", message: `${c.name} está no período de espera (última vaga em ${last.get(c.id)!.date}), mas foi colocado à mão: ${o.reason}`, eventId: ev.id, candidateId: c.id });
        }
        if (doc.applicationsRequired && !ev.applicants.includes(c.id)) {
          ew.push({ code: "override_not_applicant", message: `${c.name} não se candidatou a este evento, mas foi colocado à mão.`, eventId: ev.id, candidateId: c.id });
        }
        usedSlots.add(o.slot);
        taken.add(c.id);
        const reason = `manual: ${o.reason}`;
        assignments.push({ slot: o.slot, candidateId: c.id, name: c.name, source: "manual", reason, publicReason: reason, score: null });
      }

      const pool = doc.candidates.filter((c) => !taken.has(c.id) && (!doc.applicationsRequired || ev.applicants.includes(c.id)));
      const queue: Array<{ c: MgeCandidate; reason: string; publicReason: string; score: number | null }> = [];

      if (doc.policy === "rotation") {
        const eligible = pool.filter((c) => !onCooldown(c.id, index));
        const wait = (c: MgeCandidate): number => {
          const l = last.get(c.id);
          return l === undefined ? Number.POSITIVE_INFINITY : index - l.index;
        };
        eligible.sort((a, b) => {
          const wa = wait(a), wb = wait(b);
          return wa !== wb ? wb - wa : byNameThenId(a, b);
        });
        for (const c of eligible) {
          const l = last.get(c.id);
          const reason = l === undefined
            ? "rodízio: maior espera desde a última vaga (nunca teve uma)"
            : `rodízio: maior espera desde a última vaga (há ${plural(index - l.index, "evento")}, em ${l.date})`;
          queue.push({ c, reason, publicReason: reason, score: null });
        }
      } else if (doc.policy === "score") {
        const ranked = pool.filter((c) => c.score !== null).sort((a, b) => (b.score! !== a.score! ? b.score! - a.score! : byNameThenId(a, b)));
        // The rank is among the pool only (applicants, minus governors placed by hand): say so.
        const among = scoreRankScope(doc.applicationsRequired, taken.size > 0);
        ranked.forEach((c, i) => {
          const rank = `posição ${i + 1} por pontuação${among}`;
          queue.push({ c, reason: `${rank} (${formatInt(c.score!)})`, publicReason: rank, score: c.score });
        });
      }

      let qi = 0;
      for (let slot = 1; slot <= slots; slot++) {
        if (usedSlots.has(slot)) continue;
        const next = queue[qi++];
        if (!next) break;
        assignments.push({ slot, candidateId: next.c.id, name: next.c.name, source: doc.policy, reason: next.reason, publicReason: next.publicReason, score: next.score });
      }
      assignments.sort((a, b) => a.slot - b.slot);
    }

    const filled = new Set(assignments.map((a) => a.slot));
    const unfilled: number[] = [];
    for (let s = 1; s <= slots; s++) if (!filled.has(s)) unfilled.push(s);
    if (unfilled.length > 0) {
      ew.push({ code: "unfilled", message: `${plural(unfilled.length, "vaga")} sem preencher: ${unfilled.join(", ")}.`, eventId: ev.id });
    }
    for (const a of assignments) last.set(a.candidateId, { index, date: ev.date });
    out.push({ eventId: ev.id, date: ev.date, commander: ev.commander, locked: ev.locked && ev.result !== null, assignments, unfilled, warnings: ew });
  });

  return { events: out, warnings };
}

/** Lock an event: store its current computed result as history. Unlocking clears the stored result. */
export function setEventLocked(doc: MgeDoc, eventId: string, locked: boolean): MgeDoc {
  const plan = locked ? planMge(doc) : null;
  return {
    ...doc,
    events: doc.events.map((e) => {
      if (e.id !== eventId) return e;
      if (!locked) return { ...e, locked: false, result: null };
      const p = plan!.events.find((x) => x.eventId === eventId);
      return { ...e, locked: true, result: p ? p.assignments.map((a) => ({ ...a })) : [] };
    }),
  };
}

/** Remove a candidate everywhere (applicants, overrides). Locked history keeps the stored name. */
export function removeCandidate(doc: MgeDoc, candidateId: string): MgeDoc {
  return {
    ...doc,
    candidates: doc.candidates.filter((c) => c.id !== candidateId),
    events: doc.events.map((e) => ({
      ...e,
      applicants: e.applicants.filter((a) => a !== candidateId),
      overrides: e.overrides.filter((o) => o.candidateId !== candidateId),
    })),
  };
}

// ---------------------------------------------------------------------------
// Public ledger (share link payload)

export interface MgePublicSlot {
  slot: number;
  name: string;
  reason: string;
  /** Present only when the council chose to include scores. */
  score?: number;
}

export interface MgePublicEvent {
  date: string;
  commander: string;
  locked: boolean;
  slots: MgePublicSlot[];
  unfilled: number[];
}

export interface MgePublic {
  title: string;
  policy: MgePolicy;
  slotsPerEvent: number;
  cooldownEvents: number;
  applicationsRequired: boolean;
  includeScores: boolean;
  /** YYYY-MM-DD the council published this link. */
  publishedOn: string;
  events: MgePublicEvent[];
}

/** What goes into the public link: names, slots and reasons; scores only when asked. */
export function mgePublicPayload(doc: MgeDoc, includeScores: boolean, publishedOn: string, plan: MgePlan = planMge(doc)): MgePublic {
  return {
    title: doc.title,
    policy: doc.policy,
    slotsPerEvent: doc.slotsPerEvent,
    cooldownEvents: doc.cooldownEvents,
    applicationsRequired: doc.applicationsRequired,
    includeScores,
    publishedOn,
    events: plan.events.map((e) => ({
      date: e.date,
      commander: e.commander,
      locked: e.locked,
      slots: e.assignments.map((a) => {
        const s: MgePublicSlot = { slot: a.slot, name: a.name, reason: includeScores ? a.reason : a.publicReason };
        if (includeScores && a.score !== null) s.score = a.score;
        return s;
      }),
      unfilled: e.unfilled,
    })),
  };
}

/** Tolerant parse of a decoded public ledger; null when it is not one. */
export function parseMgePublic(x: unknown): MgePublic | null {
  if (!isRecord(x) || !Array.isArray(x.events) || !MGE_POLICIES.includes(x.policy as MgePolicy)) return null;
  const slotsPerEvent = intIn(x.slotsPerEvent, MGE_LIMITS.slotsMin, MGE_LIMITS.slotsMax, MGE_LIMITS.slotsDefault);
  const includeScores = x.includeScores === true;
  const events: MgePublicEvent[] = [];
  for (const e of x.events.slice(0, MGE_LIMITS.events)) {
    if (!isRecord(e) || !isDay(e.date)) continue;
    const slots: MgePublicSlot[] = [];
    const seen = new Set<number>();
    if (Array.isArray(e.slots)) {
      for (const s of e.slots) {
        if (!isRecord(s)) continue;
        const slot = intIn(s.slot, 1, MGE_LIMITS.slotsMax, 0);
        const name = cleanLine(s.name, MGE_LIMITS.name);
        if (!slot || !name || seen.has(slot)) continue;
        seen.add(slot);
        const ps: MgePublicSlot = { slot, name, reason: cleanLine(s.reason, MGE_LIMITS.reason + 40) };
        if (includeScores && isScore(s.score)) ps.score = s.score;
        slots.push(ps);
      }
    }
    slots.sort((a, b) => a.slot - b.slot);
    const unfilled: number[] = [];
    for (let i = 1; i <= slotsPerEvent; i++) if (!seen.has(i)) unfilled.push(i);
    events.push({ date: e.date, commander: cleanLine(e.commander, MGE_LIMITS.commander), locked: e.locked === true, slots, unfilled });
  }
  return {
    title: cleanLine(x.title, MGE_LIMITS.title) || "Plano de MGE",
    policy: x.policy as MgePolicy,
    slotsPerEvent,
    cooldownEvents: intIn(x.cooldownEvents, 0, MGE_LIMITS.cooldownMax, 0),
    applicationsRequired: x.applicationsRequired === true,
    includeScores,
    publishedOn: isDay(x.publishedOn) ? x.publishedOn : "",
    events,
  };
}

/** One sentence describing the rules a ledger used (view page and plan summary). */
export function describeMgeRules(p: Pick<MgeDoc, "policy" | "slotsPerEvent" | "cooldownEvents" | "applicationsRequired">): string {
  const parts = [`${plural(p.slotsPerEvent, "vaga")} por evento (definição do conselho).`, MGE_POLICY_TEXT[p.policy].text];
  if (p.policy === "rotation") {
    parts.push(p.cooldownEvents === 0 ? "Sem período de espera: um governador pode receber vagas em eventos seguidos." : `Período de espera: ${plural(p.cooldownEvents, "evento")} depois de uma vaga.`);
  }
  parts.push(p.applicationsRequired ? "Só governadores que se candidataram a um evento podem receber uma vaga nele." : "Todo governador da lista é considerado; não é preciso candidatura.");
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// CSV export (RFC 4180, CRLF, UTF-8 with BOM) with a guard against spreadsheet formula injection.
// Same rules as csv.ts (csvSafeText/csvField); a unit test pins the two to the same output.

/** Byte-order mark so spreadsheet apps open the file as UTF-8 (names with accents, CJK, emoji). */
export const MGE_CSV_BOM = "\uFEFF";
export const MGE_LEDGER_CSV_HEADER = ["date", "commander", "slot", "governor", "reason", "locked"] as const;
export const MGE_GOVERNORS_CSV_HEADER = ["name", "score", "tags"] as const;

/** Text cells starting with = + - @ TAB or CR get a leading ' so spreadsheets do not run them. */
export function mgeCsvSafeText(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Quote a cell when it holds a comma, a quote or a line break; quotes are doubled. */
export function mgeCsvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const csvText = (s: string): string => mgeCsvField(mgeCsvSafeText(s));
const csvDoc = (rows: string[][]): string => MGE_CSV_BOM + rows.map((r) => r.join(",")).join("\r\n") + "\r\n";

/**
 * Ledger CSV, oldest event first, one row per slot (unfilled slots included, governor empty).
 * Scores (a "score" column, and the score inside score-policy reasons) only when `includeScores`.
 */
export function mgeLedgerCsv(plan: MgePlan, includeScores: boolean): string {
  const header: string[] = [...MGE_LEDGER_CSV_HEADER];
  if (includeScores) header.push("score");
  const rows: string[][] = [header];
  const events = [...plan.events].map((e, i) => ({ e, i })).sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i));
  for (const { e } of events) {
    const slots: Array<{ slot: number; a: MgeAssignment | null }> = [
      ...e.assignments.map((a) => ({ slot: a.slot, a })),
      ...e.unfilled.map((slot) => ({ slot, a: null })),
    ].sort((x, y) => x.slot - y.slot);
    for (const { slot, a } of slots) {
      const row = [
        csvText(e.date),
        csvText(e.commander),
        String(slot),
        csvText(a ? a.name : ""),
        csvText(a ? (includeScores ? a.reason : a.publicReason) : "not filled"),
        e.locked ? "yes" : "no",
      ];
      if (includeScores) row.push(a && a.score !== null ? String(a.score) : "");
      rows.push(row);
    }
  }
  return csvDoc(rows);
}

/** Governors CSV in list order: name, score (empty when not entered), tags joined with "; ". */
export function mgeGovernorsCsv(doc: Pick<MgeDoc, "candidates">): string {
  const rows: string[][] = [[...MGE_GOVERNORS_CSV_HEADER]];
  for (const c of doc.candidates) rows.push([csvText(c.name), c.score === null ? "" : String(c.score), csvText(c.tags.join("; "))]);
  return csvDoc(rows);
}
