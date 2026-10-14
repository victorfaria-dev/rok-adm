// F-65 "Which farm should I build?" island. Recalculates on every input; no submit.
import { PROFILE_NAMES, type SpendingProfile } from "@rokadm/core";
import { RESOURCES, farmMinConfidence, recommendFarms, type FarmVariant, type VariantStatus } from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { readFarms, writeFarms } from "../../../lib/farms-store";
import {
  RESOURCE_LABEL, civName, errorOf, listText, parseIntInRange, prefillFromProfile, valueOf,
} from "../../../lib/farms-tools";
import { readStore } from "../../../lib/store";
import { HypothesisPill, Sourced } from "../shared/Sourced";
import { CheckField, SelectField, TextField } from "./Field";

const STATUS_TEXT: Record<Exclude<VariantStatus, "hidden">, string> = {
  recommended: "Recomendado",
  possible: "Possível",
  not_recommended: "Não recomendado para você",
};

export const PAIR_SENTENCE = "Nenhuma fonte recomenda pares de recursos. Este é um raciocínio nosso, pendente de teste no jogo.";

type SpendingChoice = "" | SpendingProfile;
const SPENDING_OPTIONS: ReadonlyArray<{ value: SpendingChoice; label: string }> = [
  { value: "", label: "Não definido" },
  ...(Object.keys(PROFILE_NAMES) as SpendingProfile[]).map((v) => ({ value: v as SpendingChoice, label: PROFILE_NAMES[v] })),
];

function VariantCard({ v }: { v: FarmVariant }): JSX.Element {
  const hidden = v.status === "hidden";
  return (
    <article class="fm-card" data-variant={v.id}>
      <div class="ft-card-head">
        <h3>{v.label}</h3>
        {hidden ? <HypothesisPill /> : <span class={`ft-badge ft-badge-${v.status}`} data-status>{STATUS_TEXT[v.status as Exclude<VariantStatus, "hidden">]}</span>}
      </div>
      {hidden && <p><strong>{PAIR_SENTENCE}</strong></p>}
      <p>{v.why}</p>
      <Sourced confidence={v.confidence} facts={v.facts} gaps={v.gaps} hypothesis={v.hypothesis} />
    </article>
  );
}

export default function FarmChooser(): JSX.Element {
  const [cityHall, setCityHall] = useState("");
  const [minutes, setMinutes] = useState("");
  const [spending, setSpending] = useState<SpendingChoice>("");
  const [owned, setOwned] = useState("0");
  const [wantsMany, setWantsMany] = useState(false);
  const [showHyp, setShowHyp] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Storage is read after mount so the server-rendered HTML and the first client render match.
  useEffect(() => {
    const pre = prefillFromProfile(readStore().profileCode);
    if (pre) {
      setCityHall(String(pre.cityHall));
      setMinutes(String(pre.minutesPerDay));
      setSpending(pre.spending);
      setPrefilled(true);
    }
    const farms = readFarms();
    if (farms.farms.length > 0) setOwned(String(farms.farms.length));
    setShowHyp(farms.showHypotheses);
  }, []);

  const toggleHyp = (on: boolean) => {
    setShowHyp(on);
    writeFarms({ showHypotheses: on });
  };

  const chP = parseIntInRange(cityHall, 1, 25);
  const minP = parseIntInRange(minutes, 0, 1440);
  const ownedP = parseIntInRange(owned, 0, 99);
  const hasErrors = Boolean(errorOf(chP) || errorOf(minP) || errorOf(ownedP));

  const rec = useMemo(
    () => recommendFarms({
      mainCityHall: valueOf(chP),
      minutesPerDay: valueOf(minP),
      spending: spending || null,
      farmsOwned: valueOf(ownedP) ?? 0,
      wantsMany,
    }),
    [cityHall, minutes, spending, owned, wantsMany],
  );

  const variants = rec.variants.filter((v) => v.status !== "hidden" || showHyp);
  const recommended = rec.variants.filter((v) => v.status === "recommended").map((v) => v.label);
  const count = rec.farmCount.value;
  const summary = hasErrors
    ? "Corrija os campos destacados para atualizar o conselho."
    : [
        count === 0 ? "Nenhuma conta farm ainda." : `${count} ${count === 1 ? "conta farm sugerida" : "contas farm sugeridas"}.`,
        recommended.length > 0 ? `Recomendado: ${listText(recommended)}.` : "",
        rec.mainBottleneck ? `A sua principal precisa mais de ${listText(rec.mainBottleneck.resources.map((r) => RESOURCE_LABEL[r].toLowerCase()))}.` : "",
      ].filter(Boolean).join(" ");

  const civFacts = [...new Set(RESOURCES.flatMap((r) => rec.civByResource[r].facts))];
  const civConfidence = farmMinConfidence(...RESOURCES.map((r) => rec.civByResource[r].confidence));

  return (
    <div class="ft">
      <form class="fm-card ft-form" aria-labelledby="fc-form-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="fc-form-h">Sobre a sua principal</h2>
        {prefilled && <p class="ft-prefill" data-prefilled>Preenchido a partir do seu perfil. Mude qualquer valor; nada é salvo no seu perfil.</p>}
        <div class="ft-fields">
          <TextField id="fc-ch" label="Prefeitura da principal" hint="Nível 1 a 25." value={cityHall} onValue={setCityHall} error={errorOf(chP)} />
          <TextField id="fc-min" label="Minutos por dia" hint="Tempo que você pode dedicar ao jogo por dia." value={minutes} onValue={setMinutes} error={errorOf(minP)} />
          <SelectField id="fc-spend" label="Perfil de gasto" value={spending} options={SPENDING_OPTIONS} onValue={setSpending} />
          <TextField id="fc-owned" label="Contas farm que você já tem" value={owned} onValue={setOwned} error={errorOf(ownedP)} />
        </div>
        <CheckField id="fc-many" label="Quero mais de uma conta farm" checked={wantsMany} onValue={setWantsMany} />
        <CheckField
          id="fc-hyp"
          label="Mostrar hipóteses"
          hint="Mostra também ideias que nenhuma fonte recomenda. Fica salvo neste navegador."
          checked={showHyp}
          onValue={toggleHyp}
        />
      </form>

      <section class="ft-section" aria-labelledby="fc-res-h">
        <h2 id="fc-res-h">Sua resposta</h2>
        <p class="ft-live" aria-live="polite" data-summary>{summary}</p>
        <div class="fm-grid fm-grid-2">
          <article class="fm-card" data-card="count">
            <h3>Quantas contas farm</h3>
            <p class="ft-big" data-count>{count}</p>
            <p>{rec.farmCount.why}</p>
            <Sourced confidence={rec.farmCount.confidence} facts={rec.farmCount.facts} gaps={rec.farmCount.gaps} hypothesis={rec.farmCount.hypothesis} />
          </article>
          <article class="fm-card" data-card="bottleneck">
            <h3>O que falta na sua principal</h3>
            {rec.mainBottleneck ? (
              <>
                <p class="ft-big">{listText(rec.mainBottleneck.resources.map((r) => RESOURCE_LABEL[r]))}</p>
                <p>{rec.mainBottleneck.stageLabel}</p>
                <Sourced confidence={rec.mainBottleneck.confidence} facts={rec.mainBottleneck.facts} />
              </>
            ) : (
              <p>Informe a Prefeitura da sua principal para ver de quais recursos ela anda curta.</p>
            )}
          </article>
        </div>
      </section>

      <section class="ft-section" aria-labelledby="fc-var-h">
        <h2 id="fc-var-h">Tipos de conta farm</h2>
        {!showHyp && <p class="fm-note">Uma ideia sem nenhuma fonte está oculta. Ative "Mostrar hipóteses" para vê-la.</p>}
        <div class="fm-grid">
          {variants.map((v) => <VariantCard key={v.id} v={v} />)}
        </div>
      </section>

      <section class="ft-section" aria-labelledby="fc-civ-h">
        <h2 id="fc-civ-h">Civilização por recurso</h2>
        <div class="fm-table-wrap">
          <table class="fm-table">
            <caption class="visually-hidden">Civilizações com bônus de coleta para cada recurso</caption>
            <thead><tr><th scope="col">Recurso</th><th scope="col">Civilizações</th><th scope="col">Bônus de coleta</th></tr></thead>
            <tbody>
              {RESOURCES.map((r) => (
                <tr key={r}>
                  <th scope="row">{RESOURCE_LABEL[r]}</th>
                  <td>{rec.civByResource[r].civs.map(civName).join(", ")}</td>
                  <td>{rec.civByResource[r].bonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Sourced confidence={civConfidence} facts={civFacts} />
      </section>

      <section class="ft-section" aria-labelledby="fc-next-h">
        <h2 id="fc-next-h">Em seguida</h2>
        <div class="fm-actions">
          <a class="btn btn-primary" href="/farms/">Adicionar esta conta farm a Minhas contas farm</a>
          <a class="btn btn-secondary" href="/farms/build/">Ver o caminho de construção</a>
        </div>
        <ul class="ft-links" aria-label="Guias de farm por recurso">
          {RESOURCES.map((r) => <li key={r}><a href={`/guides/farms/${r}/`}>Guia de farm de {RESOURCE_LABEL[r].toLowerCase()}</a></li>)}
        </ul>
      </section>
    </div>
  );
}
