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
      setStatus(`${filename} is ready: check your downloads.`);
    } catch {
      setStatus("The file could not be made in this browser.");
    }
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-csv-h" data-csv>
      <h2 id="kx-csv-h">Export to a spreadsheet</h2>
      <p class="kg-note">
        CSV files open in Excel, Google Sheets or Numbers. The ledger lists every event, oldest first, one row per slot.
        The governor list has each name, score and tags. Both hold other players' names as your council typed them: share them only with your council.
      </p>
      <CheckField
        id="kx-csv-scores"
        label="Include scores in the ledger CSV"
        checked={includeScores}
        onValue={setIncludeScores}
        hint="Off by default: the ledger file then has names, slots and reasons only. The governor list always has the scores."
      />
      <div class="kg-actions">
        <button type="button" class="btn btn-secondary" onClick={() => download("ledger")} disabled={doc.events.length === 0}>Download ledger CSV</button>
        <button type="button" class="btn btn-secondary" onClick={() => download("governors")} disabled={doc.candidates.length === 0}>Download governors CSV</button>
      </div>
      <p class="kg-status" role="status" aria-live="polite" data-csv-status>{status}</p>
    </section>
  );
}
