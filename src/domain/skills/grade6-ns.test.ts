import { describe, it, expect } from "vitest";
import { DivFractionsGenerator, MultiDigitDivGenerator } from "./grade6-ns";

describe("Grade 6 NS Generators", () => {
  it("DivFractionsGenerator produces valid problems", () => {
    const item = DivFractionsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.div_fractions");
    expect(item.problem_content.stem).toContain("\\div");
    expect(item.answer_spec.input_type).toBe("fraction");
  });

  it("MultiDigitDivGenerator produces valid problems", () => {
    const item = MultiDigitDivGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.multi_digit_div");
    expect(item.problem_content.stem).toContain("\\div");
    expect(item.answer_spec.input_type).toBe("integer");
  });
});
