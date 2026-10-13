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
      <h2 id="kx-rules-h">Rules</h2>
      <div class="kg-grid kg-grid-2">
        <TextField id="kx-title" label="Plan name" value={doc.title} maxLength={MGE_LIMITS.title} onValue={(v) => set({ title: v.slice(0, MGE_LIMITS.title) })} hint="For example: KvK3 MGE plan." />
        <SelectField<MgePolicy> id="kx-policy" label="How slots are given" value={doc.policy} options={POLICY_OPTIONS} onValue={(v) => set({ policy: v })} hint={MGE_POLICY_TEXT[doc.policy].text} />
        <NumberField
          id="kx-slots"
          label="Slots per event"
          value={doc.slotsPerEvent}
          min={MGE_LIMITS.slotsMin}
          max={MGE_LIMITS.slotsMax}
          onValue={(n) => set({ slotsPerEvent: n })}
          hint="Set by your council (1 to 20). Some kingdoms publish a top-10 list."
        />
        {doc.policy === "rotation" && (
          <NumberField
            id="kx-cooldown"
            label="Cooldown (events)"
            value={doc.cooldownEvents}
            min={0}
            max={MGE_LIMITS.cooldownMax}
            onValue={(n) => set({ cooldownEvents: n })}
            hint="How many events a governor sits out after getting a slot. 0 means no cooldown."
          />
        )}
      </div>
      <CheckField
        id="kx-apply"
        label="Governors must apply for each event"
        checked={doc.applicationsRequired}
        onValue={(v) => set({ applicationsRequired: v })}
        hint="When ticked, only governors marked as applicants of an event can get a slot in it."
      />
      <details class="kx-details">
        <summary>What each rule means</summary>
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
