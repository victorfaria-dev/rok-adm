// Video clips for Sun Tzu (owner decision: short clips, not 3D). None exist yet, so this is empty
// and the 2D SVG avatar is shown. When the clips arrive, put them in apps/web/public/mascot/suntzu/
// and fill in the paths, e.g.:
//   export const MASCOT_CLIPS: MascotClips = {
//     poster: "/mascot/suntzu/poster.webp",
//     idle: "/mascot/suntzu/idle.mp4", talking: "/mascot/suntzu/talk.mp4", grumble: "/mascot/suntzu/grumble.mp4",
//   };
// Format: MP4 (H.264), square, on the clip's own opaque background (no alpha), a few seconds, loopable.
import type { MascotState } from "./SunTzuAvatar";

export type MascotClips = Partial<Record<MascotState, string>> & {
  /** Still frame shown before playback, off-screen and under reduced motion. Required to use clips. */
  poster?: string;
};

export const MASCOT_CLIPS: MascotClips = {};
