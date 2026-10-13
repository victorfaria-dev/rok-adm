// The K symbol from the brand kit (design/brand/svg/kingdomops-icon-dark.svg), path data inlined so the
// card canvas and the logo sting can draw it without fetching an asset. Shapes are never altered.

export const K_VIEWBOX = { x: -12, y: -12, w: 239, h: 222 } as const;

/** The three facets, in the order the motion script assembles them (roteiro.md, scene 2). */
export const K_FACETS = {
  /** Top block: slides down. */
  top: "M0,39 L64,0 L64,59 L0,102 Z",
  /** Stem and arm: slides in along the diagonal from the top right. */
  arm: "M0,120 L141,16 L215,16 L108,102 L82,102 L43,140 L43,173 L0,198 Z",
  /** Leg: slides in from the bottom right. */
  leg: "M60,138 L87,112 L113,112 L215,198 L132,198 Z",
} as const;

export const K_PATHS: readonly string[] = [K_FACETS.top, K_FACETS.arm, K_FACETS.leg];
