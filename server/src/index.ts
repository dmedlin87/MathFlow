import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import { problemBank } from "./store/ProblemBank.js";
import { ContentPipeline } from "./factory/pipeline.js";
import { MockCritic, MockJudge } from "./factory/generators/fractions.js";
import { skillGeneratorMap } from "@domain/skills/generatorMap.js";
import { DomainGeneratorAdapter } from "./factory/adapters/DomainGeneratorAdapter.js";
import { config } from "./config.js";
import { rateLimiter } from "./middleware/rateLimit.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import type { Generator } from "@domain/types.js";

// Initialize App
export const app = express();
const port = config.port;

// Middleware
app.use(securityHeaders); // Security: Add defensive headers
app.use(compression()); // Performance: Compress responses (GZIP)
app.use(cors());
app.use(express.json({ limit: "10kb" })); // Security: Limit payload size to prevent DoS
app.disable("x-powered-by"); // Security: Hide server info
app.use(rateLimiter); // Security: Rate limiting to prevent DoS

// Helper to create pipeline for a specific generator
const createPipeline = (generator: Generator) => {
  return new ContentPipeline(
    new DomainGeneratorAdapter(generator),
    new MockCritic(), // In real app, these might vary by skill too
    new MockJudge()
  );
};

// Routes

/**
 * GET /api/problems
 * Fetch verified problems for a skill.
 * Query: skillId (required), limit (optional)
 */
export const getProblems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skillId, limit } = req.query;

    if (!skillId || typeof skillId !== "string") {
      res.status(400).json({ error: "Missing or invalid skillId" });
      return;
    }

    // Input validation: Limit max items to 50 to prevent DoS
    let max = limit ? parseInt(limit as string) : 1;
    if (isNaN(max) || max < 1) max = 1;
    if (max > config.rateLimit.max) max = config.rateLimit.max;

    const problems = await problemBank.fetch(skillId, max);

    // If no problems found, try to generate one on the fly (Just-in-Time for V0 Prototype)
    if (problems.length === 0) {
      const generator = skillGeneratorMap.get(skillId);
      if (generator) {
        const pipeline = createPipeline(generator);
        const newItem = await pipeline.run(config.defaultDifficulty);
        if (newItem) {
          await problemBank.save(newItem);
          problems.push(newItem);
        }
      } else {
        console.warn(`No generator found for skillId: ${skillId}`);
      }
    }

    res.json(problems);
  } catch (err) {
    next(err);
  }
};

app.get("/api/problems", getProblems);

/**
 * POST /api/factory/run
 * Manually trigger the offline factory to generate items.
 * Body: { skillId, count, difficulty }
 */
export const runFactory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skillId } = req.body;
    let { count = 1, difficulty = config.defaultDifficulty } = req.body;

    if (!skillId || typeof skillId !== "string") {
      res.status(400).json({ error: "Missing skillId" });
      return;
    }

    const generator = skillGeneratorMap.get(skillId);
    if (!generator) {
      res
        .status(404)
        .json({ error: `Generator not found for skill: ${skillId}` });
      return;
    }

    const pipeline = createPipeline(generator);

    // Security: Input validation
    if (typeof count !== "number" || count < 1) count = 1;
    if (count > config.rateLimit.max) count = config.rateLimit.max; // Cap at 50 to prevent DoS
    if (typeof difficulty !== "number") difficulty = config.defaultDifficulty;
    difficulty = Math.max(0, Math.min(1, difficulty)); // Clamp 0-1

    const generated = [];

    for (let i = 0; i < count; i++) {
      const item = await pipeline.run(difficulty);
      if (item) {
        await problemBank.save(item);
        generated.push(item);
      }
    }

    res.json({
      success: true,
      count: generated.length,
      items: generated,
    });
  } catch (err) {
    next(err);
  }
};

app.post("/api/factory/run", apiKeyAuth, runFactory);

// Global Error Handler
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err); // Log generic info
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`MathFlow Server running at http://localhost:${port}`);
  });
}
