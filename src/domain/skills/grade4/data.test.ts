/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  LinePlotGenerator,
  DataGraphGenerator,
  SKILL_LINE_PLOTS,
  SKILL_DATA_GRAPHS,
} from "./data";
import { createMockRng } from "../../test-utils";

describe("grade4 data generator", () => {
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
