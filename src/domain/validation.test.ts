import { describe, it, expect } from "vitest";
import { validateMathProblemItem } from "./validation";
// import type { MathProblemItem } from "./types";

describe("Validation Logic", () => {
  it("should validate a correct item", () => {
    const item = {
      meta: { id: "1", skill_id: "s1" },
      problem_content: { stem: "stem" },
      solution_logic: { final_answer_canonical: "1", steps: [] },
      answer_spec: {},
    };
    expect(validateMathProblemItem(item)).toBe(item);
  });

  it("should reject non-object", () => {
    expect(() => validateMathProblemItem(null)).toThrow(/must be an object/);
    expect(() => validateMathProblemItem("string")).toThrow(
      /must be an object/
    );
  });

  it("should reject missing meta", () => {
    const item = { problem_content: {} };
    expect(() => validateMathProblemItem(item)).toThrow(/missing meta/);
  });

  it("should reject missing fields within meta", () => {
    const item = {
      meta: { id: 123 }, // wrong type
      problem_content: { stem: "s" },
      solution_logic: { final_answer_canonical: "1", steps: [] },
      answer_spec: {},
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /meta.id must be string/
    );
  });

  it("should reject missing solution logic", () => {
    const item = {
      meta: { id: "1", skill_id: "s" },
      problem_content: { stem: "s" },
      // missing solution_logic
      answer_spec: {},
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /missing solution_logic/
    );
  });
});
