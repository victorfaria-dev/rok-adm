// BUILD-TIME ONLY. Imports the full dataset (@rokadm/data), the planner data and
// the guides JSON, and turns them into the lean payload the guide island fetches
// (/data/guide.json) and the static pages render. Never import this from an
// island or a client <script>: scripts/check-budget.ts fails the build if the
// fact dataset reaches client JS.
import { Marked } from "marked";
import { defaultProfile, type AccountProfile, type GuideBlock } from "@rokadm/core";
import { factBadge, facts, getFact } from "@rokadm/data";
import {
  BUDGET_DATA,
  checkpointAt,
  confidenceOf,
  factConfidence,
  indexFacts,
  lowSpenderTargets,
  realityCheck,
  type Sourced,
} from "@rokadm/planner";
import f2pBlocks from "../../../../guides/data/blocks.f2p.json";
import farmsBlocks from "../../../../guides/data/blocks.farms.json";
import first30Blocks from "../../../../guides/data/blocks.first30.json";
import kingdomAdminBlocks from "../../../../guides/data/blocks.kingdomadmin.json";
import lateStageBlocks from "../../../../guides/data/blocks.latestage.json";
import lowBlocks from "../../../../guides/data/blocks.low.json";
import newKingdomBlocks from "../../../../guides/data/blocks.newkingdom.json";
import recoveryBlocks from "../../../../guides/data/blocks.recovery.json";
import returningBlocks from "../../../../guides/data/blocks.returning.json";
import { buildCalendar } from "./guide-calendar";
import type { BudgetPayload, CardBadge, GuideData, GuidePayload, LowBudgetPayload, LowValue, PayloadBlock, PatchBadge } from "./guide-types";

/** Every blocks file in guides/data, by set name. */
export const BLOCK_SETS: Record<string, readonly GuideBlock[]> = {
  f2p: f2pBlocks as unknown as GuideBlock[],
  newkingdom: newKingdomBlocks as unknown as GuideBlock[],
  farms: farmsBlocks as unknown as GuideBlock[],
  low: lowBlocks as unknown as GuideBlock[],
  first30: first30Blocks as unknown as GuideBlock[],
  returning: returningBlocks as unknown as GuideBlock[],
  recovery: recoveryBlocks as unknown as GuideBlock[],
  kingdomadmin: kingdomAdminBlocks as unknown as GuideBlock[],
  latestage: lateStageBlocks as unknown as GuideBlock[],
};

const md = new Marked({ gfm: true, breaks: false });
const CARD_RE = /\b(?:A\d{2}|B\d{2}|C\d{2})-\d{4}\b/g;

/**
 * Markdown → HTML (trusted repo content). Tables get a focusable scroll region named
 * after `label` (the block title), so every region on a page has its own name; fact ids
 * get mono. GFM task lists become plain list items with a decorative marker: there is no
 * persisted checklist yet, so no fake (disabled) checkboxes.
 */
export function renderMarkdown(text: string, label = "Tabela"): string {
  const html = md.parse(text, { async: false }) as string;
  const tables = (html.match(/<table>/g) ?? []).length;
  let n = 0;
  return html
    .replace(/<table>/g, () => {
      n += 1;
      const name = `${label}${tables > 1 ? `, tabela ${n}` : ", tabela"} (rola para os lados)`;
      return `<div class="ko-table" tabindex="0" role="region" aria-label="${escapeAttr(name)}"><table>`;
    })
    .replace(/<\/table>/g, "</table></div>")
    .replace(/<li>(<p>)?<input (checked="" )?disabled="" type="checkbox">\s?/g, (_m, p: string | undefined, on: string | undefined) =>
      on
        ? `<li class="ko-task ko-task-done">${p ?? ""}<span class="visually-hidden">Feito: </span>`
        : `<li class="ko-task">${p ?? ""}`)
    .replace(CARD_RE, (id) => `<span class="ko-ref">${id}</span>`)
    .trim();
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** "VIP by KvK1" sentence; one statement when both routes reach the same level. */
export function vipByKvk1Text(chestOnly: number, withGems: number): string {
  if (chestOnly === withGems) {
    return `VIP ${chestOnly} de qualquer jeito: só o baú diário e pôr todas as gemas garantidas no VIP chegam ao mesmo nível`;
  }
  return `VIP ${chestOnly} só com o baú diário, VIP ${withGems} se todas as gemas garantidas forem para o VIP`;
}

export function patchBadge(b: GuideBlock): PatchBadge {
  const ref = b.patch_ref?.trim() ?? "";
  const m = /\d+\.\d+\.\d+/.exec(ref);
  if (!m) return { version: "unknown", note: ref || null, asOf: b.as_of };
  const rest = (ref.slice(0, m.index) + ref.slice(m.index + m[0].length)).trim().replace(/^\((.*?)\)/, "$1").trim();
  return { version: m[0], note: rest || null, asOf: b.as_of };
}

export function cardBadge(id: string): CardBadge {
  const f = getFact(id);
  if (!f) return { title: id, label: "Ficha fora da base de dados", confidence: "pending", usable: false, sources: [] };
  const b = factBadge(f);
  return {
    title: f.title,
    label: b.label,
    confidence: factConfidence(f),
    usable: b.usable,
    sources: [...new Set(f.sources.map((s) => s.id.replace(/^src:/, "")))],
  };
}

const GIST_MAX = 170;
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'" };

/**
 * One or two plain-text lines from a block body, for the timeline summary (wave VG): the first paragraph or
 * list item (tables and nested lists skipped), without fact ids or the consensus tag, cut at a sentence end
 * when one fits, else at a word with "…". The full text stays in the block.
 */
export function gistOf(bodyHtml: string): string {
  const html = bodyHtml.replace(/<div class="ko-table"[\s\S]*?<\/table><\/div>/g, "");
  const clean = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (e) => ENTITIES[e] ?? e)
      .replace(/\s*\[(?:[A-C]\d{2}-\d{4}(?:,\s*)?)+\]/g, "")
      .replace(/\s*Consensus:\s*[^.]*\.?/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const chunks = [...html.matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)(?=<\/p>|<\/li>|<ul>|<ol>)/g)].map((m) => clean(m[1]!)).filter((c) => c !== "");
  // A short lead-in ("Goals", "What survives:") says nothing alone: join it with what follows.
  let text = chunks[0] ?? clean(html);
  for (let i = 1; i < chunks.length && (text.length < 50 || text.endsWith(":")); i++) {
    text = /[.:;!?]$/.test(text) ? `${text} ${chunks[i]}` : `${text}: ${chunks[i]}`;
  }
  text = text.replace(/[;,]$/, ".");
  if (text.length <= GIST_MAX) return text;
  const cut = text.slice(0, GIST_MAX);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  if (end >= 60) return cut.slice(0, end + 1).replace(/;$/, ".");
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,:;\s—–-]+$/, "") + "…";
}

function toPayloadBlock(b: GuideBlock): PayloadBlock {
  const opt = (s: string | null, what: string) => (s && s.trim() !== "" ? renderMarkdown(s, `${b.title}, ${what}`) : null);
  const bodyHtml = renderMarkdown(b.body_md, b.title);
  return {
    ...b,
    body_md: "",
    why_md: "",
    bodyHtml,
    gist: gistOf(bodyHtml),
    whyHtml: renderMarkdown(b.why_md, `${b.title}, por quê`),
    uncertain_notes: opt(b.uncertain_notes, "incerto"),
    low_spender_note: opt(b.low_spender_note, "nota para quem gasta pouco"),
    split_views: typeof b.split_views === "string" && b.split_views !== "" ? renderMarkdown(b.split_views, `${b.title}, duas visões`) : null,
    patch: patchBadge(b),
  };
}

export function buildGuidePayload(set: string, blocks: readonly GuideBlock[] = BLOCK_SETS[set] ?? []): GuidePayload {
  const ids = new Set<string>();
  for (const b of blocks) for (const c of [...b.cards, ...b.patch_cards]) ids.add(c);
  const badges: Record<string, CardBadge> = {};
  for (const id of [...ids].sort()) badges[id] = cardBadge(id);
  return { v: 1, set, blocks: blocks.map(toPayloadBlock), badges };
}

// ---------------------------------------------------------------------------
// Budget Reality Check (F-14)

const lean = <T>(s: Sourced<T>) => ({ facts: s.facts, confidence: s.confidence, derived: s.derived, ...(s.note ? { note: s.note } : {}) });

export function buildBudgetPayload(): BudgetPayload {
  const base: AccountProfile = { ...defaultProfile(), spending: "f2p", kingdomDay: null };
  const rc = realityCheck(base, facts);
  const k = rc.kvk1;
  if (!rc.researched || !k || !rc.guaranteedGemsPerDay || !rc.speedupMinutesPerDay || !rc.vipTargets) {
    throw new Error("F2P Budget Reality Check is expected to be researched");
  }
  const index = indexFacts(facts);
  const i = BUDGET_DATA.inputs;
  const startDay = k.startDay.value;
  const [chest, gems] = rc.vipTimeline;
  if (!chest || !gems) throw new Error("vipTimeline must have two scenarios");

  const highestBy = (s: typeof chest) => s.milestones.filter((m) => m.day !== null && m.day <= startDay).reduce((a, m) => Math.max(a, m.vip), 0);
  const vipFacts = [...new Set([...chest.facts, ...gems.facts])];
  const chestRow = i.vipDailyStart;

  const unchangedFacts = (ids: string[]) => ({ facts: ids, confidence: confidenceOf(ids, index) });

  return {
    asOf: rc.asOf,
    kvk1Day: { value: startDay, unit: k.startDay.unit, ...lean(k.startDay) },
    targets: [
      { label: "Prefeitura", value: `Pref. ${k.cityHall.value.workableMin}+ é viável; Pref. ${k.cityHall.value.notExpected} não é esperada`, ...lean(k.cityHall) },
      { label: "Nível de tropa", value: `T4, geralmente por volta do dia ${k.t4Day.value}`, ...lean(k.t4Day) },
      { label: "Poder", value: `${k.power.value.minMillions}M a ${k.power.value.maxMillions}M`, ...lean(k.power) },
      {
        label: `VIP até o dia ${startDay}`,
        value: vipByKvk1Text(highestBy(chest), highestBy(gems)),
        facts: vipFacts,
        confidence: gems.confidence,
        derived: true,
        note: "Limite máximo de dias: fontes de gemas e VIP que não são garantidas não entram na conta.",
      },
      { label: "Metas de VIP", value: rc.vipTargets.value.map((v) => `VIP ${v}`).join(", depois "), ...lean(rc.vipTargets) },
      { label: "Entrada no Reino Perdido", value: `Pref. ${k.lostKingdomEntryCH.value}`, ...lean(k.lostKingdomEntryCH) },
    ],
    income: [
      { label: "Gemas garantidas", value: `${rc.guaranteedGemsPerDay.value} gemas por dia`, ...lean(rc.guaranteedGemsPerDay) },
      {
        label: "Baú diário de VIP",
        value: `${i.vipDailyStart.value} pontos de VIP, +${i.vipDailyIncrement.value} a cada dia seguido, até ${i.vipDailyCap.value} por dia`,
        facts: chestRow.facts, confidence: confidenceOf(chestRow.facts, index), derived: false,
      },
      { label: "Gemas para VIP", value: `1 gema = ${i.gemToVip.value} ponto de VIP`, facts: i.gemToVip.facts, confidence: confidenceOf(i.gemToVip.facts, index), derived: false },
      { label: "Acelerações", value: `${rc.speedupMinutesPerDay.value} minutos por dia`, ...lean(rc.speedupMinutesPerDay) },
    ],
    vip: {
      rows: chest.milestones.map((m, n) => ({ vip: m.vip, threshold: m.threshold, chestOnly: m.day, withGems: gems.milestones[n]?.day ?? null })),
      chestOnly: { label: chest.label, confidence: chest.confidence, facts: chest.facts, note: chest.note },
      withGems: { label: gems.label, confidence: gems.confidence, facts: gems.facts, note: gems.note },
    },
    checkpoints: rc.checkpoints.map((c) => c.day),
    byDay: Array.from({ length: startDay }, (_, n) => {
      const c = checkpointAt(n + 1);
      return { day: c.day, gems: c.guaranteedGemsCumulative, vipChestOnly: c.vipLevel.chestOnly, vipWithGems: c.vipLevel.withGems };
    }),
    oneTimeGems: rc.oneTimeGems.map((g) => ({ id: g.id, label: g.label, gems: g.value, unlockCityHall: g.unlockCityHall, confidence: g.confidence, facts: g.facts })),
    assumptions: rc.assumptions,
    unchanged: [
      { text: `O KvK1 continua começando por volta do dia ${startDay} do reino. O calendário do reino é o mesmo para todas as contas.`, ...unchangedFacts(k.startDay.facts) },
      {
        text: `Os Objetivos Diários continuam pagando ${rc.guaranteedGemsPerDay.value} gemas por dia só quando você chega a 100 pontos, o que exige jogar todo dia.`,
        ...unchangedFacts(rc.guaranteedGemsPerDay.facts),
      },
      {
        text: `O baú diário de VIP continua crescendo de ${i.vipDailyStart.value} a ${i.vipDailyCap.value} pontos por dia só com uma sequência de logins sem falhas.`,
        ...unchangedFacts(i.vipDailyStart.facts),
      },
      { text: `A entrada no Reino Perdido continua exigindo Prefeitura ${k.lostKingdomEntryCH.value}.`, ...unchangedFacts(k.lostKingdomEntryCH.facts) },
    ],
    researched: [...BUDGET_DATA.researchedProfiles],
  };
}

// ---------------------------------------------------------------------------
// Low spender targets (wave J): its own payload, fetched by the island for the Low profile only.

const lowValue = (s: Sourced<number>): LowValue => ({ value: s.value, facts: [...s.facts], confidence: s.confidence, derived: s.derived, gaps: [...s.pendingGaps] });
const lowValueOrNull = (s: Sourced<number> | null): LowValue | null => (s ? lowValue(s) : null);

export function buildLowBudgetPayload(): LowBudgetPayload {
  // The profile only sets growthFund.reachedCH25, which the page works out from the viewer's City Hall.
  const t = lowSpenderTargets({ ...defaultProfile(), spending: "low" }, facts);
  const inTier = new Set(t.tiers.flatMap((x) => x.lines.map((l) => l.purchase.id)));
  return {
    v: 1,
    asOf: t.asOf,
    message: t.message,
    priceWarning: t.priceWarning,
    rangeUsdPerMonth: { ...t.rangeUsdPerMonth },
    purchases: t.purchases.map((p) => ({
      id: p.id,
      label: p.label,
      kind: p.kind,
      periodDays: p.periodDays,
      items: p.items,
      note: p.note,
      priceUsd: lowValue(p.price),
      gems: lowValueOrNull(p.gems),
      vipPoints: lowValueOrNull(p.vipPoints),
      gemsPerUsd: lowValueOrNull(p.gemsPerUsd),
      vipPerUsd: lowValueOrNull(p.vipPerUsd),
      confidence: p.confidence,
      facts: [...p.facts],
    })),
    tiers: t.tiers.map((x) => ({
      id: x.id,
      label: x.label,
      note: x.note,
      lines: x.lines.map((l) => ({ purchaseId: l.purchase.id, timesPerMonth: Math.round(l.timesPerMonth * 100) / 100, assumed: l.assumed })),
      monthlyUsd: lowValue(x.monthlyUsd),
      monthlyGems: lowValue(x.monthlyGems),
      monthlyVipPoints: lowValue(x.monthlyVipPoints),
      oneTimeUsd: lowValue(x.oneTimeUsd),
      oneTimeGems: lowValue(x.oneTimeGems),
      withinLowRange: x.withinLowRange,
    })),
    outsideTiers: t.purchases.filter((p) => !inTier.has(p.id)).map((p) => p.id),
    growthFund: { ch25Gems: lowValue(t.growthFund.ch25Gems), note: t.growthFund.note },
    vip: {
      label: t.vipTimeline.label,
      rows: t.vipTimeline.milestones.map((m) => ({ vip: m.vip, threshold: m.threshold, day: m.day })),
      facts: [...t.vipTimeline.facts],
      confidence: t.vipTimeline.confidence,
      gaps: [...t.vipTimeline.pendingGaps],
      note: t.vipTimeline.note,
    },
    recharge: { text: t.recharge.text, facts: t.recharge.facts, confidence: t.recharge.confidence, gaps: t.recharge.pendingGaps },
    valueMethod: { ...t.valueMethod },
    confidence: t.confidence,
  };
}

/** Everything the guide page needs, for the endpoint and the static render. */
export function buildGuideData(): GuideData {
  return { guide: buildGuidePayload("f2p"), budget: buildBudgetPayload(), calendar: buildCalendar() };
}
