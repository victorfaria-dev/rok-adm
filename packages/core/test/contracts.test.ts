import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX,
  DOC_KINDS,
  FARM_NAME_MAX,
  GENERIC_DOC_MAX_DEPTH,
  GENERIC_STRING_MAX,
  INVITE_TTL_HOURS_DEFAULT,
  INVITE_TTL_HOURS_MAX,
  INVITE_USES_DEFAULT,
  INVITE_USES_MAX,
  KINGDOM_MAX,
  MAX_FARMS,
  ROUTES,
  SPACE_NAME_MAX,
  formatInviteCode,
  isDocId,
  isEntityId,
  isIsoDay,
  normalizeInviteCode,
  routePath,
  validateCreateInvite,
  validateCreateSpace,
  validateDocData,
  validateFarmsDoc,
  validateGenericDoc,
  validateJoin,
  validatePutDoc,
  type Issue,
  type Result,
} from "../src/index";

function issuesOf<T>(r: Result<T>): Issue[] {
  expect(r.ok).toBe(false);
  return r.ok ? [] : r.issues;
}
const paths = <T>(r: Result<T>) => issuesOf(r).map((i) => i.path);
function valueOf<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.issues)}`);
  return r.value;
}

// ---------------------------------------------------------------------------

describe("validateCreateSpace", () => {
  it("trims and defaults kingdom to null", () => {
    expect(valueOf(validateCreateSpace({ name: "  Reino 1234  ", displayName: " Rei " }))).toEqual({
      name: "Reino 1234",
      displayName: "Rei",
      kingdom: null,
    });
    expect(valueOf(validateCreateSpace({ name: "a", displayName: "b", kingdom: null })).kingdom).toBeNull();
    expect(valueOf(validateCreateSpace({ name: "a", displayName: "b", kingdom: 1234 })).kingdom).toBe(1234);
  });

  it("enforces length limits after trimming", () => {
    expect(validateCreateSpace({ name: "x".repeat(SPACE_NAME_MAX), displayName: "y".repeat(DISPLAY_NAME_MAX) }).ok).toBe(true);
    expect(paths(validateCreateSpace({ name: "x".repeat(SPACE_NAME_MAX + 1), displayName: "ok" }))).toEqual(["/name"]);
    expect(paths(validateCreateSpace({ name: "ok", displayName: "y".repeat(DISPLAY_NAME_MAX + 1) }))).toEqual(["/displayName"]);
    expect(paths(validateCreateSpace({ name: "   ", displayName: "ok" }))).toEqual(["/name"]);
    expect(validateCreateSpace({ name: `  ${"x".repeat(SPACE_NAME_MAX)}  `, displayName: "ok" }).ok).toBe(true);
  });

  it("rejects control characters and line separators", () => {
    for (const bad of ["a\nb", "a\u0000b", "a\u007fb", "a b", "a\tb"]) {
      expect(paths(validateCreateSpace({ name: bad, displayName: "ok" }))).toEqual(["/name"]);
    }
  });

  it("rejects unknown fields and non-objects", () => {
    expect(paths(validateCreateSpace({ name: "a", displayName: "b", role: "admin" }))).toEqual(["/role"]);
    expect(paths(validateCreateSpace(null))).toEqual([""]);
    expect(paths(validateCreateSpace([]))).toEqual([""]);
    expect(paths(validateCreateSpace({ name: 1, displayName: "b" }))).toEqual(["/name"]);
  });

  it("checks the kingdom range", () => {
    expect(validateCreateSpace({ name: "a", displayName: "b", kingdom: KINGDOM_MAX }).ok).toBe(true);
    for (const k of [0, -1, KINGDOM_MAX + 1, 1.5, "1234", Number.NaN]) {
      expect(paths(validateCreateSpace({ name: "a", displayName: "b", kingdom: k }))).toEqual(["/kingdom"]);
    }
  });
});

describe("invite codes and validateJoin", () => {
  it("normalizes case, spaces and dashes", () => {
    expect(normalizeInviteCode("abcd-efgh-jkmn")).toBe("ABCDEFGHJKMN");
    expect(normalizeInviteCode(" 2345 6789 ABCD ")).toBe("23456789ABCD");
    expect(formatInviteCode("ABCDEFGHJKMN")).toBe("ABCD-EFGH-JKMN");
    expect(normalizeInviteCode(formatInviteCode("ZYXWVTSRQPNM"))).toBe("ZYXWVTSRQPNM");
  });

  it("rejects ambiguous symbols, wrong length and non-strings", () => {
    for (const bad of ["ABCD-EFGH-JKMI", "ABCD-EFGH-JKML", "ABCD-EFGH-JKMO", "ABCD-EFGH-JKMU", "0BCD-EFGH-JKMN", "1BCD-EFGH-JKMN"]) {
      expect(normalizeInviteCode(bad)).toBeNull();
    }
    expect(normalizeInviteCode("ABCD-EFGH-JKM")).toBeNull();
    expect(normalizeInviteCode("ABCD-EFGH-JKMNP")).toBeNull();
    expect(normalizeInviteCode(`${"-".repeat(30)}ABCDEFGHJKMN`)).toBeNull(); // > 40 chars raw
    expect(normalizeInviteCode(123456789012)).toBeNull();
  });

  it("validates a join request", () => {
    expect(valueOf(validateJoin({ inviteCode: "abcd-efgh-jkmn", displayName: " Farm Lord " }))).toEqual({
      inviteCode: "ABCDEFGHJKMN",
      displayName: "Farm Lord",
    });
    expect(paths(validateJoin({ inviteCode: "nope", displayName: "x" }))).toEqual(["/inviteCode"]);
    expect(paths(validateJoin({ inviteCode: "ABCDEFGHJKMN", displayName: "" }))).toEqual(["/displayName"]);
    expect(paths(validateJoin({ inviteCode: "ABCDEFGHJKMN", displayName: "x", spaceId: "sp_x" }))).toEqual(["/spaceId"]);
  });
});

describe("validateCreateInvite", () => {
  it("applies defaults for a missing body", () => {
    const d = { ttlHours: INVITE_TTL_HOURS_DEFAULT, maxUses: INVITE_USES_DEFAULT };
    expect(valueOf(validateCreateInvite(undefined))).toEqual(d);
    expect(valueOf(validateCreateInvite(null))).toEqual(d);
    expect(valueOf(validateCreateInvite({}))).toEqual(d);
    expect(valueOf(validateCreateInvite({ ttlHours: 1 }))).toEqual({ ttlHours: 1, maxUses: INVITE_USES_DEFAULT });
  });

  it("enforces limits", () => {
    expect(valueOf(validateCreateInvite({ ttlHours: INVITE_TTL_HOURS_MAX, maxUses: INVITE_USES_MAX }))).toEqual({
      ttlHours: INVITE_TTL_HOURS_MAX,
      maxUses: INVITE_USES_MAX,
    });
    expect(paths(validateCreateInvite({ ttlHours: 0 }))).toEqual(["/ttlHours"]);
    expect(paths(validateCreateInvite({ ttlHours: INVITE_TTL_HOURS_MAX + 1 }))).toEqual(["/ttlHours"]);
    expect(paths(validateCreateInvite({ maxUses: INVITE_USES_MAX + 1 }))).toEqual(["/maxUses"]);
    expect(paths(validateCreateInvite({ maxUses: 2.5 }))).toEqual(["/maxUses"]);
    expect(paths(validateCreateInvite({ code: "x" }))).toEqual(["/code"]);
    expect(paths(validateCreateInvite("x"))).toEqual([""]);
  });
});

// ---------------------------------------------------------------------------
// farms document (ko:farms:v1 shape)

function farm(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    name: `Farm ${id.slice(0, 8)}`,
    role: "food",
    note: "",
    levels: { cityHall: 25, tradingPost: 20, goldmine: null, academy: 18, commanderLevel: 40 },
    gatheringUntil: "2026-10-13T18:30:00.000Z",
    daily: { date: "2026-10-13", done: ["gather", "shield"] },
    goal: { resource: "wood", amount: 5_000_000 },
    createdAt: "2026-10-01T12:00:00.000Z",
    ...over,
  };
}
function shipment(id: string, farmId: string, over: Record<string, unknown> = {}) {
  return { id, farmId, date: "2026-10-12", resource: "food", gross: 1_000_000, taxRate: 0.21, net: 790_000, ...over };
}
const sample = () => ({
  farms: [farm("6f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f"), farm("f2", { role: "general", goal: null, daily: null, gatheringUntil: null, note: "alt" })],
  shipments: [
    shipment("s1", "6f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f"),
    shipment("s2", "f2", { resource: "gold", gross: 0, net: 0, taxRate: 0, note: "teste" }),
  ],
});

describe("validateFarmsDoc", () => {
  it("accepts a ko:farms:v1-shaped document", () => {
    const v = valueOf(validateFarmsDoc(sample()));
    expect(v.farms).toHaveLength(2);
    expect(v.shipments).toHaveLength(2);
    expect(v.farms[1]).toMatchObject({ role: "general", goal: null, daily: null, gatheringUntil: null, note: "alt" });
    expect(v.shipments[1]?.note).toBe("teste");
    expect(v.shipments[0]).not.toHaveProperty("note");
    expect(validateDocData("farms", sample()).ok).toBe(true);
  });

  it("fills missing level fields with null", () => {
    const v = valueOf(validateFarmsDoc({ farms: [farm("a", { levels: { cityHall: 10 } })], shipments: [] }));
    expect(v.farms[0]?.levels).toEqual({ cityHall: 10, tradingPost: null, goldmine: null, academy: null, commanderLevel: null });
  });

  it("rejects duplicate ids", () => {
    const d = sample();
    d.farms[1] = farm("f2");
    d.farms.push(farm("f2"));
    expect(paths(validateFarmsDoc(d))).toContain("/data/farms/2/id");
    const e = sample();
    e.shipments.push(shipment("s1", "f2"));
    expect(paths(validateFarmsDoc(e))).toEqual(["/data/shipments/2/id"]);
  });

  it("rejects a shipment to an unknown farm", () => {
    const d = sample();
    d.shipments.push(shipment("s3", "ghost"));
    expect(paths(validateFarmsDoc(d))).toEqual(["/data/shipments/2/farmId"]);
  });

  it("rejects net > gross and taxRate outside [0, 1)", () => {
    expect(paths(validateFarmsDoc({ farms: [farm("a")], shipments: [shipment("s", "a", { net: 2_000_000 })] }))).toEqual([
      "/data/shipments/0/net",
    ]);
    for (const taxRate of [1, -0.1, 1.5, Number.POSITIVE_INFINITY, "0.2"]) {
      expect(paths(validateFarmsDoc({ farms: [farm("a")], shipments: [shipment("s", "a", { taxRate })] }))).toEqual([
        "/data/shipments/0/taxRate",
      ]);
    }
    expect(paths(validateFarmsDoc({ farms: [farm("a")], shipments: [shipment("s", "a", { gross: -1 })] }))).toContain(
      "/data/shipments/0/gross",
    );
  });

  it(`rejects more than ${MAX_FARMS} farms`, () => {
    const farms = Array.from({ length: MAX_FARMS }, (_, i) => farm(`f${i}`));
    expect(validateFarmsDoc({ farms, shipments: [] }).ok).toBe(true);
    expect(paths(validateFarmsDoc({ farms: [...farms, farm("extra")], shipments: [] }))).toEqual(["/data/farms"]);
  });

  it("rejects bad levels", () => {
    const bad = (levels: unknown) => paths(validateFarmsDoc({ farms: [farm("a", { levels })], shipments: [] }));
    expect(bad({ cityHall: 26 })).toEqual(["/data/farms/0/levels/cityHall"]);
    expect(bad({ commanderLevel: 61 })).toEqual(["/data/farms/0/levels/commanderLevel"]);
    expect(bad({ academy: 0 })).toEqual(["/data/farms/0/levels/academy"]);
    expect(bad({ goldmine: 2.5 })).toEqual(["/data/farms/0/levels/goldmine"]);
    expect(bad({ hospital: 3 })).toEqual(["/data/farms/0/levels/hospital"]);
    expect(bad(null)).toEqual(["/data/farms/0/levels"]);
  });

  it("rejects extra keys at every level", () => {
    expect(paths(validateFarmsDoc({ ...sample(), v: 1 }))).toEqual(["/data/v"]);
    expect(paths(validateFarmsDoc({ farms: [farm("a", { secret: 1 })], shipments: [] }))).toEqual(["/data/farms/0/secret"]);
    expect(paths(validateFarmsDoc({ farms: [farm("a", { goal: { resource: "food", amount: 1, x: 1 } })], shipments: [] }))).toEqual([
      "/data/farms/0/goal/x",
    ]);
    expect(paths(validateFarmsDoc({ farms: [farm("a")], shipments: [shipment("s", "a", { by: "me" })] }))).toEqual([
      "/data/shipments/0/by",
    ]);
  });

  it("rejects other malformed fields", () => {
    const one = (over: Record<string, unknown>) => paths(validateFarmsDoc({ farms: [farm("a", over)], shipments: [] }));
    expect(one({ id: "bad id" })).toEqual(["/data/farms/0/id"]);
    expect(one({ name: "x".repeat(FARM_NAME_MAX + 1) })).toEqual(["/data/farms/0/name"]);
    expect(one({ role: "iron" })).toEqual(["/data/farms/0/role"]);
    expect(one({ createdAt: "ontem" })).toEqual(["/data/farms/0/createdAt"]);
    expect(one({ daily: { date: "2026-02-30", done: [] } })).toEqual(["/data/farms/0/daily"]);
    expect(paths(validateFarmsDoc({ farms: [], shipments: [shipment("s", "a", { date: "2026-13-01" })] }))).toContain(
      "/data/shipments/0/date",
    );
    expect(paths(validateFarmsDoc({ farms: "x", shipments: [] }))).toEqual(["/data/farms"]);
    expect(paths(validateFarmsDoc([]))).toEqual(["/data"]);
  });
});

// ---------------------------------------------------------------------------

describe("validateGenericDoc", () => {
  const nest = (depth: number): unknown => (depth <= 1 ? { leaf: 1 } : { n: nest(depth - 1) });

  it("accepts plain JSON objects", () => {
    const d = { title: "MGE", list: [1, "a", null, true, { x: [1, 2] }] };
    expect(valueOf(validateGenericDoc(d))).toBe(d);
    expect(validateDocData("mge-plan", d).ok).toBe(true);
  });

  it(`rejects nesting deeper than ${GENERIC_DOC_MAX_DEPTH}`, () => {
    // nest(n) has n object levels plus a leaf value: data is depth 1, so leaf is depth n + 1.
    expect(validateGenericDoc(nest(GENERIC_DOC_MAX_DEPTH - 1)).ok).toBe(true);
    expect(validateGenericDoc(nest(GENERIC_DOC_MAX_DEPTH)).ok).toBe(false);
    expect(validateGenericDoc({ a: [[[[[[[[[1]]]]]]]]] }).ok).toBe(false);
  });

  it("rejects prototype-polluting keys, also when created by JSON.parse", () => {
    const parsed: unknown = JSON.parse('{"ok":1,"nested":{"__proto__":{"polluted":true}}}');
    expect(paths(validateGenericDoc(parsed))).toEqual(["/data/nested/__proto__"]);
    expect(paths(validateGenericDoc(JSON.parse('{"constructor":{}}')))).toEqual(["/data/constructor"]);
    expect(paths(validateGenericDoc({ ["k".repeat(129)]: 1 }))).toEqual([`/data/${"k".repeat(32)}`]);
  });

  it("rejects long strings and non-finite numbers", () => {
    expect(validateGenericDoc({ s: "x".repeat(GENERIC_STRING_MAX) }).ok).toBe(true);
    expect(paths(validateGenericDoc({ s: "x".repeat(GENERIC_STRING_MAX + 1) }))).toEqual(["/data/s"]);
    expect(paths(validateGenericDoc({ a: [1, Number.NaN], b: Number.POSITIVE_INFINITY }))).toEqual(["/data/a/1", "/data/b"]);
    expect(paths(validateGenericDoc({ f: () => 1 }))).toEqual(["/data/f"]);
  });

  it("rejects non-objects and caps the number of issues", () => {
    expect(paths(validateGenericDoc([1]))).toEqual(["/data"]);
    expect(paths(validateGenericDoc("x"))).toEqual(["/data"]);
    const many = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, Number.NaN]));
    expect(issuesOf(validateGenericDoc(many)).length).toBeLessThanOrEqual(20);
  });
});

describe("validatePutDoc", () => {
  it("accepts baseVersion 0 and positive integers", () => {
    expect(valueOf(validatePutDoc("kingdom", { baseVersion: 0, data: {} }))).toEqual({ baseVersion: 0, data: {} });
    expect(valueOf(validatePutDoc("farms", { baseVersion: 7, data: sample() })).baseVersion).toBe(7);
  });

  it("rejects a bad baseVersion, extra keys and bad data", () => {
    for (const baseVersion of [-1, 1.5, "1", undefined, null]) {
      expect(paths(validatePutDoc("kingdom", { baseVersion, data: {} }))).toEqual(["/baseVersion"]);
    }
    expect(paths(validatePutDoc("kingdom", { baseVersion: 0, data: {}, force: true }))).toEqual(["/force"]);
    expect(paths(validatePutDoc("farms", { baseVersion: 0, data: { farms: [] } }))).toEqual(["/data/shipments"]);
    expect(paths(validatePutDoc("kingdom", { baseVersion: 0 }))).toEqual(["/data"]);
    expect(paths(validatePutDoc("kingdom", "x"))).toEqual([""]);
  });
});

// ---------------------------------------------------------------------------

describe("ids, days and routes", () => {
  it("checks id patterns", () => {
    expect(isEntityId("sp_abcdefghijklmnop")).toBe(true);
    expect(isEntityId("sp_short")).toBe(false);
    expect(isEntityId("SP_abcdefghijklmnop")).toBe(false);
    expect(isDocId("main")).toBe(true);
    expect(isDocId("a/b")).toBe(false);
    expect(isDocId("x".repeat(65))).toBe(false);
    expect(isIsoDay("2024-02-29")).toBe(true);
    expect(isIsoDay("2025-02-29")).toBe(false);
  });

  it("routePath fills and encodes every parameter", () => {
    expect(routePath(ROUTES.getDoc.path, { spaceId: "sp_1", kind: "farms", docId: "main" })).toBe("/v1/spaces/sp_1/docs/farms/main");
    expect(routePath(ROUTES.removeMember.path, { spaceId: "a/b?c#d", memberId: "../me" })).toBe(
      "/v1/spaces/a%2Fb%3Fc%23d/members/..%2Fme",
    );
    expect(routePath(ROUTES.health.path, {})).toBe("/v1/health");
    expect(() => routePath(ROUTES.me.path, {})).toThrow(/spaceId/);
  });

  it("route table is consistent", () => {
    for (const [key, r] of Object.entries(ROUTES)) expect(r.name).toBe(key);
    const seen = new Set(Object.values(ROUTES).map((r) => `${r.method} ${r.path}`));
    expect(seen.size).toBe(Object.keys(ROUTES).length);
    expect(DOC_KINDS).toContain("farms");
  });
});
