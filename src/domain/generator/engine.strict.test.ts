import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, MathProblemItem } from "../types";

const mockFetch = vi.fn();

describe("Engine Strict Behavior Tests", () => {
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

  describe("generate", () => {
    it("returns validated item from bank API when available", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        // Bank returns item
        const item = createMockItem("bank_item");
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [item]
        });

        const result = await engine.generate("test_skill", 0.5);
        expect(result.meta.id).toBe("bank_item");
    });

    it("returns validated item from factory API when bank is empty", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        // Bank empty
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        // Factory returns item
        const item = createMockItem("factory_item");
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [item] })
        });

        const result = await engine.generate("test_skill", 0.5);
        expect(result.meta.id).toBe("factory_item");
    });

    it("falls back to local generator if factory request fails (non-200)", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        const mockGen = createMockGenerator("test_skill");
        engine.register(mockGen);

        // Bank empty, Factory Error 500
        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => [] })
          .mockResolvedValueOnce({ ok: false, status: 500 });

        const result = await engine.generate("test_skill", 0.5);

        expect(result.meta.id).toBe("local_test_skill");
    });

    it("falls back to local generator if factory returns 200 but empty items", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        const mockGen = createMockGenerator("test_skill");
        engine.register(mockGen);

        // Bank empty, Factory OK but empty items
        mockFetch
          .mockResolvedValueOnce({ ok: true, json: async () => [] })
          .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

        const result = await engine.generate("test_skill", 0.5);

        expect(result.meta.id).toBe("local_test_skill");
    });

    it("falls back to local generator if bank API call throws", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        const mockGen = createMockGenerator("test_skill");
        engine.register(mockGen);

        mockFetch.mockRejectedValue(new Error("Network Error"));

        const result = await engine.generate("test_skill", 0.5);

        expect(result.meta.id).toBe("local_test_skill");
    });

    it("throws error if no generator found and API fetch is skipped (undefined url)", async () => {
        const engine = new Engine({ apiBaseUrl: undefined });
        // No registration

        await expect(engine.generate("missing_skill", 0.5)).rejects.toThrow("No generator found for skill: missing_skill");
    });

    it("falls back to local generator if bank API returns non-200", async () => {
        const engine = new Engine({ apiBaseUrl: "http://api.test" });
        const mockGen = createMockGenerator("test_skill");
        engine.register(mockGen);

        // Bank Error 500
        mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

        const result = await engine.generate("test_skill", 0.5);

        expect(result.meta.id).toBe("local_test_skill");
    });
  });
});
