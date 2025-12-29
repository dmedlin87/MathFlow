import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import { Generator } from "../types";

// Mock validation to pass through
vi.mock("../validation", () => ({
  validateMathProblemItem: vi.fn((item) => item),
}));

// Mock logger to suppress noise
vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Engine Strict Behavior", () => {
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

  it("falls back to local generator if Factory returns empty items list", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn()
        .mockResolvedValueOnce({ // /problems -> empty
            ok: true,
            json: async () => []
        })
        .mockResolvedValueOnce({ // /factory/run -> OK but empty items
            ok: true,
            json: async () => ({ items: [] })
        });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    // Should fall back to local
    expect(result.meta.id).toBe('local-item');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it("falls back to local generator if fetch response.json() throws error", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error("Invalid JSON"); }
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });
});
