// What Sun Tzu says in the /start chat. Fixed text, no LLM and no network: the same answers
// always produce the same conversation. Plain English with a strategist's tone; the question
// itself (label and help) still comes from QUESTIONS in @rokadm/core (or PLAYING_AS_QUESTION).
import { STEPS, type StepId } from "./questionnaire-flow";

export const BOT_NAME = "Sun Tzu";

/** First message, before the first question. */
export const GREETING = `I'm Sun Tzu. ${STEPS.length} quick questions, then I set up your plan.`;

/** One short line before each onboarding step. */
export const LEADS: Readonly<Partial<Record<StepId, string>>> = {
  playingAs: "First, who stands before me: a player, or someone who leads a kingdom?",
  spending: "Now money. There is no right answer here: I plan with what you actually spend.",
  minutesPerDay: "Now time. A plan that needs hours you don't have is not a plan.",
  cityHall: "Now your City Hall.",
  kingdomStage: "Last one. Know the ground before you move.",
};

/** Line before the summary. */
export const SUMMARY_LEAD = "That's everything. Check my notes, change what is off, then I open your home tab.";
