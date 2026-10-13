import { useEffect, useRef, useState } from "preact/hooks";
import { SHARE_ERROR_TEXT, decodeShare, parseRulesDoc, rulesDisplayTitle, shareFromHash, type RulesDoc, type ShareError } from "@rokadm/planner";
import { kingdomStorage } from "../../../lib/kingdom-store";
import { RULES_BUILDER_PATH, RULES_KIND, saveRulesCopy } from "../../../lib/kingdom-rules";
import RulesView from "./RulesView";

type State = { s: "loading" } | { s: "error"; error: ShareError } | { s: "ok"; doc: RulesDoc };

/** Read mode for a shared rules link (#d=...): decode in the browser, render, print, copy. */
export default function RulesViewPage() {
  const [state, setState] = useState<State>({ s: "loading" });
  const [copyError, setCopyError] = useState("");
  const errRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await decodeShare(shareFromHash(location.hash), RULES_KIND, parseRulesDoc);
      if (!alive) return;
      setState(r.ok ? { s: "ok", doc: r.data } : { s: "error", error: r.error });
      if (r.ok) document.title = `${rulesDisplayTitle(r.data)} · KingdomOps`;
    };
    void load();
    const onHash = () => void load();
    addEventListener("hashchange", onHash);
    return () => {
      alive = false;
      removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (state.s === "error") errRef.current?.focus();
  }, [state.s]);

  if (state.s === "loading") {
    return <p class="kg-note" role="status" aria-live="polite" data-loading>Loading the rules…</p>;
  }

  if (state.s === "error") {
    return (
      <div class="kg-card" data-share-error>
        <h1 ref={errRef} tabIndex={-1}>This rules link cannot be opened</h1>
        <p role="alert">{SHARE_ERROR_TEXT[state.error]}</p>
        <p><a href={RULES_BUILDER_PATH}>Go to the rules page builder</a></p>
      </div>
    );
  }

  const doc = state.doc;
  function makeCopy() {
    const { st, blocked } = kingdomStorage();
    if (blocked) {
      setCopyError("This browser blocks saving, so a copy cannot be kept. Allow site data for this site and try again.");
      return;
    }
    try {
      const id = saveRulesCopy(doc, st);
      location.href = `${RULES_BUILDER_PATH}?doc=${encodeURIComponent(id)}`;
    } catch (e) {
      setCopyError(e instanceof Error ? e.message : "The copy could not be saved.");
    }
  }

  return (
    <>
      <RulesView doc={doc} level={1} />
      <div class="kg-noprint kg-grid">
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={() => window.print()} data-print>Print or save as PDF</button>
          <button type="button" class="btn btn-secondary" onClick={makeCopy} data-copy-doc>Make an editable copy</button>
        </div>
        {copyError && <p class="kg-error" role="alert">{copyError}</p>}
        <p class="kg-note">This is a read-only copy carried inside the link. Editing a copy on this device does not change what others see; share a new link after you edit.</p>
      </div>
    </>
  );
}
