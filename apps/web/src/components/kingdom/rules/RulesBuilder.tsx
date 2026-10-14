import { useEffect, useRef, useState } from "preact/hooks";
import {
  MAX_SHARE_CHARS, ORIGINAL_KEY, RULES_LIMITS, RULES_TEMPLATES, emptyRulesDoc, emptyTranslation, hasPrompts, moveSection, newCharterDoc, newDocId,
  originalName, parseSigners, pruneTranslations, rulesDisplayTitle, rulesToPlainText, rulesVersions, sectionFromTemplate, translationName,
  versionsWithPrompts, type RulesDoc, type RulesSection, type RulesTranslation,
} from "@rokadm/planner";
import ConfirmAction from "../shared/ConfirmAction";
import CopyText from "../shared/CopyText";
import { SelectField, TextAreaField, TextField } from "../shared/Field";
import { downloadText, kingdomStorage, removeDoc, type StorageLike } from "../../../lib/kingdom-store";
import { linkLengthHint } from "../../../lib/kingdom-share";
import { rulesLinkMessage } from "../../../lib/discord";
import DiscordPost from "../../discord/DiscordPost";
import { RULES_BUILDER_PATH, docFromSearch, formatDay, listRules, rulesShareLink, saveRules, type RulesListItem } from "../../../lib/kingdom-rules";
import RulesView from "./RulesView";
import TranslationEditor, { LANG_CODE_HINT, langCodeError } from "./TranslationEditor";

/** Value of the "language to include" select that means "original only". */
const ONLY_ORIGINAL = "__original";
const isTooLarge = (e: unknown): e is Error & { chars: number } => e instanceof Error && e.name === "ShareTooLargeError";

const SAVE_DELAY = 600;
const BODY_HINT = "Linha em branco = novo parágrafo. Comece a linha com \"- \" para um marcador ou \"1. \" para uma lista numerada.";
const ADD_OPTIONS = [
  { value: "blank", label: "Seção em branco" },
  ...RULES_TEMPLATES.map((t) => ({ value: t.key, label: `Modelo: ${t.heading}` })),
];

function DateField({ id, label, value, hint, onValue }: { id: string; label: string; value: string | null; hint?: string; onValue: (v: string | null) => void }) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div class="kg-field kq-date">
      <label for={id}>{label}</label>
      {hint && <p id={hintId} class="kg-hint">{hint}</p>}
      <input id={id} type="date" value={value ?? ""} aria-describedby={hintId} onInput={(e) => onValue((e.currentTarget as HTMLInputElement).value || null)} />
    </div>
  );
}

const sectionName = (s: RulesSection, i: number): string => (s.heading.trim() ? `"${s.heading.trim()}"` : `seção ${i + 1}`);

/** Rules page and charter builder (F-33): saved list, editor with autosave, preview, view-only link. */
export default function RulesBuilder() {
  const stRef = useRef<StorageLike | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [list, setList] = useState<RulesListItem[]>([]);
  const [doc, setDoc] = useState<RulesDoc | null>(null);
  const [signersText, setSignersText] = useState("");
  const [addKey, setAddKey] = useState("blank");
  const [preview, setPreview] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  /** Version being edited: ORIGINAL_KEY or a translation id. */
  const [editKey, setEditKey] = useState(ORIGINAL_KEY);
  /** Set when the link with every language is too long: its length, and the version picked for a shorter link. */
  const [tooLarge, setTooLarge] = useState<number | null>(null);
  const [onlyKey, setOnlyKey] = useState(ONLY_ORIGINAL);
  /** Names in a shorter link (null = the link carries every version). */
  const [linkParts, setLinkParts] = useState<string[] | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const dirty = useRef(false);
  const latest = useRef<RulesDoc | null>(null);
  const focusId = useRef<string | null>(null);
  const editorHead = useRef<HTMLHeadingElement>(null);
  const listHead = useRef<HTMLHeadingElement>(null);
  latest.current = doc;

  const refresh = () => setList(listRules(stRef.current));

  function setUrl(id: string | null) {
    try {
      history.replaceState(null, "", id ? `${RULES_BUILDER_PATH}?doc=${encodeURIComponent(id)}` : RULES_BUILDER_PATH);
    } catch {
      // ignore (sandboxed frames)
    }
  }

  function show(d: RulesDoc) {
    setDoc(d);
    setSignersText(d.charter.signers.join("\n"));
    setPreview(false);
    setLink(null);
    setTooLarge(null);
    setEditKey(ORIGINAL_KEY);
    setUrl(d.id);
    focusId.current = "editor";
  }

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    stRef.current = st;
    setBlocked(blocked);
    const items = listRules(st);
    setList(items);
    const id = docFromSearch(location.search);
    if (id) {
      const found = items.find((i) => i.id === id);
      if (found) {
        setDoc(found.doc);
        setSignersText(found.doc.charter.signers.join("\n"));
      } else setError("Essa página de regras não está salva neste aparelho. Abra uma da lista ou comece uma nova.");
    }
    setReady(true);
  }, []);

  function flush(): boolean {
    const d = latest.current;
    if (!d || !dirty.current) return true;
    try {
      saveRules(d, stRef.current);
      dirty.current = false;
      setError("");
      setStatus(blocked ? "Salvo só para esta visita (este navegador bloqueia o salvamento)." : "Todas as alterações foram salvas neste aparelho.");
      refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar suas alterações.");
      return false;
    }
  }

  // Debounced autosave after each edit.
  useEffect(() => {
    if (!doc || !dirty.current) return;
    const t = setTimeout(flush, SAVE_DELAY);
    return () => clearTimeout(t);
  }, [doc]);

  // Save pending edits when the page is hidden or closed.
  useEffect(() => {
    const onHide = () => void flush();
    addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [blocked]);

  // Move focus after opening a document or adding a section.
  useEffect(() => {
    const f = focusId.current;
    if (!f) return;
    // Effects run after paint and read the ref then: when the target is not rendered yet (an async
    // handler set focusId after this render), keep it for the next render.
    const el = f === "editor" ? editorHead.current : f === "list" ? listHead.current : document.getElementById(f);
    if (!el) return;
    focusId.current = null;
    el.focus();
  });

  function update(fn: (d: RulesDoc) => RulesDoc) {
    const d = latest.current;
    if (!d) return;
    const next = fn(d);
    latest.current = next;
    dirty.current = true;
    setDoc(next);
    setLink(null);
    setTooLarge(null);
  }

  function addLanguage() {
    if (!doc || doc.translations.length >= RULES_LIMITS.translations) return;
    const t = emptyTranslation(newDocId());
    update((d) => ({ ...d, translations: [...d.translations, t] }));
    setEditKey(t.id);
    setPreview(false);
    focusId.current = "kq-t-label";
  }

  function removeLanguage(id: string) {
    update((d) => ({ ...d, translations: d.translations.filter((t) => t.id !== id) }));
    setEditKey(ORIGINAL_KEY);
    setStatus("Idioma removido desta página.");
    focusId.current = "kq-langs-h";
  }

  const setTranslation = (next: RulesTranslation) =>
    update((d) => ({ ...d, translations: d.translations.map((t) => (t.id === next.id ? next : t)) }));

  function create(kind: "blank" | "charter") {
    const id = newDocId();
    const d = kind === "charter" ? newCharterDoc(id, new Date(), () => newDocId()) : emptyRulesDoc(id);
    try {
      saveRules(d, stRef.current);
      refresh();
      setError("");
      setStatus(kind === "charter" ? "Nova carta iniciada a partir das seções-modelo." : "Nova página de regras iniciada.");
      show(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível começar uma nova página de regras.");
    }
  }

  function backToList() {
    if (!flush()) return;
    setDoc(null);
    setUrl(null);
    setPreview(false);
    focusId.current = "list";
  }

  function remove(id: string) {
    removeDoc(id, stRef.current);
    refresh();
    setStatus("Página de regras apagada deste aparelho.");
    if (doc?.id === id) {
      dirty.current = false;
      setDoc(null);
      setUrl(null);
    }
    focusId.current = "list";
  }

  function addSection() {
    if (!doc || doc.sections.length >= RULES_LIMITS.sections) return;
    const id = newDocId();
    const s = addKey === "blank" ? { id, heading: "", body: "" } : sectionFromTemplate(addKey, id);
    if (!s) return;
    update((d) => ({ ...d, sections: [...d.sections, s] }));
    focusId.current = `kq-h-${id}`;
  }

  const setSection = (id: string, patch: Partial<RulesSection>) =>
    update((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  async function makeLink() {
    if (!doc) return;
    flush();
    setLinkBusy(true);
    setTooLarge(null);
    try {
      setLink(await rulesShareLink(doc));
      setLinkParts(null);
      setError("");
    } catch (e) {
      // Offer "original + one language" only when the original alone would fit in a link.
      const originalFits = isTooLarge(e) && doc.translations.length > 0
        ? await rulesShareLink(doc, undefined, null).then(() => true, () => false)
        : false;
      if (originalFits && isTooLarge(e)) {
        // Every language together is too long: offer the original plus one language instead.
        setLink(null);
        setTooLarge(e.chars);
        setOnlyKey(editKey !== ORIGINAL_KEY && doc.translations.some((t) => t.id === editKey) ? editKey : doc.translations[0]!.id);
        focusId.current = "kq-only";
      } else {
        setError(isTooLarge(e)
          ? `${e.message} Use "Baixar como texto" ou imprima em PDF para a versão completa.`
          : "Não foi possível gerar o link neste navegador.");
      }
    } finally {
      setLinkBusy(false);
    }
  }

  async function makeShortLink() {
    if (!doc) return;
    const only = onlyKey === ONLY_ORIGINAL ? null : onlyKey;
    setLinkBusy(true);
    try {
      setLink(await rulesShareLink(doc, undefined, only));
      const idx = doc.translations.findIndex((t) => t.id === only);
      setLinkParts([`${originalName(doc)} (original)`, ...(idx >= 0 ? [translationName(doc.translations[idx]!, idx)] : [])]);
      setTooLarge(null);
      setError("");
    } catch (e) {
      setError(isTooLarge(e)
        ? `${e.message} Encurte as seções mais longas, ou use "Baixar como texto" ou imprima em PDF.`
        : "Não foi possível gerar o link neste navegador.");
    } finally {
      setLinkBusy(false);
    }
  }

  function downloadTxt() {
    if (!doc) return;
    const name = (rulesDisplayTitle(doc).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "regras").slice(0, 60);
    downloadText(`${name}.txt`, rulesToPlainText(doc, { all: true }), "text/plain;charset=utf-8");
    setStatus("Arquivo de texto pronto: confira seus downloads.");
  }

  const statusLine = (
    <>
      {error && <p class="kg-error" role="alert">{error}</p>}
      <p class="kg-status" role="status" aria-live="polite" data-save-status>{status}</p>
    </>
  );

  if (!ready) return <p class="kg-note">Carregando suas páginas de regras…</p>;

  if (!doc) {
    return (
      <div class="kg-grid" data-rules-list>
        {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Seu trabalho dura até você fechar esta página; baixe como texto ou compartilhe um link para guardá-lo.</p>}
        <section class="kg-grid" aria-labelledby="kq-list-h">
          <h2 id="kq-list-h" ref={listHead} tabIndex={-1}>Suas páginas de regras</h2>
          {list.length === 0
            ? <p class="kg-note">Nenhuma página de regras salva neste aparelho ainda.</p>
            : (
              <ul class="kq-list">
                {list.map((item) => (
                  <li key={item.id} data-rules-item>
                    <span class="kq-list-title">{item.title}</span>
                    <span class="kq-list-meta">Editada em {formatDay(item.updatedAt.slice(0, 10))}</span>
                    <div class="kg-actions">
                      <button type="button" class="btn btn-secondary" aria-label={`Abrir ${item.title}`} onClick={() => show(item.doc)}>Abrir</button>
                      <ConfirmAction label="Apagar" ariaLabel={`Apagar ${item.title}`} question={`Apagar "${item.title}" deste aparelho? Os links que você já compartilhou continuam funcionando.`} onConfirm={() => remove(item.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          <div class="kg-actions">
            <button type="button" class="btn btn-primary" onClick={() => create("charter")} data-new-charter>Nova carta do reino</button>
            <button type="button" class="btn btn-secondary" onClick={() => create("blank")} data-new-blank>Nova página de regras em branco</button>
          </div>
          <p class="kg-note">Uma carta nova começa com sete seções (liderança, decisões, KvK e DKP, MGE, migração, avisos, idiomas) escritas como sugestões [entre colchetes] para o seu conselho substituir.</p>
        </section>
        {statusLine}
      </div>
    );
  }

  const title = rulesDisplayTitle(doc);
  const withPrompts = versionsWithPrompts(doc);
  const long = link ? linkLengthHint(link) === "long" : false;
  const versions = rulesVersions(doc);
  const editIdx = doc.translations.findIndex((t) => t.id === editKey);
  const editing = editIdx >= 0 ? doc.translations[editIdx]! : null;
  const onlyOptions = [
    { value: ONLY_ORIGINAL, label: `Só ${originalName(doc)} (original)` },
    ...doc.translations.map((t, i) => ({ value: t.id, label: `${originalName(doc)} (original) + ${translationName(t, i)}` })),
  ];

  const languages = (
    <section class="kq-group" aria-labelledby="kq-langs-h" data-languages>
      <h2 id="kq-langs-h" tabIndex={-1}>Idiomas</h2>
      <p class="kg-note">Seu conselho pode escrever estas regras em até mais {RULES_LIMITS.translations} idiomas. O KingdomOps nunca traduz por máquina: cada palavra é sua, e cada tradução avisa os leitores de que o original prevalece.</p>
      {doc.translations.length > 0 && (
        <div class="kq-langs" role="group" aria-labelledby="kq-edit-version-label">
          <p id="kq-edit-version-label" class="kg-label">Versão para editar{preview ? " e visualizar" : ""}</p>
          <div class="kg-actions">
            {versions.map((v) => (
              <button key={v.key} type="button" class="btn btn-secondary" aria-pressed={v.key === (editing ? editKey : ORIGINAL_KEY)}
                onClick={() => setEditKey(v.key)} data-edit-version={v.key}>
                <span lang={v.lang || undefined}>{v.name}</span>{v.isOriginal ? " (original)" : v.untranslated ? ` · ${v.untranslated} a traduzir` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {doc.translations.length < RULES_LIMITS.translations
        ? <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={addLanguage} data-add-language>Adicionar um idioma</button></div>
        : <p class="kg-note">Esta página tem o máximo de {RULES_LIMITS.translations} idiomas extras.</p>}
    </section>
  );

  return (
    <div class="kq-editor" data-rules-editor>
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Seu trabalho dura até você fechar esta página; baixe como texto ou compartilhe um link para guardá-lo.</p>}
      <div class="kg-grid">
        <h2 ref={editorHead} tabIndex={-1} data-editor-title>Editando: {title}</h2>
        <div class="kg-actions">
          <button type="button" class="btn btn-secondary" onClick={backToList}>Todas as páginas de regras</button>
          <button type="button" class="btn btn-secondary" aria-pressed={preview} onClick={() => setPreview(!preview)} data-preview-toggle>Visualizar</button>
        </div>
        {statusLine}
      </div>

      {languages}

      {preview ? (
        <section class="kq-preview" aria-label="Visualização" data-preview>
          <RulesView doc={doc} level={2} version={editing ? editKey : ORIGINAL_KEY} />
        </section>
      ) : editing ? (
        <TranslationEditor doc={doc} t={editing} index={editIdx} onChange={setTranslation} onRemove={() => removeLanguage(editing.id)} />
      ) : (
        <>
          <fieldset class="kq-group">
            <legend>Sobre este documento</legend>
            <TextField id="kq-kingdom" label="Reino" hint="Número ou nome, por exemplo K1234." value={doc.kingdom} maxLength={RULES_LIMITS.kingdom} onValue={(v) => update((d) => ({ ...d, kingdom: v }))} />
            <TextField id="kq-title" label="Título" hint="Por exemplo: Regras do reino 1234." value={doc.title} maxLength={RULES_LIMITS.title} onValue={(v) => update((d) => ({ ...d, title: v }))} />
            <div class="kg-grid kg-grid-2">
              <TextField id="kq-orig-label" label="Idioma do original" hint="Como os leitores o escrevem, por exemplo Português ou English." value={doc.originalLabel} maxLength={RULES_LIMITS.langLabel} onValue={(v) => update((d) => ({ ...d, originalLabel: v }))} />
              <TextField id="kq-orig-lang" label="Código do idioma do original (opcional)" hint={LANG_CODE_HINT} value={doc.originalLang} error={langCodeError(doc.originalLang)} maxLength={RULES_LIMITS.langCode} onValue={(v) => update((d) => ({ ...d, originalLang: v }))} />
            </div>
            <TextField id="kq-lang" label="Nota sobre idiomas" hint="Qual idioma é o original e como as traduções são tratadas." value={doc.languageNote} maxLength={RULES_LIMITS.languageNote} onValue={(v) => update((d) => ({ ...d, languageNote: v }))} />
            <TextAreaField id="kq-intro" label="Introdução" hint={BODY_HINT} rows={4} value={doc.intro} maxLength={RULES_LIMITS.intro} onValue={(v) => update((d) => ({ ...d, intro: v }))} />
          </fieldset>

          <section class="kq-group" aria-labelledby="kq-sections-h">
            <h2 id="kq-sections-h">Seções</h2>
            {doc.sections.length === 0 && <p class="kg-note">Nenhuma seção ainda. Adicione uma em branco ou comece por um modelo abaixo.</p>}
            {doc.sections.length > 0 && (
              <ol class="kq-sections">
                {doc.sections.map((s, i) => {
                  const name = sectionName(s, i);
                  return (
                    <li key={s.id} class="kq-sec-edit" data-section>
                      <p class="kq-sec-num">Seção {i + 1} de {doc.sections.length}</p>
                      <TextField id={`kq-h-${s.id}`} label="Título da seção" value={s.heading} maxLength={RULES_LIMITS.heading} onValue={(v) => setSection(s.id, { heading: v })} />
                      <TextAreaField id={`kq-b-${s.id}`} label="Texto" hint={BODY_HINT} rows={8} value={s.body} maxLength={RULES_LIMITS.body} onValue={(v) => setSection(s.id, { body: v })} />
                      {hasPrompts(s.body) && <p class="kq-prompt">Substitua as sugestões [entre colchetes] pela regra do seu reino.</p>}
                      <div class="kg-actions">
                        <button type="button" class="btn btn-secondary" aria-label={`Subir ${name}`} aria-disabled={i === 0 ? "true" : undefined}
                          onClick={() => i > 0 && update((d) => ({ ...d, sections: moveSection(d.sections, i, -1) }))}>Subir</button>
                        <button type="button" class="btn btn-secondary" aria-label={`Descer ${name}`} aria-disabled={i === doc.sections.length - 1 ? "true" : undefined}
                          onClick={() => i < doc.sections.length - 1 && update((d) => ({ ...d, sections: moveSection(d.sections, i, 1) }))}>Descer</button>
                        <ConfirmAction label="Apagar" ariaLabel={`Apagar ${name}`} question={`Apagar ${name}?`}
                          onConfirm={() => update((d) => pruneTranslations({ ...d, sections: d.sections.filter((x) => x.id !== s.id) }))} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {doc.sections.length < RULES_LIMITS.sections ? (
              <div class="kg-grid">
                <SelectField id="kq-add" label="Adicionar uma seção" hint="Os modelos são sugestões [entre colchetes], não regras: substitua-as pelas suas." value={addKey} options={ADD_OPTIONS} onValue={setAddKey} />
                <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={addSection} data-add-section>Adicionar seção</button></div>
              </div>
            ) : <p class="kg-note">Esta página tem o máximo de {RULES_LIMITS.sections} seções.</p>}
          </section>

          <fieldset class="kq-group">
            <legend>Carta e revisão</legend>
            <DateField id="kq-agreed" label="Combinado em" hint="O dia em que o conselho combinou estas regras (opcional)." value={doc.charter.agreedOn} onValue={(v) => update((d) => ({ ...d, charter: { ...d.charter, agreedOn: v } }))} />
            <TextAreaField id="kq-signers" label="Assinada por" hint={`Um nome por linha, até ${RULES_LIMITS.signers}. Só membros do conselho que concordaram em ser listados.`} rows={4} value={signersText}
              onValue={(v) => { setSignersText(v); update((d) => ({ ...d, charter: { ...d.charter, signers: parseSigners(v) } })); }} />
            <DateField id="kq-reviewed" label="Última revisão" hint="Aparece na página para os membros saberem que as regras estão em dia." value={doc.lastReviewed} onValue={(v) => update((d) => ({ ...d, lastReviewed: v }))} />
          </fieldset>
        </>
      )}

      <section class="kq-group" aria-labelledby="kq-share-h">
        <h2 id="kq-share-h">Compartilhar e imprimir</h2>
        {withPrompts.length > 0 && (
          <p class="kq-prompt" data-prompts-left>
            Ainda há sugestões [entre colchetes] no texto{doc.translations.length > 0 ? ` (${withPrompts.join(", ")})` : ""}. Substitua-as antes de compartilhar.
          </p>
        )}
        {versions.some((v) => v.untranslated > 0) && (
          <ul class="kq-untr-list" data-untranslated-summary>
            {versions.filter((v) => v.untranslated > 0).map((v) => (
              <li key={v.key}><span lang={v.lang || undefined}>{v.name}</span>: {v.untranslated} {v.untranslated === 1 ? "parte" : "partes"} ainda não {v.untranslated === 1 ? "traduzida" : "traduzidas"} (os leitores veem o original ali).</li>
            ))}
          </ul>
        )}
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={makeLink} disabled={linkBusy} data-make-link>Compartilhar link só de leitura</button>
          <button type="button" class="btn btn-secondary" onClick={downloadTxt}>Baixar como texto (.txt)</button>
        </div>
        {tooLarge !== null && (
          <div class="kg-grid" data-too-large>
            <p class="kg-error" role="alert">
              Com todos os idiomas o link teria {tooLarge.toLocaleString("pt-BR")} caracteres; os links param em {MAX_SHARE_CHARS.toLocaleString("pt-BR")}.
              Compartilhe o original com um idioma só, e faça um link para cada grupo de idioma.
            </p>
            <SelectField id="kq-only" label="Idioma a incluir" value={onlyKey} options={onlyOptions} onValue={setOnlyKey} />
            <div class="kg-actions">
              <button type="button" class="btn btn-primary" onClick={makeShortLink} disabled={linkBusy} data-share-only>Compartilhar só este idioma</button>
            </div>
          </div>
        )}
        {link && (
          <div class="kg-grid" data-link-box>
            <CopyText id="kq-link" label="Link só de leitura" variant="link" text={link} copyLabel="Copiar link" hint="As regras viajam dentro do link. Quem o tiver pode lê-las, ninguém pode editá-las. Edições feitas depois precisam de um link novo." />
            {linkParts && <p class="kg-note" data-link-partial>Este link leva só: {linkParts.join(" e ")}. Os leitores dos outros idiomas precisam do próprio link.</p>}
            {long && (
              <p class="kg-error" data-link-long>
                Este link tem {link.length.toLocaleString("pt-BR")} caracteres. O Discord corta mensagens com 2.000 caracteres, então talvez não caiba numa mensagem só.
                Encurte algumas seções, ou compartilhe o arquivo de texto ou um PDF impresso.
              </p>
            )}
            <p><a href={link} target="_blank" rel="noopener">Abra a página de visualização</a> para conferir ou imprimir.</p>
          </div>
        )}
        <DiscordPost id="rules" summary="Postar o link no Discord" message={rulesLinkMessage(title, link)} />
        <p class="kg-note" data-chat-warning><strong>Poste o link no Discord, no Reddit ou no seu próprio site. Nunca cole links no chat do jogo:</strong> jogadores relatam silenciamentos e alertas na conta por compartilhar links externos ali.</p>
      </section>
    </div>
  );
}
