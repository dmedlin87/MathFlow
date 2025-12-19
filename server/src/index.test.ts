import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProblems, runFactory, app } from "./index.js";
import { problemBank } from "./store/ProblemBank.js";
import { Request, Response, NextFunction } from "express";
import { MathProblemItem } from "@domain/types.js";
import { ContentPipeline } from "./factory/pipeline.js";
import { skillGeneratorMap } from "@domain/skills/generatorMap.js";
import { config } from "./config.js";

// Mock dependencies
vi.mock("./store/ProblemBank.js", () => ({
  problemBank: {
    fetch: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock("@domain/skills/generatorMap.js", () => ({
  skillGeneratorMap: {
    get: vi.fn(),
  },
}));

vi.mock("./factory/pipeline.js", () => ({
  ContentPipeline: vi.fn(),
}));

vi.mock("./factory/adapters/DomainGeneratorAdapter.js", () => ({
  DomainGeneratorAdapter: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock("./factory/generators/fractions.js", () => ({
  MockCritic: vi.fn().mockImplementation(function () {
    return {};
  }),
  MockJudge: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

// Mock express request/response objects
const mockRequest = (options = {}) =>
  ({
    query: {},
    body: {},
    headers: {},
    ...options,
  } as unknown as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  (res as unknown as { headersSent: boolean }).headersSent = false;
  return res;
};

const mockNext = vi.fn();

const setPipelineRun = (
  runImpl: (difficulty: number) => Promise<MathProblemItem | null>
) => {
  const run = vi.fn(runImpl);
  vi.mocked(ContentPipeline).mockImplementation(function () {
    return { run } as unknown as ContentPipeline;
  });
  return run;
};

describe("Server Security & Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProblems", () => {
    it("should return problems on success", async () => {
      const req = mockRequest({ query: { skillId: "skill-1" } });
      const res = mockResponse();

      const mockProblems = [{ id: "1" }] as unknown as MathProblemItem[];
      vi.mocked(problemBank.fetch).mockResolvedValue(mockProblems);

      await getProblems(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(mockProblems);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should cap limit to the configured max", async () => {
      const req = mockRequest({
        query: { skillId: "skill-1", limit: `${config.rateLimit.max + 5}` },
      });
      const res = mockResponse();

      const mockProblems = [{ id: "1" }] as unknown as MathProblemItem[];
      vi.mocked(problemBank.fetch).mockResolvedValue(mockProblems);

      await getProblems(req, res, mockNext);

      expect(problemBank.fetch).toHaveBeenCalledWith(
        "skill-1",
        config.rateLimit.max
      );
    });

    it("should default invalid limit to 1", async () => {
      const req = mockRequest({
        query: { skillId: "skill-1", limit: "not-a-number" },
      });
      const res = mockResponse();

      const mockProblems = [{ id: "1" }] as unknown as MathProblemItem[];
      vi.mocked(problemBank.fetch).mockResolvedValue(mockProblems);

      await getProblems(req, res, mockNext);

      expect(problemBank.fetch).toHaveBeenCalledWith("skill-1", 1);
    });

    it("should validate skillId", async () => {
      const req = mockRequest({ query: {} }); // Missing skillId
      const res = mockResponse();

      await getProblems(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Missing") })
      );
    });

    it("should catch errors and call next(err)", async () => {
      const req = mockRequest({ query: { skillId: "skill-fail" } });
      const res = mockResponse();

      const error = new Error("Database Failure");
      vi.mocked(problemBank.fetch).mockRejectedValue(error);

      await getProblems(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should generate and save a problem when none exist", async () => {
      const req = mockRequest({ query: { skillId: "skill-1" } });
      const res = mockResponse();

      vi.mocked(problemBank.fetch).mockResolvedValue([]);
      vi.mocked(skillGeneratorMap.get).mockReturnValue({
        skillId: "skill-1",
        generate: vi.fn(),
      });

      const newItem = { id: "new-1" } as unknown as MathProblemItem;
      const run = setPipelineRun(async () => newItem);

      await getProblems(req, res, mockNext);

      expect(run).toHaveBeenCalledWith(config.defaultDifficulty);
      expect(problemBank.save).toHaveBeenCalledWith(newItem);
      expect(res.json).toHaveBeenCalledWith([newItem]);
    });

    it("should warn when no generator is found for empty bank", async () => {
      const req = mockRequest({ query: { skillId: "missing-skill" } });
      const res = mockResponse();

      vi.mocked(problemBank.fetch).mockResolvedValue([]);
      vi.mocked(skillGeneratorMap.get).mockReturnValue(undefined);
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await getProblems(req, res, mockNext);

      expect(warnSpy).toHaveBeenCalledWith(
        "No generator found for skillId: missing-skill"
      );
      expect(res.json).toHaveBeenCalledWith([]);
      warnSpy.mockRestore();
    });
  });

  describe("Global Error Handler Integration", () => {
    it("should return 500 JSON on unhandled error", () => {
      const res = mockResponse();
      const next = vi.fn();
      const err = new Error("Unhandled");
      const errorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const stack =
        (app as unknown as { _router?: { stack?: unknown[] } })._router?.stack ??
        [];
      const errorLayer = stack.find((layer: { handle?: unknown }) => {
        return typeof layer.handle === "function" && layer.handle.length === 4;
      });
      const errorHandler = errorLayer?.handle as
        | ((e: unknown, req: Request, res: Response, n: NextFunction) => void)
        | undefined;

      expect(errorHandler).toBeTypeOf("function");
      errorHandler?.(err, mockRequest(), res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
      });
      errorSpy.mockRestore();
    });
  });

  describe("Security Headers", () => {
    it("should have x-powered-by disabled", () => {
      expect(app.get("x-powered-by")).toBe(false);
    });
  });

  describe("runFactory", () => {
    it("should validate skillId", async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await runFactory(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Missing") })
      );
    });

    it("should return 404 when generator is missing", async () => {
      const req = mockRequest({ body: { skillId: "missing-skill" } });
      const res = mockResponse();

      vi.mocked(skillGeneratorMap.get).mockReturnValue(undefined);

      await runFactory(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("not found") })
      );
    });

    it("should normalize count and difficulty inputs", async () => {
      const req = mockRequest({
        body: { skillId: "skill-1", count: 0, difficulty: "bad" },
      });
      const res = mockResponse();

      vi.mocked(skillGeneratorMap.get).mockReturnValue({
        skillId: "skill-1",
        generate: vi.fn(),
      });

      const item = { id: "gen-1" } as unknown as MathProblemItem;
      const run = setPipelineRun(async () => item);

      await runFactory(req, res, mockNext);

      expect(run).toHaveBeenCalledTimes(1);
      expect(run).toHaveBeenCalledWith(config.defaultDifficulty);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        items: [item],
      });
    });

    it("should clamp difficulty and cap count", async () => {
      const req = mockRequest({
        body: {
          skillId: "skill-1",
          count: config.rateLimit.max + 5,
          difficulty: 2,
        },
      });
      const res = mockResponse();

      vi.mocked(skillGeneratorMap.get).mockReturnValue({
        skillId: "skill-1",
        generate: vi.fn(),
      });

      const item = { id: "gen-1" } as unknown as MathProblemItem;
      const run = setPipelineRun(async () => item);

      await runFactory(req, res, mockNext);

      expect(run).toHaveBeenCalledWith(1);
      expect(run).toHaveBeenCalledTimes(config.rateLimit.max);
      expect(problemBank.save).toHaveBeenCalledTimes(config.rateLimit.max);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: config.rateLimit.max,
        items: Array(config.rateLimit.max).fill(item),
      });
    });

    it("should skip null items from the pipeline", async () => {
      const req = mockRequest({
        body: { skillId: "skill-1", count: 3, difficulty: 0.6 },
      });
      const res = mockResponse();

      vi.mocked(skillGeneratorMap.get).mockReturnValue({
        skillId: "skill-1",
        generate: vi.fn(),
      });

      const item = { id: "gen-1" } as unknown as MathProblemItem;
      const run = setPipelineRun(async () => item);
      run
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(item);

      await runFactory(req, res, mockNext);

      expect(problemBank.save).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        items: [item, item],
      });
    });

    it("should surface errors to next(err)", async () => {
      const req = mockRequest({
        body: { skillId: "skill-1", count: 1, difficulty: 0.6 },
      });
      const res = mockResponse();

      vi.mocked(skillGeneratorMap.get).mockReturnValue({
        skillId: "skill-1",
        generate: vi.fn(),
      });

      const error = new Error("Pipeline failure");
      setPipelineRun(async () => {
        throw error;
      });

      await runFactory(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
