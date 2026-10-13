// The one import that picks how Sun Tzu is drawn in the chat.
//
// SunTzuMascot renders the original 2D SVG (SunTzuAvatar) until video clips are configured in
// mascot-clips.ts; then it shows a muted, looping MP4 per state (idle / talking / grumble) in a
// card, poster only under reduced motion, paused off-screen. To use some other renderer later,
// give it the same MascotProps and change the export below. Keep it decorative (aria-hidden) and
// keep MASCOT_NAME printed as text next to it.
export { SunTzuMascot as Mascot } from "./SunTzuMascot";
export type { MascotProps, MascotState } from "./SunTzuAvatar";

/** The bot's name, always shown as text next to the (decorative) mascot. */
export const MASCOT_NAME = "Sun Tzu";
