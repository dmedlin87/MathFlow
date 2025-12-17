/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  SubLikeFractionGenerator,
  SimplifyFractionGenerator,
  EquivFractionGenerator,
  AddLikeFractionGenerator,
  FracMultWholeGenerator,
  FracCompareUnlikeGenerator,
  SKILL_EQUIV_FRACTIONS,
  SKILL_FRAC_MULT_WHOLE,
  SKILL_FRAC_COMPARE_UNLIKE,
  FracDecomposeGenerator,
  AddSubMixedGenerator,
  SKILL_FRAC_DECOMPOSE,
  SKILL_ADD_SUB_MIXED,
  AddTenthsHundredthsGenerator,
  SKILL_ADD_TENTHS_HUNDREDTHS,
} from "./fractions";
import { gcd } from "../../math-utils";

describe("grade4-fractions generators", () => {
  // Helper to create a controllable RNG
  const createMockRng = (sequence: number[]) => {
    let index = 0;
    return () => {
      if (index >= sequence.length) {
        return 0.5; // Default fallback
      }
      return sequence[index++];
    };
  };

  describe("AddLikeFractionGenerator", () => {
    it("generates valid problems for low difficulty", () => {
      // Mock: den -> 0.1 (min approx), num1 -> 0.1, num2 -> 0.1
      const rng = createMockRng([0.1, 0.1, 0.1]);
      const item = AddLikeFractionGenerator.generate(0.1, rng);

      expect(item.meta.skill_id).toBe("frac_add_like_01");
      const qText = item.problem_content.stem;
      expect(qText).toContain("+");

      const ansNum = Number(item.solution_logic.final_answer_canonical);
      const vars = item.problem_content.variables as {
        num1: number;
        num2: number;
        den: number;
      };
      expect(vars.num1 + vars.num2).toBe(ansNum);
      // ansDen is not part of the canon answer because the stem includes the denominator
    });

    it("generates misconceptions for adding denominators", () => {
      const item = AddLikeFractionGenerator.generate(0.1);
      const misc = item.misconceptions?.find(
        (m) => m.error_tag === "add_denominators"
      );
      expect(misc).toBeDefined();

      const vars = item.problem_content.variables as { den: number };
      // Trigger is sum of denominators
      expect(misc?.trigger.value).toBe(String(vars.den + vars.den));
    });
  });

  describe("SubLikeFractionGenerator", () => {
    it("uses smaller ranges when difficulty < 0.5", () => {
      // Mock sequence:
      // 1. den -> 0.999 (max)
      // 2. targetNum -> 0 (min)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0.999, 0, 0]);

      const item = SubLikeFractionGenerator.generate(0.1, rng);

      const qText = item.problem_content.stem;
      const match = qText.match(
        /\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\} = \?\\/
      );
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(10); // max for diff < 0.5 is 10

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
    });

    it("uses larger ranges when difficulty >= 0.5", () => {
      // Mock sequence:
      // 1. den -> 0.999 (max)
      // 2. targetNum -> 0.999 (max)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0.999, 0.999, 0]);

      const item = SubLikeFractionGenerator.generate(0.9, rng);

      const qText = item.problem_content.stem;
      // Note the regex in generator includes = ?\)
      const match = qText.match(
        /\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\} = \?\\/
      );
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(20);
      expect(den).toBeGreaterThanOrEqual(3);

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
    });

    it("defines misconceptions for subtracting denominators or adding denominators", () => {
      // Mock sequence:
      // 1. den -> 0 (min)
      // 2. targetNum -> 0 (min)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0, 0, 0]);

      const item = SubLikeFractionGenerator.generate(0.1, rng);

      const miscSubDen = item.misconceptions?.find(
        (m) => m.error_tag === "sub_num_sub_den"
      );
      const miscAddDen = item.misconceptions?.find(
        (m) => m.error_tag === "sub_num_add_den"
      );

      expect(miscSubDen).toBeDefined();
      expect(miscAddDen).toBeDefined();

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);

      // Verify the trigger values
      // sub_num_sub_den regex: ^ansNum/0$
      expect(miscSubDen?.trigger.kind).toBe("regex");
      expect(miscSubDen?.trigger.value).toBe(`^${ansNum}/0$`);

      // sub_num_add_den regex: ^ansNum/2*den$
      expect(miscAddDen?.trigger.kind).toBe("regex");
      expect(miscAddDen?.trigger.value).toBe(`^${ansNum}/${ansDen + ansDen}$`);
    });
  });

  describe("SimplifyFractionGenerator", () => {
    it("generates a reducible fraction and provides a lowest-terms answer", () => {
      // Mock sequence:
      // 1. numBase -> 0 (min)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.1, rng);

      const qText = item.problem_content.stem;
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const questionNum = Number(match[1]);
      const questionDen = Number(match[2]);
      expect(gcd(questionNum, questionDen)).toBeGreaterThan(1);

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(gcd(ansNum, ansDen)).toBe(1);
      expect(questionNum * ansDen).toBe(questionDen * ansNum);
    });

    it("expands number ranges when difficulty >= 0.5", () => {
      // Mock sequence:
      // 1. numBase -> 0.999 (max)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0.999, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.9, rng);
      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(ansNum).toBeGreaterThan(0);
      expect(ansDen).toBeGreaterThan(ansNum);
    });

    it("defines the no_simplify misconception trigger", () => {
      // Mock sequence:
      // 1. numBase -> 0 (min)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.1, rng);
      const miscNoSimp = item.misconceptions?.find(
        (m) => m.error_tag === "no_simplify"
      );

      expect(miscNoSimp).toBeDefined();

      const qText = item.problem_content.stem;
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      const questionNum = Number(match![1]);
      const questionDen = Number(match![2]);

      expect(miscNoSimp?.trigger.kind).toBe("exact_answer");
      expect(miscNoSimp?.trigger.value).toBe(`${questionNum}/${questionDen}`);
    });
  });

  describe("EquivFractionGenerator", () => {
    it("handles difficulty=0 by defaulting to difficulty level 1", () => {
      const item = EquivFractionGenerator.generate(0);
      // Math.ceil(0 * 5) = 0, so || 1 fallback kicks in
      expect(item.meta.difficulty).toBe(1);
    });

    it("generates valid equivalent fraction problems", () => {
      const item = EquivFractionGenerator.generate(0.1);
      const vars = item.problem_content.variables as {
        baseNum: number;
        baseDen: number;
        multiplier: number;
      };

      expect(item.meta.skill_id).toBe(SKILL_EQUIV_FRACTIONS.id);
      expect(vars.baseNum).toBeGreaterThanOrEqual(1);
    });

    it("uses larger multipliers for high difficulty", () => {
      const rng = createMockRng([0, 0, 0.999]); // multiplier -> max
      const item = EquivFractionGenerator.generate(0.9, rng);
      const vars = item.problem_content.variables as { multiplier: number };

      // At high diff, multiplier is 3-9
      expect(vars.multiplier).toBeGreaterThanOrEqual(3);
    });

    it("identifies additive misconception", () => {
      const item = EquivFractionGenerator.generate(0.5);
      const vars = item.problem_content.variables as {
        baseNum: number;
        baseDen: number;
        targetDen: number;
      };
      const { baseNum, baseDen, targetDen } = vars;
      const diff = targetDen - baseDen;
      const wrongAns = baseNum + diff;

      const misc = item.misconceptions?.find(
        (m) => m.error_tag === "add_num_add_den"
      );
      expect(misc).toBeDefined();
      expect(misc?.trigger.value).toBe(String(wrongAns));
    });
  });

  describe("FracMultWholeGenerator", () => {
    it("generates valid multiplication problems", () => {
      const item = FracMultWholeGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_FRAC_MULT_WHOLE.id);

      const vars = item.problem_content.variables as any;
      const { whole, num, den } = vars;

      // Expected is (whole * num) / den
      const ansParts = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(ansParts[0]).toBe(whole * num);
      expect(ansParts[1]).toBe(den);
    });
  });

  describe("FracCompareUnlikeGenerator", () => {
    it("generates valid comparison logic", () => {
      const item = FracCompareUnlikeGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_FRAC_COMPARE_UNLIKE.id);

      const vars = item.problem_content.variables as any;
      const val1 = vars.num1 / vars.den1;
      const val2 = vars.num2 / vars.den2;

      const symbol = item.solution_logic.final_answer_canonical;

      if (val1 > val2) expect(symbol).toBe(">");
      if (val1 < val2) expect(symbol).toBe("<");
      if (val1 === val2) expect(symbol).toBe("=");
    });
  });
  describe("FracDecomposeGenerator", () => {
    it("generates a decomposition problem", () => {
      const item = FracDecomposeGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_FRAC_DECOMPOSE.id);
      expect(item.problem_content.stem).toContain("Find the missing numerator");

      const vars = item.problem_content.variables as {
        num: number;
        den: number;
        part1: number;
      };
      const ans = Number(item.solution_logic.final_answer_canonical);
      expect(vars.part1 + ans).toBe(vars.num);
    });

    it("ensures parts sum to total numerator", () => {
      const rng = createMockRng([0.5, 0.99, 0.2]); // den=big, num=big, part1=small
      const item = FracDecomposeGenerator.generate(0.5, rng);
      const vars = item.problem_content.variables as {
        num: number;
        den: number;
        part1: number;
      };
      const ans = Number(item.solution_logic.final_answer_canonical);
      expect(vars.part1 + ans).toBe(vars.num);
      // Removed toBeLessThan assertion as num can equal den
    });

    it("defines the sum_equals_product misconception", () => {
      const item = FracDecomposeGenerator.generate(0.5);
      const misc = item.misconceptions?.find((m) => m.id === "misc_sum_prod");
      expect(misc).toBeDefined();

      const vars = item.problem_content.variables as {
        num: number;
        part1: number;
      };
      // Placeholder logic in generator was part1 * num
      expect(misc?.trigger.value).toBe(String(vars.part1 * vars.num));
    });
  });

  describe("AddSubMixedGenerator", () => {
    it("generates valid mixed number addition/subtraction", () => {
      const item = AddSubMixedGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_ADD_SUB_MIXED.id);
      expect(item.problem_content.stem).toContain("Compute");

      const vars = item.problem_content.variables as any;
      const { w1, num1, w2, num2, den, op } = vars;

      const val1 = w1 + num1 / den;
      const val2 = w2 + num2 / den;
      const expected = op === "+" ? val1 + val2 : val1 - val2;

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);

      const ansVal = ansNum / ansDen;
      expect(Math.abs(ansVal - expected)).toBeLessThan(0.001);
    });

    it("handles subtraction with borrowing (implicit via value checks)", () => {
      // Force subtraction: rng <= 0.5
      // Mock values to ensure borrowing scenario if possible,
      // though generator logic currently avoids borrowing by swapping/checking.
      // We'll just verify the result is always positive and correct.

      const rng = createMockRng([0.1]); // subtraction (<= 0.5)
      const item = AddSubMixedGenerator.generate(0.5, rng);

      const vars = item.problem_content.variables as any;
      expect(vars.op).toBe("-");

      // Check result non-negative
      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);
      expect(ansNum / ansDen).toBeGreaterThanOrEqual(0);
    });

    it("handles addition where fraction parts sum >= 1", () => {
      // Force addition: rng > 0.5
      // den=5 (small), num1=4, num2=4 => sum=8/5 > 1
      const rng = createMockRng([0.6, 0.2, 0.5, 0.9, 0.5, 0.9]);
      const item = AddSubMixedGenerator.generate(0.5, rng);
      const vars = item.problem_content.variables as any;
      expect(vars.op).toBe("+");

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);

      // Manual verification
      const val1 = vars.w1 * vars.den + vars.num1;
      const val2 = vars.w2 * vars.den + vars.num2;
      expect(ansNum).toBe(val1 + val2);
      expect(ansDen).toBe(vars.den);
    });
  });

  describe("AddTenthsHundredthsGenerator", () => {
    it("generates a valid addition problem", () => {
      const item = AddTenthsHundredthsGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_ADD_TENTHS_HUNDREDTHS.id);
      expect(item.problem_content.stem).toContain("Add:");

      const vars = item.problem_content.variables as {
        num10: number;
        num100: number;
      };
      const { num10, num100 } = vars;
      expect(num10).toBeDefined();
      expect(num100).toBeDefined();

      const expectedNum = num10 * 10 + num100;
      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical
        .split("/")
        .map(Number);

      expect(ansDen).toBe(100);
      expect(ansNum).toBe(expectedNum);
    });

    it("verifies order logic (tenths first vs hundredths first)", () => {
      // Mock true for order (10 first)
      const rngTrue = createMockRng([0.1, 0.1, 0.6]);
      const item1 = AddTenthsHundredthsGenerator.generate(0.5, rngTrue);
      // stem should have /10 first
      expect(item1.problem_content.stem).toMatch(
        /\\frac\{\d+\}\{10\} \+ \\frac\{\d+\}\{100\}/
      );

      // Mock false for order (100 first)
      const rngFalse = createMockRng([0.1, 0.1, 0.4]);
      const item2 = AddTenthsHundredthsGenerator.generate(0.5, rngFalse);
      // stem should have /100 first
      expect(item2.problem_content.stem).toMatch(
        /\\frac\{\d+\}\{100\} \+ \\frac\{\d+\}\{10\}/
      );
    });

    it("defines the no_simplify / no_convert misconception", () => {
      // num10, num100, order
      const rng = createMockRng([0.1, 0.1, 0.6]);
      const item = AddTenthsHundredthsGenerator.generate(0.5, rng);

      const vars = item.problem_content.variables as {
        num10: number;
        num100: number;
      };
      const wrongNum = vars.num10 + vars.num100; // Added without converting

      const misc = item.misconceptions?.find((m) => m.id === "misc_no_convert");
      expect(misc).toBeDefined();
      expect(misc?.trigger.value).toBe(`${wrongNum}/100`);
    });
  });
});
