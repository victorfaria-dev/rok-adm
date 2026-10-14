import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  RESOURCES, farmConfidenceOf, farmIndex, isIsoDate, ledgerToCsv, makeShipment, planTransfer, summarizeLedger, tradingPostLevel, weekOf, weekRange,
  type Resource, type ShipmentEntry,
} from "@rokadm/planner";
import { FARM_NOTE_MAX, addShipment, defaultFarmsStore, newId, readFarms, removeShipment, type Farm, type FarmsStoreV1 } from "../../../lib/farms-store";
import {
  RESOURCE_LABEL, addDays, downloadText, farmsStorage, fmtNumber, localDay, longDay, parseTaxPercent, parseResourceAmount, shortDay, taxPercentText,
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
  const nameOf = (id: string): string => names[id] ?? "Conta farm excluída";

  // Live preview of the math.
  const amt = parseResourceAmount(amount);
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
    if (!farm) errs.farm = "Escolha a conta farm que enviou.";
    if (!isIsoDate(date)) errs.date = "Digite a data em que a conta farm enviou.";
    if (amt === null || Number.isNaN(amt) || amt <= 0) errs.amount = "Digite a quantidade acima de 0, por exemplo 500000, 500k ou 1.5m.";
    if (!tax.ok) errs.tax = tax.error;
    if (note.trim().length > FARM_NOTE_MAX) errs.note = `Use no máximo ${FARM_NOTE_MAX} caracteres (agora ${note.trim().length}).`;
    let entry: ShipmentEntry | null = null;
    if (Object.keys(errs).length === 0 && farm && tax.ok && amt !== null) {
      try {
        entry = makeShipment({
          id: newId(), farmId: farm.id, date, resource, taxRate: tax.rate,
          gross: mode === "gross" ? amt : null, net: mode === "net" ? amt : null, note,
        });
      } catch {
        errs.amount = "Essa quantidade é grande demais.";
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
      setErrors({ amount: "Não foi possível salvar este envio." });
      return;
    }
    setAmount("");
    setNote("");
    setWeek(weekOf(entry.date));
    focusTarget.current = "fl-amount";
    setStatus(`Salvo: ${nameOf(entry.farmId)} enviou ${fmtNumber(entry.gross)} de ${RESOURCE_LABEL[entry.resource].toLowerCase()}, a principal recebeu ${fmtNumber(entry.net)}.`);
  };

  const remove = (id: string): void => {
    setStore(removeShipment(id, stRef.current));
    focusTarget.current = "fl-list-h";
    setStatus("Envio excluído.");
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
    setStatus(`CSV pronto (${what}): veja seus downloads.`);
  };

  const err = (f: Field) => (errors[f] ? <p class="fm-error" id={`fl-${f}-err`}>{errors[f]}</p> : null);
  const inv = (f: Field) => (errors[f] ? "true" : undefined);
  const desc = (f: Field, hint?: string) => [hint, errors[f] ? `fl-${f}-err` : undefined].filter(Boolean).join(" ") || undefined;
  const errCount = Object.keys(errors).length;

  return (
    <div class="fh fl">
      {blocked && <p class="fh-notice" role="note">Este navegador bloqueia o salvamento, então o registro dura só até você fechar esta página.</p>}
      <p class="visually-hidden" role="status" aria-live="polite">{status}</p>

      {loaded && farms.length === 0 ? (
        <section class="fm-card" aria-labelledby="fl-nofarm-h">
          <h2 id="fl-nofarm-h">Adicione uma conta farm primeiro</h2>
          <p>Os envios pertencem a uma conta farm. <a href="/farms/">Adicione a sua em Minhas contas farm</a> e volte aqui.</p>
        </section>
      ) : (
        <form class="fm-card fl-form" onSubmit={submit} noValidate aria-labelledby="fl-form-h">
          <h2 id="fl-form-h">Registrar um envio</h2>
          {errCount > 0 && <p class="fm-error" role="alert">Corrija {errCount === 1 ? "1 campo" : `${errCount} campos`} abaixo.</p>}
          <div class="fl-grid">
            <div class="fm-field">
              <label for="fl-farm">Conta farm</label>
              <select id="fl-farm" value={farmId} aria-invalid={inv("farm")} aria-describedby={desc("farm")} onChange={(e) => pickFarm((e.target as HTMLSelectElement).value)}>
                {!farm && <option value="">Escolha uma conta farm</option>}
                {farms.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}
              </select>
              {err("farm")}
            </div>
            <div class="fm-field">
              <label for="fl-date">Data do envio</label>
              <input id="fl-date" type="date" value={date} max={addDays(today, 1)} aria-invalid={inv("date")} aria-describedby={desc("date")} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
              {err("date")}
            </div>
            <div class="fm-field">
              <label for="fl-resource">Recurso</label>
              <select id="fl-resource" value={resource} onChange={(e) => setResource((e.target as HTMLSelectElement).value as Resource)}>
                {RESOURCES.map((r) => <option value={r} key={r}>{RESOURCE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>

          {resource === "gold" && GOLD_WARNING && (
            <div class="fl-warn" role="note" data-warning="gold_pending_t0">
              <p><strong>Ouro:</strong> {GOLD_WARNING.text}</p>
              <Sourced confidence={GOLD_WARNING.confidence} facts={GOLD_WARNING.facts} gaps={GOLD_WARNING.gaps} hypothesis={GOLD_WARNING.hypothesis} />
            </div>
          )}

          <fieldset class="fh-fieldset">
            <legend class="fm-label">A quantidade que você digita é</legend>
            <div class="fh-radios">
              <label class="fh-radio"><input type="radio" name="fl-mode" checked={mode === "gross"} onChange={() => setMode("gross")} /><span>Enviada pela conta farm (bruta)</span></label>
              <label class="fh-radio"><input type="radio" name="fl-mode" checked={mode === "net"} onChange={() => setMode("net")} /><span>Recebida pela principal (líquida)</span></label>
            </div>
          </fieldset>

          <div class="fl-grid">
            <div class="fm-field">
              <label for="fl-amount">Quantidade</label>
              <input id="fl-amount" type="text" inputMode="numeric" autocomplete="off" value={amount} aria-invalid={inv("amount")} aria-describedby={desc("amount")} onInput={(e) => setAmount((e.target as HTMLInputElement).value)} />
              {err("amount")}
            </div>
            <div class="fm-field">
              <label for="fl-tax">Imposto do Entreposto Comercial (%)</label>
              <input
                id="fl-tax" type="text" inputMode="decimal" autocomplete="off" value={taxText}
                aria-invalid={inv("tax")} aria-describedby={desc("tax", "fl-tax-hint")}
                onInput={(e) => { setTaxText((e.target as HTMLInputElement).value); setTaxFrom("user"); }}
              />
              <p class="fm-hint" id="fl-tax-hint" data-tax-source={taxFrom}>
                {taxFrom === "table" && table && <>Da tabela: Entreposto Comercial nível {table.level}. Mude se o jogo mostrar outro valor.</>}
                {taxFrom === "user" && <>Seu valor.</>}
                {taxFrom === "none" && <>Nenhum nível de Entreposto Comercial salvo para esta conta farm. Digite o imposto mostrado no jogo.</>}
              </p>
              {taxFrom === "user" && table && (
                <button type="button" class="btn btn-secondary fh-small" onClick={() => { setTaxText(taxPercentText(table.rate)); setTaxFrom("table"); }}>
                  Usar o valor da tabela ({taxPercentText(table.rate)}%)
                </button>
              )}
              {err("tax")}
            </div>
          </div>
          {taxFrom === "table" && <Sourced confidence={TAX_CONFIDENCE} facts={TAX_FACTS} />}

          <div class="fm-field">
            <label for="fl-note">Observação (opcional)</label>
            <input id="fl-note" type="text" autocomplete="off" maxLength={FARM_NOTE_MAX} value={note} aria-invalid={inv("note")} aria-describedby={desc("note")} onInput={(e) => setNote((e.target as HTMLInputElement).value)} />
            {err("note")}
          </div>

          <p class="fl-preview" data-preview>
            {preview
              ? <>A conta farm envia <span class="mono">{fmtNumber(preview.gross)}</span>, imposto <span class="mono">{fmtNumber(preview.gross - preview.net)}</span>, a principal recebe <span class="mono">{fmtNumber(preview.net)}</span>.</>
              : "Digite uma quantidade e o imposto para ver o que a principal recebe."}
          </p>
          <div class="fm-actions"><button type="submit" class="btn btn-primary">Adicionar envio</button></div>
        </form>
      )}

      {loaded && (
        <section class="fl-entries" aria-labelledby="fl-list-h">
          <h2 id="fl-list-h" tabIndex={-1}>Envios</h2>
          <div class="fl-filters">
            <div class="fm-field">
              <label for="fl-filter-farm">Mostrar conta farm</label>
              <select id="fl-filter-farm" value={filterFarm} onChange={(e) => setFilterFarm((e.target as HTMLSelectElement).value)}>
                <option value="">Todas as contas farm</option>
                {farms.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div class="fl-week" role="group" aria-label="Semana">
              <p class="fm-label" aria-live="polite" data-week={range.from}>Semana {shortDay(range.from)} – {longDay(range.to)}</p>
              <div class="fm-actions">
                <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(addDays(week, -7))}>Semana anterior</button>
                {week !== thisWeek && <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(thisWeek)}>Esta semana</button>}
                <button type="button" class="btn btn-secondary fh-small" onClick={() => setWeek(addDays(week, 7))}>Próxima semana</button>
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <p class="fm-note">Nenhum envio nesta semana{filterFarm ? " para esta conta farm" : ""}.</p>
          ) : (
            <ul class="fl-list">
              {shown.map((e) => {
                const what = `${shortDay(e.date)}, ${nameOf(e.farmId)}, ${fmtNumber(e.gross)} de ${RESOURCE_LABEL[e.resource].toLowerCase()}`;
                return (
                  <li class="fl-item" key={e.id} data-shipment={e.id}>
                    <p class="fl-item-main"><strong>{nameOf(e.farmId)}</strong> · {RESOURCE_LABEL[e.resource]} · {longDay(e.date)}</p>
                    <p class="fl-item-nums">
                      Enviado <span class="mono">{fmtNumber(e.gross)}</span> · imposto {taxPercentText(e.taxRate)}% (<span class="mono">{fmtNumber(e.gross - e.net)}</span>) · recebido <span class="mono">{fmtNumber(e.net)}</span>
                    </p>
                    {e.note && <p class="fm-note">{e.note}</p>}
                    <ConfirmAction label="Excluir" ariaLabel={`Excluir envio ${what}`} question={`Excluir este envio (${what})?`} onConfirm={() => remove(e.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {loaded && (
        <section class="fm-card fl-summary" aria-labelledby="fl-sum-h">
          <h2 id="fl-sum-h">Resumo da semana</h2>
          <p class="fl-total">Total recebido nesta semana: <strong class="mono" data-total-net>{fmtNumber(summary.total.net)}</strong>{filterFarm ? ` (${nameOf(filterFarm)})` : ""}</p>
          {summary.count > 0 && (
            <>
              <div class="fm-table-wrap">
                <table class="fm-table">
                  <caption class="fm-label">Por recurso</caption>
                  <thead><tr><th scope="col">Recurso</th><th scope="col" class="num">Enviado</th><th scope="col" class="num">Imposto pago</th><th scope="col" class="num">Recebido</th></tr></thead>
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
                  <caption class="fm-label">Por conta farm</caption>
                  <thead><tr><th scope="col">Conta farm</th><th scope="col" class="num">Enviado</th><th scope="col" class="num">Imposto pago</th><th scope="col" class="num">Recebido</th></tr></thead>
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
            <button type="button" class="btn btn-secondary" disabled={shown.length === 0} onClick={() => exportCsv(shown, "esta semana")}>
              Exportar CSV: exibidos ({shown.length})
            </button>
            <button type="button" class="btn btn-secondary" disabled={store.shipments.length === 0} onClick={() => exportCsv(store.shipments, "tudo")}>
              Exportar CSV: todos ({store.shipments.length})
            </button>
          </div>
          <p class="fm-hint">"Exibidos" é a semana e a conta farm escolhidas acima. O arquivo abre em qualquer planilha.</p>
          <DiscordPost id="farms" summary="Publicar o resumo desta semana no Discord" message={farmsWeekMessage(summary, range, names, filterFarm ? nameOf(filterFarm) : null)} />
        </section>
      )}
    </div>
  );
}
