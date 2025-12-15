import { describe, it, expect, vi } from "vitest";
import { MisconceptionEvaluator } from "./misconceptionEvaluator";
import type { MathProblemItem } from "../types";

describe("MisconceptionEvaluator", () => {
  it("returns null if item has no misconceptions", () => {
    const item = {
      misconceptions: [],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "any answer");
    expect(result).toBeNull();
  });

  it("returns null if no misconception matches", () => {
    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_1",
          error_tag: "test_error",
          trigger: { kind: "exact_answer", value: "wrong" },
          hint_ladder: ["hint"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "correct");
    expect(result).toBeNull();
  });

  it("matches exact_answer trigger", () => {
    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_1",
          error_tag: "test_error",
          trigger: { kind: "exact_answer", value: "wrong" },
          hint_ladder: ["hint 1", "hint 2"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "wrong");
    expect(result).toEqual({
      tag: "test_error",
      hintLadder: ["hint 1", "hint 2"],
    });
  });

  it("matches regex trigger", () => {
    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_regex",
          error_tag: "regex_error",
          trigger: { kind: "regex", value: "^3/0$" },
          hint_ladder: ["hint"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "3/0");
    expect(result).toEqual({
      tag: "regex_error",
      hintLadder: ["hint"],
    });
  });

  it("handles invalid regex gracefully (logs error and returns null)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_bad_regex",
          error_tag: "bad_regex",
          trigger: { kind: "regex", value: "(" }, // Invalid regex
          hint_ladder: ["hint"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "test");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("warns on unsupported predicate triggers", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_predicate",
          error_tag: "predicate_error",
          trigger: { kind: "predicate", value: "x > 5" },
          hint_ladder: ["hint"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "10");
    expect(result).toBeNull(); // Currently unsupported
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Predicate triggers not supported")
    );

    consoleSpy.mockRestore();
  });
  it("ignores unknown trigger kinds", () => {
    const item: MathProblemItem = {
      misconceptions: [
        {
          id: "misc_unknown",
          error_tag: "unknown_error",
          trigger: {
            kind: "UNKNOWN_TYPE" as unknown as "exact_answer",
            value: "test",
          },
          hint_ladder: ["hint"],
        },
      ],
    } as unknown as MathProblemItem;

    const result = MisconceptionEvaluator.evaluate(item, "test");
    expect(result).toBeNull();
  });
});
