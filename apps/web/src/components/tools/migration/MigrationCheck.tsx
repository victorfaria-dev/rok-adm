import { useState } from "preact/hooks";
import { ROUTES, checkMigration, mergeCites, type Cite as CiteData, type MigrationRoute, type MigrationRules } from "@rokadm/planner/tools";
import { encodeShare } from "../../../lib/tools-store";
import { Cite } from "../kit/Cite";
import { EMPTY_NUMBER, NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface MigrationCheckProps {
  rules: MigrationRules;
  /** Citation per fact id (built at build time). */
  cites: Record<string, CiteData>;
}

const YES_NO: readonly { value: string; label: string }[] = [{ value: "", label: "Choose an answer" }, { value: "no", label: "No" }, { value: "yes", label: "Yes" }];
const fmt = (n: number) => n.toLocaleString("en-US");

/** Keys a migration officer pre-fills for applicants (F-31 c). */
export const KINGDOM_KEYS = ["route", "kingdomAgeDays", "targetPowerCapM", "targetMinPowerM"] as const;

/** Every field starts empty: nothing is checked until the user answers (no "Eligible" for made-up values). */
export const MIGRATION_DEFAULTS = {
  cityHall: EMPTY_NUMBER, powerM: EMPTY_NUMBER, inAlliance: "", troopsHome: "", resourcesProtected: "", cooldownActive: "",
  characterAgeDays: EMPTY_NUMBER, kingdomAgeDays: EMPTY_NUMBER, route: "same-soc", targetPowerCapM: 0, targetMinPowerM: 0,
};
type Answers = typeof MIGRATION_DEFAULTS;

/** Inputs each rule reads; a rule is "Not checked" while any of them is empty. */
const NEEDS: Record<string, readonly (keyof Answers)[]> = {
  ch: ["cityHall"], alliance: ["inAlliance"], troops: ["troopsHome"], resources: ["resourcesProtected"], cooldown: ["cooldownActive"],
  age: ["characterAgeDays", "kingdomAgeDays"], "cross-power": ["powerM"], cap: ["powerM"], "kingdom-min": ["powerM"],
};
const LABEL: Record<string, string> = {
  cityHall: "City Hall level", powerM: "power", inAlliance: "alliance", troopsHome: "troops home", resourcesProtected: "resources protected",
  cooldownActive: "cooldown", characterAgeDays: "character age", kingdomAgeDays: "target kingdom age",
};

/** Fields still empty, in form order. */
export function missingAnswers(v: Answers): (keyof Answers)[] {
  return (Object.keys(LABEL) as (keyof Answers)[]).filter((k) => (typeof v[k] === "number" ? (v[k] as number) < 0 : v[k] === ""));
}

/** F-31: eligible / not eligible + every reason, and passport pages, for the current rules. */
export default function MigrationCheck({ rules, cites }: MigrationCheckProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("migration", MIGRATION_DEFAULTS);
  const [officerMsg, setOfficerMsg] = useState("");
  const route = (ROUTES.some((r) => r.id === v.route) ? v.route : "same-soc") as MigrationRoute;
  const res = checkMigration({
    cityHall: v.cityHall, powerM: v.powerM, inAlliance: v.inAlliance === "yes", troopsHome: v.troopsHome === "yes",
    resourcesProtected: v.resourcesProtected === "yes", cooldownActive: v.cooldownActive === "yes",
    characterAgeDays: v.characterAgeDays, kingdomAgeDays: v.kingdomAgeDays, route,
    targetPowerCapM: v.targetPowerCapM, targetMinPowerM: v.targetMinPowerM,
  }, rules);
  const citeOf = (ids: readonly string[]): CiteData => mergeCites(...ids.map((id) => cites[id] ?? { facts: [id], confidence: "pending" as const, stale: true }));
  const all = citeOf([...new Set(res.checks.flatMap((c) => c.facts))]);
  const missing = missingAnswers(v);
  const known = (id: string): boolean => (NEEDS[id] ?? []).every((k) => !missing.includes(k));
  const knownBlockers = res.checks.filter((c) => known(c.id) && !c.ok);
  const verdict = knownBlockers.length > 0 ? "Not eligible" : missing.length > 0 ? "Not checked yet" : "Eligible";
  const verdictNote = knownBlockers.length > 0
    ? `${knownBlockers.length} rule${knownBlockers.length === 1 ? "" : "s"} block${knownBlockers.length === 1 ? "s" : ""} the move.${missing.length ? ` ${missing.length} answer${missing.length === 1 ? "" : "s"} still empty.` : ""}`
    : missing.length > 0
      ? `Answer ${missing.length} more question${missing.length === 1 ? "" : "s"} above: ${missing.map((k) => LABEL[k]).join(", ")}.`
      : "Every rule below passes.";
  const powerKnown = v.powerM >= 0;
  const pp = res.passport;
  const pages = pp.kind === "exact" ? `${fmt(pp.pages)} page${pp.pages === 1 ? "" : "s"}` : `Between ${fmt(pp.low)} and ${fmt(pp.high)} pages`;

  const officerUrl = (): string => {
    const u = new URL(window.location.href);
    const pick: Record<string, string | number> = {};
    for (const k of KINGDOM_KEYS) pick[k] = v[k];
    u.search = `?s=${encodeShare(pick)}`;
    u.hash = "";
    return u.toString();
  };
  const copyOfficer = async (): Promise<void> => {
    const url = officerUrl();
    try {
      await navigator.clipboard.writeText(url);
      setOfficerMsg("Applicant link copied. It fills in your kingdom's route, age, power cap and minimum; applicants add their own account.");
    } catch {
      setOfficerMsg(`Copy this link: ${url}`);
    }
  };

  return (
    <div class="t-page-body" data-tool="migration">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Your account">
        <NumberField id="mig-ch" label="City Hall level" optional value={v.cityHall} min={1} max={25} onChange={(x) => set({ cityHall: x })} />
        <NumberField id="mig-power" label="Displayed power (millions)" optional value={v.powerM} integer={false} max={10000} onChange={(x) => set({ powerM: x })}
          help="The power on your profile, e.g. 12.5 for 12.5M." suffix="M" />
        <SelectField id="mig-alliance" label="Are you in an alliance?" value={v.inAlliance} options={YES_NO} onChange={(x) => set({ inAlliance: x })} />
        <SelectField id="mig-troops" label="Are all your troops home?" value={v.troopsHome} options={YES_NO} onChange={(x) => set({ troopsHome: x })} />
        <SelectField id="mig-res" label="Are your resources within storehouse protection?" value={v.resourcesProtected} options={YES_NO} onChange={(x) => set({ resourcesProtected: x })} />
        <SelectField id="mig-cd" label="Is a migration cooldown active?" value={v.cooldownActive} options={YES_NO} onChange={(x) => set({ cooldownActive: x })} />
        <NumberField id="mig-char-age" label="Character age (days)" optional value={v.characterAgeDays} max={100000} onChange={(x) => set({ characterAgeDays: x })}
          help="Days since you created this character." />
      </form>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Target kingdom">
        <SelectField id="mig-route" label="Route" value={route} options={ROUTES.map((r) => ({ value: r.id, label: r.label }))} onChange={(x) => set({ route: x })} />
        <NumberField id="mig-kd-age" label="Target kingdom age (days)" optional value={v.kingdomAgeDays} max={100000} onChange={(x) => set({ kingdomAgeDays: x })} />
        <NumberField id="mig-cap" label="Target kingdom power cap (millions, optional)" value={v.targetPowerCapM} integer={false} max={10000}
          onChange={(x) => set({ targetPowerCapM: x })} help="Set by the king. 0 = not known." suffix="M" />
        <NumberField id="mig-min" label="Target kingdom minimum power (millions, optional)" value={v.targetMinPowerM} integer={false} max={10000}
          onChange={(x) => set({ targetMinPowerM: x })} help="The kingdom's own intake rule. 0 = none." suffix="M" />
      </form>

      <Results>
        <ResultRow testId="mig-verdict" label="Can you migrate?" value={verdict} cite={all}
          notes={[verdictNote]} />
        <ResultRow testId="mig-pages" label="Passport Pages for your power" value={powerKnown ? pages : "Enter your power"} cite={citeOf(res.passportSource.facts)}
          notes={[
            pp.kind === "exact" ? `Known data point: ${pp.band.toM === null ? `above ${pp.band.fromM}M` : `${pp.band.fromM} to ${pp.band.toM}M`}.` : `Exact table pending: only ${rules.passport.bands.map((b) => (b.toM === null ? `above ${b.fromM}M` : `${b.fromM} to ${b.toM}M`)).join(", ")} are known.`,
            `Checked on: ${res.passportSource.patch}.`,
          ]} />
      </Results>

      <section class="t-section" aria-labelledby="mig-why-h">
        <h2 id="mig-why-h">Every rule</h2>
        <ul class="t-checks" data-testid="mig-checks">
          {res.checks.map((c) => {
            const k = known(c.id);
            const ok = k ? String(c.ok) : "unknown";
            const todo = (NEEDS[c.id] ?? []).filter((x) => missing.includes(x)).map((x) => LABEL[x]).join(" and ");
            return (
            <li key={c.id} data-check={c.id} data-ok={ok}>
              <span class="t-status-tag" data-ok={ok}>{k ? (c.ok ? "Passes" : "Blocks") : "Not checked"}</span>
              <div>
                <span>{k ? c.text : `Fill in ${todo} to check this rule.`}</span>
                <Cite cite={citeOf(c.facts)} />
                <span class="t-patch">Checked on: {c.patch}</span>
              </div>
            </li>
            );
          })}
        </ul>
      </section>

      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
      <div class="t-share">
        <p class="t-note">Migration officer? Send applicants a link that opens this checker with your kingdom's fields filled in.</p>
        <button type="button" class="btn btn-secondary" onClick={() => void copyOfficer()}>Copy applicant link (kingdom fields only)</button>
        <p role="status" class="t-status" data-testid="mig-officer-status">{officerMsg}</p>
      </div>
    </div>
  );
}
