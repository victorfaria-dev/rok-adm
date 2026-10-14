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
  const shownSites = sites.slice(0, MAX_SITES).join(", ") + (sites.length > MAX_SITES ? ` e mais ${sites.length - MAX_SITES}` : "");
  const upcoming = profileTags && f.upcoming && b.ch_range !== null;
  const extras = [
    typeof b.split_views === "string" ? "as duas visões" : null,
    b.uncertain_notes ? "notas incertas" : null,
    b.gaps.length > 0 ? "medições pendentes" : null,
  ].filter((x): x is string => x !== null);
  const moreLabel = `Por quê${extras.length > 0 ? `, ${extras.join(", ")}` : ""} e fontes`;

  return (
    <article class="g-block" id={`b-${b.id}`} data-block-id={b.id} aria-labelledby={tid}>
      <H id={tid} class="g-block-title">{b.title}</H>
      <p class="g-tags">
        {profileTags && f.recommended && <span class="g-tag g-tag-rec">Recomendado</span>}
        {upcoming && <span class="g-tag g-tag-up">Em breve · a partir da Pref. {b.ch_range![0]}</span>}
        <Confidence level={b.confidence} />
      </p>

      <div class="g-prose" dangerouslySetInnerHTML={html(b.bodyHtml)} />
      {item.lowSpenderNote && (
        <div class="g-note">
          <p class="g-note-label">Nota para quem gasta pouco</p>
          <div class="g-prose" dangerouslySetInnerHTML={html(item.lowSpenderNote)} />
        </div>
      )}

      <footer class="g-block-foot">
        <p class="g-patch">
          <span class="mono">{b.patch.version === "unknown" ? "Atualização não registrada" : `Verificado na atualização ${b.patch.version}`}</span>
          <span class="g-patch-note"> · conferido em <span class="mono">{b.patch.asOf}</span>{b.patch.note ? ` · ${b.patch.note}` : ""}</span>
        </p>
        {/* Wave VG: the why, the uncertain notes and the sources sit behind one disclosure; the sites stay in its label. */}
        <details class="g-more" data-block-more>
          <summary>
            <span class="g-more-what">{moreLabel}</span>
            <span class="g-more-src">Fontes: {shownSites || "nenhuma listada"} · {cards.length} {cards.length === 1 ? "ficha de fato" : "fichas de fatos"}</span>
          </summary>
          <div class="g-more-body">
            <div class="g-note">
              <p class="g-note-label">Por quê</p>
              <div class="g-prose" dangerouslySetInnerHTML={html(b.whyHtml)} />
            </div>
            {typeof b.split_views === "string" && (
              <div class="g-note">
                <p class="g-note-label">As duas visões</p>
                <div class="g-prose" dangerouslySetInnerHTML={html(b.split_views)} />
              </div>
            )}
            {b.uncertain_notes && (
              <div class="g-note g-note-uncertain">
                <p class="g-note-label">Incerto</p>
                <div class="g-prose" dangerouslySetInnerHTML={html(b.uncertain_notes)} />
              </div>
            )}
            {b.gaps.length > 0 && (
              <p class="g-gaps">
                Aguardando uma medição no jogo: <span class="mono">{b.gaps.join(", ")}</span>
              </p>
            )}
            <div class="g-sources">
              <p class="g-note-label">Fichas de fatos</p>
              <ul>
                {cards.map((id) => {
                  const c = badges[id];
                  return (
                    <li key={id}>
                      <span class="mono">{id}</span> {c?.title ?? ""}
                      <span class="g-src-meta">
                        {c ? <> · {c.label} · <Confidence level={c.confidence} short /> · {c.sources.join(", ") || "nenhuma fonte listada"}</> : " · fora da base de dados"}
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
