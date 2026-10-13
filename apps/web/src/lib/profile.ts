import { decodeProfile, PROFILE_NAMES, type AccountProfile } from "@rokadm/core";

/** Decode a saved code; null when missing or invalid (never throws). */
export function profileFromCode(code: string | null): AccountProfile | null {
  if (!code) return null;
  const r = decodeProfile(code);
  return "profile" in r ? r.profile : null;
}

/** Text for the profile chip, e.g. "F2P · 30 min · CH 12". */
export function profileSummary(p: AccountProfile): string {
  return `${PROFILE_NAMES[p.spending]} · ${p.minutesPerDay} min · CH ${p.cityHall}`;
}
