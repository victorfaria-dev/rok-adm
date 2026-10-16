// F-72 Lifetime Spend Adjustment: the spending profile the tools should use.
// The thresholds are a PRODUCT RULE (produto/decisoes-autonomas.md), not a game fact:
// research/perfis.md defines monthly bands only and says the boundaries are convention.
import { SPENDING_PROFILES, type AccountProfile, type SpendingProfile } from "@rokadm/core";

/** Minimum lifetime spend (USD) for each tier: 12 months at the monthly band floor (perfis.md). */
export const LIFETIME_TIER_FLOORS: ReadonlyArray<{ profile: SpendingProfile; minUsd: number }> = [
  { profile: "kraken", minUsd: 60_000 },
  { profile: "whale", minUsd: 12_000 },
  { profile: "high", minUsd: 6_000 },
  { profile: "medium", minUsd: 1_200 },
  { profile: "low", minUsd: 60 },
];

export const EFFECTIVE_PROFILE_RULE =
  "Regra do produto, não um fato do jogo: o gasto passado conta como um ano no piso de uma faixa mensal " +
  "(Low a partir de $60, Medium a partir de $1.200, High a partir de $6.000, Whale a partir de $12.000, Kraken a partir de $60.000 no total). " +
  "Vale o maior entre o seu perfil mensal e essa faixa de toda a vida. O nível da Prefeitura e do VIP ainda não são usados: não há limiar com fonte.";

export type EffectiveSource = "declared" | "lifetime" | "override";

export interface EffectiveProfile {
  /** Profile every tool should use. */
  effective: SpendingProfile;
  /** Monthly spending answered in the questionnaire. */
  declared: SpendingProfile;
  /** Tier implied by lifetime spend, or null when it was not answered. */
  lifetimeTier: SpendingProfile | null;
  source: EffectiveSource;
  /** One sentence the UI shows to explain the result. */
  explanation: string;
}

const rank = (p: SpendingProfile): number => SPENDING_PROFILES.indexOf(p);

/** Tier implied by lifetime spend alone (null when unknown). */
export function lifetimeTier(lifetimeSpendUsd: number | null): SpendingProfile | null {
  if (lifetimeSpendUsd === null || !Number.isFinite(lifetimeSpendUsd) || lifetimeSpendUsd < 0) return null;
  return LIFETIME_TIER_FLOORS.find((t) => lifetimeSpendUsd >= t.minUsd)?.profile ?? "f2p";
}

const NAMES: Record<SpendingProfile, string> = {
  f2p: "F2P", low: "Low", medium: "Medium", high: "High", whale: "Whale", kraken: "Kraken",
};

/**
 * Effective profile = the higher of the declared monthly profile and the lifetime tier,
 * unless the player picked one by hand (`override` wins, F-72 (b)).
 */
export function effectiveProfile(
  p: Pick<AccountProfile, "spending" | "lifetimeSpendUsd">,
  override: SpendingProfile | null = null,
): EffectiveProfile {
  const declared = p.spending;
  const life = lifetimeTier(p.lifetimeSpendUsd);
  if (override && SPENDING_PROFILES.includes(override)) {
    return {
      effective: override, declared, lifetimeTier: life, source: "override",
      explanation: `Você escolheu ${NAMES[override]} à mão (suas respostas indicam ${NAMES[declared]}).`,
    };
  }
  if (life && rank(life) > rank(declared)) {
    return {
      effective: life, declared, lifetimeTier: life, source: "lifetime",
      explanation: `Você gasta como ${NAMES[declared]} agora, mas cerca de $${p.lifetimeSpendUsd!.toLocaleString("pt-BR")} no total colocam a sua conta em ${NAMES[life]}.`,
    };
  }
  return {
    effective: declared, declared, lifetimeTier: life, source: "declared",
    explanation: life === null
      ? `Com base no seu gasto mensal (${NAMES[declared]}). Informe o gasto total para conferir se a conta é mais antiga e mais forte.`
      : `Com base no seu gasto mensal (${NAMES[declared]}); o seu gasto total não o aumenta.`,
  };
}

/** The profile with `spending` replaced by the effective one (what routine and guide filters use). */
export function withEffectiveSpending(p: AccountProfile, override: SpendingProfile | null = null): AccountProfile {
  return { ...p, spending: effectiveProfile(p, override).effective };
}
