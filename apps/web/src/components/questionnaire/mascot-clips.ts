// Video clips for Sun Tzu (owner decision: short clips, not 3D). Files live in
// apps/web/public/mascot/ (sources and processing notes in design/mascot/suntzu/clips/README.md).
// Format: MP4 (H.264), square, muted, seamless loop, on the clip's own dark graphite background.
// A state without a clip plays the idle clip (the card still shakes for "grumble", via CSS).
// With no poster configured, the 2D SVG avatar is shown instead.
import type { MascotState } from "./SunTzuAvatar";

export interface MascotClip {
  /** 480 px square: the default. */
  sd: string;
  /** 720 px square: only for dense screens (HD_MEDIA). */
  hd?: string;
}

export type MascotClips = Partial<Record<MascotState, MascotClip>> & {
  /** Still frame shown before playback and under reduced motion. Required to use clips. */
  poster?: string;
};

/**
 * When the 720 px clip is worth its extra bytes (~280 KB vs ~120 KB): a dense screen that is also
 * wide. Phones (even at 3x) get the 480 px clip; the avatar is at most 48 CSS px there.
 */
export const HD_MEDIA = "(min-resolution: 2dppx) and (min-width: 768px)";

export const MASCOT_CLIPS: MascotClips = {
  poster: "/mascot/idle-poster.webp",
  idle: { sd: "/mascot/idle-480.mp4", hd: "/mascot/idle-720.mp4" },
  // talking and grumble arrive later (README: the talk clip waits for a dark-background version).
};
