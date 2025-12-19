import { describe, it, expect } from "vitest";
import { validateMathProblemItem } from "./validation";
// import type { MathProblemItem } from "./types";

describe("Validation Logic", () => {
  const baseItem = {
    meta: { id: "1", skill_id: "s1" },
    problem_content: { stem: "stem" },
    solution_logic: { final_answer_canonical: "1", steps: [] },
    answer_spec: {},
  };

  it("should validate a correct item", () => {
    expect(validateMathProblemItem(baseItem)).toBe(baseItem);
  });

  it("should reject non-object", () => {
    expect(() => validateMathProblemItem(null)).toThrow(/must be an object/);
    expect(() => validateMathProblemItem("string")).toThrow(
      /must be an object/
    );
  });

  it("should reject missing meta", () => {
    const item = { ...baseItem, meta: undefined };
    expect(() => validateMathProblemItem(item)).toThrow(/missing meta/);
  });

  it("should reject missing fields within meta", () => {
    const item = {
      ...baseItem,
      meta: { id: 123 }, // wrong type
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /meta.id must be string/
    );
  });

  it("should reject non-string meta.skill_id", () => {
    const item = {
      ...baseItem,
      meta: { id: "1", skill_id: 99 },
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /meta.skill_id must be string/
    );
  });

  it("should reject missing solution logic", () => {
    const item = {
      ...baseItem,
      // missing solution_logic
      solution_logic: undefined,
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /missing solution_logic/
    );
  });

  it("should reject missing problem content", () => {
    const item = { ...baseItem, problem_content: undefined };
    expect(() => validateMathProblemItem(item)).toThrow(
      /missing problem_content/
    );
  });

  it("should reject non-string problem_content.stem", () => {
    const item = {
      ...baseItem,
      problem_content: { stem: 42 },
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /problem_content\.stem must be string/
    );
  });

  it("should reject non-string final_answer_canonical", () => {
    const item = {
      ...baseItem,
      solution_logic: { final_answer_canonical: 7, steps: [] },
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /solution_logic\.final_answer_canonical must be string/
    );
  });

  it("should reject non-array solution_logic.steps", () => {
    const item = {
      ...baseItem,
      solution_logic: { final_answer_canonical: "1", steps: "not-array" },
    };
    expect(() => validateMathProblemItem(item)).toThrow(
      /solution_logic\.steps must be an array/
    );
  });

  it("should reject missing answer_spec", () => {
    const item = { ...baseItem, answer_spec: undefined };
    expect(() => validateMathProblemItem(item)).toThrow(
      /missing answer_spec/
    );
  });
});
