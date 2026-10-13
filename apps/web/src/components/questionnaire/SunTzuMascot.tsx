import { useEffect, useRef, useState } from "preact/hooks";
import { HD_MEDIA, MASCOT_CLIPS, type MascotClips } from "./mascot-clips";
import { SunTzuAvatar, pulseAttr, type MascotProps, type MascotState } from "./SunTzuAvatar";

const matches = (query: string): boolean => typeof matchMedia === "function" && matchMedia(query).matches;

/** The clip URL for a state: its own clip, else idle; 720 px only on dense, wide screens. */
export function clipSrc(clips: MascotClips, state: MascotState | undefined, hd: boolean): string | null {
  if (!clips.poster || !state) return null;
  const clip = clips[state] ?? clips.idle;
  if (!clip) return null;
  return hd && clip.hd ? clip.hd : clip.sd;
}

/**
 * Sun Tzu in the chat. With clips (mascot-clips.ts): a card on the clip's own background, the poster
 * first (server render and first paint load no video), then a muted, inline, looping MP4 for the
 * current state with preload="metadata", paused while off-screen. Poster only under
 * prefers-reduced-motion, and for a still (history) mascot. Without clips: the 2D SVG avatar.
 * Always decorative (aria-hidden): the bubble text says everything.
 */
export function SunTzuMascot({ clips = MASCOT_CLIPS, ...props }: MascotProps & { clips?: MascotClips }) {
  const { state, size = 40 } = props;
  // Decided after mount so the server render (and hydration) is the poster.
  const [media, setMedia] = useState<{ play: boolean; hd: boolean }>({ play: false, hd: false });
  const video = useRef<HTMLVideoElement>(null);
  const src = media.play ? clipSrc(clips, state, media.hd) : null;

  useEffect(() => setMedia({ play: !matches("(prefers-reduced-motion: reduce)"), hd: matches(HD_MEDIA) }), []);

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
  }, [src]);

  if (!clips.poster) return <SunTzuAvatar {...props} />;

  return (
    <span class="st-avatar st-card" data-state={state} data-pulse={pulseAttr(props.pulse)} style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      {src ? (
        <video key={src} ref={video} src={src} poster={clips.poster} width={size} height={size} muted playsInline loop preload="metadata" disablePictureInPicture tabIndex={-1} />
      ) : (
        <img src={clips.poster} width={size} height={size} alt="" decoding="async" />
      )}
    </span>
  );
}
