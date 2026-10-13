import { useRef, useState } from "preact/hooks";
import {
  MGE_LIMITS, formatInt, newDocId, readCandidateInput, removeCandidate,
  type LineError, type MgeCandidateErrors, type MgeDoc, type MgePlan,
} from "@rokadm/planner";
import { addCandidatesFromText } from "../../../lib/kingdom-mge";
import ConfirmAction from "../shared/ConfirmAction";
import { TextAreaField, TextField } from "../shared/Field";
import CandidateEditor from "./CandidateEditor";

interface Props {
  doc: MgeDoc;
  plan: MgePlan;
  onChange: (d: MgeDoc) => void;
}

/** Candidate list: add one, paste many, edit in place, remove. Names and scores are typed by the council. */
export default function Candidates({ doc, plan, onChange }: Props) {
  const [name, setName] = useState("");
  const [score, setScore] = useState("");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<MgeCandidateErrors>({});
  /** Id of the governor being edited inline (one at a time). */
  const [editing, setEditing] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [paste, setPaste] = useState("");
  const [pasteErrors, setPasteErrors] = useState<LineError[]>([]);
  const [status, setStatus] = useState("");

  const slotsSoFar = new Map<string, number>();
  for (const e of plan.events) for (const a of e.assignments) slotsSoFar.set(a.candidateId, (slotsSoFar.get(a.candidateId) ?? 0) + 1);

  /** Close the inline editor and put focus back on that row's Edit button (WCAG 2.4.3). */
  function closeEditor(id: string) {
    setEditing(null);
    setTimeout(() => tableRef.current?.querySelector<HTMLButtonElement>(`button[data-edit="${id}"]`)?.focus(), 0);
  }

  function addOne() {
    const r = readCandidateInput({ name, score, tags });
    setErrors(r.ok ? {} : r.errors);
    if (!r.ok) {
      setStatus("");
      return;
    }
    const n = r.name, s = r.score;
    const i = doc.candidates.findIndex((c) => c.name.toLowerCase() === n.toLowerCase());
    if (i >= 0) {
      const candidates = [...doc.candidates];
      candidates[i] = { ...candidates[i]!, score: s ?? candidates[i]!.score, tags: tags.trim() ? r.tags : candidates[i]!.tags };
      onChange({ ...doc, candidates });
      setStatus(`Updated ${candidates[i]!.name}.`);
    } else if (doc.candidates.length >= MGE_LIMITS.candidates) {
      setErrors({ name: `The list is full (${MGE_LIMITS.candidates} governors). Remove someone first.` });
      return;
    } else {
      onChange({ ...doc, candidates: [...doc.candidates, { id: newDocId(), name: n, score: s, tags: r.tags }] });
      setStatus(`Added ${n}.`);
    }
    setName("");
    setScore("");
    setTags("");
  }

  function addPasted() {
    const r = addCandidatesFromText(doc, paste);
    setPasteErrors(r.errors);
    const parts = [`Added ${r.added} governor${r.added === 1 ? "" : "s"}.`];
    if (r.updated.length) parts.push(`Updated the score of ${r.updated.length}.`);
    if (r.duplicates.length) parts.push(`${r.duplicates.length} already listed, kept as they were.`);
    if (r.overLimit) parts.push(`${r.overLimit} not added: the list holds ${MGE_LIMITS.candidates}.`);
    if (r.errors.length) parts.push(`${r.errors.length} line${r.errors.length === 1 ? "" : "s"} could not be read (see below).`);
    setStatus(parts.join(" "));
    if (r.added || r.updated.length) onChange(r.doc);
    if (!r.errors.length) setPaste("");
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-cand-h">
      <h2 id="kx-cand-h">Governors ({doc.candidates.length})</h2>
      <p class="kg-note">The score is your council's own number, for example DKP. Leave it empty if you do not rank by score.</p>
      <div class="kg-grid kg-grid-2">
        <div class="kg-grid">
          <h3 class="kx-h3">Add one</h3>
          <TextField id="kx-cand-name" label="Governor name" value={name} onValue={setName} error={errors.name} maxLength={MGE_LIMITS.name + 1} />
          <TextField id="kx-cand-score" label="Score (optional)" value={score} onValue={setScore} error={errors.score} hint="4200000, 4,200,000 or 4.2m" />
          <TextField id="kx-cand-tags" label="Tags (optional)" value={tags} onValue={setTags} error={errors.tags} hint="Separate with commas, for example: rally lead, garrison lead" />
          <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={addOne}>Add governor</button></div>
        </div>
        <div class="kg-grid">
          <h3 class="kx-h3">Paste a list</h3>
          <TextAreaField
            id="kx-paste"
            label="Governors, one per line"
            value={paste}
            onValue={setPaste}
            rows={6}
            hint="Name, score — the score is optional. Names already listed get the new score."
            error={pasteErrors.length ? `${pasteErrors.length} line${pasteErrors.length === 1 ? "" : "s"} could not be read.` : undefined}
          />
          {pasteErrors.length > 0 && (
            <ul class="kx-errors" data-paste-errors>
              {pasteErrors.slice(0, 20).map((e) => <li key={e.line}>Line {e.line} ("{e.text.slice(0, 40)}"): {e.message}</li>)}
              {pasteErrors.length > 20 && <li>…and {pasteErrors.length - 20} more.</li>}
            </ul>
          )}
          <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={addPasted} disabled={!paste.trim()}>Add from list</button></div>
        </div>
      </div>
      <p class="kg-status" role="status" aria-live="polite" data-cand-status>{status}</p>
      {doc.candidates.length > 0 && (
        <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Governor list" ref={tableRef}>
          <table class="kg-table" data-candidates>
            <caption class="visually-hidden">Governors in this plan</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" class="num">Score</th>
                <th scope="col">Tags</th>
                <th scope="col" class="num">Slots in plan</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {doc.candidates.map((c) => editing === c.id ? (
                <tr key={c.id} data-editing={c.id}>
                  <td colSpan={5}>
                    <CandidateEditor
                      doc={doc}
                      candidate={c}
                      onSave={(next, msg) => {
                        onChange(next);
                        setStatus(msg);
                        closeEditor(c.id);
                      }}
                      onCancel={() => closeEditor(c.id)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={c.id} data-candidate={c.id}>
                  <td>{c.name}</td>
                  <td class="num">{c.score === null ? "—" : formatInt(c.score)}</td>
                  <td>{c.tags.join(", ")}</td>
                  <td class="num">{slotsSoFar.get(c.id) ?? 0}</td>
                  <td>
                    <div class="kg-actions kx-row-actions">
                      <button type="button" class="btn btn-secondary" data-edit={c.id} aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c.id); setStatus(""); }}>Edit</button>
                      <ConfirmAction label="Remove" ariaLabel={`Remove ${c.name}`} question={`Remove ${c.name} from this plan? Locked events keep their name.`} yesLabel="Yes, remove" onConfirm={() => onChange(removeCandidate(doc, c.id))} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
