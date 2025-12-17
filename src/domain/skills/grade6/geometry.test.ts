import { describe, it, expect } from "vitest";
import {
  AreaPolyGenerator,
  SurfaceAreaGenerator,
  VolumeFracGenerator,
  PolygonsCoordGenerator,
  SKILL_6_G_AREA,
  SKILL_6_G_SURFACE_AREA,
  SKILL_6_G_VOLUME_FRAC,
  SKILL_6_G_POLYGONS_COORD,
} from "./geometry";

const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) return 0.5;
    return sequence[index++];
  };
};

describe("Grade 6 Geometry Generators (Deterministic)", () => {
  describe("SKILL_6_G_AREA", () => {
    it("calculates area of a triangle correctly", () => {
      // Logic:
      // type: floor(rng*3). rng=0.5 -> 1 (Triangle).
      // b: randomInt(2,12). rng=0.1 -> 3.
      // h: randomInt(2,12). rng=0.5 -> 7.
      // Area = 0.5 * 3 * 7 = 10.5.

      const rng = createMockRng([
        0.5, // Triangle
        0.1, // b=3
        0.5, // h=7
      ]);

      const item = AreaPolyGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_G_AREA.id);
      expect(item.solution_logic.final_answer_canonical).toBe("10.5");
      expect(item.problem_content.stem).toContain("triangle");
    });

    it("calculates area of a rectangle correctly", () => {
      // Logic:
      // type: floor(rng*3). rng=0.1 -> 0 (Rect/Para).
      // b: randomInt(2,12). rng=0.5 -> 7.
      // h: randomInt(2,12). rng=0.5 -> 7.
      // shape: rng < 0.5 ? rect : para. rng=0.1 -> rect.
      // Area = 49.

      const rng = createMockRng([
        0.1, // Rect
        0.5, // b=7
        0.5, // h=7
        0.1, // "rectangle"
      ]);

      const item = AreaPolyGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("49");
      expect(item.problem_content.stem).toContain("rectangle");
    });
  });

  describe("SKILL_6_G_SURFACE_AREA", () => {
    it("calculates surface area of a cube", () => {
      // Logic:
      // isCube: rng < 0.4. rng=0.1 (True).
      // s: randomInt(2,10). rng=0.5 -> 6.
      // SA = 6 * s^2 = 6 * 36 = 216.

      const rng = createMockRng([
        0.1, // Cube
        0.5, // s=6
      ]);

      const item = SurfaceAreaGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe(SKILL_6_G_SURFACE_AREA.id);
      expect(item.solution_logic.final_answer_canonical).toBe("216");
      expect(item.problem_content.stem).toContain("cube");
    });
  });

  describe("SKILL_6_G_VOLUME_FRAC", () => {
    it("calculates volume with fractions", () => {
      // Logic:
      // lNum: randomInt(1,4). rng=0.1 -> 1.
      // lDen: randomInt(2,5). rng=0.5 -> 3. (1/3)
      // wNum: randomInt(1,4). rng=0.1 -> 1.
      // wDen: randomInt(2,5). rng=0.5 -> 3. (1/3)
      // h: randomInt(2,10). rng=0.5 -> 6.
      // Vol = 1/4 * 1/4 * 6 = 6/16 = 3/8.

      const rng = createMockRng([
        0.1, // lNum=1
        0.5, // lDen=3
        0.1, // wNum=1
        0.5, // wDen=3
        0.5, // h=6
      ]);

      const item = VolumeFracGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("3/8");
    });
  });

  describe("SKILL_6_G_POLYGONS_COORD", () => {
    it("calculates vertical distance between points", () => {
      // Logic:
      // x: randomInt(-10,10). rng=0.5 -> 0.
      // y1: randomInt(-10,10). rng=0.1 -> -8. (-2+floor(2.1)=-8 ?)
      // range=21. floor(0.1*21) + -10 = 2-10 = -8.
      // y2: randomInt(-10,10). rng=0.9 -> floor(0.9*21)-10 = 18-10 = 8.
      // Dist = |-8 - 8| = 16.

      const rng = createMockRng([
        0.5, // x=0
        0.1, // y1=-8
        0.9, // y2=8
      ]);

      const item = PolygonsCoordGenerator.generate(0.5, rng);
      expect(item.solution_logic.final_answer_canonical).toBe("16");
    });
  });
});
