/* eslint-disable @typescript-eslint/no-explicit-any */
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
  SKILL_SYMMETRY,
  SKILL_ANGLES_MEASURE,
  SKILL_LINE_PLOTS,
  SKILL_SHAPE_CLASSIFICATION,
  DataGraphGenerator,
  SKILL_DATA_GRAPHS,
  ProtractorGenerator,
  SKILL_PROTRACTOR_MEASURE,
  MoneyWordProblemGenerator,
  SKILL_MONEY_WORD_PROBLEMS,
} from "./grade4-meas-geo";

// Helper for deterministic tests
const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) {
      // Return a neutral value (0.5) if sequence exhausted, or throw to strictness?
      // For these tests, better to return 0.5 to not crash, but specific tests should target indices.
      return 0.5;
    }
    return sequence[index++];
  };
};

describe("grade4-meas-geo generator", () => {
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

  describe("GeometryGenerator", () => {
    it("classifies ACUTE angle", () => {
      // 1. Type (>0.5 for ANGLE) -> 0.6
      // 2. Deg -> 0.2 (low value -> Acute)
      const rng = createMockRng([0.6, 0.2]); // 10 + 0.2*(160) approx 42 deg
      const item = GeometryGenerator.generate(0.5, rng);
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

    // Hard to force exactly 90 with randomInt unless we mock it perfectly or loop
    // But we covered branches for <90 and >90.

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

  describe("LinePlotGenerator", () => {
    it("generates READING (Type 1) questions", () => {
      // 1. Data generation (4 counts) -> [0.5, 0.5, 0.5, 0.5]
      // 2. qType (1-3) -> 1 (mapped from low rng? randomInt(1,3))
      //    Let's use specific sequence for randomInt logic if needed,
      //    but createMockRng is strictly sequential. randomInt uses rng() * (max-min+1)
      //    1 + floor(0.1 * 3) = 1 + 0 = 1
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.1, 0.5]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("How many leaves were");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("generates TOTAL LENGTH (Type 2) questions", () => {
      // qType=2 requires rng yielding index 1 (0.34-0.66 range effectively for 1-3)
      // 1 + floor(0.5 * 3) = 1 + 1 = 2
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.5]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("total length");
      // Check that answer is a fraction or number
      expect(item.solution_logic.final_answer_canonical).toBeDefined();
    });

    it("generates RANGE (Type 3) questions", () => {
      // qType=3 -> 0.9
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.9]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain(
        "difference between the **longest**"
      );
    });

    it("generates correct skill ID", () => {
      const rng = createMockRng([0.1]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_LINE_PLOTS.id);
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

  describe("DataGraphGenerator", () => {
    it("generates FREQUENCY TABLE (Value Question)", () => {
      // 1. Mode (>0.5 FreqTable) -> 0.6
      // 2-5. Vals -> 0.5
      // 6. qType (1-3) -> 0.1 (Type 1)
      const rng = createMockRng([0.6, 0.5, 0.5, 0.5, 0.5, 0.1, 0.5]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Frequency Table");
      expect(item.problem_content.stem).toContain("How many items are"); // Type 1
    });

    it("generates BAR GRAPH (Compare Question)", () => {
      // 1. Mode (>0.5 FreqTable) -> 0.4 (Bar Graph)
      // 2-5. Vals -> 0.5
      // 6. qType -> 0.5 (Type 2: 1+floor(0.5*3)=2)
      // 7. idx1 -> 0.1
      // 8. idx2 -> 0.9 (distinct)
      const rng = createMockRng([0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.1, 0.9]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Bar Graph");
      expect(item.problem_content.stem).toContain("How many **more**"); // Type 2
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("generates TOTAL Question", () => {
      // 1. Mode -> 0.6
      // 2-5. Vals -> 0.5
      // 6. qType -> 0.9 (Type 3)
      const rng = createMockRng([0.6, 0.5, 0.5, 0.5, 0.5, 0.9]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("total"); // Type 3
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("generates correct skill ID", () => {
      // Sequence: Mode(0.5->Bar), Val1-4(0.5), qType(0.1->1=Reading)
      const rng = createMockRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.1]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_DATA_GRAPHS.id);
    });
  });
});
