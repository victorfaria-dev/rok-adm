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
import { RULES_BUILDER_PATH, docFromSearch, formatDay, listRules, rulesShareLink, saveRules, type RulesListItem } from "../../../lib/kingdom-rules";
import RulesView from "./RulesView";
import TranslationEditor, { LANG_CODE_HINT, langCodeError } from "./TranslationEditor";

/** Value of the "language to include" select that means "original only". */
const ONLY_ORIGINAL = "__original";
const isTooLarge = (e: unknown): e is Error & { chars: number } => e instanceof Error && e.name === "ShareTooLargeError";

const SAVE_DELAY = 600;
const BODY_HINT = "Blank line = new paragraph. Start a line with \"- \" for a bullet or \"1. \" for a numbered list.";
const ADD_OPTIONS = [
  { value: "blank", label: "Blank section" },
  ...RULES_TEMPLATES.map((t) => ({ value: t.key, label: `Template: ${t.heading}` })),
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

const sectionName = (s: RulesSection, i: number): string => (s.heading.trim() ? `"${s.heading.trim()}"` : `section ${i + 1}`);

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
      } else setError("That rules page is not saved on this device. Open one from the list or start a new one.");
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
      setStatus(blocked ? "Saved for this visit only (this browser blocks saving)." : "All changes saved on this device.");
      refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your changes could not be saved.");
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
    setStatus("Language removed from this page.");
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
      setStatus(kind === "charter" ? "New charter started from the starter sections." : "New rules page started.");
      show(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a new rules page.");
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
    setStatus("Rules page deleted from this device.");
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
          ? `${e.message} Use "Download as text" or print to PDF for the full version.`
          : "The link could not be made in this browser.");
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
        ? `${e.message} Shorten the longest sections, or use "Download as text" or print to PDF.`
        : "The link could not be made in this browser.");
    } finally {
      setLinkBusy(false);
    }
  }

  function downloadTxt() {
    if (!doc) return;
    const name = (rulesDisplayTitle(doc).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rules").slice(0, 60);
    downloadText(`${name}.txt`, rulesToPlainText(doc, { all: true }), "text/plain;charset=utf-8");
    setStatus("Text file ready: check your downloads.");
  }

  const statusLine = (
    <>
      {error && <p class="kg-error" role="alert">{error}</p>}
      <p class="kg-status" role="status" aria-live="polite" data-save-status>{status}</p>
    </>
  );

  if (!ready) return <p class="kg-note">Loading your rules pages…</p>;

  if (!doc) {
    return (
      <div class="kg-grid" data-rules-list>
        {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your work lasts until you close this page; download it as text or share a link to keep it.</p>}
        <section class="kg-grid" aria-labelledby="kq-list-h">
          <h2 id="kq-list-h" ref={listHead} tabIndex={-1}>Your rules pages</h2>
          {list.length === 0
            ? <p class="kg-note">No rules pages saved on this device yet.</p>
            : (
              <ul class="kq-list">
                {list.map((item) => (
                  <li key={item.id} data-rules-item>
                    <span class="kq-list-title">{item.title}</span>
                    <span class="kq-list-meta">Edited {formatDay(item.updatedAt.slice(0, 10))}</span>
                    <div class="kg-actions">
                      <button type="button" class="btn btn-secondary" aria-label={`Open ${item.title}`} onClick={() => show(item.doc)}>Open</button>
                      <ConfirmAction label="Delete" ariaLabel={`Delete ${item.title}`} question={`Delete "${item.title}" from this device? Links you already shared keep working.`} onConfirm={() => remove(item.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          <div class="kg-actions">
            <button type="button" class="btn btn-primary" onClick={() => create("charter")} data-new-charter>New kingdom charter</button>
            <button type="button" class="btn btn-secondary" onClick={() => create("blank")} data-new-blank>New blank rules page</button>
          </div>
          <p class="kg-note">A new charter starts with seven sections (leadership, decisions, KvK and DKP, MGE, migration, warnings, languages) written as [bracketed] prompts for your council to replace.</p>
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
    { value: ONLY_ORIGINAL, label: `${originalName(doc)} (original) only` },
    ...doc.translations.map((t, i) => ({ value: t.id, label: `${originalName(doc)} (original) + ${translationName(t, i)}` })),
  ];

  const languages = (
    <section class="kq-group" aria-labelledby="kq-langs-h" data-languages>
      <h2 id="kq-langs-h" tabIndex={-1}>Languages</h2>
      <p class="kg-note">Your council can write these rules in up to {RULES_LIMITS.translations} more languages. KingdomOps never machine-translates: every word is yours, and each translation tells readers that the original prevails.</p>
      {doc.translations.length > 0 && (
        <div class="kq-langs" role="group" aria-labelledby="kq-edit-version-label">
          <p id="kq-edit-version-label" class="kg-label">Version to edit{preview ? " and preview" : ""}</p>
          <div class="kg-actions">
            {versions.map((v) => (
              <button key={v.key} type="button" class="btn btn-secondary" aria-pressed={v.key === (editing ? editKey : ORIGINAL_KEY)}
                onClick={() => setEditKey(v.key)} data-edit-version={v.key}>
                <span lang={v.lang || undefined}>{v.name}</span>{v.isOriginal ? " (original)" : v.untranslated ? ` · ${v.untranslated} to translate` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {doc.translations.length < RULES_LIMITS.translations
        ? <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={addLanguage} data-add-language>Add a language</button></div>
        : <p class="kg-note">This page has the maximum of {RULES_LIMITS.translations} extra languages.</p>}
    </section>
  );

  return (
    <div class="kq-editor" data-rules-editor>
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your work lasts until you close this page; download it as text or share a link to keep it.</p>}
      <div class="kg-grid">
        <h2 ref={editorHead} tabIndex={-1} data-editor-title>Editing: {title}</h2>
        <div class="kg-actions">
          <button type="button" class="btn btn-secondary" onClick={backToList}>All rules pages</button>
          <button type="button" class="btn btn-secondary" aria-pressed={preview} onClick={() => setPreview(!preview)} data-preview-toggle>Preview</button>
        </div>
        {statusLine}
      </div>

      {languages}

      {preview ? (
        <section class="kq-preview" aria-label="Preview" data-preview>
          <RulesView doc={doc} level={2} version={editing ? editKey : ORIGINAL_KEY} />
        </section>
      ) : editing ? (
        <TranslationEditor doc={doc} t={editing} index={editIdx} onChange={setTranslation} onRemove={() => removeLanguage(editing.id)} />
      ) : (
        <>
          <fieldset class="kq-group">
            <legend>About this document</legend>
            <TextField id="kq-kingdom" label="Kingdom" hint="Number or name, for example K1234." value={doc.kingdom} maxLength={RULES_LIMITS.kingdom} onValue={(v) => update((d) => ({ ...d, kingdom: v }))} />
            <TextField id="kq-title" label="Title" hint="For example: Kingdom 1234 rules." value={doc.title} maxLength={RULES_LIMITS.title} onValue={(v) => update((d) => ({ ...d, title: v }))} />
            <div class="kg-grid kg-grid-2">
              <TextField id="kq-orig-label" label="Language of the original" hint="As its readers write it, for example English or Português." value={doc.originalLabel} maxLength={RULES_LIMITS.langLabel} onValue={(v) => update((d) => ({ ...d, originalLabel: v }))} />
              <TextField id="kq-orig-lang" label="Code of the original language (optional)" hint={LANG_CODE_HINT} value={doc.originalLang} error={langCodeError(doc.originalLang)} maxLength={RULES_LIMITS.langCode} onValue={(v) => update((d) => ({ ...d, originalLang: v }))} />
            </div>
            <TextField id="kq-lang" label="Language note" hint="Which language is the original, and how translations are treated." value={doc.languageNote} maxLength={RULES_LIMITS.languageNote} onValue={(v) => update((d) => ({ ...d, languageNote: v }))} />
            <TextAreaField id="kq-intro" label="Introduction" hint={BODY_HINT} rows={4} value={doc.intro} maxLength={RULES_LIMITS.intro} onValue={(v) => update((d) => ({ ...d, intro: v }))} />
          </fieldset>

          <section class="kq-group" aria-labelledby="kq-sections-h">
            <h2 id="kq-sections-h">Sections</h2>
            {doc.sections.length === 0 && <p class="kg-note">No sections yet. Add a blank one or start from a template below.</p>}
            {doc.sections.length > 0 && (
              <ol class="kq-sections">
                {doc.sections.map((s, i) => {
                  const name = sectionName(s, i);
                  return (
                    <li key={s.id} class="kq-sec-edit" data-section>
                      <p class="kq-sec-num">Section {i + 1} of {doc.sections.length}</p>
                      <TextField id={`kq-h-${s.id}`} label="Heading" value={s.heading} maxLength={RULES_LIMITS.heading} onValue={(v) => setSection(s.id, { heading: v })} />
                      <TextAreaField id={`kq-b-${s.id}`} label="Text" hint={BODY_HINT} rows={8} value={s.body} maxLength={RULES_LIMITS.body} onValue={(v) => setSection(s.id, { body: v })} />
                      {hasPrompts(s.body) && <p class="kq-prompt">Replace the [bracketed] prompts with your kingdom's own rule.</p>}
                      <div class="kg-actions">
                        <button type="button" class="btn btn-secondary" aria-label={`Move ${name} up`} aria-disabled={i === 0 ? "true" : undefined}
                          onClick={() => i > 0 && update((d) => ({ ...d, sections: moveSection(d.sections, i, -1) }))}>Move up</button>
                        <button type="button" class="btn btn-secondary" aria-label={`Move ${name} down`} aria-disabled={i === doc.sections.length - 1 ? "true" : undefined}
                          onClick={() => i < doc.sections.length - 1 && update((d) => ({ ...d, sections: moveSection(d.sections, i, 1) }))}>Move down</button>
                        <ConfirmAction label="Delete" ariaLabel={`Delete ${name}`} question={`Delete ${name}?`}
                          onConfirm={() => update((d) => pruneTranslations({ ...d, sections: d.sections.filter((x) => x.id !== s.id) }))} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {doc.sections.length < RULES_LIMITS.sections ? (
              <div class="kg-grid">
                <SelectField id="kq-add" label="Add a section" hint="Templates are prompts in [brackets], not rules: replace them with your own." value={addKey} options={ADD_OPTIONS} onValue={setAddKey} />
                <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={addSection} data-add-section>Add section</button></div>
              </div>
            ) : <p class="kg-note">This page has the maximum of {RULES_LIMITS.sections} sections.</p>}
          </section>

          <fieldset class="kq-group">
            <legend>Charter and review</legend>
            <DateField id="kq-agreed" label="Agreed on" hint="The day the council agreed these rules (optional)." value={doc.charter.agreedOn} onValue={(v) => update((d) => ({ ...d, charter: { ...d.charter, agreedOn: v } }))} />
            <TextAreaField id="kq-signers" label="Signed by" hint={`One name per line, up to ${RULES_LIMITS.signers}. Only council members who agreed to be listed.`} rows={4} value={signersText}
              onValue={(v) => { setSignersText(v); update((d) => ({ ...d, charter: { ...d.charter, signers: parseSigners(v) } })); }} />
            <DateField id="kq-reviewed" label="Last reviewed" hint="Shown on the page so members know the rules are current." value={doc.lastReviewed} onValue={(v) => update((d) => ({ ...d, lastReviewed: v }))} />
          </fieldset>
        </>
      )}

      <section class="kq-group" aria-labelledby="kq-share-h">
        <h2 id="kq-share-h">Share and print</h2>
        {withPrompts.length > 0 && (
          <p class="kq-prompt" data-prompts-left>
            Some [bracketed] prompts are still in the text{doc.translations.length > 0 ? ` (${withPrompts.join(", ")})` : ""}. Replace them before you share.
          </p>
        )}
        {versions.some((v) => v.untranslated > 0) && (
          <ul class="kq-untr-list" data-untranslated-summary>
            {versions.filter((v) => v.untranslated > 0).map((v) => (
              <li key={v.key}><span lang={v.lang || undefined}>{v.name}</span>: {v.untranslated} {v.untranslated === 1 ? "part" : "parts"} not translated yet (readers see the original there).</li>
            ))}
          </ul>
        )}
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={makeLink} disabled={linkBusy} data-make-link>Share view-only link</button>
          <button type="button" class="btn btn-secondary" onClick={downloadTxt}>Download as text (.txt)</button>
        </div>
        {tooLarge !== null && (
          <div class="kg-grid" data-too-large>
            <p class="kg-error" role="alert">
              With every language the link would be {tooLarge.toLocaleString("en-US")} characters; links stop at {MAX_SHARE_CHARS.toLocaleString("en-US")}.
              Share the original with one language instead, and make one link per language group.
            </p>
            <SelectField id="kq-only" label="Language to include" value={onlyKey} options={onlyOptions} onValue={setOnlyKey} />
            <div class="kg-actions">
              <button type="button" class="btn btn-primary" onClick={makeShortLink} disabled={linkBusy} data-share-only>Share only this language</button>
            </div>
          </div>
        )}
        {link && (
          <div class="kg-grid" data-link-box>
            <CopyText id="kq-link" label="View-only link" variant="link" text={link} copyLabel="Copy link" hint="The rules travel inside the link. Anyone with it can read them, nobody can edit them. Edits made later need a new link." />
            {linkParts && <p class="kg-note" data-link-partial>This link carries only: {linkParts.join(" and ")}. Readers of the other languages need their own link.</p>}
            {long && (
              <p class="kg-error" data-link-long>
                This link is {link.length.toLocaleString("en-US")} characters. Discord cuts messages at 2,000 characters, so it may not fit in one message.
                Shorten some sections, or share the text file or a printed PDF instead.
              </p>
            )}
            <p><a href={link} target="_blank" rel="noopener">Open the view page</a> to check it or print it.</p>
          </div>
        )}
        <p class="kg-note" data-chat-warning><strong>Post the link on Discord, Reddit or your own site. Never paste links in in-game chat:</strong> players report mutes and account flags for sharing outside links there.</p>
      </section>
    </div>
  );
}
