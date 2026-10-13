// Progress tower (F-62 v0, wave VG): one floor per phase, bottom = days 0–3, top = pre-KvK1 and KvK1, with
// the profile's floor marked. Static SVG that always works; with JS, "View in 3D" (lib/guide-tower-dom.ts)
// loads Three.js on demand and falls back to this SVG with a message when WebGL is missing.
import type { Floor, Here } from "../../lib/guide-timeline";

interface Props {
  floors: readonly Floor[];
  here: Here | null;
}

const BASE_W = 196;
const STEP_W = 22;
const FLOOR_H = 32;
const GAP = 6;
const CX = 146;
const TOP = 40;

const short = (f: Floor) => (f.lane === "pre-kvk1" ? "Pre-KvK1" : f.title);

export function Tower({ floors, here }: Props) {
  const n = floors.length;
  const height = TOP + n * (FLOOR_H + GAP) + 8;
  const yOf = (i: number) => TOP + (n - 1 - i) * (FLOOR_H + GAP);
  const wOf = (i: number) => BASE_W - i * STEP_W;
  const hereIdx = here?.lane === "past" ? n : floors.findIndex((f) => f.here);
  const hereFloor = hereIdx >= 0 && hereIdx < n ? floors[hereIdx] : null;
  const caption = hereFloor
    ? `You are on the ${short(hereFloor)} floor (${here!.text}).`
    : here?.lane === "past"
      ? `You are past the top floor: ${here.text}.`
      : "Personalize your guide to see your floor.";
  const data = JSON.stringify(floors.map((f) => ({ t: short(f), s: f.steps })));
  return (
    <figure class="tw" data-tower data-floors={data} data-here={hereIdx}>
      <div class="tw-view">
        <svg class="tw-svg" viewBox={`0 0 252 ${height}`} role="img" aria-labelledby="tw-cap" data-tower-svg>
          {/* Flag on the top floor: KvK1 is the goal. */}
          <line class="tw-pole" x1={CX} x2={CX} y1={TOP - 34} y2={TOP} />
          <path class="tw-flag" d={`M${CX} ${TOP - 34} l26 7 l-26 7 z`} />
          {floors.map((f, i) => {
            const w = wOf(i);
            const y = yOf(i);
            return (
              <g key={f.lane} class={`tw-floor${f.here ? " tw-floor-here" : ""}`} data-floor={f.lane}>
                <rect x={CX - w / 2} y={y} width={w} height={FLOOR_H} rx="3" />
                <text class="tw-label" x={CX} y={y + FLOOR_H / 2 + 4} text-anchor="middle">{short(f)}{f.steps > 0 && <tspan class="tw-steps"> · {f.steps}</tspan>}</text>
              </g>
            );
          })}
          {hereIdx >= 0 && (
            <g class="tw-you" transform={`translate(${hereIdx < n ? CX - wOf(hereIdx) / 2 - 8 : CX - 20} ${hereIdx < n ? yOf(hereIdx) + FLOOR_H / 2 : TOP - 30})`}>
              <path d="M0 0 l-10 -7 v14 z" />
              <text x="-14" y="4" text-anchor="end">You</text>
            </g>
          )}
        </svg>
        <div class="tw-3d" data-tower-host hidden />
      </div>
      <figcaption id="tw-cap" class="tw-cap">
        Progress tower: one floor per phase with its number of steps, days 0–3 at the bottom, KvK1 at the top. {caption}
      </figcaption>
      <div class="tw-actions" data-tower-actions hidden>
        <button type="button" class="btn btn-secondary" data-tower-toggle>View in 3D</button>
        <span class="tw-size">Loads only when you ask (about 140 KB).</span>
      </div>
      <p class="tw-status" role="status" data-tower-status />
      <p class="tw-note" data-tower-fallback hidden />
    </figure>
  );
}
