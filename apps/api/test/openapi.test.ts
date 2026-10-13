// Structural checks of openapi.json against the route table and limits in @rokadm/core.
// No schema-validator dependency: the checks walk the JSON directly.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX,
  DOC_ID_PATTERN,
  DOC_KINDS,
  ENTITY_ID_PATTERN,
  FARM_NAME_MAX,
  FARM_NOTE_MAX,
  MAX_FARMS,
  MAX_SHIPMENTS,
  ROUTES,
  SPACE_NAME_MAX,
  type RouteDef,
} from "@rokadm/core";

type J = Record<string, any>;
const spec: J = JSON.parse(readFileSync(new URL("../openapi.json", import.meta.url), "utf8"));
const METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"];
const routes = Object.entries(ROUTES) as [string, RouteDef][];

function resolve(ref: string): unknown {
  expect(ref.startsWith("#/"), ref).toBe(true);
  let cur: unknown = spec;
  for (const raw of ref.slice(2).split("/")) {
    const k = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur === null || typeof cur !== "object" || !(k in cur)) return undefined;
    cur = (cur as J)[k];
  }
  return cur;
}
/** Follows a single $ref, if present. */
const deref = (x: J): J => (typeof x?.$ref === "string" ? (resolve(x.$ref) as J) : x);
const schema = (name: string): J => spec.components.schemas[name];
const op = (r: RouteDef): J => spec.paths[r.path]?.[r.method.toLowerCase()];

describe("openapi.json", () => {
  it("is OpenAPI 3.1.0 with a local server and bearer auth", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers).toEqual([expect.objectContaining({ url: "http://127.0.0.1:8787" })]);
    expect(spec.info.license?.name).toMatch(/local/i);
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({ type: "http", scheme: "bearer", bearerFormat: "opaque" });
  });

  it("has exactly one operation per route, with operationId = route key", () => {
    const found: string[] = [];
    for (const [path, item] of Object.entries(spec.paths as J)) {
      for (const m of Object.keys(item)) if (METHODS.includes(m)) found.push(`${m.toUpperCase()} ${path} ${item[m].operationId}`);
    }
    expect(found.sort()).toEqual(routes.map(([k, r]) => `${r.method} ${r.path} ${k}`).sort());
    const ids = found.map((f) => f.split(" ")[2]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares security per route auth and tags every operation", () => {
    for (const [k, r] of routes) {
      const o = op(r);
      expect(o.tags?.length, k).toBeGreaterThan(0);
      expect(o["x-rokadm-auth"], k).toBe(r.auth);
      if (r.auth === "none") expect(o.security, k).toEqual([]);
      else expect(o.security, k).toEqual([{ bearerAuth: [] }]);
    }
  });

  it("resolves every $ref", () => {
    const refs: string[] = [];
    const walk = (x: unknown): void => {
      if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === "object") {
        for (const [k, v] of Object.entries(x)) {
          if (k === "$ref") refs.push(v as string);
          else walk(v);
        }
      }
    };
    walk(spec);
    expect(refs.length).toBeGreaterThan(50);
    for (const r of refs) expect(resolve(r), r).toBeDefined();
  });

  it("documents a 2xx and the error statuses of each route", () => {
    for (const [k, r] of routes) {
      const codes = Object.keys(op(r).responses);
      expect(codes.some((c) => /^2\d\d$/.test(c)), k).toBe(true);
      if (k !== "health") expect(codes, k).toContain("429");
      if (r.auth !== "none") expect(codes, k).toEqual(expect.arrayContaining(["401", "403"]));
      if (r.method === "POST" || r.method === "PUT") expect(codes, k).toEqual(expect.arrayContaining(["400", "413", "415"]));
      for (const c of codes) {
        const res = deref(op(r).responses[c]);
        expect(typeof res?.description, `${k} ${c}`).toBe("string");
        if (/^[45]/.test(c)) expect(res.content?.["application/json"]?.schema, `${k} ${c}`).toBeDefined();
      }
    }
    const codes = (name: keyof typeof ROUTES) => Object.keys(op(ROUTES[name]).responses).sort();
    expect(codes("createSpace")).toEqual(["201", "400", "413", "415", "429"]);
    expect(codes("join")).toEqual(["201", "400", "404", "409", "413", "415", "429"]);
    expect(codes("putDoc")).toEqual(["200", "201", "400", "401", "403", "409", "413", "415", "429"]);
    expect(codes("deleteDoc")).toEqual(["204", "400", "401", "403", "404", "409", "429"]);
    expect(codes("removeMember")).toEqual(["204", "401", "403", "404", "409", "429"]);
    expect(op(ROUTES.join).responses["404"].$ref).toBe("#/components/responses/InviteInvalid");
    expect(op(ROUTES.deleteDoc).responses["409"].$ref).toBe("#/components/responses/VersionConflict");
    expect(op(ROUTES.exportSpace).responses["200"].headers?.["Content-Disposition"]).toBeDefined();
  });

  it("declares every path parameter of each template, plus the query parameters", () => {
    for (const [k, r] of routes) {
      const params = ((op(r).parameters ?? []) as J[]).map(deref);
      const inPath = params.filter((p) => p.in === "path").map((p) => p.name).sort();
      const inTemplate = [...r.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(inPath, k).toEqual(inTemplate);
      for (const p of params.filter((p) => p.in === "path")) expect(p.required, `${k} ${p.name}`).toBe(true);
    }
    const query = (name: keyof typeof ROUTES) =>
      Object.fromEntries(((op(ROUTES[name]).parameters ?? []) as J[]).filter((p) => p.in === "query").map((p) => [p.name, p.required]));
    expect(query("docs")).toEqual({ kind: false });
    expect(query("deleteDoc")).toEqual({ version: true });
    expect(query("audit")).toEqual({ limit: false, before: false });
  });

  it("uses the id patterns and kinds from the contracts", () => {
    expect(schema("EntityId").pattern).toBe(ENTITY_ID_PATTERN.source);
    expect(schema("DocId").pattern).toBe(DOC_ID_PATTERN.source);
    expect(schema("DocKind").enum).toEqual([...DOC_KINDS]);
    const memberId = (op(ROUTES.removeMember).parameters as J[]).find((p) => p.name === "memberId")!;
    const re = new RegExp(memberId.schema.pattern);
    expect(re.test("me")).toBe(true);
    expect(re.test("mb_abcdefghijklmnop")).toBe(true);
    expect(re.test("mex")).toBe(false);
  });

  it("uses the limit constants from the contracts", () => {
    expect(schema("CreateSpaceRequest").properties.name.maxLength).toBe(SPACE_NAME_MAX);
    expect(schema("SpaceInfo").properties.name.maxLength).toBe(SPACE_NAME_MAX);
    expect(schema("CreateSpaceRequest").properties.displayName.maxLength).toBe(DISPLAY_NAME_MAX);
    expect(schema("JoinRequest").properties.displayName.maxLength).toBe(DISPLAY_NAME_MAX);
    expect(schema("MemberInfo").properties.displayName.maxLength).toBe(DISPLAY_NAME_MAX);
    expect(schema("FarmsDocData").properties.farms.maxItems).toBe(MAX_FARMS);
    expect(schema("FarmsDocData").properties.shipments.maxItems).toBe(MAX_SHIPMENTS);
    expect(schema("SyncFarm").properties.name.maxLength).toBe(FARM_NAME_MAX);
    expect(schema("SyncFarm").properties.note.maxLength).toBe(FARM_NOTE_MAX);
  });

  it("has a schema for every request and response type", () => {
    const names = [
      "SpaceInfo", "MemberInfo", "InviteInfo", "DocMeta", "SyncDoc", "FarmsDocData", "SyncFarm", "SyncShipment",
      "AuditEntry", "ErrorResponse", "ConflictResponse", "ExportResponse", "CreateSpaceRequest", "CreateSpaceResponse",
      "JoinRequest", "JoinResponse", "MeResponse", "MembersResponse", "CreateInviteRequest", "CreateInviteResponse",
      "InvitesResponse", "DocsResponse", "PutDocRequest", "DocResponse", "AuditResponse", "HealthResponse",
    ];
    for (const n of names) expect(schema(n), n).toBeDefined();
    // Closed objects list every required property.
    for (const [n, s] of Object.entries(spec.components.schemas as J)) {
      if (s.type === "object" && s.properties) for (const r of s.required ?? []) expect(s.properties, `${n}.${r}`).toHaveProperty(r);
    }
  });
});
