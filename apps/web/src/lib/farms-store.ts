// Farm hub device-local state: its own versioned localStorage key (separate from ko:v1).
// Every read is tolerant: missing, corrupted or blocked storage falls back to defaults,
// and a malformed farm or shipment is dropped on its own instead of losing everything.
// Only types come from @rokadm/planner, so this module adds no planner code to a bundle.
import type { DailyMarks, FarmFocus, FarmGoal, Resource, ShipmentEntry } from "@rokadm/planner";

export const FARMS_KEY = "ko:farms:v1";
export const FARMS_EXPORT_APP = "kingdomops-farms";
export const MAX_FARMS = 10;
/** Oldest shipments are dropped beyond this. */
export const MAX_SHIPMENTS = 2000;
export const FARM_NAME_MAX = 40;
export const FARM_NOTE_MAX = 200;

const RESOURCE_LIST: readonly Resource[] = ["food", "wood", "stone", "gold"];
const FOCUS_LIST: readonly FarmFocus[] = ["general", ...RESOURCE_LIST];

export type FarmLevelField = "cityHall" | "tradingPost" | "goldmine" | "academy" | "commanderLevel";
/** Accepted range per level field (integers); anything else is stored as null. */
export const FARM_LEVEL_RANGES: Readonly<Record<FarmLevelField, readonly [number, number]>> = {
  cityHall: [1, 25],
  tradingPost: [1, 25],
  goldmine: [1, 25],
  academy: [1, 25],
  commanderLevel: [1, 60],
};
const LEVEL_FIELDS = Object.keys(FARM_LEVEL_RANGES) as FarmLevelField[];

export type FarmLevelsState = Record<FarmLevelField, number | null>;

export interface Farm {
  id: string;
  /** Trimmed, 1..40 chars. */
  name: string;
  /** What the farm mainly gathers. */
  role: FarmFocus;
  /** Free text, max 200 chars. */
  note: string;
  levels: FarmLevelsState;
  /** ISO time the farm's marches come back, or null. */
  gatheringUntil: string | null;
  daily: DailyMarks | null;
  goal: FarmGoal | null;
  /** ISO time. */
  createdAt: string;
}

export interface FarmsStoreV1 {
  v: 1;
  farms: Farm[];
  shipments: ShipmentEntry[];
  /** Show hypothesis-only advice (e.g. the food + wood farm). */
  showHypotheses: boolean;
}

export function defaultFarmsStore(): FarmsStoreV1 {
  return { v: 1, farms: [], shipments: [], showHypotheses: false };
}

export function emptyLevels(): FarmLevelsState {
  return { cityHall: null, tradingPost: null, goldmine: null, academy: null, commanderLevel: null };
}

// ---------------------------------------------------------------------------
// Parsing

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const nonEmptyString = (x: unknown): x is string => typeof x === "string" && x.length > 0;
const isAmount = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0;
const isResource = (x: unknown): x is Resource => RESOURCE_LIST.includes(x as Resource);
const isFocus = (x: unknown): x is FarmFocus => FOCUS_LIST.includes(x as FarmFocus);

/** true for a real calendar date written YYYY-MM-DD. */
export function isIsoDay(x: unknown): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}
const isIsoTime = (x: unknown): x is string => typeof x === "string" && x.length > 0 && Number.isFinite(Date.parse(x));

/** Trimmed name if valid (1..40 chars), else null. */
export function cleanFarmName(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const s = x.trim();
  return s.length >= 1 && s.length <= FARM_NAME_MAX ? s : null;
}

function cleanLevel(field: FarmLevelField, x: unknown): number | null {
  const [min, max] = FARM_LEVEL_RANGES[field];
  return typeof x === "number" && Number.isInteger(x) && x >= min && x <= max ? x : null;
}

function parseLevels(x: unknown): FarmLevelsState {
  const out = emptyLevels();
  if (!isRecord(x)) return out;
  for (const f of LEVEL_FIELDS) out[f] = cleanLevel(f, x[f]);
  return out;
}

function parseDaily(x: unknown): DailyMarks | null {
  if (!isRecord(x) || !isIsoDay(x.date) || !Array.isArray(x.done)) return null;
  return { date: x.date, done: [...new Set(x.done.filter((d): d is string => nonEmptyString(d)))] };
}

function parseGoal(x: unknown): FarmGoal | null {
  if (!isRecord(x) || !isResource(x.resource) || !isAmount(x.amount)) return null;
  return { resource: x.resource, amount: x.amount };
}

/** A farm, or null when it cannot be kept (no id or no usable name). Other bad fields get defaults. */
export function parseFarm(x: unknown): Farm | null {
  if (!isRecord(x) || !nonEmptyString(x.id)) return null;
  const rawName = typeof x.name === "string" ? x.name.trim().slice(0, FARM_NAME_MAX) : "";
  const name = cleanFarmName(rawName);
  if (!name) return null;
  return {
    id: x.id,
    name,
    role: isFocus(x.role) ? x.role : "general",
    note: typeof x.note === "string" ? x.note.trim().slice(0, FARM_NOTE_MAX) : "",
    levels: parseLevels(x.levels),
    gatheringUntil: isIsoTime(x.gatheringUntil) ? x.gatheringUntil : null,
    daily: parseDaily(x.daily),
    goal: parseGoal(x.goal),
    createdAt: isIsoTime(x.createdAt) ? x.createdAt : new Date(0).toISOString(),
  };
}

/** A shipment, or null when any required field is malformed. */
export function parseShipment(x: unknown): ShipmentEntry | null {
  if (!isRecord(x) || !nonEmptyString(x.id) || !nonEmptyString(x.farmId) || !isIsoDay(x.date) || !isResource(x.resource)) return null;
  if (!isAmount(x.gross) || !isAmount(x.net) || x.net > x.gross) return null;
  if (typeof x.taxRate !== "number" || !Number.isFinite(x.taxRate) || x.taxRate < 0 || x.taxRate >= 1) return null;
  const e: ShipmentEntry = { id: x.id, farmId: x.farmId, date: x.date, resource: x.resource, gross: x.gross, taxRate: x.taxRate, net: x.net };
  if (typeof x.note === "string" && x.note.trim()) e.note = x.note.trim().slice(0, FARM_NOTE_MAX);
  return e;
}

/** Normalise parsed values: drop bad/duplicate entries and apply the caps. */
function normalise(data: Record<string, unknown>): FarmsStoreV1 {
  const s = defaultFarmsStore();
  if (Array.isArray(data.farms)) {
    const seen = new Set<string>();
    for (const raw of data.farms) {
      const f = parseFarm(raw);
      if (!f || seen.has(f.id)) continue;
      seen.add(f.id);
      s.farms.push(f);
      if (s.farms.length >= MAX_FARMS) break;
    }
  }
  if (Array.isArray(data.shipments)) {
    const seen = new Set<string>();
    for (const raw of data.shipments) {
      const e = parseShipment(raw);
      if (!e || seen.has(e.id)) continue;
      seen.add(e.id);
      s.shipments.push(e);
    }
    if (s.shipments.length > MAX_SHIPMENTS) s.shipments = s.shipments.slice(-MAX_SHIPMENTS);
  }
  if (typeof data.showHypotheses === "boolean") s.showHypotheses = data.showHypotheses;
  return s;
}

/** Parse stored JSON; anything missing or malformed gets its default. */
export function parseFarmsStore(raw: string | null | undefined): FarmsStoreV1 {
  if (!raw) return defaultFarmsStore();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return defaultFarmsStore();
  }
  if (!isRecord(data) || data.v !== 1) return defaultFarmsStore();
  return normalise(data);
}

// ---------------------------------------------------------------------------
// Storage

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readFarms(st: StorageLike | null = storage()): FarmsStoreV1 {
  try {
    return parseFarmsStore(st?.getItem(FARMS_KEY));
  } catch {
    return defaultFarmsStore();
  }
}

/** Merge a patch into the stored state (normalised and capped). Returns the new state, also when storage is unavailable. */
export function writeFarms(patch: Partial<Omit<FarmsStoreV1, "v">>, st: StorageLike | null = storage()): FarmsStoreV1 {
  const next = normalise({ ...readFarms(st), ...patch } as unknown as Record<string, unknown>);
  try {
    st?.setItem(FARMS_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep working in memory for this page.
  }
  return next;
}

export function clearFarms(st: StorageLike | null = storage()): void {
  try {
    st?.removeItem(FARMS_KEY);
  } catch {
    // ignore
  }
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Farms

export interface NewFarmInput {
  name: string;
  role?: FarmFocus;
  note?: string;
  levels?: Partial<FarmLevelsState>;
}

/** Adds a farm. Throws with a message the user can act on (bad name, limit reached). */
export function addFarm(input: NewFarmInput, st: StorageLike | null = storage(), now: Date = new Date()): { store: FarmsStoreV1; farm: Farm } {
  const s = readFarms(st);
  if (s.farms.length >= MAX_FARMS) throw new Error(`Você pode acompanhar até ${MAX_FARMS} contas farm. Remova uma primeiro.`);
  const name = cleanFarmName(input.name);
  if (!name) throw new Error(`Dê um nome à conta farm (1 a ${FARM_NAME_MAX} caracteres).`);
  const farm = parseFarm({
    id: newId(), name, role: input.role ?? "general", note: input.note ?? "",
    levels: { ...emptyLevels(), ...input.levels }, gatheringUntil: null, daily: null, goal: null, createdAt: now.toISOString(),
  });
  if (!farm) throw new Error("Não foi possível criar a conta farm.");
  return { store: writeFarms({ farms: [...s.farms, farm] }, st), farm };
}

export type FarmPatch = Partial<Omit<Farm, "id" | "createdAt" | "levels">> & { levels?: Partial<FarmLevelsState> };

/** Updates one farm. Unknown id → unchanged state. Throws when the new name is invalid. */
export function updateFarm(id: string, patch: FarmPatch, st: StorageLike | null = storage()): FarmsStoreV1 {
  const s = readFarms(st);
  const i = s.farms.findIndex((f) => f.id === id);
  const cur = s.farms[i];
  if (!cur) return s;
  if (patch.name !== undefined && !cleanFarmName(patch.name)) throw new Error(`Dê um nome à conta farm (1 a ${FARM_NAME_MAX} caracteres).`);
  const merged = parseFarm({ ...cur, ...patch, id: cur.id, createdAt: cur.createdAt, levels: { ...cur.levels, ...patch.levels } });
  if (!merged) return s;
  const farms = [...s.farms];
  farms[i] = merged;
  return writeFarms({ farms }, st);
}

/** Removes a farm and its shipments (the ledger stays consistent with the farm list). */
export function removeFarm(id: string, st: StorageLike | null = storage()): FarmsStoreV1 {
  const s = readFarms(st);
  return writeFarms({ farms: s.farms.filter((f) => f.id !== id), shipments: s.shipments.filter((e) => e.farmId !== id) }, st);
}

// ---------------------------------------------------------------------------
// Shipments

/** Appends a shipment (build it with makeShipment from @rokadm/planner). Oldest are dropped past MAX_SHIPMENTS. */
export function addShipment(entry: ShipmentEntry, st: StorageLike | null = storage()): FarmsStoreV1 {
  const e = parseShipment(entry);
  if (!e) throw new Error("Este envio não é válido.");
  const s = readFarms(st);
  return writeFarms({ shipments: [...s.shipments.filter((x) => x.id !== e.id), e] }, st);
}

export function removeShipment(id: string, st: StorageLike | null = storage()): FarmsStoreV1 {
  const s = readFarms(st);
  return writeFarms({ shipments: s.shipments.filter((e) => e.id !== id) }, st);
}

// ---------------------------------------------------------------------------
// Export / import

const NOT_EXPORT = "Este arquivo não é uma exportação de contas farm do KingdomOps. Escolha o arquivo .json que você exportou da página Contas farm.";

export function exportFarms(s: FarmsStoreV1): string {
  return JSON.stringify({ app: FARMS_EXPORT_APP, ...s }, null, 2);
}

/** Import a previously exported file. Throws with a message the user can act on. */
export function importFarms(text: string): FarmsStoreV1 {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(NOT_EXPORT);
  }
  if (!isRecord(data) || data.app !== FARMS_EXPORT_APP) throw new Error(NOT_EXPORT);
  if (data.v !== 1) throw new Error("Esta exportação de contas farm tem uma versão que este app não consegue ler.");
  return normalise(data);
}
