import "./sun-tzu.css";

export type MascotState = "idle" | "talking" | "grumble";

/** Props every Sun Tzu mascot renderer takes (2D SVG now, 3D render frames later). */
export interface MascotProps {
  /**
   * "idle": slow bob and blink; "talking": mouth moves for a moment; "grumble": comic frown and a
   * short head shake (empty or invalid answer); omitted: still.
   */
  state?: MascotState;
  /** Rendered size in px (square). */
  size?: number;
  /** Bumps on every grumble so the shake replays without remounting (a video keeps playing). */
  pulse?: number;
}

/** "odd"/"even": the CSS swaps between two identical shake keyframes, which restarts the animation. */
export const pulseAttr = (pulse: number | undefined): string | undefined =>
  pulse === undefined ? undefined : pulse % 2 ? "odd" : "even";

/**
 * Sun Tzu, the questionnaire's guide: an original chibi strategist drawn as a grumpy, comic old
 * man (furrowed thick brows, small eyes, receding hairline with a topknot and pin, long beard,
 * robe, bamboo scroll). Drawn only with brand tokens (bronze, ivory, graphite) through CSS classes,
 * so it follows the palette. Decorative: the bot's name is always printed next to it as text.
 * Motion lives in sun-tzu.css and only runs under prefers-reduced-motion: no-preference.
 */
export function SunTzuAvatar({ state, size = 40, pulse }: MascotProps) {
  return (
    <span class="st-avatar" data-state={state} data-pulse={pulseAttr(pulse)} style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
        <circle class="st-bg" cx="32" cy="32" r="32" />
        <g class="st-figure">
          <path class="st-robe" d="M10 66C10 53 19 46 32 46S54 53 54 66Z" />
          <path class="st-trim" d="M25.5 46.5 32 56l6.5-9.5" />
          <g transform="rotate(-18 47 52)">
            <rect class="st-scroll" x="40" y="47" width="15" height="9" rx="1.5" />
            <path class="st-slats" d="M43.8 47.5v8M47.5 47.5v8M51.2 47.5v8" />
          </g>
          <circle class="st-skin" cx="32" cy="30" r="14" />
          <path class="st-hair" d="M18.4 34C17 27 18.8 22.6 22.4 20.4 21.2 25 21.3 29.6 22.4 34.6ZM45.6 34C47 27 45.2 22.6 41.6 20.4 42.8 25 42.7 29.6 41.6 34.6Z" />
          <circle class="st-hair" cx="32" cy="14.4" r="4.4" />
          <path class="st-pin" d="M26 15.2 38.6 13.6" />
          <path class="st-wrinkle" d="M27.5 20.6q4.5-1.6 9 0M28.6 23q3.4-1.1 6.8 0" />
          <g class="st-brows">
            <path class="st-brow" d="M22.6 26.2 29.4 28.8M41.4 26.2 34.6 28.8" />
          </g>
          <g class="st-eyes">
            <circle cx="27.2" cy="31.6" r="1.15" />
            <circle cx="36.8" cy="31.6" r="1.15" />
          </g>
          <path class="st-line" d="M31 33.6q1 1.6 2 0" />
          <path class="st-beard" d="M24.6 37.6C24.6 46 27.6 54 32 61 36.4 54 39.4 46 39.4 37.6 36 40.6 28 40.6 24.6 37.6Z" />
          <path class="st-strand" d="M29 44q1.4 5 3 9M35 44q-1.4 5-3 9" />
          <path class="st-beard" d="M32 35.8C29 35.3 26.4 36.8 25.4 39.8 27.8 38.6 30 38.4 32 38.2 34 38.4 36.2 38.6 38.6 39.8 37.6 36.8 35 35.3 32 35.8Z" />
          <ellipse class="st-mouth" cx="32" cy="39.8" rx="1.4" ry=".6" />
          <path class="st-frown" d="M29.4 41.2Q32 38.8 34.6 41.2" />
          <circle class="st-hand" cx="43.5" cy="56" r="2.7" />
        </g>
      </svg>
    </span>
  );
}
