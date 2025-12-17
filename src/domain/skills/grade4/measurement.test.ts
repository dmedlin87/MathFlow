/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  AreaPerimeterGenerator,
  UnitConversionGenerator,
  AngleMeasureGenerator,
  MoneyWordProblemGenerator,
  ProtractorGenerator,
  SKILL_AREA_PERIMETER,
  SKILL_UNIT_CONVERSION,
  SKILL_ANGLES_MEASURE,
  SKILL_MONEY_WORD_PROBLEMS,
  SKILL_PROTRACTOR_MEASURE,
} from "./measurement";
import { createMockRng } from "../../test-utils";

describe("grade4 measurement generator", () => {
  describe("AreaPerimeterGenerator", () => {
    it("generates Area problem for non-square rectangle", () => {
      // rng sequence:
      // 1. isSquare check (>0.8 for square) -> 0.5 (False)
      // 2. Width -> 0.1 (maps towards min)
      // 3. Length -> 0.1
      // 4. Mode (>0.5 for PERIMETER) -> 0.1 (AREA)
      const rng = createMockRng([0.5, 0.1, 0.1, 0.1]);
      const item = AreaPerimeterGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_AREA_PERIMETER.id);
      expect(item.problem_content.stem).toContain("Area");
      expect(item.problem_content.stem).not.toContain("Perimeter");
      const { l, w } = item.problem_content.variables as any;

      // Verification logic
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(l * w);
      expect(item.solution_logic.steps[0].math).toContain(`${l} \\times ${w}`);
    });

    it("generates Area problem for Square", () => {
      // 1. isSquare (>0.8) -> 0.9 (True)
      // 2. Width -> 0.5
      // 3. Length (skipped for square)
      // 4. Mode -> 0.1 (AREA)
      const rng = createMockRng([0.9, 0.5, 0.1]);
      const item = AreaPerimeterGenerator.generate(0.5, rng);
      const { l, w } = item.problem_content.variables as any;
      expect(l).toBe(w);
      expect(item.problem_content.stem).toContain("Area");
    });

    it("generates Perimeter problem", () => {
      // 1. isSquare -> 0.5 (False)
      // 2. Width -> 0.5
      // 3. Length -> 0.5
      // 4. Mode (>0.5) -> 0.9 (PERIMETER)
      const rng = createMockRng([0.5, 0.5, 0.5, 0.9]);
      const item = AreaPerimeterGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Perimeter");
      const { l, w } = item.problem_content.variables as any;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        2 * (l + w)
      );
    });
  });

  describe("UnitConversionGenerator", () => {
    it("generates valid conversion", () => {
      // 1. Rule Index -> 0.1
      // 2. Value -> 0.5
      const rng = createMockRng([0.1, 0.5]);
      const item = UnitConversionGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_UNIT_CONVERSION.id);
      expect(item.problem_content.stem).toContain("Convert");
      const { val, from, to } = item.problem_content.variables as any;
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      expect(val).toBeGreaterThan(0);
    });
  });

  describe("AngleMeasureGenerator", () => {
    it("generates Find TOTAL angle problem", () => {
      // 1. Mode (>0.4 ADDITIVE) -> 0.6
      // 2. Angle1 -> 0.5
      // 3. Angle2 -> 0.5
      // 4. FindTotal (>0.5) -> 0.6 (True)
      const rng = createMockRng([0.6, 0.5, 0.5, 0.6]);
      const item = AngleMeasureGenerator.generate(0.5, rng);
      const { angle1, angle2 } = item.problem_content.variables as any;
      const total = angle1 + angle2;
      expect(item.problem_content.stem).toContain(
        "What is the measure of Angle"
      );
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(total);
    });

    it("generates Find PART angle problem", () => {
      // 1. Mode (>0.4) -> 0.6
      // 2. Angle1 -> 0.5
      // 3. Angle2 -> 0.5
      // 4. FindTotal (>0.5) -> 0.4 (False)
      const rng = createMockRng([0.6, 0.5, 0.5, 0.4]);
      const item = AngleMeasureGenerator.generate(0.5, rng);
      const { total, angle1 } = item.problem_content.variables as any;
      const part = total - angle1;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(part);
    });

    it("generates TURN/CIRCLE problem", () => {
      // 1. Mode (>0.4 ADDITIVE) -> 0.1 (TURNS)
      // 2. Choice Index -> 0.5
      const rng = createMockRng([0.1, 0.5]);
      const item = AngleMeasureGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("turn");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/); // Should be integer degrees
    });

    it("generates correct skill ID", () => {
      const rng = createMockRng([0.1, 0.5]);
      const item = AngleMeasureGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_ANGLES_MEASURE.id);
    });
  });

  describe("MoneyWordProblemGenerator", () => {
    it("generates TOTAL COST problem", () => {
      // 1. Price1 -> 0.5
      // 2. .99 -> 0.5
      // 3. Price2 -> 0.5
      // 4. .99 -> 0.5
      // 5. Mode (>0.5 TOTAL) -> 0.6
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.6]);
      const item = MoneyWordProblemGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("spend in total");
      // Simple validity check
      const { p1, p2 } = item.problem_content.variables as any;
      const total = p1 + p2;
      expect(
        parseFloat(item.solution_logic.final_answer_canonical)
      ).toBeCloseTo(total);
    });

    it("generates CHANGE problem", () => {
      // 5. Mode -> 0.4 (CHANGE)
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.4]);
      const item = MoneyWordProblemGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("change should he receive");
      const { total, paid } = item.problem_content.variables as any;
      expect(
        parseFloat(item.solution_logic.final_answer_canonical)
      ).toBeCloseTo(paid - total);
    });

    it("generates correct skill ID", () => {
      const rng = createMockRng([0.1]);
      const item = MoneyWordProblemGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_MONEY_WORD_PROBLEMS.id);
    });
  });

  describe("ProtractorGenerator", () => {
    it("generates simple protractor problem", () => {
      const rng = createMockRng([0.5, 0.5]);
      const item = ProtractorGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("points to");
      const { start, end } = item.problem_content.variables as any;
      expect(parseInt(item.solution_logic.final_answer_canonical)).toBe(
        end - start
      );
    });

    it("generates correct skill ID", () => {
      const rng = createMockRng([0.5, 0.5]);
      const item = ProtractorGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_PROTRACTOR_MEASURE.id);
    });
  });
});
