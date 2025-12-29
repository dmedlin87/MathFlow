import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, MathProblemItem } from "../types";

// Mock validation to just pass through or throw
vi.mock("../validation", () => ({
  validateMathProblemItem: vi.fn((item) => item),
}));

describe("Engine Strict Behavior", () => {
  const mockGenerator: Generator = {
    skillId: "test.skill",
    generate: vi.fn(),
  };

  const mockProblemItem: MathProblemItem = {
    type: "math-problem",
    meta: { id: "1", skill_id: "test.skill" },
    problem: { stem: "1+1=?", options: [] },
    solution_logic: { final_answer_canonical: "2", steps: [] },
    answer_spec: { input_type: "text", accepted_forms: ["2"] },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (mockGenerator.generate as any).mockReturnValue(mockProblemItem);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("generate", () => {
    it("throws error if generator is missing and no network config", async () => {
      const engine = new Engine({ apiBaseUrl: null });
      // No generator registered
      await expect(engine.generate("unknown.skill", 0.5)).rejects.toThrow(
        "No generator found for skill: unknown.skill"
      );
    });

    it("uses local generator when apiBaseUrl is not set (default dev behavior)", async () => {
      const engine = new Engine({ apiBaseUrl: null });
      engine.register(mockGenerator);

      const result = await engine.generate("test.skill", 0.5);

      expect(result).toEqual(mockProblemItem);
      expect(mockGenerator.generate).toHaveBeenCalledWith(0.5, undefined);
    });

    it("uses network result when apiBaseUrl is set and fetch succeeds", async () => {
      const engine = new Engine({ apiBaseUrl: "http://api.test" });
      engine.register(mockGenerator);

      const networkItem = { ...mockProblemItem, meta: { ...mockProblemItem.meta, id: "network_1" } };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [networkItem],
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await engine.generate("test.skill", 0.5);

      expect(result).toEqual(networkItem);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/problems?skillId=test.skill&limit=1"
      );
      // Ensure local generator was NOT called
      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it("falls back to local generator when network fetch fails (throws)", async () => {
      const engine = new Engine({ apiBaseUrl: "http://api.test" });
      engine.register(mockGenerator);

      const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubGlobal("fetch", fetchMock);

      const result = await engine.generate("test.skill", 0.5);

      expect(result).toEqual(mockProblemItem);
      expect(mockGenerator.generate).toHaveBeenCalled();
    });

    it("falls back to local generator when network returns non-ok status", async () => {
      const engine = new Engine({ apiBaseUrl: "http://api.test" });
      engine.register(mockGenerator);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await engine.generate("test.skill", 0.5);

      expect(result).toEqual(mockProblemItem);
      expect(mockGenerator.generate).toHaveBeenCalled();
    });

    it("tries factory endpoint if bank returns empty list", async () => {
      const engine = new Engine({ apiBaseUrl: "http://api.test" });
      engine.register(mockGenerator);

      const factoryItem = { ...mockProblemItem, meta: { ...mockProblemItem.meta, id: "factory_1" } };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce({ // /problems call
          ok: true,
          json: async () => [], // Empty bank
        })
        .mockResolvedValueOnce({ // /factory/run call
          ok: true,
          json: async () => ({ items: [factoryItem] }),
        });

      vi.stubGlobal("fetch", fetchMock);

      const result = await engine.generate("test.skill", 0.5);

      expect(result).toEqual(factoryItem);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(2, "http://api.test/factory/run", expect.any(Object));
    });
  });
});
