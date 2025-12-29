import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const factoryApiKey = process.env.FACTORY_API_KEY;

// SECURITY: Enforce strong API key in production
if (isProduction && (!factoryApiKey || factoryApiKey === "test-key-123")) {
  throw new Error(
    "CRITICAL SECURITY ERROR: FACTORY_API_KEY must be set in production and cannot use the default value.",
  );
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 50,
  },
  defaultDifficulty: process.env.DEFAULT_DIFFICULTY
    ? parseFloat(process.env.DEFAULT_DIFFICULTY)
    : 0.5,
  dataPath: process.env.DATA_PATH || "./data/problems.json",
  factoryApiKey: factoryApiKey || "test-key-123", // Default for dev/test only
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : "*", // Default to * for dev/test, but should be set in prod
};
