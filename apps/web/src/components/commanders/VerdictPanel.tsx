import { COMMANDER_CHECKLIST, CONFIDENCE_TEXT, EFFECT_TEXT, VERDICT_TEXT, type CommanderDecision } from "../../lib/commander-state";

interface Props {
  name: string;
  decision: CommanderDecision;
}

const questionText = (id: string): string => COMMANDER_CHECKLIST.questions.find((q) => q.id === id)?.text ?? id;

/** Go / Wait / Avoid with every reason, its confidence and whether the community is divided. */
export function VerdictPanel({ name, decision }: Props) {
  const v = VERDICT_TEXT[decision.verdict];
  // Unanswered questions get their own list below; the planner also returns them as reasons.
  const reasons = decision.reasons.filter((r) => r.effect !== "unanswered");
  return (
    <section class="cmd-block cmd-verdict" data-verdict={decision.verdict} aria-labelledby="cmd-verdict-title">
      <h3 id="cmd-verdict-title" class="cmd-h3">Verdict</h3>
      <p class="cmd-verdict-word" role="status">
        <span class="visually-hidden">Verdict for {name}: </span>
        {v.word}
      </p>
      <p>{v.summary}</p>
      <p class="cmd-meta">
        Overall: <span class={`cmd-conf cmd-conf-${decision.confidence}`}>{CONFIDENCE_TEXT[decision.confidence]}</span>
        {decision.hasSplitViews && <span class="cmd-pill cmd-pill-split">Community divided</span>}
      </p>

      {reasons.length > 0 && (
        <>
          <h4 class="cmd-h4">Why</h4>
          <ol class="cmd-reasons">
            {reasons.map((r) => (
              <li key={r.ruleId} class="cmd-reason" data-effect={r.effect}>
                <p class="cmd-reason-head">
                  <span class={`cmd-pill cmd-effect-${r.effect}`}>{EFFECT_TEXT[r.effect]}</span>
                  <span class={`cmd-conf cmd-conf-${r.confidence}`}>{CONFIDENCE_TEXT[r.confidence]}</span>
                  {r.split && <span class="cmd-pill cmd-pill-split">Community divided</span>}
                </p>
                <p class="cmd-reason-text">{r.text}</p>
                {r.facts.length > 0 && (
                  <p class="cmd-facts">
                    Facts: <span class="mono">{r.facts.join(", ")}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {decision.unanswered.length > 0 && (
        <>
          <h4 class="cmd-h4">Still to answer</h4>
          <ul class="cmd-unanswered">
            {decision.unanswered.map((q) => <li key={q}>{questionText(q)}</li>)}
          </ul>
        </>
      )}

      <p class="cmd-caution">
        This is strategy advice from community guides and players, not game data: medium confidence at best. Spent
        sculptures are hard to win back (the Legendary Commander Swap covers only some cases), so take your time.
      </p>
    </section>
  );
}
