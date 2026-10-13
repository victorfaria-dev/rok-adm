// What Sun Tzu says in the /start chat. Fixed text, no LLM and no network: the same answers
// always produce the same conversation. Plain English with a strategist's tone; the question
// itself (label and help) still comes from QUESTIONS in @rokadm/core.
import { QUESTIONS, type QuestionId } from "@rokadm/core";

export const BOT_NAME = "Sun Tzu";

/** First message, before the first question. */
export const GREETING = `I'm Sun Tzu. ${QUESTIONS.length} quick questions, then I build a guide that fits how you really play.`;

/** One short line before each question. */
export const LEADS: Readonly<Record<QuestionId, string>> = {
  spending: "Start with money. There is no right answer here: I plan with what you actually spend.",
  lifetimeSpendUsd: "And over the whole life of this account?",
  minutesPerDay: "Now time. A plan that needs hours you don't have is not a plan.",
  sessionsPerDay: "How is that time spread across the day?",
  role: "Every account has a job. What is this one's?",
  kingdomStage: "Know the ground before you move.",
  kingdomDay: "If you know your kingdom's age, I can set aside what is already behind you.",
  cityHall: "Now your City Hall.",
  civilization: "Your civilization. \"Not sure yet\" is a fine answer.",
  returningPlayer: "Last one.",
};

/** Line before the summary. */
export const SUMMARY_LEAD = "That's everything. Check my notes, change what is off, then I write your guide.";
