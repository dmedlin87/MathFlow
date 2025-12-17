import { describe, it, expect } from "vitest";
import { DotPlotGenerator } from "./stats";

describe("DotPlotGenerator Behavior", () => {
  it("fails to accept alternative modes when distribution is bimodal", () => {
    // We want counts to be [5, 5, 1] for categories 1, 2, 3 (base 1)
    // Counts generated: [randomInt(1,5), randomInt(1,5), randomInt(1,5)]
    //
    // RandomInt implementation: Math.floor(rng() * (max - min + 1)) + min;
    // max-min+1 = 5-1+1 = 5.
    // randomInt(1, 5) -> floor(rng * 5) + 1
    //
    // To get 5: floor(rng * 5) = 4 => rng in [0.8, 1.0)
    // To get 1: floor(rng * 5) = 0 => rng in [0.0, 0.2)
    //
    // Sequence of RNG calls:
    // 1. base = randomInt(1, 5). Let's set base=1. rng -> 0.0 -> floor(0)+1 = 1.
    // 2. count[0] = randomInt(1, 5). Want 5. rng -> 0.9.
    // 3. count[1] = randomInt(1, 5). Want 5. rng -> 0.9.
    // 4. count[2] = randomInt(1, 5). Want 1. rng -> 0.1.
    // 5. type = "mode" vs "count". random() < 0.5 ? "count" : "mode". Wait:
    //    Code: `const type = (rng ?? Math.random)() < 0.5 ? "count" : "mode";`
    //    So we want rng >= 0.5 to get "mode". rng -> 0.6.

    let callCount = 0;
    const mockRng = () => {
      callCount++;
      if (callCount === 1) return 0.0; // base = 1
      if (callCount === 2) return 0.9; // count[0] = 5
      if (callCount === 3) return 0.9; // count[1] = 5
      if (callCount === 4) return 0.1; // count[2] = 1
      if (callCount === 5) return 0.6; // type = "mode"
      return 0.5;
    };

    const item = DotPlotGenerator.generate(0.5, mockRng);

    // Verify it is a mode question
    expect(item.problem_content.stem).toContain("What is the mode");

    // Verify values:
    // base=1. i=0 -> val=1. count=5.
    //         i=1 -> val=2. count=5.
    //         i=2 -> val=3. count=1.
    // Modes are 1 and 2.

    // The canonical answer is likely just one of them (the first one encountered usually, or last, depending on logic)
    // Logic: `if (c > maxCount) { maxCount = c; modeVal = val; }`
    // i=0: c=5 > 0. max=5, mode=1.
    // i=1: c=5 > 5 is False. mode=1.
    // So canonical is "1".

    expect(item.solution_logic.final_answer_canonical).toBe("1");

    // BUG: "2" is also a mode, but likely not accepted.
    // We want the system to accept "2" as well.
    // Check accepted_forms.
    const accepted = item.answer_spec.accepted_forms || [];

    // The test fails if "2" is NOT in accepted forms.
    // Currently, accepted_forms is likely undefined or empty.
    expect(accepted).toContain("2");
  });
});
