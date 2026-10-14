import { useEffect, useRef, useState } from "preact/hooks";
import type { FarmFocus } from "@rokadm/planner";
import { FARM_LEVEL_RANGES, FARM_NAME_MAX, FARM_NOTE_MAX, type Farm, type FarmLevelField, type FarmLevelsState } from "../../../lib/farms-store";
import { FOCUS_LABEL, LEVEL_FIELDS, LEVEL_LABEL, validateFarmForm, type FarmFormErrors, type FarmFormValues } from "../../../lib/farms-hub";

const FOCUSES: readonly FarmFocus[] = ["general", "food", "wood", "stone", "gold"];

export interface FarmFormSubmit {
  name: string;
  role: FarmFocus;
  note: string;
  levels: FarmLevelsState;
}

interface Props {
  /** Farm being edited; absent = new farm. */
  farm?: Farm;
  onSubmit: (v: FarmFormSubmit) => string | null;
  onCancel: () => void;
}

function initial(farm?: Farm): FarmFormValues {
  const levels = {} as Record<FarmLevelField, string>;
  for (const f of LEVEL_FIELDS) levels[f] = farm?.levels[f] != null ? String(farm.levels[f]) : "";
  return { name: farm?.name ?? "", role: farm?.role ?? "general", note: farm?.note ?? "", levels };
}

/** Add / edit a farm. Errors sit under each field (aria-describedby) and focus moves to the first one. */
export default function FarmForm({ farm, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<FarmFormValues>(() => initial(farm));
  const [errors, setErrors] = useState<FarmFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstError = useRef(false);
  const pre = farm ? `ff-${farm.id}` : "ff-new";
  const title = farm ? `Editar ${farm.name}` : "Adicionar uma conta farm";

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>(`#${pre}-name`)?.focus();
  }, []);

  useEffect(() => {
    if (!focusFirstError.current) return;
    focusFirstError.current = false;
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  });

  const submit = (e: Event): void => {
    e.preventDefault();
    const r = validateFarmForm(v);
    setErrors(r.errors);
    if (!r.value) {
      setFormError(null);
      focusFirstError.current = true;
      return;
    }
    setFormError(onSubmit(r.value));
  };

  const describe = (id: string, hint?: string): string | undefined => {
    const ids = [hint, errors[id as keyof FarmFormErrors] ? `${pre}-${id}-err` : undefined].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  };
  const err = (id: keyof FarmFormErrors) =>
    errors[id] ? <p class="fm-error" id={`${pre}-${id}-err`}>{errors[id]}</p> : null;
  const count = Object.keys(errors).length;

  return (
    <form class="fm-card fh-form" ref={formRef} onSubmit={submit} noValidate aria-labelledby={`${pre}-title`}>
      <h3 id={`${pre}-title`}>{title}</h3>
      {count > 0 && <p class="fm-error" role="alert">Corrija {count === 1 ? "1 campo" : `${count} campos`} abaixo.</p>}
      {formError && <p class="fm-error" role="alert">{formError}</p>}

      <div class="fm-field">
        <label for={`${pre}-name`}>Nome</label>
        <p class="fm-hint" id={`${pre}-name-hint`}>Obrigatório, até {FARM_NAME_MAX} caracteres. Qualquer nome que você use para a conta.</p>
        <input
          id={`${pre}-name`} type="text" autocomplete="off" value={v.name} maxLength={FARM_NAME_MAX}
          aria-invalid={errors.name ? "true" : undefined} aria-describedby={describe("name", `${pre}-name-hint`)}
          onInput={(e) => setV({ ...v, name: (e.target as HTMLInputElement).value })}
        />
        {err("name")}
      </div>

      <fieldset class="fh-fieldset">
        <legend class="fm-label">O que ela mais coleta</legend>
        <div class="fh-radios">
          {FOCUSES.map((f) => (
            <label class="fh-radio" key={f}>
              <input type="radio" name={`${pre}-role`} value={f} checked={v.role === f} onChange={() => setV({ ...v, role: f })} />
              <span>{FOCUS_LABEL[f]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset class="fh-fieldset">
        <legend class="fm-label">Níveis (opcional)</legend>
        <p class="fm-hint">Deixe em branco o que você não sabe. O caminho de construção e o imposto do Entreposto Comercial usam estes valores.</p>
        <div class="fh-levels">
          {LEVEL_FIELDS.map((f) => {
            const [min, max] = FARM_LEVEL_RANGES[f];
            return (
              <div class="fm-field" key={f}>
                <label for={`${pre}-${f}`}>{LEVEL_LABEL[f]}</label>
                <input
                  id={`${pre}-${f}`} type="text" inputMode="numeric" autocomplete="off" value={v.levels[f]}
                  aria-invalid={errors[f] ? "true" : undefined} aria-describedby={describe(f, `${pre}-${f}-hint`)}
                  onInput={(e) => setV({ ...v, levels: { ...v.levels, [f]: (e.target as HTMLInputElement).value } })}
                />
                <p class="fm-hint" id={`${pre}-${f}-hint`}>{min}–{max}</p>
                {err(f)}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div class="fm-field">
        <label for={`${pre}-note`}>Observação (opcional)</label>
        <p class="fm-hint" id={`${pre}-note-hint`}>Até {FARM_NOTE_MAX} caracteres, por exemplo onde ela fica no mapa.</p>
        <textarea
          id={`${pre}-note`} rows={2} value={v.note}
          aria-invalid={errors.note ? "true" : undefined} aria-describedby={describe("note", `${pre}-note-hint`)}
          onInput={(e) => setV({ ...v, note: (e.target as HTMLTextAreaElement).value })}
        />
        {err("note")}
      </div>

      <div class="fm-actions">
        <button type="submit" class="btn btn-primary">{farm ? "Salvar alterações" : "Adicionar conta farm"}</button>
        <button type="button" class="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
