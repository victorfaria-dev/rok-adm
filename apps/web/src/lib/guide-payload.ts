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
import type { BudgetPayload, CardBadge, GuideData, GuidePayload, PayloadBlock, PatchBadge } from "./guide-types";

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
export function renderMarkdown(text: string, label = "Table"): string {
  const html = md.parse(text, { async: false }) as string;
  const tables = (html.match(/<table>/g) ?? []).length;
  let n = 0;
  return html
    .replace(/<table>/g, () => {
      n += 1;
      const name = `${label}${tables > 1 ? `, table ${n}` : ", table"} (scrolls sideways)`;
      return `<div class="ko-table" tabindex="0" role="region" aria-label="${escapeAttr(name)}"><table>`;
    })
    .replace(/<\/table>/g, "</table></div>")
    .replace(/<li>(<p>)?<input (checked="" )?disabled="" type="checkbox">\s?/g, (_m, p: string | undefined, on: string | undefined) =>
      on
        ? `<li class="ko-task ko-task-done">${p ?? ""}<span class="visually-hidden">Done: </span>`
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
    return `VIP ${chestOnly} either way: the daily chest alone and putting every guaranteed gem into VIP reach the same level`;
  }
  return `VIP ${chestOnly} with the daily chest only, VIP ${withGems} if every guaranteed gem goes to VIP`;
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
  if (!f) return { title: id, label: "Card not in the dataset", confidence: "pending", usable: false, sources: [] };
  const b = factBadge(f);
  return {
    title: f.title,
    label: b.label,
    confidence: factConfidence(f),
    usable: b.usable,
    sources: [...new Set(f.sources.map((s) => s.id.replace(/^src:/, "")))],
  };
}

function toPayloadBlock(b: GuideBlock): PayloadBlock {
  const opt = (s: string | null, what: string) => (s && s.trim() !== "" ? renderMarkdown(s, `${b.title}, ${what}`) : null);
  return {
    ...b,
    body_md: "",
    why_md: "",
    bodyHtml: renderMarkdown(b.body_md, b.title),
    whyHtml: renderMarkdown(b.why_md, `${b.title}, why`),
    uncertain_notes: opt(b.uncertain_notes, "uncertain"),
    low_spender_note: opt(b.low_spender_note, "low spender note"),
    split_views: typeof b.split_views === "string" && b.split_views !== "" ? renderMarkdown(b.split_views, `${b.title}, split views`) : null,
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
      { label: "City Hall", value: `CH ${k.cityHall.value.workableMin}+ is workable; CH ${k.cityHall.value.notExpected} is not expected`, ...lean(k.cityHall) },
      { label: "Troop tier", value: `T4, usually around day ${k.t4Day.value}`, ...lean(k.t4Day) },
      { label: "Power", value: `${k.power.value.minMillions}M to ${k.power.value.maxMillions}M`, ...lean(k.power) },
      {
        label: `VIP by day ${startDay}`,
        value: vipByKvk1Text(highestBy(chest), highestBy(gems)),
        facts: vipFacts,
        confidence: gems.confidence,
        derived: true,
        note: "Upper bound on days: gem and VIP sources that are not guaranteed are not counted.",
      },
      { label: "VIP targets", value: rc.vipTargets.value.map((v) => `VIP ${v}`).join(", then "), ...lean(rc.vipTargets) },
      { label: "Lost Kingdom entry", value: `CH ${k.lostKingdomEntryCH.value}`, ...lean(k.lostKingdomEntryCH) },
    ],
    income: [
      { label: "Guaranteed gems", value: `${rc.guaranteedGemsPerDay.value} gems a day`, ...lean(rc.guaranteedGemsPerDay) },
      {
        label: "Daily VIP chest",
        value: `${i.vipDailyStart.value} VIP points, +${i.vipDailyIncrement.value} each day in a row, up to ${i.vipDailyCap.value} a day`,
        facts: chestRow.facts, confidence: confidenceOf(chestRow.facts, index), derived: false,
      },
      { label: "Gems to VIP", value: `1 gem = ${i.gemToVip.value} VIP point`, facts: i.gemToVip.facts, confidence: confidenceOf(i.gemToVip.facts, index), derived: false },
      { label: "Speedups", value: `${rc.speedupMinutesPerDay.value} minutes a day`, ...lean(rc.speedupMinutesPerDay) },
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
      { text: `KvK1 still starts around kingdom day ${startDay}. The kingdom calendar is the same for every account.`, ...unchangedFacts(k.startDay.facts) },
      {
        text: `Daily Objectives still pay ${rc.guaranteedGemsPerDay.value} gems a day only when you reach 100 points, which takes play time every day.`,
        ...unchangedFacts(rc.guaranteedGemsPerDay.facts),
      },
      {
        text: `The daily VIP chest still grows from ${i.vipDailyStart.value} to ${i.vipDailyCap.value} points a day only with an unbroken login streak.`,
        ...unchangedFacts(i.vipDailyStart.facts),
      },
      { text: `Lost Kingdom entry still needs City Hall ${k.lostKingdomEntryCH.value}.`, ...unchangedFacts(k.lostKingdomEntryCH.facts) },
    ],
    researched: [...BUDGET_DATA.researchedProfiles],
  };
}

/** Everything the guide page needs, for the endpoint and the static render. */
export function buildGuideData(): GuideData {
  return { guide: buildGuidePayload("f2p"), budget: buildBudgetPayload() };
}
