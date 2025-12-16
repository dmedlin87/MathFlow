import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { rateLimiter } from "./rateLimit.js";
import { Request, Response, NextFunction } from "express";

describe("Rate Limiter Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: "127.0.0.1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket: { remoteAddress: "127.0.0.1" } as any,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // We need to clear the internal state of the rateLimiter module if possible,
    // but since it's a closure in the module scope, we can't easily access the Map.
    // For unit testing, we can use different IPs to simulate fresh clients.
  });

  it("should allow requests under the limit", () => {
    req.ip = "10.0.0.1"; // Unique IP for this test
    rateLimiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block requests over the limit", () => {
    req.ip = "10.0.0.2"; // Unique IP for this test
    const limit = 100; // Based on the implementation constant

    // Exhaust tokens
    for (let i = 0; i < limit; i++) {
      rateLimiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(limit);

    // Next request should fail
    (next as Mock).mockClear();
    rateLimiter(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Too Many Requests",
      })
    );
  });

  it("should replenish tokens after window expires", () => {
    vi.useFakeTimers();
    req.ip = "10.0.0.3";
    const limit = 100;

    // Exhaust tokens
    for (let i = 0; i < limit; i++) {
      rateLimiter(req as Request, res as Response, next);
    }

    // Advance time by 1 minute + 1 second
    vi.advanceTimersByTime(60 * 1000 + 1000);

    // Should allow request again
    (next as Mock).mockClear();
    (res.status as Mock).mockClear();

    rateLimiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
