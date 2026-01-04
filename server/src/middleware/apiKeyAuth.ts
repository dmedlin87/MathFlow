import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import crypto from "crypto";

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

  // Use constant-time comparison to prevent timing attacks
  const expectedKey = config.factoryApiKey;
  const bufferApiKey = Buffer.from(apiKey);
  const bufferExpectedKey = Buffer.from(expectedKey);

  // crypto.timingSafeEqual requires buffers of equal length.
  // We check length first. While this technically leaks the length of the valid key,
  // it prevents the error from timingSafeEqual and is generally acceptable for API keys.
  // For higher security, one could hash the inputs first, but that adds overhead.
  let match = false;
  if (bufferApiKey.length === bufferExpectedKey.length) {
    match = crypto.timingSafeEqual(bufferApiKey, bufferExpectedKey);
  }

  if (!match) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  next();
};
