import type { Ref } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { QUESTIONS, type Question } from "@rokadm/core";
import { readStore, writeStore } from "../../lib/store";
import {
  SUMMARY,
  TOTAL,
  answerText,
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
import { GREETING, LEADS, SUMMARY_LEAD } from "../../lib/sun-tzu";
import { MASCOT_NAME, Mascot, type MascotState } from "./mascot";
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

/**
 * How long a new message counts as "being said": the typing dots are CSS-limited to one slow
 * duration, and the mascot plays its talk clip until this clears, then goes back to idle. Input is
 * never blocked.
 */
const TYPING_CLEAR_MS = 1600;
/** How long Sun Tzu grumbles after an empty or invalid answer (the error text stays). */
const GRUMBLE_MS = 700;

/** One Sun Tzu message. The current question carries the page heading; older ones are plain text. */
function BotMessage(props: { current: boolean; typing: boolean; grumble?: number; lead?: string; title?: string; help?: string; headingRef?: Ref<HTMLParagraphElement> }) {
  const { current, typing, grumble = 0, lead, title, help, headingRef } = props;
  const mood: MascotState | undefined = !current ? undefined : grumble > 0 ? "grumble" : typing ? "talking" : "idle";
  return (
    <div class="q-msg q-msg-bot" data-current={current ? "" : undefined} data-typing={typing ? "" : undefined}>
      <Mascot size={current ? 48 : 32} state={mood} pulse={current ? grumble : undefined} />
      <div class="q-bubble">
        <p class={current ? "q-who" : "q-who visually-hidden"}>{MASCOT_NAME}</p>
        <span class="q-typing" aria-hidden="true"><span /><span /><span /></span>
        <div class="q-bubble-text">
          {lead && <p class="q-lead">{lead}</p>}
          {title && (
            <p
              class={current ? "q-title" : "q-asked"}
              id={current ? "q-title" : undefined}
              role={current ? "heading" : undefined}
              aria-level={current ? 1 : undefined}
              tabIndex={current ? -1 : undefined}
              ref={current ? headingRef : undefined}
            >
              {title}
            </p>
          )}
          {help && <p class="q-help" id={current ? "q-help" : undefined}>{help}</p>}
        </div>
      </div>
    </div>
  );
}

/** The player's answer as they picked it: the quick-reply label ("2–3 times"), else the value. */
function ReplyText({ q, value }: { q: Question; value: unknown }) {
  const preset = q.type === "number" ? q.presets?.find((p) => p.value === value) : undefined;
  if (preset) return <span>{preset.label}</span>;
  return <span class={q.type === "number" && value !== null ? "mono" : undefined}>{answerText(q, value)}</span>;
}

/**
 * F-01 questionnaire as a chat with Sun Tzu: he asks one question per step in a log
 * (aria-live polite), the reply area below holds quick replies or a number field, and
 * every answer is saved as a draft. Flow rules live in lib/questionnaire-flow.ts.
 */
export default function Questionnaire({ navigate = defaultNavigate }: Props) {
  // Server render and first client render are the first step; the saved draft loads before paint.
  const [state, setState] = useState<FlowState>(initialState);
  const [closeHref, setCloseHref] = useState("/");
  // Step whose new bot message shows the typing dots (forward moves only); -1 = none.
  const [typingStep, setTypingStep] = useState(-1);
  // Grumble counter for the current step (0 = calm); bumps on every rejected answer.
  const [grumble, setGrumble] = useState(0);
  const stateRef = useRef(state);
  const ready = useRef(false);
  // Set once the profile is saved: a draft save still pending from the last step must not resurrect the draft.
  const finished = useRef(false);
  const focusReply = useRef(false);
  const focusInput = useRef(false);
  const focusOnMount = useRef(true);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLFormElement>(null);
  stateRef.current = state;

  const update = (f: (s: FlowState) => FlowState): void => {
    const prev = stateRef.current;
    const n = f(prev);
    if (n === prev) return;
    if (n.step !== prev.step) {
      focusReply.current = true;
      setTypingStep(n.step > prev.step ? n.step : -1);
      setGrumble(0);
    } else if (n.error) {
      if (n.error !== prev.error) focusInput.current = true;
      setGrumble((g) => g + 1);
    }
    stateRef.current = n;
    setState(n);
  };

  /** Updates bound to the step on screen: a late change event from a step already left is ignored. */
  const onStep = (step: number, f: (s: FlowState) => FlowState) => (s: FlowState) => (s.step === step ? f(s) : s);

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

  /** Where focus goes on a new step: the reply (picked option, else the field, else the first option). */
  const focusTarget = (): HTMLElement | null => {
    const form = replyRef.current;
    if (!form || isSummary(stateRef.current)) return headingRef.current;
    return (
      form.querySelector<HTMLElement>("input[type=radio]:checked") ??
      (inputRef.current && (inputRef.current.value !== "" || !form.querySelector("input[type=radio]")) ? inputRef.current : null) ??
      form.querySelector<HTMLElement>("input[type=radio]")
    );
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

  // The typing dots are decorative and short; drop the attribute once they are done.
  useEffect(() => {
    if (typingStep < 0) return;
    const t = setTimeout(() => setTypingStep(-1), TYPING_CLEAR_MS);
    return () => clearTimeout(t);
  }, [typingStep]);

  // The grumble is a short reaction; the error text below the field stays until fixed.
  useEffect(() => {
    if (grumble === 0) return;
    const t = setTimeout(() => setGrumble(0), GRUMBLE_MS);
    return () => clearTimeout(t);
  }, [grumble]);

  // Any key or press skips the typing dots.
  useEffect(() => {
    const skipTyping = (): void => setTypingStep(-1);
    document.addEventListener("pointerdown", skipTyping);
    document.addEventListener("keydown", skipTyping);
    return () => {
      document.removeEventListener("pointerdown", skipTyping);
      document.removeEventListener("keydown", skipTyping);
    };
  }, []);

  // Focus: the new question's reply (not the log) on every step change; the field when an error
  // appears. Layout effect: focus must land before the next key event, or a fast Enter/Tab races it.
  useLayoutEffect(() => {
    // First load: focus the reply too, once the DOM shows the resumed step, unless the user
    // already focused something.
    if (focusOnMount.current && ready.current && state.step === stateRef.current.step) {
      focusOnMount.current = false;
      const active = document.activeElement;
      if (!active || active === document.body || active === document.documentElement) focusTarget()?.focus();
      focusReply.current = false;
      return;
    }
    if (focusReply.current) {
      focusReply.current = false;
      const current = document.querySelector<HTMLElement>(".q-msg-bot[data-current]");
      current?.scrollIntoView?.({ block: "start" });
      focusTarget()?.focus({ preventScroll: true });
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
  const typing = typingStep === state.step;

  // The conversation so far: every question before this one with the answer given.
  const history = summary ? [] : QUESTIONS.slice(0, state.step);

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

      <div class="q-log" role="log" aria-live="polite" aria-label={`Chat with ${MASCOT_NAME}`}>
        {!summary && <BotMessage key="hello" current={false} typing={false} lead={GREETING} />}
        {history.flatMap((hq, i) => [
          <BotMessage key={`bot-${i}`} current={false} typing={false} title={hq.label} />,
          <div class="q-msg q-msg-user" key={`you-${i}`}>
            <p class="q-bubble q-bubble-user">
              <span class="visually-hidden">You: </span>
              <ReplyText q={hq} value={currentValue(state, hq)} />
            </p>
          </div>,
        ])}
        {q ? (
          <BotMessage key={`bot-${state.step}`} current typing={typing} grumble={grumble} lead={LEADS[q.id]} title={q.label} help={q.help} headingRef={headingRef} />
        ) : (
          <BotMessage
            key="bot-summary"
            current
            typing={typing}
            lead={SUMMARY_LEAD}
            title="Check your answers"
            help="Your answers stay in this browser. You can change them any time from the You page."
            headingRef={headingRef}
          />
        )}
      </div>

      <form
        class="q-reply"
        key={state.step}
        ref={replyRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          primary();
        }}
      >
        {q ? (
          <QuestionStep
            question={q}
            value={currentValue(state, q)}
            error={state.error}
            onAnswer={(v) => update(onStep(state.step, (s) => setAnswer(s, v)))}
            onSend={(v) => update(onStep(state.step, (s) => next(setAnswer(s, v))))}
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
