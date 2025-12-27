import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateLearnerState, recommendNextItem, createInitialState } from "./state";
import { createTestState, createSkillState, getFixedDate } from "../../test/testHelpers";
import { engine } from "../generator/engine";

// Mock engine dependencies
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
  },
}));

// Mock Registry to control "ALL_SKILLS" implicitly used by logic
// NOTE: state.ts imports ALL_SKILLS_LIST. We can't easily mock that import without vi.mock module hoisting.
// However, recommendNextItem accepts `skills` arg.
// updateLearnerState imports it directly.
// We will rely on the fact that updateLearnerState handles missing skills gracefully.

const FIXED_DATE = getFixedDate();

describe("learner/state coverage edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createInitialState", () => {
    it("initializes all skills with default mastery 0.1 and stability 0", () => {
        const state = createInitialState("user123");
        expect(state.userId).toBe("user123");

        // Check a known skill (assuming ALL_SKILLS_LIST is not empty, which we can't easily assert on without importing it)
        // But we can check that skillState is populated.
        const skillKeys = Object.keys(state.skillState);
        expect(skillKeys.length).toBeGreaterThan(0);

        const firstSkill = state.skillState[skillKeys[0]];
        expect(firstSkill.masteryProb).toBe(0.1);
        expect(firstSkill.stability).toBe(0);
        expect(firstSkill.misconceptions).toEqual([]);
    });
  });

  describe("updateLearnerState", () => {
    it("uses default BKT params if skill is not found in registry (graceful handling)", () => {
        // This tests the optional chaining `skillDef?.bktParams?.learningRate ?? 0.1`
        // We use a skillId that definitely doesn't exist in the real registry.
        const startState = createTestState({
            skillState: {}
        });
        const attempt = {
            id: "att_1", userId: "u1", itemId: "i1",
            skillId: "NON_EXISTENT_SKILL_ID_12345",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: true, timeTakenMs: 1000, attemptsCount: 1, errorTags: [], hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        // Should not crash.
        // Should initialize the new skill state.
        // Should update mastery using default params.

        const newSkillState = newState.skillState["NON_EXISTENT_SKILL_ID_12345"];
        expect(newSkillState).toBeDefined();
        // Default init 0.1 -> Correct update.
        // Default params: slip 0.1, guess 0.2, LR 0.1
        // Calc: P(L) = 0.1
        // num = 0.1 * 0.9 = 0.09
        // den = 0.09 + 0.9 * 0.2 = 0.09 + 0.18 = 0.27
        // P(L|Correct) = 0.09 / 0.27 = 0.333...
        // Transit: 0.333... + (0.666...) * 0.1 = 0.333 + 0.0666 = 0.4
        expect(newSkillState.masteryProb).toBeCloseTo(0.4, 3);
    });

    it("ensures stability never drops below 0", () => {
        const startState = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.5, stability: 0.2 })
            }
        });
        const attempt = {
            id: "att_1", userId: "u1", itemId: "i1", skillId: "skill_a",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: false, // Decreases stability by 0.5
            timeTakenMs: 1000, attemptsCount: 1, errorTags: [], hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        // 0.2 - 0.5 = -0.3 -> Clamped to 0
        expect(newState.skillState["skill_a"].stability).toBe(0);
    });
  });

  describe("recommendNextItem", () => {
    it("throws error if candidate skills list is empty", async () => {
        const state = createTestState({});
        await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available");
    });

    it("falls back to random selection if all skills are mastered (>0.8) and no review due", async () => {
        // Scenario: User has mastered everything. Nothing is "due" for review yet.
        // learningQueue will be empty (filtered by < 0.8).
        // reviewDue will be empty.
        // Should fall back to selecting from all candidates randomly.

        const skills = [{ id: "skill_a", prereqs: [] }] as any;
        const state = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.9, stability: 10, lastPracticed: FIXED_DATE.toISOString() })
            }
        });
        // stability 10 -> interval 24*(11) hours. clearly not due.

        (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "i1" } });

        await recommendNextItem(state, Math.random, skills);

        // Should have called generate for skill_a
        expect(engine.generate).toHaveBeenCalledWith("skill_a", expect.any(Number));
    });

    it("treats missing prereq state as unmastered (blocking dependent skill)", async () => {
        // skill_b depends on skill_a.
        // state has NO entry for skill_a.
        // Logic: const pState = state.skillState[pid];
        // if pState is undefined, pState && pState.mastery > 0.7 will be false/undefined.

        const skills = [
            { id: "skill_a", prereqs: [] },
            { id: "skill_b", prereqs: ["skill_a"] }
        ] as any;

        const state = createTestState({
            skillState: {
                // skill_a missing
                skill_b: createSkillState({ masteryProb: 0.1 })
            }
        });

        const rng = vi.fn().mockReturnValue(0.9); // Prefer Learning Queue

        await recommendNextItem(state, rng, skills);

        // skill_b is in learning queue candidate?
        // Prereq check: skill_a state missing -> treated as fail.
        // So skill_b is filtered out of learning queue.
        // Only skill_a is left (implicit init in candidate list).

        expect(engine.generate).toHaveBeenCalledWith("skill_a", expect.any(Number));
    });
  });
});
