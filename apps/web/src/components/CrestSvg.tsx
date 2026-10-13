// The alliance crest drawn as inline SVG with token colours (F-61). Used by the crest builder and the governor card.
import { crestLayout, CREST_H, CREST_W, RIM_WIDTH, TAG_FONT_STACK, type CrestV1 } from "../lib/crest";

interface Props {
  crest: CrestV1;
  class?: string;
  /** Accessible name; omit to hide the drawing from assistive tech (its content is in text nearby). */
  label?: string;
}

export default function CrestSvg({ crest, class: cls, label }: Props) {
  const l = crestLayout(crest);
  return (
    <svg
      class={cls}
      viewBox={`-4 -4 ${CREST_W + 8} ${CREST_H + 8}`}
      focusable="false"
      data-shape={crest.shape}
      data-emblem={crest.emblem}
      data-color={crest.color}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <path d={l.shield} style={`fill: var(--ko-alliance-${crest.color}); stroke: var(--ko-bronze)`} stroke-width={RIM_WIDTH} stroke-linejoin="round" />
      <path d={l.emblem} style="fill: var(--ko-ivory)" />
      {l.tag && (
        <g>
          <rect x={l.tag.band.x} y={l.tag.band.y} width={l.tag.band.w} height={l.tag.band.h} style="fill: var(--ko-alliance-ink)" />
          <text
            x={l.tag.x} y={l.tag.y} style={`fill: var(--ko-ivory); font-family: ${TAG_FONT_STACK}`}
            font-weight="700" font-size={l.tag.size} text-anchor="middle" dominant-baseline="central"
          >
            {l.tag.text}
          </text>
        </g>
      )}
    </svg>
  );
}
