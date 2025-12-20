import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, MathProblemItem } from "../types";

const mockFetch = vi.fn();

describe("Engine Behavior", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createMockItem = (id: string): MathProblemItem => ({
    meta: {
      id,
      skill_id: "test_skill",
      version: 1,
      difficulty: 0.5,
      status: "VERIFIED",
      created_at: "",
      provenance: {
        generator_model: "test_gen",
        critic_model: "test_critic",
        judge_model: "test_judge",
        verifier: { type: "none", passed: true },
        attempt: 1,
      },
      verification_report: {
        rubric_scores: {
          solvability: 5,
          ambiguity: 0,
          procedural_correctness: 5,
          pedagogical_alignment: 5,
        },
        underspecified: false,
        issues: [],
      },
    },
    problem_content: { format: "text", stem: "test" },
    solution_logic: {
      final_answer_canonical: "1",
      final_answer_type: "numeric",
      steps: [],
    },
    answer_spec: { answer_mode: "final_only", input_type: "integer" },
    misconceptions: [],
  });

  const createMockGenerator = (skillId: string): Generator => ({
    skillId,
    templateId: "test_tpl",
    generate: vi.fn().mockReturnValue(createMockItem(`local_${skillId}`)),
  });

  it("skips network completely when apiBaseUrl is undefined (Pure Local Mode)", async () => {
    // Given: Engine with no API URL
    const engine = new Engine({ apiBaseUrl: undefined });
    const mockGen = createMockGenerator("test_skill");
    engine.register(mockGen);

    // When: generate is called
    const result = await engine.generate("test_skill", 0.5);

    // Then: Fetch is NEVER called
    expect(mockFetch).not.toHaveBeenCalled();
    // And: Result comes from local generator
    expect(result.meta.id).toBe("local_test_skill");
  });

  it("falls back to local generator when API fetch fails (Network Resilience)", async () => {
    // Given: Engine WITH API URL
    const engine = new Engine({ apiBaseUrl: "http://api.test" });
    const mockGen = createMockGenerator("test_skill");
    engine.register(mockGen);

    // And: Network fails
    mockFetch.mockRejectedValue(new Error("Network Down"));

    // When: generate is called
    const result = await engine.generate("test_skill", 0.5);

    // Then: It recovers gracefully using local generator
    expect(result.meta.id).toBe("local_test_skill");
  });

  it("prioritizes API result over local generator when available", async () => {
    // Given: Engine WITH API URL
    const engine = new Engine({ apiBaseUrl: "http://api.test" });
    const mockGen = createMockGenerator("test_skill");
    engine.register(mockGen);

    // And: API returns a valid item
    const apiItem = createMockItem("api_item");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [apiItem],
    });

    // When: generate is called
    const result = await engine.generate("test_skill", 0.5);

    // Then: Result is from API
    expect(result.meta.id).toBe("api_item");
    // And: Local generator is NOT called
    expect(mockGen.generate).not.toHaveBeenCalled();
  });

  it("falls back to local when API returns empty list (Bank Empty)", async () => {
    // Given: Engine WITH API URL
    const engine = new Engine({ apiBaseUrl: "http://api.test" });
    const mockGen = createMockGenerator("test_skill");
    engine.register(mockGen);

    // And: API returns empty list (and factory fails/returns empty too)
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Bank empty
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) }); // Factory empty

    // When: generate is called
    const result = await engine.generate("test_skill", 0.5);

    // Then: Result is from local
    expect(result.meta.id).toBe("local_test_skill");
  });

  it("uses factory item if bank is empty but factory returns item (Bank Miss + Factory Hit)", async () => {
    // Given: Engine WITH API URL
    const engine = new Engine({ apiBaseUrl: "http://api.test" });
    const mockGen = createMockGenerator("test_skill");
    engine.register(mockGen);
    const factoryItem = createMockItem("factory_item");

    // And: Bank Empty, but Factory Success
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Bank empty
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [factoryItem] }),
      }); // Factory hit

    // When: generate is called
    const result = await engine.generate("test_skill", 0.5);

    // Then: Result is from FACTORY
    expect(result.meta.id).toBe("factory_item");
    // And: Local generator is NOT called
    expect(mockGen.generate).not.toHaveBeenCalled();
  });

  it("throws explicit error if skill missing locally and API fails", async () => {
    // Given: Engine with NO local generator for the requested skill
    const engine = new Engine({ apiBaseUrl: "http://api.test" });
    // (No register called)

    // And: Network fails
    mockFetch.mockRejectedValue(new Error("Network Down"));

    // When/Then: It throws specific error
    await expect(engine.generate("missing_skill", 0.5)).rejects.toThrow(
      "No generator found for skill: missing_skill"
    );
  });
});
