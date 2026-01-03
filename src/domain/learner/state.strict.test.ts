import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Skill } from "../types";

// Use vi.hoisted to create variables accessible inside vi.mock
const { MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_BLOCKED } = vi.hoisted(() => {
  const customBkt: Skill = {
    id: "skill_custom_bkt",
    name: "Custom BKT Skill",
    gradeBand: "3-5",
    templates: [],
    prereqs: [],
    misconceptions: [],
    bktParams: {
      learningRate: 0.5,
      slip: 0.05,
      guess: 0.1,
    },
  };

  const defaultSkill: Skill = {
    id: "skill_default",
    name: "Default Skill",
    gradeBand: "3-5",
    templates: [],
    prereqs: [],
    misconceptions: [],
    // No bktParams
  };

  const blockedSkill: Skill = {
      id: "skill_blocked",
      name: "Blocked Skill",
      gradeBand: "3-5",
      templates: [],
      prereqs: ["skill_default"], // Prereq on default skill
      misconceptions: []
  };

  return { MOCK_SKILL_CUSTOM_BKT: customBkt, MOCK_SKILL_DEFAULT: defaultSkill, MOCK_SKILL_BLOCKED: blockedSkill };
});

vi.mock("../skills/registry", () => ({
  ALL_SKILLS_LIST: [MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_BLOCKED],
}));

import { updateLearnerState, recommendNextItem, createInitialState } from "./state";
import { createTestState, createSkillState, getFixedDate } from "../../test/testHelpers";
import { engine } from "../generator/engine";

// Mock engine
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
  },
}));

describe("learner/state strict behavior", () => {
  const FIXED_DATE = getFixedDate();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    vi.resetAllMocks();
    (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({
        meta: { id: "item_1", skill_id: "skill_default" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("createInitialState", () => {
      it("initializes state with all skills at 0.1 mastery and 0 stability", () => {
          const state = createInitialState("user_123");

          expect(state.userId).toBe("user_123");
          expect(Object.keys(state.skillState)).toHaveLength(3); // 3 mocked skills

          const defaultSkillState = state.skillState[MOCK_SKILL_DEFAULT.id];
          expect(defaultSkillState.masteryProb).toBe(0.1);
          expect(defaultSkillState.stability).toBe(0);
          expect(defaultSkillState.misconceptions).toEqual([]);
      });
  });

  describe("updateLearnerState - Custom BKT Parameters", () => {
    it("uses custom BKT parameters from registry when skill is found", () => {
      const startState = createTestState({
        skillState: {
          [MOCK_SKILL_CUSTOM_BKT.id]: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const attempt = {
        id: "att_1",
        userId: "u1",
        itemId: "i1",
        skillId: MOCK_SKILL_CUSTOM_BKT.id,
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      // LR=0.5, Slip=0.05, Guess=0.1
      // P=0.5 -> P_post=0.90476 -> P_new=0.95238
      const newState = updateLearnerState(startState, attempt);
      const newP = newState.skillState[MOCK_SKILL_CUSTOM_BKT.id].masteryProb;

      expect(newP).toBeCloseTo(0.95238, 4);
    });

    it("uses default BKT parameters when skill def has no params", () => {
      const startState = createTestState({
        skillState: {
          [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const attempt = {
        id: "att_2",
        userId: "u1",
        itemId: "i2",
        skillId: MOCK_SKILL_DEFAULT.id,
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      // Default Params -> 0.83636
      const newState = updateLearnerState(startState, attempt);
      const newP = newState.skillState[MOCK_SKILL_DEFAULT.id].masteryProb;

      expect(newP).toBeCloseTo(0.83636, 4);
    });
  });

  describe("updateLearnerState - Stability", () => {
      it("decreases stability by 0.5 (clamped to 0) on incorrect answer", () => {
          const startState = createTestState({
            skillState: {
              [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5, stability: 1.0 }),
            },
          });

          const attempt = {
            id: "att_incorrect",
            userId: "u1",
            itemId: "i_fail",
            skillId: MOCK_SKILL_DEFAULT.id,
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: false,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0,
          };

          const newState = updateLearnerState(startState, attempt);
          const newStability = newState.skillState[MOCK_SKILL_DEFAULT.id].stability;

          expect(newStability).toBe(0.5);
      });

      it("decreases stability to 0 (clamped) if result would be negative", () => {
        const startState = createTestState({
          skillState: {
            [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5, stability: 0.2 }),
          },
        });

        const attempt = {
          id: "att_incorrect_2",
          userId: "u1",
          itemId: "i_fail",
          skillId: MOCK_SKILL_DEFAULT.id,
          timestamp: FIXED_DATE.toISOString(),
          isCorrect: false,
          timeTakenMs: 1000,
          attemptsCount: 1,
          errorTags: [],
          hintsUsed: 0,
        };

        const newState = updateLearnerState(startState, attempt);
        const newStability = newState.skillState[MOCK_SKILL_DEFAULT.id].stability;

        expect(newStability).toBe(0);
    });
  });

  describe("updateLearnerState - Missing Skill Fallback", () => {
      it("initializes missing skill state with default mastery 0.1 before update", () => {
        // State has no skill data for default skill
        const startState = createTestState({ skillState: {} });

        const attempt = {
            id: "att_new",
            userId: "u1",
            itemId: "i_new",
            skillId: MOCK_SKILL_DEFAULT.id,
            timestamp: FIXED_DATE.toISOString(),
            isCorrect: true,
            timeTakenMs: 1000,
            attemptsCount: 1,
            errorTags: [],
            hintsUsed: 0,
          };

          const newState = updateLearnerState(startState, attempt);

          expect(newState.skillState[MOCK_SKILL_DEFAULT.id]).toBeDefined();
          // Initial 0.1, Correct -> increases.
          // P=0.1 -> P_post=~0.309 -> P_new=~0.378
          expect(newState.skillState[MOCK_SKILL_DEFAULT.id].masteryProb).toBeGreaterThan(0.1);
      });
  });

  describe("recommendNextItem - Scheduler Logic", () => {
    it("does NOT recommend for review if time elapsed is just under the interval", async () => {
      // 23 hours < 24h
      const lastPracticed = new Date(FIXED_DATE.getTime() - 23 * 60 * 60 * 1000).toISOString();
      const state = createTestState({
        skillState: {
          [MOCK_SKILL_DEFAULT.id]: createSkillState({
             masteryProb: 0.9,
             stability: 0,
             lastPracticed: lastPracticed
          }),
          "unmastered": createSkillState({ masteryProb: 0.5 })
        },
      });

      const rng = vi.fn().mockReturnValue(0.1);

      await recommendNextItem(state, rng, [MOCK_SKILL_DEFAULT, { ...MOCK_SKILL_DEFAULT, id: "unmastered" }]);

      // Should pick 'unmastered' because review is not due yet
      expect(engine.generate).toHaveBeenCalledWith("unmastered", 0.5);
    });

    it("recommends for review if time elapsed is just over the interval", async () => {
        // 25 hours > 24h
        const lastPracticed = new Date(FIXED_DATE.getTime() - 25 * 60 * 60 * 1000).toISOString();
        const state = createTestState({
          skillState: {
            [MOCK_SKILL_DEFAULT.id]: createSkillState({
               masteryProb: 0.9,
               stability: 0,
               lastPracticed: lastPracticed
            }),
            "unmastered": createSkillState({ masteryProb: 0.5 })
          },
        });

        const rng = vi.fn().mockReturnValue(0.1);

        await recommendNextItem(state, rng, [MOCK_SKILL_DEFAULT, { ...MOCK_SKILL_DEFAULT, id: "unmastered" }]);

        expect(engine.generate).toHaveBeenCalledWith(MOCK_SKILL_DEFAULT.id, 0.9);
    });

    it("blocks skill if prerequisite is not mastered (< 0.7)", async () => {
        const state = createTestState({
            skillState: {
                [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.6 }), // Prereq not met
                [MOCK_SKILL_BLOCKED.id]: createSkillState({ masteryProb: 0.1 }),
                [MOCK_SKILL_CUSTOM_BKT.id]: createSkillState({ masteryProb: 0.5 }) // Available
            }
        });

        const rng = vi.fn().mockReturnValue(0.9); // Should pick lowest mastery from learning queue

        await recommendNextItem(state, rng, [MOCK_SKILL_DEFAULT, MOCK_SKILL_BLOCKED, MOCK_SKILL_CUSTOM_BKT]);

        expect(engine.generate).toHaveBeenCalledWith(MOCK_SKILL_CUSTOM_BKT.id, 0.5);
    });

    it("skips review item if RNG >= 0.3 and learning queue is available", async () => {
         // Review due
         const lastPracticed = new Date(FIXED_DATE.getTime() - 25 * 60 * 60 * 1000).toISOString();
         const state = createTestState({
           skillState: {
             [MOCK_SKILL_DEFAULT.id]: createSkillState({
                masteryProb: 0.9,
                stability: 0,
                lastPracticed: lastPracticed
             }),
             [MOCK_SKILL_CUSTOM_BKT.id]: createSkillState({ masteryProb: 0.5 })
           },
         });

         const rng = vi.fn().mockReturnValue(0.4); // > 0.3, so should skip review

         await recommendNextItem(state, rng, [MOCK_SKILL_DEFAULT, MOCK_SKILL_CUSTOM_BKT]);

         expect(engine.generate).toHaveBeenCalledWith(MOCK_SKILL_CUSTOM_BKT.id, 0.5);
    });
  });

  describe("recommendNextItem - Empty Skills", () => {
      it("throws error if skills list is empty", async () => {
          const state = createTestState({ skillState: {} });
          await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available to recommend");
      });
  });
});
