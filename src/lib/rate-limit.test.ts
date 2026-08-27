import { describe, expect, it, vi } from "vitest";
import { clearRateLimit, rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks afterwards", () => {
    resetRateLimits();
    const results = Array.from({ length: 6 }, () =>
      rateLimit("login:test", 5, 15 * 60 * 1000),
    );

    expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
    expect(results[5].allowed).toBe(false);
    expect(results[5].retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates buckets per key", () => {
    resetRateLimits();
    for (let i = 0; i < 5; i++) rateLimit("login:a", 5, 15 * 60 * 1000);
    expect(rateLimit("login:b", 5, 15 * 60 * 1000).allowed).toBe(true);
    expect(rateLimit("login:a", 5, 15 * 60 * 1000).allowed).toBe(false);
  });

  it("resets the window after it expires", () => {
    resetRateLimits();
    const windowMs = 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    for (let i = 0; i < 5; i++) rateLimit("login:c", 5, windowMs);
    expect(rateLimit("login:c", 5, windowMs).allowed).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);
    expect(rateLimit("login:c", 5, windowMs).allowed).toBe(true);

    vi.useRealTimers();
  });

  it("clearRateLimit drops the bucket — the login success path", () => {
    resetRateLimits();
    for (let i = 0; i < 5; i++) rateLimit("login:d", 5, 15 * 60 * 1000);
    expect(rateLimit("login:d", 5, 15 * 60 * 1000).allowed).toBe(false);

    clearRateLimit("login:d");
    expect(rateLimit("login:d", 5, 15 * 60 * 1000).allowed).toBe(true);

    // Other buckets untouched
    expect(rateLimit("login:e", 5, 15 * 60 * 1000).allowed).toBe(true);
  });
});
