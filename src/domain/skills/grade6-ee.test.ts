import { describe, it, expect } from "vitest";
import { ExponentsGenerator, OneStepEqGenerator } from "./grade6-ee";

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
});
