import { describe, it, expect } from "vitest";
import {
  AddSubUnlikeGenerator,
  FracDivGenerator,
  ScalingGenerator,
  MultFracGenerator,
  DivFracGenerator,
  FractionWordProblemsGenerator,
  SKILL_5_NF_ADD_SUB_UNLIKE,
  SKILL_5_NF_FRAC_DIV,
  SKILL_5_NF_SCALING,
  SKILL_5_NF_MULT_FRAC,
  SKILL_5_NF_DIV_FRAC,
  SKILL_5_NF_WORD_PROBLEMS,
} from "./grade5-fractions";

const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("Grade 5 NF Domain (Deterministic)", () => {
  describe("SKILL_5_NF_ADD_SUB_UNLIKE", () => {
    it("adds unlike fractions correctly", () => {
      // Logic:
      // isAddition: rng < 0.6. rng=0.1 (True).
      // d1: randomInt(2, 6). rng=0.5 -> 4.
      // difficulty < 0.5? Yes (passed 0.5 diff but generator checks arg? No, arg passed is 0.5).
      // If diff=0.5, else branch.
      // d2: randomInt(2,8). rng=0.5 -> 5.5 -> 5.
      // d1=4, d2=5. Compatible.
      // n1: randomInt(1, d1-1=3). rng=0.5 -> 2. (2/4)
      // n2: randomInt(1, d2-1=4). rng=0.5 -> 3. (3/5)
      // Res: 2/4 + 3/5 = 1/2 + 3/5 = 5/10 + 6/10 = 11/10.
      // LCM(4,5) = 20.
      // 2/4 = 10/20. 3/5 = 12/20. Sum = 22/20 = 11/10.

      const rng = createMockRng([
        0.1, // Addition
        0.5, // d1=4
        0.5, // d2=5
        0.5, // n1=2
        0.5, // n2=3
      ]);

      const item = AddSubUnlikeGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_5_NF_ADD_SUB_UNLIKE.id);
      expect(item.solution_logic.final_answer_canonical).toBe("11/10");
    });
  });

  describe("SKILL_5_NF_FRAC_DIV", () => {
    it("writes division as fraction", () => {
      // Logic:
      // num: randomInt(1, 10). rng=0.2 -> 1+floor(0.2*10)=3.
      // den: randomInt(2, 12). rng=0.5 -> 2+floor(0.5*11)=2+5=7.
      // 3 div 7 = 3/7.

      const rng = createMockRng([
        0.2, // num=3
        0.5, // den=7
      ]);

      const item = FracDivGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("3/7");
    });
  });

  describe("SKILL_5_NF_SCALING", () => {
    it("identifies scaling correctly (<)", () => {
      // Logic:
      // factor: randomInt(2,10). rng=0.5 -> 6.
      // num: randomInt(1,10). rng=0.1 -> 2.
      // den: randomInt(2,10). rng=0.5 -> 6.
      // num=2, den=6. num < den. 2/6 < 1.
      // Symbol <.

      const rng = createMockRng([
        0.5, // factor=6
        0.1, // num=2
        0.5, // den=6
      ]);

      const item = ScalingGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("<");
    });
  });

  describe("SKILL_5_NF_MULT_FRAC", () => {
    it("multiplies fractions correctly", () => {
      // Logic:
      // num1: randomInt(1,5). rng=0.1 -> 1.
      // den1: randomInt(2,8). rng=0.5 -> 5. (1/5)
      // num2: randomInt(1,5). rng=0.1 -> 1.
      // den2: randomInt(2,8). rng=0.5 -> 5. (1/5)
      // Res: 1/25.

      const rng = createMockRng([
        0.1, // num1=1
        0.5, // den1=5
        0.1, // num2=1
        0.5, // den2=5
      ]);

      const item = MultFracGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/25");
    });
  });

  describe("SKILL_5_NF_DIV_FRAC", () => {
    it("divides unit fraction by whole (Case 1)", () => {
      // Logic:
      // isCase1: rng < 0.5. rng=0.1 (True).
      // den: randomInt(2,8). rng=0.5 -> 5.
      // whole: randomInt(2,6). rng=0.5 -> 4.
      // 1/5 div 4 = 1/20.

      const rng = createMockRng([
        0.1, // Case 1
        0.5, // den=5
        0.5, // whole=4
      ]);

      const item = DivFracGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/20");
    });
  });

  describe("SKILL_5_NF_WORD_PROBLEMS", () => {
    it("solves recipe word problem (Type 1)", () => {
      // Logic:
      // type: randomInt(0,2). rng=0.5 -> 1.
      // num1: randomInt(1,3). rng=0.9 -> 3.
      // den1: randomInt(4,5). rng=0.1 -> 4. (3/4)
      // num2=1, den2=2. (1/2)
      // Res: 3/4 * 1/2 = 3/8.

      const rng = createMockRng([
        0.5, // Type 1
        0.9, // num1=3
        0.1, // den1=4
      ]);

      const item = FractionWordProblemsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_5_NF_WORD_PROBLEMS.id);
      expect(item.solution_logic.final_answer_canonical).toBe("3/8");
      expect(item.problem_content.stem).toContain("recipe");
    });

    it("solves addition word problem (Type 0, Addition)", () => {
      // Logic:
      // type: 0 (rng=0.1)
      // isAddition: true (rng=0.1 < 0.6)
      // d1: randomInt(2,6) -> 0.1 -> 2
      // d2: randomInt(2,6) -> 0.5 -> 4. Loop while d1==d2? No, 2!=4.
      // n1=1, n2=1. 1/2 + 1/4. LCM=4.
      // 2/4 + 1/4 = 3/4.

      const rng = createMockRng([
        0.1, // Type 0
        0.1, // isAddition=true
        0.1, // d1=2
        0.5, // d2=4
      ]);

      const item = FractionWordProblemsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("3/4");
      expect(item.problem_content.stem).toContain("Alice ran");
      expect(item.problem_content.stem).toContain("total");
    });

    it("solves subtraction word problem (Type 0, Subtraction)", () => {
      // Logic:
      // type: 0 (rng=0.1)
      // isAddition: false (rng=0.8 >= 0.6)
      // d1: randomInt(2,6) -> 0.1 -> 2
      // d2: randomInt(2,6) -> 0.9 -> floor(0.9*5)+2 = 4+2 = 6.
      // 1/2 - 1/6. LCM=6.
      // 3/6 - 1/6 = 2/6 = 1/3.

      const rng = createMockRng([
        0.1, // Type 0
        0.8, // isAddition=false
        0.1, // d1=2
        0.9, // d2=6
      ]);

      const item = FractionWordProblemsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/3");
      expect(item.problem_content.stem).toContain("farther");
    });

    it("solves division word problem (Type 2, Sharing)", () => {
      // Logic:
      // type: 2 (rng=0.9)
      // typeA: true (rng=0.1 < 0.5) => Share unit fraction (1/d div friends)
      // den: randomInt(2,5) -> 0.1 -> 2
      // friends: randomInt(2,6) -> 0.1 -> 2
      // 1/2 div 2 = 1/4.

      const rng = createMockRng([
        0.9, // Type 2
        0.1, // typeA=true
        0.1, // den=2
        0.1, // friends=2
      ]);

      const item = FractionWordProblemsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/4");
      expect(item.problem_content.stem).toContain("share");
    });

    it("solves division word problem (Type 2, Grouping)", () => {
      // Logic:
      // type: 2 (rng=0.9)
      // typeA: false (rng=0.6 >= 0.5) => Whole div unit frac (c div 1/b)
      // whole: randomInt(2,6) -> 0.1 -> 2
      // den: randomInt(2,5) -> 0.1 -> 2
      // 2 div 1/2 = 4.

      const rng = createMockRng([
        0.9, // Type 2
        0.6, // typeA=false
        0.1, // whole=2
        0.1, // den=2
      ]);

      const item = FractionWordProblemsGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("4");
      expect(item.problem_content.stem).toContain("bags");
    });
  });

  describe("SKILL_5_NF_DIV_FRAC Extra", () => {
    it("divides whole by unit fraction (Case 2)", () => {
      // Logic:
      // isCase1: rng >= 0.5
      // whole: randomInt(2,6) -> 0.1 -> 2
      // den: randomInt(2,8) -> 0.1 -> 2
      // 2 div 1/2 = 4

      const rng = createMockRng([
        0.6, // Case 2
        0.1, // whole=2
        0.1, // den=2
      ]);

      const item = DivFracGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("4");
    });
  });

  describe("SKILL_5_NF_ADD_SUB_UNLIKE Extra", () => {
    it("subtracts unlike fractions correctly", () => {
      // Logic:
      // isAddition: rng >= 0.6
      // d1: 2
      // difficulty >= 0.5 case? Let's assume passed diff=0.9
      // d1=2.
      // d2: 3 (not mult of 2).
      // n1=1, n2=1.
      // 1/2 - 1/3 = 3/6 - 2/6 = 1/6.

      const rng = createMockRng([
        0.8, // Subtraction
        0.1, // d1=2 (min 2, max 6) -> 2
        0.2, // d2=3 (min 2, max 8) -> 3
        0.1, // n1=1
        0.1, // n2=1
      ]);

      const item = AddSubUnlikeGenerator.generate(0.9, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/6");
      expect(item.problem_content.stem).toContain("Subtract");
    });
  });

  describe("SKILL_5_NF_SCALING Extra", () => {
    it("identifies scaling correctly (>)", () => {
      // Logic:
      // factor: 2
      // num: 3
      // den: 2
      // 3/2 > 1.
      // Symbol >

      const rng = createMockRng([
        0.1, // factor=2
        0.5, // num=3
        0.1, // den=2
      ]);

      const item = ScalingGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe(">");
    });
  });
});
