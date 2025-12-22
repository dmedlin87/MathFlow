import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recommendNextItem, updateLearnerState, createInitialState } from "./state";
import { engine } from "../generator/engine";
import type { Skill, LearnerState, Attempt, MathProblemItem, Provenance, VerificationReport } from "../types";

// Mock Engine
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
  },
}));

// Mock ALL_SKILLS_LIST used inside state.ts
vi.mock("../skills/registry", () => {
  return {
    ALL_SKILLS_LIST: [
      { id: "skill_1", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "review_skill", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "mastered_no_review", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "mastered_skill", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "s1", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "s2", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "s3", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "missing_skill", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      { id: "missing_skill_2", gradeBand: "3-5", prereqs: [], misconceptions: [], templates: [] },
      // Custom skill with BKT params
      {
        id: "bkt_skill",
        gradeBand: "3-5",
        prereqs: [],
        misconceptions: [],
        templates: [],
        bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.3 }
      },
      // Pathological skill for zero denominator
      {
        id: "zero_skill",
        gradeBand: "3-5",
        prereqs: [],
        misconceptions: [],
        templates: [],
        bktParams: { learningRate: 0.1, slip: 0.0, guess: 0.0 }
      }
    ],
  };
});

// Helper to create valid fake skills
const createSkill = (id: string, overrides: Partial<Skill> = {}): Skill => ({
  id,
  name: `Skill ${id}`,
  gradeBand: "3-5",
  prereqs: [],
  misconceptions: [],
  templates: [],
  ...overrides,
});

// Helper to create a valid LearnerState
const createMockState = (overrides: Partial<LearnerState> = {}): LearnerState => ({
  userId: "test_user",
  skillState: {},
  ...overrides,
});

describe("State Logic Coverage", () => {
  const MOCK_ITEM: MathProblemItem = {
    meta: {
      id: "item_1",
      skill_id: "skill_1",
      difficulty: 0.5,
      version: 1,
      created_at: "",
      provenance: {} as Provenance,
      verification_report: {} as VerificationReport,
      status: "VERIFIED",
    },
    problem_content: { stem: "Problem", format: "text" },
    solution_logic: {
      final_answer_canonical: "42",
      final_answer_type: "numeric",
      steps: [],
    },
    answer_spec: { answer_mode: "final_only", input_type: "integer" },
    misconceptions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (engine.generate as any).mockResolvedValue(MOCK_ITEM);
  });

  describe("recommendNextItem", () => {
    it("throws Error when candidateSkills is empty", async () => {
      const state = createMockState();
      await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available to recommend");
    });

    it("selects from reviewDue when reviewDue > 0 and roll < 0.3", async () => {
      const skill = createSkill("review_skill");
      const state = createMockState({
        skillState: {
          review_skill: {
            masteryProb: 0.9,
            stability: 0, // 24h interval
            lastPracticed: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48h ago
            misconceptions: [],
          },
        },
      });

      // Force rng to return 0.2 (below 0.3 threshold)
      const mockRng = vi.fn().mockReturnValue(0.2);

      await recommendNextItem(state, mockRng, [skill]);

      expect(engine.generate).toHaveBeenCalledWith("review_skill", 0.9);
    });

    it("falls back to random skill when review not selected and learning queue empty", async () => {
       const skill = createSkill("mastered_no_review");
       const state = createMockState({
         skillState: {
           mastered_no_review: {
             masteryProb: 0.9, // Mastered, so not in Learning Queue
             stability: 10, // High stability
             lastPracticed: new Date().toISOString(), // Just practiced, not due for review
             misconceptions: [],
           },
         },
       });

       // Force rng >= 0.3 to skip review logic (if it was due)
       const mockRng = vi.fn().mockReturnValue(0.5);

       await recommendNextItem(state, mockRng, [skill]);

       // Should call generate with the only available skill
       expect(engine.generate).toHaveBeenCalledWith("mastered_no_review", 0.9);
    });

    it("sets difficulty to 0.9 when masteryProb > 0.8", async () => {
      const skill = createSkill("mastered_skill");
      const state = createMockState({
        skillState: {
          mastered_skill: {
            masteryProb: 0.85,
            stability: 0,
            lastPracticed: new Date().toISOString(),
            misconceptions: [],
          },
        },
      });

      // Force selection of this skill (only one available)
      const mockRng = vi.fn().mockReturnValue(0.5);

      await recommendNextItem(state, mockRng, [skill]);

      expect(engine.generate).toHaveBeenCalledWith("mastered_skill", 0.9);
    });

    it("sorts learning queue by mastery (lowest first)", async () => {
        const s1 = createSkill("s1"); // Mastery 0.2
        const s2 = createSkill("s2"); // Mastery 0.1
        const s3 = createSkill("s3"); // Mastery 0.3

        const state = createMockState({
            skillState: {
                s1: { masteryProb: 0.2, stability: 0, lastPracticed: "", misconceptions: [] },
                s2: { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] },
                s3: { masteryProb: 0.3, stability: 0, lastPracticed: "", misconceptions: [] },
            }
        });

        // RNG >= 0.3 to skip review check
        const mockRng = vi.fn().mockReturnValue(0.5);

        await recommendNextItem(state, mockRng, [s1, s2, s3]);

        // Should pick s2 (0.1 mastery)
        expect(engine.generate).toHaveBeenCalledWith("s2", 0.1);
    });

    it("filters out learning queue items with unmet prereqs", async () => {
      const s1 = createSkill("s1"); // Mastery 0.1
      const s2_blocked = createSkill("s2_blocked", { prereqs: ["s1"] }); // Mastery 0.1, blocked by s1

      const state = createMockState({
          skillState: {
              s1: { masteryProb: 0.2, stability: 0, lastPracticed: "", misconceptions: [] }, // < 0.7 threshold
              s2_blocked: { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] },
          }
      });

      // RNG >= 0.3 to skip review
      const mockRng = vi.fn().mockReturnValue(0.5);

      await recommendNextItem(state, mockRng, [s1, s2_blocked]);

      // Should pick s1 because s2_blocked is blocked (s1 mastery 0.2 < 0.7)
      expect(engine.generate).toHaveBeenCalledWith("s1", 0.2);
    });

    it("includes learning queue items with met prereqs", async () => {
      const s1 = createSkill("s1");
      const s2_ready = createSkill("s2_ready", { prereqs: ["s1"] });

      const state = createMockState({
          skillState: {
              s1: { masteryProb: 0.9, stability: 0, lastPracticed: "", misconceptions: [] }, // > 0.7 threshold
              s2_ready: { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] },
          }
      });

      // RNG >= 0.3 to skip review.
      // s1 is mastered (>0.8), so it is NOT in learning queue.
      // s2_ready is mastery 0.1, prereq met. It IS in learning queue.
      const mockRng = vi.fn().mockReturnValue(0.5);

      await recommendNextItem(state, mockRng, [s1, s2_ready]);

      expect(engine.generate).toHaveBeenCalledWith("s2_ready", 0.1);
    });

    it("initializes missing skill state with default values in candidates map", async () => {
        const skill = createSkill("missing_skill");
        const state = createMockState({
            skillState: {} // Empty state
        });

        // This triggers the default initialization inside map
        // const s = state.skillState[skill.id] || { masteryProb: 0.1 ... }

        await recommendNextItem(state, Math.random, [skill]);

        expect(engine.generate).toHaveBeenCalledWith("missing_skill", 0.1);
    });

    it("defaults difficulty to 0.1 if skill state is missing after selection", async () => {
        const skill = createSkill("missing_skill_2");
        const state = createMockState({
            skillState: {} // Empty state
        });

        await recommendNextItem(state, Math.random, [skill]);

        expect(engine.generate).toHaveBeenCalledWith("missing_skill_2", 0.1);
    });
  });

  describe("updateLearnerState", () => {
    it("initializes state for new skill if missing", () => {
      const state = createMockState();
      const attempt: Attempt = {
        id: "a1",
        userId: "test_user",
        itemId: "i1",
        skillId: "skill_1",
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTakenMs: 1000,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: []
      };

      const newState = updateLearnerState(state, attempt);
      expect(newState.skillState["skill_1"]).toBeDefined();
      expect(newState.skillState["skill_1"].stability).toBeGreaterThanOrEqual(0);
    });

    it("increases stability when mastery > 0.8 and correct", () => {
      const state = createMockState({
        skillState: {
          skill_1: {
            masteryProb: 0.9,
            stability: 1,
            lastPracticed: "old_date",
            misconceptions: []
          }
        }
      });
      const attempt: Attempt = {
        id: "a1", userId: "u1", itemId: "i1", skillId: "skill_1",
        isCorrect: true, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      const newState = updateLearnerState(state, attempt);
      // New P should be high, so stability increases by 1
      expect(newState.skillState["skill_1"].stability).toBe(2);
    });

    it("decreases stability when incorrect", () => {
      const state = createMockState({
        skillState: {
          skill_1: {
            masteryProb: 0.9,
            stability: 2,
            lastPracticed: "old_date",
            misconceptions: []
          }
        }
      });
      const attempt: Attempt = {
        id: "a1", userId: "u1", itemId: "i1", skillId: "skill_1",
        isCorrect: false, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      const newState = updateLearnerState(state, attempt);
      // Stability decreases by 0.5
      expect(newState.skillState["skill_1"].stability).toBe(1.5);
    });

    it("uses default BKT params if skill definition not found", () => {
      // "unknown_skill" is not in our mocked registry
      const state = createMockState();
      const attempt: Attempt = {
        id: "a1", userId: "u1", itemId: "i1", skillId: "unknown_skill",
        isCorrect: true, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      const newState = updateLearnerState(state, attempt);
      // It should not crash, and produce some mastery update
      expect(newState.skillState["unknown_skill"].masteryProb).toBeGreaterThan(0.1);
    });

    it("uses custom BKT params from skill definition", () => {
      // "bkt_skill" has specific params in our mock
      const state = createMockState({
          skillState: {
              bkt_skill: { masteryProb: 0.5, stability: 0, lastPracticed: "", misconceptions: [] }
          }
      });

      // Check correct update
      const attemptCorrect: Attempt = {
        id: "a1", userId: "u1", itemId: "i1", skillId: "bkt_skill",
        isCorrect: true, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      const newStateCorrect = updateLearnerState(state, attemptCorrect);
      // Manual calc:
      // slip=0.1, guess=0.3, lr=0.2
      // current=0.5
      // num = 0.5 * 0.9 = 0.45
      // den = 0.45 + 0.5 * 0.3 = 0.45 + 0.15 = 0.6
      // posterior = 0.45 / 0.6 = 0.75
      // transit = 0.75 + (0.25 * 0.2) = 0.75 + 0.05 = 0.8
      expect(newStateCorrect.skillState["bkt_skill"].masteryProb).toBeCloseTo(0.8);
    });

    it("clamps mastery probability between 0.01 and 0.99", () => {
       // Start with very high mastery to test upper clamp
       const stateHigh = createMockState({
           skillState: {
               skill_1: { masteryProb: 0.99, stability: 0, lastPracticed: "", misconceptions: [] }
           }
       });
       const attemptCorrect: Attempt = {
         id: "a1", userId: "u1", itemId: "i1", skillId: "skill_1",
         isCorrect: true, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
       };
       const newStateHigh = updateLearnerState(stateHigh, attemptCorrect);
       expect(newStateHigh.skillState["skill_1"].masteryProb).toBe(0.99);

       // Start with very low mastery to test lower clamp
       // We need an incorrect attempt that drives it low
       const stateLow = createMockState({
           skillState: {
               skill_1: { masteryProb: 0.02, stability: 0, lastPracticed: "", misconceptions: [] }
           }
       });
       const attemptWrong: Attempt = {
         id: "a2", userId: "u1", itemId: "i1", skillId: "skill_1",
         isCorrect: false, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
       };
       const newStateLow = updateLearnerState(stateLow, attemptWrong);
       expect(newStateLow.skillState["skill_1"].masteryProb).toBeGreaterThanOrEqual(0.01);
    });

    it("handles zero denominator in BKT update (edge case)", () => {
        // Construct edge case where denominator becomes 0 (unlikely but possible with weird params)
        // Correct case: denom = P(1-s) + (1-P)g
        // If P=0, s=any, g=0 -> denom = 0 + 1*0 = 0.
        // We use "zero_skill" which has guess=0.

        const state = createMockState({
            skillState: {
                zero_skill: { masteryProb: 0.0, stability: 0, lastPracticed: "", misconceptions: [] }
            }
        });

        // Update with CORRECT attempt
        // num = 0 * (1-0.1) = 0
        // den = 0 * 0.9 + 1 * 0 = 0
        // Result should stay currentP (0.0)
        const attemptCorrect: Attempt = {
          id: "a1", userId: "u1", itemId: "i1", skillId: "zero_skill",
          isCorrect: true, timestamp: "new_date", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
        };

        const newState = updateLearnerState(state, attemptCorrect);
        // After transit: 0 + (1-0) * 0.1 = 0.1
        // So final should be 0.1 (clamped > 0.01)
        expect(newState.skillState["zero_skill"].masteryProb).toBeCloseTo(0.1);

        // Update with INCORRECT attempt
        // P=0, s=0 (for zero_skill we set s=0 too to be sure), g=0
        // num = 0 * 0 = 0
        // den = 0 * 0 + 1 * 1 = 1 (Wait, 1-g is 1)

        // To force denominator 0 on incorrect:
        // den = P*s + (1-P)*(1-g)
        // if P=0, den = 1-g. Need g=1.
        // if P=1, den = s. Need s=0.

        // Let's rely on the branch coverage report. The previous tests likely didn't hit the denominator=0 branch.
        // It's a safety check.
    });
  });

  describe("createInitialState", () => {
    it("initializes state with all registered skills", () => {
      const state = createInitialState("new_user");
      expect(state.userId).toBe("new_user");
      // Check for skills from our mock registry
      expect(state.skillState["skill_1"]).toBeDefined();
      expect(state.skillState["skill_1"].masteryProb).toBe(0.1);
      expect(state.skillState["bkt_skill"]).toBeDefined();
    });
  });
});
