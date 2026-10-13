// Video clips for Sun Tzu (owner decision: short clips, not 3D). Files live in
// apps/web/public/mascot/ (sources and processing notes in design/mascot/suntzu/clips/README.md).
// Format: MP4 (H.264), square, muted, on the clip's own dark graphite background.
// A state without a clip plays the idle clip (a clip-less "grumble" shakes the stage, via CSS).
// With no poster configured, the 2D SVG avatar is shown instead.
import type { MascotState } from "./SunTzuAvatar";

export interface MascotClip {
  /** 480 px square: the default. */
  sd: string;
  /** 720 px square: only when the stage needs more than 480 device px (wantsHd). */
  hd?: string;
  /** First frame of this clip, shown while it loads (falls back to the shared poster). */
  poster?: string;
  /** Plays once, then the idle clip takes over (greet, approve, victory). Default: seamless loop. */
  once?: boolean;
}

export type MascotClips = Partial<Record<MascotState, MascotClip>> & {
  /** Still frame shown before playback, under reduced motion and in the chat history. Required to use clips. */
  poster?: string;
};

/** Device pixels the 480 px clip covers; beyond that the 720 px clip is worth its extra bytes (~280 KB vs ~120 KB). */
export const SD_DEVICE_PX = 480;

/**
 * Whether the stage needs the 720 px clip: its rendered size in device pixels is above 480
 * (e.g. more than 240 CSS px at 2dppx). The phone stage (160 CSS px at 3x = 480) gets the 480 px clip.
 */
export const wantsHd = (cssPx: number, dpr: number): boolean => cssPx * (dpr || 1) > SD_DEVICE_PX;

export const MASCOT_CLIPS: MascotClips = {
  poster: "/mascot/idle-poster.webp",
  idle: { sd: "/mascot/idle-480.mp4", hd: "/mascot/idle-720.mp4", poster: "/mascot/idle-poster.webp" },
  // While a new bot bubble appears; then back to idle.
  talking: { sd: "/mascot/talk-480.mp4", hd: "/mascot/talk-720.mp4", poster: "/mascot/talk-poster.webp" },
  // Empty or invalid answer (2.25 s, once; replaces the CSS shake).
  grumble: { sd: "/mascot/grumble-480.mp4", hd: "/mascot/grumble-720.mp4", poster: "/mascot/grumble-poster.webp", once: true },
  // Accepted answer (1.75 s, once): plays while the next bubble types, never delays it.
  approve: { sd: "/mascot/approve-480.mp4", hd: "/mascot/approve-720.mp4", poster: "/mascot/approve-poster.webp", once: true },
  // Not recorded yet (they play idle until then): greet: { ..., once: true }, victory: { ..., once: true },
};
