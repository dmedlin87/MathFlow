import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import { Generator } from "../types";
import { validateMathProblemItem } from "../validation";

// Mock validation to pass through by default
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

  it("falls back to local generator if network fails (fetch throws)", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn().mockRejectedValue(new Error("Network Error"));
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it("falls back to local generator if API returns error status (404/500)", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    const fetchMock = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 }); // /problems

    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it("falls back to local generator if network returns valid JSON but invalid schema", async () => {
    const config = { apiBaseUrl: "http://test-api.com" };
    engine = new Engine(config);
    engine.register(mockGenerator);

    // Mock validation to throw
    vi.mocked(validateMathProblemItem).mockImplementationOnce(() => {
        throw new Error("Schema Validation Failed");
    });

    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ invalid: "item" }] // Returns items so it tries to validate
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it("throws Error if local generator produces invalid item", async () => {
     const config = { apiBaseUrl: null };
     engine = new Engine(config);
     engine.register(mockGenerator);

     vi.mocked(validateMathProblemItem).mockImplementation(() => {
         throw new Error("Local Item Invalid");
     });

     await expect(engine.generate('test-skill', 0.5)).rejects.toThrow("Local Item Invalid");
  });

  it("throws Error if local generator is missing for the requested skill", async () => {
    const config = { apiBaseUrl: null };
    engine = new Engine(config);
    // No generator registered

    await expect(engine.generate('missing-skill', 0.5)).rejects.toThrow("No generator found for skill: missing-skill");
  });
});
