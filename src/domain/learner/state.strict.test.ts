import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Skill } from "../types";

// Use vi.hoisted to create variables accessible inside vi.mock
const { MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_PREREQ, MOCK_SKILL_BLOCKED } = vi.hoisted(() => {
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

  const prereqSkill: Skill = {
    id: "skill_prereq",
    name: "Prereq Skill",
    gradeBand: "3-5",
    templates: [],
    prereqs: [],
    misconceptions: [],
  };

  const blockedSkill: Skill = {
    id: "skill_blocked",
    name: "Blocked Skill",
    gradeBand: "3-5",
    templates: [],
    prereqs: ["skill_prereq"],
    misconceptions: [],
  };

  return {
    MOCK_SKILL_CUSTOM_BKT: customBkt,
    MOCK_SKILL_DEFAULT: defaultSkill,
    MOCK_SKILL_PREREQ: prereqSkill,
    MOCK_SKILL_BLOCKED: blockedSkill
  };
});

vi.mock("../skills/registry", () => ({
  ALL_SKILLS_LIST: [MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_PREREQ, MOCK_SKILL_BLOCKED],
}));

import { updateLearnerState, recommendNextItem } from "./state";
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

  describe("updateLearnerState - BKT Parameters & Defaults", () => {
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

    it("uses default parameters when skill ID is not in registry", () => {
      const unknownSkillId = "skill_unknown";
      const startState = createTestState({
        skillState: {
          [unknownSkillId]: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const attempt = {
        id: "att_unknown",
        userId: "u1",
        itemId: "i_unk",
        skillId: unknownSkillId,
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      // Should use default params (same as MOCK_SKILL_DEFAULT) -> 0.83636
      const newState = updateLearnerState(startState, attempt);
      const newP = newState.skillState[unknownSkillId].masteryProb;

      expect(newP).toBeCloseTo(0.83636, 4);
    });
  });

  describe("updateLearnerState - Edge Cases", () => {
    it("does not decrease stability below 0", () => {
      const startState = createTestState({
        skillState: {
          [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5, stability: 0.2 }),
        },
      });

      const attempt = {
        id: "att_neg",
        userId: "u1",
        itemId: "i_neg",
        skillId: MOCK_SKILL_DEFAULT.id,
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: false,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      // Stability decrease is 0.5. 0.2 - 0.5 = -0.3. Clamped to 0.
      const newState = updateLearnerState(startState, attempt);
      expect(newState.skillState[MOCK_SKILL_DEFAULT.id].stability).toBe(0);
    });

    it("lazily initializes missing skill state before updating", () => {
      // Start with state that doesn't have the skill
      const startState = createTestState({ skillState: {} });

      const attempt = {
        id: "att_lazy",
        userId: "u1",
        itemId: "i_lazy",
        skillId: MOCK_SKILL_DEFAULT.id,
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      const newState = updateLearnerState(startState, attempt);

      // Should now exist
      const skillState = newState.skillState[MOCK_SKILL_DEFAULT.id];
      expect(skillState).toBeDefined();
      // Started at 0.1 (default) -> Updated for correct answer
      // P(L)=0.1, slip=0.1, guess=0.2, LR=0.1
      // Correct:
      // num = 0.1 * 0.9 = 0.09
      // den = 0.1 * 0.9 + 0.9 * 0.2 = 0.09 + 0.18 = 0.27
      // post = 0.09 / 0.27 = 0.3333
      // transit = 0.3333 + (1-0.3333)*0.1 = 0.3333 + 0.0666 = 0.3999
      expect(skillState.masteryProb).toBeCloseTo(0.4, 1);
    });
  });

  describe("recommendNextItem - Stability Boundary", () => {
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
  });

  describe("recommendNextItem - Prerequisites & Defaults", () => {
    it("excludes skills with missing prereq state from the learning queue (prioritizing valid skills)", async () => {
        const state = createTestState({
            skillState: {
                [MOCK_SKILL_BLOCKED.id]: createSkillState({ masteryProb: 0.1 }), // Blocked (lower mastery)
                [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5 }), // Valid (higher mastery)
                // MOCK_SKILL_PREREQ is missing from state
            }
        });

        const rng = vi.fn().mockReturnValue(0.9); // Prefer Learning Queue

        // Pass both skills.
        // If BLOCKED was in learning queue, it would be picked (0.1 < 0.5).
        // Since it is blocked, it should be filtered out, leaving DEFAULT as the best candidate.
        await recommendNextItem(state, rng, [MOCK_SKILL_BLOCKED, MOCK_SKILL_DEFAULT]);

        expect(engine.generate).toHaveBeenCalledWith(MOCK_SKILL_DEFAULT.id, 0.5);
    });

    it("uses ALL_SKILLS from registry if skills argument is omitted", async () => {
        const state = createTestState({
            skillState: {
                [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5 }),
            }
        });

        const rng = vi.fn().mockReturnValue(0.9);

        // Call without the 3rd argument
        await recommendNextItem(state, rng);

        // Should have picked something from ALL_SKILLS_LIST
        // Since we mocked ALL_SKILLS_LIST, we know what's in there.
        // MOCK_SKILL_DEFAULT is the only clear candidate (others are custom/blocked/prereq)
        expect(engine.generate).toHaveBeenCalled();
    });

    it("throws error if skills list is empty", async () => {
        const state = createTestState({ skillState: {} });
        await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available to recommend");
    });
  });
});
