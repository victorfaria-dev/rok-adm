import {
  RULES_LIMITS, TRANSLATION_NOTE, cleanLangCode, hasPrompts, isLangCode, resolveRules, rulesDisplayTitle, setTranslatedSection, translationName,
  type RulesDoc, type RulesTranslation,
} from "@rokadm/planner";
import ConfirmAction from "../shared/ConfirmAction";
import { TextAreaField, TextField } from "../shared/Field";

const BODY_HINT = "Mesma marcação do original: linha em branco = novo parágrafo, \"- \" marcador, \"1. \" numerada.";
export const LANG_CODE_HINT = "Opcional, para leitores de tela e tradutores saberem o idioma: es, pt-BR, ru, uk, ar, zh-Hant…";
export const LANG_CODE_ERROR = "Use o código curto de um idioma real, como es, pt-BR ou zh-Hant (duas letras quando existir: es, não spa). Ele é ignorado até ser corrigido.";

export const langCodeError = (code: string): string | undefined => (code.trim() && !isLangCode(code.trim()) ? LANG_CODE_ERROR : undefined);

/** Original text shown next to its translation (read-only, as text). */
function Original({ label, text, lang, heading }: { label: string; text: string; lang: string | undefined; heading?: boolean }) {
  return (
    <div class="kq-orig">
      <p class="kq-orig-label">{label}</p>
      {text
        ? <p class={heading ? "kq-orig-text kq-orig-h" : "kq-orig-text"} lang={lang}>{text}</p>
        : <p class="kq-orig-text kq-orig-empty">(vazio no original)</p>}
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
      <h2 id="kq-tr-h" tabIndex={-1}>Tradução: {name}</h2>
      <p class="kg-note">Os leitores veem "{TRANSLATION_NOTE}" no topo desta versão. As partes que você deixar vazias aparecem no original, com uma nota "Ainda não traduzido".</p>
      <p class="kg-note" data-untranslated-count>
        {v.untranslated === 0 ? "Todas as partes estão traduzidas." : `${v.untranslated} de ${total} partes ainda não traduzidas.`}
      </p>
      {prompts && <p class="kq-prompt" data-prompts-left-lang>Esta tradução ainda tem sugestões [entre colchetes]. Substitua-as antes de compartilhar.</p>}

      <div class="kg-grid kg-grid-2">
        <TextField id="kq-t-label" label="Nome do idioma" hint="Como os leitores o escrevem, por exemplo Español ou Русский." value={t.label} maxLength={RULES_LIMITS.langLabel} onValue={(label) => set({ label })} />
        <TextField id="kq-t-lang" label="Código do idioma (opcional)" hint={LANG_CODE_HINT} value={t.lang} error={langCodeError(t.lang)} maxLength={RULES_LIMITS.langCode} onValue={(lang) => set({ lang })} />
      </div>

      <div class="kq-pair">
        <Original label="Título original" text={rulesDisplayTitle(doc)} lang={origLang} heading />
        <TextField id="kq-t-title" label="Título traduzido" value={t.title} maxLength={RULES_LIMITS.title} onValue={(title) => set({ title })} />
      </div>
      {doc.intro && (
        <div class="kq-pair">
          <Original label="Introdução original" text={doc.intro} lang={origLang} />
          <TextAreaField id="kq-t-intro" label="Introdução traduzida" hint={BODY_HINT} rows={4} value={t.intro} maxLength={RULES_LIMITS.intro} onValue={(intro) => set({ intro })} />
        </div>
      )}

      {doc.sections.length === 0
        ? <p class="kg-note">O original ainda não tem seções. Adicione-as primeiro no original; cada uma ganha aqui um lugar para a tradução.</p>
        : (
          <ol class="kq-sections">
            {doc.sections.map((s, i) => {
              const tr = byId.get(s.id);
              const missing = v.sections[i]?.fallback ?? true;
              return (
                <li key={s.id} class="kq-sec-edit" data-tr-section>
                  <p class="kq-sec-num">Seção {i + 1} de {doc.sections.length}{missing ? " · ainda não traduzida" : ""}</p>
                  <div class="kq-pair">
                    <div class="kg-grid">
                      <Original label="Título da seção original" text={s.heading} lang={origLang} heading />
                      <Original label="Texto original" text={s.body} lang={origLang} />
                    </div>
                    <div class="kg-grid">
                      <TextField id={`kq-th-${s.id}`} label={`Título traduzido, seção ${i + 1}`} value={tr?.heading ?? ""} maxLength={RULES_LIMITS.heading}
                        onValue={(heading) => onChange(setTranslatedSection(t, s.id, { heading }))} />
                      <TextAreaField id={`kq-tb-${s.id}`} label={`Texto traduzido, seção ${i + 1}`} hint={BODY_HINT} rows={8} value={tr?.body ?? ""} maxLength={RULES_LIMITS.body}
                        onValue={(body) => onChange(setTranslatedSection(t, s.id, { body }))} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

      <div class="kg-actions">
        <ConfirmAction label="Remover este idioma" ariaLabel={`Remover a versão ${name}`} yesLabel="Sim, remover"
          question={`Remover a versão ${name}? O texto traduzido é apagado desta página. Os links que você já compartilhou o mantêm.`} onConfirm={onRemove} />
      </div>
    </section>
  );
}
