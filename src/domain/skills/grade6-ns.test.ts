import { describe, it, expect } from "vitest";
import {
  DivFractionsGenerator,
  MultiDigitDivGenerator,
  DecimalOpsGenerator,
  GcfLcmGenerator,
  IntegersGenerator,
  RationalNumberLineGenerator,
  CoordPlaneGenerator,
} from "./grade6-ns";

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

  it("DecimalOpsGenerator produces valid problems", () => {
    const item = DecimalOpsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.decimal_ops");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("decimal");
  });

  it("GcfLcmGenerator produces valid problems", () => {
    const item = GcfLcmGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.gcf_lcm");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("IntegersGenerator produces valid problems", () => {
    const item = IntegersGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.integers");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("RationalNumberLineGenerator produces valid problems", () => {
    const item = RationalNumberLineGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.rational_line");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("decimal");
  });

  it("CoordPlaneGenerator produces valid problems", () => {
    const item = CoordPlaneGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.ns.coord_plane");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("text");
  });
});
