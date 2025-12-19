/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Test Skills List (Explicit Injection)
const TEST_SKILLS = [
  { id: "frac_equiv_01", prereqs: [] },
  { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
  { id: "fractions_simplify", prereqs: [] },
  { id: "fractions_sub_like", prereqs: [] },
  { id: "dec_notation_01", prereqs: [] },
  { id: "dec_compare_01", prereqs: [] },
];

describe("Learner State Behavior", () => {
  const FIXED_DATE = getFixedDate();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });


  describe("recommendNextItem", () => {
    const SKILL_ID_1 = "frac_equiv_01";
    let mockEngine: any;

    beforeEach(() => {
      mockEngine = {
        generate: vi.fn().mockReturnValue({
          meta: { id: "gen_item", skill_id: SKILL_ID_1 },
          problem_content: { stem: "Q" },
          solution_logic: { final_answer_canonical: "A" },
        }),
      };
    });

    it("should throw error if no candidate skills provided", async () => {
      const state = createTestState({ skillState: {} });
      await expect(recommendNextItem(state, undefined, [], mockEngine)).rejects.toThrow(
        "No skills available to recommend"
      );
    });

    it("should select review items when due (>24h) and random roll < 0.3", async () => {
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

      await recommendNextItem(state, undefined, TEST_SKILLS, mockEngine);
      // High mastery review sets difficulty to 0.9 (Line 170 coverage)
      expect(mockEngine.generate).toHaveBeenCalledWith(SKILL_ID_1, 0.9);
    });

    it("should select learning queue items when random roll > 0.3", async () => {
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
      await recommendNextItem(state, undefined, skills, mockEngine);

      expect(mockEngine.generate).toHaveBeenCalledWith(
        "frac_add_like_01",
        expect.closeTo(0.2, 1)
      );
    });

    it("should pick lowest mastery item from learning queue", async () => {
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
      await recommendNextItem(state, undefined, skills, mockEngine);

      expect(mockEngine.generate).toHaveBeenCalledWith("frac_add_like_01", 0.2);
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
      await recommendNextItem(state, rng, TEST_SKILLS, mockEngine);
      expect(mockEngine.generate).toHaveBeenCalled();
    });

    it("should skip skill if prerequisites are not met", async () => {
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
      await recommendNextItem(state, undefined, skills, mockEngine);

      // Should pick equiv fractions (the prereq)
      expect(mockEngine.generate).toHaveBeenCalledWith(
        "frac_equiv_01",
        expect.any(Number)
      );

      expect(mockEngine.generate).not.toHaveBeenCalledWith(
        "frac_add_like_01",
        expect.any(Number)
      );
    });

    it("should skip skill if prerequisites are exactly at boundary (0.7)", async () => {
        vi.spyOn(Math, "random").mockReturnValue(0.5);

        const state = createTestState({
          skillState: {
            frac_equiv_01: createSkillState({ masteryProb: 0.7 }), // Boundary condition
            frac_add_like_01: createSkillState({ masteryProb: 0.1 }),
          },
        });

        const skills = [
          { id: "frac_equiv_01", prereqs: [] },
          { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
        ] as any;

        await recommendNextItem(state, undefined, skills, mockEngine);

        // Should NOT pick the dependent skill because prereq is not > 0.7
        expect(mockEngine.generate).toHaveBeenCalledWith(
          "frac_equiv_01",
          expect.any(Number)
        );
        expect(mockEngine.generate).not.toHaveBeenCalledWith("frac_add_like_01", expect.any(Number));
    });

    it("should skip skill if prerequisite state is missing", async () => {
        vi.spyOn(Math, "random").mockReturnValue(0.5);

        const state = createTestState({
          skillState: {
            // frac_equiv_01 is missing from state
            frac_add_like_01: createSkillState({ masteryProb: 0.1 }),
          },
        });

        const skills = [
          { id: "frac_equiv_01", prereqs: [] },
          { id: "frac_add_like_01", prereqs: ["frac_equiv_01"] },
        ] as any;

        await recommendNextItem(state, undefined, skills, mockEngine);

        // Should NOT pick dependent skill
        expect(mockEngine.generate).not.toHaveBeenCalledWith("frac_add_like_01", expect.any(Number));
    });

    it("should handle recommended skill not being present in state (default difficulty)", async () => {
      const state = createTestState({ skillState: {} });
      await recommendNextItem(state, undefined, TEST_SKILLS, mockEngine);

      expect(mockEngine.generate).toHaveBeenCalledWith(expect.any(String), 0.1);
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
      await recommendNextItem(state, undefined, skills, mockEngine);

      expect(mockEngine.generate).toHaveBeenCalledWith("frac_add_like_01", 0.1);
    });

    it("should NOT set high difficulty if selected skill is not highly mastered", async () => {
      // This test targets the ELSE branch of "if (skillState && skillState.masteryProb > 0.8)"
      // Case: Selected skill has mastery <= 0.8.

      vi.spyOn(Math, "random").mockReturnValue(0.5); // Learning queue path
      const state = createTestState({
        skillState: {
          [SKILL_ID_1]: createSkillState({ masteryProb: 0.5 }),
        },
      });

      const skills = TEST_SKILLS.filter((s) => s.id === SKILL_ID_1);
      await recommendNextItem(state, undefined, skills, mockEngine);

      // Should use the masteryProb (0.5) as difficulty, not 0.9
      expect(mockEngine.generate).toHaveBeenCalledWith(SKILL_ID_1, 0.5);
    });
    it("should NOT consume extra RNG calls (determinism check)", async () => {
      const rngMock = vi.fn().mockReturnValue(0.5);
      const state = createTestState({
        skillState: {
          [SKILL_ID_1]: createSkillState({ masteryProb: 0.5 }),
        },
      });
      const skills = TEST_SKILLS.filter((s) => s.id === SKILL_ID_1);

      // Scenario: Learning Queue has items, not review due.
      // Should consume exactly 1 RNG call for the 'roll' decision.
      await recommendNextItem(state, rngMock, skills, mockEngine);

      expect(rngMock).toHaveBeenCalledTimes(1);
    });
  });
});
