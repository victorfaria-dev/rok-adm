import { useEffect, useRef, useState } from "preact/hooks";
import type { QuestionId, QuestionOption } from "@rokadm/core";
import { DETAIL_QUESTIONS, applyDetails, detailValue } from "../../lib/me";
import { withActiveCode } from "../../lib/accounts";
import { profileFromCode } from "../../lib/profile";
import { readStore, writeStore, type StoreV1 } from "../../lib/store";

// Every user-facing string of this section, in one place (i18n later).
const S = {
  h: "More about your account",
  lead: "Optional. The guide and routine use these when you add them; leave any blank you are not sure about.",
  notChosen: "Not answered",
  yes: "Yes",
  no: "No",
  save: "Save details",
  saved: "Saved.",
  fix: "Fix the fields marked below.",
} as const;

interface Props {
  store: StoreV1;
  onChange: (next: StoreV1) => void;
}

/** UX stage 1: the questions the short onboarding no longer asks, editable here. */
export function ProfileDetails({ store, onChange }: Props) {
  const profile = profileFromCode(store.profileCode);
  const initial = (): Partial<Record<QuestionId, string>> =>
    Object.fromEntries(DETAIL_QUESTIONS.map((q) => [q.id, profile ? detailValue(profile, q.id) : ""]));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<QuestionId, string>>>({});
  const [status, setStatus] = useState("");
  // The profile changed elsewhere (import, account switch, delete): show its answers.
  const shownCode = useRef(store.profileCode);
  useEffect(() => {
    if (store.profileCode === shownCode.current) return;
    shownCode.current = store.profileCode;
    setForm(initial());
    setErrors({});
    setStatus("");
  }, [store.profileCode]);
  if (!profile) return null;

  const set = (id: QuestionId, v: string): void => {
    setForm((f) => ({ ...f, [id]: v }));
    setStatus("");
  };

  const save = (): void => {
    const r = applyDetails(profile, form);
    if (!r.ok) {
      setErrors(r.errors);
      setStatus(S.fix);
      return;
    }
    setErrors({});
    shownCode.current = r.code;
    const next = writeStore({
      ...withActiveCode(readStore(), r.code),
    });
    onChange(next);
    setStatus(S.saved);
  };

  return (
    <section class="me-section" aria-labelledby="me-details-h" data-profile-details>
      <h2 id="me-details-h">{S.h}</h2>
      <p class="me-note">{S.lead}</p>
      <form class="me-details" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        {DETAIL_QUESTIONS.map((q) => {
          const id = `me-d-${q.id}`;
          const err = errors[q.id];
          const describedBy = [`${id}-help`, err ? `${id}-err` : ""].filter(Boolean).join(" ");
          const value = form[q.id] ?? "";
          return (
            <div class="me-field" key={q.id}>
              <label for={id}>{q.label}</label>
              <p class="me-note" id={`${id}-help`}>{q.help}</p>
              {q.type === "number" ? (
                <input id={id} class="me-input mono" type="text" inputMode="numeric" autoComplete="off" value={value}
                  aria-describedby={describedBy} aria-invalid={err ? true : undefined}
                  onInput={(e) => set(q.id, e.currentTarget.value)} />
              ) : (
                <select id={id} class="me-select" value={value} aria-describedby={describedBy} aria-invalid={err ? true : undefined}
                  onChange={(e) => set(q.id, e.currentTarget.value)}>
                  {q.type === "boolean" ? (
                    <>
                      <option value="no">{S.no}</option>
                      <option value="yes">{S.yes}</option>
                    </>
                  ) : (
                    (q.options as ReadonlyArray<QuestionOption<string | null>>).map((o) => (
                      <option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>
                    ))
                  )}
                </select>
              )}
              {err && <p class="me-error" id={`${id}-err`}>{err}</p>}
            </div>
          );
        })}
        <div class="me-actions">
          <button type="submit" class="btn btn-secondary">{S.save}</button>
        </div>
        <p class="me-status" role="status">{status}</p>
      </form>
    </section>
  );
}
