// Durations and speedups. Speedup item durations are the durations printed in item names
// (e.g. "Universal Speedup (5m)" in the A04-0007 VIP Shop table); no other game numbers here.

export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = 86400;

/** "3d 4h 5m" style; seconds only below one minute; "0m" for zero. Negative counts as zero. */
export function formatDuration(totalSeconds: number): string {
  let s = Math.max(0, Math.round(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  if (s < MINUTE) return s === 0 ? "0m" : `${s}s`;
  const d = Math.floor(s / DAY); s -= d * DAY;
  const h = Math.floor(s / HOUR); s -= h * HOUR;
  const m = Math.floor(s / MINUTE); s -= m * MINUTE;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s && !d) parts.push(`${s}s`);
  return parts.join(" ");
}

/** Parse "1m 30s", "2d23h", "4h", "1d 2h 3m 4s" into seconds; null when it isn't a duration. */
export function parseDuration(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (!/^(\d+(\.\d+)?\s*[dhms]\s*)+$/.test(t)) return null;
  const mult: Record<string, number> = { d: DAY, h: HOUR, m: MINUTE, s: 1 };
  let total = 0;
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*([dhms])/g)) total += Number(m[1]) * (mult[m[2]!] ?? 0);
  return Math.round(total);
}

/** Time after a speed bonus, read as time / (1 + bonus). `bonusPct` is e.g. 25 for +25%. */
export function buffedSeconds(rawSeconds: number, bonusPct: number): number {
  const b = Number.isFinite(bonusPct) && bonusPct > -100 ? bonusPct : 0;
  return rawSeconds / (1 + b / 100);
}
