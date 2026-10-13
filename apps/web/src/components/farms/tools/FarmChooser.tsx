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
  recommended: "Recommended",
  possible: "Possible",
  not_recommended: "Not recommended for you",
};

export const PAIR_SENTENCE = "No source recommends resource pairs. This is our own reasoning, pending an in-game test.";

type SpendingChoice = "" | SpendingProfile;
const SPENDING_OPTIONS: ReadonlyArray<{ value: SpendingChoice; label: string }> = [
  { value: "", label: "Not set" },
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
    ? "Fix the highlighted fields to update the advice."
    : [
        count === 0 ? "No farm yet." : `${count} farm${count === 1 ? "" : "s"} suggested.`,
        recommended.length > 0 ? `Recommended: ${listText(recommended)}.` : "",
        rec.mainBottleneck ? `Your main mostly needs ${listText(rec.mainBottleneck.resources)}.` : "",
      ].filter(Boolean).join(" ");

  const civFacts = [...new Set(RESOURCES.flatMap((r) => rec.civByResource[r].facts))];
  const civConfidence = farmMinConfidence(...RESOURCES.map((r) => rec.civByResource[r].confidence));

  return (
    <div class="ft">
      <form class="fm-card ft-form" aria-labelledby="fc-form-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="fc-form-h">About your main</h2>
        {prefilled && <p class="ft-prefill" data-prefilled>Prefilled from your profile. Change any value; nothing is saved to your profile.</p>}
        <div class="ft-fields">
          <TextField id="fc-ch" label="Main City Hall" hint="Level 1 to 25." value={cityHall} onValue={setCityHall} error={errorOf(chP)} />
          <TextField id="fc-min" label="Minutes per day" hint="Time you can spend on the game each day." value={minutes} onValue={setMinutes} error={errorOf(minP)} />
          <SelectField id="fc-spend" label="Spending profile" value={spending} options={SPENDING_OPTIONS} onValue={setSpending} />
          <TextField id="fc-owned" label="Farms you already have" value={owned} onValue={setOwned} error={errorOf(ownedP)} />
        </div>
        <CheckField id="fc-many" label="I want more than one farm" checked={wantsMany} onValue={setWantsMany} />
        <CheckField
          id="fc-hyp"
          label="Show hypotheses"
          hint="Also show ideas no source recommends. Saved in this browser."
          checked={showHyp}
          onValue={toggleHyp}
        />
      </form>

      <section class="ft-section" aria-labelledby="fc-res-h">
        <h2 id="fc-res-h">Your answer</h2>
        <p class="ft-live" aria-live="polite" data-summary>{summary}</p>
        <div class="fm-grid fm-grid-2">
          <article class="fm-card" data-card="count">
            <h3>How many farms</h3>
            <p class="ft-big" data-count>{count}</p>
            <p>{rec.farmCount.why}</p>
            <Sourced confidence={rec.farmCount.confidence} facts={rec.farmCount.facts} gaps={rec.farmCount.gaps} hypothesis={rec.farmCount.hypothesis} />
          </article>
          <article class="fm-card" data-card="bottleneck">
            <h3>What your main is short of</h3>
            {rec.mainBottleneck ? (
              <>
                <p class="ft-big">{listText(rec.mainBottleneck.resources.map((r) => RESOURCE_LABEL[r]))}</p>
                <p>{rec.mainBottleneck.stageLabel}</p>
                <Sourced confidence={rec.mainBottleneck.confidence} facts={rec.mainBottleneck.facts} />
              </>
            ) : (
              <p>Enter your main's City Hall to see which resources it runs short of.</p>
            )}
          </article>
        </div>
      </section>

      <section class="ft-section" aria-labelledby="fc-var-h">
        <h2 id="fc-var-h">Farm types</h2>
        {!showHyp && <p class="fm-note">One idea without any source is hidden. Turn on "Show hypotheses" to see it.</p>}
        <div class="fm-grid">
          {variants.map((v) => <VariantCard key={v.id} v={v} />)}
        </div>
      </section>

      <section class="ft-section" aria-labelledby="fc-civ-h">
        <h2 id="fc-civ-h">Civilization by resource</h2>
        <div class="fm-table-wrap">
          <table class="fm-table">
            <caption class="visually-hidden">Civilizations with a gathering bonus for each resource</caption>
            <thead><tr><th scope="col">Resource</th><th scope="col">Civilizations</th><th scope="col">Gathering bonus</th></tr></thead>
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
        <h2 id="fc-next-h">Next</h2>
        <div class="fm-actions">
          <a class="btn btn-primary" href="/farms/">Add this farm to My farms</a>
          <a class="btn btn-secondary" href="/farms/build/">See the build path</a>
        </div>
        <ul class="ft-links" aria-label="Farm guides by resource">
          {RESOURCES.map((r) => <li key={r}><a href={`/guides/farms/${r}/`}>{RESOURCE_LABEL[r]} farm guide</a></li>)}
        </ul>
      </section>
    </div>
  );
}
