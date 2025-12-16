import type { Skill, Generator, MathProblemItem } from "../types";
import { engine } from "../generator/engine";

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

// Mock provenance helper
const createMockProvenance = (
  skillId: string,
  diff: number
): MathProblemItem["meta"] => ({
  id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  version: 1,
  skill_id: skillId,
  difficulty: Math.ceil(diff * 5) || 1,
  created_at: new Date().toISOString(),
  verified_at: new Date().toISOString(),
  status: "VERIFIED",
  provenance: {
    generator_model: "v0-rule-based-engine",
    critic_model: "v0-simulation",
    judge_model: "v0-simulation",
    verifier: { type: "numeric", passed: true },
    attempt: 1,
  },
  verification_report: {
    rubric_scores: {
      solvability: 1,
      ambiguity: 0,
      procedural_correctness: 1,
      pedagogical_alignment: 1,
    },
    underspecified: false,
    issues: [],
  },
});

// Helper for robust rounding
const robustRound = (n: number, scale: number) => {
  return Math.round((n + Number.EPSILON) * scale) / scale;
};

// ----------------------------------------------------------------------
// 1. Mean (6.SP.B.5.c)
// ----------------------------------------------------------------------

export const SKILL_6_SP_MEAN: Skill = {
  id: "6.sp.mean",
  name: "Calculate Mean",
  gradeBand: "6-8",
  prereqs: ["5.nbt.div_whole"],
  misconceptions: ["median_confusion"],
  templates: ["T_MEAN"],
  description: "Calculate the mean of a data set",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const MeanGenerator: Generator = {
  skillId: SKILL_6_SP_MEAN.id,
  templateId: "T_MEAN",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const count = randomInt(4, 6, rng);
    // Generate numbers such that sum is divisible by count for clean mean usually
    const targetMean = randomInt(5, 20, rng);
    const sum = targetMean * count;

    // Distribute sum
    const nums: number[] = [];
    let currentSum = 0;
    for (let i = 0; i < count - 1; i++) {
        const n = randomInt(1, Math.min(sum - currentSum - (count - i - 1), targetMean * 2), rng);
        nums.push(n);
        currentSum += n;
    }
    nums.push(sum - currentSum);

    // Shuffle
    nums.sort(() => (rng ?? Math.random)() - 0.5);

    const dataSet = nums.join(", ");

    return {
      meta: createMockProvenance(SKILL_6_SP_MEAN.id, difficulty),
      problem_content: {
        stem: `Find the mean (average) of the following data set:

$${dataSet}$`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(targetMean),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Add all the numbers and divide by the count (${count}).`,
            math: `\\frac{${sum}}{${count}} = ${targetMean}`,
            answer: String(targetMean),
          }
        ]
      },
      misconceptions: [],
    };
  }
};

engine.register(MeanGenerator);
