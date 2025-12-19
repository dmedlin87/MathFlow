import { describe, it, expect, vi } from "vitest";
import { DomainGeneratorAdapter } from "./DomainGeneratorAdapter.js";
import type { Generator, MathProblemItem } from "@domain/types.js";

describe("DomainGeneratorAdapter", () => {
  const mockProblem: MathProblemItem = {
    meta: {
      id: "test-uuid",
      version: 1,
      skill_id: "test-skill",
      difficulty: 0.5,
      created_at: "2023-01-01T00:00:00Z",
      status: "DRAFT",
      provenance: {
        generator_model: "test-gen",
        critic_model: "none",
        judge_model: "none",
        verifier: { type: "none", passed: true },
        attempt: 1,
      },
      verification_report: {
        rubric_scores: {
          solvability: 1,
          ambiguity: 0,
          procedural_correctness: 1,
          pedagogical_alignment: 1,
        },
        underspecified: false,
        issues: [],
      },
    },
    problem_content: {
      stem: "2 + 2",
      format: "text",
    },
    answer_spec: {
      answer_mode: "final_only",
      input_type: "multiple_choice",
      accepted_forms: ["4"],
      ui: {
        choices: ["3", "4", "5"],
      },
    },
    solution_logic: {
      final_answer_canonical: "4",
      final_answer_type: "numeric",
      steps: [
        {
          step_index: 0,
          explanation: "Step 1",
          math: "2+2=4",
          answer: "4",
        },
      ],
    },
    misconceptions: [],
  };

  const createMockGenerator = (skillId: string = "test-skill"): Generator => ({
    skillId,
    templateId: "default-template",
    generate: vi.fn().mockReturnValue(mockProblem),
  });

  it("should have the same skillId as the underlying generator", () => {
    const generator = createMockGenerator("custom-skill");
    const adapter = new DomainGeneratorAdapter(generator);
    expect(adapter.skillId).toBe("custom-skill");
  });

  it("should wrap synchronous generate in a promise", async () => {
    const generator = createMockGenerator();
    const adapter = new DomainGeneratorAdapter(generator);
    const difficulty = 0.8;

    const resultPromise = adapter.generate(difficulty);
    expect(resultPromise).toBeInstanceOf(Promise);

    const result = await resultPromise;
    expect(result).toEqual(mockProblem);
    expect(generator.generate).toHaveBeenCalledWith(difficulty);
  });

  it("should pass through errors from the underlying generator", async () => {
    const generator = createMockGenerator();
    const error = new Error("Generation failed");
    vi.mocked(generator.generate).mockImplementation(() => {
      throw error;
    });

    const adapter = new DomainGeneratorAdapter(generator);
    await expect(adapter.generate(0.5)).rejects.toThrow("Generation failed");
  });
});
