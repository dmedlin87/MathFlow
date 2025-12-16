import { describe, it, expect } from "vitest";
import {
  AreaPolyGenerator,
  SurfaceAreaGenerator,
  VolumeFracGenerator,
  PolygonsCoordGenerator,
} from "./grade6-geometry";

describe("Grade 6 Geometry Generators", () => {
  it("AreaPolyGenerator produces valid problems", () => {
    const item = AreaPolyGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.g.area");
    expect(item.problem_content.stem).toContain("area");
    expect(["integer", "decimal"]).toContain(item.answer_spec.input_type);
  });

  it("SurfaceAreaGenerator produces valid problems", () => {
    const item = SurfaceAreaGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.g.surface_area");
    expect(item.problem_content.stem).toContain("surface area");
    expect(item.answer_spec.input_type).toBe("integer");
  });

  it("VolumeFracGenerator produces valid problems", () => {
    const item = VolumeFracGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.g.volume_frac");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("fraction");
  });

  it("PolygonsCoordGenerator produces valid problems", () => {
    const item = PolygonsCoordGenerator.generate(0.5);
    expect(item.meta.skill_id).toBe("6.g.polygons_coord");
    expect(item.problem_content.stem).toBeTruthy();
    expect(item.answer_spec.input_type).toBe("integer");
  });
});
