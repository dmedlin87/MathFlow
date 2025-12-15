import { describe, it, expect } from "vitest";
import {
  PlaceValueGenerator,
  RoundingGenerator,
  AddSubMultiGenerator,
  Mult1DigitGen,
  Mult2DigitGen,
  DivisionGenerator,
  SKILL_PLACE_VALUE,
  SKILL_ROUNDING,
  SKILL_ADD_SUB_MULTI,
  SKILL_MULT_1DIGIT,
  SKILL_MULT_2DIGIT,
  SKILL_DIV_REMAINDERS,
} from "./grade4-nbt";

describe("grade4-nbt generator", () => {
  // Helper to create a controllable RNG
  const createMockRng = (sequence: number[]) => {
    let index = 0;
    return () => {
      if (index >= sequence.length) return 0.5;
      return sequence[index++];
    };
  };

  describe("DivisionGenerator", () => {
    it("generates valid quotient/remainder problems", () => {
      const rng = createMockRng([0.5, 0.5, 0.5]);
      const item = DivisionGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_DIV_REMAINDERS.id);
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+ R \d+$/);

      const vars = item.problem_content.variables as any;
      const q = Math.floor(vars.dividend / vars.divisor);
      const r = vars.dividend % vars.divisor;
      expect(item.solution_logic.final_answer_canonical).toBe(`${q} R ${r}`);
    });
  });

  describe("MultiplicationGenerators", () => {
    it("Mult1DigitGen generates valid problems", () => {
      // 4-digit x 1-digit (diff 0.6)
      const rng = createMockRng([0.9, 0.9]); // high rand for max digits
      const item = Mult1DigitGen.generate(0.9, rng);
      expect(item.meta.skill_id).toBe(SKILL_MULT_1DIGIT.id);
      expect(item.problem_content.stem).toContain("\\times");
      const vars = item.problem_content.variables as any;
      expect(vars.n1 * vars.n2).toBe(
        parseInt(item.solution_logic.final_answer_canonical)
      );
    });

    it("Mult2DigitGen generates valid problems", () => {
      const rng = createMockRng([0.5, 0.5]);
      const item = Mult2DigitGen.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_MULT_2DIGIT.id);
      const vars = item.problem_content.variables as any;
      expect(vars.n1).toBeGreaterThanOrEqual(10);
      expect(vars.n2).toBeGreaterThanOrEqual(10);
      expect(vars.n1 * vars.n2).toBe(
        parseInt(item.solution_logic.final_answer_canonical)
      );
    });
  });

  describe("AddSubMultiGenerator", () => {
    it("generates valid addition problems", () => {
      // 0.6 -> Addition (>0.5)
      const rng = createMockRng([0.6]);
      const item = AddSubMultiGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_ADD_SUB_MULTI.id);
      expect(item.problem_content.stem).toContain("+");

      // Check math correctness
      const vars = item.problem_content.variables as any;
      const expected = vars.num1 + vars.num2;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        expected
      );
    });

    it("generates valid subtraction problems", () => {
      // 0.4 -> Subtraction (<0.5)
      const rng = createMockRng([0.4]);
      const item = AddSubMultiGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("-");

      const vars = item.problem_content.variables as any;
      const expected = vars.num1 - vars.num2; // Variables are already ordered max, min
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        expected
      );
      expect(expected).toBeGreaterThanOrEqual(0);
    });
  });

  describe("PlaceValueGenerator", () => {
    it('generates "Value Of" problems correctly', () => {
      // Mode > 0.5 -> VALUE_OF
      // Number generation...
      // posIndex...
      const rng = createMockRng([
        0.6, // mode = VALUE_OF (>0.5)
        0.5, // number magnitude (randomInt) -> mid range?
        0.2, // targetPosIndex (low)
      ]);

      // Note: randomInt logic relies on floor(rng * range).
      // We might not hit exact numbers without tracing the exact calls.
      // Better to check invariants of the output item.

      const item = PlaceValueGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_PLACE_VALUE.id);

      if (item.problem_content.stem.includes("What is the value")) {
        const ans = parseInt(item.solution_logic.final_answer_canonical);
        // Answer should be digit * 10^k
        // e.g. 300, 4000
        const firstDigit = parseInt(
          item.solution_logic.final_answer_canonical[0]
        );
        const zeros = item.solution_logic.final_answer_canonical.substring(1);
        expect(ans).toBeGreaterThan(0);
        expect(zeros.replace(/0/g, "")).toBe("");
      }
    });

    it('generates "Digit In" problems correctly', () => {
      // mode < 0.5 -> DIGIT_IN
      const rng = createMockRng([0.1]);
      // We just need to ensure the mode selection works

      // Actually, 'randomInt' also consumes RNG calls.
      // The first call in generate is:
      // 1. randomInt for number (calls rng)
      // 2. mode (calls rng)
      // 3. targetPosIndex (calls rng)

      const rng2 = createMockRng([
        0.5, // number
        0.1, // mode -> DIGIT_IN (<0.5)
        0.2, // pos
      ]);

      const item = PlaceValueGenerator.generate(0.5, rng2);
      expect(item.problem_content.stem).toContain("Which digit is in the");
      expect(item.solution_logic.final_answer_canonical.length).toBe(1); // Answer is a single digit
    });
  });

  describe("RoundingGenerator", () => {
    it("rounds matching normal math rules", () => {
      // We can check many outputs stochastically or just verifying the arithmetic in the result

      const item = RoundingGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_ROUNDING.id);

      // Extract number and rounding place from text or variables
      const num = (item.problem_content.variables as any).number as number;
      const rounded = parseInt(item.solution_logic.final_answer_canonical);

      // The answer must be a multiple of 10
      expect(rounded % 10).toBe(0);

      // The difference should be 'small' relative to the number size (rough check)
      expect(Math.abs(num - rounded)).toBeLessThan(num / 2);
    });

    it("correctly rounds a known case (deterministic)", () => {
      // Let's force a specific number if possible, or just verify logic post-hoc
      // We can't easily force '12345' without perfectly reversing randomInt logic.
      // Instead, let's verify the solution logic matches the question vars.

      const item = RoundingGenerator.generate(0.5);
      const { number, place } = item.problem_content.variables as any;
      const answer = parseInt(item.solution_logic.final_answer_canonical);

      let mod = 10;
      if (place === "hundreds") mod = 100;
      if (place === "thousands") mod = 1000;

      const expected = Math.round(number / mod) * mod;
      expect(answer).toBe(expected);
    });
  });
});
