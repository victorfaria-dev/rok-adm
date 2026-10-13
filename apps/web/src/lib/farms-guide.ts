// Farm guides (/guides/farms/**): pick blocks per page, render their Markdown subset, resolve card meta.
//
// Block → page convention (the blocks schema has no resource field and is closed, so the id carries it):
//   farms-general-*            → general guide (/guides/farms/)
//   farms-<resource>-*         → that resource's guide (/guides/farms/<resource>/), resource ∈ RESOURCES
//   farms-pair-<r1>-<r2>[-…]   → the general guide AND each named resource's guide (pair hypotheses)
// Blocks are ordered by `order`, then id.
//
// This module is pure: it never imports @rokadm/data. Pages resolve card meta in Astro frontmatter
// (build time) and pass a lookup in, so the fact dataset never reaches client JS.
import type { Confidence, Fact, GuideBlock } from "@rokadm/core";
import rawBlocks from "../../../../guides/data/blocks.farms.json";

export const RESOURCES = ["food", "wood", "stone", "gold"] as const;
export type Resource = (typeof RESOURCES)[number];
export type GuidePage = "general" | Resource;

export const FARM_BLOCKS: readonly GuideBlock[] = rawBlocks as GuideBlock[];

const isResource = (s: string): s is Resource => (RESOURCES as readonly string[]).includes(s);

/** Resources named by a pair block id (`farms-pair-food-wood` → ["food", "wood"]); [] for other ids. */
export function pairResources(id: string): Resource[] {
  if (!id.startsWith("farms-pair-")) return [];
  const out: Resource[] = [];
  for (const part of id.slice("farms-pair-".length).split("-")) {
    if (!isResource(part)) break;
    out.push(part);
  }
  return out;
}

/** Pages a block belongs to, from its id (see the convention above). */
export function pagesOf(id: string): GuidePage[] {
  if (id.startsWith("farms-general-")) return ["general"];
  if (id.startsWith("farms-pair-")) return ["general", ...pairResources(id)];
  const m = /^farms-([a-z]+)-/.exec(id);
  return m && isResource(m[1]!) ? [m[1]] : [];
}

export function blocksForPage(page: GuidePage, blocks: readonly GuideBlock[] = FARM_BLOCKS): GuideBlock[] {
  return blocks
    .filter((b) => pagesOf(b.id).includes(page))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Unsourced heuristics are written with a title starting "Hypothesis:". */
export function isHypothesis(b: Pick<GuideBlock, "title">): boolean {
  return /^hypothesis\s*:/i.test(b.title);
}

/** Title without the "Hypothesis:" prefix (the page shows a label instead). */
export function displayTitle(b: Pick<GuideBlock, "title">): string {
  const t = b.title.replace(/^hypothesis\s*:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export interface GuidePageInfo {
  page: GuidePage;
  href: string;
  /** Link label and h1. */
  title: string;
  description: string;
  intro: string;
}

export const GUIDE_PAGES: Record<GuidePage, GuidePageInfo> = {
  general: {
    page: "general", href: "/guides/farms/", title: "Farm guide",
    description: "What a farm account is for, how to set it up and ship to your main, and what the evidence supports.",
    intro: "A farm is a second city you play yourself to feed your main with resources. This guide covers the setup, the Trading Post, gathering, safety and which kind of farm the evidence supports.",
  },
  food: {
    page: "food", href: "/guides/farms/food/", title: "Food on a farm",
    description: "When your main needs food, the food gathering techs, civilization perks and building output.",
    intro: "Food is what your main burns first. Here is when it matters, and what makes a farm gather more of it.",
  },
  wood: {
    page: "wood", href: "/guides/farms/wood/", title: "Wood on a farm",
    description: "When your main needs wood, the wood gathering techs, civilization perks and what to buy with it.",
    intro: "Wood is the other early building resource. Here is when it matters, and what makes a farm gather more of it.",
  },
  stone: {
    page: "stone", href: "/guides/farms/stone/", title: "Stone on a farm",
    description: "When your main needs stone, why the stone techs make it a later farm stage, and civilization perks.",
    intro: "Stone is where most mains first run short in the mid game. Its gathering techs come later, so it fits a more developed farm.",
  },
  gold: {
    page: "gold", href: "/guides/farms/gold/", title: "Gold on a farm",
    description: "When your main needs gold, the gold techs, the Maya perk, and the split on gold farms versus gold on the main.",
    intro: "Gold is the late bottleneck. Sources disagree on whether a farm should gather it, so both views are shown.",
  },
};

// ---------------------------------------------------------------- confidence and card meta

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  pending: "Pending in-game check",
};

/** What each level means, for the "How sure are we?" legend. */
export const CONFIDENCE_MEANING: Record<Confidence, string> = {
  high: "Official notes or several solid sources agree, and the cards are verified.",
  medium: "Verified cards backed by wiki or guide sources; no official confirmation yet.",
  low: "Few or old sources, disputed, or advice that varies by kingdom. Treat it as a lead, not a rule.",
  pending: "Not measured yet. Waits for an in-game check; no number is given.",
};

/** Card confidence → app confidence (alta→high, media→medium, baixa→low; disputed/outdated capped at low). */
export function factConfidence(f: Pick<Fact, "confidence" | "status"> | undefined): Confidence {
  if (!f) return "pending";
  const base: Confidence = f.confidence === "alta" ? "high" : f.confidence === "media" ? "medium" : "low";
  const capped = f.status === "contestado" || f.status === "obsoleto" || f.status === "parcialmente_obsoleto";
  return capped && base !== "low" ? "low" : base;
}

const STATUS_LABEL: Record<Fact["status"], string> = {
  verificado: "verified",
  organizado: "not yet verified",
  bruto: "unchecked",
  contestado: "disputed",
  parcialmente_obsoleto: "partly outdated",
  obsoleto: "outdated",
};

export interface CardMeta {
  id: string;
  title: string;
  confidence: Confidence;
  /** Short status text, e.g. "verified", "disputed", "patch notes". */
  status: string;
  /** Longer badge label (e.g. from factBadge), optional. */
  badge?: string;
}

/** Card meta from a fact (or a "not found" placeholder). C04 unchecked cards are official patch notes. */
export function cardMeta(id: string, fact: Pick<Fact, "title" | "confidence" | "status"> | undefined, badge?: string): CardMeta {
  if (!fact) return { id, title: "Card not in the dataset", confidence: "pending", status: "missing" };
  const status = id.startsWith("C04-") && fact.status === "bruto" ? "patch notes" : STATUS_LABEL[fact.status];
  return { id, title: fact.title, confidence: factConfidence(fact), status, ...(badge ? { badge } : {}) };
}

// ---------------------------------------------------------------- gaps in plain English

export interface GapInfo {
  kind: "measure" | "research";
  text: string;
}

/** Gap ids used by the farm blocks (from research/facts/A13 and A03 _lacunas.md). */
export const GAPS: Record<string, GapInfo> = {
  "L-A13-01": { kind: "measure", text: "minutes per farm per day and yield per day by farm City Hall" },
  "L-A13-02": { kind: "research", text: "official policy on farms and multiple accounts (Terms of Service)" },
  "L-A13-03": { kind: "measure", text: "resource-pair farms: no source, only derived reasoning; needs farm yields" },
  "L-A13-04": { kind: "research", text: "how many farms fit each spending tier" },
  "L-A03-01": { kind: "measure", text: "resource amount per node level and base gathering speed per resource" },
  "L-A03-02": { kind: "measure", text: "gathering yield per hour and per day by City Hall stage" },
  "L-A03-03": { kind: "measure", text: "gold through the Trading Post, and whether it needs a Trading Post level" },
  "L-A03-04": { kind: "measure", text: "Trading Post capacity L1–L24 and the City Hall that unlocks it" },
  "L-A03-05": { kind: "measure", text: "Storehouse protection L6–L24 (two tables differ by 10–35%)" },
};

export function gapLine(id: string): string {
  const g = GAPS[id];
  if (!g) return `Open question: ${id}`;
  return `${g.kind === "measure" ? "Pending in-game measurement" : "Pending research"}: ${id}, ${g.text}`;
}

// ---------------------------------------------------------------- tiny safe Markdown renderer

const CARD = "[ABC]\\d{2}-\\d{4}";
const CITATION_RE = new RegExp(`\\[(${CARD}(?:\\s*,\\s*${CARD})*)\\]`, "g");

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Card ids cited in `[A13-0001]` / `[A03-0025, A01-0009]` brackets, in order, without duplicates. */
export function citedCards(md: string): string[] {
  const out: string[] = [];
  for (const m of md.matchAll(CITATION_RE)) {
    for (const id of m[1]!.split(/\s*,\s*/)) if (!out.includes(id)) out.push(id);
  }
  return out;
}

export type CardLookup = (id: string) => CardMeta | undefined;

/** One citation chip: card id, its confidence and status as text (never colour alone). */
export function citationChip(id: string, meta: CardMeta | undefined): string {
  const conf = meta?.confidence ?? "pending";
  const confText = conf === "pending" ? "pending" : conf;
  const status = meta?.status ?? "missing";
  const title = meta ? ` title="${escapeHtml(meta.title)}"` : "";
  return `<span class="fg-cite fg-cite-${conf}"${title}><span class="mono">${escapeHtml(id)}</span> <span class="fg-cite-meta">${confText} · ${escapeHtml(status)}</span></span>`;
}

/** Inline subset on already-escaped text: **bold**, *italic*, [CARD-ID, …] citations. */
function inline(escaped: string, lookup: CardLookup): string {
  return escaped
    .replace(CITATION_RE, (_m, ids: string) =>
      `<span class="fg-cites">${ids.split(/\s*,\s*/).map((id) => citationChip(id, lookup(id))).join(" ")}</span>`)
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?=\S)([^*]*?\S)\*(?!\*)/g, "$1<em>$2</em>");
}

/**
 * Render the Markdown subset used in blocks to HTML. The source is escaped first, then:
 * blank line = new paragraph, "- " lines = list, single newline = <br>, plus inline() above.
 * Anything else (headings, links, raw HTML) stays literal text.
 */
export function renderMd(md: string, lookup: CardLookup = () => undefined): string {
  const out: string[] = [];
  for (const chunk of md.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    let para: string[] = [];
    let items: string[] = [];
    const flushPara = () => { if (para.length) out.push(`<p>${para.join("<br>")}</p>`); para = []; };
    const flushList = () => { if (items.length) out.push(`<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`); items = []; };
    for (const line of lines) {
      const li = /^\s*[-*]\s+(.*)$/.exec(line);
      if (li) { flushPara(); items.push(inline(escapeHtml(li[1]!), lookup)); }
      else { flushList(); para.push(inline(escapeHtml(line.trim()), lookup)); }
    }
    flushPara();
    flushList();
  }
  return out.join("\n");
}
