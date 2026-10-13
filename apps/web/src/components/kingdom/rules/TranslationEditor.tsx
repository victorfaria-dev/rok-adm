import {
  RULES_LIMITS, TRANSLATION_NOTE, cleanLangCode, hasPrompts, isLangCode, resolveRules, rulesDisplayTitle, setTranslatedSection, translationName,
  type RulesDoc, type RulesTranslation,
} from "@rokadm/planner";
import ConfirmAction from "../shared/ConfirmAction";
import { TextAreaField, TextField } from "../shared/Field";

const BODY_HINT = "Same markup as the original: blank line = new paragraph, \"- \" bullet, \"1. \" numbered.";
export const LANG_CODE_HINT = "Optional, so screen readers and translators know the language: es, pt-BR, ru, uk, ar, zh-Hant…";
export const LANG_CODE_ERROR = "Use a short language code such as es, pt-BR or zh-Hant (letters, numbers and hyphens). It is ignored until it is fixed.";

export const langCodeError = (code: string): string | undefined => (code.trim() && !isLangCode(code.trim()) ? LANG_CODE_ERROR : undefined);

/** Original text shown next to its translation (read-only, as text). */
function Original({ label, text, lang, heading }: { label: string; text: string; lang: string | undefined; heading?: boolean }) {
  return (
    <div class="kq-orig">
      <p class="kq-orig-label">{label}</p>
      {text
        ? <p class={heading ? "kq-orig-text kq-orig-h" : "kq-orig-text"} lang={lang}>{text}</p>
        : <p class="kq-orig-text kq-orig-empty">(empty in the original)</p>}
    </div>
  );
}

interface Props {
  doc: RulesDoc;
  t: RulesTranslation;
  index: number;
  onChange: (next: RulesTranslation) => void;
  onRemove: () => void;
}

/**
 * Edit one language version next to the original: side by side from 768px, stacked below. The
 * council writes every word; KingdomOps never translates.
 */
export default function TranslationEditor({ doc, t, index, onChange, onRemove }: Props) {
  const name = translationName(t, index);
  const v = resolveRules(doc, t.id);
  const total = doc.sections.length + (doc.intro ? 1 : 0);
  const origLang = cleanLangCode(doc.originalLang) || undefined;
  const byId = new Map(t.sections.map((s) => [s.id, s]));
  const prompts = [t.title, t.intro, ...t.sections.flatMap((s) => [s.heading, s.body])].some(hasPrompts);
  const set = (patch: Partial<RulesTranslation>) => onChange({ ...t, ...patch });

  return (
    <section class="kq-group" aria-labelledby="kq-tr-h" data-translation-editor>
      <h2 id="kq-tr-h" tabIndex={-1}>Translation: {name}</h2>
      <p class="kg-note">Readers see "{TRANSLATION_NOTE}" at the top of this version. Parts you leave empty are shown in the original with a "Not translated yet" note.</p>
      <p class="kg-note" data-untranslated-count>
        {v.untranslated === 0 ? "Every part is translated." : `${v.untranslated} of ${total} parts not translated yet.`}
      </p>
      {prompts && <p class="kq-prompt" data-prompts-left-lang>This translation still has [bracketed] prompts. Replace them before you share.</p>}

      <div class="kg-grid kg-grid-2">
        <TextField id="kq-t-label" label="Language name" hint="As its readers write it, for example Español or Русский." value={t.label} maxLength={RULES_LIMITS.langLabel} onValue={(label) => set({ label })} />
        <TextField id="kq-t-lang" label="Language code (optional)" hint={LANG_CODE_HINT} value={t.lang} error={langCodeError(t.lang)} maxLength={RULES_LIMITS.langCode} onValue={(lang) => set({ lang })} />
      </div>

      <div class="kq-pair">
        <Original label="Original title" text={rulesDisplayTitle(doc)} lang={origLang} heading />
        <TextField id="kq-t-title" label="Translated title" value={t.title} maxLength={RULES_LIMITS.title} onValue={(title) => set({ title })} />
      </div>
      {doc.intro && (
        <div class="kq-pair">
          <Original label="Original introduction" text={doc.intro} lang={origLang} />
          <TextAreaField id="kq-t-intro" label="Translated introduction" hint={BODY_HINT} rows={4} value={t.intro} maxLength={RULES_LIMITS.intro} onValue={(intro) => set({ intro })} />
        </div>
      )}

      {doc.sections.length === 0
        ? <p class="kg-note">The original has no sections yet. Add them in the original first; each one then gets a place for its translation here.</p>
        : (
          <ol class="kq-sections">
            {doc.sections.map((s, i) => {
              const tr = byId.get(s.id);
              const missing = v.sections[i]?.fallback ?? true;
              return (
                <li key={s.id} class="kq-sec-edit" data-tr-section>
                  <p class="kq-sec-num">Section {i + 1} of {doc.sections.length}{missing ? " · not translated yet" : ""}</p>
                  <div class="kq-pair">
                    <div class="kg-grid">
                      <Original label="Original heading" text={s.heading} lang={origLang} heading />
                      <Original label="Original text" text={s.body} lang={origLang} />
                    </div>
                    <div class="kg-grid">
                      <TextField id={`kq-th-${s.id}`} label={`Translated heading, section ${i + 1}`} value={tr?.heading ?? ""} maxLength={RULES_LIMITS.heading}
                        onValue={(heading) => onChange(setTranslatedSection(t, s.id, { heading }))} />
                      <TextAreaField id={`kq-tb-${s.id}`} label={`Translated text, section ${i + 1}`} hint={BODY_HINT} rows={8} value={tr?.body ?? ""} maxLength={RULES_LIMITS.body}
                        onValue={(body) => onChange(setTranslatedSection(t, s.id, { body }))} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

      <div class="kg-actions">
        <ConfirmAction label="Remove this language" ariaLabel={`Remove the ${name} version`} yesLabel="Yes, remove"
          question={`Remove the ${name} version? Its translated text is deleted from this page. Links you already shared keep it.`} onConfirm={onRemove} />
      </div>
    </section>
  );
}
