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

// Create a local Mock Generator
const createMockGenerator = (id: string, overrides: Partial<Generator> = {}): Generator => ({
    skillId: id,
    templateId: 'temp_1',
    generate: vi.fn().mockReturnValue({
        meta: { id: `local_${id}`, skill_id: id },
        problem_content: { stem: 'Local Problem' },
        solution_logic: { final_answer_canonical: '42' }
    }),
    ...overrides
});

describe("generator/engine hardening", () => {
    let engine: Engine;
    let mockGen: Generator;

    beforeEach(() => {
        vi.resetAllMocks();
        mockGen = createMockGenerator("test_skill");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("Engine - Fallback Logic (Resiliency)", () => {
        // Contract: API Success -> API Item
        // Contract: API Fail -> Local
        // Contract: API Empty -> Factory -> API Success -> Item
        // Contract: API Empty -> Factory Fail -> Local

        it("returns item from API when fetch succeeds and is valid (Primary Path)", async () => {
            const config = { apiBaseUrl: "http://test-api.com" };
            engine = new Engine(config);
            engine.register(mockGen);

            const apiItem = { meta: { id: "api_item", skill_id: "test_skill" } };

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [apiItem]
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await engine.generate("test_skill", 0.5);

            expect(result.meta.id).toBe("api_item");
            // Should NOT call local generator
            expect(mockGen.generate).not.toHaveBeenCalled();
        });

        it("calls Factory when API returns empty list, then returns new item (JIT Path)", async () => {
            const config = { apiBaseUrl: "http://test-api.com" };
            engine = new Engine(config);
            engine.register(mockGen);

            const factoryItem = { meta: { id: "factory_item", skill_id: "test_skill" } };

            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ // /problems -> empty
                    ok: true,
                    json: async () => []
                })
                .mockResolvedValueOnce({ // /factory/run -> OK with items
                    ok: true,
                    json: async () => ({ items: [factoryItem] })
                });
            vi.stubGlobal('fetch', fetchMock);

            const result = await engine.generate("test_skill", 0.5);

            expect(result.meta.id).toBe("factory_item");
            expect(fetchMock).toHaveBeenCalledTimes(2); // Problems + Factory
            expect(mockGen.generate).not.toHaveBeenCalled();
        });

        it("falls back to Local when Factory fails (or returns empty)", async () => {
            const config = { apiBaseUrl: "http://test-api.com" };
            engine = new Engine(config);
            engine.register(mockGen);

            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ // /problems -> empty
                    ok: true,
                    json: async () => []
                })
                .mockResolvedValueOnce({ // /factory/run -> 500 Error
                    ok: false,
                    status: 500
                });
            vi.stubGlobal('fetch', fetchMock);

            const result = await engine.generate("test_skill", 0.5);

            expect(result.meta.id).toBe("local_test_skill");
            expect(mockGen.generate).toHaveBeenCalled();
        });

        it("falls back to Local when API Fetch throws Network Error", async () => {
            const config = { apiBaseUrl: "http://test-api.com" };
            engine = new Engine(config);
            engine.register(mockGen);

            const fetchMock = vi.fn().mockRejectedValue(new Error("Network Down"));
            vi.stubGlobal('fetch', fetchMock);

            const result = await engine.generate("test_skill", 0.5);

            expect(result.meta.id).toBe("local_test_skill");
            expect(mockGen.generate).toHaveBeenCalled();
        });
    });

    describe("Engine - Validation Integration", () => {
        it("falls back to Local if API returns invalid item (Schema Violation)", async () => {
             // We need to unmock validation for this specific test to simulate failure
             // But wait, the mocked validation is "vi.fn(item => item)".
             // If we want to simulate validation failure, we should make the mock throw.

             // However, reusing the top-level mock is tricky if we want to change behavior per test.
             // We can use vi.mocked(validateMathProblemItem).mockImplementationOnce(...)

             // Let's rely on the module mock
             const { validateMathProblemItem } = await import("../validation");
             vi.mocked(validateMathProblemItem).mockImplementationOnce(() => {
                 throw new Error("Invalid Schema");
             });

            const config = { apiBaseUrl: "http://test-api.com" };
            engine = new Engine(config);
            engine.register(mockGen);

            const badItem = { meta: { id: "bad_item" } }; // Missing fields

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [badItem]
            });
            vi.stubGlobal('fetch', fetchMock);

            // Expect generate to catch the validation error and fallback?
            // Let's check Engine.ts source...
            // It says: return validateMathProblemItem(problems[0]);
            // It wraps the whole fetch block in try/catch.
            // So if validate throws, it should go to catch -> fallback.

            const result = await engine.generate("test_skill", 0.5);

            expect(result.meta.id).toBe("local_test_skill");
            expect(mockGen.generate).toHaveBeenCalled();
        });
    });
});
