import { describe, it, expect } from "vitest";
import { AreaPolyGenerator } from "./grade6-geometry";

describe("Grade 6 Geometry Generators", () => {
  it("AreaPolyGenerator produces valid problems", () => {
    const item = AreaPolyGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.g.area");
    expect(item.problem_content.stem).toContain("area");
    expect(["integer", "decimal"]).toContain(item.answer_spec.input_type);
  });
});
