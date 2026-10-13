import { compactRulesShare, decodeShare, emptyRulesDoc, encodeShare, newCharterDoc, newDocId, parseRulesDoc, shareFromHash } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { getDoc, memoryStorage, saveDoc } from "./kingdom-store";
import { docFromSearch, formatDay, listRules, rulesShareLink, saveRules, saveRulesCopy } from "./kingdom-rules";

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

  it("a new charter's link fits well inside one Discord message (Q2 P2-1)", async () => {
    const doc = newCharterDoc(newDocId(), NOW, () => newDocId());
    const url = await rulesShareLink(doc, "https://kingdomops.example");
    expect(url.length).toBeLessThan(1000);
    const r = await decodeShare(shareFromHash(new URL(url).hash), "rules", parseRulesDoc);
    expect(r).toEqual({ ok: true, data: doc });
  });

  it("edits travel as line diffs and decode exactly; old full-document links still open", async () => {
    const doc = newCharterDoc("c1", NOW);
    doc.kingdom = "K1234";
    doc.sections[0] = { ...doc.sections[0]!, body: doc.sections[0]!.body.replace("[name or 'chosen by ...']", "Dave") };
    doc.sections[1] = { ...doc.sections[1]!, heading: "Votes" };
    doc.sections.push({ id: "own", heading: "Our own rule", body: "- Be kind\n- No zeroing" });
    doc.charter = { agreedOn: "2026-10-01", signers: ["Ana", "Bo"] };
    const url = await rulesShareLink(doc, "https://x.test");
    expect(url.length).toBeLessThan(1000);
    expect(await decodeShare(shareFromHash(new URL(url).hash), "rules", parseRulesDoc)).toEqual({ ok: true, data: doc });

    // A link made before the compact form (full document in the envelope) keeps working.
    const old = await encodeShare("rules", doc);
    expect(await decodeShare(old, "rules", parseRulesDoc)).toEqual({ ok: true, data: doc });
  });

  it("a compact link naming an unknown template version is reported as damaged, not shown half-empty", async () => {
    const code = await encodeShare("rules", { c: 1, id: "x", u: NOW.toISOString(), s: [{ i: "a", f: "kvk@99" }] });
    expect(await decodeShare(code, "rules", parseRulesDoc)).toEqual({ ok: false, error: "bad_json" });
    expect(compactRulesShare(emptyRulesDoc("e", NOW))).toEqual({ c: 1, id: "e", u: NOW.toISOString(), s: [] });
  });

  it("reads ?doc= and formats days", () => {
    expect(docFromSearch("?doc=abc")).toBe("abc");
    expect(docFromSearch("")).toBeNull();
    expect(docFromSearch(`?doc=${"x".repeat(65)}`)).toBeNull();
    expect(formatDay("2026-10-03")).toBe("3 Oct 2026");
    expect(formatDay("nope")).toBe("nope");
  });
});
