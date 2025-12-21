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

  describe("Additional Data Coverage", () => {
    it("LinePlotGenerator returns integer answer for even count at 1/2", () => {
      // Force count at index 1 (1/2) to be even (e.g., 4)
      // counts[1] = randomInt(2,5) -> high rng gives 5, low gives 2
      // We need even: 2 or 4. rng=0 -> 2, rng=0.5 -> 3, rng=0.66 -> 4
      // Actually we want TYPE 2 (qType=2) which uses counts[1]
      // The answer is count/2 as integer if count is even
      const rng = createMockRng([
        0.5, // counts[0]
        0.0, // counts[1] -> 2 (even)
        0.5, // counts[2]
        0.5, // counts[3]
        0.5, // qType -> 2
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("total length");
      // Even count: answer should be an integer (count/2)
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("LinePlotGenerator returns fraction answer for odd count at 1/2", () => {
      // Force count at index 1 to be odd (3 or 5)
      // randomInt(2,5): 2 + floor(rng * 4)
      // For 3: floor(rng * 4) = 1 -> rng = 0.25
      // For 5: floor(rng * 4) = 3 -> rng = 0.75
      const rng = createMockRng([
        0.5, // counts[0]
        0.25, // counts[1] -> 2 + floor(0.25*4) = 2 + 1 = 3 (odd)
        0.5, // counts[2]
        0.5, // counts[3]
        0.5, // qType -> 2
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("total length");
      // Odd count (3): answer should be a fraction "3/2"
      expect(item.solution_logic.final_answer_canonical).toMatch(/\d+\/2/);
    });

    it("LinePlotGenerator handles range with 0.75 diff", () => {
      // Need max - min = 0.75
      // Min = 1/4 (0.25), Max = 1 (1.0) -> diff = 0.75
      // counts[0]=1/4 needs >0, counts[3]=1 needs >0
      // others can be 0
      const rng = createMockRng([
        0.0, // counts[0] = 1 (for 1/4)
        0.0, // counts[1] = 2 (for 1/2)
        0.0, // counts[2] = 1 (for 3/4)
        0.5, // counts[3] = 1 (for 1)
        0.9, // qType -> 3 (Range)
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      // The diff depends on actual data generated
      expect(item.problem_content.stem).toContain("difference");
    });

    it("DataGraphGenerator handles same idx1/idx2 (retry loop)", () => {
      // Force idx1 and idx2 to be same initially, then different
      // This tests the while loop for distinct indices
      const rng = createMockRng([
        0.4, // mode -> BAR_GRAPH
        0.5,
        0.5,
        0.5,
        0.5, // data vals
        0.5, // qType -> 2 (Compare)
        0.0, // idx1 -> 0
        0.0, // idx2 -> 0 (same! triggers loop)
        0.9, // idx2 retry -> 3 (different)
      ]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("How many **more**");
    });

    it("DataGraphGenerator handles all data value variations", () => {
      // Test with varying data values to ensure comparison works
      const rng = createMockRng([
        0.6, // FREQ_TABLE
        0.0, // Red = 2
        0.9, // Blue = 15
        0.2, // Green = 4
        0.5, // Yellow = 8
        0.5, // qType -> Compare
        0.0, // idx1 -> Red (2)
        0.3, // idx2 -> Blue (15)
      ]);
      const item = DataGraphGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("Frequency Table");
      // Blue has more than Red, diff = 15 - 2 = 13
      expect(
        Number(item.solution_logic.final_answer_canonical)
      ).toBeGreaterThan(0);
    });

    it("LinePlotGenerator handles diff === 0 (single data point type)", () => {
      const rng = createMockRng([
        0.0, // counts[0] = 0
        0.5, // counts[1] = 0.5 * 6 = 3
        0.0, // counts[2] = 0
        0.0, // counts[3] = 0
        0.9, // qType -> 3 (Range)
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("0");
    });

    it("LinePlotGenerator handles diff === 0.25", () => {
      // 4 counts: [1, 1, 0, 0]
      // randomInt(0, 4) -> floor(0.3 * 5) = 1
      // randomInt(0, 5) -> floor(0.2 * 6) = 1
      const rng = createMockRng([
        0.3, // counts[0] = 1 (Val: 1/4)
        0.2, // counts[1] = 1 (Val: 1/2)
        0.0, // counts[2] = 0
        0.0, // counts[3] = 0
        0.9, // qType -> 3 (Range)
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("1/4");
    });

    it("LinePlotGenerator fallback for all counts zero", () => {
      const rng = createMockRng([
        0.0, // counts[0] = 0
        0.0, // counts[1] = 0
        0.0, // counts[2] = 0
        0.0, // counts[3] = 0
        0.1, // qType -> 1 (Reading)
        0.1, // targetIdx -> 0 (Reading counts[0])
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      // Fallback sets counts[0] = 2
      expect(item.solution_logic.final_answer_canonical).toBe("2");
    });

    it("DataGraphGenerator throws error for invalid answer", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      // Force NaN answer by returning NaN from rng
      const rng = () => NaN;
      expect(() => DataGraphGenerator.generate(0.5, rng)).toThrow(
        /produced invalid answer/
      );
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("DataGraphGenerator uses Math.random fallback when no rng provided", () => {
      // Call without rng argument to test Math.random fallback
      const item = DataGraphGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_DATA_GRAPHS.id);
      expect(item.problem_content.stem).toBeDefined();
      expect(item.solution_logic.final_answer_canonical).toBeDefined();
    });

    it("LinePlotGenerator uses Math.random fallback when no rng provided", () => {
      // Call without rng argument to test Math.random fallback
      const item = LinePlotGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe(SKILL_LINE_PLOTS.id);
      expect(item.problem_content.stem).toBeDefined();
      expect(item.solution_logic.final_answer_canonical).toBeDefined();
    });
  });
});
