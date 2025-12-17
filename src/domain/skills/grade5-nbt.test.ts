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
  SKILL_5_NBT_ADD_SUB_DECIMALS,
  SKILL_5_NBT_MULT_WHOLE,
  SKILL_5_NBT_MULT_DECIMALS,
  SKILL_5_NBT_DIV_WHOLE,
  SKILL_5_NBT_DIV_DECIMALS,
  SKILL_5_NBT_FRAC_DEC_CONV,
} from "./grade5-nbt";

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
      const { s1, s2 } = item.problem_content.variables as any;
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
});
