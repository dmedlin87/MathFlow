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

    it("classifies RIGHT angle", () => {
      // 1. Type -> 0.6 (ANGLE)
      // 2. Deg -> 0.497 (floor(0.497 * 161) + 10 = 80 + 10 = 90)
      const rng = createMockRng([0.6, 0.497]);
      const item = GeometryGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Right");
      expect(item.problem_content.variables?.deg).toBe(90);
      expect(item.solution_logic.steps[0].math).toContain("equal to");
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

    it("covers Rectangle riddle", () => {
      // Rectangle is index 0 in questions array
      const rng = createMockRng([0.0]);
      const item = ShapeClassificationGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Rectangle");
    });

    it("covers Right Triangle riddle", () => {
      // Right Triangle is index 1
      const rng = createMockRng([0.33]);
      const item = ShapeClassificationGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Right Triangle");
    });

    it("covers Trapezoid riddle", () => {
      // Trapezoid is index 2
      const rng = createMockRng([0.66]);
      const item = ShapeClassificationGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Trapezoid");
    });

    it("covers Rhombus riddle", () => {
      // Rhombus is index 3
      const rng = createMockRng([0.99]);
      const item = ShapeClassificationGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Rhombus");
    });
  });

  describe("Additional Geometry Coverage", () => {
    it("SymmetryGenerator covers Circle (Infinite lines)", () => {
      // Circle is index 4 in shapes array (7 shapes, so rng ~0.6)
      const rng = createMockRng([0.65]);
      const item = SymmetryGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("Infinite");
    });

    it("SymmetryGenerator covers various shapes", () => {
      // Square (index 0)
      const rng1 = createMockRng([0.0]);
      const item1 = SymmetryGenerator.generate(0.5, rng1);
      expect(item1.solution_logic.final_answer_canonical).toBe("4");

      // Rectangle (index 1)
      const rngRect = createMockRng([0.2]);
      const itemRect = SymmetryGenerator.generate(0.5, rngRect);
      expect(itemRect.solution_logic.final_answer_canonical).toBe("2");

      // Equilateral Triangle (index 2)
      const rngEqui = createMockRng([0.3]);
      const itemEqui = SymmetryGenerator.generate(0.5, rngEqui);
      expect(itemEqui.solution_logic.final_answer_canonical).toBe("3");

      // Isosceles Triangle (index 3)
      const rng2 = createMockRng([0.5]);
      const item2 = SymmetryGenerator.generate(0.5, rng2);
      expect(item2.solution_logic.final_answer_canonical).toBe("1");

      // Letter A (index 5)
      const rngA = createMockRng([0.8]);
      const itemA = SymmetryGenerator.generate(0.5, rngA);
      expect(itemA.solution_logic.final_answer_canonical).toBe("1");

      // Letter H (index 6)
      const rngH = createMockRng([0.9]);
      const itemH = SymmetryGenerator.generate(0.5, rngH);
      expect(itemH.solution_logic.final_answer_canonical).toBe("2");
    });
  });

  describe("Geometry fallback coverage", () => {
    it("handles missing RNG in GeometryGenerator", () => {
      // This is mostly to cover the (rng ?? Math.random)() branches
      const item = GeometryGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_GEO_LINES_ANGLES.id);
    });

    it("handles missing RNG in SymmetryGenerator", () => {
      const item = SymmetryGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_SYMMETRY.id);
    });

    it("handles missing RNG in ShapeClassificationGenerator", () => {
      const item = ShapeClassificationGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_SHAPE_CLASSIFICATION.id);
    });
  });
});
