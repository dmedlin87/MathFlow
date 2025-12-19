import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, Provenance, VerificationReport } from "../types";

// Mock global fetch safely
const mockFetch = vi.fn();

describe("Engine Coverage", () => {
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

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});

    testEngine = new Engine({ apiBaseUrl: MOCK_API_URL });
    testEngine.register(mockGenerator);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to local generator if factory returns ok but items is empty/undefined", async () => {
    // 1. /problems returns empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // 2. /factory/run returns OK but with empty items
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const item = await testEngine.generate(SKILL_ID, 0.5);
    expect(item.meta.id).toBe("local_item");
  });

  it("falls back to local generator if factory returns ok but items is undefined", async () => {
      // 1. /problems returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // 2. /factory/run returns OK but no items property
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const item = await testEngine.generate(SKILL_ID, 0.5);
      expect(item.meta.id).toBe("local_item");
    });
});
