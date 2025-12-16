import express from "express";
import cors from "cors";
import { problemBank } from "./store/ProblemBank.js";
import { ContentPipeline } from "./factory/pipeline.js";
import { MockCritic, MockJudge } from "./factory/generators/fractions.js";
import { skillGeneratorMap } from "../../src/domain/skills/generatorMap.js";
import { DomainGeneratorAdapter } from "./factory/adapters/DomainGeneratorAdapter.js";
import { config } from "./config.js";
import type { Generator } from "../../src/domain/types.js";

// Initialize App
const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());

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
app.get("/api/problems", async (req, res) => {
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
      try {
        const pipeline = createPipeline(generator);
        const newItem = await pipeline.run(config.defaultDifficulty);
        if (newItem) {
          await problemBank.save(newItem);
          problems.push(newItem);
        }
      } catch (e) {
        console.error("Failed to fallback generate:", e);
      }
    } else {
      console.warn(`No generator found for skillId: ${skillId}`);
    }
  }

  res.json(problems);
});

/**
 * POST /api/factory/run
 * Manually trigger the offline factory to generate items.
 * Body: { skillId, count, difficulty }
 */
app.post("/api/factory/run", async (req, res) => {
  let { skillId, count = 1, difficulty = config.defaultDifficulty } = req.body;

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
});

// Start Server
app.listen(port, () => {
  console.log(`MathFlow Server running at http://localhost:${port}`);
});
