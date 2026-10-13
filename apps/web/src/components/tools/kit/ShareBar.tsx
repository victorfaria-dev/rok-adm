import { useState } from "preact/hooks";

interface Props {
  shareUrl: () => string;
  /** The screen shows values from a ?s= link and the user has not chosen yet. */
  shared: boolean;
  keepMine?: () => void;
  useLink?: () => void;
}

/** "Copy link" for the current inputs, with an inline status (no toast library), and the link-values choice. */
export function ShareBar({ shareUrl, shared, keepMine, useLink }: Props) {
  const [msg, setMsg] = useState("");
  const copy = async (): Promise<void> => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copied. It holds these inputs only, nothing about you.");
    } catch {
      setMsg(`Copy this link: ${url}`);
    }
  };
  const choose = (fn: () => void, text: string): void => {
    fn();
    setMsg(text);
  };
  return (
    <div class="t-share">
      {shared ? (
        <div class="t-shared" role="group" aria-labelledby="t-shared-text" data-link-choice>
          <p id="t-shared-text">
            Showing values from a link. Your saved values stay as they are (only a field you edit is saved) until you choose.
          </p>
          {keepMine && useLink ? (
            <div class="t-shared-actions">
              <button type="button" class="btn btn-secondary" onClick={() => choose(keepMine, "Back to your saved values.")}>Keep mine</button>
              <button type="button" class="btn btn-secondary" onClick={() => choose(useLink, "Saved the link values as yours.")}>Use link values</button>
            </div>
          ) : null}
        </div>
      ) : null}
      <button type="button" class="btn btn-secondary" onClick={() => void copy()}>Copy link to these inputs</button>
      <p role="status" class="t-status">{msg}</p>
    </div>
  );
}
