import { describe, it, expect } from "vitest";
import {
  MeanGenerator,
  MedianModeRangeGenerator,
  IqrGenerator,
  BoxPlotGenerator,
  HistogramGenerator,
  DotPlotGenerator,
} from "./grade6-stats";

describe("Grade 6 Stats Generators", () => {
  it("MeanGenerator produces valid problems", () => {
    const item = MeanGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.mean");
    expect(item.problem_content.stem).toContain("mean");
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("MedianModeRangeGenerator produces valid problems", () => {
    const item = MedianModeRangeGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.median_mode_range");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("IqrGenerator produces valid problems", () => {
    const item = IqrGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.iqr");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("BoxPlotGenerator produces valid problems", () => {
    const item = BoxPlotGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.box_plots");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("HistogramGenerator produces valid problems", () => {
    const item = HistogramGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.histograms");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });

  it("DotPlotGenerator produces valid problems", () => {
    const item = DotPlotGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.sp.dot_plots");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.solution_logic.steps.length).toBeGreaterThan(0);
  });
});
