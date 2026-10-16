import type { JSX } from "preact";
import { ORIGINAL_KEY, TRANSLATION_NOTE, UNTRANSLATED_NOTE, bodyToBlocks, cleanLangCode, resolveRules, type RulesBlock, type RulesDoc } from "@rokadm/planner";
import { formatDay } from "../../../lib/kingdom-rules";

interface Props {
  doc: RulesDoc;
  /** 1 on the view page (title is the page h1), 2 inside the builder preview. */
  level: 1 | 2;
  /** Language version to show (ORIGINAL_KEY or a translation id). */
  version?: string;
}

/** Text with kept line breaks; rendered as text nodes, so nothing the council typed becomes HTML. */
function Lines({ lines }: { lines: string[] }) {
  return <>{lines.map((l, i) => (i === 0 ? l : <><br />{l}</>))}</>;
}

export function Blocks({ text }: { text: string }) {
  const blocks: RulesBlock[] = bodyToBlocks(text);
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "p" ? <p key={i}><Lines lines={b.lines} /></p>
          : b.type === "ul" ? <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
            : <ol key={i} start={b.start}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ol>)}
    </>
  );
}

/** Texto da interface (português) dentro de conteúdo que pode estar em outro idioma. */
const EN = "pt-BR";

/**
 * Read-only rendering of a rules document (view page and builder preview). The article carries the
 * version's lang attribute; as linhas de interface em português levam lang="pt-BR", and parts shown in the original
 * because they are not translated yet carry the original's lang ("" = unknown, never the wrong one).
 */
export default function RulesView({ doc, level, version = ORIGINAL_KEY }: Props): JSX.Element {
  const v = resolveRules(doc, version);
  const H = level === 1 ? "h1" : "h2";
  const S = level === 1 ? "h2" : "h3";
  const { agreedOn, signers } = doc.charter;
  const council = doc.kingdom ? `conselho de ${doc.kingdom}` : "conselho do reino";
  // Original with no code: inherit the page language, as before languages existed.
  const articleLang = v.isOriginal ? (v.lang || undefined) : v.lang;
  const origLang = v.isOriginal ? undefined : cleanLangCode(doc.originalLang);
  const hasVersions = doc.translations.length > 0;
  return (
    <article class="kq-doc" lang={articleLang} data-rules-doc data-version={v.key}>
      <header class="kq-doc-head">
        <H class="kq-doc-title" lang={v.titleFallback ? origLang : undefined}>{v.title}</H>
        {doc.kingdom && doc.title && <p class="kq-doc-kingdom">{doc.kingdom}</p>}
        {!v.isOriginal && <p class="kq-doc-meta kq-tr-note" lang={EN} data-translation-note>{TRANSLATION_NOTE}</p>}
        {v.isOriginal && hasVersions && <p class="kq-doc-meta" lang={EN} data-original-note>Esta é a versão original.</p>}
        {doc.languageNote && <p class="kq-doc-meta" lang={origLang}>{doc.languageNote}</p>}
        {doc.lastReviewed && <p class="kq-doc-meta" lang={EN}>Última revisão em {formatDay(doc.lastReviewed)}</p>}
      </header>
      {v.intro && (
        <div class="kq-doc-intro kq-section" data-untranslated={v.introFallback ? "" : undefined}>
          {v.introFallback && <p class="kq-untr" lang={EN}>{UNTRANSLATED_NOTE}</p>}
          <div class="kq-body" lang={v.introFallback ? origLang : undefined}><Blocks text={v.intro} /></div>
        </div>
      )}
      {v.sections.map((s, i) => (
        <section key={s.id} class="kq-section" aria-labelledby={`kq-s-${level}-${i}`} data-untranslated={s.fallback ? "" : undefined}>
          <S id={`kq-s-${level}-${i}`} lang={s.heading ? (s.fallback ? origLang : undefined) : EN}>{s.heading || "Seção sem título"}</S>
          {s.fallback && <p class="kq-untr" lang={EN} data-untranslated-note>{UNTRANSLATED_NOTE}</p>}
          <div class="kq-body" lang={s.fallback ? origLang : undefined}><Blocks text={s.body} /></div>
        </section>
      ))}
      {(agreedOn || signers.length > 0) && (
        <section class="kq-charter" aria-labelledby={`kq-charter-${level}`} lang={EN}>
          <S id={`kq-charter-${level}`}>Carta</S>
          {agreedOn && <p>Combinado em {formatDay(agreedOn)}.</p>}
          {signers.length > 0 && (
            <>
              <p>Assinada por:</p>
              <ul data-signers>{signers.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </>
          )}
        </section>
      )}
      <p class="kq-byline" lang={EN} data-byline>Escrito pelo {council}, não pelo KingdomOps.</p>
    </article>
  );
}
