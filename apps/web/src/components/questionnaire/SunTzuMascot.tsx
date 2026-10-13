import { useEffect, useRef, useState } from "preact/hooks";
import { MASCOT_CLIPS, type MascotClips } from "./mascot-clips";
import { SunTzuAvatar, type MascotProps, type MascotState } from "./SunTzuAvatar";

const reducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The clip for a state; a still mascot (no state) uses the idle clip's poster only. */
function clipFor(clips: MascotClips, state: MascotState | undefined): string | null {
  if (!clips.poster || !state) return null;
  return clips[state] ?? clips.idle ?? null;
}

/**
 * Sun Tzu in the chat. Default: the 2D SVG avatar. With video clips configured (mascot-clips.ts):
 * a card with the clip's own background, poster first (server render and first paint load no
 * video), then a muted, inline, looping MP4 for the current state, preload="metadata", paused
 * while off-screen. Poster only under prefers-reduced-motion. Always decorative (aria-hidden):
 * the bubble text says everything.
 */
export function SunTzuMascot({ clips = MASCOT_CLIPS, ...props }: MascotProps & { clips?: MascotClips }) {
  const { state, size = 40 } = props;
  const [canPlay, setCanPlay] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const src = clipFor(clips, state);

  useEffect(() => setCanPlay(!reducedMotion()), []);

  // Play only while on screen.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const play = (): void => void v.play()?.catch(() => undefined);
    if (typeof IntersectionObserver !== "function") {
      play();
      return;
    }
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? play() : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [src, canPlay]);

  if (!clips.poster) return <SunTzuAvatar {...props} />;

  const box = { width: `${size}px`, height: `${size}px` };
  return (
    <span class="st-avatar st-card" data-state={state} style={box} aria-hidden="true">
      {src && canPlay ? (
        <video key={src} ref={video} src={src} poster={clips.poster} width={size} height={size} muted playsInline loop preload="metadata" disablePictureInPicture tabIndex={-1} />
      ) : (
        <img src={clips.poster} width={size} height={size} alt="" decoding="async" />
      )}
    </span>
  );
}
