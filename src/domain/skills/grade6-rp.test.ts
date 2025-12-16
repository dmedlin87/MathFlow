import { describe, it, expect } from "vitest";
import {
  RatiosGenerator,
  UnitRateGenerator,
  PercentsGenerator,
  RatioTablesGenerator,
  UnitConversionRPGenerator,
} from "./grade6-rp";

describe("Grade 6 RP Generators", () => {
  it("RatiosGenerator produces valid problems", () => {
    const item = RatiosGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.rp.ratios");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.answer_mode).toBe("final_only");
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("UnitRateGenerator produces valid problems", () => {
    const item = UnitRateGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.rp.unit_rate");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
    // Unit rate should have a numeric answer (either decimal or integer)
    expect(["integer", "decimal"]).toContain(item.answer_spec.input_type);
  });

  it("PercentsGenerator produces valid problems", () => {
    const item = PercentsGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.rp.percents");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("RatioTablesGenerator produces valid problems", () => {
    const item = RatioTablesGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.rp.ratio_tables");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("UnitConversionRPGenerator produces valid problems", () => {
    const item = UnitConversionRPGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.rp.unit_conversion");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });
});
