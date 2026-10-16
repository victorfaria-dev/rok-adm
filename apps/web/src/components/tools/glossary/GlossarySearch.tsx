import { useEffect, useRef, useState } from "preact/hooks";
import { searchGlossary, type GlossaryTerm } from "@rokadm/planner/tools";

/**
 * Search box for the static /glossary/ list (F-88). The list itself is plain HTML (indexable, works
 * without JS); this island reads it from the DOM, hides what doesn't match and announces the count.
 * Nothing renders until hydration, so a no-JS visitor never sees a box that does nothing.
 */
export default function GlossarySearch({ total }: { total: number }) {
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  const terms = useRef<{ el: HTMLElement; t: GlossaryTerm }[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terms.current = [...document.querySelectorAll<HTMLElement>("[data-glossary-term]")].map((el) => ({
      el,
      t: {
        id: el.id,
        term: el.dataset.term ?? "",
        aliases: (el.dataset.aliases ?? "").split("|").filter(Boolean),
        definition: el.querySelector("[data-def]")?.textContent ?? "",
        facts: [],
      },
    }));
    setReady(true);
    // "Look up a term" (aba Guias) submits here as ?q=.
    const initial = new URLSearchParams(location.search).get("q");
    if (initial) apply(initial.slice(0, 80));
    // A link to a term hidden by the filter clears the filter so the target is visible.
    const onHash = (): void => {
      const id = decodeURIComponent(location.hash.slice(1));
      const hit = terms.current.find((x) => x.t.id === id);
      if (hit?.el.hidden) {
        apply("");
        hit.el.scrollIntoView();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // apply is stable enough: it only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = (next: string): void => {
    setQ(next);
    const keep = new Set(searchGlossary(terms.current.map((x) => x.t), next).map((t) => t.id));
    for (const { el, t } of terms.current) el.hidden = !keep.has(t.id);
    setShown(keep.size);
  };

  if (!ready) return null;
  return (
    <div class="g-search" role="search" aria-label="Glossário">
      <div class="t-field">
        <label for="g-q">Buscar no glossário</label>
        <p id="g-q-help" class="t-help">Um termo, uma sigla como KP, ou qualquer palavra de uma definição.</p>
        <input id="g-q" ref={input} type="search" autoComplete="off" spellcheck={false} value={q} aria-describedby="g-q-help g-count"
          onInput={(e) => apply((e.currentTarget as HTMLInputElement).value)} />
      </div>
      <p id="g-count" class="t-progress" aria-live="polite" data-testid="g-count">
        {q.trim() ? `${shown} de ${total} termos correspondem` : `${total} termos`}
      </p>
      {q.trim() && shown === 0 ? (
        <div class="g-empty" data-testid="g-empty">
          <p>Nenhum termo corresponde a “{q.trim()}”. Tente uma palavra mais curta ou uma sigla (por exemplo MGE ou AP), ou limpe a busca para ver todos os termos.</p>
          <button type="button" class="btn btn-secondary" onClick={() => { apply(""); input.current?.focus(); }}>Limpar busca</button>
        </div>
      ) : null}
    </div>
  );
}
