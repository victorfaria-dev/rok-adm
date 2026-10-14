import { useState } from "preact/hooks";
import type { MgeDoc, MgePlan } from "@rokadm/planner";
import { downloadMgeCsv, type MgeCsvKind } from "../../../lib/kingdom-mge";
import { CheckField } from "../shared/Field";

interface Props {
  doc: MgeDoc;
  plan: MgePlan;
  today: string;
}

/** CSV downloads of the ledger and the governor list. Built in the browser, no network. */
export default function ExportCsv({ doc, plan, today }: Props) {
  const [includeScores, setIncludeScores] = useState(false);
  const [status, setStatus] = useState("");

  function download(kind: MgeCsvKind) {
    try {
      const { filename } = downloadMgeCsv(kind, doc, plan, includeScores, today);
      setStatus(`${filename} está pronto: confira seus downloads.`);
    } catch {
      setStatus("Não foi possível gerar o arquivo neste navegador.");
    }
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-csv-h" data-csv>
      <h2 id="kx-csv-h">Exportar para uma planilha</h2>
      <p class="kg-note">
        Arquivos CSV abrem no Excel, no Google Planilhas ou no Numbers. O registro lista cada evento, do mais antigo ao mais novo, uma linha por vaga.
        A lista de governadores tem cada nome, pontuação e etiquetas. Os dois guardam nomes de outros jogadores como o seu conselho digitou: compartilhe só com o conselho.
      </p>
      <CheckField
        id="kx-csv-scores"
        label="Incluir pontuações no CSV do registro"
        checked={includeScores}
        onValue={setIncludeScores}
        hint="Desligado por padrão: o arquivo do registro então tem só nomes, vagas e motivos. A lista de governadores sempre tem as pontuações."
      />
      <div class="kg-actions">
        <button type="button" class="btn btn-secondary" onClick={() => download("ledger")} disabled={doc.events.length === 0}>Baixar CSV do registro</button>
        <button type="button" class="btn btn-secondary" onClick={() => download("governors")} disabled={doc.candidates.length === 0}>Baixar CSV dos governadores</button>
      </div>
      <p class="kg-status" role="status" aria-live="polite" data-csv-status>{status}</p>
    </section>
  );
}
