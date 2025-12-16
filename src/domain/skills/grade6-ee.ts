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
  description:
    "Write and evaluate numerical expressions involving whole-number exponents",
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
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_mult_base",
          error_tag: "multiply_base_exponent",
          trigger: { kind: "exact_answer", value: String(base * exp) },
          hint_ladder: [
            "An exponent means repeated multiplication, not multiplying the base by the exponent.",
          ],
        },
      ],
    };
  },
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
  description:
    "Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q",
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

    if (type === 0) {
      // x + a = b
      b = x + a;
      stem = `Solve for x: $ x + ${a} = ${b} $`;
    } else if (type === 1) {
      // x - a = b
      b = x - a;
      stem = `Solve for x: $ x - ${a} = ${b} $`;
    } else if (type === 2) {
      // ax = b
      b = a * x;
      stem = `Solve for x: $ ${a}x = ${b} $`;
    } else {
      // x / a = b
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
          steps: [
            {
              step_index: 1,
              explanation: "Multiply both sides by " + a,
              math: `x = ${b} \\times ${a} = ${realX}`,
              answer: String(realX),
            },
          ],
        },
        misconceptions: [],
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
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(OneStepEqGenerator);

// ----------------------------------------------------------------------
// 3. Expressions (6.EE.A.2)
// ----------------------------------------------------------------------
export const SKILL_6_EE_EXPRESSIONS: Skill = {
  id: "6.ee.expressions",
  name: "Reading and Writing Expressions",
  gradeBand: "6-8",
  prereqs: ["5.oa.patterns"],
  misconceptions: ["order_of_ops_variable"],
  templates: ["T_EXPRESSIONS"],
  description: "Write and evaluate numerical expressions involving variables",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const ExpressionsGenerator: Generator = {
  skillId: SKILL_6_EE_EXPRESSIONS.id,
  templateId: "T_EXPRESSIONS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Translate: "The product of 5 and a number x" -> "5x" ?
    // Or "Evaluate 5x + 3 when x = 2"
    const type = (rng ?? Math.random)() < 0.5 ? "evaluate" : "translate";

    if (type === "evaluate") {
      const m = randomInt(2, 9, rng);
      const c = randomInt(1, 10, rng);
      const xVal = randomInt(2, 5, rng);
      const ans = m * xVal + c;

      return {
        meta: createMockProvenance(SKILL_6_EE_EXPRESSIONS.id, difficulty),
        problem_content: {
          stem: `Evaluate the expression $${m}x + ${c}$ when $x = ${xVal}$.`,
          format: "latex",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(ans),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Substitute ${xVal} for x.`,
              math: `${m}(${xVal}) + ${c} = ${m * xVal} + ${c} = ${ans}`,
              answer: String(ans),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      const n = randomInt(2, 9, rng);

      return {
        meta: createMockProvenance(SKILL_6_EE_EXPRESSIONS.id, difficulty),
        problem_content: {
          stem: `Write an algebraic expression for: "**${n} more than x**" (Do not use spaces)`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "text",
          accepted_forms: [`x+${n}`, `${n}+x`],
        },
        solution_logic: {
          final_answer_canonical: `x+${n}`,
          final_answer_type: "numeric", // text
          steps: [
            {
              step_index: 1,
              explanation: `"More than" means addition.`,
              math: `x + ${n}`,
              answer: `x+${n}`,
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(ExpressionsGenerator);

// ----------------------------------------------------------------------
// 4. Equivalent Expressions (6.EE.A.3, 6.EE.A.4)
// ----------------------------------------------------------------------
export const SKILL_6_EE_EQUIV_EXPRESSIONS: Skill = {
  id: "6.ee.equiv_expressions",
  name: "Equivalent Expressions",
  gradeBand: "6-8",
  prereqs: ["6.ee.expressions"],
  misconceptions: ["distributive_error"],
  templates: ["T_EQUIV_EXP"],
  description:
    "Apply properties of operations to generate equivalent expressions",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const EquivExpressionsGenerator: Generator = {
  skillId: SKILL_6_EE_EQUIV_EXPRESSIONS.id,
  templateId: "T_EQUIV_EXP",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Distributive property: 3(x + 2) = ?
    const a = randomInt(2, 5, rng);
    const b = randomInt(1, 9, rng);

    const ans = `${a}x+${a * b}`;

    return {
      meta: createMockProvenance(SKILL_6_EE_EQUIV_EXPRESSIONS.id, difficulty),
      problem_content: {
        stem: `Use the distributive property to expand: $${a}(x + ${b})$ (Write standard form, no spaces, e.g. 2x+4)`,
        format: "text",
      },
      answer_spec: { answer_mode: "final_only", input_type: "text" },
      solution_logic: {
        final_answer_canonical: ans,
        final_answer_type: "numeric", // text
        steps: [
          {
            step_index: 1,
            explanation: `Multiply ${a} by both x and ${b}.`,
            math: `${a} \\times x + ${a} \\times ${b} = ${ans}`,
            answer: ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(EquivExpressionsGenerator);

// ----------------------------------------------------------------------
// 5. Inequalities (6.EE.B.8)
// ----------------------------------------------------------------------
export const SKILL_6_EE_INEQUALITIES: Skill = {
  id: "6.ee.inequalities",
  name: "Inequalities",
  gradeBand: "6-8",
  prereqs: ["6.ee.expressions"],
  misconceptions: ["inequality_direction"],
  templates: ["T_INEQUALITIES"],
  description: "Write inequalities of the form x > c or x < c",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const InequalitiesGenerator: Generator = {
  skillId: SKILL_6_EE_INEQUALITIES.id,
  templateId: "T_INEQUALITIES",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const val = randomInt(10, 90, rng);
    const isMax = (rng ?? Math.random)() < 0.5; // max vs min

    const stem = isMax
      ? `To ride a roller coaster, you must be at least ${val} inches tall. Let h be height. Write an inequality (e.g. h>10, h>=10).`
      : `The bridge has a weight limit of ${val} tons. Let w be weight. Write an inequality.`;

    const ans = isMax ? `h>=${val}` : `w<=${val}`;
    const accepted = isMax
      ? [`h>=${val}`, `h => ${val}`, `${val}<=h`]
      : [`w<=${val}`, `w =< ${val}`, `${val}>=w`];

    return {
      meta: createMockProvenance(SKILL_6_EE_INEQUALITIES.id, difficulty),
      problem_content: { stem, format: "text" },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "text",
        accepted_forms: accepted,
      },
      solution_logic: {
        final_answer_canonical: ans,
        final_answer_type: "numeric", // text
        steps: [
          {
            step_index: 1,
            explanation: isMax
              ? "At least means greater than or equal to."
              : "Limit means less than or equal to.",
            math: ans,
            answer: ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(InequalitiesGenerator);

// ----------------------------------------------------------------------
// 6. Variables (6.EE.C.9)
// ----------------------------------------------------------------------
export const SKILL_6_EE_VARIABLES: Skill = {
  id: "6.ee.variables",
  name: "Dependent and Independent Variables",
  gradeBand: "6-8",
  prereqs: ["6.ee.expressions"],
  misconceptions: ["dep_indep_confusion"],
  templates: ["T_VARIABLES"],
  description: "Identify dependent and independent variables",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const VariablesGenerator: Generator = {
  skillId: SKILL_6_EE_VARIABLES.id,
  templateId: "T_VARIABLES",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // "y = 2x. Which is dependent?"
    const indep = "x";
    const dep = "y";
    const eq = "y = 5x + 1";

    return {
      meta: createMockProvenance(SKILL_6_EE_VARIABLES.id, difficulty),
      problem_content: {
        stem: `In the equation $${eq}$, which variable is the **dependent** variable?`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "text" },
      solution_logic: {
        final_answer_canonical: dep,
        final_answer_type: "numeric", // text
        steps: [
          {
            step_index: 1,
            explanation: `y depends on the value of x.`,
            math: "",
            answer: dep,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(VariablesGenerator);
