import type { MathProblemItem } from "./types";

/**
 * Lightweight runtime validator for MathProblemItem to ensure API responses
 * match the expected schema without external dependencies (Zod/Ajv).
 *
 * Throws an Error if the object is invalid.
 */
export function validateMathProblemItem(data: unknown): MathProblemItem {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid MathProblemItem: must be an object");
  }

  const item = data as any; // Safe cast for property checking

  // 1. Meta check
  if (!item.meta || typeof item.meta !== "object") {
    throw new Error("Invalid MathProblemItem: missing meta object");
  }
  const meta = item.meta;
  if (typeof meta.id !== "string")
    throw new Error("Invalid MathProblemItem: meta.id must be string");
  if (typeof meta.skill_id !== "string")
    throw new Error("Invalid MathProblemItem: meta.skill_id must be string");

  // 2. Problem Content
  if (!item.problem_content || typeof item.problem_content !== "object") {
    throw new Error("Invalid MathProblemItem: missing problem_content");
  }
  const pc = item.problem_content;
  if (typeof pc.stem !== "string")
    throw new Error(
      "Invalid MathProblemItem: problem_content.stem must be string"
    );

  // 3. Solution Logic (Critical for correctness)
  if (!item.solution_logic || typeof item.solution_logic !== "object") {
    throw new Error("Invalid MathProblemItem: missing solution_logic");
  }
  const sl = item.solution_logic;
  if (typeof sl.final_answer_canonical !== "string") {
    throw new Error(
      "Invalid MathProblemItem: solution_logic.final_answer_canonical must be string"
    );
  }
  if (!Array.isArray(sl.steps)) {
    throw new Error(
      "Invalid MathProblemItem: solution_logic.steps must be an array"
    );
  }

  // 4. Answer Spec
  if (!item.answer_spec || typeof item.answer_spec !== "object") {
    throw new Error("Invalid MathProblemItem: missing answer_spec");
  }
  // const as = item.answer_spec;
  // We could validate input_type enumerations but simple presence is enough for V1 crash prevention.

  // Return casted item if checks pass
  return item as MathProblemItem;
}
