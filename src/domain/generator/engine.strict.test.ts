import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Engine } from "./engine";
import { Generator } from "../types";
import { validateMathProblemItem } from "../validation";

// Mock validation to pass through by default, but allow overrides
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
    (validateMathProblemItem as ReturnType<typeof vi.fn>).mockImplementation((item) => item);
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

  it("falls back to local generator if network response fails schema validation", async () => {
      const config = { apiBaseUrl: "http://test-api.com" };
      engine = new Engine(config);
      engine.register(mockGenerator);

      // Mock validation to throw on the FIRST call (network item), then pass on subsequent calls (local item)
      (validateMathProblemItem as ReturnType<typeof vi.fn>)
          .mockImplementationOnce(() => { throw new Error("Validation Error"); })
          .mockImplementationOnce((item) => item);

      const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [{
              meta: { id: 'bad-network-item' } // Malformed item
          }]
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await engine.generate('test-skill', 0.5);

      // Should fall back to local
      expect(result.meta.id).toBe('local-item');
      expect(mockGenerator.generate).toHaveBeenCalled();
      // Verify validation was attempted on the network item
      expect(validateMathProblemItem).toHaveBeenCalledTimes(2); // 1st: network (fail), 2nd: local (pass)
  });

  it("throws error if local generator output fails validation", async () => {
      const config = { apiBaseUrl: "" }; // No network
      engine = new Engine(config);
      engine.register(mockGenerator);

      // Mock validation to throw ALWAYS
      (validateMathProblemItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
          throw new Error("Local Validation Error");
      });

      await expect(engine.generate('test-skill', 0.5)).rejects.toThrow("Local Validation Error");
  });
});
