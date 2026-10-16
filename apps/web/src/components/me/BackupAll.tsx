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
  add: "Será adicionado",
  replace: "Vai substituir o que há aqui",
  same: "Igual ao que há aqui (sem mudança)",
  invalid: "Ilegível no arquivo (ignorado)",
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
      setStatus("Ainda não há nada salvo neste navegador, então não há o que fazer backup.");
      return;
    }
    download(backupFileName(now()), backupText(b));
    setError("");
    setStatus(`Backup pronto com ${count} ${count === 1 ? "seção" : "seções"}: confira seus downloads.`);
  }

  async function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("Este arquivo é grande demais para ser um backup do KingdomOps.");
      const p = planRestore(await file.text(), storage());
      setError("");
      setStatus("");
      setPlan(p);
    } catch (err) {
      setPlan(null);
      setStatus("");
      setError(err instanceof Error ? err.message : "Não foi possível ler este arquivo.");
    }
  }

  function confirm() {
    if (!plan) return;
    const n = applyRestore(plan, storage());
    setPlan(null);
    setStatus(`${n} ${n === 1 ? "seção restaurada" : "seções restauradas"}. Recarregando…`);
    reload();
  }

  const changes = plan ? Object.keys(plan.writes).length : 0;
  return (
    <div class="me me-backup">
      <section class="me-section" aria-labelledby="me-backup-h">
        <h2 id="me-backup-h">Fazer backup de tudo</h2>
        <p>
          Um arquivo com tudo o que o KingdomOps guarda neste navegador: {BACKUP_SECTIONS.map((s) => s.label.toLowerCase()).join("; ")}.
          Use para trocar de celular ou guardar uma cópia. O webhook do Discord nunca é incluído.
        </p>
        <div class="me-actions">
          <button type="button" class="btn btn-secondary" onClick={exportAll}>Fazer backup de tudo</button>
          <label class="btn btn-secondary me-file">
            Restaurar de um backup
            <input class="visually-hidden" type="file" accept=".json,application/json" onChange={(e) => void pick(e)} data-backup-file />
          </label>
        </div>
        <p class="me-note">Antes de restaurar, mostramos o que vai mudar. As seções que não estão no arquivo ficam como estão.</p>

        {plan && (
          <div class="me-confirm" role="group" aria-labelledby="me-restore-h" data-restore-plan
            onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setPlan(null); setStatus("Restauração cancelada."); } }}>
            <h3 id="me-restore-h" tabIndex={-1} ref={heading}>Restaurar este backup?</h3>
            {plan.exportedAt && <p>Feito em {new Date(plan.exportedAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}.</p>}
            <dl class="me-answers">
              {plan.rows.map((r) => (
                <div class="me-row" key={r.key} data-restore-row={r.key} data-change={r.change}>
                  <dt>{r.label}</dt>
                  <dd>
                    {CHANGE_TEXT[r.change]}
                    <span class="me-diff">Aqui agora: {r.now ?? "nada"}</span>
                    {r.incoming !== null && <span class="me-diff">No arquivo: {r.incoming}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {plan.rows.length === 0 && <p>O arquivo não tem seções que esta versão consiga ler.</p>}
            {plan.unknown.length > 0 && <p class="me-note">{plan.unknown.length === 1 ? "1 parte do arquivo que esta versão não conhece será ignorada" : `${plan.unknown.length} partes do arquivo que esta versão não conhece serão ignoradas`}.</p>}
            <div class="me-actions">
              <button type="button" class="btn btn-primary" onClick={confirm} disabled={changes === 0}>
                {changes === 0 ? "Nada para restaurar" : `Restaurar ${changes} ${changes === 1 ? "seção" : "seções"}`}
              </button>
              <button type="button" class="btn btn-secondary" onClick={() => { setPlan(null); setStatus("Restauração cancelada."); }}>Cancelar</button>
            </div>
          </div>
        )}
        <p class="me-status" role="status" data-backup-status>{status}</p>
        {error && <p class="me-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
