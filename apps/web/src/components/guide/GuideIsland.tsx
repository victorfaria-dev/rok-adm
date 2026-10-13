// Guide island (client). The static default F2P guide arrives as `children`
// (rendered at build). After mount, it picks the profile (?p= over the saved one),
// fetches the lean /data/guide.json and re-filters with selectBlocks.
import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import { readStore, writeStore } from "../../lib/store";
import { profileSummary } from "../../lib/profile";
import type { GuideData } from "../../lib/guide-types";
import { chooseProfile, FALLBACK_STAGE, selectGuideWithFallback, shareUrl, STAGE_NAMES, type ProfileChoice } from "../../lib/guide-view";
import { GuideBody, GuideMeta } from "./GuideBody";

interface Props {
  dataUrl: string;
  children?: ComponentChildren;
}

type Status = "idle" | "loading" | "ready" | "failed";

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
  const [status, setStatus] = useState<Status>("idle");
  const [live, setLive] = useState("");
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const c = chooseProfile(location.search, readStore().profileCode);
    setChoice(c);
    if (c.source === "default") return;
    setStatus("loading");
    fetch(dataUrl)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<GuideData>;
      })
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("failed"));
  }, [dataUrl]);

  const summary = choice && choice.source !== "default" ? profileSummary(choice.profile) : null;
  const personal = choice !== null && choice.source !== "default" && data !== null && status === "ready";
  const selection = personal ? selectGuideWithFallback(data.guide, choice.profile) : null;
  const view = selection?.view ?? null;
  const empty = view !== null && view.meta.shownBlocks === 0 && view.alreadyDone.length === 0;

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
    <div class="g-island">
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
          {selection?.fallbackFrom && (
            <aside class="g-notice" data-guide-fallback aria-labelledby="g-fallback-h">
              <p id="g-fallback-h" class="g-notice-title">Closest available: {STAGE_NAMES[FALLBACK_STAGE]} content</p>
              <p>
                Your kingdom is at {STAGE_NAMES[selection.fallbackFrom]}. Guide steps for KvK2 and later are not researched yet,
                so this page shows the steps written for {STAGE_NAMES[FALLBACK_STAGE]}, the closest stage we have. Some may not fit
                your kingdom; check them against what your kingdom is doing now.
              </p>
            </aside>
          )}
          <GuideMeta view={view} label={`For ${profileSummary(choice.profile)}`} />
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
          <GuideBody view={view} badges={data!.guide.badges} budget={data!.budget} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
