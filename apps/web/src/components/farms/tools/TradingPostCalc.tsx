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

export const SOURCE_TEXT: Record<ValueSource, string> = { table: "da tabela", override: "seu valor", unknown: "desconhecido" };
const RESOURCE_OPTIONS = RESOURCES.map((r) => ({ value: r, label: RESOURCE_LABEL[r] }));
const MAX_MARCHES = 99;

function positive(p: Parsed<number>): Parsed<number> {
  return p && p.ok && p.value <= 0 ? { ok: false, error: "Digite mais que 0." } : p;
}

function Results({ plan }: { plan: TransferPlan }): JSX.Element {
  const res = RESOURCE_LABEL[plan.resource].toLowerCase();
  const row = (label: string, value: string, key: string) => (
    <div key={key} data-row={key}><dt>{label}</dt><dd>{value}</dd></div>
  );
  const unknown = "Desconhecido";
  return (
    <dl class="ft-results">
      {row("A conta farm envia (antes do imposto)", plan.gross !== null ? `${formatAmount(plan.gross)} ${res}` : unknown, "gross")}
      {row("A principal recebe", `${formatAmount(plan.netNeeded)} ${res}`, "net")}
      {row(
        "Imposto pago",
        plan.tax !== null && plan.taxRate !== null ? `${formatAmount(plan.tax)} (${formatPercent(plan.taxRate)}, ${SOURCE_TEXT[plan.taxSource]})` : `${unknown} (taxa de imposto ${SOURCE_TEXT[plan.taxSource]})`,
        "tax",
      )}
      {row(
        "Capacidade por viagem",
        plan.capacityPerTrip !== null ? `${formatAmount(plan.capacityPerTrip)} (${SOURCE_TEXT[plan.capacitySource]})` : unknown,
        "capacity",
      )}
      {row("Viagens", plan.trips !== null ? formatAmount(plan.trips) : unknown, "trips")}
      {row("Rodadas (viagens ÷ filas de marcha livres)", plan.rounds !== null ? formatAmount(plan.rounds) : "Informe as filas de marcha livres para contar", "rounds")}
      {row("Enviável agora (estoque acima da proteção)", plan.shippable !== null ? `${formatAmount(plan.shippable)} ${res}` : "Informe o estoque da conta farm e a proteção", "shippable")}
      {row(
        "Falta",
        plan.shortfall === null ? unknown : plan.shortfall === 0 ? "Nenhuma: a conta farm tem o suficiente acima da proteção" : `${formatAmount(plan.shortfall)} ${res}`,
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
      setPrefillNote("Essa conta farm não está salva neste navegador. Informe o nível do Entreposto Comercial à mão.");
      return;
    }
    if (farm.levels.tradingPost !== null) setLevel(String(farm.levels.tradingPost));
    if (isResource(farm.role)) setResource(farm.role);
    setPrefillNote(
      farm.levels.tradingPost !== null
        ? `Nível do Entreposto Comercial preenchido a partir de ${farm.name}.`
        : `${farm.name} ainda não tem nível de Entreposto Comercial salvo. Informe abaixo.`,
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
  if (hasErrors) summary = "Corrija os campos destacados para atualizar o resultado.";
  else if (!plan) summary = "Informe a quantidade que a sua principal precisa.";
  else if (plan.gross === null) summary = "Informe o nível do Entreposto Comercial da conta farm ou a taxa de imposto que você vê no jogo.";
  else {
    summary = `Envie ${formatAmount(plan.gross)} ${res} para a sua principal receber ${formatAmount(plan.netNeeded)}.`;
    if (plan.trips !== null) summary += ` ${formatAmount(plan.trips)} ${plan.trips === 1 ? "viagem" : "viagens"}.`;
    if (plan.shortfall !== null && plan.shortfall > 0) summary += ` Faltam ${formatAmount(plan.shortfall)}.`;
  }

  return (
    <div class="ft">
      <form class="fm-card ft-form" aria-labelledby="tp-form-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="tp-form-h">Transferência</h2>
        {prefillNote && <p class="ft-prefill" data-prefilled>{prefillNote}</p>}
        <p class="fm-hint">As quantidades aceitam 1500000, 1.5m ou 300k.</p>
        <div class="ft-fields">
          <TextField id="tp-net" label="Quantidade que a sua principal precisa (depois do imposto)" value={net} onValue={setNet} error={errorOf(netP)} inputMode="text" placeholder="ex.: 1.5m" />
          <SelectField id="tp-res" label="Recurso" value={resource} options={RESOURCE_OPTIONS} onValue={setResource} />
          <TextField id="tp-level" label="Nível do Entreposto Comercial da conta farm" hint={`1 a ${TRADING_POST_MAX_LEVEL}. Usa a tabela para imposto e capacidade.`} value={level} onValue={setLevel} error={errorOf(levelP)} />
          <TextField id="tp-tax" label="Taxa de imposto que você vê no jogo (%)" hint="Opcional. Vale mais que a tabela." value={taxPct} onValue={setTaxPct} error={errorOf(taxP)} inputMode="decimal" />
          <TextField id="tp-cap" label="Capacidade por viagem que você vê no jogo" hint="Opcional. Vale mais que a tabela." value={capacity} onValue={setCapacity} error={errorOf(capP)} inputMode="text" />
          <TextField id="tp-stock" label={`Estoque de ${res} da conta farm`} hint="Opcional. A quantidade bruta na cidade da conta farm." value={stock} onValue={setStock} error={errorOf(stockP)} inputMode="text" />
          <TextField
            id="tp-prot"
            label="Proteção do Depósito (pendente: leia na tela do seu Depósito)"
            hint="Opcional. As fontes divergem para a maioria dos níveis do Depósito, então nunca preenchemos isto por você."
            value={protection}
            onValue={setProtection}
            error={errorOf(protP)}
            inputMode="text"
          />
          <TextField id="tp-marches" label="Filas de marcha livres na conta farm" hint="Opcional. Cada viagem usa uma." value={marches} onValue={setMarches} error={errorOf(marchP)} />
        </div>
      </form>

      <section class="ft-section" aria-labelledby="tp-res-h">
        <h2 id="tp-res-h">Resultado</h2>
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
          <h2 id="tp-warn-h">Antes de enviar</h2>
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
        <summary>Níveis do Entreposto Comercial: tabela de imposto e capacidade</summary>
        <div class="ft-details-body">
          <p class="fm-note">O imposto por nível tem boas fontes. A capacidade dos níveis 1 a 24 vem de uma única tabela de wiki; só o nível 25 é oficial.</p>
          <div class="fm-table-wrap">
            <table class="fm-table">
              <caption class="visually-hidden">Imposto do Entreposto Comercial, capacidade por viagem e requisito por nível</caption>
              <thead>
                <tr><th scope="col" class="num">Nível</th><th scope="col" class="num">Imposto</th><th scope="col" class="num">Capacidade por viagem</th><th scope="col">Requisito</th></tr>
              </thead>
              <tbody>
                {TRADING_POST_LEVELS.map((l) => (
                  <tr key={l.level}>
                    <th scope="row" class="num">{l.level}</th>
                    <td class="num">{formatPercent(l.taxRate)}</td>
                    <td class="num">{formatAmount(l.capacity)}</td>
                    <td>{l.requirement || "Nenhum"}</td>
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
