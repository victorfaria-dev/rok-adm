import { useEffect, useRef, useState } from "preact/hooks";
import ConfirmAction from "./ConfirmAction";
import {
  KINGDOM_KINDS, clearKingdom, downloadText, forgetWebhook, exportKingdom, importKingdom, kingdomStorage, readKingdom,
  type KingdomDocKind, type KingdomStoreV1,
} from "../../../lib/kingdom-store";

const KIND_LABEL: Record<KingdomDocKind, string> = {
  rules: "Rules pages",
  requirements: "Requirements cards",
  "my-requirements": "My requirements",
  mge: "MGE plans",
  recruit: "Recruitment posts",
  seed: "Seed simulations",
};

/** Export, import and delete all council-kit data on this device (ko:kingdom:v1). */
export default function DataControls() {
  const [store, setStore] = useState<KingdomStoreV1>({ v: 1, docs: [] });
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    setBlocked(blocked);
    setStore(readKingdom(st));
  }, []);

  const counts = KINGDOM_KINDS.map((k) => [k, store.docs.filter((d) => d.kind === k).length] as const);
  const total = store.docs.length;

  function onExport() {
    const day = new Date().toISOString().slice(0, 10);
    downloadText(`kingdomops-council-${day}.json`, exportKingdom(store), "application/json");
    setError("");
    setStatus("Export ready: check your downloads.");
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const r = importKingdom(await file.text(), kingdomStorage().st);
      setStore(r.store);
      setError("");
      setStatus(`Imported: ${r.added} added, ${r.updated} updated, ${r.skipped} kept as they were.`);
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Could not read this file.");
    }
  }

  function onDelete() {
    clearKingdom(kingdomStorage().st);
    forgetWebhook(kingdomStorage().st);
    setStore(readKingdom(kingdomStorage().st));
    setError("");
    setStatus("All council data on this device was deleted.");
  }

  return (
    <div class="kg-card" data-controls>
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your work lasts until you close this page; export it to keep it.</p>}
      <p>{total === 0 ? "No council documents saved on this device yet." : `${total} document${total === 1 ? "" : "s"} saved on this device.`}</p>
      {total > 0 && (
        <ul class="kg-note" data-counts>
          {counts.filter(([, n]) => n > 0).map(([k, n]) => <li key={k}>{KIND_LABEL[k]}: {n}</li>)}
        </ul>
      )}
      <div class="kg-actions">
        <button type="button" class="btn btn-secondary" onClick={onExport} disabled={total === 0}>Export (.json)</button>
        <button type="button" class="btn btn-secondary" onClick={() => fileRef.current?.click()}>Import</button>
        <input ref={fileRef} type="file" accept="application/json,.json" class="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={onFile} data-import />
        {total > 0 && <ConfirmAction label="Delete all council data" question="Delete every council document (and the saved Discord webhook) on this device? Export first if you want a copy." yesLabel="Yes, delete all" onConfirm={onDelete} />}
      </div>
      {error && <p class="kg-error" role="alert">{error}</p>}
      <p class="kg-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
