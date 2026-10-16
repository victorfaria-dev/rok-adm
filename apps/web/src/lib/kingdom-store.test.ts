import { describe, expect, it } from "vitest";
import {
  KINGDOM_KEY, MAX_DOCS_PER_KIND, MAX_DOC_CHARS, clearKingdom, exportKingdom, getDoc, importKingdom, listDocs,
  memoryStorage, parseKingdomExport, parseKingdomStore, readKingdom, removeDoc, saveDoc,
} from "./kingdom-store";

const T0 = new Date("2026-10-13T10:00:00Z");
const T1 = new Date("2026-10-13T11:00:00Z");

describe("kingdom store", () => {
  it("defaults on missing, corrupted, wrong version or non-object data", () => {
    for (const raw of [null, "", "{", "[]", "42", JSON.stringify({ v: 2, docs: [] }), JSON.stringify({ v: 1, docs: "x" })]) {
      expect(parseKingdomStore(raw)).toEqual({ v: 1, docs: [] });
    }
  });

  it("drops only the malformed documents", () => {
    const raw = JSON.stringify({
      v: 1,
      docs: [
        { id: "a", kind: "rules", title: "  Rules   K1  ", updatedAt: "2026-10-13T10:00:00Z", data: { x: 1 } },
        { id: "b", kind: "nope", title: "x", data: {} },
        { id: "", kind: "rules", data: {} },
        { id: "c", kind: "mge", title: 5 }, // no data
        { id: "a", kind: "mge", title: "dup", data: {} },
        { id: "d", kind: "seed", title: "t", updatedAt: "garbage", data: null },
        "string",
      ],
    });
    const s = parseKingdomStore(raw);
    expect(s.docs.map((d) => d.id)).toEqual(["a", "d"]);
    expect(s.docs[0]!.title).toBe("Rules K1");
    expect(s.docs[1]!.updatedAt).toBe(new Date(0).toISOString());
  });

  it("saves, lists newest first, replaces by id and removes", () => {
    const st = memoryStorage();
    saveDoc({ id: "r1", kind: "rules", title: "One", data: { a: 1 } }, st, T0);
    saveDoc({ id: "r2", kind: "rules", title: "Two", data: { a: 2 } }, st, T1);
    saveDoc({ id: "m1", kind: "mge", title: "MGE", data: {} }, st, T0);
    expect(listDocs("rules", st).map((d) => d.id)).toEqual(["r2", "r1"]);
    saveDoc({ id: "r1", kind: "rules", title: "One v2", data: { a: 3 } }, st, new Date("2026-10-13T12:00:00Z"));
    expect(listDocs("rules", st).map((d) => d.title)).toEqual(["One v2", "Two"]);
    expect(getDoc("r1", st)?.data).toEqual({ a: 3 });
    removeDoc("r1", st);
    expect(getDoc("r1", st)).toBeNull();
    expect(readKingdom(st).docs).toHaveLength(2);
    clearKingdom(st);
    expect(st.getItem(KINGDOM_KEY)).toBeNull();
  });

  it("enforces the per-kind limit and the size limit with actionable errors", () => {
    const st = memoryStorage();
    for (let i = 0; i < MAX_DOCS_PER_KIND; i++) saveDoc({ id: `r${i}`, kind: "rules", title: "x", data: {} }, st, T0);
    expect(() => saveDoc({ id: "extra", kind: "rules", title: "x", data: {} }, st, T0)).toThrow(/até 20/);
    expect(() => saveDoc({ id: "m", kind: "mge", title: "x", data: "a".repeat(MAX_DOC_CHARS + 1) }, st, T0)).toThrow(/grande demais/);
    // Replacing an existing one still works at the limit.
    expect(() => saveDoc({ id: "r0", kind: "rules", title: "y", data: {} }, st, T1)).not.toThrow();
  });

  it("works without storage (blocked) by returning the new state", () => {
    const { store } = saveDoc({ id: "x", kind: "seed", title: "t", data: {} }, null, T0);
    expect(store.docs).toHaveLength(1);
    expect(readKingdom(null).docs).toEqual([]);
  });

  it("survives a throwing storage", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("x"); } };
    expect(readKingdom(bad)).toEqual({ v: 1, docs: [] });
    expect(saveDoc({ id: "x", kind: "seed", title: "t", data: {} }, bad, T0).store.docs).toHaveLength(1);
    expect(() => clearKingdom(bad)).not.toThrow();
  });

  it("export → import round-trips and merges by updatedAt", () => {
    const a = memoryStorage();
    saveDoc({ id: "r1", kind: "rules", title: "Old", data: { v: 1 } }, a, T0);
    saveDoc({ id: "m1", kind: "mge", title: "MGE", data: { v: 1 } }, a, T0);
    const file = exportKingdom(readKingdom(a));
    expect(parseKingdomExport(file).docs).toHaveLength(2);

    const b = memoryStorage();
    saveDoc({ id: "r1", kind: "rules", title: "Newer here", data: { v: 2 } }, b, T1);
    const r = importKingdom(file, b);
    expect(r).toMatchObject({ added: 1, updated: 0, skipped: 1 });
    expect(getDoc("r1", b)?.title).toBe("Newer here");

    saveDoc({ id: "m1", kind: "mge", title: "MGE edited", data: { v: 3 } }, a, new Date("2026-10-14T00:00:00Z"));
    expect(importKingdom(exportKingdom(readKingdom(a)), b)).toMatchObject({ added: 0, updated: 1, skipped: 1 });
    expect(getDoc("m1", b)?.title).toBe("MGE edited");
  });

  it("refuses files that are not council exports", () => {
    expect(() => parseKingdomExport("nope")).toThrow(/não é uma exportação do conselho do KingdomOps/);
    expect(() => parseKingdomExport(JSON.stringify({ app: "kingdomops-farms", v: 1 }))).toThrow(/não é uma exportação do conselho do KingdomOps/);
    expect(() => parseKingdomExport(JSON.stringify({ app: "kingdomops-kingdom", v: 9, docs: [] }))).toThrow(/versão/);
  });

  it("import never replaces a document of another kind, and compares real times", () => {
    const st = memoryStorage();
    saveDoc({ id: "x", kind: "rules", title: "Mine", data: {} }, st, T0);
    const other = JSON.stringify({ app: "kingdomops-kingdom", v: 1, docs: [{ id: "x", kind: "mge", title: "Theirs", updatedAt: "2030-01-01T00:00:00Z", data: {} }] });
    expect(importKingdom(other, st)).toMatchObject({ added: 0, updated: 0, skipped: 1 });
    expect(getDoc("x", st)?.kind).toBe("rules");
    // "2026-10-13T09:00:00-05:00" is later than T0 even though it sorts lower as text.
    const later = JSON.stringify({ app: "kingdomops-kingdom", v: 1, docs: [{ id: "x", kind: "rules", title: "Later", updatedAt: "2026-10-13T09:00:00-05:00", data: {} }] });
    expect(importKingdom(later, st)).toMatchObject({ updated: 1 });
    expect(getDoc("x", st)?.title).toBe("Later");
  });
});
