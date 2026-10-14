import { useState } from "preact/hooks";
import { ACCOUNT_KINDS, ACCOUNT_KIND_LABEL, prepareBanner, type AccountKind, type BannerStore } from "../../lib/banner";

// Every user-facing string of the banner editor, in one place (i18n later).
const S = {
  edit: "Edit banner",
  close: "Done",
  h: (name: string) => `City card: ${name}`,
  kind: "Account type",
  kindHelp: "Picks the default banner.",
  pick: "Choose an image",
  pickHelp: "Your own picture. It is cropped to the card's shape and shrunk on this device. Do not use game art you have no right to share.",
  reset: "Reset to default",
  saving: "Saving…",
  saved: "Banner saved on this device.",
  resetDone: "Back to the default banner.",
} as const;

interface Props {
  accountId: string;
  accountName: string;
  kind: AccountKind;
  hasCustom: boolean;
  store: BannerStore;
  onKind: (k: AccountKind) => void;
  /** Called with the new custom image, or null after a reset. */
  onBanner: (image: string | null) => void;
  /** Turns a picked file into a stored image (tests pass a stub). */
  prepare?: (file: File) => Promise<string>;
}

/** "Edit banner" on the City Hall card: account type (default banner), own image, reset. */
export function BannerEditor({ accountId, accountName, kind, hasCustom, store, onKind, onBanner, prepare = prepareBanner }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const pick = async (file: File): Promise<void> => {
    setError("");
    setStatus(S.saving);
    try {
      const image = await prepare(file);
      await store.setBanner(accountId, image);
      onBanner(image);
      setStatus(S.saved);
    } catch (e) {
      setStatus("");
      setError(e instanceof Error ? e.message : "This image could not be used.");
    }
  };

  const reset = async (): Promise<void> => {
    setError("");
    await store.setBanner(accountId, null);
    onBanner(null);
    setStatus(S.resetDone);
  };

  return (
    <div class="ch-banner-edit">
      <button type="button" class="btn btn-secondary ch-banner-btn" aria-expanded={open} aria-controls="ch-banner-panel" onClick={() => setOpen((o) => !o)} data-banner-toggle>
        {open ? S.close : S.edit}
      </button>
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
                  const file = input.files?.[0];
                  if (file) void pick(file).finally(() => { input.value = ""; });
                }} />
            </label>
            {hasCustom && <button type="button" class="btn btn-secondary" onClick={() => void reset()}>{S.reset}</button>}
          </div>
        </div>
        <p class="ch-small" role="status">{status}</p>
        <p class="ch-error ch-small" role="alert">{error}</p>
      </section>
    </div>
  );
}
