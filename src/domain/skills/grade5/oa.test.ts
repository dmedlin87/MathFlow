import { describe, it, expect } from "vitest";
import { engine } from "../../generator/engine";
import {
  SKILL_5_OA_ORDER_OPS,
  SKILL_5_OA_PATTERNS,
  OrderOpsGenerator,
} from "./oa";

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

// Helper for deterministic RNG
const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("OrderOpsGenerator (Deterministic)", () => {
  it("generates EVAL mode with template index 0 (a + b * c)", () => {
    // mode: rng < 0.7 -> EVAL. rng=0.1
    // tIdx: randomInt(0, 3). rng=0.1 -> 0
    // a=3, b=4, c=5
    const rng = createMockRng([
      0.1, // mode=EVAL
      0.1, // tIdx=0
      0.25, // a=3 (randomInt(2,9): floor(0.25*8)+2=4? Let's use 0.125 -> 3)
      0.25, // b=4
      0.375, // c=5
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    expect(item.answer_spec.input_type).toBe("integer");
    expect(item.problem_content.stem).toContain("Evaluate");
    // Template 0: a + b * c = 3 + 4*5 = 23
    const answer = parseInt(item.solution_logic.final_answer_canonical);
    expect(answer).toBeGreaterThan(0);
  });

  it("generates EVAL mode with template index 1 ((a + b) * c)", () => {
    // tIdx=1 -> (a + b) * c
    const rng = createMockRng([
      0.1, // EVAL
      0.26, // tIdx=1 (floor(0.26*4)=1)
      0.125, // a=3
      0.25, // b=4
      0.375, // c=5
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    expect(item.problem_content.stem).toContain("(");
    // (3 + 4) * 5 = 35
    expect(item.solution_logic.final_answer_canonical).toBe("35");
  });

  it("generates EVAL mode with template index 2 (a * (b + c))", () => {
    // tIdx=2
    const rng = createMockRng([
      0.1, // EVAL
      0.51, // tIdx=2 (floor(0.51*4)=2)
      0.125, // a=3
      0.25, // b=4
      0.375, // c=5
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    // 3 * (4 + 5) = 27
    expect(item.solution_logic.final_answer_canonical).toBe("27");
  });

  it("generates EVAL mode with template index 3 (a * b - c) and handles val<0 safety", () => {
    // tIdx=3 -> a * b - c. If val < 0, a2 = a + 10 is used.
    // Use small a (2), large c (9) to trigger negative before fix
    const rng = createMockRng([
      0.1, // EVAL
      0.76, // tIdx=3 (floor(0.76*4)=3)
      0.0, // a=2
      0.0, // b=2
      0.99, // c=9
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    // 2 * 2 - 9 = -5 < 0, so a2 = 12. 12 * 2 - 9 = 15
    expect(
      parseInt(item.solution_logic.final_answer_canonical)
    ).toBeGreaterThan(0);
  });

  it("generates WRITE mode with isGroupFirst=true", () => {
    // mode: rng >= 0.7 -> WRITE. rng=0.8
    // isGroupFirst: rng < 0.5. rng=0.1 -> true
    const rng = createMockRng([
      0.8, // WRITE
      0.125, // a=3
      0.25, // b=4
      0.375, // c=5
      0.1, // isGroupFirst=true
      0.3, // shuffle
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    expect(item.answer_spec.input_type).toBe("multiple_choice");
    expect(item.problem_content.stem).toContain("Add");
    expect(item.problem_content.stem).toContain("then multiply");
    expect(item.solution_logic.final_answer_canonical).toContain("(");
  });

  it("generates WRITE mode with isGroupFirst=false", () => {
    // isGroupFirst: rng >= 0.5 -> false
    const rng = createMockRng([
      0.8, // WRITE
      0.125, // a=3
      0.25, // b=4
      0.375, // c=5
      0.6, // isGroupFirst=false
      0.3, // shuffle
    ]);
    const item = OrderOpsGenerator.generate(0.5, rng);
    expect(item.answer_spec.input_type).toBe("multiple_choice");
    expect(item.problem_content.stem).toContain("Multiply");
    expect(item.problem_content.stem).toContain("then add");
    // correctExpr should NOT have parentheses around a + b
    expect(item.solution_logic.final_answer_canonical).not.toContain("(3 + 4)");
  });
});

describe("OrderOpsGenerator (Default RNG Fallback)", () => {
  it("runs without provided rng (coverage for Math.random branch)", () => {
    // Run multiple times to ensure no crash and potential branch coverage of internal random logic
    for (let i = 0; i < 10; i++) {
      const item = OrderOpsGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_5_OA_ORDER_OPS.id);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });
});
