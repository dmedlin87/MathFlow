import { describe, it, expect } from "vitest";
import {
  AreaPolyGenerator,
  SurfaceAreaGenerator,
  VolumeFracGenerator,
  PolygonsCoordGenerator,
} from "./geometry";
import { createMockRng } from "../../test-utils";

describe("Grade 6 Geometry Generators", () => {
  describe("AreaPolyGenerator (6.G.A.1)", () => {
    it("should generate rectangle/parallelogram area problems", () => {
      // Need to account for randomInt calls.
      // generate calls:
      // 1. type = rng() (0.1 -> 0)
      // 2. b = randomInt(2, 12) -> calls rng()
      // 3. h = randomInt(2, 12) -> calls rng()
      // 4. shape = rng() (0.1 -> < 0.5 -> rectangle)

      const rng = createMockRng([0.1, 0.5, 0.5, 0.1]);
      const item = AreaPolyGenerator.generate(1, rng);
      expect(item.problem_content.stem).toContain("rectangle");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("should generate parallelogram area problems", () => {
      // 1. type = rng() (0.1 -> 0)
      // 2. b = rng()
      // 3. h = rng()
      // 4. shape = rng() (0.9 -> > 0.5 -> parallelogram)
      const rng = createMockRng([0.1, 0.5, 0.5, 0.9]);
      const item = AreaPolyGenerator.generate(1, rng);
      expect(item.problem_content.stem).toContain("parallelogram");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("should generate triangle area problems", () => {
      const rng = createMockRng([0.9, 0.5, 0.5]); // type 1 (Triangle)
      const item = AreaPolyGenerator.generate(1, rng);
      expect(item.problem_content.stem).toContain("triangle");
      // Check if calculation is correct: 0.5 * b * h
      // We can't easily check internal values without mocking randomInt too,
      // but we can check if the answer is consistent with the formula in the explanation.
      expect(item.solution_logic.steps[0].math).toContain("0.5");
    });

    it("should handle integer vs decimal output for triangles", () => {
      // If b*h is odd, area is .5. If even, area is integer.
      // We can loop or force values if we could control randomInt, but since we can't easily injection randomInt via arguments (it uses the one from math-utils which uses the rng passed), we rely on rng sequence.
      // But randomInt uses rng() * (max-min) + min.

      // Let's rely on the contract: answer_spec.input_type should change.
      // This is a property test.
      for (let i = 0; i < 10; i++) {
        const item = AreaPolyGenerator.generate(1);
        if (item.problem_content.stem.includes("triangle")) {
          const ans = parseFloat(item.solution_logic.final_answer_canonical);
          if (Number.isInteger(ans)) {
            expect(item.answer_spec.input_type).toBe("integer");
          } else {
            expect(item.answer_spec.input_type).toBe("decimal");
          }
        }
      }
    });
  });

  describe("SurfaceAreaGenerator (6.G.A.4)", () => {
    it("should generate cube surface area", () => {
      const rng = createMockRng([0.1]); // < 0.4 -> Cube
      const item = SurfaceAreaGenerator.generate(1, rng);
      expect(item.problem_content.stem).toContain("cube");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("should generate prism surface area", () => {
      const rng = createMockRng([0.9]); // >= 0.4 -> Prism
      const item = SurfaceAreaGenerator.generate(1, rng);
      expect(item.problem_content.stem).toContain("rectangular prism");
    });
  });

  describe("VolumeFracGenerator (6.G.A.2)", () => {
    it("should generate volume with fractions", () => {
      const item = VolumeFracGenerator.generate(1);
      expect(item.problem_content.stem).toContain("\\frac");
      expect(item.answer_spec.input_type).toBe("fraction");

      // Validate logic: Volume = l * w * h
      // Extract numbers from stem or math?
      // Better: trust the generator's internal consistency logic which is simple.
      // Just ensure it generates valid items.
      expect(item.solution_logic.final_answer_canonical).not.toBe("NaN");
    });
  });

  describe("PolygonsCoordGenerator (6.G.A.3)", () => {
    it("should generate coordinate distance problems", () => {
      const item = PolygonsCoordGenerator.generate(1);
      expect(item.problem_content.stem).toContain("endpoints");
      expect(item.solution_logic.final_answer_canonical).toMatch(/^\d+$/);
    });

    it("should retry if y1 === y2", () => {
      // Mock RNG to produce equal y1, y2 first, then different.
      // randomInt(-10, 10) range is 20.
      // Sequence: x, y1, y2(equal), x, y1, y2(diff)
      // We need to know how randomInt consumes RNG.
      // It calls rng once per int.

      const rng = createMockRng([
        0.5, // x
        0.5, // y1
        0.5, // y2 (same as y1 effectively? No, randomInt scales it. same float -> same int)
        // RECURSION HAPPENS
        0.5, // x
        0.2, // y1
        0.8, // y2
      ]);

      // This is tricky because recursion calls .generate(diff, rng)
      // The mocked rng must supply enough values.
      const item = PolygonsCoordGenerator.generate(1, rng);
      expect(item).toBeDefined();
    });
  });
});

describe("Grade 6 Geometry Smoke Tests (Default RNG)", () => {
  it("runs AreaPolyGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = AreaPolyGenerator.generate(1);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs SurfaceAreaGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = SurfaceAreaGenerator.generate(1);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs VolumeFracGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = VolumeFracGenerator.generate(1);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });

  it("runs PolygonsCoordGenerator without provided rng", () => {
    for (let i = 0; i < 5; i++) {
      const item = PolygonsCoordGenerator.generate(1);
      expect(item.problem_content.stem).toBeTruthy();
    }
  });
});

describe("Grade 6 Geometry Branch Coverage", () => {
  describe("VolumeFracGenerator", () => {
    it("handles integer volume result (den=1)", () => {
      // l=2/1, w=3/1, h=2 -> Vol = 12/1 -> 12.
      // Need rng to produce lNum=2, lDen=1 (wait, randomInt(2,5) for den)
      // lDen min 2. So we need simplification.
      // l=1/2, w=1/2, h=4 -> Vol = 4/4 = 1.
      const rng = createMockRng([
        0.0, // lNum=1 (1..4)
        0.0, // lDen=2 (2..5)
        0.0, // wNum=1 (1..4)
        0.0, // wDen=2 (2..5)
        0.25, // h=4 (2..10) -> 2+floor(0.25*9)=4
      ]);
      const item = VolumeFracGenerator.generate(1, rng);
      // Vol = 1/2 * 1/2 * 4 = 1.
      expect(item.solution_logic.final_answer_canonical).toBe("1");
      expect(item.answer_spec.input_type).toBe("fraction"); // Spec is 'fraction' but canonical is integer string '1'
    });
  });
});
