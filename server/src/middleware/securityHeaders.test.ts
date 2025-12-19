import { describe, it, expect, vi } from "vitest";
import { securityHeaders } from "./securityHeaders.js";
import { Request, Response, NextFunction } from "express";

describe("securityHeaders middleware", () => {
  it("should set security headers and call next", () => {
    const req = {} as Request;
    const res = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );
    expect(res.removeHeader).toHaveBeenCalledWith("X-Powered-By");
    expect(next).toHaveBeenCalled();
  });
});
