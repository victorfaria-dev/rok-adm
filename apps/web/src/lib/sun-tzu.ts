// What Sun Tzu says in the /start chat. Fixed text, no LLM and no network: the same answers
// always produce the same conversation. Plain pt-BR with a strategist's tone; the question
// itself (label and help) still comes from QUESTIONS in @rokadm/core (or PLAYING_AS_QUESTION).
import { STEPS, type StepId } from "./questionnaire-flow";

export const BOT_NAME = "Sun Tzu";

/** First message, before the first question. */
export const GREETING = `Eu sou Sun Tzu. ${STEPS.length} perguntas rápidas e depois monto o seu plano.`;

/** One short line before each onboarding step. */
export const LEADS: Readonly<Partial<Record<StepId, string>>> = {
  playingAs: "Primeiro, quem está diante de mim: um jogador ou alguém que lidera um reino?",
  spending: "Agora o dinheiro. Aqui não existe resposta certa: eu planejo com o que você realmente gasta.",
  minutesPerDay: "Agora o tempo. Um plano que exige horas que você não tem não é um plano.",
  cityHall: "Agora a sua Prefeitura.",
  kingdomStage: "A última. Conheça o terreno antes de se mover.",
};

/** Line before the summary. */
export const SUMMARY_LEAD = "É tudo. Confira minhas anotações, corrija o que estiver errado e então abro a sua aba inicial.";
