// In-memory fixed-window rate limiter keyed by client address. Expired windows are pruned on
// access (at most once per window), so no timer keeps the process alive.

export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

export class RateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();
  private lastPrune = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  hit(key: string): RateResult {
    const t = this.now();
    this.prune(t);
    let w = this.windows.get(key);
    if (!w || t - w.start >= this.windowMs) {
      w = { start: t, count: 0 };
      this.windows.set(key, w);
    }
    w.count++;
    if (w.count <= this.limit) return { ok: true };
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((w.start + this.windowMs - t) / 1000)) };
  }

  /** Number of tracked keys (for tests). */
  get size(): number {
    return this.windows.size;
  }

  private prune(t: number): void {
    if (t - this.lastPrune < this.windowMs) return;
    this.lastPrune = t;
    for (const [k, w] of this.windows) if (t - w.start >= this.windowMs) this.windows.delete(k);
  }
}
