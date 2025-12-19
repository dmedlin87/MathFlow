import { describe, it, expect, vi } from "vitest";
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
    it("generates correctly with middle values", () => {
      // base: randomInt(2, 9). rng=0.5 -> 2 + floor(0.5*8) = 6.
      // exp: randomInt(2, 4). rng=0.9 -> 2 + floor(0.9*3) = 4.
      const rng = createMockRng([0.5, 0.9]);
      const item = ExponentsGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_EXPONENTS.id);
      expect(item.problem_content.stem).toContain("6^4");
      expect(item.solution_logic.final_answer_canonical).toBe("1296");

      const misc = item.misconceptions.find(
        (m) => m.error_tag === "multiply_base_exponent"
      );
      expect(misc?.trigger.value).toBe("24");
      expect(item.solution_logic.steps[0].explanation).toBe(
        "Multiply 6 by itself 4 times."
      );
    });

    it("handles lower boundary values (2^2)", () => {
      const rng = createMockRng([0, 0]);
      const item = ExponentsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("2^2");
      expect(item.solution_logic.final_answer_canonical).toBe("4");
    });

    it("handles upper boundary values (9^4)", () => {
      const rng = createMockRng([0.99, 0.99]);
      const item = ExponentsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("9^4");
      expect(item.solution_logic.final_answer_canonical).toBe("6561");
    });

    it("uses Math.random when no rng is provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
      const item = ExponentsGenerator.generate(0.5);
      expect(item.problem_content.stem).toContain("6^3"); // 2+floor(0.5*8)=6, 2+floor(0.5*3)=3
      spy.mockRestore();
    });
  });

  describe("SKILL_6_EE_ONE_STEP_EQ", () => {
    it("generates Type 0 (Addition: x + a = b)", () => {
      const rng = createMockRng([0.1, 0.5, 0.5]); // type=0, x=11, a=7
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_ONE_STEP_EQ.id);
      expect(item.problem_content.stem).toBe("Solve for x: $ x + 7 = 18 $");
      expect(item.solution_logic.final_answer_canonical).toBe("11");
      expect(item.solution_logic.steps[0].explanation).toContain(
        "inverse operation"
      );
    });

    it("generates Type 1 (Subtraction: x - a = b)", () => {
      const rng = createMockRng([0.3, 0.45, 0.3]); // type=1, x=10, a=5
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toBe("Solve for x: $ x - 5 = 5 $");
      expect(item.solution_logic.final_answer_canonical).toBe("10");
    });

    it("generates Type 2 (Multiplication: ax = b)", () => {
      const rng = createMockRng([0.6, 0.1, 0.1]); // type=2, x=3, a=3
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toBe("Solve for x: $ 3x = 9 $");
      expect(item.solution_logic.final_answer_canonical).toBe("3");
    });

    it("generates Type 3 (Division: x/a = b)", () => {
      const rng = createMockRng([0.9, 0.55, 0.05, 0.5]); // type=3, x=unused, a=2, b=6
      const item = OneStepEqGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toBe(
        "Solve for x: $ \\frac{x}{2} = 6 $"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("12");
      expect(item.solution_logic.steps[0].explanation).toBe(
        "Multiply both sides by 2"
      );
      expect(item.solution_logic.steps[0].math).toBe("x = 6 \\times 2 = 12");
    });

    it("handles explicit valid boundaries for OneStepEq inputs", () => {
      // type: 0 (addition)
      // x: min (2) -> rng=0
      // a: min (2) -> rng=0
      const minRng = createMockRng([0, 0, 0]);
      const minItem = OneStepEqGenerator.generate(0.5, minRng);
      expect(minItem.problem_content.stem).toBe("Solve for x: $ x + 2 = 4 $");
      expect(minItem.solution_logic.final_answer_canonical).toBe("2");

      // type: 2 (multiplication)
      // x: max (20) -> rng=0.99
      // a: max (12) -> rng=0.99
      const maxRng = createMockRng([0.6, 0.99, 0.99]);
      const maxItem = OneStepEqGenerator.generate(0.5, maxRng);
      expect(maxItem.problem_content.stem).toBe("Solve for x: $ 12x = 240 $");
      expect(maxItem.solution_logic.final_answer_canonical).toBe("20");
    });

    it("uses Math.random for all random calls when no rng provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.1); // type=0
      const item = OneStepEqGenerator.generate(0.5);
      expect(item.problem_content.stem).toContain("x +");
      spy.mockRestore();
    });
  });

  describe("SKILL_6_EE_EXPRESSIONS", () => {
    it("generates Evaluate mode with substitution", () => {
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
      expect(item.solution_logic.steps[0].math).toBe("6(4) + 6 = 24 + 6 = 30");
    });

    it("generates Translate mode (more than) with all forms", () => {
      // Logic:
      // type: translate (rng >= 0.5). rng=0.6.
      // n: randomInt(2, 9). rng=0.5 -> 6.
      // subType: floor(rng*4). rng=0.1 -> 0 (more than)
      const rng = createMockRng([0.6, 0.5, 0.1]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("6 more than x");
      expect(item.solution_logic.final_answer_canonical).toBe("x+6");
      expect(item.answer_spec.accepted_forms).toEqual(["x+6", "6+x"]);
    });

    it("generates Translate mode (less than)", () => {
      // Logic:
      // subType: 1 (less than)
      const rng = createMockRng([0.6, 0.5, 0.3]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("6 less than x");
      expect(item.solution_logic.final_answer_canonical).toBe("x-6");
      expect(item.answer_spec.accepted_forms).toEqual(["x-6"]);
    });

    it("generates Translate mode (product)", () => {
      // Logic:
      // subType: 2 (product)
      const rng = createMockRng([0.6, 0.5, 0.6]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("product of 6 and x");
      expect(item.solution_logic.final_answer_canonical).toBe("6x");
      expect(item.answer_spec.accepted_forms).toEqual(["6x", "6*x", "x*6"]);
    });

    it("generates Translate mode (quotient)", () => {
      // Logic:
      // subType: 3 (quotient)
      const rng = createMockRng([0.6, 0.5, 0.9]);
      const item = ExpressionsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("quotient of x and 6");
      expect(item.solution_logic.final_answer_canonical).toBe("x/6");
      expect(item.answer_spec.accepted_forms).toEqual(["x/6", "\\frac{x}{6}"]);
    });

    it("uses Math.random for translate path when no rng provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.6); // translate
      const item = ExpressionsGenerator.generate(0.5);
      expect(item.problem_content.stem).toContain("algebraic expression");
      spy.mockRestore();
    });
  });

  describe("SKILL_6_EE_EQUIV_EXPRESSIONS", () => {
    it("verifies distributive property expansion", () => {
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
      expect(item.solution_logic.steps[0].math).toBe(
        "4 \\times x + 4 \\times 5 = 4x+20"
      );
    });

    it("handles boundary values (min and max distributive)", () => {
      const minRng = createMockRng([
        0, // a=2
        0, // b=1
      ]);
      const minItem = EquivExpressionsGenerator.generate(0.5, minRng);
      expect(minItem.problem_content.stem).toContain("2(x + 1)");
      expect(minItem.solution_logic.final_answer_canonical).toBe("2x+2");

      const maxRng = createMockRng([
        0.99, // a=5
        0.99, // b=9
      ]);
      const maxItem = EquivExpressionsGenerator.generate(0.5, maxRng);
      expect(maxItem.problem_content.stem).toContain("5(x + 9)");
      expect(maxItem.solution_logic.final_answer_canonical).toBe("5x+45");
    });

    it("uses Math.random when no rng provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
      const item = EquivExpressionsGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_EQUIV_EXPRESSIONS.id);
      expect(item.problem_content.stem).toContain("4(x + 5)");
      spy.mockRestore();
    });
  });

  describe("SKILL_6_EE_INEQUALITIES", () => {
    it("generates Type 0 (At least: >=) with all accepted forms", () => {
      const rng = createMockRng([0.5, 0]); // val=50, type=0
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_INEQUALITIES.id);
      expect(item.problem_content.stem).toContain("at least 50");
      expect(item.solution_logic.final_answer_canonical).toBe("h>=50");
      expect(item.answer_spec.accepted_forms).toEqual([
        "h>=50",
        "h => 50",
        "50<=h",
      ]);
      expect(item.solution_logic.steps[0].explanation).toBe(
        "At least means greater than or equal to."
      );
    });

    it("generates Type 1 (Limit: <=)", () => {
      const rng = createMockRng([0.5, 0.4]); // type=1
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("weight limit of 50");
      expect(item.solution_logic.final_answer_canonical).toBe("w<=50");
      expect(item.answer_spec.accepted_forms).toEqual([
        "w<=50",
        "w =< 50",
        "50>=w",
      ]);
    });

    it("generates Type 2 (More than: >)", () => {
      const rng = createMockRng([0.5, 0.6]); // type=2
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("more than 50");
      expect(item.solution_logic.final_answer_canonical).toBe("s>50");
      expect(item.answer_spec.accepted_forms).toEqual(["s>50", "50<s"]);
    });

    it("generates Type 3 (Less than: <)", () => {
      const rng = createMockRng([0.5, 0.9]); // type=3
      const item = InequalitiesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("less than 50");
      expect(item.solution_logic.final_answer_canonical).toBe("t<50");
      expect(item.answer_spec.accepted_forms).toEqual(["t<50", "50>t"]);
    });

    it("uses Math.random when no rng provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.1); // type=0
      const item = InequalitiesGenerator.generate(0.5);
      expect(item.problem_content.stem).toContain("at least");
      spy.mockRestore();
    });
  });

  describe("SKILL_6_EE_VARIABLES", () => {
    it("identifies dependent variable in linear form (y = mx + c)", () => {
      const rng = createMockRng([0.1, 0.1, 0, 0.5, 0.5]); // v1=x (indep), v2=y (dep), type=0, m=2, c=1+floor(0.5*10)=6
      const item = VariablesGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_EE_VARIABLES.id);
      expect(item.problem_content.stem).toContain("y = 2x + 6");
      expect(item.solution_logic.final_answer_canonical).toBe("y");
      expect(item.solution_logic.steps[0].explanation).toBe(
        "y depends on the value of the other variable."
      );
    });

    it("identifies dependent variable in quotient form (p = q/r)", () => {
      const rng = createMockRng([0.8, 0.8, 0.8, 0.5]); // v1=p (dep), v2=q (indep), type=1, r=randomInt(2,5,0.8)=5
      const item = VariablesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("p = \\frac{q}{5}");
      expect(item.solution_logic.final_answer_canonical).toBe("p");
    });

    it("handles variable list wrap-around (q -> x)", () => {
      // vars length is 7. indices 0..6.
      // v1Idx needs to be 6 ('q'). rng >= 6/7 (~0.857). Let's use 0.9.
      // v2Idx will be (6+1)%7 = 0 ('x').
      const rng = createMockRng([
        0.9, // v1Idx = floor(0.9 * 7) = 6 ('q')
        0.1, // type = 0 (linear)
        0.5, // m=6
        0.5, // c=6
      ]);
      const item = VariablesGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("x = 6q + 6");
      expect(item.solution_logic.final_answer_canonical).toBe("x"); // x is dependent on q
    });

    it("uses Math.random when no rng provided", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.1);
      const item = VariablesGenerator.generate(0.5);
      expect(item.problem_content.stem).toContain("dependent");
      spy.mockRestore();
    });
  });
});
