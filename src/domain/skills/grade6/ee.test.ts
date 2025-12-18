import { describe, it, expect } from "vitest";
import {
  ExponentsGenerator,
  OneStepEqGenerator,
  ExpressionsGenerator,
  EquivExpressionsGenerator,
  InequalitiesGenerator,
  VariablesGenerator,
  SKILL_6_EE_EXPONENTS,
  SKILL_6_EE_ONE_STEP_EQ,
  SKILL_6_EE_EXPRESSIONS,
  SKILL_6_EE_EQUIV_EXPRESSIONS,
  SKILL_6_EE_INEQUALITIES,
  SKILL_6_EE_VARIABLES,
} from "./ee";

const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("Grade 6 EE Generators (Deterministic)", () => {
  describe("SKILL_6_EE_EXPONENTS", () => {
    it("generates correctly", () => {
      // Logic:
      // base: randomInt(2, 9). rng=0.5 -> 2 + floor(0.5*8) = 2+4 = 6.
      // exp: randomInt(2, 4). rng=0.9 -> 2 + floor(0.9*3) = 2+2 = 4.
      // value: 6^4 = 1296.

      const rng = createMockRng([
        0.5, // base=6
        0.9, // exp=4
      ]);
      const item = ExponentsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_EXPONENTS.id);
      expect(item.problem_content.stem).toContain("6^4");
      expect(item.solution_logic.final_answer_canonical).toBe("1296");
    });
  });

  describe("SKILL_6_EE_ONE_STEP_EQ", () => {
    // Types: 0: x+a=b, 1: x-a=b, 2: ax=b, 3: x/a=b

    it("generates Type 0 (Addition)", () => {
      // Logic:
      // type: floor(rng*4). rng=0.1 -> 0.
      // x: randomInt(2, 20). rng=0.5 -> 2+floor(0.5*19) = 2+9=11.
      // a: randomInt(2, 12). rng=0.5 -> 2+floor(0.5*11) = 2+5=7.
      // b = 11 + 7 = 18.
      // Q: x + 7 = 18.

      const rng = createMockRng([
        0.1, // Type 0
        0.5, // x=11
        0.5, // a=7
      ]);
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_ONE_STEP_EQ.id);
      expect(item.problem_content.stem).toContain("x + 7 = 18");
      expect(item.solution_logic.final_answer_canonical).toBe("11");
    });

    it("generates Type 1 (Subtraction)", () => {
      // Logic:
      // type: 1. rng=0.3.
      // x: 10. rng=0.45. range=19. floor(0.45*19)=8. 2+8=10.
      // a: 5. rng=0.3. range=11. floor(0.3*11)=3. 2+3=5.
      // b = 10 - 5 = 5.
      // Q: x - 5 = 5.

      const rng = createMockRng([
        0.3, // Type 1
        0.45, // x=10
        0.3, // a=5
      ]);
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_ONE_STEP_EQ.id);
      expect(item.problem_content.stem).toContain("x - 5 = 5");
      expect(item.solution_logic.final_answer_canonical).toBe("10");
    });

    it("generates Type 2 (Multiplication)", () => {
      // Logic:
      // type: 2. rng=0.6.
      // x: 4. rng=0.1. (2+floor(0.1*19)=2+1=3?) Wait. floor(1.9)=1. 2+1=3.
      // a: 3. rng=0.1. (2+floor(0.1*11)=3?) floor(1.1)=1. 2+1=3.
      // b = 3 * 3 = 9.

      const rng = createMockRng([
        0.6, // Type 2
        0.1, // x=3
        0.1, // a=3
      ]);
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_ONE_STEP_EQ.id);
      expect(item.problem_content.stem).toContain("3x = 9");
      expect(item.solution_logic.final_answer_canonical).toBe("3");
    });

    it("generates Type 3 (Division)", () => {
      // Logic:
      // type: 3. rng=0.9.
      // x: 12.
      // a: 2.
      // b = floor(12/2) = 6.
      // realX = 6 * 2 = 12.
      // Q: x/2 = 6.

      const rng = createMockRng([
        0.9, // Type 3
        0.55, // x=12. (2+floor(0.55*19)=2+10=12).
        0.05, // a=2. (2+floor(0.05*11)=2+0=2).
      ]);
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_ONE_STEP_EQ.id);
      expect(item.problem_content.stem).toContain("\\frac{x}{2} = 6");
      expect(item.solution_logic.final_answer_canonical).toBe("12");
    });
  });

  describe("SKILL_6_EE_EXPRESSIONS", () => {
    it("generates Evaluate mode", () => {
      // Logic:
      // type: evaluate (rng < 0.5). rng=0.1.
      // m: randomInt(2, 9). rng=0.5 -> 6.
      // c: randomInt(1, 10). rng=0.5 -> 6.
      // xVal: randomInt(2, 5). rng=0.5 -> 2+floor(0.5*4)=2+2=4.
      // ans = 6*4 + 6 = 30.

      const rng = createMockRng([
        0.1, // evaluate
        0.5, // m=6
        0.5, // c=6
        0.5, // xVal=4
      ]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_EXPRESSIONS.id);
      expect(item.problem_content.stem).toContain("6x + 6");
      expect(item.problem_content.stem).toContain("x = 4");
      expect(item.solution_logic.final_answer_canonical).toBe("30");
    });

    it("generates Translate mode", () => {
      // Logic:
      // type: translate (rng >= 0.5). rng=0.6.
      // n: randomInt(2, 9). rng=0.5 -> 6.
      // Q: "6 more than x" -> x+6.

      const rng = createMockRng([
        0.6, // translate
        0.5, // n=6
      ]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("6 more than x");
      expect(item.solution_logic.final_answer_canonical).toBe("x+6");
    });
  });

  describe("SKILL_6_EE_EQUIV_EXPRESSIONS", () => {
    it("generates distributive property problem", () => {
      // Logic:
      // a: randomInt(2, 5). rng=0.5 -> 2+floor(0.5*4)=4.
      // b: randomInt(1, 9). rng=0.5 -> 1+floor(0.5*9)=5.
      // Q: 4(x+5) -> 4x+20.

      const rng = createMockRng([
        0.5, // a=4
        0.5, // b=5
      ]);
      const item = EquivExpressionsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_EQUIV_EXPRESSIONS.id);
      expect(item.problem_content.stem).toContain("4(x + 5)");
      expect(item.solution_logic.final_answer_canonical).toBe("4x+20");
    });
  });

  describe("SKILL_6_EE_INEQUALITIES", () => {
    it("generates Max (at least / >=) inequality", () => {
      // Logic:
      // val: randomInt(10, 90). rng=0.5 -> 10 + floor(0.5*81)=50.
      // isMax: true (rng < 0.5). rng=0.2.
      // Q: ...at least 50... -> h>=50.

      const rng = createMockRng([
        0.5, // val=50
        0.2, // isMax=true
      ]);
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_INEQUALITIES.id);
      expect(item.problem_content.stem).toContain("at least 50");
      expect(item.solution_logic.final_answer_canonical).toBe("h>=50");
    });

    it("generates Min (limit / <=) inequality", () => {
      // Logic:
      // val: 50.
      // isMax: false (rng >= 0.5). rng=0.8.
      // Q: ...limit... -> w<=50.

      const rng = createMockRng([
        0.5, // val=50
        0.8, // isMax=false
      ]);
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("weight limit of 50");
      expect(item.solution_logic.final_answer_canonical).toBe("w<=50");
    });
  });

  describe("SKILL_6_EE_VARIABLES", () => {
    it("identifies dependent variable", () => {
      const item = VariablesGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_VARIABLES.id);
      expect(item.solution_logic.final_answer_canonical).toBe("y");
    });
  });
});
