import { describe, it, expect } from "vitest";
import {
  FactorsMultiplesGenerator,
  PatternGenerator,
  MultCompareGenerator,
  MultiStepWordGen,
  SKILL_FACTORS_MULTIPLES,
  SKILL_PATTERNS,
  SKILL_MULT_COMPARE,
  SKILL_MULTI_STEP_WORD_PROBLEMS,
} from "./oa";

describe("grade4-oa generator", () => {
  // Helper to create a controllable RNG
  const createMockRng = (sequence: number[]) => {
    let index = 0;
    return () => {
      if (index >= sequence.length) return 0.5;
      return sequence[index++];
    };
  };

  describe("FactorsMultiplesGenerator", () => {
    it("generates List Factors problems correctly", () => {
      // Mode < 0.3 -> List Factors
      const rng = createMockRng([0.2, 0.5]); // mode selection, then number selection
      const item = FactorsMultiplesGenerator.generate(0.2, rng);

      expect(item.meta.skill_id).toBe(SKILL_FACTORS_MULTIPLES.id);
      expect(item.problem_content.stem).toContain("List all factors");

      const vars = item.problem_content.variables as { number: number };
      const number = vars.number;
      const answerStr = item.solution_logic.final_answer_canonical;
      const factors = answerStr.split(", ").map(Number);

      // Check correctness
      factors.forEach((f) => {
        expect(number % f).toBe(0);
      });
      expect(factors).toContain(1);
      expect(factors).toContain(number);
    });

    it("generates Prime/Composite problems", () => {
      // Mode Mid -> Prime/Composite
      const rng = createMockRng([0.5, 0.6]); // mid mode, prime target
      const item = FactorsMultiplesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Prime or Composite");
    });

    it("generates Multiples problems (Mode C)", () => {
      // Mode > 0.66 -> Multiples
      // difficulty >= 0.6 to avoid forcing lower modes
      const rng = createMockRng([0.8, 0, 0]); // mode > 0.66
      const item = FactorsMultiplesGenerator.generate(0.7, rng);

      expect(item.problem_content.stem).toContain("multiple of");
    });
  });

  describe("PatternGenerator", () => {
    it("generates valid additive sequence", () => {
      // >0.4 -> ADD
      const rng = createMockRng([0.5, 0.1, 0.1]);
      const item = PatternGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_PATTERNS.id);

      const vars = item.problem_content.variables as {
        rule: string;
        start: number;
        step: number;
      };
      expect(vars.rule).toBe("ADD");

      const expected = parseInt(item.solution_logic.final_answer_canonical);
      const start = vars.start;
      // const step = vars.step; // Unused
      // 6 steps total loops in generator, stem shows 6 terms?
      // Loop: i=0 to 5. sequence pushes 6 terms.
      // step 1: current = start. push start. current+=step.
      // final current = start + 6*step.
      // The explanation says apply rule to last number.

      // Just verifying it's numeric and non-zero
      expect(expected).toBeGreaterThan(start);
    });

    it("generates valid subtract sequence", () => {
      // rng <= 0.4 -> SUBTRACT
      const rng = createMockRng([0.3, 0.1, 0.1]);
      const item = PatternGenerator.generate(0.5, rng);

      const vars = item.problem_content.variables as {
        rule: string;
        start: number;
        step: number;
      };
      expect(vars.rule).toBe("SUBTRACT");

      const expected = parseInt(item.solution_logic.final_answer_canonical);
      // Sequence should decrease
      expect(expected).toBeLessThan(vars.start);
    });
  });

  describe("MultCompareGenerator", () => {
    it("generates valid comparison word problems", () => {
      const item = MultCompareGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_MULT_COMPARE.id);
      expect(item.problem_content.stem).toContain("times as many");

      const vars = item.problem_content.variables as {
        baseVal: number;
        factor: number;
      };
      const expected = vars.baseVal * vars.factor;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        expected
      );
    });
  });

  describe("MultiStepWordGen", () => {
    it("generates arithmetic mode problems", () => {
      const rng = createMockRng([0.6]); // > 0.5 -> ARITHMETIC
      const item = MultiStepWordGen.generate(0.5, rng);

      expect(item.meta.skill_id).toBe(SKILL_MULTI_STEP_WORD_PROBLEMS.id);
      expect(item.problem_content.stem).toContain("stickers");

      const vars = item.problem_content.variables as {
        start: number;
        subtract: number;
        divisor: number;
      };

      const expected = (vars.start - vars.subtract) / vars.divisor;
      expect(Number(item.solution_logic.final_answer_canonical)).toBe(expected);
    });

    it("generates remainder interpretation problems", () => {
      const rng = createMockRng([0.2]); // < 0.5 -> REMAINDER
      const item = MultiStepWordGen.generate(0.5, rng);

      expect(item.problem_content.stem).toContain("vans needed");
      const vars = item.problem_content.variables as {
        total: number;
        perGroup: number;
      };

      const expected = Math.ceil(vars.total / vars.perGroup);
      expect(Number(item.solution_logic.final_answer_canonical)).toBe(expected);
    });
  });
});
