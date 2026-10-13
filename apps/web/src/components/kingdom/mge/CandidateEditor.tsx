import { useEffect, useRef, useState } from "preact/hooks";
import { MGE_LIMITS, updateCandidate, type MgeCandidate, type MgeCandidateErrors, type MgeDoc } from "@rokadm/planner";
import { TextField } from "../shared/Field";

interface Props {
  doc: MgeDoc;
  candidate: MgeCandidate;
  /** Called with the edited plan and a status line. */
  onSave: (next: MgeDoc, status: string) => void;
  onCancel: () => void;
}

const FIELDS = ["name", "score", "tags"] as const;

/**
 * Inline editor for one governor (name, score, tags). Enter saves, Escape cancels. The id stays,
 * so applicants, manual placements and rotation history stay attached; locked events keep the
 * name they stored when they were locked.
 */
export default function CandidateEditor({ doc, candidate, onSave, onCancel }: Props) {
  const [name, setName] = useState(candidate.name);
  const [score, setScore] = useState(candidate.score === null ? "" : String(candidate.score));
  const [tags, setTags] = useState(candidate.tags.join(", "));
  const [errors, setErrors] = useState<MgeCandidateErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const base = `kx-edit-${candidate.id}`;

  useEffect(() => {
    (document.getElementById(`${base}-name`) as HTMLInputElement | null)?.select();
  }, []);

  function save(e: Event) {
    e.preventDefault();
    const r = updateCandidate(doc, candidate.id, { name, score, tags });
    if (!r.ok) {
      setErrors(r.errors);
      const first = FIELDS.find((f) => r.errors[f]);
      if (first) setTimeout(() => document.getElementById(`${base}-${first}`)?.focus(), 0);
      return;
    }
    const renamed = r.previousName !== r.candidate.name ? ` (was ${r.previousName})` : "";
    const dup = r.duplicate ? ` Another governor is also named ${r.candidate.name}; rename one so the ledger is clear.` : "";
    onSave(r.doc, `Saved ${r.candidate.name}${renamed}.${dup}`);
  }

  return (
    <form
      class="kx-edit"
      ref={formRef}
      data-editor={candidate.id}
      onSubmit={save}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      noValidate
    >
      <fieldset class="kx-fieldset kg-grid">
        <legend class="kx-legend">Edit {candidate.name}</legend>
        <TextField id={`${base}-name`} label={`Name for ${candidate.name}`} value={name} onValue={setName} error={errors.name} maxLength={MGE_LIMITS.name + 1} />
        <TextField id={`${base}-score`} label={`Score for ${candidate.name} (optional)`} value={score} onValue={setScore} error={errors.score} hint="4200000, 4,200,000 or 4.2m. Leave empty for no score." />
        <TextField id={`${base}-tags`} label={`Tags for ${candidate.name} (optional)`} value={tags} onValue={setTags} error={errors.tags} hint={`Separate with commas, up to ${MGE_LIMITS.tags}.`} />
      </fieldset>
      <p class="kg-hint">Locked events keep the name they were locked with.</p>
      <div class="kg-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
