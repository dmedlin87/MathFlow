import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import { Generator } from "../types";

// Mock validation to pass through
vi.mock("../validation", () => ({
  validateMathProblemItem: vi.fn((item) => item),
}));

// Mock logger
vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Engine Behavior", () => {
  let engine: Engine;
  let mockGenerator: Generator;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGenerator = {
        skillId: 'test-skill',
        generate: vi.fn().mockReturnValue({
            meta: { id: 'local-item', skill_id: 'test-skill' },
            problem_content: { stem: 'Local Problem' },
            solution_logic: { final_answer_canonical: '42' }
        })
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns item from API if fetch succeeds", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const mockApiItem = {
        meta: { id: "api-item", skill_id: "test-skill" },
        problem_content: { stem: "API Problem" }
    };

    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockApiItem]
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('api-item');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/problems?skillId=test-skill"));
  });

  it("falls back to Local generator if fetch fails (network error)", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn().mockRejectedValue(new Error("Network Error"));
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item'); // Fallback
    expect(mockGenerator.generate).toHaveBeenCalledWith(0.5, undefined);
  });

  it("falls back to Local generator if API returns error status", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item');
  });

  it("uses Local generator immediately if no API URL is configured", async () => {
    const config = { apiBaseUrl: null };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.meta.id).toBe('local-item');
  });

  it("throws error if generator is missing locally (and no API success)", async () => {
    const config = { apiBaseUrl: null };
    engine = new Engine(config);
    // Do NOT register generator

    await expect(engine.generate('missing-skill', 0.5)).rejects.toThrow("No generator found for skill: missing-skill");
  });

  it("falls back to factory/run if bank is empty but factory succeeds", async () => {
      // Scenario: /problems returns [], but /factory/run returns [item]
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const mockFactoryItem = {
        meta: { id: "factory-item", skill_id: "test-skill" },
        problem_content: { stem: "Factory Problem" }
    };

    const fetchMock = vi.fn()
        .mockResolvedValueOnce({ // /problems
            ok: true,
            json: async () => []
        })
        .mockResolvedValueOnce({ // /factory/run
            ok: true,
            json: async () => ({ items: [mockFactoryItem] })
        });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('factory-item');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining("/factory/run"), expect.anything());
  });
});
