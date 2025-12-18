import { describe, it, expect, vi } from "vitest";
import { recommendNextItem, updateLearnerState, createInitialState } from "./state";
import type { LearnerState, Skill, Attempt } from "../types";
import { engine } from "../generator/engine";

// Mock the engine to prevent actual generation calls
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn().mockResolvedValue({
      meta: { id: "mock_problem", skill_id: "mock_skill" },
    }),
  },
}));

describe("LearnerState Behavior", () => {
  const mockSkill = (id: string, prereqs: string[] = []): Skill => ({
    id,
    name: `Skill ${id}`,
    grade: "4",
    domain: "test",
    description: "test",
    standards: [],
    prereqs,
    learningObjectives: [],
    misconceptions: {},
  });

  describe("recommendNextItem", () => {
    it("prioritizes Review items when 'review due' exists and luck favors (roll < 0.3)", async () => {
      // Given: 2 skills, one due for review (mastered long ago), one new
      const skillReview = mockSkill("review_skill");
      const skillNew = mockSkill("new_skill");
      const allSkills = [skillReview, skillNew];

      const state = createInitialState("user1");

      // Setup Review Skill: Mastered (0.9), Stability 0 (Interval 24h), Last practiced 48h ago
      state.skillState["review_skill"] = {
        masteryProb: 0.9,
        stability: 0, // 24h interval
        lastPracticed: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 48h ago
        misconceptions: [],
      };

      // Setup New Skill: Low mastery
      state.skillState["new_skill"] = {
        masteryProb: 0.1,
        stability: 0,
        lastPracticed: new Date().toISOString(),
        misconceptions: [],
      };

      // When: RNG rolls 0.1 (favorable for review)
      const mockRng = () => 0.1;
      const result = await recommendNextItem(state, mockRng, allSkills);

      // Then: It recommends the review skill
      expect(engine.generate).toHaveBeenCalledWith("review_skill", 0.9);
    });

    it("prioritizes Learning Queue when review roll fails (roll > 0.3)", async () => {
       // Given: Same setup as above (Review due)
       const skillReview = mockSkill("review_skill");
       const skillNew = mockSkill("new_skill");
       const allSkills = [skillReview, skillNew];

       const state = createInitialState("user1");
       state.skillState["review_skill"] = {
         masteryProb: 0.9,
         stability: 0,
         lastPracticed: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
         misconceptions: [],
       };

       // When: RNG rolls 0.5 (NOT favorable for review)
       const mockRng = () => 0.5;
       const result = await recommendNextItem(state, mockRng, allSkills);

       // Then: It recommends the NEW skill (Learning Queue)
       // Note: "new_skill" has mastery 0.1, so it is in learning queue
       expect(engine.generate).toHaveBeenCalledWith("new_skill", 0.1);
    });

    it("strictly blocks skills with unmet prerequisites", async () => {
      // Given: Skill B requires Skill A
      const skillA = mockSkill("A");
      const skillB = mockSkill("B", ["A"]);
      const allSkills = [skillA, skillB];

      const state = createInitialState("user1");

      // Skill A is NOT mastered (0.1)
      state.skillState["A"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };
      state.skillState["B"] = { masteryProb: 0.1, stability: 0, lastPracticed: "", misconceptions: [] };

      // When: We ask for recommendation
      // Logic:
      // Review: None
      // Learning Queue: A (ok), B (BLOCKED by A < 0.7)
      // So it MUST pick A
      const result = await recommendNextItem(state, () => 0.9, allSkills);

      // Then: It recommends A
      expect(engine.generate).toHaveBeenCalledWith("A", 0.1);
    });

    it("throws error if no skills available at all", async () => {
      const state = createInitialState("user1");
      await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow("No skills available");
    });
  });

  describe("updateLearnerState", () => {
    it("auto-initializes state for unknown skills (Self-Healing)", () => {
      // Given: State with NO knowledge of 'surprise_skill'
      const state = createInitialState("user1");
      const attempt: Attempt = {
        id: "1", userId: "user1", skillId: "surprise_skill", isCorrect: true,
        itemId: "1", timestamp: new Date().toISOString(), timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      // When: Update is called
      const newState = updateLearnerState(state, attempt);

      // Then: It creates the entry and updates it
      expect(newState.skillState["surprise_skill"]).toBeDefined();
      expect(newState.skillState["surprise_skill"].masteryProb).toBeGreaterThan(0.1);
    });

    it("clamps mastery probability strictly to 0.99 max", () => {
      // Given: Already maxed mastery
      const state = createInitialState("user1");
      const skillId = "test_skill";
      state.skillState[skillId] = {
        masteryProb: 0.99, stability: 0, lastPracticed: "", misconceptions: []
      };

      const attempt: Attempt = {
        id: "1", userId: "user1", skillId, isCorrect: true, // Another success
        itemId: "1", timestamp: "", timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
      };

      // When: Update
      const newState = updateLearnerState(state, attempt);

      // Then: Stays at 0.99, does not exceed 1.0
      expect(newState.skillState[skillId].masteryProb).toBe(0.99);
    });
  });
});
