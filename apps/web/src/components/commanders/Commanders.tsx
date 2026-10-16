import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { progressFromProfile, type KingdomProgress } from "@rokadm/planner";
import {
  OTHER_ID,
  OTHER_NAME,
  SHELF_LIFE_AS_OF,
  SHELF_LIFE_TEXT,
  VERDICT_TEXT,
  clearCommander,
  commanderFromHash,
  commanderName,
  confirmSuggestions,
  decide,
  getShelfLife,
  prefill,
  savedChecks,
  setAnswer,
  stageLabel,
  withRoster,
  type Answers,
  type AnswersMap,
} from "../../lib/commander-state";
import { shouldAsk, type PickerRoster } from "../../lib/commander-picker";
import { profileFromCode } from "../../lib/profile";
import { CommanderPicker } from "./CommanderPicker";
import { readStore, writeStore } from "../../lib/store";
import { Checklist } from "./Checklist";
import { VerdictPanel } from "./VerdictPanel";
import "./commanders.css";

/** F-20 island: pick a commander, answer the checklist, see Go / Wait / Avoid. */
export default function Commanders({ roster }: { roster: PickerRoster }) {
  const choices = useMemo(() => withRoster(roster.commanders), [roster]);
  const nameOf = (id: string): string => commanderName(id, choices);
  const [progress, setProgress] = useState<KingdomProgress | null>(null);
  // Server render and first client render: nothing picked, nothing saved. Storage loads before paint.
  const [selected, setSelected] = useState<string | null>(null);
  const [map, setMap] = useState<AnswersMap>({});
  const [undo, setUndo] = useState<{ id: string; answers: Answers } | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const focusTitle = useRef(false);
  const focusUndo = useRef(false);

  useLayoutEffect(() => {
    const store = readStore();
    setMap(store.commanders);
    const profile = profileFromCode(store.profileCode);
    setProgress(profile ? progressFromProfile(profile) : null);
    setSelected(commanderFromHash(window.location.hash, choices));
    const onHash = (): void => {
      const id = commanderFromHash(window.location.hash, choices);
      if (id) {
        focusTitle.current = true;
        setSelected(id);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (focusTitle.current) {
      focusTitle.current = false;
      titleRef.current?.focus();
    } else if (focusUndo.current) {
      // The cleared row is gone: keep keyboard users next to what they just did.
      focusUndo.current = false;
      undoRef.current?.focus();
    }
  });

  const save = (next: AnswersMap): void => {
    setMap(next);
    // Read-merge-write: keep other commanders exactly as stored.
    writeStore({ commanders: next });
  };

  const pick = (id: string | null): void => {
    setSelected(id);
    const url = id ? `#${id}` : window.location.pathname + window.location.search;
    history.replaceState(null, "", url);
  };

  const clear = (id: string): void => {
    const answers = map[id];
    if (!answers) return;
    save(clearCommander(map, id));
    setUndo({ id, answers });
    focusUndo.current = true;
  };

  const restore = (): void => {
    if (!undo) return;
    save({ ...map, [undo.id]: undo.answers });
    setUndo(null);
  };

  const saved = savedChecks(map, choices);
  // CMD-03: questions only once the kingdom has reached the commander's period (shouldAskAboutCommander, lean roster).
  const later = selected && selected !== OTHER_ID && !shouldAsk(selected, roster.commanders, progress)
    ? roster.periods.find((p) => p.id === roster.commanders.find((c) => c.id === selected)?.period)
    : undefined;
  const tag = selected ? getShelfLife(selected) : undefined;
  const filled = selected ? prefill(selected, map[selected]) : null;
  const decision = selected ? decide(selected, map[selected]) : null;

  return (
    <div class="cmd">
      <CommanderPicker
        roster={roster}
        progress={progress}
        title="Escolha um comandante"
        idPrefix="cmd-pick"
        value={selected}
        onChange={(id) => {
          focusTitle.current = true;
          pick(id);
        }}
      >
        <button
          type="button"
          class="cmd-other-btn"
          aria-pressed={selected === OTHER_ID}
          onClick={() => {
            focusTitle.current = true;
            pick(OTHER_ID);
          }}
        >
          {OTHER_NAME} (fora da nossa lista)
        </button>
        {!progress && (
          <p class="cmd-stage-hint">
            <a href="/start/">Conte a fase do seu reino</a> para marcarmos os comandantes que chegam mais tarde.
          </p>
        )}
      </CommanderPicker>

      {!selected && (
        <p class="cmd-empty">
          Escolha o comandante em que você quer gastar esculturas. As respostas vêm preenchidas pela nossa tabela onde temos dados,
          e você pode mudar todas.
        </p>
      )}

      {selected && later && (
        <article class="cmd-detail" aria-labelledby="cmd-name">
          <h2 id="cmd-name" class="cmd-h2" tabIndex={-1} ref={titleRef}>{nameOf(selected)}</h2>
          <p class="cmd-later">Este comandante chega em {later.label}; ainda não há o que decidir.</p>
        </article>
      )}

      {selected && !later && filled && decision && (
        <article class="cmd-detail" aria-labelledby="cmd-name">
          <h2 id="cmd-name" class="cmd-h2" tabIndex={-1} ref={titleRef}>{nameOf(selected)}</h2>
          {tag ? (
            <div class="cmd-tag">
              <p class="cmd-shelf">
                <span class="cmd-pill cmd-pill-shelf">{SHELF_LIFE_TEXT[tag.shelfLife]}</span>
                {tag.split && <span class="cmd-pill cmd-pill-split">Comunidade dividida</span>}
              </p>
              <dl class="cmd-dl">
                <div>
                  <dt>Útil em</dt>
                  <dd>{tag.usefulStages.length ? tag.usefulStages.map(stageLabel).join(", ") : "Nenhuma fase listada"}</dd>
                </div>
                {tag.rarity && (
                  <div>
                    <dt>Raridade</dt>
                    <dd>{tag.rarity === "legendary" ? "Lendário" : tag.rarity === "epic" ? "Épico" : tag.rarity}</dd>
                  </div>
                )}
                <div>
                  <dt>Nota</dt>
                  <dd>{tag.note}</dd>
                </div>
                <div>
                  <dt>Fatos</dt>
                  <dd class="mono">{tag.facts.join(", ")}</dd>
                </div>
              </dl>
              <p class="cmd-asof">
                Etiqueta de <span class="mono">{SHELF_LIFE_AS_OF}</span>, tirada das nossas fichas de pesquisa. Ainda não conferida com uma atualização do jogo.
              </p>
            </div>
          ) : (
            <p class="cmd-tag cmd-other">
              Este comandante não está na nossa tabela, então nada vem preenchido. Responda você mesmo às perguntas.
            </p>
          )}

          <div class="cmd-work">
            <Checklist
              answers={filled.answers}
              suggested={filled.suggested}
              onAnswer={(q, o) => {
                const next = setAnswer(map, selected, q, o);
                if (next !== map) save(next);
              }}
              onConfirm={() => save(confirmSuggestions(map, selected))}
            />
            <VerdictPanel name={nameOf(selected)} decision={decision} />
          </div>
        </article>
      )}

      <section class="cmd-overview" aria-labelledby="cmd-saved-title">
        <h2 id="cmd-saved-title" class="cmd-h2">Suas conferências salvas</h2>
        <p class="cmd-status" role="status">
          {undo && (
            <>
              Respostas apagadas de {nameOf(undo.id)}.{" "}
              <button type="button" class="cmd-link-btn" ref={undoRef} onClick={restore}>Desfazer</button>
            </>
          )}
        </p>
        {saved.length === 0 ? (
          <p class="cmd-empty">Nada salvo ainda. Suas respostas ficam neste navegador assim que você responde uma pergunta.</p>
        ) : (
          <ul class="cmd-saved">
            {saved.map((c) => (
              <li key={c.id} class="cmd-saved-row" data-verdict={c.verdict}>
                <a class="cmd-saved-name" href={`#${c.id}`} aria-current={c.id === selected ? "true" : undefined}>{c.name}</a>
                <span class="cmd-saved-verdict">{VERDICT_TEXT[c.verdict].word}</span>
                <button type="button" class="cmd-link-btn" onClick={() => clear(c.id)} aria-label={`Apagar respostas de ${c.name}`}>
                  Apagar respostas
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
