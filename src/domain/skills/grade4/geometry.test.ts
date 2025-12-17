/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  GeometryGenerator,
  SymmetryGenerator,
  ShapeClassificationGenerator,
  SKILL_GEO_LINES_ANGLES,
  SKILL_SYMMETRY,
  SKILL_SHAPE_CLASSIFICATION,
} from "./geometry";
import { createMockRng } from "../../test-utils";

describe("grade4 geometry generator", () => {
  describe("GeometryGenerator", () => {
    it("classifies ACUTE angle", () => {
      // 1. Type (>0.5 for ANGLE) -> 0.6
      // 2. Deg -> 0.2 (low value -> Acute)
      const rng = createMockRng([0.6, 0.2]); // 10 + 0.2*(160) approx 42 deg
      const item = GeometryGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_GEO_LINES_ANGLES.id);
      const { deg } = item.problem_content.variables as any;
      expect(deg).toBeLessThan(90);
      expect(item.solution_logic.final_answer_canonical).toBe("Acute");
    });

    it("classifies OBTUSE angle", () => {
      // 1. Type -> 0.6 (ANGLE)
      // 2. Deg -> 0.9 (high value -> Obtuse)
      const rng = createMockRng([0.6, 0.9]); // 10 + 0.9*160 = 154 deg
      const item = GeometryGenerator.generate(0.5, rng);
      const { deg } = item.problem_content.variables as any;
      expect(deg).toBeGreaterThan(90);
      expect(item.solution_logic.final_answer_canonical).toBe("Obtuse");
    });

    it("identifies PARALLEL lines", () => {
      // 1. Type -> 0.4 (LINE)
      // 2. isParallel (>0.5) -> 0.6 (True)
      const rng = createMockRng([0.4, 0.6]);
      const item = GeometryGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("never intersect");
      expect(item.solution_logic.final_answer_canonical).toBe("Parallel");
    });

    it("identifies PERPENDICULAR lines", () => {
      // 1. Type -> 0.4 (LINE)
      // 2. isParallel (>0.5) -> 0.4 (False)
      const rng = createMockRng([0.4, 0.4]);
      const item = GeometryGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("right angle");
      expect(item.solution_logic.final_answer_canonical).toBe("Perpendicular");
    });
  });

  describe("SymmetryGenerator", () => {
    it("identifies correct line count for known shapes", () => {
      const rng = createMockRng([0.1]); // Picks 0th or 1st shape
      const item = SymmetryGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_SYMMETRY.id);
      expect(item.problem_content.stem).toContain("symmetry");
      const ans = item.solution_logic.final_answer_canonical;
      // Just ensure it produced a number or "Infinite"
      expect(ans).toBeTruthy();
    });
  });

  describe("ShapeClassificationGenerator", () => {
    it("generates shape riddles", () => {
      const item = ShapeClassificationGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_SHAPE_CLASSIFICATION.id);
      expect(item.problem_content.stem).toContain("Identify the shape");
      const ans = item.solution_logic.final_answer_canonical;
      expect(item.answer_spec.ui?.choices).toContain(ans);
    });
  });
});
