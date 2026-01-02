import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import crypto from "crypto";

/**
 * Middleware to verify the X-API-Key header.
 * Protects administrative/factory endpoints.
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("X-API-Key");
  const validKey = config.factoryApiKey;

  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  const inputBuffer = Buffer.from(apiKey);
  const validBuffer = Buffer.from(validKey);

  // Constant-time comparison to prevent timing attacks
  const match =
    inputBuffer.length === validBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, validBuffer);

  if (!match) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API Key.",
    });
    return;
  }

  next();
};
