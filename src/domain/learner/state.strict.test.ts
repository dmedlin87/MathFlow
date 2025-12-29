import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Skill } from "../types";

// Use vi.hoisted to create variables accessible inside vi.mock
const { MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_PREREQ, MOCK_SKILL_TARGET } = vi.hoisted(() => {
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

  const targetSkill: Skill = {
    id: "skill_target",
    name: "Target Skill",
    gradeBand: "3-5",
    templates: [],
    prereqs: ["skill_prereq"],
    misconceptions: [],
  };

  return {
    MOCK_SKILL_CUSTOM_BKT: customBkt,
    MOCK_SKILL_DEFAULT: defaultSkill,
    MOCK_SKILL_PREREQ: prereqSkill,
    MOCK_SKILL_TARGET: targetSkill
  };
});

vi.mock("../skills/registry", () => ({
  ALL_SKILLS_LIST: [MOCK_SKILL_CUSTOM_BKT, MOCK_SKILL_DEFAULT, MOCK_SKILL_PREREQ, MOCK_SKILL_TARGET],
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

  describe("updateLearnerState - BKT Logic", () => {
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

  describe("updateLearnerState - Edge Cases", () => {
    it("gracefully handles unknown skill ID by lazy initializing with defaults", () => {
      const startState = createTestState({ skillState: {} });
      const attempt = {
        id: "att_unknown",
        userId: "u1",
        itemId: "i_unknown",
        skillId: "unknown_skill",
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: false,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      const newState = updateLearnerState(startState, attempt);

      expect(newState.skillState["unknown_skill"]).toBeDefined();
      expect(newState.skillState["unknown_skill"].masteryProb).toBeGreaterThan(0);
      // BKT: 0.1 -> posterior ~0.0137 -> transit adds ~0.098 -> final ~0.1123
      expect(newState.skillState["unknown_skill"].masteryProb).toBeCloseTo(0.1123, 4);
    });

    it("clamps stability decrease to 0", () => {
      // Start with low stability
      const startState = createTestState({
        skillState: {
          [MOCK_SKILL_DEFAULT.id]: createSkillState({ masteryProb: 0.5, stability: 0.2 }),
        },
      });

      const attempt = {
        id: "att_fail",
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
      // Stability 0.2 - 0.5 = -0.3 -> clamped to 0
      expect(newState.skillState[MOCK_SKILL_DEFAULT.id].stability).toBe(0);
    });
  });

  describe("recommendNextItem - Selection Logic", () => {
    it("filters out learning queue items with unmet prereqs", async () => {
      const state = createTestState({
        skillState: {
          [MOCK_SKILL_PREREQ.id]: createSkillState({ masteryProb: 0.5 }), // < 0.7 threshold
          [MOCK_SKILL_TARGET.id]: createSkillState({ masteryProb: 0.1 }),
        },
      });

      const rng = vi.fn().mockReturnValue(0.9); // Prefer learning queue (if available)

      // Only target skill is in learning queue (mastery < 0.8), but prereq is not met
      // So learning queue should be empty, fallback to random

      await recommendNextItem(state, rng, [MOCK_SKILL_PREREQ, MOCK_SKILL_TARGET]);

      // Since target is filtered out, and prereq is also < 0.8, prereq is in learning queue.
      // Wait, Prereq has no prereqs, so it IS valid for learning queue.
      // So it should pick Prereq.
      expect(engine.generate).toHaveBeenCalledWith(MOCK_SKILL_PREREQ.id, expect.any(Number));
    });

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

      it("throws error if skills list is empty", async () => {
          const state = createTestState({ skillState: {} });
          await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available to recommend");
      });
  });
});
