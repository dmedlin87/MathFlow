import { describe, it, expect } from "vitest";
import {
  ExponentsGenerator,
  OneStepEqGenerator,
  ExpressionsGenerator,
  EquivExpressionsGenerator,
  InequalitiesGenerator,
  VariablesGenerator,
} from "./grade6-ee";

describe("Grade 6 EE Generators", () => {
  it("ExponentsGenerator produces valid problems", () => {
    const item = ExponentsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.exponents");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("OneStepEqGenerator produces valid problems", () => {
    const item = OneStepEqGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.one_step_eq");
    expect(item.problem_content.stem).toContain("Solve for x");
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("ExpressionsGenerator produces valid problems", () => {
    const item = ExpressionsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.expressions");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("EquivExpressionsGenerator produces valid problems", () => {
    const item = EquivExpressionsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.equiv_expressions");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("text");
  });

  it("InequalitiesGenerator produces valid problems", () => {
    const item = InequalitiesGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.inequalities");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("text");
  });

  it("VariablesGenerator produces valid problems", () => {
    const item = VariablesGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ee.variables");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("text");
  });
});
