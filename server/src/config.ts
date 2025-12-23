import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Retrieves the Factory API Key based on the environment.
 *
 * Security:
 * - In PRODUCTION, we MUST have a secure key provided via env vars.
 * - In DEV/TEST, we fallback to a default key for convenience.
 */
const getFactoryApiKey = () => {
  if (process.env.FACTORY_API_KEY) {
    return process.env.FACTORY_API_KEY;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "🚨 CRITICAL SECURITY ERROR: FACTORY_API_KEY environment variable is missing in production mode. Server startup aborted."
    );
  }

  // Fallback for development/testing
  return "test-key-123";
};

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 50,
  },
  defaultDifficulty: process.env.DEFAULT_DIFFICULTY
    ? parseFloat(process.env.DEFAULT_DIFFICULTY)
    : 0.5,
  dataPath: process.env.DATA_PATH || "./data/problems.json",
  factoryApiKey: getFactoryApiKey(),
};
