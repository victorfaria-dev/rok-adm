// The one import that picks how Sun Tzu is drawn. Today: the 2D SVG (SunTzuAvatar).
//
// The 3D team will deliver design/mascot/suntzu/ with a model that has idle / talk / grumble clips
// and a 512x512 poster.png. To switch, add a renderer with the same MascotProps, for example
// SunTzu3D.tsx: show poster.png as <img alt=""> at first paint (no extra JS on /start), then,
// only under prefers-reduced-motion: no-preference and within the route's JS budget, load the
// model on demand and map state → clip ("idle" → idle, "talking" → talk, "grumble" → grumble).
// Then change the export below to `export { SunTzu3D as Mascot } from "./SunTzu3D";`.
// Keep it decorative (aria-hidden) and keep MASCOT_NAME printed as text next to it.
export { SunTzuAvatar as Mascot, type MascotProps, type MascotState } from "./SunTzuAvatar";

/** The bot's name, always shown as text next to the (decorative) mascot. */
export const MASCOT_NAME = "Sun Tzu";
