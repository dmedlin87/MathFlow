import { describe, it, expect } from "vitest";
import {
  ExponentsGenerator,
  OneStepEqGenerator,
  ExpressionsGenerator,
  EquivExpressionsGenerator,
  InequalitiesGenerator,
  VariablesGenerator,
} from "./ee";

describe("Grade 6 EE Generators", () => {
  // Helper to evaluate LaTeX-like expressions for verification if needed
  // or we just parse the numeric parts from the stem.

  it("ExponentsGenerator produces correct values", () => {
    const item = ExponentsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.exponents");

    // Stem format: "Evaluate: $ base^exp = ? $"
    const stem = item.problem_content.stem;
    const match = stem.match(/\$ (\d+)\^(\d+) = \? \$/); // Loose match for $ base^exp = ? $
    expect(match).not.toBeNull();

    if (match) {
      const base = parseInt(match[1]);
      const exp = parseInt(match[2]);
      const expected = Math.pow(base, exp);
      expect(item.solution_logic.final_answer_canonical).toBe(String(expected));
    }
  });

  it("OneStepEqGenerator produces solvable equations", () => {
    const item = OneStepEqGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.one_step_eq");

    const ans = parseInt(item.solution_logic.final_answer_canonical);
    // const stem = item.problem_content.stem;

    // We can't easily parse all forms without complex regex,
    // but we can verify the answer type is numeric and reasonable.
    expect(item.answer_spec.input_type).toBe("integer");
    expect(item.solution_logic.final_answer_type).toBe("numeric");
    expect(!isNaN(ans)).toBe(true);

    // Basic validity check: ensure answer is mentioned in solution steps or derivation
    expect(item.solution_logic.steps[0].answer).toBe(String(ans));
  });

  it("ExpressionsGenerator produces valid evaluations or translations", () => {
    const item = ExpressionsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.expressions");

    // Evaluate mode check
    if (item.problem_content.stem.startsWith("Evaluate")) {
      // "Evaluate the expression $mx + c$ when $x = v$."
      // Simple regex to extract numbers might be flaky if format changes,
      // but let's try to verify "final answer" matches logic.
      expect(item.answer_spec.input_type).toBe("integer");
      const ans = parseInt(item.solution_logic.final_answer_canonical);
      expect(!isNaN(ans)).toBe(true);
    } else {
      // Translate mode
      expect(item.answer_spec.input_type).toBe("text");
      // Check accepted forms contain the canonical answer
      expect(item.answer_spec.accepted_forms).toContain(
        item.solution_logic.final_answer_canonical
      );
    }
  });

  it("EquivExpressionsGenerator produces correct distributive format", () => {
    const item = EquivExpressionsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.equiv_expressions");

    // Expected: "ax+b"
    const ans = item.solution_logic.final_answer_canonical;
    expect(ans).toMatch(/^\d+x\+\d+$/); // e.g. 3x+12
    expect(item.answer_spec.input_type).toBe("text");
  });

  it("InequalitiesGenerator matches expected format", () => {
    const item = InequalitiesGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.inequalities");

    // Check answer looks like "x>5" or "w<=10"
    const ans = item.solution_logic.final_answer_canonical;
    expect(ans).toMatch(/^[a-z](?:>=|<=|>|<)\d+$/);
  });

  it("VariablesGenerator identifies Correct Variable", () => {
    const item = VariablesGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.variables");

    // Always returns "y" (dependent) in current impl
    expect(item.solution_logic.final_answer_canonical).toBe("y");
  });
});
