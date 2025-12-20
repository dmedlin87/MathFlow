import { describe, it, expect } from "vitest";
import {
  VolumeCubesGenerator,
  VolumeFormulaGenerator,
  CoordPlaneGenerator,
  ClassFiguresHierarchyGenerator,
  UnitConv5Generator,
  LinePlotGenerator,
  SKILL_5_GM_VOLUME_CUBES,
  SKILL_5_GM_VOLUME_FORMULA,
  SKILL_5_GM_COORD_PLANE,
  SKILL_5_GM_CLASS_FIGURES,
  SKILL_5_GM_UNIT_CONV,
  SKILL_5_MD_LINE_PLOTS,
} from "./meas-geo";

const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("Grade 5 GM Domain (Deterministic)", () => {
  describe(SKILL_5_GM_VOLUME_CUBES.name, () => {
    it("calculates volume correctly", () => {
      // Logic:
      // l: randomInt(2, 5) -> rng=0.0 -> 2
      // w: randomInt(2, 5) -> rng=0.5 -> 4
      // h: randomInt(2, 5) -> rng=0.99 -> 5
      // Vol: 2 * 4 * 5 = 40
      // SA: 2 * (2*4 + 2*5 + 4*5) = 2 * (8 + 10 + 20) = 2 * 38 = 76
      const rng = createMockRng([0.0, 0.5, 0.99]);
      const item = VolumeCubesGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("40");
      expect(item.misconceptions?.[0].trigger.value).toBe("76");
    });
  });

  describe(SKILL_5_GM_VOLUME_FORMULA.name, () => {
    it("calculates volume with formula correctly", () => {
      // Logic:
      // l: randomInt(5, 15) -> rng=0.0 -> 5
      // w: randomInt(2, 10) -> rng=0.5 -> floor(0.5*9)+2 = 6
      // h: randomInt(2, 12) -> rng=1.0 -> 12
      // Vol: 5 * 6 * 12 = 30 * 12 = 360
      // Add: 5 + 6 + 12 = 23
      const rng = createMockRng([0.0, 0.5, 0.99]);
      const item = VolumeFormulaGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("360");
      expect(item.misconceptions?.[0].trigger.value).toBe("23");
    });
  });

  describe(SKILL_5_GM_COORD_PLANE.name, () => {
    it("generates DIST_AXIS problem (type < 0.5)", () => {
      // x: 3, y: 7, type: 0.1
      const rng = createMockRng([
        0.3, // x=3 (0..10)
        0.7, // y=7
        0.1, // type=DIST_AXIS
      ]);
      const item = CoordPlaneGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain(
        "How many units is Point A from the **y-axis**?"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("3");
    });

    it("generates IDENTIFY problem (type >= 0.5)", () => {
      // x: 4, y: 8, type: 0.6
      const rng = createMockRng([
        0.4, // x=4
        0.8, // y=8
        0.6, // type=IDENTIFY
      ]);
      const item = CoordPlaneGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain(
        "which number is the **y-coordinate**?"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("8");
    });
  });

  describe(SKILL_5_GM_CLASS_FIGURES.name, () => {
    it("selects a hierarchy statement correctly", () => {
      // statements: 0..5 (length 6)
      // rng=0.0 -> "All squares are rectangles."
      const rng = createMockRng([0.0]);
      const item = ClassFiguresHierarchyGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("All squares are rectangles");
      expect(item.solution_logic.final_answer_canonical).toBe("True");
    });
  });

  describe(SKILL_5_GM_UNIT_CONV.name, () => {
    it("converts meters to centimeters correctly", () => {
      // val: 2.5 (from rng=0.25 * 10)
      // res: 250
      const rng = createMockRng([0.25]);
      const item = UnitConv5Generator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("250");
      expect(item.misconceptions?.[0].trigger.value).toBe("0.025");
    });
  });

  describe(SKILL_5_MD_LINE_PLOTS.name, () => {
    it("calculates total sum of liquid (type 0)", () => {
      // denominators: [2, 4, 8] -> rng=0.0 -> 2
      // count: randomInt(5, 10) -> rng=0.0 -> 5
      // n1..n5: randomInt(1, 2)
      // rngs: 0.1(1), 0.9(2), 0.1(1), 0.9(2), 0.1(1)
      // data: [1, 2, 1, 2, 1] / 2 -> Sum: 7/2
      // type: 0 (rng=0.1)
      const rng = createMockRng([
        0.0, // den=2 (index 0)
        0.0, // count=5
        0.0,
        0.9,
        0.0,
        0.9,
        0.0, // n1..n5 -> 1, 2, 1, 2, 1
        0.1, // type=0 (Sum)
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("**total** amount");
      expect(item.solution_logic.final_answer_canonical).toBe("7/2");
    });

    it("calculates range of weights (type 1)", () => {
      // den: index 2 -> 8
      // count: 5
      // n: 1, 3, 5, 7, 8
      // type: 1 (rng=0.8)
      // Range: 8/8 - 1/8 = 7/8
      const rng = createMockRng([
        0.9, // den=8 (index 2)
        0.0, // count=5
        0.1,
        0.3,
        0.5,
        0.7,
        0.9, // 1, 3, 5, 7, 8
        0.8, // type=1 (Range)
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("difference in weight");
      expect(item.solution_logic.final_answer_canonical).toBe("7/8");
    });

    it("handles whole number sums correctly", () => {
      // data: [2, 2, 2, 2] / 2 -> Sum: 8/2 = 4
      const rng = createMockRng([
        0.0, // den=2
        0.0, // count=4 (actually randomInt(5,10) so let's use count=5)
        0.9,
        0.9,
        0.9,
        0.9,
        0.9, // 2, 2, 2, 2, 2 -> 10/2 = 5
        0.1, // type=Sum
      ]);
      const item = LinePlotGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("5");
    });
  });
});

describe("MeasGeoGenerator (Default RNG Fallback)", () => {
  it("runs VolumeCubesGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = VolumeCubesGenerator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs VolumeFormulaGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = VolumeFormulaGenerator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs CoordPlaneGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = CoordPlaneGenerator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs ClassFiguresHierarchyGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = ClassFiguresHierarchyGenerator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs UnitConv5Generator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = UnitConv5Generator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs LinePlotGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = LinePlotGenerator.generate(0.5);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });
});
