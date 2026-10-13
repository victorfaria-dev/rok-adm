// F-69 Farm-to-main shipment ledger: entries, totals, ISO weeks, CSV export. Pure.
import { RESOURCES, isResource, type Resource } from "./farms-common";
import { grossForNet, netForGross } from "./farms-trading-post";

export interface ShipmentEntry {
  id: string;
  farmId: string;
  /** YYYY-MM-DD. */
  date: string;
  resource: Resource;
  /** Amount the farm sent (before tax). */
  gross: number;
  /** 0..<1 (0.21 = 21%). */
  taxRate: number;
  /** Amount the main received. */
  net: number;
  note?: string;
}

export interface ShipmentInput {
  id: string;
  farmId: string;
  date: string;
  resource: Resource;
  taxRate: number;
  /** Give gross (net is computed) or net (gross is computed). Gross wins when both are given. */
  gross?: number | null;
  net?: number | null;
  note?: string | null;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === s;
}

export function makeShipment(input: ShipmentInput): ShipmentEntry {
  if (typeof input.id !== "string" || input.id === "") throw new RangeError("id is required");
  if (typeof input.farmId !== "string" || input.farmId === "") throw new RangeError("farmId is required");
  if (!isIsoDate(input.date)) throw new RangeError("date must be YYYY-MM-DD");
  if (!isResource(input.resource)) throw new RangeError(`unknown resource: ${String(input.resource)}`);
  let gross: number;
  let net: number;
  if (input.gross !== null && input.gross !== undefined) {
    gross = input.gross;
    net = netForGross(gross, input.taxRate);
  } else if (input.net !== null && input.net !== undefined) {
    net = input.net;
    gross = grossForNet(net, input.taxRate);
  } else {
    throw new RangeError("give gross or net");
  }
  const entry: ShipmentEntry = { id: input.id, farmId: input.farmId, date: input.date, resource: input.resource, gross, taxRate: input.taxRate, net };
  const note = input.note?.trim();
  if (note) entry.note = note;
  return entry;
}

export interface Totals { gross: number; net: number; tax: number }

export interface LedgerSummary {
  from: string | null;
  to: string | null;
  count: number;
  total: Totals;
  byResource: Record<Resource, Totals>;
  /** farmId → totals overall and per resource. */
  byFarm: Record<string, { total: Totals; byResource: Record<Resource, Totals> }>;
}

const zero = (): Totals => ({ gross: 0, net: 0, tax: 0 });
const perResource = (): Record<Resource, Totals> => Object.fromEntries(RESOURCES.map((r) => [r, zero()])) as Record<Resource, Totals>;
function add(t: Totals, e: ShipmentEntry): void {
  t.gross += e.gross;
  t.net += e.net;
  t.tax += e.gross - e.net;
}

export interface DateRange { from?: string | null; to?: string | null }

function inRange(date: string, r: DateRange): boolean {
  return (!r.from || date >= r.from) && (!r.to || date <= r.to);
}

/** Totals by farm × resource and overall, for entries with from ≤ date ≤ to (inclusive; open ends allowed). */
export function summarizeLedger(entries: readonly ShipmentEntry[], range: DateRange = {}): LedgerSummary {
  if (range.from && !isIsoDate(range.from)) throw new RangeError("from must be YYYY-MM-DD");
  if (range.to && !isIsoDate(range.to)) throw new RangeError("to must be YYYY-MM-DD");
  const s: LedgerSummary = { from: range.from ?? null, to: range.to ?? null, count: 0, total: zero(), byResource: perResource(), byFarm: Object.create(null) as LedgerSummary["byFarm"] };
  for (const e of entries) {
    if (!inRange(e.date, range)) continue;
    s.count++;
    add(s.total, e);
    add(s.byResource[e.resource], e);
    const f = (s.byFarm[e.farmId] ??= { total: zero(), byResource: perResource() });
    add(f.total, e);
    add(f.byResource[e.resource], e);
  }
  return s;
}

/** Net received on `date`, optionally for one farm and/or one resource (feeds goalProgress). */
export function shippedNet(entries: readonly ShipmentEntry[], q: { date: string; farmId?: string | null; resource?: Resource | null }): number {
  return entries
    .filter((e) => e.date === q.date && (!q.farmId || e.farmId === q.farmId) && (!q.resource || e.resource === q.resource))
    .reduce((n, e) => n + e.net, 0);
}

/** Monday (YYYY-MM-DD) of the ISO week that contains `date`. */
export function weekOf(date: string): string {
  if (!isIsoDate(date)) throw new RangeError("date must be YYYY-MM-DD");
  const d = new Date(`${date}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

/** Monday..Sunday range of the ISO week that contains `date`. */
export function weekRange(date: string): { from: string; to: string } {
  const from = weekOf(date);
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return { from, to: d.toISOString().slice(0, 10) };
}

// ---------------------------------------------------------------------------
// CSV (RFC 4180, CRLF) with a guard against spreadsheet formula injection.

export const LEDGER_CSV_HEADER = ["date", "farm", "resource", "gross", "tax_rate", "net", "note"] as const;

/** Text cells starting with = + - @ TAB or CR are prefixed with ' so spreadsheets do not run them. */
export function csvSafeText(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function csvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ledgerToCsv(entries: readonly ShipmentEntry[], farmNames: Readonly<Record<string, string>> = {}): string {
  const text = (s: string) => csvField(csvSafeText(s));
  const rows = [LEDGER_CSV_HEADER.join(",")];
  for (const e of entries) {
    rows.push([
      text(e.date),
      text(Object.hasOwn(farmNames, e.farmId) ? String(farmNames[e.farmId]) : e.farmId),
      text(e.resource),
      String(e.gross),
      String(e.taxRate),
      String(e.net),
      text(e.note ?? ""),
    ].join(","));
  }
  return rows.join("\r\n") + "\r\n";
}
