import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 50,
  },
  defaultDifficulty: process.env.DEFAULT_DIFFICULTY
    ? parseFloat(process.env.DEFAULT_DIFFICULTY)
    : 0.5,
};
