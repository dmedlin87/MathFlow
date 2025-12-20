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
      const rng = createMockRng([0.2, 0.5]); // mode selection, then number selection (candidates[6] = 16)
      const item = FactorsMultiplesGenerator.generate(0.1, rng);

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

    it("covers perfect squares in getFactors", () => {
      // 36 is index 11 in candidates
      // Mode selection: 0.1 -> Mode A
      // Number selection: 11/12.9... something > 11/13?
      // let's use exact index helper if we want but randomInt uses floor(rng * length)
      // candidates.length = 13.
      // randomInt(0, 12, rng) -> floor(rng * 13)
      // floor(0.9 * 13) = 11.
      const rng = createMockRng([0.1, 0.9]);
      const item = FactorsMultiplesGenerator.generate(0.1, rng);
      expect(item.problem_content.variables?.number).toBe(36);
      expect(item.solution_logic.final_answer_canonical).toContain("6");
      // Verify no duplicate 6s
      const factors = item.solution_logic.final_answer_canonical.split(", ");
      const uniqueFactors = new Set(factors);
      expect(factors.length).toBe(uniqueFactors.size);
    });

    it("generates Prime/Composite problems (Prime case)", () => {
      // mode = 0.5 -> difficulty < 0.6 || mode < 0.66 -> Mode B
      // isPrimeTarget = rng() > 0.5. 0.6 > 0.5 -> true.
      // number = primes[randomInt(0, 11, rng)] -> floor(0.1 * 12) = 1. primes[1] = 3.
      const rng = createMockRng([0.5, 0.6, 0.1]);
      const item = FactorsMultiplesGenerator.generate(0.1, rng);
      expect(item.problem_content.stem).toContain("Prime or Composite");
      expect(item.solution_logic.final_answer_canonical).toBe("Prime");
    });

    it("generates Prime/Composite problems (Composite case)", () => {
      // isPrimeTarget = 0.4 > 0.5 -> false.
      // number = composites[randomInt(0, 10, rng)] -> floor(0.1 * 11) = 1. composites[1] = 6.
      const rng = createMockRng([0.5, 0.4, 0.1]);
      const item = FactorsMultiplesGenerator.generate(0.1, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Composite");
    });

    it("triggers FactorsMultiples misconceptions", () => {
      // mode < 0.5 -> Mode A
      const rng = createMockRng([0.1]);
      const item = FactorsMultiplesGenerator.generate(0.1, rng);
      const misc = item.misconceptions.find(
        (m) => m.error_tag === "confuse_factors_multiples"
      );
      expect(misc).toBeDefined();
      if (misc?.trigger.kind === "regex") {
        const number = item.problem_content.variables?.number as number;
        const re = new RegExp(misc.trigger.value);
        expect(re.test(String(number * 2))).toBe(true);
      }

      // Mode B misconception
      // mode = 0.5 -> Mode B
      // isPrimeTarget = 0.4 -> false (Composite)
      // composites[floor(0.1 * 11)] = 6
      const rngB = createMockRng([0.5, 0.4, 0.1]);
      const itemB = FactorsMultiplesGenerator.generate(0.1, rngB);
      const miscB = itemB.misconceptions.find(
        (m) => m.error_tag === "prime_is_odd"
      );
      expect(miscB).toBeDefined();
    });

    it("generates Multiples problems (Mode C)", () => {
      // mode = 0.8 -> Mode C
      // base = randomInt(2, 9) -> floor(0.1 * 8) + 2 = 0 + 2 = 2
      // targetIndex = randomInt(3, 8) -> floor(0.1 * 6) + 3 = 0 + 3 = 3
      const rng = createMockRng([0.8, 0.1, 0.1]);
      const item = FactorsMultiplesGenerator.generate(0.7, rng);
      expect(item.problem_content.stem).toContain("multiple of");
    });

    it("covers difficulty range [0.3, 0.6) in FactorsMultiplesGenerator", () => {
      // difficulty = 0.4
      // mode < 0.5 -> Mode B
      const rngB = createMockRng([0.1]);
      const itemB = FactorsMultiplesGenerator.generate(0.4, rngB);
      expect(itemB.problem_content.stem).toContain("Prime or Composite");

      // mode >= 0.5 -> Mode C
      const rngC = createMockRng([0.6]);
      const itemC = FactorsMultiplesGenerator.generate(0.4, rngC);
      expect(itemC.problem_content.stem).toContain("multiple of");
    });

    it("covers difficulty >= 0.6 in FactorsMultiplesGenerator", () => {
      // should always be Mode C
      const rng = createMockRng([0.1]);
      const item = FactorsMultiplesGenerator.generate(0.8, rng);
      expect(item.problem_content.stem).toContain("multiple of");
    });
  });

  describe("PatternGenerator", () => {
    it("generates valid additive sequence", () => {
      // ruleType = 0.5 > 0.4 -> ADD
      // start = randomInt(1, 10) -> floor(0.1 * 10) + 1 = 1+1 = 2
      // step = randomInt(2, 9) -> floor(0.1 * 8) + 2 = 0+2 = 2
      const rng = createMockRng([0.5, 0.1, 0.1]);
      const item = PatternGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_PATTERNS.id);
      expect(item.problem_content.variables?.rule).toBe("ADD");
      const expected = parseInt(item.solution_logic.final_answer_canonical);
      expect(expected).toBeGreaterThan(
        item.problem_content.variables?.start as number
      );
    });

    it("generates valid subtract sequence", () => {
      // ruleType = 0.3 <= 0.4 -> SUBTRACT
      // start = randomInt(50, 100) -> floor(0.1 * 51) + 50 = 5 + 50 = 55
      // step = randomInt(2, 9) -> floor(0.1 * 8) + 2 = 2
      const rng = createMockRng([0.3, 0.1, 0.1]);
      const item = PatternGenerator.generate(0.5, rng);
      expect(item.problem_content.variables?.rule).toBe("SUBTRACT");
      const expected = parseInt(item.solution_logic.final_answer_canonical);
      expect(expected).toBeLessThan(
        item.problem_content.variables?.start as number
      );
    });
  });

  describe("MultCompareGenerator", () => {
    it("generates valid comparison word problems and covers misconception", () => {
      // factor = randomInt(2, 9) -> 2+0=2
      // baseVal = randomInt(3, 12) -> 3+0=3
      const rng = createMockRng([0.1, 0.1]);
      const item = MultCompareGenerator.generate(0.5, rng);
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

      const misc = item.misconceptions.find(
        (m) => m.error_tag === "additive_comparison"
      );
      expect(misc).toBeDefined();
      expect(misc?.trigger.value).toBe(String(vars.baseVal + vars.factor));
    });
  });

  describe("MultiStepWordGen", () => {
    it("generates arithmetic mode problems", () => {
      // mode = 0.6 > 0.5 -> ARITHMETIC
      // start = randomInt(20, 100) -> 20 + 0 = 20
      // subtract = randomInt(5, 15) -> 5 + 0 = 5
      // divisor = randomInt(3, 8) -> 3 + 0 = 3
      const rng = createMockRng([0.6, 0.1, 0.1, 0.1]);
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
      expect(
        item.misconceptions.some(
          (m) => m.error_tag === "wrong_order_operations"
        )
      ).toBe(true);
    });

    it("generates remainder interpretation problems and covers misconception", () => {
      // mode = 0.2 <= 0.5 -> REMAINDER
      // perGroup = randomInt(4, 9) -> 4
      // numGroups = randomInt(5, 12) -> 5
      // remainder = randomInt(1, perGroup-1) -> 1
      const rng = createMockRng([0.2, 0.1, 0.1, 0.1]);
      const item = MultiStepWordGen.generate(0.5, rng);

      expect(item.problem_content.stem).toContain("vans needed");
      const vars = item.problem_content.variables as {
        total: number;
        perGroup: number;
      };

      const expected = Math.ceil(vars.total / vars.perGroup);
      expect(Number(item.solution_logic.final_answer_canonical)).toBe(expected);

      const misc = item.misconceptions.find(
        (m) => m.error_tag === "ignore_remainder"
      );
      expect(misc).toBeDefined();
      expect(misc?.trigger.value).toBe(
        String(Math.floor(vars.total / vars.perGroup))
      );
    });
  });

  describe("OA Fallback and Edge Case Coverage", () => {
    it("FactorsMultiplesGenerator handles missing RNG", () => {
      const item = FactorsMultiplesGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_FACTORS_MULTIPLES.id);
    });

    it("PatternGenerator handles missing RNG", () => {
      const item = PatternGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_PATTERNS.id);
    });

    it("MultCompareGenerator handles missing RNG", () => {
      const item = MultCompareGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_MULT_COMPARE.id);
    });

    it("MultiStepWordGen handles missing RNG", () => {
      const item = MultiStepWordGen.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_MULTI_STEP_WORD_PROBLEMS.id);
    });
  });
});
