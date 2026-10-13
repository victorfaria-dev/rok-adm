// F-35 MGE planner v0: a council's own ranking/rotation plan and a public, view-only ledger.
// Sources: B05-0002 ("fixed MGE": a published list of who may take the top N ranks), B05-0003
// (breaking ranks is punished), B05-0004 (DKP used as currency for ranks), pains D-0505/D-0506.
// How a "rotation" works in practice is not described anywhere (gap L-B05-02), so the rotation
// rule here is the planner's own, plain and checkable: longest wait since the last slot.
// No MGE point or reward value is sourced, so none appears here. Pure functions, no fact data.

import { cleanLine, formatInt, isRecord, parseQuantity, type KingdomDocBase } from "./kingdom-common";

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
  { id: "B05-0002", confidence: "media", text: "Many kingdoms publish a fixed list of who may take the top MGE ranks (often 10), by DKP, role or rotation." },
  { id: "B05-0003", confidence: "baixa", text: "Governors who break a fixed MGE are punished (kicked, zeroed or fined)." },
  { id: "B05-0004", confidence: "media", text: "Some kingdoms auction MGE ranks for DKP." },
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
    label: "Rotation",
    text: "Slots go to the governors who have waited longest since their last slot. Governors who never had one come first. After getting a slot, a governor sits out the cooldown before being eligible again.",
  },
  score: {
    label: "Score",
    text: "Slots go to the highest scores, using the number your council keeps (for example DKP). Governors with no score entered are not placed.",
  },
  manual: {
    label: "Manual",
    text: "The council places every slot by hand and writes the reason for each one.",
  },
};

export function emptyMgeDoc(id: string, now: Date = new Date()): MgeDoc {
  return {
    id,
    updatedAt: now.toISOString(),
    title: "MGE plan",
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

/**
 * Split "Name, 1,200,000" / "Name<TAB>4.2m" / "Name; 300k" into name and number text. The name is
 * the shortest prefix whose remainder is a number, so a score written with thousands commas works.
 * Returns number = null when the line has no trailing number.
 */
export function splitNameAndNumber(line: string): { name: string; number: string | null } {
  const s = line.trim();
  const m = /^(.*?)\s*[,;\t]\s*([0-9][0-9.,\s]*[kmbKMB]?)\s*$/.exec(s);
  if (m) return { name: m[1]!.trim(), number: m[2]!.trim() };
  return { name: s, number: null };
}

/** Parse a pasted candidate list, one "Name, score" per line (score optional). */
export function parseCandidateLines(text: string): { rows: Array<{ name: string; score: number | null }>; errors: LineError[] } {
  const rows: Array<{ name: string; score: number | null }> = [];
  const errors: LineError[] = [];
  text.split(/\r\n?|\n/).forEach((raw, i) => {
    if (!raw.trim()) return;
    const { name, number } = splitNameAndNumber(raw);
    const clean = cleanLine(name, MGE_LIMITS.name + 1);
    if (!clean) return void errors.push({ line: i + 1, text: raw.trim(), message: "No name on this line." });
    if (clean.length > MGE_LIMITS.name) return void errors.push({ line: i + 1, text: raw.trim(), message: `Name is longer than ${MGE_LIMITS.name} characters.` });
    let score: number | null = null;
    if (number !== null) {
      score = parseQuantity(number);
      if (score === null) return void errors.push({ line: i + 1, text: raw.trim(), message: "The score is not a number (use 4200000, 4,200,000 or 4.2m)." });
    }
    rows.push({ name: clean, score });
  });
  return { rows, errors };
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
    if (list.length > 1) warnings.push({ code: "duplicate_name", message: `${plural(list.length, "candidate")} share the name "${list[0]!.name}". Rename one so the ledger is clear.`, candidateId: list[1]!.id });
  }
  if (doc.policy === "score") {
    for (const c of doc.candidates) {
      if (c.score === null) warnings.push({ code: "no_score", message: `${c.name} has no score, so the score policy cannot place them.`, candidateId: c.id });
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
          ew.push({ code: "override_unknown", message: `A manual placement points to a removed candidate and was ignored.`, eventId: ev.id });
          continue;
        }
        if (o.slot > slots || usedSlots.has(o.slot) || taken.has(c.id)) {
          ew.push({ code: "override_conflict", message: `Manual placement of ${c.name} in slot ${o.slot} was ignored (slot ${o.slot > slots ? "is past the slot count" : "already used"}${taken.has(c.id) ? ", or governor already placed" : ""}).`, eventId: ev.id, candidateId: c.id });
          continue;
        }
        if (doc.policy === "rotation" && onCooldown(c.id, index)) {
          ew.push({ code: "override_on_cooldown", message: `${c.name} is on cooldown (last slot on ${last.get(c.id)!.date}) but was placed by hand: ${o.reason}`, eventId: ev.id, candidateId: c.id });
        }
        if (doc.applicationsRequired && !ev.applicants.includes(c.id)) {
          ew.push({ code: "override_not_applicant", message: `${c.name} did not apply for this event but was placed by hand.`, eventId: ev.id, candidateId: c.id });
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
            ? "rotation: longest wait since last slot (never had one)"
            : `rotation: longest wait since last slot (${plural(index - l.index, "event")} ago, on ${l.date})`;
          queue.push({ c, reason, publicReason: reason, score: null });
        }
      } else if (doc.policy === "score") {
        const ranked = pool.filter((c) => c.score !== null).sort((a, b) => (b.score! !== a.score! ? b.score! - a.score! : byNameThenId(a, b)));
        ranked.forEach((c, i) => queue.push({ c, reason: `score rank ${i + 1} (${formatInt(c.score!)})`, publicReason: `score rank ${i + 1}`, score: c.score }));
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
      ew.push({ code: "unfilled", message: `${plural(unfilled.length, "slot")} not filled: ${unfilled.join(", ")}.`, eventId: ev.id });
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
        const slot = intIn(s.slot, 1, slotsPerEvent, 0);
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
    title: cleanLine(x.title, MGE_LIMITS.title) || "MGE plan",
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
  const parts = [`${plural(p.slotsPerEvent, "slot")} per event, set by the council.`, MGE_POLICY_TEXT[p.policy].text];
  if (p.policy === "rotation") {
    parts.push(p.cooldownEvents === 0 ? "No cooldown: a governor can get slots in back-to-back events." : `Cooldown: ${plural(p.cooldownEvents, "event")} after a slot.`);
  }
  parts.push(p.applicationsRequired ? "Only governors who applied for an event can get a slot in it." : "Every listed governor is considered; no application needed.");
  return parts.join(" ");
}
