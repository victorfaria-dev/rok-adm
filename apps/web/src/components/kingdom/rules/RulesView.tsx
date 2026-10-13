import type { JSX } from "preact";
import { bodyToBlocks, rulesDisplayTitle, type RulesBlock, type RulesDoc } from "@rokadm/planner";
import { formatDay } from "../../../lib/kingdom-rules";

interface Props {
  doc: RulesDoc;
  /** 1 on the view page (title is the page h1), 2 inside the builder preview. */
  level: 1 | 2;
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

/** Read-only rendering of a rules document (view page and builder preview). */
export default function RulesView({ doc, level }: Props): JSX.Element {
  const title = rulesDisplayTitle(doc);
  const H = level === 1 ? "h1" : "h2";
  const S = level === 1 ? "h2" : "h3";
  const { agreedOn, signers } = doc.charter;
  const council = doc.kingdom ? `the council of ${doc.kingdom}` : "the kingdom's council";
  return (
    <article class="kq-doc" data-rules-doc>
      <header class="kq-doc-head">
        <H class="kq-doc-title">{title}</H>
        {doc.kingdom && doc.title && <p class="kq-doc-kingdom">{doc.kingdom}</p>}
        {doc.languageNote && <p class="kq-doc-meta">{doc.languageNote}</p>}
        {doc.lastReviewed && <p class="kq-doc-meta">Last reviewed {formatDay(doc.lastReviewed)}</p>}
      </header>
      {doc.intro && <div class="kq-doc-intro kq-section"><Blocks text={doc.intro} /></div>}
      {doc.sections.map((s, i) => (
        <section key={s.id} class="kq-section" aria-labelledby={`kq-s-${level}-${i}`}>
          <S id={`kq-s-${level}-${i}`}>{s.heading || "Untitled section"}</S>
          <Blocks text={s.body} />
        </section>
      ))}
      {(agreedOn || signers.length > 0) && (
        <section class="kq-charter" aria-labelledby={`kq-charter-${level}`}>
          <S id={`kq-charter-${level}`}>Charter</S>
          {agreedOn && <p>Agreed on {formatDay(agreedOn)}.</p>}
          {signers.length > 0 && (
            <>
              <p>Signed by:</p>
              <ul data-signers>{signers.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </>
          )}
        </section>
      )}
      <p class="kq-byline" data-byline>Written by {council}, not by KingdomOps.</p>
    </article>
  );
}
