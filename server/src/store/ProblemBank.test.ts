import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ProblemBank } from "./ProblemBank.js";
import type { MathProblemItem } from "@domain/types.js";
import fs from "fs/promises";

// Mock fs/promises
vi.mock("fs/promises", () => {
  let mockData = "[]";
  return {
    default: {
      readFile: vi.fn().mockImplementation(async () => mockData),
      writeFile: vi.fn().mockImplementation(async (path, data) => {
        mockData = data;
      }),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock fs/promises to prevent file system access and state pollution
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn().mockRejectedValue({ code: "ENOENT" }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

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
    vi.clearAllMocks();

    // Reset the internal mock state of the mocked module
    // Since we mocked `fs/promises` default export, we can access it here
    let mockStore = "[]";
    vi.mocked(fs.readFile).mockImplementation(async () => mockStore);
    vi.mocked(fs.writeFile).mockImplementation(async (path, data) => {
      mockStore = data as string;
    });
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
