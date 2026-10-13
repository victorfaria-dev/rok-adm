import type { CardBadge } from "../../lib/guide-types";
import type { ViewBlock } from "../../lib/guide-view";
import { Confidence } from "./Confidence";

interface Props {
  item: ViewBlock;
  badges: Record<string, CardBadge>;
  /** Heading level of the block title. */
  level: 3 | 4;
  /** Show profile-dependent tags (Recommended, Upcoming). Off for static, profile-free guides. */
  profileTags: boolean;
}

const html = (s: string) => ({ __html: s });
const MAX_SITES = 4;

export function Block({ item, badges, level, profileTags }: Props) {
  const b = item.block;
  const f = item.flags;
  const H = level === 3 ? "h3" : "h4";
  const tid = `b-${b.id}-t`;
  const cards = [...new Set([...b.cards, ...b.patch_cards])];
  const sites = [...new Set(cards.flatMap((c) => badges[c]?.sources ?? []))];
  const shownSites = sites.slice(0, MAX_SITES).join(", ") + (sites.length > MAX_SITES ? ` and ${sites.length - MAX_SITES} more` : "");
  const upcoming = profileTags && f.upcoming && b.ch_range !== null;
  const extras = [
    typeof b.split_views === "string" ? "both views" : null,
    b.uncertain_notes ? "uncertain notes" : null,
    b.gaps.length > 0 ? "pending measurements" : null,
  ].filter((x): x is string => x !== null);
  const moreLabel = `Why${extras.length > 0 ? `, ${extras.join(", ")}` : ""} and sources`;

  return (
    <article class="g-block" id={`b-${b.id}`} data-block-id={b.id} aria-labelledby={tid}>
      <H id={tid} class="g-block-title">{b.title}</H>
      <p class="g-tags">
        {profileTags && f.recommended && <span class="g-tag g-tag-rec">Recommended</span>}
        {upcoming && <span class="g-tag g-tag-up">Upcoming · from CH {b.ch_range![0]}</span>}
        <Confidence level={b.confidence} />
      </p>

      <div class="g-prose" dangerouslySetInnerHTML={html(b.bodyHtml)} />
      {item.lowSpenderNote && (
        <div class="g-note">
          <p class="g-note-label">Low spender note</p>
          <div class="g-prose" dangerouslySetInnerHTML={html(item.lowSpenderNote)} />
        </div>
      )}

      <footer class="g-block-foot">
        <p class="g-patch">
          <span class="mono">{b.patch.version === "unknown" ? "Patch not recorded" : `Verified on patch ${b.patch.version}`}</span>
          <span class="g-patch-note"> · checked <span class="mono">{b.patch.asOf}</span>{b.patch.note ? ` · ${b.patch.note}` : ""}</span>
        </p>
        {/* Wave VG: the why, the uncertain notes and the sources sit behind one disclosure; the sites stay in its label. */}
        <details class="g-more" data-block-more>
          <summary>
            <span class="g-more-what">{moreLabel}</span>
            <span class="g-more-src">Sources: {shownSites || "none listed"} · {cards.length} fact {cards.length === 1 ? "card" : "cards"}</span>
          </summary>
          <div class="g-more-body">
            <div class="g-note">
              <p class="g-note-label">Why</p>
              <div class="g-prose" dangerouslySetInnerHTML={html(b.whyHtml)} />
            </div>
            {typeof b.split_views === "string" && (
              <div class="g-note">
                <p class="g-note-label">Both views</p>
                <div class="g-prose" dangerouslySetInnerHTML={html(b.split_views)} />
              </div>
            )}
            {b.uncertain_notes && (
              <div class="g-note g-note-uncertain">
                <p class="g-note-label">Uncertain</p>
                <div class="g-prose" dangerouslySetInnerHTML={html(b.uncertain_notes)} />
              </div>
            )}
            {b.gaps.length > 0 && (
              <p class="g-gaps">
                Waiting on an in-game measurement: <span class="mono">{b.gaps.join(", ")}</span>
              </p>
            )}
            <div class="g-sources">
              <p class="g-note-label">Fact cards</p>
              <ul>
                {cards.map((id) => {
                  const c = badges[id];
                  return (
                    <li key={id}>
                      <span class="mono">{id}</span> {c?.title ?? ""}
                      <span class="g-src-meta">
                        {c ? <> · {c.label} · <Confidence level={c.confidence} short /> · {c.sources.join(", ") || "no source listed"}</> : " · not in the dataset"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </details>
      </footer>
    </article>
  );
}
