import { describe, it, expect } from "vitest";
import {
  DivFractionsGenerator,
  MultiDigitDivGenerator,
  DecimalOpsGenerator,
  GcfLcmGenerator,
  IntegersGenerator,
  RationalNumberLineGenerator,
  CoordPlaneGenerator,
  SKILL_6_NS_DIV_FRACTIONS,
  SKILL_6_NS_DECIMAL_OPS,
  SKILL_6_NS_INTEGERS,
} from "./grade6-ns";
import { gcd } from "../math-utils";

describe("Grade 6 NS Generators", () => {
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

  describe("DivFractionsGenerator", () => {
    it("generates valid division problems with simplified answers", () => {
      // Mock: b=4, d=2, a=3, c=1 (rng ranges tuned)
      // b: 2..8_0.3 -> 2+floor(0.3*7)=4.
      // d: 2..8_0.0 -> 2.
      // a: 1..3_0.9 -> 3.
      // c: 1..1_0.9 -> 1.
      // Problem: 3/4 / 1/2
      // Result: (3*2)/(4*1) = 6/4 = 3/2.
      const rng = createMockRng([0.3, 0.0, 0.9, 0.9]);
      const item = DivFractionsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_NS_DIV_FRACTIONS.id);

      expect(item.problem_content.stem).toContain(
        "\\frac{3}{4} \\div \\frac{1}{2}"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("3/2");
    });

    it("defines the invert_dividend misconception", () => {
      // Mock same values: 3/4 / 1/2
      const rng = createMockRng([0.3, 0.0, 0.9, 0.9]);
      const item = DivFractionsGenerator.generate(0.5, rng);

      const misc = item.misconceptions?.find((m) => m.id === "misc_inv_div");
      expect(misc).toBeDefined();

      // Invert dividend means: (4/3) * (1/2)? Or 3/4 * ??
      // Logic: (b*c)/(a*d) reciprocal of answer
      // Answer is 3/2. Reciprocal 2/3.
      expect(misc?.trigger.value).toBe("2/3");
    });
  });

  describe("MultiDigitDivGenerator", () => {
    it("generates valid problems", () => {
      // divisor: 12..99_0.0 -> 12
      // quotient: 100..999_0.0 -> 100
      // dividend: 1200
      const rng = createMockRng([0.0, 0.0]);
      const item = MultiDigitDivGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("1200 \\div 12");
      expect(item.solution_logic.final_answer_canonical).toBe("100");
    });
  });

  describe("DecimalOpsGenerator", () => {
    it("handles Addition (op=0)", () => {
      // op: 0
      // a: 10..500/100 -> 0.1 -> 1.0 + floor(0.1*491)/100 ~~
      // Let's rely on computed values from vars
      const rng = createMockRng([0.0, 0.5, 0.5]); // op=0 (add)
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("+");

      const ans = Number(item.solution_logic.final_answer_canonical);
      // We can extract operands from stem if needed, or trust the math logic
      // "12.34 + 5.67 ="
      const match = item.problem_content.stem.match(
        /\$([\d.]+) \+ ([\d.]+) = \?\$/
      );
      expect(match).not.toBeNull();
      if (match) {
        const sum = Number(match[1]) + Number(match[2]);
        expect(ans).toBeCloseTo(sum, 5);
      }
    });

    it("handles Subtraction (op=1) with ordering", () => {
      // op: 0.3 * 3 = 0.9 -> floor -> 0? range 0..3
      // 0..3: rng*4. 0.3*4 = 1.2 -> 1.
      const rng = createMockRng([0.3, 0.1, 0.9]); // op=1 (sub), a=low, b=high
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("-");

      const match = item.problem_content.stem.match(
        /\$([\d.]+) - ([\d.]+) = \?\$/
      );
      if (match) {
        const high = Number(match[1]);
        const low = Number(match[2]);
        expect(high).toBeGreaterThanOrEqual(low);
        const ans = Number(item.solution_logic.final_answer_canonical);
        expect(ans).toBeCloseTo(high - low, 5);
      }
    });

    it("handles Multiplication (op=2)", () => {
      // 0.6*4 = 2.4 -> 2.
      const rng = createMockRng([0.6, 0.5, 0.5]);
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("\\times");

      const match = item.problem_content.stem.match(
        /\$([\d.]+) \\times ([\d.]+) = \?\$/
      );
      if (match) {
        const prod = Number(match[1]) * Number(match[2]);
        const ans = Number(item.solution_logic.final_answer_canonical);
        expect(ans).toBeCloseTo(prod, 5);
      }
    });

    it("handles Division (op=3)", () => {
      // 0.9*4 = 3.6 -> 3.
      const rng = createMockRng([0.9, 0.5, 0.5, 0.5]);
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("\\div");

      const match = item.problem_content.stem.match(
        /\$([\d.]+) \\div ([\d.]+) = \?\$/
      );
      if (match) {
        const q = Number(match[1]) / Number(match[2]);
        const ans = Number(item.solution_logic.final_answer_canonical);
        expect(ans).toBeCloseTo(q, 5);
      }
    });
  });

  describe("GcfLcmGenerator", () => {
    it("generates GCF", () => {
      const rng = createMockRng([0.1, 0.5, 0.5]); // type<0.5 -> GCF
      const item = GcfLcmGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Greatest Common Factor");
    });
    it("generates LCM", () => {
      const rng = createMockRng([0.9, 0.5, 0.5]); // type>0.5 -> LCM
      const item = GcfLcmGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Least Common Multiple");
    });
  });

  describe("IntegersGenerator", () => {
    it("generates opposites (Type 0)", () => {
      const rng = createMockRng([0.1, 0.1]); // type=0
      const item = IntegersGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("opposite of");
    });

    it("generates context problems (Type 1)", () => {
      const rng = createMockRng([0.9, 0.5, 0.5]); // type=1
      const item = IntegersGenerator.generate(0.5, rng);
      // Could be temp or football
      const isTemp = item.problem_content.stem.includes("temperature");
      const isFootball = item.problem_content.stem.includes("football");
      expect(isTemp || isFootball).toBe(true);

      // Both use negative answer
      const ans = Number(item.solution_logic.final_answer_canonical);
      expect(ans).toBeLessThan(0);
    });
  });

  describe("RationalNumberLineGenerator", () => {
    it("compares two numbers correctly", () => {
      const rng = createMockRng([0.5, 0.9]); // a, b
      const item = RationalNumberLineGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("greater");
      const ans = Number(item.solution_logic.final_answer_canonical);

      const match = item.problem_content.stem.match(
        /\$(-?[\d.]+)\$ or \$(-?[\d.]+)\$/
      );
      if (match) {
        const v1 = Number(match[1]);
        const v2 = Number(match[2]);
        expect(ans).toBe(Math.max(v1, v2));
      }
    });
  });

  describe("CoordPlaneGenerator", () => {
    it("identifies quadrants correctly", () => {
      // x=-5, y=5 -> II
      // x: -10..10. 0.25 -> -10 + 5 = -5
      // y: -10..10. 0.75 -> -10 + 15 = 5
      const rng = createMockRng([0.25, 0.75]);

      const item = CoordPlaneGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("II");
    });
  });
});
