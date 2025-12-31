import { Request, Response, NextFunction } from "express";

/**
 * Middleware to add security headers to responses.
 *
 * Adds:
 * - X-Content-Type-Options: nosniff (Prevents MIME-sniffing)
 * - X-Frame-Options: DENY (Prevents clickjacking)
 * - Referrer-Policy: strict-origin-when-cross-origin (Controls referrer info)
 * - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (Enforces HTTPS)
 * - Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; (Prevents XSS/Injection)
 * - Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=() (Restricts browser features)
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

  // HSTS: Enforce HTTPS for 2 years, include subdomains, allow preload
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // CSP: Strict policy for API - deny everything by default
  // Since this is an API server, we don't serve HTML/Scripts, so 'none' is safest.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  );

  // Permissions Policy: Disable sensitive features
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()",
  );

  next();
};
