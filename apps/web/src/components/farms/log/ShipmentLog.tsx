import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  RESOURCES, farmConfidenceOf, farmIndex, isIsoDate, ledgerToCsv, makeShipment, planTransfer, summarizeLedger, tradingPostLevel, weekOf, weekRange,
  type Resource, type ShipmentEntry,
} from "@rokadm/planner";
import { FARM_NOTE_MAX, addShipment, defaultFarmsStore, newId, readFarms, removeShipment, type Farm, type FarmsStoreV1 } from "../../../lib/farms-store";
import {
  RESOURCE_LABEL, addDays, downloadText, farmsStorage, fmtNumber, localDay, longDay, parseTaxPercent, parseWhole, shortDay, taxPercentText,
  type StorageLike,
} from "../../../lib/farms-hub";
import { Sourced } from "../shared/Sourced";
import ConfirmAction from "../hub/ConfirmAction";
import DiscordPost from "../../discord/DiscordPost";
import { farmsWeekMessage } from "../../../lib/discord";
import "../shared/farms.css";
import "../hub/hub.css";
import "./log.css";

interface Props {
  clock?: () => Date;
}

type Mode = "gross" | "net";
type TaxFrom = "table" | "user" | "none";
type Field = "farm" | "date" | "amount" | "tax" | "note";

const GOLD_WARNING = planTransfer({ netNeeded: 0, resource: "gold" }).warnings.find((w) => w.code === "gold_pending_t0");
const TAX_FACTS = ["A03-0024"];
const TAX_CONFIDENCE = farmConfidenceOf(TAX_FACTS, farmIndex());

const realClock = (): Date => new Date();

function tableTax(farm: Farm | undefined): { rate: number; level: number } | null {
  const lvl = farm?.levels.tradingPost ?? null;
  const row = lvl !== null ? tradingPostLevel(lvl) : undefined;
  return row ? { rate: row.taxRate, level: row.level } : null;
}

/** F-69 shipment log: add, list by farm/week, weekly totals, CSV export. All local. */
export default function ShipmentLog({ clock = realClock }: Props) {
  const [store, setStore] = useState<FarmsStoreV1>(defaultFarmsStore);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const stRef = useRef<StorageLike | undefined>(undefined);
  const today = localDay(clock());

  const [farmId, setFarmId] = useState("");
  const [date, setDate] = useState(today);
  const [resource, setResource] = useState<Resource>("food");
  const [mode, setMode] = useState<Mode>("gross");
  const [amount, setAmount] = useState("");
  const [taxText, setTaxText] = useState("");
  const [taxFrom, setTaxFrom] = useState<TaxFrom>("none");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");

  const [filterFarm, setFilterFarm] = useState("");
  const [week, setWeek] = useState(() => weekOf(today));
  const focusTarget = useRef<string | null>(null);

  const farms = store.farms;
  const farm = farms.find((f) => f.id === farmId);
  const table = tableTax(farm);

  const pickFarm = (id: string, s: FarmsStoreV1 = store, keepUser = taxFrom === "user"): void => {
    setFarmId(id);
    if (keepUser) return;
    const t = tableTax(s.farms.find((f) => f.id === id));
    setTaxText(t ? taxPercentText(t.rate) : "");
    setTaxFrom(t ? "table" : "none");
  };

  useLayoutEffect(() => {
    const { st, blocked: b } = farmsStorage();
    stRef.current = st;
    const s = readFarms(st);
    setStore(s);
    setBlocked(b);
    let wanted = "";
    try {
      wanted = new URLSearchParams(window.location.search).get("farm") ?? "";
    } catch {
      // ignore
    }
    const first = s.farms.find((f) => f.id === wanted) ?? s.farms[0];
    if (first) pickFarm(first.id, s, false);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!focusTarget.current) return;
    const el = document.getElementById(focusTarget.current);
    focusTarget.current = null;
    el?.focus();
  });

  const names: Record<string, string> = Object.fromEntries(farms.map((f) => [f.id, f.name]));
  const nameOf = (id: string): string => names[id] ?? "Deleted farm";

  // Live preview of the math.
  const amt = parseWhole(amount);
  const tax = parseTaxPercent(taxText);
  let preview: { gross: number; net: number } | null = null;
  if (amt !== null && !Number.isNaN(amt) && amt > 0 && tax.ok) {
    try {
      const e = makeShipment({ id: "p", farmId: "p", date: today, resource, taxRate: tax.rate, gross: mode === "gross" ? amt : null, net: mode === "net" ? amt : null });
      preview = { gross: e.gross, net: e.net };
    } catch {
      preview = null;
    }
  }

  const submit = (e: Event): void => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    if (!farm) errs.farm = "Pick the farm that sent it.";
    if (!isIsoDate(date)) errs.date = "Enter the date the farm sent it.";
    if (amt === null || Number.isNaN(amt) || amt <= 0) errs.amount = "Enter the amount as a whole number above 0, e.g. 500000.";
    if (!tax.ok) errs.tax = tax.error;
    if (note.trim().length > FARM_NOTE_MAX) errs.note = `Use at most ${FARM_NOTE_MAX} characters (now ${note.trim().length}).`;
    let entry: ShipmentEntry | null = null;
    if (Object.keys(errs).length === 0 && farm && tax.ok && amt !== null) {
      try {
        entry = makeShipment({
          id: newId(), farmId: farm.id, date, resource, taxRate: tax.rate,
          gross: mode === "gross" ? amt : null, net: mode === "net" ? amt : null, note,
        });
      } catch {
        errs.amount = "That amount is too large.";
      }
    }
    setErrors(errs);
    if (!entry) {
      const first = (["farm", "date", "amount", "tax", "note"] as Field[]).find((f) => errs[f]);
      if (first) focusTarget.current = `fl-${first}`;
      setStatus("");
      return;
    }
    try {
      setStore(addShipment(entry, stRef.current));
    } catch {
      setErrors({ amount: "This shipment could not be saved." });
      return;
    }
    setAmount("");
    setNote("");
    setWeek(weekOf(entry.date));
    focusTarget.current = "fl-amount";
    setStatus(`Saved: ${nameOf(entry.farmId)} sent ${fmtNumber(entry.gross)} ${entry.resource}, the main received ${fmtNumber(entry.net)}.`);
  };

  const remove = (id: string): void => {
    setStore(removeShipment(id, stRef.current));
    focusTarget.current = "fl-list-h";
    setStatus("Shipment deleted.");
  };

  const range = weekRange(week);
  const byFarm = store.shipments.filter((e) => !filterFarm || e.farmId === filterFarm);
  const indexed = byFarm.map((e, i) => ({ e, i })).filter(({ e }) => e.date >= range.from && e.date <= range.to);
  const shown = indexed.sort((a, b) => (a.e.date === b.e.date ? b.i - a.i : a.e.date < b.e.date ? 1 : -1)).map((x) => x.e);
  const summary = summarizeLedger(byFarm, range);
  const thisWeek = weekOf(today);

  const exportCsv = (entries: readonly ShipmentEntry[], what: string): void => {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    downloadText(`kingdomops-shipments-${today}.csv`, `﻿${ledgerToCsv(sorted, names)}`, "text/csv;charset=utf-8");
    setStatus(`CSV ready (${what}): check your downloads.`);
  };

  const err = (f: Field) => (errors[f] ? <p class="fm-error" id={`fl-${f}-err`}>{errors[f]}</p> : null);
  const inv = (f: Field) => (errors[f] ? "true" : undefined);
  const desc = (f: Field, hint?: string) => [hint, errors[f] ? `fl-${f}-err` : undefined].filter(Boolean).join(" ") || undefined;
  const errCount = Object.keys(errors).length;

  return (
    <div class="fh fl">
      {blocked && <p class="fh-notice" role="note">This browser blocks saving, so the log lasts only until you close this page.</p>}
      <p class="visually-hidden" role="status" aria-live="polite">{status}</p>

      {loaded && farms.length === 0 ? (
        <section class="fm-card" aria-labelledby="fl-nofarm-h">
          <h2 id="fl-nofarm-h">Add a farm first</h2>
          <p>Shipments belong to a farm. <a href="/farms/">Add your farm on My farms</a>, then come back here.</p>
        </section>
      ) : (
        <form class="fm-card fl-form" onSubmit={submit} noValidate aria-labelledby="fl-form-h">
          <h2 id="fl-form-h">Log a shipment</h2>
          {errCount > 0 && <p class="fm-error" role="alert">Fix {errCount === 1 ? "1 field" : `${errCount} fields`} below.</p>}
          <div class="fl-grid">
            <div class="fm-field">
              <label for="fl-farm">Farm</label>
              <select id="fl-farm" value={farmId} aria-invalid={inv("farm")} aria-describedby={desc("farm")} onChange={(e) => pickFarm((e.target as HTMLSelectElement).value)}>
                {!farm && <option value="">Pick a farm</option>}
                {farms.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}
              </select>
              {err("farm")}
            </div>
            <div class="fm-field">
              <label for="fl-date">Date sent</label>
              <input id="fl-date" type="date" value={date} max={addDays(today, 1)} aria-invalid={inv("date")} aria-describedby={desc("date")} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
              {err("date")}
            </div>
            <div class="fm-field">
              <label for="fl-resource">Resource</label>
              <select id="fl-resource" value={resource} onChange={(e) => setResource((e.target as HTMLSelectElement).value as Resource)}>
                {RESOURCES.map((r) => <option value={r} key={r}>{RESOURCE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>

          {resource === "gold" && GOLD_WARNING && (
            <div class="fl-warn" role="note" data-warning="gold_pending_t0">
              <p><strong>Gold:</strong> {GOLD_WARNING.text}</p>
              <Sourced confidence={GOLD_WARNING.confidence} facts={GOLD_WARNING.facts} gaps={GOLD_WARNING.gaps} hypothesis={GOLD_WARNING.hypothesis} />
            </div>
          )}

          <fieldset class="fh-fieldset">
            <legend class="fm-label">The amount you type is</legend>
            <div class="fh-radios">
              <label class="fh-radio"><input type="radio" name="fl-mode" checked={mode === "gross"} onChange={() => setMode("gross")} /><span>Sent by the farm (gross)</span></label>
              <label class="fh-radio"><input type="radio" name="fl-mode" checked={mode === "net"} onChange={() => setMode("net")} /><span>Received by the main (net)</span></label>
            </div>
          </fieldset>

          <div class="fl-grid">
            <div class="fm-field">
              <label for="fl-amount">Amount</label>
              <input id="fl-amount" type="text" inputMode="numeric" autocomplete="off" value={amount} aria-invalid={inv("amount")} aria-describedby={desc("amount")} onInput={(e) => setAmount((e.target as HTMLInputElement).value)} />
              {err("amount")}
            </div>
            <div class="fm-field">
              <label for="fl-tax">Trading Post tax (%)</label>
              <input
                id="fl-tax" type="text" inputMode="decimal" autocomplete="off" value={taxText}
                aria-invalid={inv("tax")} aria-describedby={desc("tax", "fl-tax-hint")}
                onInput={(e) => { setTaxText((e.target as HTMLInputElement).value); setTaxFrom("user"); }}
              />
              <p class="fm-hint" id="fl-tax-hint" data-tax-source={taxFrom}>
                {taxFrom === "table" && table && <>From table: Trading Post level {table.level}. Change it if the game shows another value.</>}
                {taxFrom === "user" && <>Your value.</>}
                {taxFrom === "none" && <>No Trading Post level saved for this farm. Type the tax shown in game.</>}
              </p>
              {taxFrom === "user" && table && (
                <button type="button" class="btn btn-secondary fh-small" onClick={() => { setTaxText(taxPercentText(table.rate)); setTaxFrom("table"); }}>
                  Use table value ({taxPercentText(table.rate)}%)
                </button>
              )}
              {err("tax")}
            </div>
          </div>
          {taxFrom === "table" && <Sourced confidence={TAX_CONFIDENCE} facts={TAX_FACTS} />}

          <div class="fm-field">
            <label for="fl-note">Note (optional)</label>
            <input id="fl-note" type="text" autocomplete="off" maxLength={FARM_NOTE_MAX} value={note} aria-invalid={inv("note")} aria-describedby={desc("note")} onInput={(e) => setNote((e.target as HTMLInputElement).value)} />
            {err("note")}
          </div>

          <p class="fl-preview" data-preview>
            {preview
              ? <>Farm sends <span class="mono">{fmtNumber(preview.gross)}</span>, tax <span class="mono">{fmtNumber(preview.gross - preview.net)}</span>, main receives <span class="mono">{fmtNumber(preview.net)}</span>.</>
              : "Type an amount and the tax to see what the main receives."}
          </p>
          <div class="fm-actions"><button type="submit" class="btn btn-primary">Add shipment</button></div>
        </form>
      )}

      {loaded && (
        <section class="fl-entries" aria-labelledby="fl-list-h">
          <h2 id="fl-list-h" tabIndex={-1}>Shipments</h2>
          <div class="fl-filters">
            <div class="fm-field">
              <label for="fl-filter-farm">Show farm</label>
              <select id="fl-filter-farm" value={filterFarm} onChange={(e) => setFilterFarm((e.target as HTMLSelectElement).value)}>
                <option value="">All farms</option>
                {farms.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div class="fl-week" role="group" aria-label="Week">
              <p class="fm-label" aria-live="polite" data-week={range.from}>Week {shortDay(range.from)} – {longDay(range.to)}</p>
              <div class="fm-actions">
                <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(addDays(week, -7))}>Previous week</button>
                {week !== thisWeek && <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(thisWeek)}>This week</button>}
                <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(addDays(week, 7))}>Next week</button>
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <p class="fm-note">No shipments this week{filterFarm ? " for this farm" : ""}.</p>
          ) : (
            <ul class="fl-list">
              {shown.map((e) => {
                const what = `${shortDay(e.date)}, ${nameOf(e.farmId)}, ${fmtNumber(e.gross)} ${e.resource}`;
                return (
                  <li class="fl-item" key={e.id} data-shipment={e.id}>
                    <p class="fl-item-main"><strong>{nameOf(e.farmId)}</strong> · {RESOURCE_LABEL[e.resource]} · {longDay(e.date)}</p>
                    <p class="fl-item-nums">
                      Sent <span class="mono">{fmtNumber(e.gross)}</span> · tax {taxPercentText(e.taxRate)}% (<span class="mono">{fmtNumber(e.gross - e.net)}</span>) · received <span class="mono">{fmtNumber(e.net)}</span>
                    </p>
                    {e.note && <p class="fm-note">{e.note}</p>}
                    <ConfirmAction label="Delete" ariaLabel={`Delete shipment ${what}`} question={`Delete this shipment (${what})?`} onConfirm={() => remove(e.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {loaded && (
        <section class="fm-card fl-summary" aria-labelledby="fl-sum-h">
          <h2 id="fl-sum-h">Week summary</h2>
          <p class="fl-total">Total received this week: <strong class="mono" data-total-net>{fmtNumber(summary.total.net)}</strong>{filterFarm ? ` (${nameOf(filterFarm)})` : ""}</p>
          {summary.count > 0 && (
            <>
              <div class="fm-table-wrap">
                <table class="fm-table">
                  <caption class="fm-label">By resource</caption>
                  <thead><tr><th scope="col">Resource</th><th scope="col" class="num">Sent</th><th scope="col" class="num">Tax paid</th><th scope="col" class="num">Received</th></tr></thead>
                  <tbody>
                    {RESOURCES.filter((r) => summary.byResource[r].gross > 0).map((r) => {
                      const t = summary.byResource[r];
                      return <tr key={r}><th scope="row">{RESOURCE_LABEL[r]}</th><td class="num">{fmtNumber(t.gross)}</td><td class="num">{fmtNumber(t.tax)}</td><td class="num">{fmtNumber(t.net)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div class="fm-table-wrap">
                <table class="fm-table">
                  <caption class="fm-label">By farm</caption>
                  <thead><tr><th scope="col">Farm</th><th scope="col" class="num">Sent</th><th scope="col" class="num">Tax paid</th><th scope="col" class="num">Received</th></tr></thead>
                  <tbody>
                    {Object.entries(summary.byFarm).map(([id, f]) => (
                      <tr key={id}><th scope="row">{nameOf(id)}</th><td class="num">{fmtNumber(f.total.gross)}</td><td class="num">{fmtNumber(f.total.tax)}</td><td class="num">{fmtNumber(f.total.net)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div class="fm-actions">
            <button type="button" class="btn btn-secondary" disabled={shown.length === 0} onClick={() => exportCsv(shown, "this week")}>
              Export CSV: shown ({shown.length})
            </button>
            <button type="button" class="btn btn-secondary" disabled={store.shipments.length === 0} onClick={() => exportCsv(store.shipments, "all")}>
              Export CSV: all ({store.shipments.length})
            </button>
          </div>
          <p class="fm-hint">"Shown" is the week and farm selected above. The file opens in any spreadsheet.</p>
          <DiscordPost id="farms" summary="Post this week's summary to Discord" message={farmsWeekMessage(summary, range, names, filterFarm ? nameOf(filterFarm) : null)} />
        </section>
      )}
    </div>
  );
}
