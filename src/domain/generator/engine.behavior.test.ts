import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import type { Generator, Provenance, VerificationReport } from "../types";
import { logger } from "../../utils/logger";

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

  const VALID_REMOTE_ITEM = {
    meta: { id: "remote_item", skill_id: SKILL_ID, difficulty: 0.5, status: "VERIFIED" },
    problem_content: { stem: "Remote Problem" },
    solution_logic: { final_answer_canonical: "10", steps: [] },
    answer_spec: { input_type: "integer" }
  };

  const VALID_FACTORY_ITEM = {
    meta: { id: "factory_item", skill_id: SKILL_ID, difficulty: 0.5, status: "VERIFIED" },
    problem_content: { stem: "Factory Problem" },
    solution_logic: { final_answer_canonical: "20", steps: [] },
    answer_spec: { input_type: "integer" }
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    // Spy on logger to verify warnings
    vi.spyOn(logger, "warn").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});

    // Reset the generator spy to prevent test pollution
    (mockGenerator.generate as any).mockClear();

    testEngine = new Engine({ apiBaseUrl: MOCK_API_URL });
    testEngine.register(mockGenerator);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns problem directly from API when /problems endpoint succeeds", async () => {
    // Given: Network is healthy and has problems
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [VALID_REMOTE_ITEM],
    });

    // When: Generate is called
    const item = await testEngine.generate(SKILL_ID, 0.5);

    // Then: It returns the remote item
    expect(item.meta.id).toBe("remote_item");
    // And does NOT use local generator
    expect(mockGenerator.generate).not.toHaveBeenCalled();
  });

  it("falls back to Factory when /problems returns empty but Factory succeeds", async () => {
    // Given: /problems returns empty list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // And: Factory returns items
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [VALID_FACTORY_ITEM] }),
    });

    // When: Generate
    const item = await testEngine.generate(SKILL_ID, 0.5);

    // Then: Returns factory item
    expect(item.meta.id).toBe("factory_item");
  });

  it("falls back to Local Generator when both Bank and Factory return empty responses", async () => {
    // Given: Bank returns empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // And: Factory returns empty items
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    // When: Generate
    const item = await testEngine.generate(SKILL_ID, 0.5);

    // Then: Returns LOCAL item
    expect(item.meta.id).toBe("local_item");
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it("falls back to Local Generator when Network throws error (e.g. offline)", async () => {
    // Given: Network fetch throws
    const networkError = new Error("Network Down");
    mockFetch.mockRejectedValue(networkError);

    // When: Generate
    const item = await testEngine.generate(SKILL_ID, 0.5);

    // Then: Returns LOCAL item
    expect(item.meta.id).toBe("local_item");
    // And logs warning
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("fetch failed"),
      expect.objectContaining({ error: networkError })
    );
  });

  it("falls back to Local Generator when Network returns 500", async () => {
    // Given: Network returns 500
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error"
    });

    // When: Generate
    const item = await testEngine.generate(SKILL_ID, 0.5);

    // Then: Returns LOCAL item
    expect(item.meta.id).toBe("local_item");
  });
});
