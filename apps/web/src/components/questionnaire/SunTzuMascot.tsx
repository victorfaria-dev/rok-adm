import { useEffect, useRef, useState } from "preact/hooks";
import { MASCOT_CLIPS, wantsHd, type MascotClip, type MascotClips } from "./mascot-clips";
import { SunTzuAvatar, pulseAttr, type MascotProps, type MascotState } from "./SunTzuAvatar";

const matches = (query: string): boolean => typeof matchMedia === "function" && matchMedia(query).matches;

/** The clip that plays in a state: its own, else idle. */
const clipFor = (clips: MascotClips, state: MascotState | undefined): MascotClip | undefined =>
  state ? (clips[state] ?? clips.idle) : undefined;

/** The clip URL for a state: its own clip, else idle; 720 px only when the stage needs it (wantsHd). */
export function clipSrc(clips: MascotClips, state: MascotState | undefined, hd: boolean): string | null {
  if (!clips.poster) return null;
  const clip = clipFor(clips, state);
  if (!clip) return null;
  return hd && clip.hd ? clip.hd : clip.sd;
}

/** Poster for the clip that plays in this state (its own first frame), else the shared poster. */
function clipPoster(clips: MascotClips, state: MascotState | undefined): string | undefined {
  return clipFor(clips, state)?.poster || clips.poster;
}

/** Stage size used for the SVG fallback (the video stage is sized in CSS). */
const SVG_STAGE_PX = 160;

type Props = MascotProps & {
  clips?: MascotClips;
  /**
   * The one animated Sun Tzu on the page: a card above the current question that plays the clip of
   * its state. Without it, a small still poster (chat history), which never loads video.
   */
  stage?: boolean;
};

/**
 * Sun Tzu in the chat. With clips (mascot-clips.ts):
 * - stage: a card on the clips' graphite background, its box reserved in CSS (no layout shift). The
 *   poster comes first (server render and first paint load no video), then one muted, inline MP4
 *   for the current state with preload="metadata" (720 px only when the stage covers more than 480
 *   device px). Paused while off-screen or while the tab is hidden; poster only under
 *   prefers-reduced-motion. On phones the stage sticks to the top as a 72 px strip once scrolled
 *   (data-compact; transform only, so nothing else moves).
 * - otherwise: a small still poster (history bubbles).
 * Without clips: the 2D SVG avatar. Always decorative (aria-hidden): the bubble text says everything.
 */
export function SunTzuMascot({ clips = MASCOT_CLIPS, stage = false, ...props }: Props) {
  const { state, size = 40 } = props;
  // Decided after mount so the server render (and hydration) is the poster.
  const [media, setMedia] = useState<{ play: boolean; hd: boolean }>({ play: false, hd: false });
  // A one-shot clip (greet, approve, victory) that has ended for this state: idle takes over.
  const [ended, setEnded] = useState<MascotState | null>(null);
  const [compact, setCompact] = useState(false);
  const card = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useRef(true);
  const shown: MascotState | undefined = stage ? (ended && ended === state ? "idle" : state) : undefined;
  const clip = clipFor(clips, shown);
  const src = stage && media.play ? clipSrc(clips, shown, media.hd) : null;

  /** Play only while on screen and the tab is visible. */
  const sync = (): void => {
    const v = video.current;
    if (!v) return;
    if (onScreen.current && !(typeof document !== "undefined" && document.hidden)) void v.play()?.catch(() => undefined);
    else v.pause();
  };

  useEffect(() => {
    if (!stage || !clips.poster) return;
    const px = card.current?.getBoundingClientRect().height ?? 0;
    setMedia({ play: !matches("(prefers-reduced-motion: reduce)"), hd: wantsHd(px, typeof devicePixelRatio === "number" ? devicePixelRatio : 1) });
    const el = card.current;
    let io: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver === "function") {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e) return;
          onScreen.current = e.isIntersecting;
          // Partly above the viewport while still on screen: stuck as the compact strip (phones, CSS).
          setCompact(e.isIntersecting && e.boundingClientRect.top < -1);
          sync();
        },
        { threshold: [0, 1] },
      );
      io.observe(el);
    }
    document.addEventListener("visibilitychange", sync);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [stage]);

  useEffect(() => setEnded(null), [state]);
  useEffect(sync, [src]);

  if (!clips.poster) return <SunTzuAvatar {...props} size={stage ? SVG_STAGE_PX : size} />;

  if (!stage) {
    return (
      <span class="st-avatar st-card" style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
        <img src={clips.poster} width={size} height={size} alt="" decoding="async" />
      </span>
    );
  }

  return (
    <span
      ref={card}
      class="st-avatar st-card st-stage"
      data-state={state}
      data-pulse={pulseAttr(props.pulse)}
      data-compact={compact ? "" : undefined}
      aria-hidden="true"
    >
      {src ? (
        <video
          key={src}
          ref={video}
          src={src}
          poster={clipPoster(clips, shown)}
          width={480}
          height={480}
          muted
          playsInline
          loop={!clip?.once}
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          onEnded={() => clip?.once && setEnded(state ?? null)}
        />
      ) : (
        <img src={clipPoster(clips, shown)} width={480} height={480} alt="" decoding="async" />
      )}
    </span>
  );
}
