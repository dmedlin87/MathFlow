import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { RateLimiter, MAX_TOKENS, WINDOW_MS } from "./rateLimit.js";
import { Request, Response, NextFunction } from "express";

describe("Rate Limiter Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter();

    req = {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" } as unknown as Request["socket"],
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    limiter.stop();
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    limiter.middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    // Internal check
    const record = limiter.getClient("127.0.0.1");
    expect(record).toBeDefined();
    expect(record?.tokens).toBe(MAX_TOKENS - 1);
  });

  it("should block requests over the limit", () => {
    // Exhaust tokens
    for (let i = 0; i < MAX_TOKENS; i++) {
      limiter.middleware(req as Request, res as Response, next);
    }
    expect(next).toHaveBeenCalledTimes(MAX_TOKENS);

    // Next request should fail
    (next as Mock).mockClear();
    limiter.middleware(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Too Many Requests",
      })
    );
  });

  it("should replenish tokens after window expires", () => {
    // Exhaust
    for (let i = 0; i < MAX_TOKENS; i++) {
      limiter.middleware(req as Request, res as Response, next);
    }

    // Advance time past window
    vi.advanceTimersByTime(WINDOW_MS + 100);

    // Should allow request again
    (next as Mock).mockClear();
    (res.status as Mock).mockClear();

    limiter.middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();

    const record = limiter.getClient("127.0.0.1");
    expect(record?.tokens).toBe(MAX_TOKENS - 1);
  });

  it("should cleanup stale clients", () => {
    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("127.0.0.1")).toBeDefined();

    // Advance time past window + margin
    vi.advanceTimersByTime(WINDOW_MS + 1000);

    // Manually trigger cleanup or wait for interval (interval is 5 min default)
    // We can force it for the test
    limiter.cleanup();

    expect(limiter.getClient("127.0.0.1")).toBeUndefined();
  });

  it("should extract IP from req.socket if req.ip is missing", () => {
    req = {
      socket: { remoteAddress: "10.0.0.5" } as unknown as Request["socket"],
    };

    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("10.0.0.5")).toBeDefined();
  });

  it("should fallback to 'unknown' if no IP available", () => {
    req = {
      socket: {} as unknown as Request["socket"],
    };

    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("unknown")).toBeDefined();
  });
});
