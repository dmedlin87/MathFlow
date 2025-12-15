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

// Mock dependencies
vi.mock("../generator/engine", () => ({
  engine: {
    generate: vi.fn(),
    register: vi.fn(),
  },
}));

// Test Skills List (Explicit Injection)
const TEST_SKILLS = [
  { id: "frac_equiv_01", prereqs: [] },
  { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
  { id: "fractions_simplify", prereqs: [] },
  { id: "fractions_sub_like", prereqs: [] },
  { id: "dec_notation_01", prereqs: [] },
  { id: "dec_compare_01", prereqs: [] },
  { id: "test_skill", prereqs: [] },
  { id: "gen_item", prereqs: [] },
  { id: "new_skill", prereqs: [] },
] as unknown as import("../types").Skill[];

// Mock Date and Random
const FIXED_DATE = getFixedDate();

describe("learner/state behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("createInitialState", () => {
    it("should return a zeroed state for a new user", () => {
      const state = createInitialState("user_123");
      expect(state.userId).toBe("user_123");
      expect(Object.keys(state.skillState).length).toBeGreaterThan(0);

      const firstSkill = Object.values(state.skillState)[0];
      expect(firstSkill.masteryProb).toBe(0.1);
      expect(firstSkill.stability).toBe(0);
    });
  });

  describe("updateLearnerState", () => {
    it("should increase mastery when attempt is correct", () => {
      const startState = createTestState({
        skillState: {
          test_skill: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const attempt = {
        id: "att_1",
        userId: "user_1",
        itemId: "item_1",
        skillId: "test_skill",
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 1000,
        attemptsCount: 1,
        errorTags: [],
        hintsUsed: 0,
      };

      // This logic relies on 'test_skill' matching something in ALL_SKILLS for BKT params lookup?
      // In state.ts, it calls ALL_SKILLS.find(s => s.id === attempt.skillId).
      // If not found, it defaults to learningRate 0.1, slip 0.1, guess 0.2.
      // This is safe even for 'test_skill'.

      const newState = updateLearnerState(startState, attempt);
      expect(newState.skillState["test_skill"].masteryProb).toBeGreaterThan(
        0.5
      );
    });

    it("should decrease mastery when attempt is incorrect", () => {
      const startState = createTestState({
        skillState: {
          test_skill: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const attempt = {
        id: "att_1",
        userId: "user_1",
        itemId: "item_1",
        skillId: "test_skill",
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: false,
        timeTakenMs: 1000,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(startState, attempt);
      expect(newState.skillState["test_skill"].masteryProb).toBeLessThan(0.5);
    });

    it("should clamp mastery between 0.01 and 0.99", () => {
      const highState = createTestState({
        skillState: { test_skill: createSkillState({ masteryProb: 0.999 }) },
      });
      const attempt = {
        id: "att_1",
        userId: "u1",
        itemId: "i1",
        skillId: "test_skill",
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 100,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(highState, attempt);
      expect(newState.skillState["test_skill"].masteryProb).toBeLessThanOrEqual(
        0.99
      );
    });

    it("should initialize state for a new skill if missing", () => {
      const state = createTestState({ skillState: {} });
      const attempt = {
        id: "att_1",
        userId: "u1",
        itemId: "i1",
        skillId: "new_skill",
        timestamp: FIXED_DATE.toISOString(),
        isCorrect: true,
        timeTakenMs: 100,
        attemptsCount: 1,
        hintsUsed: 0,
        errorTags: [],
      };

      const newState = updateLearnerState(state, attempt);
      expect(newState.skillState["new_skill"]).toBeDefined();
      expect(newState.skillState["new_skill"].masteryProb).toBeGreaterThan(0.1);
    });
  });

  describe("recommendNextItem", () => {
    const SKILL_ID_1 = "frac_equiv_01";

    beforeEach(() => {
      (engine.generate as ReturnType<typeof vi.fn>).mockReturnValue({
        meta: { id: "gen_item", skill_id: SKILL_ID_1 },
        problem_content: { stem: "Q" },
        solution_logic: { final_answer_canonical: "A" },
      });
    });

    it("should select review items when due (>24h) and random roll < 0.3", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const oldDate = new Date("2023-12-30T12:00:00.000Z").toISOString();

      const state = createTestState({
        skillState: {
          [SKILL_ID_1]: createSkillState({
            masteryProb: 0.95,
            lastPracticed: oldDate,
          }),
        },
      });

      recommendNextItem(state, undefined, TEST_SKILLS);
      expect(engine.generate).toHaveBeenCalledWith(SKILL_ID_1, 0.9);
    });

    it("should select learning queue items when random roll > 0.3", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const oldDate = new Date("2023-12-30T12:00:00.000Z").toISOString();

      const state = createTestState({
        skillState: {
          [SKILL_ID_1]: createSkillState({
            masteryProb: 0.95,
            lastPracticed: oldDate,
          }),
          frac_add_like_01: createSkillState({ masteryProb: 0.2 }),
          fractions_simplify: createSkillState({ masteryProb: 0.5 }),
          fractions_sub_like: createSkillState({ masteryProb: 0.5 }),
          dec_notation_01: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const skills = TEST_SKILLS.filter((s) =>
        Object.keys(state.skillState).includes(s.id)
      );
      recommendNextItem(state, undefined, skills);

      expect(engine.generate).toHaveBeenCalledWith(
        "frac_add_like_01",
        expect.closeTo(0.2, 1)
      );
    });

    it("should pick lowest mastery item from learning queue", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const state = createTestState({
        skillState: {
          frac_equiv_01: createSkillState({ masteryProb: 0.75 }),
          frac_add_like_01: createSkillState({ masteryProb: 0.2 }),
          fractions_simplify: createSkillState({ masteryProb: 0.5 }),
          fractions_sub_like: createSkillState({ masteryProb: 0.5 }),
          dec_notation_01: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const skills = TEST_SKILLS.filter((s) =>
        Object.keys(state.skillState).includes(s.id)
      );
      recommendNextItem(state, undefined, skills);

      expect(engine.generate).toHaveBeenCalledWith("frac_add_like_01", 0.2);
    });

    it("should fallback to random skill when no review or learning candidates exist", async () => {
      const recentDate = new Date().toISOString();

      // All skills mastered (>0.8) and recently practiced =
      // reviewDue empty (not enough time passed), learningQueue empty (all mastered)
      // => fallback L144 executes, picks random skill
      const state = createTestState({
        skillState: {
          frac_equiv_01: createSkillState({
            masteryProb: 0.9,
            lastPracticed: recentDate,
          }),
          frac_add_like_01: createSkillState({
            masteryProb: 0.95,
            lastPracticed: recentDate,
          }),
          fractions_sub_like: createSkillState({
            masteryProb: 0.85,
            lastPracticed: recentDate,
          }),
          fractions_simplify: createSkillState({
            masteryProb: 0.88,
            lastPracticed: recentDate,
          }),
          dec_notation_01: createSkillState({
            masteryProb: 0.92,
            lastPracticed: recentDate,
          }),
          dec_compare_01: createSkillState({
            masteryProb: 0.91,
            lastPracticed: recentDate,
          }),
        },
      });

      // rng returns 0.9 which skips review (roll > 0.3), and learning queue is empty
      // so fallback at L144 is triggered
      const rng = () => 0.9;
      await recommendNextItem(state, rng, TEST_SKILLS);
      expect(engine.generate).toHaveBeenCalled();
    });

    it("should skip skill if prerequisites are not met", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const state = createTestState({
        skillState: {
          frac_equiv_01: createSkillState({ masteryProb: 0.5 }),
          frac_add_like_01: createSkillState({ masteryProb: 0.1 }),
        },
      });

      const skills = [
        { id: "frac_equiv_01", prereqs: [] },
        { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
      ] as any;
      recommendNextItem(state, undefined, skills);

      // Should pick equiv fractions (the prereq)
      expect(engine.generate).toHaveBeenCalledWith(
        "frac_equiv_01",
        expect.any(Number)
      );

      expect(engine.generate).not.toHaveBeenCalledWith(
        "frac_add_like_01",
        expect.any(Number)
      );
    });

    it("should handle recommended skill not being present in state (default difficulty)", () => {
      const state = createTestState({ skillState: {} });
      recommendNextItem(state, undefined, TEST_SKILLS);

      expect(engine.generate).toHaveBeenCalledWith(expect.any(String), 0.1);
    });

    it("should enable dependent skill after prereq is mastered", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5); // Ensure we pick from Learning Queue
      const state = createTestState({
        skillState: {
          frac_equiv_01: createSkillState({ masteryProb: 0.95 }), // Prereq Mastered
          frac_add_like_01: createSkillState({ masteryProb: 0.1 }), // Dependent Unmastered
          dec_notation_01: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const skills = [
        { id: "frac_equiv_01", prereqs: [] },
        { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
        { id: "dec_notation_01", prereqs: [] },
      ] as any;
      await recommendNextItem(state, undefined, skills);

      expect(engine.generate).toHaveBeenCalledWith("frac_add_like_01", 0.1);
    });
  });
});
