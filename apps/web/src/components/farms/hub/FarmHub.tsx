import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { nextFarmToVisit } from "@rokadm/planner";
import {
  MAX_FARMS, addFarm, clearFarms, defaultFarmsStore, exportFarms, importFarms, readFarms, removeFarm, updateFarm, writeFarms,
  type FarmPatch, type FarmsStoreV1,
} from "../../../lib/farms-store";
import { downloadText, farmsStorage, formatDuration, formatLocalTime, localDay, type StorageLike } from "../../../lib/farms-hub";
import ConfirmAction from "./ConfirmAction";
import FarmCard from "./FarmCard";
import FarmForm, { type FarmFormSubmit } from "./FarmForm";
import "../shared/farms.css";
import "./hub.css";

interface Props {
  /** Injected clock (tests). */
  clock?: () => Date;
}

type Editing = { kind: "none" } | { kind: "add" } | { kind: "edit"; id: string };

const realClock = (): Date => new Date();

/** F-68 farm list: farms, "visit next", daily checklist, goals, export/import. All local. */
export default function FarmHub({ clock = realClock }: Props) {
  const [store, setStore] = useState<FarmsStoreV1>(defaultFarmsStore);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [now, setNow] = useState<Date>(() => clock());
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [status, setStatus] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const focusTarget = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stRef = useRef<StorageLike | undefined>(undefined);

  useLayoutEffect(() => {
    const { st, blocked: b } = farmsStorage();
    stRef.current = st;
    setStore(readFarms(st));
    setBlocked(b);
    setNow(clock());
    setLoaded(true);
  }, []);

  // "Back in …" and the checklist day follow the clock: recompute every minute.
  useEffect(() => {
    const t = setInterval(() => setNow(clock()), 60_000);
    return () => clearInterval(t);
  }, [clock]);

  useEffect(() => {
    if (!focusTarget.current) return;
    const el = document.getElementById(focusTarget.current);
    focusTarget.current = null;
    el?.focus();
  });

  const today = localDay(now);
  const farms = store.farms;
  const full = farms.length >= MAX_FARMS;
  const say = (m: string): void => setStatus(m);

  const submitFarm = (v: FarmFormSubmit): string | null => {
    try {
      if (editing.kind === "edit") {
        const s = updateFarm(editing.id, v, stRef.current);
        setStore(s);
        focusTarget.current = `fc-${editing.id}-h`;
        say(`${v.name} salva.`);
      } else {
        const { store: s, farm } = addFarm(v, stRef.current);
        setStore(s);
        focusTarget.current = `fc-${farm.id}-h`;
        say(`${farm.name} adicionada.`);
      }
      setEditing({ kind: "none" });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Não foi possível salvar a conta farm.";
    }
  };

  const cancelForm = (): void => {
    focusTarget.current = editing.kind === "edit" ? `fc-${editing.id}-h` : "fh-add";
    setEditing({ kind: "none" });
  };

  const patchFarm = (id: string, patch: FarmPatch, message: string): void => {
    setStore(updateFarm(id, patch, stRef.current));
    setNow(clock());
    say(message);
  };

  const deleteFarm = (id: string): void => {
    const name = farms.find((f) => f.id === id)?.name ?? "Conta farm";
    const s = removeFarm(id, stRef.current);
    setStore(s);
    focusTarget.current = s.farms.length ? "fh-list-h" : "fh-add";
    say(`${name} excluída.`);
  };

  const doExport = (): void => {
    downloadText(`kingdomops-farms-${today}.json`, exportFarms(store), "application/json");
    say("Exportação pronta: veja seus downloads.");
  };

  const doImport = async (e: Event): Promise<void> => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const data = importFarms(await file.text());
      setStore(writeFarms(data, stRef.current));
      setImportError(null);
      say(`Importadas ${data.farms.length} ${data.farms.length === 1 ? "conta farm" : "contas farm"} e ${data.shipments.length} envios.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Não foi possível ler esse arquivo.");
    }
  };

  const deleteAll = (): void => {
    clearFarms(stRef.current);
    setStore(defaultFarmsStore());
    setEditing({ kind: "none" });
    focusTarget.current = "fh-add";
    say("Todos os dados de contas farm foram excluídos deste navegador.");
  };

  const visits = nextFarmToVisit(farms, now);
  const byId = new Map(farms.map((f) => [f.id, f]));

  const addButton = full ? (
    <p class="fm-note" id="fh-limit">Você acompanha {MAX_FARMS} contas farm, o limite. Exclua uma para adicionar outra.</p>
  ) : (
    <button type="button" class="btn btn-primary" id="fh-add" onClick={() => setEditing({ kind: "add" })} disabled={!loaded}>Adicionar uma conta farm</button>
  );

  return (
    <div class="fh">
      {blocked && <p class="fh-notice" role="note">Este navegador bloqueia o salvamento, então suas contas farm duram só até você fechar esta página.</p>}
      <p class="visually-hidden" role="status" aria-live="polite">{status}</p>

      {loaded && farms.length === 0 && editing.kind !== "add" && (
        <section class="fm-card fh-empty" aria-labelledby="fh-empty-h">
          <h2 id="fh-empty-h">Acompanhe suas contas farm</h2>
          <ul>
            <li>Veja qual conta farm visitar em seguida, pelo horário em que as marchas voltam.</li>
            <li>Marque uma lista diária curta por conta farm. As marcações zeram à meia-noite.</li>
            <li>Defina uma meta diária e conte o que a principal recebeu no registro de envios.</li>
          </ul>
          <p class="fm-note">Tudo fica neste navegador. Nada é enviado para lugar nenhum.</p>
          <div class="fm-actions">{addButton}</div>
          <p>Novo em contas farm? Leia <a href="/farms/choose/">Qual farm devo criar?</a> ou os <a href="/guides/farms/">guias de farm</a>.</p>
        </section>
      )}

      {editing.kind === "add" && <FarmForm onSubmit={submitFarm} onCancel={cancelForm} />}

      {farms.length > 0 && (
        <section class="fh-visit" aria-labelledby="fh-visit-h">
          <h2 id="fh-visit-h">Visitar em seguida</h2>
          <ol class="fh-visit-list">
            {visits.map((v) => {
              const f = byId.get(v.id);
              if (!f) return null;
              return (
                <li key={v.id}>
                  <a href={`#fc-${f.id}-h`} onClick={(e) => { e.preventDefault(); document.getElementById(`fc-${f.id}-h`)?.focus(); }}>{f.name}</a>
                  {v.status === "idle"
                    ? <span class="fh-visit-when">{v.until ? "as marchas voltaram" : "parada"}</span>
                    : <span class="fh-visit-when">volta em {formatDuration(v.minutesLeft ?? 0)} <span class="fm-note">(às {formatLocalTime(v.until!, now)})</span></span>}
                </li>
              );
            })}
          </ol>
          <p class="fm-hint">Primeiro as contas paradas, depois a volta mais próxima. Atualiza a cada minuto.</p>
        </section>
      )}

      {farms.length > 0 && (
        <section class="fh-list" aria-labelledby="fh-list-h">
          <div class="fh-list-head">
            <h2 id="fh-list-h" tabIndex={-1}>Suas contas farm <span class="fm-note">({farms.length} de {MAX_FARMS})</span></h2>
            {editing.kind !== "add" && addButton}
          </div>
          <p class="fm-note">Os minutos por tarefa ainda não foram medidos (medição no jogo pendente, lacuna L-A13-01), então a lista não mostra tempos.</p>
          {farms.map((f) =>
            editing.kind === "edit" && editing.id === f.id ? (
              <FarmForm key={f.id} farm={f} onSubmit={submitFarm} onCancel={cancelForm} />
            ) : (
              <FarmCard
                key={f.id} farm={f} now={now} today={today} shipments={store.shipments} clock={clock}
                onUpdate={(p, m) => patchFarm(f.id, p, m)}
                onEdit={() => setEditing({ kind: "edit", id: f.id })}
                onDelete={() => deleteFarm(f.id)}
              />
            ),
          )}
        </section>
      )}

      {loaded && (
        <section class="fm-card fh-data" aria-labelledby="fh-data-h">
          <h2 id="fh-data-h">Dados das suas contas farm</h2>
          <p class="fm-note">Salvos só neste navegador. Exporte um arquivo para guardar uma cópia ou levar para outro aparelho.</p>
          <div class="fm-actions">
            <button type="button" class="btn btn-secondary" onClick={doExport} disabled={farms.length === 0 && store.shipments.length === 0}>Exportar contas farm (JSON)</button>
            <button type="button" class="btn btn-secondary" onClick={() => fileRef.current?.click()}>Importar contas farm…</button>
            <input
              ref={fileRef} id="fh-import" class="visually-hidden" type="file" accept=".json,application/json"
              aria-label="Arquivo de contas farm para importar" tabIndex={-1} onChange={(e) => void doImport(e)}
            />
          </div>
          <p class="fm-hint">Importar substitui as contas farm e os envios deste navegador.</p>
          {importError && <p class="fm-error" role="alert">{importError}</p>}
          {(farms.length > 0 || store.shipments.length > 0) && (
            <ConfirmAction label="Excluir todos os dados de contas farm" question="Excluir todas as contas farm, listas e envios deste navegador?" yesLabel="Sim, excluir tudo" onConfirm={deleteAll} />
          )}
        </section>
      )}
    </div>
  );
}
