import { useEffect, useState } from "preact/hooks";
import type { MgeDoc, MgePlan } from "@rokadm/planner";
import { publishMge, type PublishedLink } from "../../../lib/kingdom-mge";
import { CheckField } from "../shared/Field";
import CopyText from "../shared/CopyText";

interface Props {
  doc: MgeDoc;
  plan: MgePlan;
  today: string;
}

/** "Publish ledger": a view-only link that carries the ledger in its fragment. */
export default function Publish({ doc, plan, today }: Props) {
  const [includeScores, setIncludeScores] = useState(false);
  const [link, setLink] = useState<PublishedLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Any edit makes an earlier link out of date: hide it so nobody copies a stale ledger.
  useEffect(() => setLink(null), [doc, includeScores]);

  async function publish() {
    setBusy(true);
    setError("");
    try {
      setLink(await publishMge(doc, plan, includeScores, today));
    } catch (e) {
      setError(e instanceof Error && e.name === "ShareTooLargeError"
        ? `${e.message} Lock and remove old events, or start a new plan for the next season.`
        : "The link could not be made in this browser.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-pub-h">
      <h2 id="kx-pub-h">Publish the ledger</h2>
      <p class="kg-lead">A public ledger turns "hoarding" accusations into checkable facts: anyone in the kingdom can see who got which slot, when and why.</p>
      <CheckField
        id="kx-scores"
        label="Include scores in the public link"
        checked={includeScores}
        onValue={setIncludeScores}
        hint="Off by default: the link shows names, slots, reasons and your rules. Turn it on only if your governors agreed to have their scores shown."
      />
      <div class="kg-actions">
        <button type="button" class="btn btn-primary" onClick={publish} disabled={busy || doc.events.length === 0}>Create public link</button>
        {doc.events.length === 0 && <p class="kg-hint">Add at least one event first.</p>}
      </div>
      {error && <p class="kg-error" role="alert" data-too-large>{error}</p>}
      {link && (
        <div class="kg-grid" data-published>
          <CopyText
            id="kx-link"
            label="Public ledger link"
            text={link.url}
            variant="link"
            copyLabel="Copy link"
            hint={link.hint === "long"
              ? `This link is ${link.url.length.toLocaleString("en-US")} characters long and may be cut in Discord (2,000 per message). Post it in a pinned file or shorten the plan (fewer events).`
              : "Anyone with this link can read the ledger. The ledger travels inside the link; nothing is stored on a server."}
          />
          <p><a href={link.url} target="_blank" rel="noopener">Open the public ledger</a> (new tab)</p>
        </div>
      )}
    </section>
  );
}
