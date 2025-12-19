import { describe, it, expect } from "vitest";
import {
  RatiosGenerator,
  UnitRateGenerator,
  PercentsGenerator,
  RatioTablesGenerator,
  UnitConversionRPGenerator,
} from "./rp";
import { createMockRng } from "../../test-utils";

describe("Grade 6 RP Generators", () => {
  describe("RatiosGenerator", () => {
    it("Type 0: Generates basic ratio writing problem (Order: Direct)", () => {
      // Sequence:
      // 1. type < 0.5 -> 0.1 (Type 0)
      // 2. a (2-12) -> 0.0 -> 2
      // 3. b (2-12) -> 0.0 -> 2
      // 4. s1 index (0-3) -> 0.0 -> 0 (dogs)
      // 5. s2 index (0-3) -> 0.0 -> 0 -> odd index -> cats (index 1)
      // 6. askForOrder < 0.5 -> 0.1 (True -> s1 to s2)
      // Note: b=2 because randomInt(2,12) with 0.0 is 2.
      // But let's act normal.
      const rng = createMockRng([0.1, 0.0, 0.0, 0.0, 0.0, 0.1]);
      const item = RatiosGenerator.generate(0.5, rng);

      expect(item.meta.skill_id).toBe("6.rp.ratios");
      // s1=dogs, s2=cats. Target: dogs to cats. a=2, b=2.
      // Actually s1 calc: subjects[0*2] = dogs. s2: subjects[0*2+1] = cats.
      expect(item.problem_content.stem).toContain(
        "There are 2 dogs and 2 cats"
      );
      expect(item.problem_content.stem).toContain(
        "ratio of **dogs** to **cats**"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("2:2");
    });

    it("Type 0: covers askForOrder branch (rng ?? Math.random)", () => {
      // In RatiosGenerator.generate:
      // const askForOrder = (rng ?? Math.random)() < 0.5;
      // If we pass an rng, it uses it. This hits the branch logic in the SUT.
      const rng = createMockRng([0.1, 0.5, 0.5, 0.0, 0.0, 0.6]); // askForOrder = false
      const item = RatiosGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe("6.rp.ratios");

      // Now force the fallback branch by NOT passing an rng.
      // This will use Math.random() internally.
      const itemFallback = RatiosGenerator.generate(0.5);
      expect(itemFallback.meta.skill_id).toBe("6.rp.ratios");
    });

    it("Type 0: Generates basic ratio writing problem (Order: Reversed)", () => {
      // Sequence:
      // 1. type < 0.5 -> 0.1 (Type 0)
      // 2. a -> 0.5 -> 2 + floor(0.5*11)=7
      // 3. b -> 0.5 -> 7
      // 4. s1 index -> 0.9 (last) -> 3 -> pens
      // 5. s2 index -> 0.9 (last) -> 3 -> pencils
      // 6. askForOrder >= 0.5 -> 0.8 (False -> s2 to s1)
      const rng = createMockRng([0.1, 0.5, 0.5, 0.9, 0.9, 0.8]);
      const item = RatiosGenerator.generate(0.5, rng);

      expect(item.problem_content.stem).toContain(
        "There are 7 pens and 7 pencils"
      );
      expect(item.problem_content.stem).toContain(
        "ratio of **pencils** to **pens**"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("7:7");
    });

    it("Type 1: Generates equivalent ratio / scale up problem", () => {
      // Sequence:
      // 1. type >= 0.5 -> 0.8 (Type 1)
      // 2. m (2-5) -> 0.0 -> 2
      // 3. a (1-10) -> 0.0 -> 1
      // 4. b (1-10) -> 0.5 -> 1 + floor(0.5*10) = 6
      const rng = createMockRng([0.8, 0.0, 0.0, 0.5]);
      const item = RatiosGenerator.generate(0.5, rng);

      // a=1, b=6, m=2. Scaled: 2:12.
      // Q: Ratio 1:6. If 2 flour, how many sugar? (2:?) -> 12.
      expect(item.problem_content.stem).toContain(
        "ratio of flour to sugar in a recipe is 1:6"
      );
      expect(item.problem_content.stem).toContain("If you use 2 cups of flour");
      expect(item.solution_logic.final_answer_canonical).toBe("12");
      expect(item.misconceptions?.[0].id).toBe("misc_additive");
    });

    it("covers fallback RNG", () => {
      const item = RatiosGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe("6.rp.ratios");
      expect(item.problem_content.stem).toBeDefined();
    });

    it("covers different subjects", () => {
      // s1 calc: randomInt(0, 3) * 2. rng=0.9 -> 3 * 2 = 6 (pens)
      // s2 calc: randomInt(0, 3) * 2 + 1. rng=0.9 -> 3 * 2 + 1 = 7 (pencils)
      // Wait, the subjects array has 8 items (0-7).
      // dogs(0), cats(1), apples(2), oranges(3), boys(4), girls(5), pens(6), pencils(7)
      const rng = createMockRng([0.1, 0.5, 0.5, 0.8, 0.8, 0.1]);
      const item = RatiosGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("pens");
      expect(item.problem_content.stem).toContain("pencils");
    });
  });

  describe("UnitRateGenerator", () => {
    it("Type 'cost': Generates unit price problem", () => {
      // Sequence:
      // 1. type < 0.5 -> 0.1 ("cost")
      // 2. units (3-12) -> 0.0 -> 3
      // 3. pricePerUnit (2-9) -> 0.0 -> 2
      // 4. extra coin (0.5 check) -> 0.1 (True -> +0.5) -> price 2.5
      const rng = createMockRng([0.1, 0.0, 0.0, 0.1]);
      const item = UnitRateGenerator.generate(0.5, rng);

      // Total cost = 3 * 2.5 = 7.5
      expect(item.problem_content.stem).toContain("If 3 notebooks cost $7.50");
      expect(item.solution_logic.final_answer_canonical).toBe("2.5");
      expect(item.misconceptions?.[0].id).toBe("misc_invert");
    });

    it("Type 'speed': Generates speed problem", () => {
      // Sequence:
      // 1. type >= 0.5 -> 0.8 ("speed")
      // 2. hours (2-5) -> 0.0 -> 2
      // 3. speed (40-70) -> 0.0 -> 40
      const rng = createMockRng([0.8, 0.0, 0.0]);
      const item = UnitRateGenerator.generate(0.5, rng);

      // Miles = 80
      expect(item.problem_content.stem).toContain(
        "travels 80 miles in 2 hours"
      );
      expect(item.solution_logic.final_answer_canonical).toBe("40");
    });

    it("covers fallback RNG", () => {
      const item = UnitRateGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe("6.rp.unit_rate");
      expect(item.problem_content.stem).toBeDefined();
    });

    it("Type 'cost' covers extra coin flip branch (rng ?? Math.random)", () => {
      // In UnitRateGenerator.generate:
      // + ((rng ?? Math.random)() < 0.5 ? 0.5 : 0);
      const rng = createMockRng([0.1, 0.0, 0.0, 0.6]); // extra coin = false
      const item = UnitRateGenerator.generate(0.5, rng);
      expect(item.meta.skill_id).toBe("6.rp.unit_rate");

      // Now force the fallback branch by NOT passing an rng.
      const itemFallback = UnitRateGenerator.generate(0.5);
      expect(itemFallback.meta.skill_id).toBe("6.rp.unit_rate");
    });
  });

  describe("PercentsGenerator", () => {
    it("Type 0: Find part (What is P% of W?)", () => {
      // Sequence:
      // 1. type < 0.6 -> 0.1 (Type 0)
      // 2. percent (1-20)*5 -> 0.0 -> 1*5 = 5%
      // 3. whole (2-20)*10 -> 0.0 -> 2*10 = 20
      const rng = createMockRng([0.1, 0.0, 0.0]);
      const item = PercentsGenerator.generate(0.5, rng);

      // 5% of 20 = 1
      expect(item.problem_content.stem).toContain("What is 5% of 20?");
      expect(item.solution_logic.final_answer_canonical).toBe("1");
    });

    it("Type 1: Find whole (Part is P% of what?)", () => {
      // Sequence:
      // 1. type >= 0.6 -> 0.8 (Type 1)
      // 2. percent index (0-4) -> 0.0 -> 10%
      // 3. whole (2-20)*4 -> 0.0 -> 2*4 = 8
      const rng = createMockRng([0.8, 0.0, 0.0]);
      const item = PercentsGenerator.generate(0.5, rng);

      // 10% of 8 = 0.8
      expect(item.problem_content.stem).toContain("0.8 is 10% of what number?");
      expect(item.solution_logic.final_answer_canonical).toBe("8");
    });

    it("covers fallback RNG", () => {
      const item = PercentsGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe("6.rp.percents");
      expect(item.problem_content.stem).toBeDefined();
    });

    it("covers different percent indices in Find Whole", () => {
      // type index (0-4). rng=0.9 -> 4. percent = 75%
      const rng = createMockRng([0.8, 0.9, 0.5]);
      const item = PercentsGenerator.generate(0.5, rng);
      expect(item.problem_content.stem).toContain("75% of what number?");
    });
  });

  describe("RatioTablesGenerator", () => {
    it("Type 1: Missing bottom-left / intermediate step", () => {
      // Sequence:
      // 1. a (2-5) -> 0.0 -> 2
      // 2. b (2-9) -> 0.0 -> 2
      // 3. mult1 (2-3) -> 0.0 -> 2
      // 4. mult2 (4-5) -> 0.0 -> 4
      // 5. missingType < 0.5 -> 0.1 (Type 1)
      const rng = createMockRng([0.0, 0.0, 0.0, 0.0, 0.1]);
      const item = RatioTablesGenerator.generate(0.5, rng);

      // Table:
      // 2 | 2
      // ? | 2*2=4
      // Answer: 2*2=4
      expect(item.problem_content.stem).toContain("| 2 | 2 |");
      expect(item.problem_content.stem).toContain("| ? | 4 |");
      expect(item.solution_logic.final_answer_canonical).toBe("4");
    });

    it("Type 2: Missing bottom-right / final step", () => {
      // Sequence:
      // 1,2,3,4 same as above
      // 5. missingType >= 0.5 -> 0.8 (Type 2)
      const rng = createMockRng([0.0, 0.0, 0.0, 0.0, 0.8]);
      const item = RatioTablesGenerator.generate(0.5, rng);

      // Table:
      // 2 | 2
      // 2*4=8 | ?
      // Answer: 2*4=8
      expect(item.problem_content.stem).toContain("| 8 | ? |");
      expect(item.solution_logic.final_answer_canonical).toBe("8");
    });

    it("covers fallback RNG", () => {
      const item = RatioTablesGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe("6.rp.ratio_tables");
      expect(item.problem_content.stem).toBeDefined();
    });
  });

  describe("UnitConversionRPGenerator", () => {
    it("Generates conversion problem", () => {
      // Sequence:
      // 1. conv index (0-4) -> 0.0 -> feet to inches
      // 2. val (2-10) -> 0.0 -> 2
      const rng = createMockRng([0.0, 0.0]);
      const item = UnitConversionRPGenerator.generate(0.5, rng);

      // 2 feet to inches. Rate 12. 24.
      expect(item.problem_content.stem).toContain("Convert 2 feet to inches");
      expect(item.solution_logic.final_answer_canonical).toBe("24");
    });

    it("covers fallback RNG", () => {
      const item = UnitConversionRPGenerator.generate(0.5);
      expect(item.meta.skill_id).toBe("6.rp.unit_conversion");
      expect(item.problem_content.stem).toBeDefined();
    });

    it("covers all conversion types", () => {
      const types = [
        { name: "feet", to: "inches" },
        { name: "yards", to: "feet" },
        { name: "meters", to: "centimeters" },
        { name: "kilometers", to: "meters" },
        { name: "pounds", to: "ounces" },
      ];

      types.forEach((t, i) => {
        const rng = createMockRng([i / 5, 0.5]);
        const item = UnitConversionRPGenerator.generate(0.5, rng);
        expect(item.problem_content.stem).toContain(`Convert`);
        expect(item.problem_content.stem).toContain(t.name);
        expect(item.problem_content.stem).toContain(t.to);
      });
    });
  });
});
