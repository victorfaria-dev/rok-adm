import { describe, expect, it } from "vitest";
import type { GuideBlock } from "@rokadm/core";
import {
  FARM_BLOCKS, GAPS, RESOURCES, blocksForPage, cardMeta, citedCards, displayTitle, escapeHtml, factConfidence,
  gapLine, isHypothesis, pagesOf, pairResources, renderMd, type CardMeta,
} from "./farms-guide";

const stub = (id: string, order: number, title = "A block title"): GuideBlock => ({ ...FARM_BLOCKS[0]!, id, order, title });

describe("block selection", () => {
  it("maps ids to pages by prefix", () => {
    expect(pagesOf("farms-general-purpose")).toEqual(["general"]);
    expect(pagesOf("farms-gold-tech")).toEqual(["gold"]);
    expect(pagesOf("farms-pair-food-wood")).toEqual(["general", "food", "wood"]);
    expect(pagesOf("farm-brief")).toEqual([]);
    expect(pagesOf("farms-iron-x")).toEqual([]);
    expect(pairResources("farms-pair-food-wood-hypothesis")).toEqual(["food", "wood"]);
    expect(pairResources("farms-food-tech")).toEqual([]);
  });

  it("sorts by order, then id", () => {
    const blocks = [stub("farms-food-b", 20), stub("farms-food-a", 20), stub("farms-food-c", 10), stub("farms-wood-a", 1)];
    expect(blocksForPage("food", blocks).map((b) => b.id)).toEqual(["farms-food-c", "farms-food-a", "farms-food-b"]);
  });

  it("every farm block lands on at least one page, and every page has blocks", () => {
    for (const b of FARM_BLOCKS) expect(pagesOf(b.id), b.id).not.toEqual([]);
    expect(blocksForPage("general").length).toBeGreaterThanOrEqual(8);
    for (const r of RESOURCES) expect(blocksForPage(r).length, r).toBeGreaterThanOrEqual(3);
  });

  it("the only pair is food + wood, and it is a labelled hypothesis", () => {
    const pairs = FARM_BLOCKS.filter((b) => b.id.startsWith("farms-pair-"));
    expect(pairs.map((b) => b.id)).toEqual(["farms-pair-food-wood"]);
    const p = pairs[0]!;
    expect(isHypothesis(p)).toBe(true);
    expect(p.body_md.startsWith("Hipótese:")).toBe(true);
    expect(["low", "pending"]).toContain(p.confidence);
    expect(p.gaps).toContain("L-A13-03");
    expect(displayTitle(p)).toBe("Uma farm de comida + madeira");
    expect(blocksForPage("food").map((b) => b.id)).toContain("farms-pair-food-wood");
    expect(blocksForPage("stone").map((b) => b.id)).not.toContain("farms-pair-food-wood");
    // No other pair is mentioned anywhere ("comida + madeira" is the only one).
    const PAIR = /\b(comida|madeira|pedra|ouro)\s*\+\s*(comida|madeira|pedra|ouro)\b/gi;
    for (const b of FARM_BLOCKS) {
      for (const m of `${b.title} ${b.body_md} ${b.why_md}`.matchAll(PAIR)) {
        expect([m[1]!.toLowerCase(), m[2]!.toLowerCase()].sort(), `${b.id}: ${m[0]}`).toEqual(["comida", "madeira"]);
      }
    }
  });

  it("the gold page carries split views", () => {
    const split = blocksForPage("gold").filter((b) => b.consensus === "split");
    expect(split.length).toBeGreaterThan(0);
    expect(split.every((b) => typeof b.split_views === "string" && b.split_views.length > 0)).toBe(true);
  });

  it("every gap used by the blocks has a plain-English line", () => {
    for (const b of FARM_BLOCKS) for (const g of b.gaps) expect(GAPS[g], `${b.id} ${g}`).toBeDefined();
    expect(gapLine("L-A13-01")).toMatch(/^Medição no jogo pendente: L-A13-01, minutos por conta farm/);
    expect(gapLine("L-A13-02")).toMatch(/^Pesquisa pendente: L-A13-02/);
    expect(gapLine("L-X99-99")).toBe("Pergunta em aberto: L-X99-99");
  });
});

describe("card meta", () => {
  it("maps card confidence, capping disputed and outdated at low", () => {
    expect(factConfidence({ confidence: "alta", status: "verificado" })).toBe("high");
    expect(factConfidence({ confidence: "media", status: "verificado" })).toBe("medium");
    expect(factConfidence({ confidence: "media", status: "contestado" })).toBe("low");
    expect(factConfidence({ confidence: "baixa", status: "parcialmente_obsoleto" })).toBe("low");
    expect(factConfidence(undefined)).toBe("pending");
  });

  it("labels status in Portuguese; C04 unchecked cards read as patch notes", () => {
    expect(cardMeta("A13-0001", { title: "T", confidence: "media", status: "organizado" }).status).toBe("ainda não verificada");
    expect(cardMeta("C04-0006", { title: "T", confidence: "alta", status: "bruto" })).toMatchObject({ confidence: "high", status: "notas de patch" });
    expect(cardMeta("A99-0001", undefined)).toMatchObject({ confidence: "pending", status: "ausente" });
  });
});

describe("renderMd", () => {
  const lookup = (id: string): CardMeta | undefined =>
    id === "A13-0001" ? { id, title: "Accounts <per> kingdom", confidence: "medium", status: "not yet verified" } : undefined;

  it("escapes HTML before formatting", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
    const html = renderMd("<script>alert(1)</script> **<b>x</b>**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>&lt;b&gt;x&lt;/b&gt;</strong>");
  });

  it("renders bold, italic, paragraphs and line breaks", () => {
    expect(renderMd("**Bold** and *italic*.")).toBe("<p><strong>Bold</strong> and <em>italic</em>.</p>");
    expect(renderMd("one\ntwo\n\nthree")).toBe("<p>one<br>two</p>\n<p>three</p>");
    expect(renderMd("10× and 5 * 3")).toBe("<p>10× and 5 * 3</p>");
  });

  it("renders lists, including a lead-in line in the same chunk", () => {
    expect(renderMd("Inputs:\n- a **b**\n- c")).toBe("<p>Inputs:</p>\n<ul><li>a <strong>b</strong></li><li>c</li></ul>");
  });

  it("turns card citations into chips with confidence and status text", () => {
    const html = renderMd("Two cities [A13-0001].", lookup);
    expect(html).toContain('<span class="fg-cite fg-cite-medium" title="Accounts &lt;per&gt; kingdom"><span class="mono">A13-0001</span> <span class="fg-cite-meta">média · not yet verified</span></span>');
    const multi = renderMd("Disputed [A13-0001, A03-0025].", lookup);
    expect(multi.match(/class="fg-cite /g)).toHaveLength(2);
    expect(multi).toContain("pendente · ausente");
  });

  it("parses cited cards", () => {
    expect(citedCards("x [A13-0001] y [A03-0025, A01-0009] z [A13-0001] L-A13-01 A03-0001")).toEqual(["A13-0001", "A03-0025", "A01-0009"]);
  });

  it("every card cited in block text is listed in the block's cards", () => {
    for (const b of FARM_BLOCKS) {
      const text = [b.body_md, b.why_md, typeof b.split_views === "string" ? b.split_views : ""].join("\n");
      for (const id of citedCards(text)) expect(b.cards, `${b.id} ${id}`).toContain(id);
    }
  });
});
