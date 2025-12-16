import express from "express";
import cors from "cors";
import { problemBank } from "./store/ProblemBank.js";
import { ContentPipeline } from "./factory/pipeline.js";
import { MockCritic, MockJudge } from "./factory/generators/fractions.js";
import { EquivFractionGenerator } from "../../src/domain/skills/grade4-fractions.js";
import { DomainGeneratorAdapter } from "./factory/adapters/DomainGeneratorAdapter.js";
import { config } from "./config.js";

// Initialize App
const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Pipeline (Mock for now)
const pipeline = new ContentPipeline(
  new DomainGeneratorAdapter(EquivFractionGenerator),
  new MockCritic(),
  new MockJudge()
);

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
    // Fallback: Generate one using the pipeline (simulated offline factory running online)
    try {
      // Hack: Use Mock Generator skillId just to make it work for demo
      // In real app, we'd lookup generator by skillId
      const newItem = await pipeline.run(config.defaultDifficulty);
      if (newItem) {
        await problemBank.save(newItem);
        problems.push(newItem);
      }
    } catch (e) {
      console.error("Failed to fallback generate:", e);
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
  let { count = 1, difficulty = config.defaultDifficulty } = req.body;

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
