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

  it("should include retryAfter seconds based on remaining window", () => {
    vi.setSystemTime(0);
    for (let i = 0; i < MAX_TOKENS; i++) {
      limiter.middleware(req as Request, res as Response, next);
    }

    vi.advanceTimersByTime(1500);
    (res.status as Mock).mockClear();
    (res.json as Mock).mockClear();
    (next as Mock).mockClear();

    limiter.middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: Math.ceil((WINDOW_MS - 1500) / 1000),
      })
    );
  });

  it("should report retryAfter as 1 when one second remains", () => {
    vi.setSystemTime(0);
    for (let i = 0; i < MAX_TOKENS; i++) {
      limiter.middleware(req as Request, res as Response, next);
    }

    vi.setSystemTime(WINDOW_MS - 1);
    (res.status as Mock).mockClear();
    (res.json as Mock).mockClear();
    (next as Mock).mockClear();

    limiter.middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 1,
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

  it("should only cleanup clients past the window", () => {
    vi.setSystemTime(0);
    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("127.0.0.1")).toBeDefined();

    vi.setSystemTime(WINDOW_MS - 1);
    req = {
      ip: "10.0.0.2",
      socket: { remoteAddress: "10.0.0.2" } as unknown as Request["socket"],
    };
    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("10.0.0.2")).toBeDefined();

    vi.setSystemTime(WINDOW_MS + 1);
    limiter.cleanup();

    expect(limiter.getClient("127.0.0.1")).toBeUndefined();
    expect(limiter.getClient("10.0.0.2")).toBeDefined();
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

  it("should use socket.remoteAddress if req.ip is an empty string", () => {
    req = {
      ip: "",
      socket: { remoteAddress: "192.168.1.1" } as unknown as Request["socket"],
    };

    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("192.168.1.1")).toBeDefined();
    expect(limiter.getClient("")).toBeUndefined();
  });

  it("should replenish tokens exactly at WINDOW_MS", () => {
    vi.setSystemTime(0);
    limiter.middleware(req as Request, res as Response, next);

    // Exhaust tokens
    for (let i = 0; i < MAX_TOKENS - 1; i++) {
      limiter.middleware(req as Request, res as Response, next);
    }

    const record = limiter.getClient("127.0.0.1");
    expect(record?.tokens).toBe(0);

    // Advance to exactly WINDOW_MS
    vi.setSystemTime(WINDOW_MS);
    (next as Mock).mockClear();
    limiter.middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(record?.tokens).toBe(MAX_TOKENS - 1);
  });

  it("should trigger cleanup via interval", () => {
    // Add a client
    limiter.middleware(req as Request, res as Response, next);
    expect(limiter.getClient("127.0.0.1")).toBeDefined();

    // Advance time past window AND past default checkInterval (5 mins)
    vi.advanceTimersByTime(5 * 60 * 1000 + 100);

    // The interval should have fired and cleaned up the stale client
    expect(limiter.getClient("127.0.0.1")).toBeUndefined();
  });

  it("should handle rapid-fire requests exactly at the limit", () => {
    const rapidNext = vi.fn();
    for (let i = 0; i < MAX_TOKENS; i++) {
      limiter.middleware(req as Request, res as Response, rapidNext);
    }
    expect(rapidNext).toHaveBeenCalledTimes(MAX_TOKENS);

    rapidNext.mockClear();
    limiter.middleware(req as Request, res as Response, rapidNext);
    expect(rapidNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
