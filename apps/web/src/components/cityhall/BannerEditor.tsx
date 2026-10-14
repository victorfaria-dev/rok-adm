import { useEffect, useRef, useState } from "preact/hooks";
import { ACCOUNT_KINDS, ACCOUNT_KIND_LABEL, prepareBanner, type AccountKind, type BannerStore } from "../../lib/banner";

// Every user-facing string of the banner editor, in one place (pt-BR).
const S = {
  edit: "Editar banner",
  close: "Concluir",
  h: (name: string) => `Cartão da cidade: ${name}`,
  kind: "Tipo de conta",
  kindHelp: "Define o banner padrão.",
  pick: "Escolher uma imagem",
  pickHelp: "Uma imagem sua, exibida em pé (3:4). Não use arte do jogo que você não tenha direito de compartilhar.",
  frame: "Arraste a imagem para escolher o que aparece no cartão",
  x: "Da esquerda para a direita",
  y: "De cima para baixo",
  save: "Salvar banner",
  cancel: "Cancelar",
  reset: "Voltar ao padrão",
  saving: "Salvando…",
  saved: "Banner salvo neste aparelho.",
  resetDone: "De volta ao banner padrão.",
} as const;

/** The small button on the card that opens the editor (lives inside the active card). */
export function BannerToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" class="ch-banner-btn" aria-expanded={open} aria-controls="ch-banner-panel" onClick={onToggle} data-banner-toggle>
      {open ? S.close : S.edit}
    </button>
  );
}

interface Props {
  open: boolean;
  accountId: string;
  accountName: string;
  kind: AccountKind;
  hasCustom: boolean;
  store: BannerStore;
  onKind: (k: AccountKind) => void;
  /** Called with the new custom image, or null after a reset. */
  onBanner: (image: string | null) => void;
  /** Turns a picked file into a stored image (tests pass a stub). */
  prepare?: (file: File, fx: number, fy: number) => Promise<string>;
}

const clamp = (x: number): number => Math.min(1, Math.max(0, x));

/**
 * "Edit banner": account type (default banner), own image with a focal-point cropper (drag the
 * picture, or use the two sliders: no drag needed), reset to default.
 */
export function BannerPanel({ open, accountId, accountName, kind, hasCustom, store, onKind, onBanner, prepare = prepareBanner }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fx, setFx] = useState(0.5);
  const [fy, setFy] = useState(0.5);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choose = (f: File): void => {
    setError("");
    setStatus("");
    if (!f.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem (JPEG, PNG ou WebP).");
      return;
    }
    setFile(f);
    setFx(0.5);
    setFy(0.5);
    setPreview(URL.createObjectURL(f));
  };

  const save = async (): Promise<void> => {
    if (!file) return;
    setError("");
    setStatus(S.saving);
    try {
      const image = await prepare(file, fx, fy);
      await store.setBanner(accountId, image);
      onBanner(image);
      setFile(null);
      setPreview(null);
      setStatus(S.saved);
    } catch (e) {
      setStatus("");
      setError(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
    }
  };

  const reset = async (): Promise<void> => {
    setError("");
    await store.setBanner(accountId, null);
    onBanner(null);
    setStatus(S.resetDone);
  };

  return (
    <section id="ch-banner-panel" class="ch-banner-panel" aria-labelledby="ch-banner-h" hidden={!open} data-layer="2">
      <h2 id="ch-banner-h" class="ch-banner-h">{S.h(accountName)}</h2>
      <div class="ch-field">
        <label for="ch-kind">{S.kind}</label>
        <p class="ch-muted ch-small" id="ch-kind-help">{S.kindHelp}</p>
        <select id="ch-kind" class="ch-select" value={kind} aria-describedby="ch-kind-help" onChange={(e) => onKind(e.currentTarget.value as AccountKind)}>
          {ACCOUNT_KINDS.map((k) => <option key={k} value={k}>{ACCOUNT_KIND_LABEL[k]}</option>)}
        </select>
      </div>

      <div class="ch-field">
        <p class="ch-muted ch-small" id="ch-pick-help">{S.pickHelp}</p>
        <div class="ch-banner-actions">
          <label class="btn btn-secondary ch-file">
            {S.pick}
            <input class="visually-hidden" type="file" accept="image/*" aria-describedby="ch-pick-help" data-banner-file
              onChange={(e) => {
                const input = e.currentTarget;
                const f = input.files?.[0];
                if (f) choose(f);
                input.value = "";
              }} />
          </label>
          {hasCustom && !file && <button type="button" class="btn btn-secondary" onClick={() => void reset()}>{S.reset}</button>}
        </div>
      </div>

      {preview && (
        <div class="ch-cropper" data-cropper>
          <div
            ref={frame}
            class="ch-crop-frame"
            role="img"
            aria-label={S.frame}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, fx, fy };
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const el = frame.current;
              if (!d || !el) return;
              // Dragging the picture right shows more of its left side: the focal point moves the other way.
              setFx(clamp(d.fx - (e.clientX - d.x) / el.clientWidth));
              setFy(clamp(d.fy - (e.clientY - d.y) / el.clientHeight));
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            <img src={preview} alt="" draggable={false} style={{ objectPosition: `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%` }} />
          </div>
          <div class="ch-crop-sliders">
            <label class="ch-field">
              <span>{S.x}</span>
              <input type="range" class="ch-range" min={0} max={100} value={Math.round(fx * 100)} onInput={(e) => setFx(Number(e.currentTarget.value) / 100)} />
            </label>
            <label class="ch-field">
              <span>{S.y}</span>
              <input type="range" class="ch-range" min={0} max={100} value={Math.round(fy * 100)} onInput={(e) => setFy(Number(e.currentTarget.value) / 100)} />
            </label>
          </div>
          <div class="ch-banner-actions">
            <button type="button" class="btn btn-primary" onClick={() => void save()}>{S.save}</button>
            <button type="button" class="btn btn-secondary" onClick={() => { setFile(null); setPreview(null); }}>{S.cancel}</button>
          </div>
        </div>
      )}
      <p class="ch-small" role="status">{status}</p>
      <p class="ch-error ch-small" role="alert">{error}</p>
    </section>
  );
}
