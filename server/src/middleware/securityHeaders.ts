import { Request, Response, NextFunction } from "express";

/**
 * Middleware to add security headers to responses.
 *
 * Adds:
 * - X-Content-Type-Options: nosniff (Prevents MIME-sniffing)
 * - X-Frame-Options: DENY (Prevents clickjacking)
 * - Referrer-Policy: strict-origin-when-cross-origin (Controls referrer info)
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Remove X-Powered-By (redundant if app.disable is used, but robust)
  res.removeHeader("X-Powered-By");

  next();
};
