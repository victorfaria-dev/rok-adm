import { useEffect, useRef, useState } from "preact/hooks";
import {
  ORIGINAL_KEY, SHARE_ERROR_TEXT, decodeShare, parseRulesDoc, pickVersion, resolveRules, rulesVersions, shareFromHash,
  type RulesDoc, type ShareError,
} from "@rokadm/planner";
import { kingdomStorage } from "../../../lib/kingdom-store";
import { RULES_BUILDER_PATH, RULES_KIND, hashWithVersion, saveRulesCopy, versionFromHash } from "../../../lib/kingdom-rules";
import RulesView from "./RulesView";

type State = { s: "loading" } | { s: "error"; error: ShareError } | { s: "ok"; doc: RulesDoc };

function readerLanguages(): string[] {
  try {
    return [...(navigator.languages ?? []), navigator.language].filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

/** Accessible language switcher: one pressed button per version, each name in its own language. */
function LanguageSwitcher({ doc, current, onPick }: { doc: RulesDoc; current: string; onPick: (key: string) => void }) {
  const versions = rulesVersions(doc);
  return (
    <div class="kq-langs kg-noprint" role="group" aria-labelledby="kq-langs-label" data-lang-switcher>
      <p id="kq-langs-label" class="kg-label">Idioma</p>
      <div class="kg-actions">
        {versions.map((v) => (
          <button key={v.key} type="button" class="btn btn-secondary" aria-pressed={v.key === current} onClick={() => onPick(v.key)} data-lang-key={v.key}>
            <span lang={v.lang || undefined}>{v.name}</span>
            {v.isOriginal && <span> (original)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Read mode for a shared rules link (#d=...): decode in the browser, render, switch language, print, copy. */
export default function RulesViewPage() {
  const [state, setState] = useState<State>({ s: "loading" });
  const [version, setVersion] = useState(ORIGINAL_KEY);
  const [copyError, setCopyError] = useState("");
  const errRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await decodeShare(shareFromHash(location.hash), RULES_KIND, parseRulesDoc);
      if (!alive) return;
      if (r.ok) {
        const key = versionFromHash(r.data, location.hash) ?? pickVersion(r.data, readerLanguages());
        setVersion(key);
        document.title = `${resolveRules(r.data, key).title} · KingdomOps`;
      }
      setState(r.ok ? { s: "ok", doc: r.data } : { s: "error", error: r.error });
    };
    void load();
    const onHash = () => void load();
    addEventListener("hashchange", onHash);
    return () => {
      alive = false;
      removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (state.s === "error") errRef.current?.focus();
  }, [state.s]);

  if (state.s === "loading") {
    return <p class="kg-note" role="status" aria-live="polite" data-loading>Carregando as regras…</p>;
  }

  if (state.s === "error") {
    return (
      <div class="kg-card" data-share-error>
        <h1 ref={errRef} tabIndex={-1}>Este link de regras não pode ser aberto</h1>
        <p role="alert">{SHARE_ERROR_TEXT[state.error]}</p>
        <p><a href={RULES_BUILDER_PATH}>Ir ao montador da página de regras</a></p>
      </div>
    );
  }

  const doc = state.doc;
  function makeCopy() {
    const { st, blocked } = kingdomStorage();
    if (blocked) {
      setCopyError("Este navegador bloqueia o salvamento, então não dá para guardar uma cópia. Permita os dados do site e tente de novo.");
      return;
    }
    try {
      const id = saveRulesCopy(doc, st);
      location.href = `${RULES_BUILDER_PATH}?doc=${encodeURIComponent(id)}`;
    } catch (e) {
      setCopyError(e instanceof Error ? e.message : "Não foi possível salvar a cópia.");
    }
  }

  function pick(key: string) {
    setVersion(key);
    document.title = `${resolveRules(doc, key).title} · KingdomOps`;
    try {
      // replaceState does not fire hashchange, so the document is not decoded again.
      history.replaceState(null, "", `${location.pathname}${location.search}${hashWithVersion(doc, location.hash, key)}`);
    } catch {
      // ignore (sandboxed frames)
    }
  }

  return (
    <>
      {doc.translations.length > 0 && <LanguageSwitcher doc={doc} current={version} onPick={pick} />}
      <RulesView doc={doc} level={1} version={version} />
      <div class="kg-noprint kg-grid">
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={() => window.print()} data-print>Imprimir ou salvar em PDF</button>
          <button type="button" class="btn btn-secondary" onClick={makeCopy} data-copy-doc>Fazer uma cópia editável</button>
        </div>
        {copyError && <p class="kg-error" role="alert">{copyError}</p>}
        <p class="kg-note">Esta é uma cópia só de leitura, levada dentro do link. Editar uma cópia neste aparelho não muda o que os outros veem; compartilhe um link novo depois de editar.</p>
      </div>
    </>
  );
}
