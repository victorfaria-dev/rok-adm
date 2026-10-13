// F-67 Trading Post calculator island: how much the farm sends so the main receives a net amount.
import {
  RESOURCES, TP_UNLOCK_NOTE, TRADING_POST_LEVELS, TRADING_POST_MAX_LEVEL, isResource, planTransfer,
  type Resource, type TransferPlan, type ValueSource,
} from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { readFarms } from "../../../lib/farms-store";
import {
  RESOURCE_LABEL, errorOf, farmIdFromSearch, formatAmount, formatPercent, parseAmount, parseIntInRange, parsePercent, valueOf,
  type Parsed,
} from "../../../lib/farms-tools";
import { Sourced } from "../shared/Sourced";
import { SelectField, TextField } from "./Field";

export const SOURCE_TEXT: Record<ValueSource, string> = { table: "from table", override: "your value", unknown: "unknown" };
const RESOURCE_OPTIONS = RESOURCES.map((r) => ({ value: r, label: RESOURCE_LABEL[r] }));
const MAX_MARCHES = 99;

function positive(p: Parsed<number>): Parsed<number> {
  return p && p.ok && p.value <= 0 ? { ok: false, error: "Enter more than 0." } : p;
}

function Results({ plan }: { plan: TransferPlan }): JSX.Element {
  const res = RESOURCE_LABEL[plan.resource].toLowerCase();
  const row = (label: string, value: string, key: string) => (
    <div key={key} data-row={key}><dt>{label}</dt><dd>{value}</dd></div>
  );
  const unknown = "Unknown";
  return (
    <dl class="ft-results">
      {row("Farm sends (before tax)", plan.gross !== null ? `${formatAmount(plan.gross)} ${res}` : unknown, "gross")}
      {row("Main receives", `${formatAmount(plan.netNeeded)} ${res}`, "net")}
      {row(
        "Tax paid",
        plan.tax !== null && plan.taxRate !== null ? `${formatAmount(plan.tax)} (${formatPercent(plan.taxRate)}, ${SOURCE_TEXT[plan.taxSource]})` : `${unknown} (tax rate ${SOURCE_TEXT[plan.taxSource]})`,
        "tax",
      )}
      {row(
        "Capacity per trip",
        plan.capacityPerTrip !== null ? `${formatAmount(plan.capacityPerTrip)} (${SOURCE_TEXT[plan.capacitySource]})` : unknown,
        "capacity",
      )}
      {row("Trips", plan.trips !== null ? formatAmount(plan.trips) : unknown, "trips")}
      {row("Rounds (trips ÷ free march queues)", plan.rounds !== null ? formatAmount(plan.rounds) : "Enter free march queues to count", "rounds")}
      {row("Shippable now (stock above protection)", plan.shippable !== null ? `${formatAmount(plan.shippable)} ${res}` : "Enter farm stock and protection", "shippable")}
      {row(
        "Shortfall",
        plan.shortfall === null ? unknown : plan.shortfall === 0 ? "None: the farm has enough above protection" : `${formatAmount(plan.shortfall)} ${res}`,
        "shortfall",
      )}
    </dl>
  );
}

export default function TradingPostCalc(): JSX.Element {
  const [net, setNet] = useState("");
  const [resource, setResource] = useState<Resource>("food");
  const [level, setLevel] = useState("");
  const [taxPct, setTaxPct] = useState("");
  const [capacity, setCapacity] = useState("");
  const [stock, setStock] = useState("");
  const [protection, setProtection] = useState("");
  const [marches, setMarches] = useState("");
  const [prefillNote, setPrefillNote] = useState("");

  useEffect(() => {
    const id = farmIdFromSearch(window.location.search);
    if (!id) return;
    const farm = readFarms().farms.find((f) => f.id === id);
    if (!farm) {
      setPrefillNote("That farm is not saved in this browser. Enter its Trading Post level by hand.");
      return;
    }
    if (farm.levels.tradingPost !== null) setLevel(String(farm.levels.tradingPost));
    if (isResource(farm.role)) setResource(farm.role);
    setPrefillNote(
      farm.levels.tradingPost !== null
        ? `Trading Post level prefilled from ${farm.name}.`
        : `${farm.name} has no Trading Post level saved yet. Enter it below.`,
    );
  }, []);

  const netP = parseAmount(net);
  const levelP = parseIntInRange(level, 1, TRADING_POST_MAX_LEVEL);
  const taxP = parsePercent(taxPct);
  const capP = positive(parseAmount(capacity));
  const stockP = parseAmount(stock);
  const protP = parseAmount(protection);
  const marchP = parseIntInRange(marches, 1, MAX_MARCHES);
  const hasErrors = [netP, levelP, taxP, capP, stockP, protP, marchP].some((p) => errorOf(p));

  const netValue = valueOf(netP);
  const plan = useMemo<TransferPlan | null>(() => {
    if (netValue === null) return null;
    try {
      return planTransfer({
        netNeeded: netValue,
        resource,
        level: valueOf(levelP),
        taxRateOverride: valueOf(taxP),
        capacityOverride: valueOf(capP),
        farmStock: valueOf(stockP),
        storehouseProtection: valueOf(protP),
        marches: valueOf(marchP),
      });
    } catch {
      return null;
    }
  }, [net, resource, level, taxPct, capacity, stock, protection, marches]);

  const res = RESOURCE_LABEL[resource].toLowerCase();
  let summary: string;
  if (hasErrors) summary = "Fix the highlighted fields to update the result.";
  else if (!plan) summary = "Enter the amount your main needs.";
  else if (plan.gross === null) summary = "Enter the farm's Trading Post level or the tax rate you see in game.";
  else {
    summary = `Send ${formatAmount(plan.gross)} ${res} so your main receives ${formatAmount(plan.netNeeded)}.`;
    if (plan.trips !== null) summary += ` ${formatAmount(plan.trips)} trip${plan.trips === 1 ? "" : "s"}.`;
    if (plan.shortfall !== null && plan.shortfall > 0) summary += ` Short by ${formatAmount(plan.shortfall)}.`;
  }

  return (
    <div class="ft">
      <form class="fm-card ft-form" aria-labelledby="tp-form-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="tp-form-h">Transfer</h2>
        {prefillNote && <p class="ft-prefill" data-prefilled>{prefillNote}</p>}
        <p class="fm-hint">Amounts accept 1,500,000, 1.5m or 300k.</p>
        <div class="ft-fields">
          <TextField id="tp-net" label="Amount your main needs (after tax)" value={net} onValue={setNet} error={errorOf(netP)} inputMode="text" placeholder="e.g. 1.5m" />
          <SelectField id="tp-res" label="Resource" value={resource} options={RESOURCE_OPTIONS} onValue={setResource} />
          <TextField id="tp-level" label="Farm Trading Post level" hint={`1 to ${TRADING_POST_MAX_LEVEL}. Uses the table for tax and capacity.`} value={level} onValue={setLevel} error={errorOf(levelP)} />
          <TextField id="tp-tax" label="Tax rate you see in game (%)" hint="Optional. Wins over the table." value={taxPct} onValue={setTaxPct} error={errorOf(taxP)} inputMode="decimal" />
          <TextField id="tp-cap" label="Capacity per trip you see in game" hint="Optional. Wins over the table." value={capacity} onValue={setCapacity} error={errorOf(capP)} inputMode="text" />
          <TextField id="tp-stock" label={`Farm stock of ${res}`} hint="Optional. The raw amount in the farm's city." value={stock} onValue={setStock} error={errorOf(stockP)} inputMode="text" />
          <TextField
            id="tp-prot"
            label="Storehouse protection (pending: read it on your Storehouse screen)"
            hint="Optional. Sources disagree for most Storehouse levels, so we never fill this in for you."
            value={protection}
            onValue={setProtection}
            error={errorOf(protP)}
            inputMode="text"
          />
          <TextField id="tp-marches" label="Free march queues on the farm" hint="Optional. Each trip uses one." value={marches} onValue={setMarches} error={errorOf(marchP)} />
        </div>
      </form>

      <section class="ft-section" aria-labelledby="tp-res-h">
        <h2 id="tp-res-h">Result</h2>
        <p class="ft-live" aria-live="polite" data-summary>{summary}</p>
        {plan && (
          <div class="fm-card">
            <Results plan={plan} />
            <Sourced confidence={plan.confidence} facts={plan.facts} />
          </div>
        )}
      </section>

      {plan && (
        <section class="ft-section" aria-labelledby="tp-warn-h">
          <h2 id="tp-warn-h">Before you ship</h2>
          <ul class="ft-warnings">
            {plan.warnings.map((w) => (
              <li key={w.code} data-warning={w.code}>
                <p>{w.text}</p>
                <Sourced confidence={w.confidence} facts={w.facts} gaps={w.gaps} hypothesis={w.hypothesis} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <details class="fm-card ft-details" data-reference>
        <summary>Trading Post levels: tax and capacity table</summary>
        <div class="ft-details-body">
          <p class="fm-note">Tax per level is well sourced. Capacity for levels 1–24 comes from one wiki table; only level 25 is official.</p>
          <div class="fm-table-wrap">
            <table class="fm-table">
              <caption class="visually-hidden">Trading Post tax, capacity per trip and requirement by level</caption>
              <thead>
                <tr><th scope="col" class="num">Level</th><th scope="col" class="num">Tax</th><th scope="col" class="num">Capacity per trip</th><th scope="col">Requirement</th></tr>
              </thead>
              <tbody>
                {TRADING_POST_LEVELS.map((l) => (
                  <tr key={l.level}>
                    <th scope="row" class="num">{l.level}</th>
                    <td class="num">{formatPercent(l.taxRate)}</td>
                    <td class="num">{formatAmount(l.capacity)}</td>
                    <td>{l.requirement || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{TP_UNLOCK_NOTE.text}</p>
          <Sourced confidence={TP_UNLOCK_NOTE.confidence} facts={TP_UNLOCK_NOTE.facts} gaps={TP_UNLOCK_NOTE.gaps} />
        </div>
      </details>
    </div>
  );
}
