import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createInitialState,
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

describe("learner/state behavior (New Coverage)", () => {
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

    it("should correctly calculate BKT updates", () => {
        // Explicit calculation verification
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
  });
});
