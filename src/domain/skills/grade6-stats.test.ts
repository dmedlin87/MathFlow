import { describe, it, expect } from "vitest";
import { MeanGenerator } from "./grade6-stats";

describe("Grade 6 Stats Generators", () => {
  it("MeanGenerator produces valid problems", () => {
    const item = MeanGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.mean");
    expect(item.problem_content.stem).toContain("mean");
    expect(item.answer_spec.input_type).toBe("integer");
  });
});
