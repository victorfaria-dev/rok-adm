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
        say(`${v.name} saved.`);
      } else {
        const { store: s, farm } = addFarm(v, stRef.current);
        setStore(s);
        focusTarget.current = `fc-${farm.id}-h`;
        say(`${farm.name} added.`);
      }
      setEditing({ kind: "none" });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not save the farm.";
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
    const name = farms.find((f) => f.id === id)?.name ?? "Farm";
    const s = removeFarm(id, stRef.current);
    setStore(s);
    focusTarget.current = s.farms.length ? "fh-list-h" : "fh-add";
    say(`${name} deleted.`);
  };

  const doExport = (): void => {
    downloadText(`kingdomops-farms-${today}.json`, exportFarms(store), "application/json");
    say("Export ready: check your downloads.");
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
      say(`Imported ${data.farms.length} ${data.farms.length === 1 ? "farm" : "farms"} and ${data.shipments.length} shipments.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not read that file.");
    }
  };

  const deleteAll = (): void => {
    clearFarms(stRef.current);
    setStore(defaultFarmsStore());
    setEditing({ kind: "none" });
    focusTarget.current = "fh-add";
    say("All farm data deleted from this browser.");
  };

  const visits = nextFarmToVisit(farms, now);
  const byId = new Map(farms.map((f) => [f.id, f]));

  const addButton = full ? (
    <p class="fm-note" id="fh-limit">You track {MAX_FARMS} farms, the limit. Delete one to add another.</p>
  ) : (
    <button type="button" class="btn btn-primary" id="fh-add" onClick={() => setEditing({ kind: "add" })} disabled={!loaded}>Add a farm</button>
  );

  return (
    <div class="fh">
      {blocked && <p class="fh-notice" role="note">This browser blocks saving, so your farms last only until you close this page.</p>}
      <p class="visually-hidden" role="status" aria-live="polite">{status}</p>

      {loaded && farms.length === 0 && editing.kind !== "add" && (
        <section class="fm-card fh-empty" aria-labelledby="fh-empty-h">
          <h2 id="fh-empty-h">Track your farm accounts</h2>
          <ul>
            <li>See which farm to visit next, from the time its marches come back.</li>
            <li>Tick a short daily checklist per farm. Ticks reset at midnight.</li>
            <li>Set a daily goal and count what the main received in the shipment log.</li>
          </ul>
          <p class="fm-note">Everything stays in this browser. Nothing is sent anywhere.</p>
          <div class="fm-actions">{addButton}</div>
          <p>New to farms? Read <a href="/farms/choose/">Which farm should I build?</a> or the <a href="/guides/farms/">farm guides</a>.</p>
        </section>
      )}

      {editing.kind === "add" && <FarmForm onSubmit={submitFarm} onCancel={cancelForm} />}

      {farms.length > 0 && (
        <section class="fh-visit" aria-labelledby="fh-visit-h">
          <h2 id="fh-visit-h">Visit next</h2>
          <ol class="fh-visit-list">
            {visits.map((v) => {
              const f = byId.get(v.id);
              if (!f) return null;
              return (
                <li key={v.id}>
                  <a href={`#fc-${f.id}-h`} onClick={(e) => { e.preventDefault(); document.getElementById(`fc-${f.id}-h`)?.focus(); }}>{f.name}</a>
                  {v.status === "idle"
                    ? <span class="fh-visit-when">{v.until ? "marches are back" : "idle"}</span>
                    : <span class="fh-visit-when">back in {formatDuration(v.minutesLeft ?? 0)} <span class="fm-note">(at {formatLocalTime(v.until!, now)})</span></span>}
                </li>
              );
            })}
          </ol>
          <p class="fm-hint">Idle farms first, then the soonest return. Updates every minute.</p>
        </section>
      )}

      {farms.length > 0 && (
        <section class="fh-list" aria-labelledby="fh-list-h">
          <div class="fh-list-head">
            <h2 id="fh-list-h" tabIndex={-1}>Your farms <span class="fm-note">({farms.length} of {MAX_FARMS})</span></h2>
            {editing.kind !== "add" && addButton}
          </div>
          <p class="fm-note">Minutes per task are not measured yet (pending in-game measurement, gap L-A13-01), so the checklist shows no times.</p>
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
          <h2 id="fh-data-h">Your farm data</h2>
          <p class="fm-note">Saved only in this browser. Export a file to keep a copy or move it to another device.</p>
          <div class="fm-actions">
            <button type="button" class="btn btn-secondary" onClick={doExport} disabled={farms.length === 0 && store.shipments.length === 0}>Export farms (JSON)</button>
            <button type="button" class="btn btn-secondary" onClick={() => fileRef.current?.click()}>Import farms…</button>
            <input
              ref={fileRef} id="fh-import" class="visually-hidden" type="file" accept=".json,application/json"
              aria-label="Import farms file" tabIndex={-1} onChange={(e) => void doImport(e)}
            />
          </div>
          <p class="fm-hint">Importing replaces the farms and shipments in this browser.</p>
          {importError && <p class="fm-error" role="alert">{importError}</p>}
          {(farms.length > 0 || store.shipments.length > 0) && (
            <ConfirmAction label="Delete all farm data" question="Delete every farm, checklist and shipment from this browser?" yesLabel="Yes, delete all" onConfirm={deleteAll} />
          )}
        </section>
      )}
    </div>
  );
}
