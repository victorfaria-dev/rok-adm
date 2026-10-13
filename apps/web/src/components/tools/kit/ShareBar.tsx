import { useState } from "preact/hooks";

/** "Copy link" for the current inputs, with an inline status (no toast library). */
export function ShareBar({ shareUrl, shared }: { shareUrl: () => string; shared: boolean }) {
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
  return (
    <div class="t-share">
      {shared ? <p class="t-shared">You opened a shared link. Your own saved values are untouched until you edit a field.</p> : null}
      <button type="button" class="btn btn-secondary" onClick={() => void copy()}>Copy link to these inputs</button>
      <p role="status" class="t-status">{msg}</p>
    </div>
  );
}
