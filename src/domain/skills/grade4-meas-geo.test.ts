import { describe, it, expect } from "vitest";
import {
  AreaPerimeterGenerator,
  UnitConversionGenerator,
  GeometryGenerator,
  SymmetryGenerator,
  AngleMeasureGenerator,
  LinePlotGenerator,
  ShapeClassificationGenerator,
  SKILL_AREA_PERIMETER,
  SKILL_UNIT_CONVERSION,
  SKILL_GEO_LINES_ANGLES,
  SKILL_SYMMETRY,
  SKILL_ANGLES_MEASURE,
  SKILL_LINE_PLOTS,
  SKILL_SHAPE_CLASSIFICATION,
  DataGraphGenerator,
  SKILL_DATA_GRAPHS,
} from "./grade4-meas-geo";

describe("grade4-meas-geo generator", () => {
  const createMockRng = (sequence: number[]) => {
    let index = 0;
    return () => {
      if (index >= sequence.length) return 0.5;
      return sequence[index++];
    };
  };

  describe("AreaPerimeterGenerator", () => {
    it("calculates Area correctly", () => {
      // Mode < 0.5 -> Area (default check if split logic holds)
      // rng calls: 1. Square check, 2. W, 3. L, 4. Mode
      const rng = createMockRng([0.9, 0.5, 0.5, 0.4]); // Not Square, w, l, Mode=Area (<0.5)
      const item = AreaPerimeterGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_AREA_PERIMETER.id);
      expect(item.problem_content.stem).toContain("Area");

      const vars = item.problem_content.variables as any;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        vars.l * vars.w
      );
    });

    it("calculates Perimeter correctly", () => {
      // Mode > 0.5 -> Perimeter
      const rng = createMockRng([0.9, 0.5, 0.9]);
      const item = AreaPerimeterGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Perimeter");

      const vars = item.problem_content.variables as any;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        2 * (vars.l + vars.w)
      );
    });
  });

  describe("UnitConversionGenerator", () => {
    it("generates valid conversion", () => {
      const item = UnitConversionGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_UNIT_CONVERSION.id);

      const vars = item.problem_content.variables as any;
      const val = vars.val;

      // Just verifying it's integer result and formula holds
      // It's hard to know which rule picked without forcing rng or checking stem.
      // But code logic is simple: result = val * factor.
      expect(
        parseInt(item.solution_logic.final_answer_canonical)
      ).toBeGreaterThan(val);
      // Since we only do Large->Small, result is always bigger (factors >= 12).
    });
  });

  describe("GeometryGenerator", () => {
    it("classifies angles correctly", () => {
      // Type ANGLE (>0.5)
      const rng = createMockRng([0.6, 0.5]); // Type, Deg
      // deg will be randomInt(10, 170).
      const item = GeometryGenerator.generate(0.5);
      if (item.problem_content.stem.includes("degrees")) {
        const vars = item.problem_content.variables as any;
        const ans = item.solution_logic.final_answer_canonical;
        if (vars.deg < 90) expect(ans).toBe("Acute");
        if (vars.deg > 90) expect(ans).toBe("Obtuse");
      }
    });
  });

  describe("SymmetryGenerator", () => {
    it("identifies correct line count for known shapes", () => {
      const item = SymmetryGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_SYMMETRY.id);
      const vars = item.problem_content.variables as any;

      const ans = item.solution_logic.final_answer_canonical;
      if (vars.shape === "Square") expect(ans).toBe("4");
    });
  });

  describe("AngleMeasureGenerator", () => {
    it("generates additive angle problems", () => {
      const rng = createMockRng([0.5]); // > 0.4 -> ADDITIVE
      const item = AngleMeasureGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_ANGLES_MEASURE.id);

      // It's either sum or diff
      const vars = item.problem_content.variables as any;
      if (vars.total) {
        // Finding part
        expect(Number(item.solution_logic.final_answer_canonical)).toBe(
          vars.total - vars.angle1
        );
      } else {
        // Finding total
        expect(Number(item.solution_logic.final_answer_canonical)).toBe(
          vars.angle1 + vars.angle2
        );
      }
    });

    it("generates turn/circle problems", () => {
      const rng = createMockRng([0.1]); // < 0.4 -> TURNS
      const item = AngleMeasureGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("turn");
    });
  });

  describe("LinePlotGenerator", () => {
    it("generates line plot interpretation problems", () => {
      const item = LinePlotGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_LINE_PLOTS.id);
      expect(item.problem_content.stem).toContain("Data (inches)");

      // Basic sanity check on answer
      expect(item.solution_logic.final_answer_canonical).toBeTruthy();
    });
  });

  describe("ShapeClassificationGenerator", () => {
    it("generates shape riddles", () => {
      const item = ShapeClassificationGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_SHAPE_CLASSIFICATION.id);
      expect(item.problem_content.stem).toContain("Identify the shape");

      const ans = item.solution_logic.final_answer_canonical;
      // Verify answer is one of the choices
      expect(item.answer_spec.ui?.choices).toContain(ans);
    });
  });

  describe("DataGraphGenerator", () => {
    it("generates frequency tables or bar graphs", () => {
      const item = DataGraphGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_DATA_GRAPHS.id);
      expect(item.problem_content.stem).toMatch(/Frequency Table|Bar Graph/);

      const vars = item.problem_content.variables as any;
      expect(["FREQ_TABLE", "BAR_GRAPH"]).toContain(vars.mode);

      const ansStr = item.solution_logic.final_answer_canonical;
      const ans = parseInt(ansStr);
      expect(ans).toBeGreaterThanOrEqual(0);
    });
  });
});
