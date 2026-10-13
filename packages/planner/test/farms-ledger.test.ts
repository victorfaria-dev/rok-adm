import { describe, expect, it } from "vitest";
import {
  makeShipment, summarizeLedger, shippedNet, weekOf, weekRange, ledgerToCsv, isIsoDate,
  LEDGER_CSV_HEADER, type ShipmentEntry,
} from "../src/farms-ledger";
import { csvField, csvSafeText } from "../src/csv";

const ship = (over: Partial<Parameters<typeof makeShipment>[0]> = {}) =>
  makeShipment({ id: "s1", farmId: "f1", date: "2026-10-13", resource: "food", taxRate: 0.21, gross: 1000, ...over });

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2026-10-13")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-1")).toBe(false);
    expect(isIsoDate("2026-10-13T00:00:00Z")).toBe(false);
    expect(isIsoDate(20261013)).toBe(false);
  });
});

describe("makeShipment", () => {
  it("computes net from gross", () => {
    expect(ship()).toEqual({ id: "s1", farmId: "f1", date: "2026-10-13", resource: "food", gross: 1000, taxRate: 0.21, net: 790 });
  });

  it("computes gross from net", () => {
    const e = ship({ gross: null, net: 790 });
    expect(e.gross).toBe(1000);
    expect(e.net).toBe(790);
  });

  it("gross wins when both are given", () => {
    expect(ship({ gross: 1000, net: 1 }).net).toBe(790);
  });

  it("keeps a trimmed note, drops an empty one", () => {
    expect(ship({ note: "  for healing  " }).note).toBe("for healing");
    expect("note" in ship({ note: "   " })).toBe(false);
  });

  it("zero shipment is allowed", () => {
    expect(ship({ gross: 0 })).toMatchObject({ gross: 0, net: 0 });
  });

  it("validates", () => {
    expect(() => ship({ gross: null, net: null })).toThrow(/gross or net/);
    expect(() => ship({ gross: -1 })).toThrow(RangeError);
    expect(() => ship({ gross: Number.NaN })).toThrow(RangeError);
    expect(() => ship({ taxRate: 1 })).toThrow(RangeError);
    expect(() => ship({ date: "13/10/2026" })).toThrow(RangeError);
    expect(() => ship({ resource: "gems" as never })).toThrow(RangeError);
    expect(() => ship({ id: "" })).toThrow(RangeError);
    expect(() => ship({ farmId: "" })).toThrow(RangeError);
  });
});

describe("summarizeLedger", () => {
  const entries: ShipmentEntry[] = [
    ship({ id: "a", farmId: "f1", date: "2026-10-12", resource: "food", gross: 1000 }),
    ship({ id: "b", farmId: "f1", date: "2026-10-13", resource: "wood", gross: 2000 }),
    ship({ id: "c", farmId: "f2", date: "2026-10-14", resource: "food", gross: 500, taxRate: 0.1 }),
  ];

  it("totals overall, by resource and by farm × resource", () => {
    const s = summarizeLedger(entries);
    expect(s.count).toBe(3);
    expect(s.total).toEqual({ gross: 3500, net: 790 + 1580 + 450, tax: 210 + 420 + 50 });
    expect(s.byResource.food).toEqual({ gross: 1500, net: 1240, tax: 260 });
    expect(s.byResource.gold).toEqual({ gross: 0, net: 0, tax: 0 });
    expect(s.byFarm["f1"]!.total.gross).toBe(3000);
    expect(s.byFarm["f1"]!.byResource.wood.net).toBe(1580);
    expect(s.byFarm["f2"]!.byResource.food.tax).toBe(50);
    expect(s.from).toBeNull();
  });

  it("filters by inclusive range, open ends allowed", () => {
    expect(summarizeLedger(entries, { from: "2026-10-13" }).count).toBe(2);
    expect(summarizeLedger(entries, { to: "2026-10-13" }).count).toBe(2);
    expect(summarizeLedger(entries, { from: "2026-10-13", to: "2026-10-13" }).count).toBe(1);
    expect(summarizeLedger(entries, { from: "2026-10-15" }).total).toEqual({ gross: 0, net: 0, tax: 0 });
  });

  it("empty ledger; bad range throws", () => {
    expect(summarizeLedger([]).count).toBe(0);
    expect(() => summarizeLedger(entries, { from: "yesterday" })).toThrow(RangeError);
  });

  it("odd farm ids do not collide with object internals", () => {
    const s = summarizeLedger([ship({ farmId: "__proto__" }), ship({ farmId: "constructor" })]);
    expect(Object.keys(s.byFarm).sort()).toEqual(["__proto__", "constructor"]);
    expect(s.byFarm["__proto__"]!.total.gross).toBe(1000);
  });

  it("shippedNet sums net for a day, farm and resource", () => {
    expect(shippedNet(entries, { date: "2026-10-13" })).toBe(1580);
    expect(shippedNet(entries, { date: "2026-10-13", farmId: "f2" })).toBe(0);
    expect(shippedNet(entries, { date: "2026-10-12", resource: "food", farmId: "f1" })).toBe(790);
    expect(shippedNet(entries, { date: "2026-10-12", resource: "wood" })).toBe(0);
  });
});

describe("weekOf / weekRange (ISO week, Monday start)", () => {
  it("Monday for every day of the week", () => {
    expect(weekOf("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(weekOf("2026-10-13")).toBe("2026-10-12");
    expect(weekOf("2026-10-18")).toBe("2026-10-12"); // Sunday
    expect(weekOf("2026-10-19")).toBe("2026-10-19");
  });

  it("crosses month and year boundaries", () => {
    expect(weekOf("2027-01-01")).toBe("2026-12-28");
    expect(weekOf("2024-03-01")).toBe("2024-02-26");
    expect(weekRange("2026-12-31")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });

  it("rejects bad dates", () => {
    expect(() => weekOf("2026-02-30")).toThrow(RangeError);
  });
});

describe("ledgerToCsv", () => {
  it("writes the header and rows with CRLF", () => {
    const csv = ledgerToCsv([ship()], { f1: "Farm A" });
    expect(csv).toBe("date,farm,resource,gross,tax_rate,net,note\r\n2026-10-13,Farm A,food,1000,0.21,790,\r\n");
    expect(LEDGER_CSV_HEADER.join(",")).toBe("date,farm,resource,gross,tax_rate,net,note");
  });

  it("empty ledger is just the header", () => {
    expect(ledgerToCsv([])).toBe("date,farm,resource,gross,tax_rate,net,note\r\n");
  });

  it("falls back to the farm id when no name is known", () => {
    expect(ledgerToCsv([ship({ farmId: "constructor" })]).split("\r\n")[1]).toMatch(/^2026-10-13,constructor,/);
  });

  it("quotes commas, quotes and newlines (RFC 4180)", () => {
    const csv = ledgerToCsv([ship({ note: 'say "hi", ok\nline 2' })], { f1: "Farm, A" });
    expect(csv.split("\r\n")[1]).toBe('2026-10-13,"Farm, A",food,1000,0.21,790,"say ""hi"", ok\nline 2"');
  });

  it("guards against formula injection in text cells", () => {
    for (const bad of ["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"]) expect(csvSafeText(bad)).toBe(`'${bad}`);
    expect(csvSafeText("ok=1")).toBe("ok=1");
    const csv = ledgerToCsv([ship({ note: "=HYPERLINK(\"x\")" })], { f1: "@farm" });
    const row = csv.split("\r\n")[1]!;
    expect(row).toContain(",'@farm,");
    expect(row.endsWith(`"'=HYPERLINK(""x"")"`)).toBe(true);
  });

  it("csvField leaves plain text alone", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a\rb")).toBe('"a\rb"');
  });
});
