import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimiter } from './rateLimit.js';
import { Request, Response, NextFunction } from 'express';

describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    req = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests under the limit', () => {
    req.ip = '10.0.0.1'; // Unique IP for this test
    rateLimiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block requests over the limit and provide correct retryAfter', () => {
    req.ip = '10.0.0.2'; // Unique IP for this test
    const limit = 100; // Based on the implementation constant

    // Exhaust tokens
    for (let i = 0; i < limit; i++) {
      rateLimiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(limit);

    // Next request should fail
    (next as any).mockClear();

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);

    rateLimiter(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);

    // Window is 60s. 10s passed. Remaining should be 50s.
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too Many Requests',
      retryAfter: 50
    }));
  });

  it('should replenish tokens after window expires', () => {
    req.ip = '10.0.0.3';
    const limit = 100;

    // Exhaust tokens
    for (let i = 0; i < limit; i++) {
      rateLimiter(req as Request, res as Response, next);
    }

    // Advance time by 1 minute + 1 second
    vi.advanceTimersByTime(60 * 1000 + 1000);

    // Should allow request again
    (next as any).mockClear();
    (res.status as any).mockClear();

    rateLimiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject requests without IP', () => {
    req.ip = undefined;
    req.socket = {} as any; // No remoteAddress

    rateLimiter(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Bad Request"
    }));
  });
});
