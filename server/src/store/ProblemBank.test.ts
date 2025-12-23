import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { MathProblemItem } from "@domain/types.js";

// Mock fs/promises BEFORE importing the module under test
// This ensures that when ProblemBank imports 'fs/promises', it gets the mock.
// We also need to mock path to avoid issues with absolute paths in tests.
vi.mock("fs/promises", () => {
  return {
    default: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

// Import the module AFTER mocking
import { ProblemBank } from "./ProblemBank.js";
import fs from "fs/promises"; // This is now the mocked version

const createItem = (id: string, skillId: string) =>
  ({
    meta: {
      id,
      version: 1,
      skill_id: skillId,
      difficulty: 0.5,
      created_at: "2025-01-01T00:00:00.000Z",
      status: "VERIFIED",
      provenance: {
        generator_model: "gen",
        critic_model: "critic",
        judge_model: "judge",
        verifier: { type: "none", passed: true },
        attempt: 1,
      },
      verification_report: {
        rubric_scores: {
          solvability: 1,
          ambiguity: 1,
          procedural_correctness: 1,
          pedagogical_alignment: 1,
        },
        underspecified: false,
        issues: [],
      },
    },
    problem_content: { stem: "q", format: "text" },
    answer_spec: { answer_mode: "final_only", input_type: "integer" },
    solution_logic: {
      final_answer_canonical: "1",
      final_answer_type: "numeric",
      steps: [],
    },
    misconceptions: [],
  } as MathProblemItem);

describe("ProblemBank", () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure clean state
    vi.resetAllMocks();

    // Default behavior: filesystem is empty (returns empty array JSON)
    // using vi.mocked to get type safety on the mock
    vi.mocked(fs.readFile).mockResolvedValue("[]");
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject saving unverified items", async () => {
    const bank = new ProblemBank();
    const draft = {
      ...createItem("id-1", "skill-1"),
      meta: { ...createItem("id-1", "skill-1").meta, status: "DRAFT" },
    } as MathProblemItem;

    await expect(bank.save(draft)).rejects.toThrow(
      "Cannot save unverified item to Problem Bank"
    );
  });

  it("should return an empty list when no items exist", async () => {
    const bank = new ProblemBank();
    const result = await bank.fetch("skill-1", 1);
    expect(result).toEqual([]);
  });

  it("should return an empty list when count is zero", async () => {
    const bank = new ProblemBank();
    await bank.save(createItem("id-0", "skill-1"));

    const result = await bank.fetch("skill-1", 0);

    expect(result).toEqual([]);
  });

  it("should return a shuffled copy when count exceeds available items", async () => {
    const bank = new ProblemBank();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    await bank.save(createItem("id-0", "skill-1"));
    await bank.save(createItem("id-1", "skill-1"));
    await bank.save(createItem("id-2", "skill-1"));

    const result = await bank.fetch("skill-1", 99);

    expect(result.map((item) => item.meta.id)).toEqual([
      "id-1",
      "id-2",
      "id-0",
    ]);
    expect(randomSpy).toHaveBeenCalled();
  });

  it("should shuffle deterministically when count equals available items", async () => {
    const bank = new ProblemBank();
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1);

    await bank.save(createItem("id-0", "skill-1"));
    await bank.save(createItem("id-1", "skill-1"));
    await bank.save(createItem("id-2", "skill-1"));

    const result = await bank.fetch("skill-1", 3);

    expect(result.map((item) => item.meta.id)).toEqual([
      "id-1",
      "id-0",
      "id-2",
    ]);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it("should fallback to linear scan when random selection stalls", async () => {
    const bank = new ProblemBank();
    vi.spyOn(Math, "random").mockReturnValue(0);

    await bank.save(createItem("id-0", "skill-1"));
    await bank.save(createItem("id-1", "skill-1"));
    await bank.save(createItem("id-2", "skill-1"));
    await bank.save(createItem("id-3", "skill-1"));
    await bank.save(createItem("id-4", "skill-1"));

    const result = await bank.fetch("skill-1", 2);

    expect(result.map((item) => item.meta.id)).toEqual(["id-0", "id-1"]);
  });

  it("should use partial shuffle when count is at least half", async () => {
    const bank = new ProblemBank();
    vi.spyOn(Math, "random").mockReturnValue(0);

    await bank.save(createItem("id-0", "skill-1"));
    await bank.save(createItem("id-1", "skill-1"));
    await bank.save(createItem("id-2", "skill-1"));
    await bank.save(createItem("id-3", "skill-1"));
    await bank.save(createItem("id-4", "skill-1"));

    const result = await bank.fetch("skill-1", 3);

    expect(result.map((item) => item.meta.id)).toEqual([
      "id-0",
      "id-1",
      "id-2",
    ]);
  });
});
