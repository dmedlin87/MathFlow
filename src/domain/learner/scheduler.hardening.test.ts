import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recommendNextItem } from "./state";
import { engine } from "../generator/engine";
import type { Skill, LearnerState, SkillState } from "../types";

// Mock engine to avoid real generation logic
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
    register: vi.fn(),
  },
}));

// Helper to create a minimal skill
const createSkill = (id: string, prereqs: string[] = []): Skill => ({
  id,
  name: `Skill ${id}`,
  gradeBand: "3-5",
  prereqs,
  misconceptions: [],
  templates: [],
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.2 },
});

// Helper to create minimal state
const createState = (
  skillStates: Record<string, Partial<SkillState>>
): LearnerState => ({
  userId: "test_user",
  skillState: Object.entries(skillStates).reduce((acc, [id, s]) => {
    acc[id] = {
      masteryProb: 0.1,
      stability: 0,
      lastPracticed: new Date().toISOString(),
      misconceptions: [],
      ...s,
    };
    return acc;
  }, {} as Record<string, SkillState>),
});

describe("Scheduler Hardening (Edge Cases)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return to avoid unrelated crashes
    (engine.generate as any).mockResolvedValue({ meta: { id: "mock_item" } });
  });

  it("should NOT crash when skill list is empty", async () => {
    const skills: Skill[] = [];
    const state = createState({});

    // Expectation: Should throw or handle gracefully.
    // Current code: likely crashes on accessing targetSkill.id
    await expect(recommendNextItem(state, Math.random, skills)).rejects.toThrow(
      "No skills available to recommend"
    );
    // We anticipate a crash, so we expect rejection.
    // If it doesn't crash, we'll update the test to expect a safe return (e.g. null).
  });

  it("should handle circular dependencies by falling back (Fail Open)", async () => {
    // Graph: A -> B -> A
    const skills = [createSkill("A", ["B"]), createSkill("B", ["A"])];

    const state = createState({
      A: { masteryProb: 0.1 },
      B: { masteryProb: 0.1 },
    });

    // neither is unlocked. fallback logic picks random.
    await recommendNextItem(state, Math.random, skills);

    expect(engine.generate).toHaveBeenCalled();
    const callArgs = (engine.generate as any).mock.calls[0];
    // Must be A or B
    expect(["A", "B"]).toContain(callArgs[0]);
  });

  it("should fall back to random skill when ALL skills are mastered and recently practiced (Review saturated)", async () => {
    const skills = [createSkill("A")];
    const state = createState({
      A: { masteryProb: 0.99, lastPracticed: new Date().toISOString() }, // Just practiced
    });

    // Review due? No (recent).
    // Learning queue? No (mastered).
    // Fallback -> A.

    await recommendNextItem(state, Math.random, skills);
    expect(engine.generate).toHaveBeenCalledWith("A", expect.any(Number));
  });

  it("should handle missing state for passed skills (Graceful Initialization)", async () => {
    const skills = [createSkill("A")];
    const state = createState({}); // Empty state

    await recommendNextItem(state, Math.random, skills);
    expect(engine.generate).toHaveBeenCalledWith("A", expect.any(Number));
  });
});
