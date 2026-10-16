import { COMMANDER_CHECKLIST, type Answers } from "../../lib/commander-state";

interface Props {
  answers: Answers;
  suggested: readonly string[];
  onAnswer: (question: string, option: string) => void;
  onConfirm: () => void;
}

/** F-20 questions: one fieldset per question, whole row is the target. */
export function Checklist({ answers, suggested, onAnswer, onConfirm }: Props) {
  return (
    <section class="cmd-block" aria-labelledby="cmd-checklist-title">
      <h3 id="cmd-checklist-title" class="cmd-h3">Antes de gastar</h3>
      {suggested.length > 0 && (
        <div class="cmd-suggest-note">
          <p>
            {suggested.length === 1 ? "1 resposta vem" : `${suggested.length} respostas vêm`} preenchida{suggested.length === 1 ? "" : "s"} pela nossa tabela de comandantes e
            marcada{suggested.length === 1 ? "" : "s"} como <span class="cmd-pill cmd-pill-suggested">Sugerida</span>. Mude as que não servirem à sua conta.
          </p>
          <button type="button" class="btn btn-secondary" onClick={onConfirm}>Manter respostas sugeridas</button>
        </div>
      )}
      <div class="cmd-questions">
        {COMMANDER_CHECKLIST.questions.map((q) => {
          const isSuggested = suggested.includes(q.id);
          return (
            <fieldset key={q.id} class="cmd-q" id={`cmd-q-${q.id}`}>
              <legend class="cmd-legend">
                <span>{q.text}</span>
                {!q.required && <span class="cmd-pill">Opcional</span>}
                {isSuggested && <span class="cmd-pill cmd-pill-suggested">Sugerida</span>}
              </legend>
              <div class="cmd-options">
                {q.options.map((o) => {
                  const id = `cmd-${q.id}-${o.id}`;
                  const checked = answers[q.id] === o.id;
                  return (
                    <label key={o.id} class="cmd-option" for={id}>
                      <input
                        type="radio"
                        id={id}
                        name={`cmd-${q.id}`}
                        value={o.id}
                        checked={checked}
                        // Click also fires on an already checked (suggested) option: that confirms it.
                        onClick={() => onAnswer(q.id, o.id)}
                        onChange={() => onAnswer(q.id, o.id)}
                      />
                      <span class="cmd-option-label">
                        {o.label}
                        {checked && isSuggested && <span class="visually-hidden"> (sugerida)</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
