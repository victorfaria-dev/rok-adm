// Alliance crest builder (F-61, experimental). The 2D SVG editor always works; "View in 3D" loads Three.js on demand
// and falls back to the 2D view with a message when WebGL is missing or the chunk fails to load.
import { useEffect, useRef, useState } from "preact/hooks";
import type { TargetedEvent } from "preact";
import { validateTag } from "../../lib/card";
import {
  ALLIANCE_COLORS, crestFileName, defaultCrest, describeCrest, EMBLEM_LABELS, EMBLEM_NAMES, emblemPoints, pathOf,
  readSavedCrest, SHIELD_LABELS, SHIELD_SHAPES, SHIELDS, writeCrest, type CrestV1,
} from "../../lib/crest";
import type { Crest3D } from "../../lib/crest-3d";
import CrestSvg from "../CrestSvg";
import "./crest.css";

const REDUCE_MQ = "(prefers-reduced-motion: reduce)";
const FALLBACK = "The 3D view is not available on this device or browser, so you are seeing the 2D crest. Everything else still works.";

type Mode = "2d" | "loading" | "3d";

export default function CrestBuilder() {
  const [crest, setCrest] = useState<CrestV1>(defaultCrest);
  const [saved, setSaved] = useState(false);
  const [tagRaw, setTagRaw] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("2d");
  const [reduce, setReduce] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<Crest3D | null>(null);
  const mod = useRef<typeof import("../../lib/crest-3d") | null>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const threeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const c = readSavedCrest();
    if (c) {
      setCrest(c);
      setTagRaw(c.tag);
      setSaved(true);
    }
    try {
      const mq = matchMedia(REDUCE_MQ);
      setReduce(mq.matches);
      if (mq.matches) setAutoRotate(false);
      const onChange = () => {
        setReduce(mq.matches);
        if (mq.matches) setAutoRotate(false);
      };
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      return;
    }
  }, []);

  const fallback = () => {
    view.current?.dispose();
    view.current = null;
    setMode("2d");
    setNotice(FALLBACK);
    setTimeout(() => threeBtn.current?.focus(), 0);
  };

  // Mount (or re-mount after an edit) the 3D view while in 3D mode.
  useEffect(() => {
    if (mode !== "3d" || !host.current || !mod.current) return;
    try {
      view.current = mod.current.mountCrest3D(host.current, crest, {
        autoRotate,
        label: `3D view: ${describeCrest(crest)} Drag or use the arrow keys to rotate.`,
        onLost: fallback,
      });
    } catch {
      fallback();
      return;
    }
    return () => {
      view.current?.dispose();
      view.current = null;
    };
    // autoRotate is applied live below, no re-mount needed.
  }, [mode, crest]);

  useEffect(() => view.current?.setAutoRotate(autoRotate), [autoRotate]);

  const update = (patch: Partial<Omit<CrestV1, "v">>) => {
    setCrest(writeCrest(patch));
    setSaved(true);
  };

  const onTag = (e: TargetedEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    setTagRaw(raw);
    const r = validateTag(raw);
    setTagError(r.error);
    if (!r.error) update({ tag: r.value });
  };

  const open3d = async () => {
    setNotice("");
    setMode("loading");
    try {
      mod.current ??= await import("../../lib/crest-3d");
      if (!mod.current.hasWebGL()) throw new Error("no webgl");
      setMode("3d");
      setTimeout(() => backBtn.current?.focus(), 0);
    } catch {
      fallback();
    }
  };
  const close3d = () => {
    setMode("2d");
    setTimeout(() => threeBtn.current?.focus(), 0);
  };

  const exportFile = async (kind: "svg" | "png" | "3d") => {
    setStatus("Preparing the file…");
    try {
      const ex = await import("../../lib/crest-export");
      const file = kind === "3d" ? crestFileName(crest, "png").replace(".png", "-3d.png") : crestFileName(crest, kind);
      const blob = kind === "svg" ? ex.crestSvgBlob(crest) : kind === "png" ? await ex.crestPngBlob(crest) : await view.current!.snapshot();
      ex.saveBlob(blob, file);
      document.dispatchEvent(new CustomEvent("ko:crest-export", { detail: { file, bytes: blob.size, type: blob.type } }));
      setStatus(`Saved ${file}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save the file.");
    }
  };

  const desc = describeCrest(crest);
  const tagId = "crest-tag";

  return (
    <div class="cr-wrap">
      <section class="cr-stage" aria-label="Crest preview">
        <div class="cr-view" data-mode={mode}>
          {mode !== "3d" && <CrestSvg crest={crest} class="cr-svg" label={`Alliance crest: ${desc}`} />}
          <div ref={host} class="cr-3d" hidden={mode !== "3d"} />
        </div>
        <p class="cr-desc">{desc}</p>
        <div class="cr-row">
          {mode === "3d" ? (
            <>
              <button ref={backBtn} type="button" class="btn btn-secondary" onClick={close3d}>Back to 2D</button>
              <button type="button" class="btn btn-secondary" onClick={() => exportFile("3d")}>Download 3D PNG</button>
            </>
          ) : (
            <button ref={threeBtn} type="button" class="btn btn-secondary" onClick={open3d} disabled={mode === "loading"} data-view-3d>
              {mode === "loading" ? "Loading 3D…" : "View in 3D"}
            </button>
          )}
        </div>
        {mode === "3d" && (
          <>
            <label class="cr-check">
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.currentTarget.checked)} data-auto-rotate />
              <span>Rotate on its own</span>
            </label>
            <p class="cr-help">
              Drag the shield or focus it and use the arrow keys to turn it.
              {reduce && " Your device asks for reduced motion, so it starts still."}
            </p>
          </>
        )}
        {notice && <p class="cr-notice" data-fallback>{notice}</p>}
        <p class="cr-help">{mode === "2d" || mode === "loading" ? "The 3D view loads only when you ask for it (about 140 KB)." : ""}</p>
      </section>

      <form class="cr-form" onSubmit={(e) => e.preventDefault()} autocomplete="off">
        <h2>Design your crest</h2>
        <fieldset class="cr-group">
          <legend>Shield</legend>
          <div class="cr-options">
            {SHIELD_SHAPES.map((s) => (
              <label class="cr-option">
                <input type="radio" name="crest-shape" value={s} checked={crest.shape === s} onChange={() => update({ shape: s })} />
                <svg viewBox="0 0 100 120" aria-hidden="true" focusable="false"><path d={pathOf(SHIELDS[s])} /></svg>
                <span>{SHIELD_LABELS[s]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset class="cr-group">
          <legend>Alliance colour</legend>
          <div class="cr-swatches">
            {ALLIANCE_COLORS.map((c) => (
              <label class="cr-sw" style={`--sw: var(--ko-alliance-${c})`}>
                <input type="radio" name="crest-color" value={c} checked={crest.color === c} onChange={() => update({ color: c })} />
                <span class="visually-hidden">{c}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div class="cr-field">
          <label for={tagId}>Alliance tag</label>
          <input id={tagId} value={tagRaw} maxLength={6} onInput={onTag} aria-invalid={tagError ? "true" : undefined}
            aria-describedby={`${tagId}-help`} placeholder="ABC" autocapitalize="characters" spellcheck={false} />
          <p id={`${tagId}-help`} class={tagError ? "cr-error" : "cr-help"}>{tagError ?? "2 to 4 letters or digits, shown as [ABC]. Leave empty for no tag."}</p>
        </div>
        <fieldset class="cr-group">
          <legend>Emblem</legend>
          <div class="cr-options">
            {EMBLEM_NAMES.map((e) => (
              <label class="cr-option">
                <input type="radio" name="crest-emblem" value={e} checked={crest.emblem === e} onChange={() => update({ emblem: e })} />
                <svg viewBox="28 22 44 44" aria-hidden="true" focusable="false"><path d={pathOf(emblemPoints(e))} /></svg>
                <span>{EMBLEM_LABELS[e]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div class="cr-actions">
          <button type="button" class="btn btn-primary" onClick={() => exportFile("png")} data-export-png>Download PNG</button>
          <button type="button" class="btn btn-secondary" onClick={() => exportFile("svg")} data-export-svg>Download SVG</button>
          <p class="cr-help" role="status">{status || (saved ? "Saved on this device. It also shows on your governor card." : "Changes save on this device.")}</p>
        </div>
      </form>
    </div>
  );
}
