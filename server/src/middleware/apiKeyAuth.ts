import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

/**
 * Middleware to verify the X-API-Key header.
 * Protects administrative/factory endpoints.
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("X-API-Key");

  if (!apiKey || apiKey !== config.factoryApiKey) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid X-API-Key header is required to access this endpoint.",
    });
    return;
  }

  next();
};
