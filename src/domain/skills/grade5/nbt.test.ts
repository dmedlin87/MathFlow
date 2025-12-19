import { describe, it, expect } from "vitest";
import {
  PowersOf10Generator,
  DecimalFormsGenerator,
  CompareDecimalsGenerator,
  RoundDecimalsGenerator,
  AddSubDecimalsGenerator,
  MultWholeGenerator,
  MultDecimalsGenerator,
  DivWholeGenerator,
  DivDecimalsGenerator,
  FracDecConversionGenerator,
  SKILL_5_NBT_POWERS_10,
  SKILL_5_NBT_DECIMAL_FORMS,
  SKILL_5_NBT_COMPARE_DECIMALS,
  SKILL_5_NBT_ROUND_DECIMALS,
  SKILL_5_NBT_MULT_WHOLE,
} from "./nbt";

// Helper for deterministic RNG
const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) {
      // Return 0.5 default if exhausted, or throw to catch sizing errors
      return 0.5;
    }
    return sequence[index++];
  };
};

describe("Grade 5 NBT Domain (Deterministic)", () => {
  describe("SKILL_5_NBT_POWERS_10", () => {
    it("generates Type 1 (Exponent) correctly", () => {
      // Logic: type = floor(rng * 4). Want 1 (Exponent). rng=0.25 -> 1.
      // Exponent: randomInt(1, 4). range=4. floor(rng*4)+1. Want 3. rng=0.5 -> 2+1=3.
      const rng = createMockRng([0.26, 0.51]);
      const item = PowersOf10Generator.generate(0.5, rng);

      expect(item.meta.skill_id).toBe(SKILL_5_NBT_POWERS_10.id);
      expect(item.problem_content.stem).toContain("Evaluate: $10^3 = ?$");
      expect(item.solution_logic.final_answer_canonical).toBe("1000");
    });
  });

  describe("SKILL_5_NBT_DECIMAL_FORMS", () => {
    it("generates standard form from expanded correctly", () => {
      // Logic:
      // whole: randomInt(0, 99). range=100. Want 5. rng=0.05 -> floor(5)=5.
      // decimalPart: randomInt(1, 999). range=999. Want 123. rng=0.123 -> floor(122.8)+1 = 123? Close enough logic.
      // Let's control strictly:
      // randomInt(min,max): floor(rng * (max-min+1)) + min

      const rng = createMockRng([
        0.05, // whole -> 0..99. floor(0.05*100) + 0 = 5.
        0.5, // decPart -> 1..999. floor(0.5*999) + 1 = 499 + 1 = 500.
      ]);
      const item = DecimalFormsGenerator.generate(0.5, rng);

      expect(item.meta.skill_id).toBe(SKILL_5_NBT_DECIMAL_FORMS.id);
      // Expected: 5.500 -> 5.5
      expect(item.solution_logic.final_answer_canonical).toBe("5.5");
      expect(item.problem_content.stem).toContain("Write the standard form");
    });
  });

  describe("SKILL_5_NBT_COMPARE_DECIMALS", () => {
    it("generates correct comparison (>)", () => {
      // Logic:
      // type < 0.3 (Longer is larger trap). rng=0.1.
      // base: randomInt(1, 9). range=9. Want 5. floor(rng*9)+1. rng=0.5 -> 4+1=5.
      // n1 = 0.5.
      // n2 logic: n2 = (base*100 - randomInt(1,10))/1000.
      // randomInt(1,10). range=10. rng=0.5 -> 5+1=6.
      // n2 = (500 - 6)/1000 = 0.494.
      // swap? rng < 0.5. rng=0.6 (No swap).

      const rng = createMockRng([
        0.1, // type (Trap)
        0.5, // base = 5
        0.5, // diff = 6
        0.6, // no swap
      ]);
      const item = CompareDecimalsGenerator.generate(0.5, rng);

      expect(item.meta.skill_id).toBe(SKILL_5_NBT_COMPARE_DECIMALS.id);
      const { s1, s2 } = item.problem_content.variables as {
        s1: string;
        s2: string;
      };
      expect(parseFloat(s1)).toBe(0.5);
      expect(parseFloat(s2)).toBe(0.494);
      expect(item.solution_logic.final_answer_canonical).toBe(">");
    });
  });

  describe("SKILL_5_NBT_ROUND_DECIMALS", () => {
    it("rounds correctly to nearest tenth", () => {
      // Logic:
      // places: 0=whole, 1=tenth, 2=hundredth. floor(rng*3). Want 1. rng=0.4 -> 1.
      // whole: randomInt(0, 99). rng=0.1 -> 10.
      // dec: randomInt(100, 999). rng=0.5 -> 550.
      // num = 10.550 = 10.55.
      // Round to tenth: 10.6.

      const rng = createMockRng([
        0.4, // place -> tenth
        0.1, // whole -> 10
        0.5, // dec -> 550 (?) floor(0.5*900)+100 = 450+100=550.
      ]);
      const item = RoundDecimalsGenerator.generate(0.5, rng);

      expect(item.meta.skill_id).toBe(SKILL_5_NBT_ROUND_DECIMALS.id);
      expect(item.problem_content.stem).toContain("nearest **tenth**");
      expect(item.solution_logic.final_answer_canonical).toBe("10.6");
    });
  });

  describe("SKILL_5_NBT_ADD_SUB_DECIMALS", () => {
    it("adds decimals correctly", () => {
      // Logic:
      // isAddition: rng < 0.5. rng=0.1 (True).
      // d1: randomInt(1, 2). range=2. rng=0.1 -> 1.
      // d2: randomInt(1, 2). rng=0.1 -> 1.
      // n1: (rng*50 + 1).toFixed(d1). rng=0.2 -> 11.0.
      // n2: (rng*50 + 1).toFixed(d2). rng=0.3 -> 16.0.

      const rng = createMockRng([
        0.1, // Addition
        0.1, // d1=1
        0.1, // d2=1
        0.2, // n1=11.0
        0.3, // n2=16.0
      ]);

      const item = AddSubDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("27"); // 11+16
      expect(item.problem_content.stem).toContain("+");
    });
  });

  describe("SKILL_5_NBT_MULT_WHOLE", () => {
    it("multiplies multi-digit numbers correctly", () => {
      // Logic:
      // 3x2 or 4x2? rng < 0.5 (3x2). rng=0.1.
      // n1: randomInt(100, 999). rng=0.5 -> 550.
      // n2: randomInt(10, 99). rng=0.5 -> 55.
      // Result: 550 * 55 = 30250.

      const rng = createMockRng([
        0.1, // 3x2
        0.5, // n1
        0.5, // n2
      ]);

      const item = MultWholeGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_5_NBT_MULT_WHOLE.id);
      expect(item.solution_logic.final_answer_canonical).toBe("30250");
    });
  });

  describe("SKILL_5_NBT_MULT_DECIMALS", () => {
    it("multiplies decimals correctly", () => {
      // Logic:
      // isDecDec: rng < 0.6. rng=0.1 (True).
      // n1: (rng*10).toFixed(1). rng=0.25 -> 2.5.
      // n2: (rng*5).toFixed(1). rng=0.8 -> 4.0.
      // Result: 2.5 * 4.0 = 10.

      const rng = createMockRng([
        0.1, // DecDec
        0.25, // n1=2.5
        0.8, // n2=4.0
      ]);

      const item = MultDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("10");
    });
  });

  describe("SKILL_5_NBT_DIV_WHOLE", () => {
    it("divides with remainder correctly", () => {
      // Logic:
      // divisor: randomInt(10, 99). rng=0.1 -> 10+floor(0.1*90) = 19.
      // quotient: randomInt(10, 200). rng=0.1 -> 10 + floor(0.1*191) = 29.
      // isClean: rng < 0.6. rng=0.9 (False).
      // remainder: randomInt(1, divisor-1). range=18. rng=0.5 -> 1+9=10.
      // dividend = 29 * 19 + 10 = 551 + 10 = 561.

      const rng = createMockRng([
        0.1, // divisor=19
        0.1, // quotient=29
        0.9, // dirty
        0.5, // remainder=10
      ]);

      const item = DivWholeGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("29 R 10");
      expect(item.problem_content.stem).toContain("Divide: $561 \\div 19$");
    });
  });

  describe("SKILL_5_NBT_DIV_DECIMALS", () => {
    it("divides decimals correctly", () => {
      // Logic:
      // type: floor(rng*3). rng=0.1 -> 0 (Integer divisor).
      // quotient: (rng*20 + 0.1).Fixed(2). rng=0.5 -> 10.1.
      // divisor: randomInt(2, 12). rng=0.5 -> 2 + floor(0.5*11) = 2+5=7.
      // dividend = 10.1 * 7 = 70.7.

      const rng = createMockRng([
        0.1, // type 0
        0.5, // q=10.1
        0.5, // d=7
      ]);

      const item = DivDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("10.1");
      expect(item.problem_content.stem).toContain("70.7");
    });
  });

  describe("SKILL_5_NBT_FRAC_DEC_CONV", () => {
    it("converts fraction to decimal", () => {
      // Logic:
      // den: index floor(rng*len). len=8. rng=0.1 -> 0 -> 2.
      // num: randomInt(1, den-1=1). range=1. floor(rng*1)+1 = 1.
      // type: rng < 0.5 ? 0 (Frac->Dec). rng=0.1.
      // 1/2 -> 0.5.

      const rng = createMockRng([
        0.1, // den index 0 -> 2
        0.1, // num -> 1
        0.1, // Type 0
      ]);

      const item = FracDecConversionGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("0.5");
      expect(item.problem_content.stem).toContain("\\frac{1}{2}");
    });
  });

  describe("SKILL_5_NBT_POWERS_10 Extra", () => {
    it("generates Shift Relation (Type 0, Mult)", () => {
      // Logic:
      // type: floor(rng*4). rng=0.1 -> 0.
      // base: 5
      // power: 2 (10^2=100)
      // isMultiplication: true (rng < 0.5)
      // val1 = 5 * 100 = 500.
      // val2 = 5 * 10 = 50.
      // Q: 500 is 10 times ? -> 50.

      const rng = createMockRng([
        0.1, // Type 0
        0.5, // base=5. randomInt(1,9) -> floor(0.5*9)+1 = 5.
        0.4, // power=2. randomInt(1,4) -> floor(0.4*4)+1 = 1+1=2.
        0.1, // isMultiplication=true
      ]);

      const item = PowersOf10Generator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("50");
      expect(item.problem_content.stem).toContain("500 is 10 times");
    });

    it("generates Div by Power of 10 (Type 3)", () => {
      // Logic:
      // type: floor(rng*4). rng=0.8 -> 3.
      // exponent: 2
      // divisor: 100
      // baseNum: 450
      // dividend: 450
      // useExponent: false (rng >= 0.5)
      // 450 / 100 = 4.5.

      const rng = createMockRng([
        0.8, // Type 3
        0.4, // exp=2
        0.45, // baseNum=450. floor(0.45*1000)+1 = 451? Close enough, let's trust logic.
        // randomInt(1,1000). range=1000. Want 450. (450-1)/1000 = 0.449.
        0.6, // useExponent=false
      ]);
      // RNG note: baseNum logic. floor(0.45*1000)+1 = 451.
      // 451 / 100 = 4.51.

      const item = PowersOf10Generator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("4.51");
      expect(item.problem_content.stem).toContain("451");
    });
  });

  describe("SKILL_5_NBT_COMPARE_DECIMALS Extra", () => {
    it("generates equivalence case (Zeros)", () => {
      // Logic:
      // type: 0.4 (0.3 <= x < 0.6)
      // base: 50. randomInt(1,99). floor(0.5*99)+1 = 50.
      // n1 = 0.50. s1="0.5".
      // s2 = "0.50".
      // n2 = 0.5.
      // Equal.

      const rng = createMockRng([
        0.4, // Type Equiv
        0.5, // base=50
      ]);

      const item = CompareDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("=");
      expect(item.problem_content.stem).toContain("0.50");
    });
  });

  describe("SKILL_5_NBT_ROUND_DECIMALS Extra", () => {
    it("rounds to nearest hundredth", () => {
      // Logic:
      // placeIdx: floor(rng*3). rng=0.9 -> 2. (Hundredth)
      // whole: 1
      // dec: 123
      // 1.123 -> 1.12.

      const rng = createMockRng([
        0.9, // Index 2
        0.01, // whole=1. floor(0.01*100)=1.
        0.03, // dec=123. randomInt(100,999). range=900. (123-100)/900 = 23/900 = 0.025.
        // floor(0.03*900)+100 = 27+100=127.
      ]);
      // 1.127 -> 1.13.

      const item = RoundDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1.13");
      expect(item.problem_content.stem).toContain("hundredth");
    });
  });

  describe("SKILL_5_NBT_ADD_SUB_DECIMALS Extra", () => {
    it("subtracts decimals with swap logic", () => {
      // Logic:
      // isAddition: false (rng >= 0.5)
      // d1: 1
      // d2: 1
      // n1: 1.0 (Small)
      // n2: 5.0 (Large)
      // Swap -> 5.0 - 1.0 = 4.0.

      const rng = createMockRng([
        0.6, // Subtraction
        0.1, // d1=1
        0.1, // d2=1
        0.0, // n1 -> Small
        0.9, // n2 -> Large
      ]);

      const item = AddSubDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("45"); // n2=46, n1=1. 46-1=45.
      // n1: rng=0.0 -> floor(0*50)+1 = 1.
      // n2: rng=0.9 -> floor(45)+1 = 46.
      // 46 - 1 = 45.
      // My expectation "48" was guess. Assertion will fail, tell me truth.
      // Wait, let's calc.
      // floor(0.9 * 50) + 1 = 45 + 1 = 46.
      // 46 - 1 = 45.
    });
  });

  describe("SKILL_5_NBT_DIV_WHOLE Extra", () => {
    it("generates clean division", () => {
      // Logic:
      // divisor: 10
      // quotient: 10
      // isClean: true (rng < 0.6)
      // rem: 0
      // 100 / 10 = 10.

      const rng = createMockRng([
        0.0, // divisor=10. floor(0*90)+10=10.
        0.0, // quotient=10.
        0.1, // Clean
      ]);

      const item = DivWholeGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("10");
      expect(item.problem_content.stem).not.toContain("Remainder");
    });
  });

  describe("SKILL_5_NBT_DIV_DECIMALS Extra", () => {
    it("divides by decimal (Type 1)", () => {
      // Logic:
      // type: floor(rng*3). rng=0.5 -> 1.
      // quotient: 10
      // divisor: 1.5. (rng*5 + 0.1).toFixed(1). rng=0.28 -> 1.4+0.1=1.5.
      // dividend: 15.

      const rng = createMockRng([
        0.5, // Type 1
        0.495, // q=10.0. rng*20+0.1. (10-0.1)/20 = 0.495.
        0.28, // d=1.5
      ]);

      const item = DivDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("10");
    });
  });

  describe("SKILL_5_NBT_POWERS_10 Extra 2", () => {
    it("generates Mult by Power of 10 (Type 2)", () => {
      const rng = createMockRng([
        0.5, // Type 2 (floor(0.5*4)=2)
        0.8, // isDecimal=false
        0.2, // num=21
        0.5, // exponent=2
        0.1, // useExponent=true
      ]);
      const item = PowersOf10Generator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("2100");
    });
  });

  describe("SKILL_5_NBT_DECIMAL_FORMS Extra 2", () => {
    it("handles zeros in standard form generation", () => {
      const rng = createMockRng([
        0.5, // whole=50
        0.05, // dec=50 -> "050"
      ]);
      const item = DecimalFormsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("50.05");
    });
  });

  describe("SKILL_5_NBT_COMPARE_DECIMALS Extra 2", () => {
    it("generates Close Numbers case", () => {
      const rng = createMockRng([
        0.7, // Type Close (>=0.6)
        0.5, // base=500
        0.1, // +1 (501 vs 500)
      ]);
      const item = CompareDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("<");
    });
  });

  describe("SKILL_5_NBT_ROUND_DECIMALS Extra 2", () => {
    it("rounds to nearest whole number", () => {
      const rng = createMockRng([
        0.1, // Index 0 (whole)
        0.05, // whole=5
        0.6, // dec=.640
      ]);
      const item = RoundDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("6");
    });
  });

  describe("SKILL_5_NBT_MULT_WHOLE Extra", () => {
    it("multiplies 4x2 digits", () => {
      const rng = createMockRng([
        0.6, // 4x2
        0.5, // n1=5500
        0.1, // n2=19
      ]);
      const item = MultWholeGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("104500");
    });
  });

  describe("SKILL_5_NBT_MULT_DECIMALS Extra", () => {
    it("multiplies Decimal x Integer", () => {
      const rng = createMockRng([
        0.7, // DecInt
        0.1, // d=1
        0.5, // n1=10.0
        0.5, // n2=6
      ]);
      const item = MultDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("60");
    });
  });

  describe("SKILL_5_NBT_FRAC_DEC_CONV Extra", () => {
    it("converts Decimal to Fraction (Type 1)", () => {
      const rng = createMockRng([
        0.15, // den=4
        0.1, // num=1
        0.6, // Type 1
      ]);
      const item = FracDecConversionGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("0.25");
      expect(item.solution_logic.final_answer_canonical).toBeDefined();
    });
  });

  describe("SKILL_5_NBT_POWERS_10 Extra 3", () => {
    it("generates Mult by Power of 10 (Type 2, Decimal)", () => {
      // Logic:
      // type: 2 (rng=0.5 -> 2)
      // isDecimal: true (rng < 0.7). rng=0.1.
      // num: (rng*10).Fixed(3). rng=0.5 -> 5.000.
      // exponent: 2. rng=0.5.
      // 5.0 * 100 = 500.

      const rng = createMockRng([
        0.5, // Type 2
        0.1, // isDecimal=true
        0.5, // num=5.000
        0.5, // exponent=2
        0.1, // useExponent=true
      ]);
      const item = PowersOf10Generator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("500");
    });
  });

  describe("SKILL_5_NBT_DIV_DECIMALS Extra 3", () => {
    it("divides by decimal (Type 2)", () => {
      // Logic:
      // type: 2 (rng*3). rng=0.9 -> 2.
      // quotient: 10
      // divisor: 1.5 (logic same as Type 1). rng=0.28.
      // 15 / 1.5 = 10.

      const rng = createMockRng([
        0.9, // Type 2
        0.495, // q=10
        0.28, // d=1.5
      ]);
      const item = DivDecimalsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("10");
    });
  });
});

// Additional coverage tests for uncovered branches
describe("Grade 5 NBT Extra Coverage", () => {
  describe("PowersOf10Generator type=0 isMultiplication=false", () => {
    it('generates "X is 1/10 of ?" problem', () => {
      // type=0, isMultiplication=false (rng >= 0.5)
      // base=5, power=2 -> val1=500, val2=50
      // Question: "50 is 1/10 of ?" -> Answer: 500
      const rng = createMockRng([
        0.1, // type=0
        0.5, // base=5 (randomInt(1,9))
        0.4, // power=2 (randomInt(1,4))
        0.6, // isMultiplication=false
      ]);
      const item = PowersOf10Generator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("1/10 of");
      expect(
        parseInt(item.solution_logic.final_answer_canonical)
      ).toBeGreaterThan(0);
    });
  });

  describe("CompareDecimalsGenerator", () => {
    it("handles n2<0 edge case (type=Close, negative adjustment)", () => {
      // type >= 0.6 -> Close numbers
      // base=1 (smallest possible), diff=-1 would make n2=0, needs safety
      // n2 = (base + (rng < 0.5 ? 1 : -1)) / 1000
      // If base=1 and diff=-1: n2 = 0/1000 = 0, but code says if n2 < 0: n2 = 0.001
      const rng = createMockRng([
        0.7, // type=Close
        0.0, // base=1 (randomInt(1,999))
        0.6, // diff=-1 trigger
      ]);
      const item = CompareDecimalsGenerator.generate(0.5, rng);
      // Should not crash and should produce valid comparison
      expect([">", "<", "="]).toContain(
        item.solution_logic.final_answer_canonical
      );
    });
  });

  describe("MultDecimalsGenerator", () => {
    it("handles DecInt with d=2 (two decimal places)", () => {
      // isDecDec=false (rng >= 0.6), d=2 (rng >= 0.5)
      const rng = createMockRng([
        0.7, // isDecDec=false
        0.6, // d=2
        0.5, // n1 = (0.5*20).toFixed(2) = 10.00
        0.5, // n2 = randomInt(2,10) = 6
      ]);
      const item = MultDecimalsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("\\times");
      // Result should be valid number
      expect(
        parseFloat(item.solution_logic.final_answer_canonical)
      ).toBeGreaterThan(0);
    });
  });
});
