import { useEffect, useRef, useState } from "preact/hooks";
import { BACKUP_SECTIONS, applyRestore, backupFileName, backupText, buildBackup, planRestore, type Change, type RestorePlan } from "../../lib/backup";
import "./me.css";

interface Props {
  /** File download; tests pass a spy. */
  download?: (fileName: string, text: string) => void;
  /** Reload after a restore so every page part reads the new data; tests pass a spy. */
  reload?: () => void;
  now?: () => Date;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

const defaultDownload = (fileName: string, text: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const CHANGE_TEXT: Record<Change, string> = {
  add: "Will be added",
  replace: "Will replace what is here",
  same: "Same as here (no change)",
  invalid: "Unreadable in the file (skipped)",
};

/** "Back up everything": one file with every KingdomOps section in this browser; restore with an in-page diff. */
export default function BackupAll({ download = defaultDownload, reload = () => window.location.reload(), now = () => new Date() }: Props) {
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (plan) heading.current?.focus();
  }, [plan]);

  function exportAll() {
    const b = buildBackup(storage(), now());
    const count = Object.keys(b.keys).length;
    if (count === 0) {
      setError("");
      setStatus("Nothing saved in this browser yet, so there is nothing to back up.");
      return;
    }
    download(backupFileName(now()), backupText(b));
    setError("");
    setStatus(`Backup ready with ${count} section${count === 1 ? "" : "s"}: check your downloads.`);
  }

  async function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("This file is too large to be a KingdomOps backup.");
      const p = planRestore(await file.text(), storage());
      setError("");
      setStatus("");
      setPlan(p);
    } catch (err) {
      setPlan(null);
      setStatus("");
      setError(err instanceof Error ? err.message : "This file could not be read.");
    }
  }

  function confirm() {
    if (!plan) return;
    const n = applyRestore(plan, storage());
    setPlan(null);
    setStatus(`Restored ${n} section${n === 1 ? "" : "s"}. Reloading…`);
    reload();
  }

  const changes = plan ? Object.keys(plan.writes).length : 0;
  return (
    <div class="me me-backup">
      <section class="me-section" aria-labelledby="me-backup-h">
        <h2 id="me-backup-h">Back up everything</h2>
        <p>
          One file with everything KingdomOps keeps in this browser: {BACKUP_SECTIONS.map((s) => s.label.toLowerCase()).join("; ")}.
          Use it to move to a new phone or to keep a copy. The Discord webhook is never included.
        </p>
        <div class="me-actions">
          <button type="button" class="btn btn-secondary" onClick={exportAll}>Back up everything</button>
          <label class="btn btn-secondary me-file">
            Restore from backup
            <input class="visually-hidden" type="file" accept=".json,application/json" onChange={(e) => void pick(e)} data-backup-file />
          </label>
        </div>
        <p class="me-note">Restoring shows what will change first. Sections not in the file stay as they are.</p>

        {plan && (
          <div class="me-confirm" role="group" aria-labelledby="me-restore-h" data-restore-plan
            onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setPlan(null); setStatus("Restore cancelled."); } }}>
            <h3 id="me-restore-h" tabIndex={-1} ref={heading}>Restore this backup?</h3>
            {plan.exportedAt && <p>Made on {new Date(plan.exportedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</p>}
            <dl class="me-answers">
              {plan.rows.map((r) => (
                <div class="me-row" key={r.key} data-restore-row={r.key} data-change={r.change}>
                  <dt>{r.label}</dt>
                  <dd>
                    {CHANGE_TEXT[r.change]}
                    <span class="me-diff">Here now: {r.now ?? "nothing"}</span>
                    {r.incoming !== null && <span class="me-diff">In the file: {r.incoming}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {plan.rows.length === 0 && <p>The file has no sections this version can read.</p>}
            {plan.unknown.length > 0 && <p class="me-note">{plan.unknown.length} part{plan.unknown.length === 1 ? "" : "s"} of the file this version does not know will be ignored.</p>}
            <div class="me-actions">
              <button type="button" class="btn btn-primary" onClick={confirm} disabled={changes === 0}>
                {changes === 0 ? "Nothing to restore" : `Restore ${changes} section${changes === 1 ? "" : "s"}`}
              </button>
              <button type="button" class="btn btn-secondary" onClick={() => { setPlan(null); setStatus("Restore cancelled."); }}>Cancel</button>
            </div>
          </div>
        )}
        <p class="me-status" role="status" data-backup-status>{status}</p>
        {error && <p class="me-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
