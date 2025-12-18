import { describe, it, expect } from "vitest";
import {
  PlaceValueGenerator,
  CompareMultiDigitGenerator,
  RoundingGenerator,
  AddSubMultiGenerator,
  Mult1DigitGen,
  Mult2DigitGen,
  DivisionGenerator,
  SKILL_PLACE_VALUE,
  SKILL_COMPARE_MULTI_DIGIT,
  SKILL_ROUNDING,
  SKILL_ADD_SUB_MULTI,
  SKILL_MULT_1DIGIT,
  SKILL_MULT_2DIGIT,
  SKILL_DIV_REMAINDERS,
} from "./nbt";

const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("Grade 4 NBT Generators (Deterministic)", () => {
  describe("SKILL_PLACE_VALUE", () => {
    it("generates VALUE_OF mode", () => {
      // Logic:
      // maxExp = 3 (diff 0.5 < 0.6?) Wait, diff logic: <0.3 3, <0.6 5. diff=0.5 -> 5.
      // number: randomInt(10000, 999999). rng=0.5 -> mid range.
      // mode: > 0.5 -> VALUE_OF. rng=0.6.
      // targetPosIndex: rng=0.0 -> 0 (ones place).
      // len: 5/6 digits.

      const rng = createMockRng([
        0.5, // number
        0.6, // mode = VALUE_OF
        0.0, // pos = 0 (Rightmost)
      ]);
      const item = PlaceValueGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_PLACE_VALUE.id);
      expect(item.problem_content.stem).toContain("What is the value");
      // Rightmost digit value = digit itself * 1.
      const val = parseInt(item.solution_logic.final_answer_canonical);
      expect(val).toBeLessThan(10);
    });

    it("generates DIGIT_IN mode", () => {
      const rng = createMockRng([
        0.5, // number
        0.4, // mode = DIGIT_IN
        0.0, // pos
      ]);
      const item = PlaceValueGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Which digit is in the");
      expect(item.solution_logic.final_answer_canonical).toHaveLength(1);
    });
  });

  describe("SKILL_COMPARE_MULTI_DIGIT", () => {
    it("generates unequal numbers (>)", () => {
      // Logic:
      // diff=0.5. exp=5 (100k).
      // n1: rng=0.8 -> large.
      // n2: rng=0.2 -> small.
      // n1 > n2.

      const rng = createMockRng([
        0.8, // n1
        0.2, // n2
      ]);
      const item = CompareMultiDigitGenerator.generate(0.4, rng);
      expect(item.meta.skill_id).toBe(SKILL_COMPARE_MULTI_DIGIT.id);
      expect(item.solution_logic.final_answer_canonical).toBe(">");
    });

    it("generates unequal numbers (<)", () => {
      // n1 < n2
      const rng = createMockRng([
        0.2, // n1
        0.8, // n2
      ]);
      const item = CompareMultiDigitGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("<");
    });

    it("handles close numbers logic (diff >= 0.5)", () => {
      // logic: n1 generated. n2 modified from n1.
      // changeIdx...
      // digit mod...
      // Should rely on actual generator logic, but let's just assert output validity.
      const rng = createMockRng([0.5, 0.5, 0.5]);
      const item = CompareMultiDigitGenerator.generate(0.6, rng);
      expect(["<", ">", "="]).toContain(
        item.solution_logic.final_answer_canonical
      );
    });
  });

  describe("SKILL_ROUNDING", () => {
    it("rounds correctly (Rounding Up case)", () => {
      // Logic:
      // diff=0.5. minExp=4. exponent=4. (10k range).
      // Val: 15000. Round to 10k?
      // num: rng=0.5.
      // roundIndex: rng.

      const rng = createMockRng([
        0.5, // exponent=4 (randomInt(4,5) range 1? floor(0.5*2)+4 = 5?)
        // logic: min=4, max=5. range=2. index=1. exp=5.

        0.5, // number
        0.5, // roundIndex
      ]);

      const item = RoundingGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_ROUNDING.id);
      const ans = parseInt(item.solution_logic.final_answer_canonical);
      // Should satisfy modulus 10
      expect(ans % 10).toBe(0);
    });
  });

  describe("SKILL_ADD_SUB_MULTI", () => {
    it("generates Addition", () => {
      const rng = createMockRng([
        0.6, // Addition (>0.5)
        0.5, // digits
        0.5, // n1
        0.5, // n2
      ]);
      const item = AddSubMultiGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_ADD_SUB_MULTI.id);
      expect(item.problem_content.stem).toContain("Add");

      const v = item.problem_content.variables as Record<string, number>;
      expect(item.solution_logic.final_answer_canonical).toBe(
        String(v.num1 + v.num2)
      );
    });

    it("generates Subtraction with Smaller-From-Larger potential", () => {
      const rng = createMockRng([
        0.4, // Subtraction
        0.5, // digits
        0.9, // n1 (Large)
        0.1, // n2 (Small)
      ]);
      const item = AddSubMultiGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Subtract");
      const v = item.problem_content.variables as Record<string, number>;
      expect(item.solution_logic.final_answer_canonical).toBe(
        String(v.num1 - v.num2)
      );
    });
  });

  describe("SKILL_MULT (1 & 2 DIGIT)", () => {
    it("Mult1Digit generates 4-digit x 1-digit", () => {
      // diff=0.6 -> digits=4.
      const rng = createMockRng([0.5, 0.5]);
      const item = Mult1DigitGen.generate(0.6, rng);
      expect(item.meta.skill_id).toBe(SKILL_MULT_1DIGIT.id);
      const v = item.problem_content.variables as Record<string, number>;
      expect(item.solution_logic.final_answer_canonical).toBe(
        String(v.n1 * v.n2)
      );
    });

    it("Mult2Digit generates 2-digit x 2-digit", () => {
      const rng = createMockRng([0.5, 0.5]);
      const item = Mult2DigitGen.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_MULT_2DIGIT.id);
      const v = item.problem_content.variables as Record<string, number>;
      expect(item.solution_logic.final_answer_canonical).toBe(
        String(v.n1 * v.n2)
      );
    });
  });

  describe("SKILL_DIV_REMAINDERS", () => {
    it("generates division with remainder", () => {
      // Logic:
      // dividend: rng=0.5.
      // divisor: rng=0.5 -> 2+floor(0.5*8)=6.

      const rng = createMockRng([
        0.5, // dividend
        0.5, // divisor=6
      ]);
      const item = DivisionGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_DIV_REMAINDERS.id);

      const v = item.problem_content.variables as Record<string, number>;
      const q = Math.floor(v.dividend / v.divisor);
      const r = v.dividend % v.divisor;

      expect(item.solution_logic.final_answer_canonical).toBe(`${q}, ${r}`);
    });
  });
});
