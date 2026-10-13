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
  "Product rule, not a game fact: past spending counts as one year at a monthly band's floor " +
  "(Low from $60, Medium from $1,200, High from $6,000, Whale from $12,000, Kraken from $60,000 in total). " +
  "The higher of your monthly profile and that lifetime tier is used. City Hall and VIP level are not used yet: no sourced threshold.";

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
      explanation: `You chose ${NAMES[override]} by hand (your answers say ${NAMES[declared]}).`,
    };
  }
  if (life && rank(life) > rank(declared)) {
    return {
      effective: life, declared, lifetimeTier: life, source: "lifetime",
      explanation: `You spend like ${NAMES[declared]} now, but about $${p.lifetimeSpendUsd!.toLocaleString("en-US")} in total puts your account at ${NAMES[life]}.`,
    };
  }
  return {
    effective: declared, declared, lifetimeTier: life, source: "declared",
    explanation: life === null
      ? `Based on your monthly spending (${NAMES[declared]}). Add your total spend to check for an older, stronger account.`
      : `Based on your monthly spending (${NAMES[declared]}); your total spend does not raise it.`,
  };
}

/** The profile with `spending` replaced by the effective one (what routine and guide filters use). */
export function withEffectiveSpending(p: AccountProfile, override: SpendingProfile | null = null): AccountProfile {
  return { ...p, spending: effectiveProfile(p, override).effective };
}
