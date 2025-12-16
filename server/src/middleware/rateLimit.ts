import { Request, Response, NextFunction } from "express";

interface ClientRecord {
  tokens: number;
  lastRefill: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_TOKENS = 100; // Max requests per window

const clients = new Map<string, ClientRecord>();

// Cleanup interval (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of clients.entries()) {
    // Remove clients that haven't been active for a while (e.g., 2 windows)
    // This prevents premature removal if the cleanup runs exactly at the window boundary
    if (now - record.lastRefill > WINDOW_MS * 2) {
      clients.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref so it doesn't keep the process alive in tests

/**
 * Token Bucket Rate Limiter
 *
 * Implements a simple token bucket algorithm to rate limit requests by IP.
 * - Each IP starts with MAX_TOKENS.
 * - Each request consumes 1 token.
 * - Tokens are reset for each IP when WINDOW_MS has passed since their last refill (fixed window).
 *
 * Note: In a production environment with multiple instances, use Redis.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress;

  if (!ip) {
    res.status(400).json({
      error: "Bad Request",
      message: "Unable to determine client IP address."
    });
    return;
  }

  const now = Date.now();

  let record = clients.get(ip);

  if (!record) {
    record = { tokens: MAX_TOKENS, lastRefill: now };
    clients.set(ip, record);
  } else {
    // Check if window has passed, reset tokens if so
    if (now - record.lastRefill >= WINDOW_MS) {
      record.tokens = MAX_TOKENS;
      record.lastRefill = now;
    }
  }

  if (record.tokens > 0) {
    record.tokens--;
    next();
  } else {
    // Rate limit exceeded
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((record.lastRefill + WINDOW_MS - now) / 1000)
    });
    return;
  }
};
