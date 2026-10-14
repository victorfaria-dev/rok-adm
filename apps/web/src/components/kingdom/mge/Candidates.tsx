import { useRef, useState } from "preact/hooks";
import {
  MGE_LIMITS, formatInt, newDocId, readCandidateInput, removeCandidate,
  type LineError, type MgeCandidateErrors, type MgeDoc, type MgePlan,
} from "@rokadm/planner";
import { addCandidatesFromCsv, addCandidatesFromText, type AddCandidatesResult } from "../../../lib/kingdom-mge";
import CsvImport from "../shared/CsvImport";
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
      setStatus(`${candidates[i]!.name} atualizado.`);
    } else if (doc.candidates.length >= MGE_LIMITS.candidates) {
      setErrors({ name: `A lista está cheia (${MGE_LIMITS.candidates} governadores). Remova alguém primeiro.` });
      return;
    } else {
      onChange({ ...doc, candidates: [...doc.candidates, { id: newDocId(), name: n, score: s, tags: r.tags }] });
      setStatus(`${n} adicionado.`);
    }
    setName("");
    setScore("");
    setTags("");
  }

  function report(r: AddCandidatesResult) {
    setPasteErrors(r.errors);
    const parts = [`${r.added} ${r.added === 1 ? "governador adicionado" : "governadores adicionados"}.`];
    if (r.updated.length) parts.push(`Pontuação atualizada em ${r.updated.length}.`);
    if (r.duplicates.length) parts.push(`${r.duplicates.length} já ${r.duplicates.length === 1 ? "listado" : "listados"}, mantidos como estavam.`);
    if (r.overLimit) parts.push(`${r.overLimit} não ${r.overLimit === 1 ? "adicionado" : "adicionados"}: a lista comporta ${MGE_LIMITS.candidates}.`);
    if (r.errors.length) parts.push(`${r.errors.length} ${r.errors.length === 1 ? "linha não pôde" : "linhas não puderam"} ser lida${r.errors.length === 1 ? "" : "s"} (veja abaixo).`);
    setStatus(parts.join(" "));
    if (r.added || r.updated.length) onChange(r.doc);
  }

  function addPasted() {
    const r = addCandidatesFromText(doc, paste);
    report(r);
    if (!r.errors.length) setPaste("");
  }

  function addCsv(text: string) {
    try {
      report(addCandidatesFromCsv(doc, text));
    } catch (e) {
      setPasteErrors([]);
      setStatus(e instanceof Error ? e.message : "Não foi possível ler este arquivo.");
    }
  }

  return (
    <section class="kg-grid" aria-labelledby="kx-cand-h">
      <h2 id="kx-cand-h">Governadores ({doc.candidates.length})</h2>
      <p class="kg-note">A pontuação é um número do próprio conselho, por exemplo o DKP. Deixe vazia se vocês não ordenam por pontuação.</p>
      <div class="kg-grid kg-grid-2">
        <div class="kg-grid">
          <h3 class="kx-h3">Adicionar um</h3>
          <TextField id="kx-cand-name" label="Nome do governador" value={name} onValue={setName} error={errors.name} maxLength={MGE_LIMITS.name + 1} />
          <TextField id="kx-cand-score" label="Pontuação (opcional)" value={score} onValue={setScore} error={errors.score} hint="4200000, 4.200.000 ou 4.2m" />
          <TextField id="kx-cand-tags" label="Etiquetas (opcional)" value={tags} onValue={setTags} error={errors.tags} hint="Separe com vírgulas, por exemplo: líder de rally, líder de guarnição" />
          <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={addOne}>Adicionar governador</button></div>
        </div>
        <div class="kg-grid">
          <h3 class="kx-h3">Colar uma lista</h3>
          <TextAreaField
            id="kx-paste"
            label="Governadores, um por linha"
            value={paste}
            onValue={setPaste}
            rows={6}
            hint={"Nome e pontuação em cada linha: \"Davi, 4.2m\", \"Davi; 4.2m\", \"Davi 4.2m\" ou uma linha colada de planilha. A pontuação é opcional. Nomes já listados (maiúsculas ou minúsculas) recebem a nova pontuação."}
            error={pasteErrors.length ? `${pasteErrors.length} ${pasteErrors.length === 1 ? "linha não pôde" : "linhas não puderam"} ser lida${pasteErrors.length === 1 ? "" : "s"}.` : undefined}
          />
          {pasteErrors.length > 0 && (
            <ul class="kx-errors" data-paste-errors>
              {pasteErrors.slice(0, 20).map((e) => <li key={e.line}>Linha {e.line} ("{e.text.slice(0, 40)}"): {e.message}</li>)}
              {pasteErrors.length > 20 && <li>…e mais {pasteErrors.length - 20}.</li>}
            </ul>
          )}
          <div class="kg-actions">
            <button type="button" class="btn btn-primary" onClick={addPasted} disabled={!paste.trim()}>Adicionar da lista</button>
            <CsvImport label="Importar CSV" describedBy="kx-csv-hint" testId="mge" onText={addCsv} onError={(m) => { setPasteErrors([]); setStatus(m); }} />
          </div>
          <p class="kg-hint" id="kx-csv-hint">CSV de uma planilha: uma primeira linha com "name" (ou "nome" / "governor") e, se quiser, "score" (ou "dkp" / "pontos").</p>
        </div>
      </div>
      <p class="kg-status" role="status" aria-live="polite" data-cand-status>{status}</p>
      {doc.candidates.length > 0 && (
        <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Lista de governadores" ref={tableRef}>
          <table class="kg-table" data-candidates>
            <caption class="visually-hidden">Governadores neste plano</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col" class="num">Pontuação</th>
                <th scope="col">Etiquetas</th>
                <th scope="col" class="num">Vagas no plano</th>
                <th scope="col"><span class="visually-hidden">Ações</span></th>
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
                      <button type="button" class="btn btn-secondary" data-edit={c.id} aria-label={`Editar ${c.name}`} onClick={() => { setEditing(c.id); setStatus(""); }}>Editar</button>
                      <ConfirmAction label="Remover" ariaLabel={`Remover ${c.name}`} question={`Remover ${c.name} deste plano? Eventos travados mantêm o nome.`} yesLabel="Sim, remover" onConfirm={() => onChange(removeCandidate(doc, c.id))} />
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
