// Guide island (client). The static default F2P guide arrives as `children`
// (rendered at build). After mount, it picks the profile (?p= over the saved one),
// fetches the lean /data/guide.json and re-filters with selectBlocks.
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { readStore, writeStore } from "../../lib/store";
import { profileSummary } from "../../lib/profile";
import { deltaSetsFor, isLateStage } from "@rokadm/core";
import type { GuideData, GuidePayload, LowBudgetPayload } from "../../lib/guide-types";
import {
  chooseProfile,
  deltaUrl,
  FALLBACK_STAGE,
  LATE_SET,
  LOW_BUDGET_URL,
  selectGuideWithFallback,
  showsLowTargets,
  shareUrl,
  STAGE_NAMES,
  withDeltas,
  type ProfileChoice,
} from "../../lib/guide-view";
import { guidePage, guidesForYou } from "../../lib/guides";
import { GuideBody, GuideMeta, GuidesForYou, renderSteps } from "./GuideBody";
import { GuideVisual } from "./GuideVisual";
import { enhanceGuideTimeline, goToBlock, NEED_BLOCK } from "../../lib/guide-timeline-dom";
import { enhanceGuideTower } from "../../lib/guide-tower-dom";

interface Props {
  dataUrl: string;
  children?: ComponentChildren;
}

type Status = "idle" | "loading" | "ready" | "failed";

const latePage = guidePage("latestage");

/** Steps (blocks) of the personal guide in the first pass, then per idle period. */
const FIRST_STEPS = 6;
const STEP = 6;

/** Run `fn` when the browser is idle (or soon, where requestIdleCallback is missing). Returns a cancel. */
function afterIdle(fn: () => void): () => void {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout: 500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = setTimeout(fn, 16);
  return () => clearTimeout(id);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers or a denied permission: hidden textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Keep the shell's profile chips in step after "Use this profile" (same text as ProfileChip). */
function refreshChips(summary: string) {
  for (const chip of document.querySelectorAll<HTMLAnchorElement>("[data-profile-chip]")) {
    const text = chip.querySelector("[data-chip-text]");
    if (text) text.textContent = summary;
    chip.href = "/me/";
    chip.removeAttribute("data-empty");
    chip.setAttribute("aria-label", `Your profile: ${summary}`);
  }
}

export default function GuideIsland({ dataUrl, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ProfileChoice | null>(null);
  const [data, setData] = useState<GuideData | null>(null);
  /** Late-game guide (KvK2, KvK3, SoC profiles); null when not needed or it failed to load. */
  const [late, setLate] = useState<GuidePayload | null>(null);
  /** Low spender targets (Low profile only); null when not needed or it failed to load. */
  const [lowBudget, setLowBudget] = useState<LowBudgetPayload | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [live, setLive] = useState("");
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  /** Steps (blocks) of the personal guide rendered so far (Q2 P2-10: the rest follow in idle periods). */
  const [shownSteps, setShownSteps] = useState(FIRST_STEPS);
  /** Block a "Read more" asked for before the progressive render reached it (wave VG). */
  const [pendingBlock, setPendingBlock] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const c = chooseProfile(location.search, readStore().profileCode);
    setChoice(c);
    if (c.source === "default") return;
    setStatus("loading");
    const get = <T,>(url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<T>;
      });
    // Low and higher profiles: the profile delta sets are merged over the F2P guide (core's selectGuide).
    const deltas = deltaSetsFor(c.profile.spending).map((d) => get<GuidePayload>(deltaUrl(d.id)));
    // KvK2, KvK3 and SoC: the late-game guide is the main plan. If it fails, the guide falls back to KvK1 as a whole.
    const lateGuide = isLateStage(c.profile.kingdomStage) ? get<GuidePayload>(deltaUrl(LATE_SET)).catch(() => null) : Promise.resolve(null);
    // Low: its own purchase targets for the budget. If they fail, the budget shows the labelled F2P baseline only.
    const lowTargets = showsLowTargets(c.profile) ? get<LowBudgetPayload>(LOW_BUDGET_URL).catch(() => null) : Promise.resolve(null);
    Promise.all([get<GuideData>(dataUrl), Promise.all(deltas), lateGuide, lowTargets])
      .then(([d, ds, l, lb]) => {
        setData({ ...d, guide: withDeltas(d.guide, ds) });
        setLate(l);
        setLowBudget(lb);
        setStatus("ready");
      })
      .catch(() => setStatus("failed"));
  }, [dataUrl]);

  const summary = choice && choice.source !== "default" ? profileSummary(choice.profile) : null;
  const personal = choice !== null && choice.source !== "default" && data !== null && status === "ready";
  // Memoised so the progressive render keeps the same block objects and skips re-rendering them.
  const selection = useMemo(() => (personal && data && choice ? selectGuideWithFallback(data.guide, choice.profile, late) : null), [personal, data, choice, late]);
  const links = personal ? guidesForYou(choice.profile) : [];
  const view = selection?.view ?? null;
  const empty = view !== null && view.meta.shownBlocks === 0 && view.alreadyDone.length === 0;
  const totalSteps = view ? renderSteps(view) : 0;

  // Render the personal guide in steps so no single task builds the whole ~40k px page. A link to a
  // section (#s-...) renders everything at once so the browser can scroll to it.
  useEffect(() => {
    if (!view || shownSteps > totalSteps) return;
    if (location.hash.length > 1) {
      setShownSteps(totalSteps + 1);
      return;
    }
    return afterIdle(() => setShownSteps((n) => n + STEP));
  }, [view !== null, shownSteps, totalSteps]);

  // Timeline and tower (wave VG): enhance whichever guide is on screen (the static default or the personal one).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const undo = [enhanceGuideTimeline(el), enhanceGuideTower(el)];
    const need = (e: Event) => {
      setShownSteps(Number.POSITIVE_INFINITY);
      setPendingBlock((e as CustomEvent<{ id: string }>).detail.id);
    };
    el.addEventListener(NEED_BLOCK, need);
    return () => {
      el.removeEventListener(NEED_BLOCK, need);
      for (const u of undo) u();
    };
  }, [view, mounted]);

  useEffect(() => {
    if (pendingBlock && goToBlock(pendingBlock)) setPendingBlock(null);
  }, [pendingBlock, shownSteps]);

  async function onShare() {
    const url = shareUrl(location.origin, choice?.code ?? null);
    setManualUrl(null);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "My KingdomOps guide", url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    if (await copyText(url)) {
      setLive("");
      // Re-set so a second copy is announced again.
      requestAnimationFrame(() => setLive("Link copied"));
    } else {
      setManualUrl(url);
      setLive("Copy the link below");
    }
  }

  function onSave() {
    if (!choice?.code) return;
    writeStore({ profileCode: choice.code });
    setChoice({ ...choice, canSave: false });
    refreshChips(profileSummary(choice.profile));
    setLive("Saved. This is now your profile.");
  }

  return (
    <div class="g-island" ref={root}>
      {choice?.error && (
        <div class="g-error" role="alert">
          <p>{choice.error}</p>
          <a href="/start/">Build my guide</a>
        </div>
      )}

      {mounted && summary && (
        <div class="g-bar">
          <p class="g-bar-who">
            {choice?.source === "url" ? "Shared profile: " : "Your profile: "}
            <span class="mono">{summary}</span>
          </p>
          <div class="g-bar-actions">
            {choice?.canSave && status !== "failed" && (
              <button type="button" class="btn btn-primary" onClick={onSave}>Use this profile</button>
            )}
            <button type="button" class="btn btn-secondary" onClick={onShare}>Share</button>
          </div>
          <p class="g-live" aria-live="polite" role="status">{live}</p>
          {manualUrl && (
            <label class="g-manual">
              Link to this guide
              <input type="text" readOnly value={manualUrl} onFocus={(e) => (e.currentTarget as HTMLInputElement).select()} />
            </label>
          )}
        </div>
      )}

      {status === "loading" && <p class="g-loading" role="status">Loading the guide for this profile…</p>}
      {status === "failed" && (
        <p class="g-error" role="alert">Could not load the guide for this profile, so you are seeing the default F2P guide. Check your connection and reload.</p>
      )}

      {view && choice ? (
        <div class="g-personal" data-guide="personal">
          {selection?.lateStage && (
            <aside class="g-notice" data-guide-late aria-labelledby="g-late-h">
              <p id="g-late-h" class="g-notice-title">Your plan for {STAGE_NAMES[choice.profile.kingdomStage]}</p>
              <p>
                Your kingdom is past KvK1, so the main plan below is the <a href={latePage.href}>late game guide</a> for KvK2, KvK3
                and Season of Conquest, plus the daily routine.
                {selection.fallbackSections.length > 0 && (
                  <> Sections marked “Closest available: KvK1 content” have no late-game steps yet.</>
                )}
              </p>
            </aside>
          )}
          {selection?.fallbackFrom && !selection.lateStage && (
            <aside class="g-notice" data-guide-fallback aria-labelledby="g-fallback-h">
              <p id="g-fallback-h" class="g-notice-title">Closest available: {STAGE_NAMES[FALLBACK_STAGE]} content</p>
              <p>
                Your kingdom is at {STAGE_NAMES[selection.fallbackFrom]}. The late game guide could not be loaded, so this page
                shows the steps written for {STAGE_NAMES[FALLBACK_STAGE]}, the closest stage we have. Some may not fit your kingdom;
                check them against what your kingdom is doing now, or reload to try again.
              </p>
            </aside>
          )}
          <GuideMeta view={view} label={`For ${profileSummary(choice.profile)}`} />
          <GuidesForYou links={links} />
          <GuideVisual view={view} badges={data!.guide.badges} calendar={data!.calendar} profile={choice.profile} />
          {empty && (
            <aside class="g-notice" data-guide-empty aria-labelledby="g-empty-h">
              <p id="g-empty-h" class="g-notice-title">No researched steps fit this profile yet</p>
              <p>
                None of the guide steps we have researched apply to this profile. That is a gap in our research, not something
                you did wrong. You can <a href="/start/">check your answers</a>; the <a href="/guides/new-kingdom/">new kingdom guide</a> is
                also worth a look.
              </p>
            </aside>
          )}
          <GuideBody view={view} badges={data!.guide.badges} budget={data!.budget} lowBudget={lowBudget} limit={shownSteps} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
