import { QUESTIONS } from "@rokadm/core";
import { answerText, type Answers, type Outcome } from "../../lib/questionnaire-flow";

interface Props {
  answers: Answers;
  outcome: Outcome;
  onEdit: (step: number) => void;
}

/** Final step: every answer with "Change", plus core warnings (profileWarnings) or errors. */
export function Summary({ answers, outcome, onEdit }: Props) {
  return (
    <div class="q-body">
      {!outcome.ok && (
        <section class="q-notes q-notes-error" aria-labelledby="q-errors-h">
          <h2 id="q-errors-h">Fix before you continue</h2>
          <ul>
            {outcome.errors.map((e, i) => (
              <li key={i}>
                <p>{e.message}</p>
                <button type="button" class="q-change" onClick={() => onEdit(e.step)}>Fix this answer</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {outcome.ok && outcome.warnings.length > 0 && (
        <section class="q-notes" aria-labelledby="q-warn-h">
          <h2 id="q-warn-h">Worth checking</h2>
          <ul>
            {outcome.warnings.map((w, i) => <li key={i}><p>{w}</p></li>)}
          </ul>
        </section>
      )}
      <dl class="q-review">
        {QUESTIONS.map((q, i) => {
          const v = answers[q.id];
          const shown = v === undefined ? q.default : v;
          return (
            <div class="q-review-row" key={q.id}>
              <dt>{q.label}</dt>
              <dd>
                <span class={q.type === "number" && shown !== null ? "q-answer mono" : "q-answer"}>{answerText(q, shown)}</span>
                <button type="button" class="q-change" aria-label={`Change answer: ${q.label}`} onClick={() => onEdit(i)}>Change</button>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
