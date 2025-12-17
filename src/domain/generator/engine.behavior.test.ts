import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, Provenance, VerificationReport } from "../types";

// Mock global fetch safely
const mockFetch = vi.fn();

describe("Engine Behavior", () => {
  let testEngine: Engine;
  const SKILL_ID = "test_skill";
  const MOCK_API_URL = "http://api.test";

  // Mock Generator for local fallback
  const mockGenerator: Generator = {
    skillId: SKILL_ID,
    templateId: "tpl_1",
    generate: vi.fn().mockReturnValue({
      meta: {
        id: "local_item",
        skill_id: SKILL_ID,
        version: 1,
        difficulty: 0.5,
        created_at: "",
        provenance: {} as unknown as Provenance,
        verification_report: {} as unknown as VerificationReport,
        status: "VERIFIED",
      },
      problem_content: { format: "text", stem: "Local Problem" },
      solution_logic: {
        final_answer_canonical: "42",
        final_answer_type: "numeric",
        steps: [],
      },
      answer_spec: { answer_mode: "final_only", input_type: "integer" },
      misconceptions: [],
    }),
  };

  const validApiItem = {
    meta: {
      id: "api_item",
      skill_id: SKILL_ID,
      version: 1,
      difficulty: 0.5,
      status: "VERIFIED",
    },
    problem_content: { format: "text", stem: "API Problem" },
    solution_logic: { final_answer_canonical: "1", final_answer_type: "numeric", steps: [] },
    answer_spec: { answer_mode: "final_only", input_type: "integer" },
    misconceptions: [],
  };

  beforeEach(() => {
    // Stub global fetch for this test suite context
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();

    // Spy on console to suppress/verify warnings
    vi.spyOn(console, "warn").mockImplementation(() => {});

    testEngine = new Engine({ apiBaseUrl: MOCK_API_URL });
    testEngine.register(mockGenerator);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals(); // Important: Restore fetch
  });

  describe("API Fallback Logic", () => {
    it("returns local item when /problems API returns null", async () => {
      // Scenario: API returns null (body is 'null')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      // And factory fails/returns empty to ensure full fallback to local
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const item = await testEngine.generate(SKILL_ID, 0.5);

      expect(item.meta.id).toBe("local_item");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("returns local item when /problems API returns malformed object (no length)", async () => {
      // Scenario: API returns { foo: 'bar' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ foo: 'bar' }),
      });

      // Factory fallback also empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const item = await testEngine.generate(SKILL_ID, 0.5);

      expect(item.meta.id).toBe("local_item");
    });

    it("returns local item when /factory/run API returns malformed object (no items)", async () => {
      // 1. /problems returns empty []
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // 2. /factory/run returns { status: 'ok' } but no items array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const item = await testEngine.generate(SKILL_ID, 0.5);

      expect(item.meta.id).toBe("local_item");
    });

    it("returns local item when /factory/run API returns null", async () => {
      // 1. /problems returns empty []
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // 2. /factory/run returns null
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const item = await testEngine.generate(SKILL_ID, 0.5);

      expect(item.meta.id).toBe("local_item");
    });

    it("returns local item when /factory/run API returns 500 error", async () => {
        // 1. /problems returns empty []
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        // 2. /factory/run returns 500
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ error: "fail" }),
        });

        const item = await testEngine.generate(SKILL_ID, 0.5);

        expect(item.meta.id).toBe("local_item");
      });

    it("returns factory item when /problems is empty but /factory/run succeeds", async () => {
        // 1. /problems empty
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        // 2. /factory/run returns valid item
        const factoryItem = { ...validApiItem, meta: { ...validApiItem.meta, id: 'factory_item' } };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [factoryItem] })
        });

        const item = await testEngine.generate(SKILL_ID, 0.5);
        expect(item.meta.id).toBe('factory_item');
    });
  });
});
