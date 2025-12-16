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

// ----------------------------------------------------------------------
// 1. Exponents (6.EE.A.1)
// ----------------------------------------------------------------------

export const SKILL_6_EE_EXPONENTS: Skill = {
  id: "6.ee.exponents",
  name: "Numerical Expressions with Exponents",
  gradeBand: "6-8",
  prereqs: ["5.oa.order_ops"],
  misconceptions: ["multiply_base_exponent"],
  templates: ["T_EXPONENTS"],
  description: "Write and evaluate numerical expressions involving whole-number exponents",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.1 },
};

export const ExponentsGenerator: Generator = {
  skillId: SKILL_6_EE_EXPONENTS.id,
  templateId: "T_EXPONENTS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const base = randomInt(2, 9, rng);
    const exp = randomInt(2, 4, rng);
    const value = Math.pow(base, exp);

    return {
      meta: createMockProvenance(SKILL_6_EE_EXPONENTS.id, difficulty),
      problem_content: {
        stem: `Evaluate: $ ${base}^${exp} = ? $`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(value),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Multiply ${base} by itself ${exp} times.`,
            math: `${base}^${exp} = ${value}`,
            answer: String(value),
          }
        ]
      },
      misconceptions: [
        {
          id: "misc_mult_base",
          error_tag: "multiply_base_exponent",
          trigger: { kind: "exact_answer", value: String(base * exp) },
          hint_ladder: ["An exponent means repeated multiplication, not multiplying the base by the exponent."],
        }
      ],
    };
  }
};

engine.register(ExponentsGenerator);

// ----------------------------------------------------------------------
// 2. One-Step Equations (6.EE.B.7)
// ----------------------------------------------------------------------

export const SKILL_6_EE_ONE_STEP_EQ: Skill = {
  id: "6.ee.one_step_eq",
  name: "Solve One-Step Equations",
  gradeBand: "6-8",
  prereqs: ["6.ee.exponents"], // loose dependency
  misconceptions: ["inverse_operation"],
  templates: ["T_ONE_STEP_EQ"],
  description: "Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const OneStepEqGenerator: Generator = {
  skillId: SKILL_6_EE_ONE_STEP_EQ.id,
  templateId: "T_ONE_STEP_EQ",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Types: x + a = b, x - a = b, ax = b, x/a = b
    const type = Math.floor((rng ?? Math.random)() * 4);
    const x = randomInt(2, 20, rng); // variable value
    const a = randomInt(2, 12, rng); // constant

    let stem = "";
    let b = 0;

    if (type === 0) { // x + a = b
      b = x + a;
      stem = `Solve for x: $ x + ${a} = ${b} $`;
    } else if (type === 1) { // x - a = b
      b = x - a;
      stem = `Solve for x: $ x - ${a} = ${b} $`;
    } else if (type === 2) { // ax = b
      b = a * x;
      stem = `Solve for x: $ ${a}x = ${b} $`;
    } else { // x / a = b
       b = Math.floor(x / a);
       // Need x to be divisible by a
       const realX = b * a;
       stem = `Solve for x: $ \\frac{x}{${a}} = ${b} $`;
       return {
         meta: createMockProvenance(SKILL_6_EE_ONE_STEP_EQ.id, difficulty),
         problem_content: { stem, format: "latex" },
         answer_spec: { answer_mode: "final_only", input_type: "integer" },
         solution_logic: {
            final_answer_canonical: String(realX),
            final_answer_type: "numeric",
            steps: [{ step_index: 1, explanation: "Multiply both sides by " + a, math: `x = ${b} \\times ${a} = ${realX}`, answer: String(realX) }]
         },
         misconceptions: []
       };
    }

    return {
      meta: createMockProvenance(SKILL_6_EE_ONE_STEP_EQ.id, difficulty),
      problem_content: {
        stem,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(x),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Perform the inverse operation to isolate x.`,
            math: `x = ${x}`,
            answer: String(x),
          }
        ]
      },
      misconceptions: [],
    };
  }
};

engine.register(OneStepEqGenerator);
