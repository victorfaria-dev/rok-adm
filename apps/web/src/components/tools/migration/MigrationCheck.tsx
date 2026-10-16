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

const YES_NO: readonly { value: string; label: string }[] = [{ value: "", label: "Escolha uma resposta" }, { value: "no", label: "Não" }, { value: "yes", label: "Sim" }];
const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Keys a migration officer pre-fills for applicants (F-31 c). */
export const KINGDOM_KEYS = ["route", "kingdomAgeDays", "targetPowerCapM", "targetMinPowerM"] as const;

/** Every field starts empty: nothing is checked until the user answers (no "Eligible" for made-up values). */
export const MIGRATION_DEFAULTS = {
  cityHall: EMPTY_NUMBER, powerM: EMPTY_NUMBER, inAlliance: "", troopsHome: "", resourcesProtected: "", cooldownActive: "",
  characterAgeDays: EMPTY_NUMBER, kingdomAgeDays: EMPTY_NUMBER, route: "same-soc", targetPowerCapM: 0, targetMinPowerM: 0,
};
type Answers = typeof MIGRATION_DEFAULTS;

/** Inputs each rule reads; a rule is "Não verificado" while any of them is empty. */
const NEEDS: Record<string, readonly (keyof Answers)[]> = {
  ch: ["cityHall"], alliance: ["inAlliance"], troops: ["troopsHome"], resources: ["resourcesProtected"], cooldown: ["cooldownActive"],
  age: ["characterAgeDays", "kingdomAgeDays"], "cross-power": ["powerM"], cap: ["powerM"], "kingdom-min": ["powerM"],
};
const LABEL: Record<string, string> = {
  cityHall: "nível da Prefeitura", powerM: "poder", inAlliance: "aliança", troopsHome: "tropas em casa", resourcesProtected: "recursos protegidos",
  cooldownActive: "período de espera", characterAgeDays: "idade do personagem", kingdomAgeDays: "idade do reino de destino",
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
  const verdict = knownBlockers.length > 0 ? "Não elegível" : missing.length > 0 ? "Ainda não verificado" : "Elegível";
  const verdictNote = knownBlockers.length > 0
    ? `${knownBlockers.length === 1 ? "1 regra bloqueia" : `${knownBlockers.length} regras bloqueiam`} a mudança.${missing.length ? ` ${missing.length === 1 ? "1 resposta ainda em branco" : `${missing.length} respostas ainda em branco`}.` : ""}`
    : missing.length > 0
      ? `Responda mais ${missing.length === 1 ? "1 pergunta" : `${missing.length} perguntas`} acima: ${missing.map((k) => LABEL[k]).join(", ")}.`
      : "Todas as regras abaixo passam.";
  const powerKnown = v.powerM >= 0;
  const pp = res.passport;
  const pages = pp.kind === "exact" ? `${fmt(pp.pages)} ${pp.pages === 1 ? "página" : "páginas"}` : `Entre ${fmt(pp.low)} e ${fmt(pp.high)} páginas`;

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
      setOfficerMsg("Link para candidatos copiado. Ele preenche a rota, a idade, o limite de poder e o mínimo do seu reino; os candidatos preenchem a própria conta.");
    } catch {
      setOfficerMsg(`Copie este link: ${url}`);
    }
  };

  return (
    <div class="t-page-body" data-tool="migration">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Sua conta">
        <NumberField id="mig-ch" label="Nível da Prefeitura" optional value={v.cityHall} min={1} max={25} onChange={(x) => set({ cityHall: x })} />
        <NumberField id="mig-power" label="Poder exibido (milhões)" optional value={v.powerM} integer={false} max={10000} onChange={(x) => set({ powerM: x })}
          help="O poder do seu perfil, por exemplo 12.5 para 12.5M." suffix="M" />
        <SelectField id="mig-alliance" label="Você está em uma aliança?" value={v.inAlliance} options={YES_NO} onChange={(x) => set({ inAlliance: x })} />
        <SelectField id="mig-troops" label="Todas as suas tropas estão em casa?" value={v.troopsHome} options={YES_NO} onChange={(x) => set({ troopsHome: x })} />
        <SelectField id="mig-res" label="Seus recursos estão dentro da proteção do Depósito?" value={v.resourcesProtected} options={YES_NO} onChange={(x) => set({ resourcesProtected: x })} />
        <SelectField id="mig-cd" label="Há um período de espera de migração ativo?" value={v.cooldownActive} options={YES_NO} onChange={(x) => set({ cooldownActive: x })} />
        <NumberField id="mig-char-age" label="Idade do personagem (dias)" optional value={v.characterAgeDays} max={100000} onChange={(x) => set({ characterAgeDays: x })}
          help="Dias desde que você criou este personagem." />
      </form>
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Reino de destino">
        <SelectField id="mig-route" label="Rota" value={route} options={ROUTES.map((r) => ({ value: r.id, label: r.label }))} onChange={(x) => set({ route: x })} />
        <NumberField id="mig-kd-age" label="Idade do reino de destino (dias)" optional value={v.kingdomAgeDays} max={100000} onChange={(x) => set({ kingdomAgeDays: x })} />
        <NumberField id="mig-cap" label="Limite de poder do reino de destino (milhões, opcional)" value={v.targetPowerCapM} integer={false} max={10000}
          onChange={(x) => set({ targetPowerCapM: x })} help="Definido pelo rei. 0 = desconhecido." suffix="M" />
        <NumberField id="mig-min" label="Poder mínimo do reino de destino (milhões, opcional)" value={v.targetMinPowerM} integer={false} max={10000}
          onChange={(x) => set({ targetMinPowerM: x })} help="A regra de entrada do próprio reino. 0 = nenhuma." suffix="M" />
      </form>

      <Results>
        <ResultRow testId="mig-verdict" label="Você pode migrar?" value={verdict} cite={all}
          notes={[verdictNote]} />
        <ResultRow testId="mig-pages" label="Páginas de Passaporte para o seu poder" value={powerKnown ? pages : "Digite o seu poder"} cite={citeOf(res.passportSource.facts)}
          notes={[
            pp.kind === "exact" ? `Dado conhecido: ${pp.band.toM === null ? `acima de ${pp.band.fromM}M` : `${pp.band.fromM} a ${pp.band.toM}M`}.` : `Tabela exata pendente: só se conhecem ${rules.passport.bands.map((b) => (b.toM === null ? `acima de ${b.fromM}M` : `${b.fromM} a ${b.toM}M`)).join(", ")}.`,
            `Conferido em: ${res.passportSource.patch}.`,
          ]} />
      </Results>

      <section class="t-section" aria-labelledby="mig-why-h">
        <h2 id="mig-why-h">Todas as regras</h2>
        <ul class="t-checks" data-testid="mig-checks">
          {res.checks.map((c) => {
            const k = known(c.id);
            const ok = k ? String(c.ok) : "unknown";
            const todo = (NEEDS[c.id] ?? []).filter((x) => missing.includes(x)).map((x) => LABEL[x]).join(" e ");
            return (
            <li key={c.id} data-check={c.id} data-ok={ok}>
              <span class="t-status-tag" data-ok={ok}>{k ? (c.ok ? "Passa" : "Bloqueia") : "Não verificado"}</span>
              <div>
                <span>{k ? c.text : `Preencha ${todo} para verificar esta regra.`}</span>
                <Cite cite={citeOf(c.facts)} />
                <span class="t-patch">Conferido em: {c.patch}</span>
              </div>
            </li>
            );
          })}
        </ul>
      </section>

      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
      <div class="t-share">
        <p class="t-note">É oficial de migração? Envie aos candidatos um link que abre este verificador com os campos do seu reino já preenchidos.</p>
        <button type="button" class="btn btn-secondary" onClick={() => void copyOfficer()}>Copiar link para candidatos (só os campos do reino)</button>
        <p role="status" class="t-status" data-testid="mig-officer-status">{officerMsg}</p>
      </div>
    </div>
  );
}
