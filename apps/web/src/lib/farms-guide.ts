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

/** Unsourced heuristics are written with a title starting "Hipótese:" (data, in pt-BR; English prefix also accepted). */
export function isHypothesis(b: Pick<GuideBlock, "title">): boolean {
  return /^(hypothesis|hip[óo]tese)\s*:/i.test(b.title);
}

/** Title without the "Hypothesis:" prefix (the page shows a label instead). */
export function displayTitle(b: Pick<GuideBlock, "title">): string {
  const t = b.title.replace(/^(hypothesis|hip[óo]tese)\s*:\s*/i, "");
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
    page: "general", href: "/guides/farms/", title: "Guia de conta farm",
    description: "Para que serve uma conta farm, como montá-la e enviar para a sua principal, e o que as evidências apoiam.",
    intro: "Uma conta farm é uma segunda cidade que você mesmo joga para abastecer a sua principal com recursos. Este guia cobre a montagem, o Entreposto Comercial, a coleta, a segurança e que tipo de conta farm as evidências apoiam.",
  },
  food: {
    page: "food", href: "/guides/farms/food/", title: "Comida numa conta farm",
    description: "Quando a sua principal precisa de comida, as tecnologias de coleta de comida, os bônus das civilizações e a produção das construções.",
    intro: "Comida é o que a sua principal gasta primeiro. Aqui está quando ela importa e o que faz uma conta farm coletar mais dela.",
  },
  wood: {
    page: "wood", href: "/guides/farms/wood/", title: "Madeira numa conta farm",
    description: "Quando a sua principal precisa de madeira, as tecnologias de coleta de madeira, os bônus das civilizações e o que comprar com ela.",
    intro: "Madeira é o outro recurso de construção do início. Aqui está quando ela importa e o que faz uma conta farm coletar mais dela.",
  },
  stone: {
    page: "stone", href: "/guides/farms/stone/", title: "Pedra numa conta farm",
    description: "Quando a sua principal precisa de pedra, por que as tecnologias de pedra a deixam para uma etapa posterior da conta farm, e os bônus das civilizações.",
    intro: "Pedra é onde a maioria das principais fica curta pela primeira vez no meio do jogo. As tecnologias de coleta vêm depois, então combina com uma conta farm mais desenvolvida.",
  },
  gold: {
    page: "gold", href: "/guides/farms/gold/", title: "Ouro numa conta farm",
    description: "Quando a sua principal precisa de ouro, as tecnologias de ouro, o bônus dos Maias, e a divisão entre contas farm de ouro e ouro na principal.",
    intro: "Ouro é o gargalo do fim do jogo. As fontes divergem sobre se uma conta farm deve coletá-lo, então as duas visões aparecem.",
  },
};

// ---------------------------------------------------------------- confidence and card meta

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
  pending: "Conferência no jogo pendente",
};

/** What each level means, for the "How sure are we?" legend. */
export const CONFIDENCE_MEANING: Record<Confidence, string> = {
  high: "Notas oficiais ou várias fontes sólidas concordam, e as fichas estão verificadas.",
  medium: "Fichas verificadas, apoiadas por fontes de wiki ou guias; ainda sem confirmação oficial.",
  low: "Poucas fontes ou fontes antigas, disputadas, ou conselhos que variam por reino. Trate como pista, não como regra.",
  pending: "Ainda não medido. Aguarda uma conferência no jogo; nenhum número é dado.",
};

/** Card confidence → app confidence (alta→high, media→medium, baixa→low; disputed/outdated capped at low). */
export function factConfidence(f: Pick<Fact, "confidence" | "status"> | undefined): Confidence {
  if (!f) return "pending";
  const base: Confidence = f.confidence === "alta" ? "high" : f.confidence === "media" ? "medium" : "low";
  const capped = f.status === "contestado" || f.status === "obsoleto" || f.status === "parcialmente_obsoleto";
  return capped && base !== "low" ? "low" : base;
}

const STATUS_LABEL: Record<Fact["status"], string> = {
  verificado: "verificada",
  organizado: "ainda não verificada",
  bruto: "não conferida",
  contestado: "contestada",
  parcialmente_obsoleto: "parcialmente desatualizada",
  obsoleto: "desatualizada",
};

export interface CardMeta {
  id: string;
  title: string;
  confidence: Confidence;
  /** Short status text, e.g. "verificada", "contestada", "notas de patch". */
  status: string;
  /** Longer badge label (e.g. from factBadge), optional. */
  badge?: string;
}

/** Card meta from a fact (or a "not found" placeholder). C04 unchecked cards are official patch notes. */
export function cardMeta(id: string, fact: Pick<Fact, "title" | "confidence" | "status"> | undefined, badge?: string): CardMeta {
  if (!fact) return { id, title: "Ficha fora do conjunto de dados", confidence: "pending", status: "ausente" };
  const status = id.startsWith("C04-") && fact.status === "bruto" ? "notas de patch" : STATUS_LABEL[fact.status];
  return { id, title: fact.title, confidence: factConfidence(fact), status, ...(badge ? { badge } : {}) };
}

// ---------------------------------------------------------------- gaps in plain English

export interface GapInfo {
  kind: "measure" | "research";
  text: string;
}

/** Gap ids used by the farm blocks (from research/facts/A13 and A03 _lacunas.md). */
export const GAPS: Record<string, GapInfo> = {
  "L-A13-01": { kind: "measure", text: "minutos por conta farm por dia e produção por dia segundo a Prefeitura da conta farm" },
  "L-A13-02": { kind: "research", text: "política oficial sobre contas farm e múltiplas contas (Termos de Serviço)" },
  "L-A13-03": { kind: "measure", text: "contas farm de pares de recursos: nenhuma fonte, só raciocínio derivado; precisa da produção das contas farm" },
  "L-A13-04": { kind: "research", text: "quantas contas farm cabem em cada faixa de gasto" },
  "L-A03-01": { kind: "measure", text: "quantidade de recursos por nível de ponto de coleta e velocidade base de coleta por recurso" },
  "L-A03-02": { kind: "measure", text: "produção de coleta por hora e por dia segundo a etapa da Prefeitura" },
  "L-A03-03": { kind: "measure", text: "ouro pelo Entreposto Comercial, e se exige um nível de Entreposto Comercial" },
  "L-A03-04": { kind: "measure", text: "capacidade do Entreposto Comercial nos níveis 1 a 24 e a Prefeitura que o desbloqueia" },
  "L-A03-05": { kind: "measure", text: "proteção do Depósito nos níveis 6 a 24 (duas tabelas diferem em 10 a 35%)" },
};

export function gapLine(id: string): string {
  const g = GAPS[id];
  if (!g) return `Pergunta em aberto: ${id}`;
  return `${g.kind === "measure" ? "Medição no jogo pendente" : "Pesquisa pendente"}: ${id}, ${g.text}`;
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
  const confText = ({ high: "alta", medium: "média", low: "baixa", pending: "pendente" } as const)[conf];
  const status = meta?.status ?? "ausente";
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
