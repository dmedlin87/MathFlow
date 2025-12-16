import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocalLearnerService } from "./LearnerService";
import type {
  Attempt,
  MathProblemItem,
  Provenance,
  VerificationReport,
} from "../domain/types";
import { MisconceptionEvaluator } from "../domain/learner/misconceptionEvaluator";

vi.mock("../domain/learner/state", () => ({
  createInitialState: vi.fn((userId) => ({ userId, skillState: {} })),
  updateLearnerState: vi.fn((state) => ({ ...state })),
  recommendNextItem: vi.fn().mockResolvedValue({
    meta: { id: "mock_item", skill_id: "mock_skill" },
    problem_content: { stem: "mock" },
  }),
}));

describe("LocalLearnerService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should simulate network latency", async () => {
    const service = new LocalLearnerService();
    const start = Date.now();
    const promise = service.loadState("user123");

    // Advance time to resolve the internal delay
    await vi.advanceTimersByTimeAsync(400);

    await promise;
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(400);
  });

  it("should return valid initial state", async () => {
    const service = new LocalLearnerService();
    const promise = service.loadState("user_test");

    await vi.advanceTimersByTimeAsync(400);
    const state = await promise;
    expect(state.userId).toBe("user_test");
    expect(state.skillState).toBeDefined();
  });

  it("should submit attempt and return updated state", async () => {
    const service = new LocalLearnerService();
    const p1 = service.loadState("user_test");
    await vi.advanceTimersByTimeAsync(400);
    const state = await p1;

    const attempt: Attempt = {
      id: "123",
      userId: "user_test",
      itemId: "item1",
      skillId: "any_skill",
      timestamp: new Date().toISOString(),
      isCorrect: true,
      timeTakenMs: 1000,
      attemptsCount: 1,
      hintsUsed: 0,
      errorTags: [],
    };

    const p2 = service.submitAttempt(state, attempt);
    await vi.advanceTimersByTimeAsync(400);
    const newState = await p2;
    expect(newState).toBeDefined();

    // Latency check again
    const start = Date.now();
    const p3 = service.submitAttempt(state, attempt);
    await vi.advanceTimersByTimeAsync(400);
    await p3;
    expect(Date.now() - start).toBeGreaterThanOrEqual(400);
  });

  it("should reject non-serializable data (Architecture Violation)", async () => {
    const service = new LocalLearnerService();

    // Create a circular array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circularArray: any[] = [];
    circularArray.push(circularArray);

    const spy = vi.spyOn(MisconceptionEvaluator, "evaluate").mockReturnValue({
      tag: "circular_error",
      hintLadder: circularArray,
      description: "test",
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = { misconceptions: [1] } as any;

    try {
      const p = service.diagnose(item, "bad_input");

      // Attach handler immediately to avoid Unhandled Rejection warning
      const expectation = expect(p).rejects.toThrow(
        "Data could not be serialized (Architecture Violation)"
      );

      await vi.advanceTimersByTimeAsync(400);
      await expectation;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Serialization Violation"),
        expect.anything()
      );
    } finally {
      spy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  it("should return null when answer matches no misconception", async () => {
    const service = new LocalLearnerService();
    const item: MathProblemItem = {
      meta: {
        id: "1",
        skill_id: "test",
        difficulty: 1,
        version: 1,
        created_at: "",
        status: "VERIFIED",
        provenance: {} as unknown as Provenance,
        verification_report: {} as unknown as VerificationReport,
      },
      problem_content: { stem: "1+1", format: "text" },
      answer_spec: { input_type: "integer", answer_mode: "final_only", ui: {} },
      solution_logic: {
        final_answer_canonical: "2",
        final_answer_type: "numeric",
        steps: [],
      },
      misconceptions: [
        {
          id: "m1",
          error_tag: "test_error",
          trigger: { kind: "exact_answer", value: "3" },
          hint_ladder: ["Hint"],
        },
      ],
    };

    const p = service.diagnose(item, "2");
    await vi.advanceTimersByTimeAsync(400);
    const diagnosis = await p;
    expect(diagnosis).toBeNull();
  });

  it("should diagnose known misconceptions", async () => {
    const service = new LocalLearnerService();
    const item: MathProblemItem = {
      meta: {
        id: "1",
        skill_id: "test",
        difficulty: 1,
        version: 1,
        created_at: "",
        status: "VERIFIED",
        provenance: {} as unknown as Provenance,
        verification_report: {} as unknown as VerificationReport,
      },
      problem_content: { stem: "1+1", format: "text" },
      answer_spec: { input_type: "integer", answer_mode: "final_only", ui: {} },
      solution_logic: {
        final_answer_canonical: "2",
        final_answer_type: "numeric",
        steps: [],
      },
      misconceptions: [
        {
          id: "m1",
          error_tag: "test_error",
          trigger: { kind: "exact_answer", value: "3" },
          hint_ladder: ["Hint"],
        },
      ],
    };

    const p = service.diagnose(item, "3");
    await vi.advanceTimersByTimeAsync(400);
    const diagnosis = await p;
    expect(diagnosis).not.toBeNull();
    expect(diagnosis?.error_category).toBe("test_error");
  });

  it("should get recommendation from domain logic", async () => {
    const service = new LocalLearnerService();
    const p1 = service.loadState("user_reco");
    await vi.advanceTimersByTimeAsync(400);
    const state = await p1;

    const p2 = service.getRecommendation(state);
    await vi.advanceTimersByTimeAsync(400);
    const item = await p2;

    expect(item).toBeDefined();
    expect(item.meta).toBeDefined();

    const start = Date.now();
    const p3 = service.getRecommendation(state);
    await vi.advanceTimersByTimeAsync(400);
    await p3;
    expect(Date.now() - start).toBeGreaterThanOrEqual(400);
  });
});
