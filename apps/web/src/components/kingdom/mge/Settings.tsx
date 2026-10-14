import { MGE_LIMITS, MGE_POLICIES, MGE_POLICY_TEXT, type MgeDoc, type MgePolicy } from "@rokadm/planner";
import { CheckField, SelectField, TextField } from "../shared/Field";
import NumberField from "./NumberField";

interface Props {
  doc: MgeDoc;
  onChange: (d: MgeDoc) => void;
}

const POLICY_OPTIONS = MGE_POLICIES.map((p) => ({ value: p, label: MGE_POLICY_TEXT[p].label }));

/** Plan name and the rules the ledger follows. */
export default function Settings({ doc, onChange }: Props) {
  const set = (patch: Partial<MgeDoc>) => onChange({ ...doc, ...patch });
  return (
    <section class="kg-grid" aria-labelledby="kx-rules-h">
      <h2 id="kx-rules-h">Regras</h2>
      <div class="kg-grid kg-grid-2">
        <TextField id="kx-title" label="Nome do plano" value={doc.title} maxLength={MGE_LIMITS.title} onValue={(v) => set({ title: v.slice(0, MGE_LIMITS.title) })} hint="Por exemplo: plano de MGE do KvK3." />
        <SelectField<MgePolicy> id="kx-policy" label="Como as vagas são dadas" value={doc.policy} options={POLICY_OPTIONS} onValue={(v) => set({ policy: v })} hint={MGE_POLICY_TEXT[doc.policy].text} />
        <NumberField
          id="kx-slots"
          label="Vagas por evento"
          value={doc.slotsPerEvent}
          min={MGE_LIMITS.slotsMin}
          max={MGE_LIMITS.slotsMax}
          onValue={(n) => set({ slotsPerEvent: n })}
          hint="Definido pelo seu conselho (1 a 20). Alguns reinos publicam uma lista top 10."
        />
        {doc.policy === "rotation" && (
          <NumberField
            id="kx-cooldown"
            label="Intervalo de descanso (eventos)"
            value={doc.cooldownEvents}
            min={0}
            max={MGE_LIMITS.cooldownMax}
            onValue={(n) => set({ cooldownEvents: n })}
            hint="Quantos eventos um governador fica de fora depois de receber uma vaga. 0 significa sem descanso."
          />
        )}
      </div>
      <CheckField
        id="kx-apply"
        label="Os governadores precisam se candidatar a cada evento"
        checked={doc.applicationsRequired}
        onValue={(v) => set({ applicationsRequired: v })}
        hint="Quando marcado, só governadores marcados como candidatos de um evento podem receber vaga nele."
      />
      <details class="kx-details">
        <summary>O que cada regra significa</summary>
        <dl class="kx-dl">
          {MGE_POLICIES.map((p) => (
            <div key={p}>
              <dt>{MGE_POLICY_TEXT[p].label}</dt>
              <dd>{MGE_POLICY_TEXT[p].text}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
