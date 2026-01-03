import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config.js";

/**
 * Middleware to verify the X-API-Key header.
 * Protects administrative/factory endpoints.
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("X-API-Key");

  if (!apiKey) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  // Security: Use constant-time comparison to prevent timing attacks
  const expectedKey = Buffer.from(config.factoryApiKey);
  const receivedKey = Buffer.from(apiKey);

  if (expectedKey.length !== receivedKey.length) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  if (!crypto.timingSafeEqual(expectedKey, receivedKey)) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  next();
};
