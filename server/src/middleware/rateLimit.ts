import { Request, Response, NextFunction } from "express";

interface ClientRecord {
  tokens: number;
  lastRefill: number;
}

export const WINDOW_MS = 60 * 1000; // 1 minute
export const MAX_TOKENS = 100; // Max requests per window

export class RateLimiter {
  private clients = new Map<string, ClientRecord>();
  private intervalId: NodeJS.Timeout;

  constructor(private checkInterval = 5 * 60 * 1000) {
    this.intervalId = setInterval(() => this.cleanup(), this.checkInterval);
    this.intervalId.unref();
  }

  public cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.clients.entries()) {
      if (now - record.lastRefill > WINDOW_MS) {
        this.clients.delete(ip);
      }
    }
  }

  // Exposed for testing
  public getClient(ip: string): ClientRecord | undefined {
    return this.clients.get(ip);
  }

  public middleware = (req: Request, res: Response, next: NextFunction) => {
    // Determine IP: req.ip is best, fallback to socket, then "unknown"
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();

    let record = this.clients.get(ip);

    if (!record) {
      record = { tokens: MAX_TOKENS, lastRefill: now };
      this.clients.set(ip, record);
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
        retryAfter: Math.ceil((record.lastRefill + WINDOW_MS - now) / 1000),
      });
    }
  };

  // For testing: stop the interval
  public stop() {
    clearInterval(this.intervalId);
  }
}

// Default instance
export const defaultLimiter = new RateLimiter();
export const rateLimiter = defaultLimiter.middleware;
