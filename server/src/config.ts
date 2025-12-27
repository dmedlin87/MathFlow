import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const factoryApiKey = process.env.FACTORY_API_KEY;

// SECURITY: Enforce strong API key in production
if (isProduction && !factoryApiKey) {
  throw new Error(
    "CRITICAL SECURITY ERROR: FACTORY_API_KEY must be set in production.",
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
  // SECURITY: Require explicit API key, fall back to undefined if not set (which blocks access if middleware checks it)
  // For dev convenience, if not set, user must set it or API will be locked/unusable.
  // Actually, to avoid breaking dev flow, maybe we should NOT have a hardcoded default that works, but rather require it?
  // Let's rely on .env.example having a value or just leave it undefined and let Auth fail if missing.
  // However, existing tests might expect it.
  factoryApiKey: factoryApiKey,
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*", // Default to wildcard string for dev convenience
};
