/**
 * In-memory fixed-window rate limiter.
 *
 * CAVEAT: buckets live in module memory, i.e. PER PROCESS. State IS shared
 * across requests handled by one process (observed with warm `next dev`),
 * but NOT across multiple serverless instances or render workers — so under
 * load the effective limit multiplies. This is a best-effort first layer;
 * swap for Upstash Redis before relying on it in production.
 * Correctness of the bucket logic itself is covered by unit tests.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map does not grow forever.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    lastCleanup = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
