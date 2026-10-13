// Visual overview at the top of a guide (wave VG): progress tower + kingdom calendar (the personal guide only)
// and the scroll timeline (any guide whose steps span at least two dated phases). Static HTML; the island or
// the page script enhances it (lib/guide-timeline-dom.ts, lib/guide-tower-dom.ts).
import type { CalendarMilestone, CardBadge } from "../../lib/guide-types";
import { buildTimeline, hereFor, towerFloors, viewBlocks } from "../../lib/guide-timeline";
import type { GuideView } from "../../lib/guide-view";
import type { AccountProfile } from "@rokadm/core";
import { Calendar } from "./Calendar";
import { Timeline } from "./Timeline";
import { Tower } from "./Tower";

interface Props {
  view: GuideView;
  badges: Record<string, CardBadge>;
  /** Kingdom calendar; omitted on the static guides. */
  calendar?: readonly CalendarMilestone[];
  /** Profile for "you are here"; null on the default and static guides. */
  profile?: AccountProfile | null;
  title?: string;
}

export function GuideVisual({ view, badges, calendar, profile = null, title }: Props) {
  const timeline = buildTimeline(view, badges);
  const here = profile ? hereFor(profile) : null;
  return (
    <div class="gv" data-guide-visual>
      {calendar && (
        <div class="gv-top">
          <Tower floors={towerFloors(timeline, here)} here={here} />
          <Calendar milestones={calendar} blocks={viewBlocks(view)} here={here} />
        </div>
      )}
      {timeline.show && <Timeline timeline={timeline} here={here} title={title} />}
    </div>
  );
}
