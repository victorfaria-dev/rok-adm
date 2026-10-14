// Governor card island (F-60): CSS 3D tilt + holographic sheen, display fields in ko:card:v1, PNG export.
// Server render = the example card; on mount it reads the saved profile and the card fields.
import { useEffect, useRef, useState } from "preact/hooks";
import type { TargetedEvent, TargetedPointerEvent } from "preact";
import type { AccountProfile } from "@rokadm/core";
import { readStore } from "../lib/store";
import { profileFromCode } from "../lib/profile";
import {
  ALLIANCE_COLORS, ALLIANCE_COLOR_NAMES, cardData, defaultCard, NAME_MAX, pngFileName, readCard, validateName, validateTag, writeCard,
  type AllianceColor, type CardV1,
} from "../lib/card";
import { RARITY_LABELS } from "../lib/rarity";
import { K_PATHS, K_VIEWBOX } from "../lib/k-icon";
import { readSavedCrest, type CrestV1 } from "../lib/crest";
import CrestSvg from "./CrestSvg";
import "./GovernorCard.css";

const TILT = 24; // degrees at the card's edge
const REDUCE_MQ = "(prefers-reduced-motion: reduce)";

type Profile = Pick<AccountProfile, "cityHall" | "spending">;

export default function GovernorCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [card, setCard] = useState<CardV1>(defaultCard);
  const [osReduce, setOsReduce] = useState(false);
  const [nameRaw, setNameRaw] = useState("");
  const [tagRaw, setTagRaw] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [crest, setCrest] = useState<CrestV1 | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const p = profileFromCode(readStore().profileCode);
    setProfile(p ? { cityHall: p.cityHall, spending: p.spending } : null);
    const c = readCard();
    setCard(c);
    setNameRaw(c.name);
    setTagRaw(c.tag);
    setCrest(readSavedCrest());
    try {
      const mq = matchMedia(REDUCE_MQ);
      setOsReduce(mq.matches);
      const onChange = () => setOsReduce(mq.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      return;
    }
  }, []);

  const data = cardData(profile, card);
  const reduce = card.reduceMotion ?? osReduce;

  // --- Tilt: pointer on desktop, drag on touch. Writes CSS variables, no re-render.
  const setVars = (v: Record<string, string>) => {
    const s = el.current?.style;
    if (s) for (const k in v) s.setProperty(k, v[k]!);
  };
  const tilt = (x: number, y: number) => {
    const r = el.current?.getBoundingClientRect();
    if (!r) return;
    const px = Math.min(Math.max((x - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((y - r.top) / r.height, 0), 1);
    const vars: Record<string, string> = { "--mx": `${(px * 100).toFixed(1)}%`, "--my": `${(py * 100).toFixed(1)}%` };
    if (!reduce) {
      vars["--ry"] = `${((px - 0.5) * TILT).toFixed(2)}deg`;
      vars["--rx"] = `${((0.5 - py) * TILT).toFixed(2)}deg`;
    }
    setVars(vars);
  };
  const rest = () => {
    dragging.current = false;
    el.current?.classList.remove("active");
    setVars({ "--rx": "0deg", "--ry": "0deg", "--mx": "50%", "--my": "50%" });
  };
  const onPointerDown = (e: TargetedPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    el.current?.classList.add("active");
    try { el.current?.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
    tilt(e.clientX, e.clientY);
  };
  const onPointerMove = (e: TargetedPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || dragging.current) {
      el.current?.classList.add("active");
      tilt(e.clientX, e.clientY);
    }
  };
  const onPointerLeave = (e: TargetedPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") rest();
  };

  // --- Form
  const onName = (e: TargetedEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    setNameRaw(raw);
    const r = validateName(raw);
    setNameError(r.error);
    setCard(writeCard({ name: r.value }));
  };
  const onTag = (e: TargetedEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    setTagRaw(raw);
    const r = validateTag(raw);
    setTagError(r.error);
    setCard(writeCard({ tag: r.value }));
  };
  const onColor = (c: AllianceColor) => setCard(writeCard({ color: c }));
  const onReduce = (e: TargetedEvent<HTMLInputElement>) => {
    setCard(writeCard({ reduceMotion: e.currentTarget.checked }));
    rest();
  };

  // --- PNG
  const download = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Desenhando o cartão…");
    try {
      const { renderCardPng } = await import("../lib/card-png");
      const blob = await renderCardPng(data);
      const file = pngFileName(data.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      document.dispatchEvent(new CustomEvent("ko:card-png", { detail: { file, bytes: blob.size } }));
      setStatus(`Salvo ${file} (1080 × 1080).`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar o PNG.");
    } finally {
      setBusy(false);
    }
  };

  const rarity = RARITY_LABELS[data.rarity];
  const nameId = "gc-name", tagId = "gc-tag";

  return (
    <div class="gc-wrap">
      <section class="gc-stage" aria-label="Cartão do governador">
        <div
          ref={el}
          class={`gc${reduce ? " still" : ""}`}
          data-rarity={data.rarity}
          data-example={data.example ? "" : undefined}
          style={`--ally: var(--ko-alliance-${data.color})`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={rest}
          onPointerCancel={rest}
          onPointerLeave={onPointerLeave}
        >
          <div class="gc-body">
            <div class="gc-face">
              <p class="gc-top">
                <span class="gc-pill gc-rar">{rarity}</span>
                {data.example && <span class="gc-pill gc-ex">Exemplo</span>}
                <span class="gc-proof">Autodeclarado</span>
              </p>
              <div class="gc-avatar" aria-hidden="true">
                <svg viewBox={`${K_VIEWBOX.x} ${K_VIEWBOX.y} ${K_VIEWBOX.w} ${K_VIEWBOX.h}`} focusable="false">
                  {K_PATHS.map((d) => <path d={d} />)}
                </svg>
              </div>
              <h2 class="gc-name">{data.name}</h2>
              <p class="gc-tagline">
                {crest && <CrestSvg crest={crest} class="gc-crest" />}
                {data.tag ? <span class="gc-tag">[{data.tag}]</span> : <span class="gc-notag">Sem sigla de aliança</span>}
              </p>
              <dl class="gc-stats">
                <div><dt>Prefeitura</dt><dd class="mono">{data.cityHall}</dd></div>
                <div><dt>Gasto</dt><dd>{data.spendingLabel}</dd></div>
              </dl>
              <p class="gc-marks">
                {data.f2pAchiever && <span class="gc-pill gc-f2p">Conquista F2P</span>}
              </p>
              <p class="gc-foot"><span>{rarity} · Prefeitura {data.cityHall}</span><span>KingdomOps</span></p>
              <div class="gc-foil" aria-hidden="true" />
              <div class="gc-sweep" aria-hidden="true" />
              <div class="gc-glare" aria-hidden="true" />
            </div>
          </div>
        </div>
        <p class="gc-hint">
          {reduce ? "Movimento reduzido: o cartão fica parado." : "Passe o mouse ou arraste o cartão para inclinar."} Tudo o que está nele também está em texto simples.
        </p>
        {data.example && (
          <p class="gc-example">
            Números de exemplo. <a href="/start/">Monte meu guia</a> e o cartão usa a sua Prefeitura e o seu perfil de gasto.
          </p>
        )}
      </section>

      <form class="gc-form" onSubmit={(e) => e.preventDefault()} autocomplete="off">
        <h2>Deixe com a sua cara</h2>
        <div class="gc-field">
          <label for={nameId}>Nome do governador</label>
          <input id={nameId} value={nameRaw} maxLength={NAME_MAX} onInput={onName} aria-invalid={nameError ? "true" : undefined}
            aria-describedby={`${nameId}-help`} placeholder={data.example ? "Valerius" : "Governador"} />
          <p id={`${nameId}-help`} class={nameError ? "gc-error" : "gc-help"}>{nameError ?? `Até ${NAME_MAX} caracteres.`}</p>
        </div>
        <div class="gc-field">
          <label for={tagId}>Sigla da aliança</label>
          <input id={tagId} value={tagRaw} maxLength={6} onInput={onTag} aria-invalid={tagError ? "true" : undefined}
            aria-describedby={`${tagId}-help`} placeholder="ABC" autocapitalize="characters" spellcheck={false} />
          <p id={`${tagId}-help`} class={tagError ? "gc-error" : "gc-help"}>{tagError ?? "2 a 4 letras ou dígitos, exibida como [ABC]."}</p>
        </div>
        <fieldset class="gc-colors">
          <legend>Cor da aliança</legend>
          <div class="gc-swatches">
            {ALLIANCE_COLORS.map((c) => (
              <label class="gc-sw" style={`--sw: var(--ko-alliance-${c})`}>
                <input type="radio" name="alliance-color" value={c} checked={card.color === c} onChange={() => onColor(c)} />
                <span class="visually-hidden">{ALLIANCE_COLOR_NAMES[c]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label class="gc-check">
          <input type="checkbox" checked={reduce} onChange={onReduce} />
          <span>Reduzir movimento (sem inclinação nem brilho)</span>
        </label>
        <div class="gc-actions">
          <button type="button" class="btn btn-primary" onClick={download} disabled={busy} data-download>
            {busy ? "Desenhando…" : "Baixar PNG"}
          </button>
          <p class="gc-help" role="status">{status || "1080 × 1080, plano, com o K. Use como seu avatar."}</p>
        </div>
      </form>
    </div>
  );
}
