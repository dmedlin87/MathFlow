import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Skill, Attempt, LearnerState } from "../types";
import { engine } from "../generator/engine";

// Define hoisted mock skills array
const mockSkills = vi.hoisted(() => [] as Skill[]);

// Mock the registry using hoisted variable
vi.mock("../skills/registry", () => {
  return {
    get ALL_SKILLS_LIST() {
      return mockSkills;
    },
  };
});

// Mock the engine to prevent actual generation calls
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
  },
}));

// Import state AFTER mocking to ensure it picks up the mocked registry
import {
  recommendNextItem,
  updateLearnerState,
  createInitialState,
} from "./state";

describe("LearnerState Strict Behavior Tests", () => {
  const createMockSkill = (id: string, overrides: Partial<Skill> = {}): Skill => ({
    id,
    name: `Skill ${id}`,
    gradeBand: "3-5",
    description: "test",
    standards: [],
    prereqs: [],
    templates: ["test_tpl"],
    misconceptions: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSkills.length = 0; // Clear mock skills
  });

  describe("updateLearnerState", () => {
    it("initializes missing skill state with default values before updating", () => {
      // Logic check: Default learningRate is 0.1.
      // Initial mastery 0.1.
      // Incorrect attempt -> Bayesian update lowers it to ~0.013.
      // Learning rate boosts it: 0.013 + (1-0.013)*0.1 = 0.013 + 0.0987 = ~0.111
      // So effectively, even on failure, a novice improves slightly due to "exposure" (transit).

      const state: LearnerState = { userId: "user1", skillState: {} };
      const attempt: Attempt = {
        id: "att-1",
        userId: "user1",
        skillId: "new-skill",
        itemId: "item-1",
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTakenMs: 1000,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);

      expect(newState.skillState["new-skill"]).toBeDefined();
      // Behavior preserved: Mastery INCREASES slightly from default 0.1 on first failure due to learning rate
      expect(newState.skillState["new-skill"].masteryProb).toBeCloseTo(0.112, 2);
      expect(newState.skillState["new-skill"].stability).toBe(0);
    });

    it("clamps mastery probability to minimum 0.01", () => {
      // We need learningRate = 0 to see the drop below 0.01 without the boost masking it
      mockSkills.push(createMockSkill("test-skill", {
        bktParams: { learningRate: 0, slip: 0.1, guess: 0.2 }
      }));

      const state: LearnerState = { userId: "user1", skillState: {} };
      state.skillState["test-skill"] = {
        masteryProb: 0.01,
        stability: 0,
        lastPracticed: "",
        misconceptions: [],
      };

      const attempt: Attempt = {
        id: "att-1",
        userId: "user1",
        skillId: "test-skill",
        itemId: "item-1",
        isCorrect: false, // incorrect -> drops mastery
        timestamp: new Date().toISOString(),
        timeTakenMs: 1000,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);

      // With P=0.01, slip=0.1, guess=0.2
      // num = 0.01 * 0.1 = 0.001
      // den = 0.001 + 0.99 * 0.8 = 0.793
      // newP = 0.001 / 0.793 = 0.00126
      // Clamp should set it to 0.01
      expect(newState.skillState["test-skill"].masteryProb).toBe(0.01);
    });

    it("clamps mastery probability to maximum 0.99", () => {
        // High mastery, correct answer
        mockSkills.push(createMockSkill("max-skill", {
            bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.2 }
        }));

        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["max-skill"] = {
            masteryProb: 0.99,
            stability: 0,
            lastPracticed: "",
            misconceptions: [],
        };

        const attempt: Attempt = {
            id: "att-2",
            userId: "user1",
            skillId: "max-skill",
            itemId: "item-2",
            isCorrect: true,
            timestamp: new Date().toISOString(),
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);
        expect(newState.skillState["max-skill"].masteryProb).toBe(0.99);
    });

    it("increases stability on high mastery correct answer", () => {
        mockSkills.push(createMockSkill("high-skill"));
        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["high-skill"] = {
            masteryProb: 0.85,
            stability: 1,
            lastPracticed: "",
            misconceptions: [],
        };

        const attempt: Attempt = {
            id: "att-1",
            userId: "user1",
            skillId: "high-skill",
            itemId: "item-1",
            isCorrect: true,
            timestamp: new Date().toISOString(),
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);
        // Should increment stability
        expect(newState.skillState["high-skill"].stability).toBe(2);
    });

    it("does NOT increase stability on low mastery correct answer", () => {
        // This covers the 'else' branch of 'if (newP > 0.8)' implicitly by NOT incrementing
        mockSkills.push(createMockSkill("low-skill"));
        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["low-skill"] = {
            masteryProb: 0.1,
            stability: 1,
            lastPracticed: "",
            misconceptions: [],
        };

        const attempt: Attempt = {
            id: "att-1",
            userId: "user1",
            skillId: "low-skill",
            itemId: "item-1",
            isCorrect: true,
            timestamp: new Date().toISOString(),
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);
        // Should NOT increment stability
        expect(newState.skillState["low-skill"].stability).toBe(1);
    });

    it("decreases stability by 0.5 clamped to 0 on incorrect answer", () => {
      const state: LearnerState = { userId: "user1", skillState: {} };
      state.skillState["test-skill"] = {
        masteryProb: 0.5,
        stability: 0.4, // Less than 0.5
        lastPracticed: "",
        misconceptions: [],
      };

      const attempt: Attempt = {
        id: "att-1",
        userId: "user1",
        skillId: "test-skill",
        itemId: "item-1",
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTakenMs: 1000,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);

      expect(newState.skillState["test-skill"].stability).toBe(0);
    });

    it("decreases stability by 0.5 from higher value on incorrect answer", () => {
        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["test-skill"] = {
          masteryProb: 0.5,
          stability: 2.0,
          lastPracticed: "",
          misconceptions: [],
        };

        const attempt: Attempt = {
          id: "att-1",
          userId: "user1",
          skillId: "test-skill",
          itemId: "item-1",
          isCorrect: false,
          timestamp: new Date().toISOString(),
          timeTakenMs: 1000,
          attemptsCount: 1,
          hintsUsed: 0,
          errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);

        expect(newState.skillState["test-skill"].stability).toBe(1.5);
      });

    it("calculates new probability correctly on correct answer", () => {
        mockSkills.push(createMockSkill("calc-skill", {
            bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.2 }
        }));

        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["calc-skill"] = {
            masteryProb: 0.5,
            stability: 0,
            lastPracticed: "",
            misconceptions: [],
        };

        const attempt: Attempt = {
            id: "att-1",
            userId: "user1",
            skillId: "calc-skill",
            itemId: "item-1",
            isCorrect: true,
            timestamp: "",
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);

        // P(L|Correct) = (0.5 * (1-0.1)) / (0.5*(1-0.1) + (1-0.5)*0.2)
        // num = 0.5 * 0.9 = 0.45
        // den = 0.45 + 0.5 * 0.2 = 0.45 + 0.1 = 0.55
        // newP = 0.45 / 0.55 = 0.8181...
        // + transit: 0.8181 + (1-0.8181)*0.1 = 0.8181 + 0.01818 = 0.836...

        expect(newState.skillState["calc-skill"].masteryProb).toBeCloseTo(0.836, 2);
    });

    it("calculates new probability correctly on incorrect answer", () => {
        mockSkills.push(createMockSkill("calc-skill-2", {
            bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.2 }
        }));

        const state: LearnerState = { userId: "user1", skillState: {} };
        state.skillState["calc-skill-2"] = {
            masteryProb: 0.5,
            stability: 0,
            lastPracticed: "",
            misconceptions: [],
        };

        const attempt: Attempt = {
            id: "att-1",
            userId: "user1",
            skillId: "calc-skill-2",
            itemId: "item-1",
            isCorrect: false,
            timestamp: "",
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: [],
        };

        const newState = updateLearnerState(state, attempt);

        // P(L|Incorrect) = (0.5 * 0.1) / (0.5*0.1 + 0.5*(1-0.2))
        // num = 0.05
        // den = 0.05 + 0.5 * 0.8 = 0.05 + 0.4 = 0.45
        // newP = 0.05 / 0.45 = 0.111...
        // + transit: 0.111 + (1-0.111)*0.1 = 0.111 + 0.0888 = 0.2

        expect(newState.skillState["calc-skill-2"].masteryProb).toBeCloseTo(0.2, 1);
    });

    it("handles zero denominator gracefully (edge case)", () => {
      // Very unlikely with valid slip/guess, but let's test defensive coding if possible.
      // If den is 0, newP should be currentP.
      // numerator = currentP * slip
      // denominator = currentP * slip + (1-currentP)*(1-guess)
      // If currentP=0, num=0, den = 1*0.8 = 0.8.
      // To get den=0: currentP=0 AND guess=1?
      // If currentP=0, num=0. den = 0 + 1 * (1-1) = 0.

      mockSkills.push(createMockSkill("edge-skill", {
        bktParams: { learningRate: 0, slip: 0.1, guess: 1 }
      }));

      const state: LearnerState = { userId: "user1", skillState: {} };
      state.skillState["edge-skill"] = {
          masteryProb: 0, // Ensure den is 0
          stability: 0,
          lastPracticed: "",
          misconceptions: [],
      };

      const attempt: Attempt = {
          id: "att-1",
          userId: "user1",
          skillId: "edge-skill",
          itemId: "item-1",
          isCorrect: false,
          timestamp: "",
          timeTakenMs: 1000,
          attemptsCount: 1,
          hintsUsed: 0,
          errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);
      // Should remain 0 (clamped to 0.01 at end)
      expect(newState.skillState["edge-skill"].masteryProb).toBe(0.01);
    });

    it("handles zero denominator gracefully on CORRECT answer", () => {
      // P(L|Correct)
      // num = P * (1-s)
      // den = P*(1-s) + (1-P)*g
      // If P=0, num=0, den = 0 + 1*g = g.
      // If g=0, then den=0.
      mockSkills.push(createMockSkill("edge-correct", {
        bktParams: { learningRate: 0, slip: 0.1, guess: 0 }
      }));

      const state: LearnerState = { userId: "user1", skillState: {} };
      state.skillState["edge-correct"] = {
          masteryProb: 0,
          stability: 0,
          lastPracticed: "",
          misconceptions: [],
      };

      const attempt: Attempt = {
          id: "att-1",
          userId: "user1",
          skillId: "edge-correct",
          itemId: "item-1",
          isCorrect: true, // Correct
          timestamp: "",
          timeTakenMs: 1000,
          attemptsCount: 1,
          hintsUsed: 0,
          errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);
      // If den=0, newP = currentP = 0
      expect(newState.skillState["edge-correct"].masteryProb).toBe(0.01); // Clamped
    });
  });

  describe("recommendNextItem", () => {
    it("filters out candidates that do not meet prerequisites", async () => {
      const skillA = createMockSkill("A");
      const skillB = createMockSkill("B", { prereqs: ["A"] });
      mockSkills.push(skillA, skillB);

      const state = createInitialState("user1");
      state.skillState["A"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };
      state.skillState["B"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };

      (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

      await recommendNextItem(state, () => 0.5, [skillA, skillB]);
      expect(engine.generate).toHaveBeenCalledWith("A", 0.1);
    });

    it("allows candidates that meet prerequisites", async () => {
        const skillA = createMockSkill("A");
        const skillB = createMockSkill("B", { prereqs: ["A"] });
        mockSkills.push(skillA, skillB);

        const state = createInitialState("user1");
        state.skillState["A"] = { masteryProb: 0.8, stability: 0, lastPracticed: "", misconceptions: [] }; // Met
        state.skillState["B"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };

        (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

        await recommendNextItem(state, () => 0.5, [skillB]); // Only pass B to force its selection if valid
        expect(engine.generate).toHaveBeenCalledWith("B", 0.1);
      });

    it("throws error if candidate list is empty", async () => {
        const state = createInitialState("user1");
        await expect(recommendNextItem(state, () => 0.5, [])).rejects.toThrow("No skills available");
    });

    it("includes skills in candidate list even if missing from state (implied initialization)", async () => {
       const skillNew = createMockSkill("new-skill");
       mockSkills.push(skillNew);

       const state = createInitialState("user1");
       delete state.skillState["new-skill"];

       (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

       await recommendNextItem(state, () => 0.5, [skillNew]);
       expect(engine.generate).toHaveBeenCalledWith("new-skill", 0.1);
    });

    it("selects from Review Due if roll < 0.3", async () => {
        const skillReview = createMockSkill("review-skill");
        mockSkills.push(skillReview);

        const state = createInitialState("user1");
        state.skillState["review-skill"] = {
            masteryProb: 0.9,
            stability: 0,
            lastPracticed: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // > 24h ago
            misconceptions: [],
        };

        (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

        // Force roll < 0.3
        await recommendNextItem(state, () => 0.1, [skillReview]);

        expect(engine.generate).toHaveBeenCalledWith("review-skill", 0.9); // Difficulty 0.9 for review
    });

    it("picks lowest mastery from Learning Queue if not reviewing", async () => {
        const skillLow = createMockSkill("low-skill");
        const skillMed = createMockSkill("med-skill");
        mockSkills.push(skillLow, skillMed);

        const state = createInitialState("user1");
        state.skillState["low-skill"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };
        state.skillState["med-skill"] = { masteryProb: 0.5, stability: 0, lastPracticed: "", misconceptions: [] };

        (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

        // Roll > 0.3 to skip review
        await recommendNextItem(state, () => 0.5, [skillLow, skillMed]);

        // Expect low-skill (0.1) over med-skill (0.5)
        expect(engine.generate).toHaveBeenCalledWith("low-skill", 0.1);
    });

    it("falls back to random skill if no review due and no learning queue", async () => {
        // Case: Mastery is high (so not learning queue), but not due for review
        const skillMastered = createMockSkill("mastered-skill");
        mockSkills.push(skillMastered);

        const state = createInitialState("user1");
        state.skillState["mastered-skill"] = {
            masteryProb: 0.9,
            stability: 10,
            lastPracticed: new Date().toISOString(), // Just now, so not due
            misconceptions: [],
        };

        (engine.generate as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { id: "p1" } });

        // Roll > 0.3 to skip review check (though list is empty anyway)
        await recommendNextItem(state, () => 0.5, [skillMastered]);

        expect(engine.generate).toHaveBeenCalledWith("mastered-skill", 0.9);
    });
  });
});
