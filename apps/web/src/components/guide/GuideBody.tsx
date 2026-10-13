import { Component } from "preact";
import { PHASE_TITLES, type AccountProfile, type GuidePhase } from "@rokadm/core";
import type { BudgetPayload, CardBadge } from "../../lib/guide-types";
import { confidenceCounts, sectionTitle, type GuideView, type ViewBlock } from "../../lib/guide-view";
import { Block } from "./Block";
import { Budget } from "./Budget";
import { Confidence } from "./Confidence";
import type { GuideLink } from "../../lib/guides";

interface Props {
  view: GuideView;
  badges: Record<string, CardBadge>;
  /** Budget Reality Check; omitted on guides without one (new kingdom). */
  budget?: BudgetPayload;
  /** Recommended / Upcoming tags (needs a profile). */
  profileTags?: boolean;
  /** Prefix for ids, so two bodies never clash. */
  idPrefix?: string;
  /**
   * Render only the first N steps (blocks, in page order, "Already done?" included); the island raises
   * it after idle. The budget comes last, once N passes renderSteps(view). Undefined = everything.
   */
  limit?: number;
}

type BlockProps = Parameters<typeof Block>[0];

/** A block that re-renders only when its own props change (the progressive render re-renders the body often). */
class StableBlock extends Component<BlockProps> {
  shouldComponentUpdate(next: BlockProps): boolean {
    const p = this.props;
    return next.item !== p.item || next.badges !== p.badges || next.level !== p.level || next.profileTags !== p.profileTags;
  }
  render() {
    return <Block {...this.props} />;
  }
}

const PLAN_PHASES: GuidePhase[] = ["day4-14", "day15-40", "day41-90", "pre-kvk1"];

function withFolded(items: ViewBlock[]): ViewBlock[] {
  return items.flatMap((b) => [b, ...b.folded]);
}

/** How many render steps the whole body has: every block, every "Already done?" block, then the budget. */
export function renderSteps(view: GuideView): number {
  return view.sections.reduce((n, s) => n + withFolded(s.blocks).length, 0) + view.alreadyDone.length + 1;
}

/** The guide itself: section index, sections in GUIDE_SECTIONS order, "Already done?", budget. */
export function GuideBody({ view, badges, budget, profileTags = true, idPrefix = "s", limit }: Props) {
  // Progressive render (Q2 P2-10): a step budget spent in page order.
  let left = limit ?? Number.POSITIVE_INFINITY;
  const take = (items: ViewBlock[]): ViewBlock[] => {
    const out = left >= items.length ? items : items.slice(0, Math.max(0, left));
    left -= out.length;
    return out;
  };
  const toc = [
    ...view.sections.map((s) => ({ href: `#${idPrefix}-${s.id}`, label: sectionTitle(s.title) })),
    ...(view.alreadyDone.length > 0 ? [{ href: "#already-done", label: `Already done? (${view.alreadyDone.length})` }] : []),
    ...(budget ? [{ href: "#budget", label: "Budget reality check" }] : []),
  ];
  const blk = (b: ViewBlock, level: 3 | 4) => <StableBlock key={b.block.id} item={b} badges={badges} level={level} profileTags={profileTags} />;

  return (
    <div class="g-body">
      <nav class="g-toc" aria-label="Guide sections">
        <details>
          <summary>Sections ({toc.length})</summary>
          <ol>
            {toc.map((t) => <li key={t.href}><a href={t.href}>{t.label}</a></li>)}
          </ol>
        </details>
      </nav>

      {view.sections.map((s) => {
        const hid = `${idPrefix}-${s.id}-h`;
        if (left <= 0) return null;
        if (s.id === "plan") {
          const phases = PLAN_PHASES.map((ph) => ({ ph, items: take(withFolded(s.blocks.filter((b) => b.block.phase === ph))) })).filter((x) => x.items.length > 0);
          const other = take(withFolded(s.blocks.filter((b) => !PLAN_PHASES.includes(b.block.phase))));
          return (
            <section class="g-section" id={`${idPrefix}-${s.id}`} aria-labelledby={hid} key={s.id}>
              <h2 id={hid}>{sectionTitle(s.title)}</h2>
              {phases.map(({ ph, items }) => (
                <div class="g-phase" key={ph}>
                  <h3 class="g-phase-title">{PHASE_TITLES[ph] ?? ph}</h3>
                  {items.map((b) => blk(b, 4))}
                </div>
              ))}
              {other.map((b) => blk(b, 3))}
            </section>
          );
        }
        return (
          <section class="g-section" id={`${idPrefix}-${s.id}`} aria-labelledby={hid} key={s.id}>
            <h2 id={hid}>{sectionTitle(s.title)}</h2>
            {take(withFolded(s.blocks)).map((b) => blk(b, 3))}
          </section>
        );
      })}

      {view.alreadyDone.length > 0 && left > 0 && (
        <section class="g-section g-done" id="already-done" aria-label="Already done?">
          <details>
            <summary>
              <h2>Already done?</h2>
              <span class="g-done-count">
                {view.alreadyDone.length} {view.alreadyDone.length === 1 ? "step" : "steps"} for an earlier City Hall or kingdom phase. Check you didn't miss any.
              </span>
            </summary>
            {take(view.alreadyDone).map((b) => blk(b, 3))}
          </details>
        </section>
      )}

      {budget && left > 0 && <Budget budget={budget} profile={view.profile as AccountProfile} />}
    </div>
  );
}

/** One-line summary under the title: who the guide is for, how many blocks apply, patch checked. */
export function GuideMeta({ view, label }: { view: GuideView; label: string }) {
  const first = view.sections[0]?.blocks[0]?.block ?? view.alreadyDone[0]?.block;
  const done = view.alreadyDone.length;
  return (
    <p class="g-meta">
      {label}. <span class="mono">{view.meta.shownBlocks}</span> of <span class="mono">{view.meta.totalBlocks}</span> steps apply
      {done > 0 && <>, <span class="mono">{done}</span> probably done</>}.
      {first && first.patch.version !== "unknown" && (
        <> Checked against patch <span class="mono">{first.patch.version}</span> on <span class="mono">{first.patch.asOf}</span>.</>
      )}
    </p>
  );
}

/** Block confidence at a glance, in words (static guide pages). */
export function GuideConfidence({ view }: { view: GuideView }) {
  const blocks = [...view.sections.flatMap((s) => withFolded(s.blocks)), ...view.alreadyDone].map((b) => b.block);
  return (
    <p class="g-meta g-conf-summary" data-confidence-summary>
      <span>Steps by confidence:</span>
      {confidenceCounts(blocks).map((c) => (
        <span key={c.level} class="g-conf-count">
          <Confidence level={c.level} short /> <span class="mono">{c.count}</span>
        </span>
      ))}
    </p>
  );
}

/** "Guides for you": other guides that fit this profile, with why, plus the full list. */
export function GuidesForYou({ links, title = "Guides for you" }: { links: readonly GuideLink[]; title?: string }) {
  return (
    <nav class="g-foryou" aria-labelledby="g-foryou-h" data-guides-for-you>
      <h2 id="g-foryou-h" class="g-foryou-title">{title}</h2>
      {links.some((l) => !l.included) && (
        <ul>
          {links.filter((l) => !l.included).map((l) => (
            <li key={l.set} data-guide-link={l.set}>
              <a href={l.href}>{l.title}</a>
              <span class="g-foryou-why">{l.reason}</span>
            </li>
          ))}
        </ul>
      )}
      {links.filter((l) => l.included).map((l) => (
        <p key={l.set} class="g-foryou-also" data-guide-link={l.set} data-included>
          <span>Already in your guide: </span>
          <a href={l.href}>{l.title}</a>
          <span class="g-foryou-why">{l.reason}</span>
        </p>
      ))}
      <a class="g-foryou-all" href="/guides/">All guides</a>
    </nav>
  );
}
