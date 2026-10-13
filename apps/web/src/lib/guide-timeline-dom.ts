// Client enhancement of the guide timeline (wave VG). The timeline is static HTML that works without JS;
// this adds: arrow keys / Home / End between steps, Escape to close a step, the current phase highlighted
// as you scroll, steps revealed as they come into view (never under reduced motion), and "Read more"
// links that open a closed "Already done?" before jumping to the full step.
// Used by the guide island (/guide/) and by a tiny script on the static guides (/guides/*).

const REDUCE = "(prefers-reduced-motion: reduce)";

function reducedMotion(): boolean {
  try {
    return matchMedia(REDUCE).matches;
  } catch {
    return false;
  }
}

/** Open every closed <details> around `el`, so a jump to it lands on visible text. */
export function openAncestors(el: Element): void {
  for (let d = el.parentElement?.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
}

/** Jump to a block (#b-<id>): open its ancestors, scroll, focus it for screen readers. False when it isn't on the page. */
export function goToBlock(id: string): boolean {
  const target = document.getElementById(`b-${id}`);
  if (!target) return false;
  openAncestors(target);
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  // Instant jump, then once more after layout settles: sections skipped by content-visibility get their real
  // height only when rendered, which moves the target after the first jump.
  // "instant" overrides the page's smooth scroll-behavior, so the corrections below land on the final spot.
  const jump = () => target.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
  jump();
  target.focus({ preventScroll: true });
  let last = Number.NaN;
  let frames = 0;
  const settle = () => {
    const top = target.getBoundingClientRect().top;
    if (top === last || ++frames > 20) return;
    last = top;
    jump();
    requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
  try {
    history.replaceState(history.state, "", `#b-${id}`);
  } catch {
    // sandboxed frames
  }
  return true;
}

/** Event a "Read more" fires on the page when its block is not rendered yet (the island renders all, then jumps). */
export const NEED_BLOCK = "ko:guide-need-block";

function enhanceTimeline(root: HTMLElement): () => void {
  root.dataset.enhanced = "";
  const STEP = ".tl-node > details > summary, .tl-fold > summary";
  // Steps inside a folded "probably done" phase are skipped until it is opened.
  const summaries = () => [...root.querySelectorAll<HTMLElement>(STEP)].filter((s) => s.getClientRects().length > 0);
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (e.key === "Escape") {
      const d = t.closest<HTMLDetailsElement>(".tl-node > details, .tl-fold");
      if (d?.open) {
        d.open = false;
        d.querySelector<HTMLElement>("summary")?.focus();
        e.preventDefault();
      }
      return;
    }
    if (!t.matches(STEP)) return;
    const all = summaries();
    const i = all.indexOf(t);
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? all[i + 1]
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? all[i - 1]
      : e.key === "Home" ? all[0]
      : e.key === "End" ? all[all.length - 1]
      : undefined;
    if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") e.preventDefault();
    next?.focus();
  };
  root.addEventListener("keydown", onKey);

  const observers: IntersectionObserver[] = [];
  if (typeof IntersectionObserver === "function") {
    // Current phase: the lane crossing the middle band of the viewport.
    const lanes = [...root.querySelectorAll<HTMLElement>(".tl-lane")];
    const active = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const l of lanes) l.toggleAttribute("data-active", l === e.target);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const l of lanes) active.observe(l);
    observers.push(active);

    // Reveal: steps slide in as they enter the viewport. Off under reduced motion: everything stays visible.
    if (!reducedMotion()) {
      const nodes = [...root.querySelectorAll<HTMLElement>(".tl-node:not([data-shown])")];
      const show = (el: Element) => {
        el.setAttribute("data-shown", "");
        el.removeAttribute("data-wait");
      };
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            show(e.target);
            reveal.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      for (const n of nodes) {
        n.setAttribute("data-wait", "");
        reveal.observe(n);
      }
      observers.push(reveal);
      root.setAttribute("data-reveal", "");
    }
  }
  // A step that gets focus is shown at once (keyboard users never land on a hidden step).
  const onFocus = (e: FocusEvent) => {
    const n = (e.target as Element).closest(".tl-node");
    n?.setAttribute("data-shown", "");
    n?.removeAttribute("data-wait");
  };
  root.addEventListener("focusin", onFocus);

  return () => {
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("focusin", onFocus);
    for (const o of observers) o.disconnect();
    root.removeAttribute("data-reveal");
    delete root.dataset.enhanced;
  };
}

/** "Read more" and calendar step links: open the step even when it sits in a closed "Already done?". */
function onReadMore(e: MouseEvent): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-read-more]");
  if (!a) return;
  const id = a.dataset.readMore!;
  e.preventDefault();
  if (!goToBlock(id)) a.dispatchEvent(new CustomEvent(NEED_BLOCK, { bubbles: true, detail: { id } }));
}

/** Enhance every timeline under `scope` not enhanced yet. Returns a cleanup for those. */
export function enhanceTimelines(scope: ParentNode): () => void {
  const cleanups = [...scope.querySelectorAll<HTMLElement>("[data-timeline]:not([data-enhanced])")].map(enhanceTimeline);
  return () => {
    for (const c of cleanups) c();
  };
}

/** "Read more" / calendar step links under `host` (one delegated listener). */
export function listenReadMore(host: HTMLElement): () => void {
  host.addEventListener("click", onReadMore);
  return () => host.removeEventListener("click", onReadMore);
}

/** Both of the above, for a whole page or a container. */
export function enhanceGuideTimeline(scope: ParentNode = document): () => void {
  const undo = [enhanceTimelines(scope), listenReadMore(scope instanceof Document ? scope.body : (scope as HTMLElement))];
  return () => {
    for (const u of undo) u();
  };
}
