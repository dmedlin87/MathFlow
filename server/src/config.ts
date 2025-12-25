import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// SECURITY: Enforce strong API key in production
if (isProduction && !process.env.FACTORY_API_KEY) {
  throw new Error(
    "CRITICAL: FACTORY_API_KEY must be set in production environment."
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
  factoryApiKey: process.env.FACTORY_API_KEY || "test-key-123", // Default for dev
};
