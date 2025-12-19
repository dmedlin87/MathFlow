import type { Skill, Generator, MathProblemItem } from "../../types";
import { randomInt, createProblemMeta } from "../../math-utils";

// Mock provenance helper

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
      meta: createProblemMeta(SKILL_6_EE_EXPONENTS.id, difficulty),
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
      b = randomInt(2, 10, rng);
      // Need x to be divisible by a
      const realX = b * a;
      stem = `Solve for x: $ \\frac{x}{${a}} = ${b} $`;
      return {
        meta: createProblemMeta(SKILL_6_EE_ONE_STEP_EQ.id, difficulty),
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
      meta: createProblemMeta(SKILL_6_EE_ONE_STEP_EQ.id, difficulty),
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
        meta: createProblemMeta(SKILL_6_EE_EXPRESSIONS.id, difficulty),
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
      const subType = Math.floor((rng ?? Math.random)() * 4);
      let stem = "";
      let forms: string[] = [];
      let logic = "";

      if (subType === 0) {
        stem = `Write an algebraic expression for: "**${n} more than x**"`;
        forms = [`x+${n}`, `${n}+x`];
        logic = `x + ${n}`;
      } else if (subType === 1) {
        stem = `Write an algebraic expression for: "**${n} less than x**"`;
        forms = [`x-${n}`];
        logic = `x - ${n}`;
      } else if (subType === 2) {
        stem = `Write an algebraic expression for: "**the product of ${n} and x**"`;
        forms = [`${n}x`, `${n}*x`, `x*${n}`];
        logic = `${n}x`;
      } else {
        stem = `Write an algebraic expression for: "**the quotient of x and ${n}**"`;
        forms = [`x/${n}`, `\\frac{x}{${n}}`];
        logic = `\\frac{x}{${n}}`;
      }

      return {
        meta: createProblemMeta(SKILL_6_EE_EXPRESSIONS.id, difficulty),
        problem_content: {
          stem: `${stem} (Do not use spaces)`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "text",
          accepted_forms: forms,
        },
        solution_logic: {
          final_answer_canonical: forms[0],
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation:
                "Translate the words into a mathematical expression.",
              math: logic,
              answer: forms[0],
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

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
      meta: createProblemMeta(SKILL_6_EE_EQUIV_EXPRESSIONS.id, difficulty),
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
    const type = Math.floor((rng ?? Math.random)() * 4);

    let stem = "";
    let ans = "";
    let accepted: string[] = [];
    let explanation = "";

    if (type === 0) {
      // at least: h >= val
      stem = `To ride a roller coaster, you must be at least ${val} inches tall. Let h be height. Write an inequality.`;
      ans = `h>=${val}`;
      accepted = [`h>=${val}`, `h => ${val}`, `${val}<=h`];
      explanation = "At least means greater than or equal to.";
    } else if (type === 1) {
      // limit: w <= val
      stem = `The bridge has a weight limit of ${val} tons. Let w be weight. Write an inequality.`;
      ans = `w<=${val}`;
      accepted = [`w<=${val}`, `w =< ${val}`, `${val}>=w`];
      explanation = "Limit means less than or equal to.";
    } else if (type === 2) {
      // more than: p > val
      stem = `A pizza party requires more than ${val} slices. Let s be slices. Write an inequality.`;
      ans = `s>${val}`;
      accepted = [`s>${val}`, `${val}<s`];
      explanation = "More than means strictly greater than.";
    } else {
      // less than: t < val
      stem = `The temperature must be less than ${val} degrees. Let t be temperature. Write an inequality.`;
      ans = `t<${val}`;
      accepted = [`t<${val}`, `${val}>t`];
      explanation = "Less than means strictly less than.";
    }

    return {
      meta: createProblemMeta(SKILL_6_EE_INEQUALITIES.id, difficulty),
      problem_content: { stem, format: "text" },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "text",
        accepted_forms: accepted,
      },
      solution_logic: {
        final_answer_canonical: ans,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation,
            math: ans,
            answer: ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

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
    const vars = ["x", "y", "z", "a", "b", "p", "q"];
    const v1Idx = Math.floor((rng ?? Math.random)() * vars.length);
    const v2Idx = (v1Idx + 1) % vars.length;

    const v1 = vars[v1Idx]; // independent usually
    const v2 = vars[v2Idx]; // dependent usually

    const eqType = Math.floor((rng ?? Math.random)() * 2);
    let eq = "";
    let dep = "";

    if (eqType === 0) {
      const m = randomInt(2, 9, rng);
      const c = randomInt(1, 10, rng);
      eq = `${v2} = ${m}${v1} + ${c}`;
      dep = v2;
    } else {
      const r = randomInt(2, 5, rng);
      eq = `${v1} = \\frac{${v2}}{${r}}`;
      dep = v1;
    }

    return {
      meta: createProblemMeta(SKILL_6_EE_VARIABLES.id, difficulty),
      problem_content: {
        stem: `In the equation $${eq}$, which variable is the **dependent** variable?`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "text" },
      solution_logic: {
        final_answer_canonical: dep,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `${dep} depends on the value of the other variable.`,
            math: "",
            answer: dep,
          },
        ],
      },
      misconceptions: [],
    };
  },
};
