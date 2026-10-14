// Alliance crest builder (F-61, experimental). The 2D SVG editor always works; "View in 3D" loads Three.js on demand
// and falls back to the 2D view with a message when WebGL is missing or the chunk fails to load.
import { useEffect, useRef, useState } from "preact/hooks";
import type { TargetedEvent } from "preact";
import { validateTag } from "../../lib/card";
import {
  ALLIANCE_COLORS, ALLIANCE_COLOR_NAMES, crestFileName, defaultCrest, describeCrest, EMBLEM_LABELS, EMBLEM_NAMES, emblemPoints, pathOf,
  readSavedCrest, SHIELD_LABELS, SHIELD_SHAPES, SHIELDS, writeCrest, type CrestV1,
} from "../../lib/crest";
import type { Crest3D } from "../../lib/crest-3d";
import CrestSvg from "../CrestSvg";
import "./crest.css";

const REDUCE_MQ = "(prefers-reduced-motion: reduce)";
const FALLBACK = "A visão em 3D não está disponível neste aparelho ou navegador, então você está vendo o brasão em 2D. O resto continua funcionando.";

type Mode = "2d" | "loading" | "3d";

export default function CrestBuilder() {
  const [crest, setCrest] = useState<CrestV1>(defaultCrest);
  const [saved, setSaved] = useState(false);
  const [tagRaw, setTagRaw] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("2d");
  /** In 3D mode while the scene is still being built in steps (the 2D crest stays on screen). */
  const [preparing, setPreparing] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<Crest3D | null>(null);
  const mod = useRef<typeof import("../../lib/crest-3d") | null>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const threeBtn = useRef<HTMLButtonElement>(null);
  const autoRef = useRef(autoRotate);
  autoRef.current = autoRotate;

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
    setPreparing(false);
    setMode("2d");
    setNotice(FALLBACK);
    setTimeout(() => threeBtn.current?.focus(), 0);
  };

  // Mount (or re-mount after an edit) the 3D view while in 3D mode. The mount is built in steps that
  // yield to the main thread (Q2 P2-10); the 2D crest and a "Preparing" line show until it is ready.
  useEffect(() => {
    if (mode !== "3d" || !host.current || !mod.current) return;
    let cancelled = false;
    setPreparing(true);
    mod.current
      .mountCrest3D(host.current, crest, {
        autoRotate,
        label: `Visão em 3D: ${describeCrest(crest)} Arraste ou use as setas do teclado para girar.`,
        onLost: fallback,
        cancelled: () => cancelled,
      })
      .then((v) => {
        if (cancelled) return v.dispose();
        view.current?.dispose();
        view.current = v;
        v.setAutoRotate(autoRef.current);
        setPreparing(false);
      })
      .catch(() => {
        if (!cancelled) fallback();
      });
    return () => {
      cancelled = true;
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
      setMode("3d");
      setTimeout(() => backBtn.current?.focus(), 0);
    } catch {
      fallback();
    }
  };
  const close3d = () => {
    setPreparing(false);
    setMode("2d");
    setTimeout(() => threeBtn.current?.focus(), 0);
  };

  const exportFile = async (kind: "svg" | "png" | "3d") => {
    setStatus("Preparando o arquivo…");
    try {
      const ex = await import("../../lib/crest-export");
      const file = kind === "3d" ? crestFileName(crest, "png").replace(".png", "-3d.png") : crestFileName(crest, kind);
      const blob = kind === "svg" ? ex.crestSvgBlob(crest) : kind === "png" ? await ex.crestPngBlob(crest) : await view.current!.snapshot();
      ex.saveBlob(blob, file);
      document.dispatchEvent(new CustomEvent("ko:crest-export", { detail: { file, bytes: blob.size, type: blob.type } }));
      setStatus(`Salvo ${file}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar o arquivo.");
    }
  };

  const desc = describeCrest(crest);
  const tagId = "crest-tag";

  return (
    <div class="cr-wrap">
      <section class="cr-stage" aria-label="Prévia do brasão">
        <div class="cr-view" data-mode={mode}>
          {(mode !== "3d" || preparing) && <CrestSvg crest={crest} class="cr-svg" label={`Brasão da aliança: ${desc}`} />}
          <div ref={host} class="cr-3d" hidden={mode !== "3d" || preparing} />
        </div>
        <p class="cr-desc">{desc}</p>
        <div class="cr-row">
          {mode === "3d" ? (
            <>
              <button ref={backBtn} type="button" class="btn btn-secondary" onClick={close3d}>Voltar ao 2D</button>
              <button type="button" class="btn btn-secondary" onClick={() => exportFile("3d")} disabled={preparing}>Baixar PNG em 3D</button>
            </>
          ) : (
            <button ref={threeBtn} type="button" class="btn btn-secondary" onClick={open3d} disabled={mode === "loading"} data-view-3d>
              {mode === "loading" ? "Carregando 3D…" : "Ver em 3D"}
            </button>
          )}
        </div>
        {mode === "3d" && (
          <>
            <label class="cr-check">
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.currentTarget.checked)} data-auto-rotate />
              <span>Girar sozinho</span>
            </label>
            <p class="cr-help">
              Arraste o escudo ou foque nele e use as setas do teclado para girá-lo.
              {reduce && " Seu aparelho pede movimento reduzido, então ele começa parado."}
            </p>
          </>
        )}
        <p class="cr-help" role="status" data-3d-status>{mode === "loading" ? "Carregando a visão em 3D…" : mode === "3d" && preparing ? "Preparando a visão em 3D…" : ""}</p>
        {notice && <p class="cr-notice" data-fallback>{notice}</p>}
        <p class="cr-help">{mode === "2d" || mode === "loading" ? "A visão em 3D só é carregada quando você pede (cerca de 140 KB)." : ""}</p>
      </section>

      <form class="cr-form" onSubmit={(e) => e.preventDefault()} autocomplete="off">
        <h2>Monte o seu brasão</h2>
        <fieldset class="cr-group">
          <legend>Escudo</legend>
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
          <legend>Cor da aliança</legend>
          <div class="cr-swatches">
            {ALLIANCE_COLORS.map((c) => (
              <label class="cr-sw" style={`--sw: var(--ko-alliance-${c})`}>
                <input type="radio" name="crest-color" value={c} checked={crest.color === c} onChange={() => update({ color: c })} />
                <span class="visually-hidden">{ALLIANCE_COLOR_NAMES[c]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div class="cr-field">
          <label for={tagId}>Sigla da aliança</label>
          <input id={tagId} value={tagRaw} maxLength={6} onInput={onTag} aria-invalid={tagError ? "true" : undefined}
            aria-describedby={`${tagId}-help`} placeholder="ABC" autocapitalize="characters" spellcheck={false} />
          <p id={`${tagId}-help`} class={tagError ? "cr-error" : "cr-help"}>{tagError ?? "2 a 4 letras ou dígitos, exibida como [ABC]. Deixe em branco para ficar sem sigla."}</p>
        </div>
        <fieldset class="cr-group">
          <legend>Emblema</legend>
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
          <button type="button" class="btn btn-primary" onClick={() => exportFile("png")} data-export-png>Baixar PNG</button>
          <button type="button" class="btn btn-secondary" onClick={() => exportFile("svg")} data-export-svg>Baixar SVG</button>
          <p class="cr-help" role="status">{status || (saved ? "Salvo neste aparelho. Também aparece no seu cartão de governador." : "As alterações são salvas neste aparelho.")}</p>
        </div>
      </form>
    </div>
  );
}
