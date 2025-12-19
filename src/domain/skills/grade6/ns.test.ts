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
} from "./ns";

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
      // a, b unused (0.5, 0.5)
      // f1: 0.5
      // f2: 0.5
      const rng = createMockRng([0.6, 0.5, 0.5, 0.5, 0.5]);
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
      // a, b unused (0.5, 0.5)
      // quotient: 0.5
      // divisor: 0.5
      // divType: 0.5
      const rng = createMockRng([0.9, 0.5, 0.5, 0.5, 0.5]);
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
      const rngII = createMockRng([0.25, 0.75]);
      expect(
        CoordPlaneGenerator.generate(0.5, rngII).solution_logic
          .final_answer_canonical
      ).toBe("II");

      // x=5, y=5 -> I
      // x: 0.75 -> 5
      // y: 0.75 -> 5
      const rngI = createMockRng([0.75, 0.75]);
      expect(
        CoordPlaneGenerator.generate(0.5, rngI).solution_logic
          .final_answer_canonical
      ).toBe("I");

      // x=-5, y=-5 -> III
      // x: 0.25 -> -5
      // y: 0.25 -> -5
      const rngIII = createMockRng([0.25, 0.25]);
      expect(
        CoordPlaneGenerator.generate(0.5, rngIII).solution_logic
          .final_answer_canonical
      ).toBe("III");

      // x=5, y=-5 -> IV
      // x: 0.75 -> 5
      // y: 0.25 -> -5
      const rngIV = createMockRng([0.75, 0.25]);
      expect(
        CoordPlaneGenerator.generate(0.5, rngIV).solution_logic
          .final_answer_canonical
      ).toBe("IV");
    });

    it("retries if point is on an axis (x=0 or y=0)", () => {
      // 1st x: 0.5 -> 0.
      // 1st y: 0.1 -> -8 (Computed but unused for validity check result, but consumed)
      // Retry
      // 2nd x: 0.75 -> 5.
      // 2nd y: 0.75 -> 5. -> I
      const rng = createMockRng([0.5, 0.1, 0.75, 0.75]);
      expect(
        CoordPlaneGenerator.generate(0.5, rng).solution_logic
          .final_answer_canonical
      ).toBe("I");
    });
  });

  describe("DecimalOpsGenerator Extra Coverage", () => {
    it("handles Division with Integer Divisor (divType='int')", () => {
      // op=3 (div). rng=0.9
      // a & b (unused but consumed): 0.5, 0.5
      // quotient: 2..20/10. rng=0.5 -> 1.1.
      // divisor: 2..10. rng=0.5 -> 6.
      // divType: 'int' (rng < 0.5). rng=0.2.
      const rng = createMockRng([
        0.9, // op=3
        0.5,
        0.5, // a, b (unused)
        0.5, // quotient=1.1
        0.5, // divisor=6
        0.2, // divType=int
      ]);
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("\\div 6"); // Integer divisor
      expect(item.solution_logic.final_answer_canonical).toBe("1.1");
    });

    it("handles Division with Decimal Divisor (divType='dec')", () => {
      // op=3
      // a, b unused
      // quotient=1.1 (0.5)
      // divisor=6 (0.5)
      // divType='dec' (rng >= 0.5). rng=0.8.
      const rng = createMockRng([
        0.9, // op=3
        0.5,
        0.5, // a, b
        0.5, // quotient
        0.5, // divisor
        0.8, // divType=dec
      ]);
      const item = DecimalOpsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("\\div 0.6");
      expect(item.solution_logic.final_answer_canonical).toBe("1.1");
    });
  });

  describe("GcfLcmGenerator Edge Cases", () => {
    it("handles collision where a === b", () => {
      // a = 10 (rng=0.3 -> 4 + floor(0.3*20)=6=10? 4..24. range 20. 4+6=10)
      // b = 10 (rng=0.3 -> 10)
      // finalB should be 11.
      // Type GCF (0.1)
      // GCF(10, 11) = 1.
      const rng = createMockRng([
        0.1, // type=GCF
        0.3, // a=10
        0.3, // b=10 (collision)
      ]);
      const item = GcfLcmGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("10 and 11");
      expect(item.solution_logic.final_answer_canonical).toBe("1");
    });
  });

  describe("RationalNumberLineGenerator Edge Cases", () => {
    it("retries on equality collision", () => {
      // 1st a: 0.5 -> 0.
      // 1st b: 0.5 -> 0. (Collision)
      // 2nd a: 0.1 -> -8? -10? randomInt(-20, 20). range 40. 0.1*40=4. -20+4=-16. /2 = -8.
      // 2nd b: 0.9 -> 36. -20+36=16. /2 = 8.
      // ans = 8.
      const rng = createMockRng([
        0.5,
        0.5, // Collision
        0.1,
        0.9, // Retry
      ]);
      const item = RationalNumberLineGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("8");
    });
  });

  describe("IntegersGenerator Edge Cases", () => {
    it("retries if val is 0 in Opposite type", () => {
      // type=0 (0.1)
      // val=0 (0.5 -> -20+20=0) -> Retry
      // val=5 (0.625? -20 + floor(0.625*41)? 25. -20+25=5).
      const rng = createMockRng([
        0.1, // type=0
        0.5, // val=0 (retry)
        0.1, // type=0 again (recursive call consumes rng?)
        // Wait, recursive call is IntegersGenerator.generate(difficulty, rng).
        // It will ask for type again.
        0.625, // val=5
      ]);
      const item = IntegersGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("opposite of 5");
    });

    it("hits both contexts in Type 1", () => {
      // "below zero"
      const rng1 = createMockRng([0.9, 0.5, 0.1]); // type=1, val, context<0.5
      const item1 = IntegersGenerator.generate(0.5, rng1);
      expect(item1.problem_content.stem).toContain("below zero");

      // "loss"
      const rng2 = createMockRng([0.9, 0.5, 0.9]); // type=1, val, context>=0.5
      const item2 = IntegersGenerator.generate(0.5, rng2);
      expect(item2.problem_content.stem).toContain("lost");
    });
  });
});
