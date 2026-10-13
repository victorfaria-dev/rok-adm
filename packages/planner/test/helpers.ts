import type { AccountProfile } from "@rokadm/core";

export function profile(over: Partial<AccountProfile> = {}): AccountProfile {
  return {
    spending: "f2p",
    lifetimeSpendUsd: 0,
    minutesPerDay: 30,
    sessionsPerDay: 2,
    role: "lutador",
    kingdomStage: "pre_kvk",
    kingdomDay: 20,
    cityHall: 12,
    civilization: null,
    returningPlayer: false,
    ...over,
  };
}
