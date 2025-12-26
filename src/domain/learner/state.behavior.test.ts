import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  updateLearnerState,
  recommendNextItem,
} from "./state";
import {
  createTestState,
  createSkillState,
  getFixedDate,
} from "../../test/testHelpers";
import { engine } from "../generator/engine";

// Mock engine dependencies
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
  },
}));

// Test Skills
const TEST_SKILLS = [
  { id: "skill_a", prereqs: [] },
  { id: "skill_b", prereqs: [] },
  { id: "skill_c", prereqs: [] },
] as unknown as import("../types").Skill[];

const FIXED_DATE = getFixedDate();

describe("learner/state behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    vi.resetAllMocks();
    (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({
        meta: { id: "generated_item", skill_id: "skill_a" },
        problem_content: { stem: "Q" },
        solution_logic: { final_answer_canonical: "A" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("updateLearnerState", () => {
    it("increases mastery on correct attempt (BKT)", () => {
        // P(L) = 0.5, slip=0.1, guess=0.2, learningRate=0.1
        // Correct Answer:
        // num = 0.5 * (1 - 0.1) = 0.45
        // den = 0.5 * 0.9 + 0.5 * 0.2 = 0.45 + 0.1 = 0.55
        // P(L|Correct) = 0.45 / 0.55 ≈ 0.8181
        // Transit: 0.8181 + (1 - 0.8181)*0.1 = 0.8181 + 0.01819 = 0.836

        const startState = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.5 })
            }
        });

        const attempt = {
            id: "att_1",
            userId: "u1",
            itemId: "i1",
            skillId: "skill_a",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: true,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        const newP = newState.skillState["skill_a"].masteryProb;

        expect(newP).toBeCloseTo(0.836, 3);
    });

    it("decreases mastery on incorrect attempt (BKT)", () => {
        // P(L) = 0.5, slip=0.1, guess=0.2, learningRate=0.1
        // Incorrect Answer:
        // num = 0.5 * 0.1 = 0.05
        // den = 0.5 * 0.1 + 0.5 * (1 - 0.2) = 0.05 + 0.4 = 0.45
        // P(L|Incorrect) = 0.05 / 0.45 ≈ 0.1111
        // Transit: 0.1111 + (1 - 0.1111)*0.1 = 0.1111 + 0.08889 = 0.2

        const startState = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.5 })
            }
        });

        const attempt = {
            id: "att_1",
            userId: "u1",
            itemId: "i1",
            skillId: "skill_a",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: false,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        const newP = newState.skillState["skill_a"].masteryProb;

        expect(newP).toBeCloseTo(0.2, 3);
    });

    it("increments stability when mastery is high (>0.8) and attempt is correct", () => {
        // P(L) = 0.9. Correct attempt should keep it high (>0.8).
        // stability should increment by 1.

        const startState = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.9, stability: 1 })
            }
        });

        const attempt = {
            id: "att_1",
            userId: "u1",
            itemId: "i1",
            skillId: "skill_a",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: true,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        expect(newState.skillState["skill_a"].stability).toBe(2);
    });

    it("resets/decreases stability when attempt is incorrect", () => {
        const startState = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.9, stability: 2 })
            }
        });

        const attempt = {
            id: "att_1",
            userId: "u1",
            itemId: "i1",
            skillId: "skill_a",
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: false,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0
        };

        const newState = updateLearnerState(startState, attempt);
        // Logic says Math.max(0, stability - 0.5)
        expect(newState.skillState["skill_a"].stability).toBe(1.5);
    });

    it("clamps mastery probability between 0.01 and 0.99", () => {
        // Force very high update (e.g. perfect prior)
        const startStateHigh = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.99 })
            }
        });
        const attemptCorrect = {
            id: "att_1", userId: "u1", itemId: "i1", skillId: "skill_a", timestamp: FIXED_DATE.toISOString(),
            isCorrect: true, timeTakenMs: 1000, attemptsCount: 1, errorTags: [], hintsUsed: 0
        };
        const newStateHigh = updateLearnerState(startStateHigh, attemptCorrect);
        expect(newStateHigh.skillState["skill_a"].masteryProb).toBeLessThanOrEqual(0.99);


        // Force very low update
        const startStateLow = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.01 })
            }
        });
        const attemptIncorrect = {
            id: "att_2", userId: "u1", itemId: "i1", skillId: "skill_a", timestamp: FIXED_DATE.toISOString(),
            isCorrect: false, timeTakenMs: 1000, attemptsCount: 1, errorTags: [], hintsUsed: 0
        };
        const newStateLow = updateLearnerState(startStateLow, attemptIncorrect);
        expect(newStateLow.skillState["skill_a"].masteryProb).toBeGreaterThanOrEqual(0.01);
    });
  });

  describe("recommendNextItem - Prioritization Logic", () => {
    it("should fallback to Learning Queue when Review Due is empty, even if roll < 0.3", async () => {
        // Scenario:
        // - Review Due is EMPTY (no skills need review).
        // - Learning Queue has items.
        // - Roll is 0.1 (would prefer review).
        // Behavior: Should fallback to Learning Queue (pick lowest mastery).

        const state = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.5 }), // Learning Queue
                // skill_b and skill_c will default to 0.1 mastery if not in state
            }
        });

        // We only pass skill_a to recommendNextItem to isolate it
        const skillsSubset = TEST_SKILLS.filter(s => s.id === 'skill_a');

        const rng = vi.fn().mockReturnValue(0.1); // Force "Review" preference

        await recommendNextItem(state, rng, skillsSubset);

        // Should verify it picked skill_a (from learning queue)
        // And NOT thrown error or picked random
        expect(engine.generate).toHaveBeenCalledWith("skill_a", 0.5);
    });

    it("should sort Learning Queue by mastery (lowest first)", async () => {
        // Scenario: multiple items in learning queue with different masteries.
        const state = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.6 }),
                skill_b: createSkillState({ masteryProb: 0.2 }), // Lowest
                skill_c: createSkillState({ masteryProb: 0.4 }),
            }
        });

        const rng = vi.fn().mockReturnValue(0.9); // Force "Learning" preference

        await recommendNextItem(state, rng, TEST_SKILLS);

        expect(engine.generate).toHaveBeenCalledWith("skill_b", 0.2);
    });

    it("should prioritize review if due and roll < 0.3", async () => {
        // skill_a: Mastery 0.9, Last practiced long ago (stability 0 -> 24h). 48h ago.
        const longAgo = new Date(FIXED_DATE.getTime() - 48 * 60 * 60 * 1000).toISOString();
        const state = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.9, stability: 0, lastPracticed: longAgo }),
            }
        });

        const rng = vi.fn().mockReturnValue(0.1); // Force Review

        await recommendNextItem(state, rng, TEST_SKILLS);

        // Should pick skill_a, and difficulty should be 0.9 (challenge on review)
        expect(engine.generate).toHaveBeenCalledWith("skill_a", 0.9);
    });

    it("should filter out skills if prerequisites are not met", async () => {
        // skill_b requires skill_a > 0.7
        const skillsWithPrereqs = [
            { id: "skill_a", prereqs: [] },
            { id: "skill_b", prereqs: ["skill_a"] }
        ] as unknown as import("../types").Skill[];

        const state = createTestState({
            skillState: {
                skill_a: createSkillState({ masteryProb: 0.5 }), // Prereq not met
                skill_b: createSkillState({ masteryProb: 0.1 })
            }
        });

        const rng = vi.fn().mockReturnValue(0.9);

        await recommendNextItem(state, rng, skillsWithPrereqs);

        // Should NOT pick skill_b even if it's low mastery, because prereq failed.
        // Should pick skill_a.
        expect(engine.generate).toHaveBeenCalledWith("skill_a", 0.5);
    });
  });
});
