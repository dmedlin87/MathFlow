import { describe, it, expect, vi, beforeEach } from "vitest";
import { recommendNextItem } from "./state";
// import { engine } from "../generator/engine"; // REMOVED
import type {
  Skill,
  LearnerState,
  SkillState,
  MathProblemItem,
} from "../types";

// Mock engine to avoid real generation logic
// REMOVED vi.mock of engine module

const mockEngine = {
  generate: vi.fn(),
  register: vi.fn(),
};


// Helper to create a minimal skill
const createSkill = (id: string, prereqs: string[] = []): Skill => ({
  id,
  name: `Skill ${id}`,
  gradeBand: "3-5",
  prereqs,
  misconceptions: [],
  templates: [],
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.2 },
});

// Helper to create minimal state
const createTestState = (skillState: Record<string, SkillState>): LearnerState => ({
  userId: "test-user",
  skillState,
});

const createSkillState = (masteryProb: number): SkillState => ({
  masteryProb,
  stability: 0,
  lastPracticed: new Date().toISOString(),
  misconceptions: [],
});

// Define skills with prereq chain: A -> B -> C
const skillA = createSkill("A");
const skillB = createSkill("B", ["A"]);
const skillC = createSkill("C", ["B"]);
const skills = [skillA, skillB, skillC];

describe("Scheduler Hardening: Prerequisite Logic", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockEngine.generate.mockResolvedValue({
      meta: { id: "test", skill_id: "test" },
      problem_content: { stem: "test" },
      solution_logic: { final_answer_canonical: "test" },
    });
  });

  it("should NOT recommend Skill B if Skill A is below mastery threshold (0.7)", async () => {
    const state = createTestState({
      A: createSkillState(0.5), // Not mastered
    });

    // Force RNG to try and pick B? No, logic is deterministic for candidate filtering
    // recommendNextItem filters out B because prereq A is not > 0.7
    // So it should pick A.

    await recommendNextItem(state, Math.random, skills, mockEngine);

    expect(mockEngine.generate).toHaveBeenCalledWith("A", expect.any(Number));
    expect(mockEngine.generate).not.toHaveBeenCalledWith("B", expect.any(Number));
  });

  it("should recommend Skill B if Skill A is mastered (>0.7) and B is not", async () => {
    const state = createTestState({
      A: createSkillState(0.8), // Mastered
      B: createSkillState(0.1), // Not mastered
    });

    // We need to ensure RNG doesn't pick review for A.
    // If A is > 0.8, it might be in review queue?
    // Review requires time > 24h.
    // Last practiced is now (default). So Review queue is empty.
    // Learning Queue: A (mastery > 0.8) -> Excluded from Learning Queue.
    // Learning Queue: B (mastery < 0.8, Prereq A > 0.7) -> Included.
    // So B is the only candidate in Learning Queue.

    await recommendNextItem(state, Math.random, skills, mockEngine);

    expect(mockEngine.generate).toHaveBeenCalledWith("B", expect.any(Number));
  });

  it("should NOT recommend Skill C if Skill B is below mastery threshold", async () => {
    const state = createTestState({
      A: createSkillState(0.9),
      B: createSkillState(0.5), // Not mastered enough for C
      C: createSkillState(0.1),
    });

    await recommendNextItem(state, Math.random, skills, mockEngine);

    // Should pick B (Learning Queue) or A (if review).
    // Assuming Review Queue empty.
    // Learning Queue: B (Valid), C (Invalid due to B).
    // Should pick B.

    expect(mockEngine.generate).toHaveBeenCalledWith("B", expect.any(Number));
    expect(mockEngine.generate).not.toHaveBeenCalledWith("C", expect.any(Number));
  });

  it("should handle cyclic dependencies gracefully (smoke test)", async () => {
      // Logic doesn't explicitly check cycles, but should not crash.
      // A -> B -> A
      const sA = createSkill("A", ["B"]);
      const sB = createSkill("B", ["A"]);
      const cycleSkills = [sA, sB];

      const state = createTestState({
          A: createSkillState(0.1),
          B: createSkillState(0.1)
      });

      // Both blocked by each other.
      // candidates: A (blocked by B), B (blocked by A).
      // learningQueue empty.
      // Fallback: Random from candidates.

      await expect(recommendNextItem(state, Math.random, cycleSkills, mockEngine)).resolves.not.toThrow();
      expect(mockEngine.generate).toHaveBeenCalled();
  });

  it("should fail gracefully if skill ID in prereqs does not exist", async () => {
      const sA = createSkill("A", ["NON_EXISTENT"]);
      const state = createTestState({ A: createSkillState(0.1) });

      // Prereq check: state['NON_EXISTENT'] is undefined.
      // undefined && ... -> undefined -> falsy.
      // So allPrereqsMet = false.
      // A is excluded from Learning Queue.
      // Fallback -> Random A.

      await recommendNextItem(state, Math.random, [sA], mockEngine);
      expect(mockEngine.generate).toHaveBeenCalledWith("A", expect.any(Number));
  });
});
