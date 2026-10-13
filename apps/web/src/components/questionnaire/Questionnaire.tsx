import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { readStore, writeStore } from "../../lib/store";
import {
  SUMMARY,
  TOTAL,
  back,
  canSkip,
  closeTarget,
  currentValue,
  edit,
  finish,
  guideUrl,
  initialState,
  isSummary,
  next,
  questionAt,
  resume,
  setAnswer,
  skip,
  toDraft,
  type FlowState,
} from "../../lib/questionnaire-flow";
import { QuestionStep } from "./QuestionStep";
import { Summary } from "./Summary";
import "./questionnaire.css";

interface Props {
  /** Page navigation; tests pass a spy. */
  navigate?: (url: string) => void;
}

const defaultNavigate = (url: string): void => {
  window.location.assign(url);
};

/** F-01 questionnaire island: one question per step, draft saved on every answer. */
export default function Questionnaire({ navigate = defaultNavigate }: Props) {
  // Server render and first client render are the first step; the saved draft loads before paint.
  const [state, setState] = useState<FlowState>(initialState);
  const [closeHref, setCloseHref] = useState("/");
  const stateRef = useRef(state);
  const ready = useRef(false);
  // Set once the profile is saved: a draft save still pending from the last step must not resurrect the draft.
  const finished = useRef(false);
  const focusHeading = useRef(false);
  const focusInput = useRef(false);
  const focusOnMount = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  stateRef.current = state;

  const update = (f: (s: FlowState) => FlowState): void => {
    const prev = stateRef.current;
    const n = f(prev);
    if (n === prev) return;
    if (n.step !== prev.step) focusHeading.current = true;
    else if (n.error && n.error !== prev.error) focusInput.current = true;
    stateRef.current = n;
    setState(n);
  };

  const close = (): void => navigate(closeTarget(document.referrer, window.location.origin));

  const complete = (): void => {
    const out = finish(stateRef.current.answers);
    if (out.ok) {
      finished.current = true;
      writeStore({ profileCode: out.code, draft: null });
      navigate(guideUrl(out.code));
      return;
    }
    const first = out.errors[0]!;
    update((s) => ({ ...edit(s, first.step), error: first.message }));
  };

  const primary = (): void => {
    if (isSummary(stateRef.current)) complete();
    else update(next);
  };

  // Resume: draft in progress, else saved profile ("Edit answers"), else first question.
  useLayoutEffect(() => {
    const saved = readStore();
    const s = resume({ draft: saved.draft, profileCode: saved.profileCode });
    stateRef.current = s;
    setState(s);
    setCloseHref(closeTarget(document.referrer, window.location.origin));
    ready.current = true;
  }, []);

  // Save the draft on every answer and step change.
  useEffect(() => {
    // Read the ref: on the first render the layout effect has already resumed a newer state.
    if (ready.current && !finished.current) writeStore({ draft: toDraft(stateRef.current) as unknown as Record<string, unknown> });
  }, [state.step, state.answers]);

  // Focus: question heading on every step change; the field when an error appears.
  // Layout effect: focus must land before the next key event, or a fast Enter/Tab races it.
  useLayoutEffect(() => {
    // First load: focus the heading too, once the DOM shows the resumed step, unless the user
    // already focused something.
    if (focusOnMount.current && ready.current && state.step === stateRef.current.step) {
      focusOnMount.current = false;
      const active = document.activeElement;
      if (!active || active === document.body || active === document.documentElement) headingRef.current?.focus();
      focusHeading.current = false;
      return;
    }
    if (focusHeading.current) {
      focusHeading.current = false;
      headingRef.current?.focus();
    } else if (focusInput.current) {
      focusInput.current = false;
      inputRef.current?.focus();
    }
  });

  // Enter moves forward (buttons and links keep their own Enter); Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Enter" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("button, a, textarea, select, summary")) return;
      e.preventDefault();
      primary();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const q = questionAt(state.step);
  const summary = isSummary(state);
  const outcome = summary ? finish(state.answers) : null;
  const shown = summary ? TOTAL : state.step + 1;

  return (
    <div class="q">
      <div class="q-top">
        <a
          class="q-close"
          href={closeHref}
          onClick={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Close
        </a>
        <p class="q-progress mono" id="q-progress">
          {summary ? "Review" : <><span class="visually-hidden">Question </span>{state.step + 1} of {TOTAL}</>}
        </p>
      </div>
      <div class="q-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${shown / TOTAL})` }} />
      </div>

      <form
        class="q-step"
        key={state.step}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          primary();
        }}
      >
        <h1 id="q-title" class="q-title" tabIndex={-1} ref={headingRef}>
          {q ? q.label : "Check your answers"}
        </h1>
        <p class="q-help" id="q-help">
          {q ? q.help : "Your answers stay in this browser. You can change them any time from the You page."}
        </p>

        {q ? (
          <QuestionStep
            question={q}
            value={currentValue(state, q)}
            error={state.error}
            onAnswer={(v) => update((s) => setAnswer(s, v))}
            inputRef={inputRef}
          />
        ) : (
          <Summary answers={state.answers} outcome={outcome!} onEdit={(i) => update((s) => edit(s, i))} />
        )}

        <div class="q-actions">
          {state.step > 0 && (
            <button type="button" class="btn btn-secondary" onClick={() => update(back)}>Back</button>
          )}
          {canSkip(state) && (
            <button type="button" class="btn btn-secondary" onClick={() => update(skip)}>Skip</button>
          )}
          <button type="submit" class="btn btn-primary q-next">
            {summary ? "See my guide" : state.review || state.step === SUMMARY - 1 ? "Review answers" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
