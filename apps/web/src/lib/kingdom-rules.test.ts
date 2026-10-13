import { decodeShare, emptyRulesDoc, emptyTranslation, parseRulesDoc, shareFromHash } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { getDoc, memoryStorage, saveDoc } from "./kingdom-store";
import { docFromSearch, formatDay, hashWithVersion, listRules, rulesShareLink, saveRules, saveRulesCopy, versionFromHash } from "./kingdom-rules";

const NOW = new Date("2026-10-13T10:00:00.000Z");

describe("rules store glue", () => {
  it("saves, lists and copies rules documents", () => {
    const st = memoryStorage();
    const doc = { ...emptyRulesDoc("r1", NOW), kingdom: "K1234" };
    const saved = saveRules(doc, st, NOW);
    expect(saved.updatedAt).toBe(NOW.toISOString());
    const list = listRules(st);
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("K1234 rules");
    expect(list[0]!.doc.kingdom).toBe("K1234");

    const id = saveRulesCopy(saved, st, NOW, "copy-1");
    expect(id).toBe("copy-1");
    expect(getDoc("copy-1", st)?.kind).toBe("rules");
    expect(listRules(st)).toHaveLength(2);
  });

  it("uses the envelope id and skips documents whose data is not an object", () => {
    const st = memoryStorage();
    saveDoc({ id: "outer", kind: "rules", title: "", data: { id: "inner", title: "T" } }, st, NOW);
    saveDoc({ id: "bad", kind: "rules", title: "x", data: "nope" }, st, NOW);
    const list = listRules(st);
    expect(list.map((l) => l.id)).toEqual(["outer"]);
    expect(list[0]!.doc.id).toBe("outer");
    expect(list[0]!.title).toBe("T");
  });

  it("builds a view-only link that decodes back to the document", async () => {
    const doc = { ...emptyRulesDoc("r1", NOW), title: "Rules" };
    const url = await rulesShareLink(doc, "https://x.test");
    expect(url.startsWith("https://x.test/kingdom/rules/view/#d=1")).toBe(true);
    const r = await decodeShare(shareFromHash(new URL(url).hash), "rules", parseRulesDoc);
    expect(r).toEqual({ ok: true, data: doc });
  });

  it("builds a full link or a shorter one with the original and one language", async () => {
    const doc = {
      ...emptyRulesDoc("r1", NOW), title: "Rules", originalLabel: "English", originalLang: "en",
      translations: [emptyTranslation("es", "Español", "es"), emptyTranslation("pt", "Português", "pt-BR")],
    };
    const read = async (url: string) => decodeShare(shareFromHash(new URL(url).hash), "rules", parseRulesDoc);
    expect(await read(await rulesShareLink(doc, "https://x.test"))).toEqual({ ok: true, data: doc });
    const one = await read(await rulesShareLink(doc, "https://x.test", "pt"));
    expect(one.ok && one.data.translations.map((t) => t.id)).toEqual(["pt"]);
    const none = await read(await rulesShareLink(doc, "https://x.test", null));
    expect(none.ok && none.data.translations).toEqual([]);
  });

  it("reads and writes the lang= hash param", () => {
    const doc = {
      ...emptyRulesDoc("r1", NOW), originalLang: "en",
      translations: [emptyTranslation("es", "Español", "es"), emptyTranslation("t2", "Klingon")],
    };
    expect(versionFromHash(doc, "#d=1zAAA&lang=ES")).toBe("es");
    expect(versionFromHash(doc, "#d=1zAAA&lang=t2")).toBe("t2");
    expect(versionFromHash(doc, "#d=1zAAA&lang=en")).toBe("original");
    expect(versionFromHash(doc, "#d=1zAAA&lang=original")).toBe("original");
    expect(versionFromHash(doc, "#d=1zAAA&lang=fr")).toBeNull();
    expect(versionFromHash(doc, "#d=1zAAA&lang=%E0")).toBeNull();
    expect(versionFromHash(doc, "#d=1zAAA")).toBeNull();
    expect(hashWithVersion(doc, "#d=1zAAA&lang=es", "t2")).toBe("#d=1zAAA&lang=t2");
    expect(hashWithVersion(doc, "#d=1zAAA", "es")).toBe("#d=1zAAA&lang=es");
    expect(hashWithVersion(doc, "#d=1zAAA&lang=es", "original")).toBe("#d=1zAAA&lang=en");
    expect(hashWithVersion({ ...doc, translations: [] }, "#d=1zAAA&lang=es", "original")).toBe("#d=1zAAA");
  });

  it("reads ?doc= and formats days", () => {
    expect(docFromSearch("?doc=abc")).toBe("abc");
    expect(docFromSearch("")).toBeNull();
    expect(docFromSearch(`?doc=${"x".repeat(65)}`)).toBeNull();
    expect(formatDay("2026-10-03")).toBe("3 Oct 2026");
    expect(formatDay("nope")).toBe("nope");
  });
});
