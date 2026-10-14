import { useEffect, useRef, useState } from "preact/hooks";
import ConfirmAction from "./ConfirmAction";
import {
  KINGDOM_KINDS, clearKingdom, downloadText, forgetWebhook, exportKingdom, importKingdom, kingdomStorage, readKingdom,
  type KingdomDocKind, type KingdomStoreV1,
} from "../../../lib/kingdom-store";

const KIND_LABEL: Record<KingdomDocKind, string> = {
  rules: "Páginas de regras",
  requirements: "Cartões de requisitos",
  "my-requirements": "Meus requisitos",
  mge: "Planos de MGE",
  recruit: "Posts de recrutamento",
  seed: "Simulações de seed",
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
    setStatus("Exportação pronta: confira seus downloads.");
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
      setStatus(`Importado: ${r.added} adicionados, ${r.updated} atualizados, ${r.skipped} mantidos como estavam.`);
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Não foi possível ler este arquivo.");
    }
  }

  function onDelete() {
    clearKingdom(kingdomStorage().st);
    forgetWebhook(kingdomStorage().st);
    setStore(readKingdom(kingdomStorage().st));
    setError("");
    setStatus("Todos os dados do conselho neste aparelho foram apagados.");
  }

  return (
    <div class="kg-card" data-controls>
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Seu trabalho dura até você fechar esta página; exporte para guardá-lo.</p>}
      <p>{total === 0 ? "Nenhum documento do conselho salvo neste aparelho ainda." : `${total} ${total === 1 ? "documento salvo" : "documentos salvos"} neste aparelho.`}</p>
      {total > 0 && (
        <ul class="kg-note" data-counts>
          {counts.filter(([, n]) => n > 0).map(([k, n]) => <li key={k}>{KIND_LABEL[k]}: {n}</li>)}
        </ul>
      )}
      <div class="kg-actions">
        <button type="button" class="btn btn-secondary" onClick={onExport} disabled={total === 0}>Exportar (.json)</button>
        <button type="button" class="btn btn-secondary" onClick={() => fileRef.current?.click()}>Importar</button>
        <input ref={fileRef} type="file" accept="application/json,.json" class="visually-hidden" tabIndex={-1} aria-label="Importar dados do conselho de um arquivo .json" onChange={onFile} data-import />
        {total > 0 && <ConfirmAction label="Apagar todos os dados do conselho" question="Apagar todos os documentos do conselho (e o webhook do Discord salvo) neste aparelho? Exporte antes se quiser uma cópia." yesLabel="Sim, apagar tudo" onConfirm={onDelete} />}
      </div>
      {error && <p class="kg-error" role="alert">{error}</p>}
      <p class="kg-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
