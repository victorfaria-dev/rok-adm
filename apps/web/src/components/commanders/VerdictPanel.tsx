import { COMMANDER_CHECKLIST, CONFIDENCE_TEXT, EFFECT_TEXT, VERDICT_TEXT, type CommanderDecision } from "../../lib/commander-state";

interface Props {
  name: string;
  decision: CommanderDecision;
}

const questionText = (id: string): string => COMMANDER_CHECKLIST.questions.find((q) => q.id === id)?.text ?? id;

/** Vale a pena / Espere / Evite com every reason, its confidence and whether the community is divided. */
export function VerdictPanel({ name, decision }: Props) {
  const v = VERDICT_TEXT[decision.verdict];
  // Unanswered questions get their own list below; the planner also returns them as reasons.
  const reasons = decision.reasons.filter((r) => r.effect !== "unanswered");
  return (
    <section class="cmd-block cmd-verdict" data-verdict={decision.verdict} aria-labelledby="cmd-verdict-title">
      <h3 id="cmd-verdict-title" class="cmd-h3">Veredito</h3>
      <p class="cmd-verdict-word" role="status">
        <span class="visually-hidden">Veredito para {name}: </span>
        {v.word}
      </p>
      <p>{v.summary}</p>
      <p class="cmd-meta">
        No geral: <span class={`cmd-conf cmd-conf-${decision.confidence}`}>{CONFIDENCE_TEXT[decision.confidence]}</span>
        {decision.confidence === "pending" && <span>até as perguntas obrigatórias serem respondidas</span>}
        {decision.hasSplitViews && <span class="cmd-pill cmd-pill-split">Comunidade dividida</span>}
      </p>

      {reasons.length > 0 && (
        <>
          <h4 class="cmd-h4">Por quê</h4>
          <ol class="cmd-reasons">
            {reasons.map((r) => (
              <li key={r.ruleId} class="cmd-reason" data-effect={r.effect}>
                <p class="cmd-reason-head">
                  <span class={`cmd-pill cmd-effect-${r.effect}`}>{EFFECT_TEXT[r.effect]}</span>
                  <span class={`cmd-conf cmd-conf-${r.confidence}`}>{CONFIDENCE_TEXT[r.confidence]}</span>
                  {r.split && <span class="cmd-pill cmd-pill-split">Comunidade dividida</span>}
                </p>
                <p class="cmd-reason-text">{r.text}</p>
                {r.facts.length > 0 && (
                  <p class="cmd-facts">
                    Fatos: <span class="mono">{r.facts.join(", ")}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {decision.unanswered.length > 0 && (
        <>
          <h4 class="cmd-h4">Falta responder</h4>
          <ul class="cmd-unanswered">
            {decision.unanswered.map((q) => <li key={q}>{questionText(q)}</li>)}
          </ul>
        </>
      )}

      <p class="cmd-caution">
        Isto é conselho de estratégia de guias e jogadores da comunidade, não dado do jogo: confiança média, no máximo. Esculturas
        gastas são difíceis de recuperar (a Troca de Comandante Lendário cobre só alguns casos), então não tenha pressa.
      </p>
    </section>
  );
}
