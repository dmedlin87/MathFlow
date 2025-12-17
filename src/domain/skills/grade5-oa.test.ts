import { describe, it, expect } from "vitest";
import { engine } from "../generator/engine";
import { SKILL_5_OA_ORDER_OPS, SKILL_5_OA_PATTERNS } from "./grade5-oa";

// Simple Linear Congruential Generator for deterministic testing
const createSeededRng = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

describe("Grade 5 OA Domain", () => {
  const generate = async (skillId: string, rng: () => number) => {
    return await engine.generate(skillId, 0.5, rng);
  };

  describe("SKILL_5_OA_ORDER_OPS", () => {
    it("generates valid problems", async () => {
      const rng = createSeededRng(12345);
      for (let i = 0; i < 20; i++) {
        const problem = await generate(SKILL_5_OA_ORDER_OPS.id, rng);
        expect(problem.meta.skill_id).toBe(SKILL_5_OA_ORDER_OPS.id);

        const val = problem.solution_logic.final_answer_canonical;
        if (problem.answer_spec.input_type === "integer") {
          expect(parseInt(val)).toBeGreaterThanOrEqual(0);
        } else {
          // multiple_choice (expression parsing)
          expect(val.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("SKILL_5_OA_PATTERNS", () => {
    it("generates valid problems", async () => {
      const rng = createSeededRng(67890);
      for (let i = 0; i < 20; i++) {
        const problem = await generate(SKILL_5_OA_PATTERNS.id, rng);
        expect(problem.meta.skill_id).toBe(SKILL_5_OA_PATTERNS.id);

        // Fix: Check type before parsing, as some modes return expressions (strings)
        if (problem.solution_logic.final_answer_type === "numeric") {
          const val = parseInt(problem.solution_logic.final_answer_canonical);
          expect(val).toBeGreaterThanOrEqual(0);
        } else {
          expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
          expect(typeof problem.solution_logic.final_answer_canonical).toBe(
            "string"
          );
        }
      }
    });
  });
});
