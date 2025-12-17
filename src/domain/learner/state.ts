import type { LearnerState, Attempt, MathProblemItem, Skill } from "../types";
import { engine } from "../generator/engine";
import { ALL_SKILLS_LIST } from "../skills/registry";

// Scheduler uses the central registry
const ALL_SKILLS = ALL_SKILLS_LIST;

export function createInitialState(
  userId: string,
  gradeLevel?: number
): LearnerState {
  const state: LearnerState = {
    userId,
    gradeLevel,
    skillState: {},
  };
  // Initialize with 0 mastery
  ALL_SKILLS.forEach((skill) => {
    state.skillState[skill.id] = {
      masteryProb: 0.1,
      stability: 0,
      lastPracticed: new Date().toISOString(),
      misconceptions: [],
    };
  });
  return state;
}

export function updateLearnerState(
  state: LearnerState,
  attempt: Attempt
): LearnerState {
  let skillState = state.skillState[attempt.skillId];

  if (!skillState) {
    // If we are answering a problem for a skill we don't have state for, initialize it
    skillState = {
      masteryProb: 0.1,
      stability: 0,
      lastPracticed: new Date().toISOString(),
      misconceptions: [],
    };
  }

  const newState = {
    ...state,
    skillState: { ...state.skillState },
  };
  const newSkillState = { ...skillState };

  // BKT Parameters (Default vs Skill Override)
  // Ideally we need to look up the skill object.
  // For now, let's look it up from ALL_SKILLS which is imported in this file.
  const skillDef = ALL_SKILLS.find((s) => s.id === attempt.skillId);

  const learningRate = skillDef?.bktParams?.learningRate ?? 0.1;
  const slip = skillDef?.bktParams?.slip ?? 0.1;
  const guess = skillDef?.bktParams?.guess ?? 0.2;

  const currentP = skillState.masteryProb;
  let newP = currentP;

  if (attempt.isCorrect) {
    // P(L|Correct) = (P(L) * (1-s)) / (P(L)*(1-s) + (1-P(L))*g)
    const numerator = currentP * (1 - slip);
    const denominator = currentP * (1 - slip) + (1 - currentP) * guess;
    newP = denominator > 0 ? numerator / denominator : currentP;

    // Stability Increase: If masterful, increase intervals
    // Simple additive for now: +1 day if high mastery
    if (newP > 0.8) {
      newSkillState.stability = (newSkillState.stability || 0) + 1;
    }
  } else {
    // P(L|Incorrect) = (P(L) * s) / (P(L)*s + (1-P(L))*(1-g))
    const numerator = currentP * slip;
    const denominator = currentP * slip + (1 - currentP) * (1 - guess);
    newP = denominator > 0 ? numerator / denominator : currentP;

    // Stability Reset: If they got it wrong, trust drops
    newSkillState.stability = Math.max(0, (newSkillState.stability || 0) - 0.5);
  }

  // Add learning gain (transit)
  newP = newP + (1 - newP) * learningRate;

  // Clamp
  newSkillState.masteryProb = Math.min(0.99, Math.max(0.01, newP));

  newSkillState.lastPracticed = attempt.timestamp;

  newState.skillState[attempt.skillId] = newSkillState;

  return newState;
}

// Helper: Check if skill is allowed for grade level
function isSkillAllowedForGrade(skill: Skill, grade?: number): boolean {
  if (grade === undefined) return true; // No grade set, allow all

  // Map bands to max grade
  const bandMax: Record<string, number> = {
    "K-2": 2,
    "3-5": 5,
    "6-8": 8,
    "9-12": 12,
  };

  const skillMax = bandMax[skill.gradeBand] || 12;

  // Allow if user grade is within or above the band?
  // Actually, usually you want to allow skills from *current* and *previous* bands.
  // But you might want to hide skills from *future* bands.
  // e.g. Grade 4 student (in 3-5) should see K-2 and 3-5. Should NOT see 6-8.
  // The logic is: Skill Band Min Grade <= User Grade?
  // Let's rely on the Band Max.
  // "6-8" implies 6, 7, 8.
  // "3-5" implies 3, 4, 5.
  // A Grade 4 student should see "3-5".
  // A Grade 4 student should NOT see "6-8".
  // So: If user grade < Band Min, block it.

  const bandMin: Record<string, number> = {
    "K-2": 0,
    "3-5": 3,
    "6-8": 6,
    "9-12": 9,
  };

  const skillMin = bandMin[skill.gradeBand] || 0;

  return grade >= skillMin;
}

export async function recommendNextItem(
  state: LearnerState,
  rng: () => number = Math.random,
  skills: Skill[] = ALL_SKILLS
): Promise<MathProblemItem> {
  const now = new Date();
  // Re-verify ALL_SKILLS against state to ensure no missing entries (e.g. if loaded from storage)
  const candidateSkills = skills
    .map((skill) => {
      const s = state.skillState[skill.id] || {
        masteryProb: 0.1,
        stability: 0,
        lastPracticed: new Date().toISOString(),
        misconceptions: [],
      };
      return { skill, state: s };
    })
    .filter((c) => isSkillAllowedForGrade(c.skill, state.gradeLevel));

  // 1. Identify "Review Due" items
  const reviewDue = candidateSkills.filter((c) => {
    if (c.state.masteryProb < 0.8) return false; // Only review reinforced items

    const lastPracticed = new Date(c.state.lastPracticed);
    const hoursSince =
      (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60);

    // Base interval is 24h
    const requiredIntervalHours = 24 * (1 + (c.state.stability || 0));

    return hoursSince > requiredIntervalHours;
  });

  // 2. Identify "Learning Queue" (mastery < 0.8)
  // AND check prerequisites
  const learningQueue = candidateSkills.filter((c) => {
    if (c.state.masteryProb >= 0.8) return false;

    // Check prereqs
    if (c.skill.prereqs.length > 0) {
      const allPrereqsMet = c.skill.prereqs.every((pid: string) => {
        const pState = state.skillState[pid];
        return pState && pState.masteryProb > 0.7; // Threshold for moving on
      });
      if (!allPrereqsMet) return false;
    }
    return true;
  });

  // Mix strategy: 30% Review (Adaptive), 70% New Learning (if available)
  let targetSkill;
  const roll = rng();

  // Adaptive Review Probability
  // If queue is huge (>5), bump review probability
  let reviewProb = 0.3;
  if (reviewDue.length > 5) reviewProb = 0.6;
  if (reviewDue.length > 10) reviewProb = 0.8;

  if (candidateSkills.length === 0) {
    throw new Error("No skills available to recommend");
  }

  // Prioritize based on queues
  if (reviewDue.length > 0 && (roll < reviewProb || learningQueue.length === 0)) {
    // Pick random review item
    targetSkill = reviewDue[Math.floor(rng() * reviewDue.length)].skill;
  } else if (learningQueue.length > 0) {
    // Pick lowest mastery
    targetSkill = learningQueue.sort(
      (a, b) => a.state.masteryProb - b.state.masteryProb
    )[0].skill;
  } else {
    // Fallback: Just random skill (or forced review if nothing else)
    targetSkill =
      candidateSkills[Math.floor(rng() * candidateSkills.length)].skill;
  }

  // Determine difficulty based on mastery
  const skillState = state.skillState[targetSkill.id];
  let difficulty = skillState?.masteryProb || 0.1;

  // If review, we might want to check retention, potentially slightly harder or same
  if (skillState && skillState.masteryProb > 0.8) {
    difficulty = 0.9; // Challenge on review
  }

  // Use engine.generate with skillId
  // Note: engine.generate might fail if we ask for a skill not registered.
  return engine.generate(targetSkill.id, difficulty);
}
