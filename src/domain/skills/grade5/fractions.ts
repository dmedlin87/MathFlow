import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";
import { gcd } from "../../math-utils";
import { randomInt, createProblemMeta } from "../../math-utils";

// Helper to create mock provenance

// Helper for LCM
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

// ----------------------------------------------------------------------
// 1. Add/Subtract Unlike Fractions (5.NF.A.1)
// ----------------------------------------------------------------------

export const SKILL_5_NF_ADD_SUB_UNLIKE: Skill = {
  id: "5.nf.add_sub_unlike",
  name: "Add/Subtract Unlike Fractions",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01", "frac_equiv_01"],
  misconceptions: ["add_num_add_den", "sub_num_sub_den"],
  templates: ["T_ADD_SUB_UNLIKE"],
  description: "Add and subtract fractions with unlike denominators",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const AddSubUnlikeGenerator: Generator = {
  skillId: SKILL_5_NF_ADD_SUB_UNLIKE.id,
  templateId: "T_ADD_SUB_UNLIKE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const isAddition = (rng ?? Math.random)() < 0.6;

    // Generate unlike denominators
    // Diff < 0.5: One den is multiple of other (e.g. 3, 6)
    // Diff >= 0.5: Neither is multiple (e.g. 3, 4)

    const d1 = randomInt(2, 6, rng);
    let d2: number;

    if (difficulty < 0.5) {
      const mult = randomInt(2, 3, rng);
      d2 = d1 * mult;
    } else {
      d2 = randomInt(2, 8, rng);
      while (d1 === d2 || d2 % d1 === 0 || d1 % d2 === 0) {
        d2 = randomInt(2, 9, rng);
      }
    }

    const n1 = randomInt(1, d1 - 1, rng);
    const n2 = randomInt(1, d2 - 1, rng);

    // For subtraction, ensure result > 0
    let num1 = n1;
    let den1 = d1;
    let num2 = n2;
    let den2 = d2;

    if (!isAddition) {
      if (n1 / d1 < n2 / d2) {
        // Swap
        [num1, den1, num2, den2] = [n2, d2, n1, d1];
      }
    }

    const commonDen = lcm(den1, den2);
    // Convert
    const convN1 = num1 * (commonDen / den1);
    const convN2 = num2 * (commonDen / den2);

    const resultNum = isAddition ? convN1 + convN2 : convN1 - convN2;
    const resultDen = commonDen;

    // Simplify result?
    const commonFactor = gcd(resultNum, resultDen);
    const finalNum = resultNum / commonFactor;
    const finalDen = resultDen / commonFactor;

    const op = isAddition ? "+" : "-";
    const opText = isAddition ? "Add" : "Subtract";

    // Misconception: Add tops and bottoms
    const wrongNum = isAddition ? num1 + num2 : Math.abs(num1 - num2);
    const wrongDen = isAddition ? den1 + den2 : Math.abs(den1 - den2); // often 0 if subtraction den same (not here)

    return {
      meta: createProblemMeta(SKILL_5_NF_ADD_SUB_UNLIKE.id, difficulty),
      problem_content: {
        stem: `${opText}: $$\\frac{${num1}}{${den1}} ${op} \\frac{${num2}}{${den2}} = ?$$`,
        format: "latex",
        variables: { num1, den1, num2, den2 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${finalNum}/${finalDen}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Find a common denominator for ${den1} and ${den2}. The LCM is ${commonDen}.`,
            math: `\\text{LCM} = ${commonDen}`,
            answer: String(commonDen),
          },
          {
            step_index: 2,
            explanation: `Convert fractions: $\\frac{${num1}}{${den1}} = \\frac{${convN1}}{${commonDen}}$ and $\\frac{${num2}}{${den2}} = \\frac{${convN2}}{${commonDen}}$.`,
            math: `\\frac{${convN1}}{${commonDen}} ${op} \\frac{${convN2}}{${commonDen}}`,
            answer: `${convN1}/${commonDen}, ${convN2}/${commonDen}`,
          },
          {
            step_index: 3,
            explanation: `${opText} the numerators.`,
            math: `\\frac{${resultNum}}{${resultDen}}`,
            answer: `${resultNum}/${resultDen}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_add_den",
          error_tag: "add_num_add_den",
          trigger: { kind: "exact_answer", value: `${wrongNum}/${wrongDen}` },
          hint_ladder: [
            "You cannot just add the numerators and denominators. Find a common denominator first.",
          ],
        },
      ],
    };
  },
};

engine.register(AddSubUnlikeGenerator);

// ----------------------------------------------------------------------
// 2. Fractions as Division (5.NF.B.3)
// ----------------------------------------------------------------------

export const SKILL_5_NF_FRAC_DIV: Skill = {
  id: "5.nf.frac_div",
  name: "Fractions as Division",
  gradeBand: "3-5",
  prereqs: ["nbt_div_remainders"],
  misconceptions: ["order_confusion"],
  templates: ["T_FRAC_DIV"],
  description:
    "Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b)",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.1 },
};

export const FracDivGenerator: Generator = {
  skillId: SKILL_5_NF_FRAC_DIV.id,
  templateId: "T_FRAC_DIV",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // 3 divided by 4 = 3/4
    const num = randomInt(1, 10, rng);
    const den = randomInt(2, 12, rng);

    // Sometimes a > b (improper)

    return {
      meta: createProblemMeta(SKILL_5_NF_FRAC_DIV.id, difficulty),
      problem_content: {
        stem: `Write the division expression as a fraction:
$$${num} \\div ${den} = ?$$`,
        format: "latex",
        variables: { num, den },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${num}/${den}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `The first number (dividend) becomes the numerator. The second number (divisor) becomes the denominator.`,
            math: `${num} \\div ${den} = \\frac{${num}}{${den}}`,
            answer: `${num}/${den}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_reverse",
          error_tag: "order_confusion",
          trigger: { kind: "exact_answer", value: `${den}/${num}` },
          hint_ladder: [
            "Remember: Numerator ÷ Denominator. The first number goes on top.",
          ],
        },
      ],
    };
  },
};

engine.register(FracDivGenerator);

// ----------------------------------------------------------------------
// 3. Multiplication as Scaling (5.NF.B.5)
// ----------------------------------------------------------------------

export const SKILL_5_NF_SCALING: Skill = {
  id: "5.nf.scaling",
  name: "Multiplication as Scaling",
  gradeBand: "3-5",
  prereqs: ["5.nbt.mult_whole"],
  misconceptions: ["mult_always_bigger"],
  templates: ["T_SCALING"],
  description: "Understand multiplication as scaling (resizing)",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.25 },
};

export const ScalingGenerator: Generator = {
  skillId: SKILL_5_NF_SCALING.id,
  templateId: "T_SCALING",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Compare product to factor without calculating
    // "5 x 3/4 is [Less than/Greater than/Equal to] 5?"

    const factor = randomInt(2, 10, rng);
    const num = randomInt(1, 10, rng);
    const den = randomInt(2, 10, rng);
    if (num === den) return ScalingGenerator.generate(difficulty, rng); // retry

    const isLess = num < den;
    const fractionStr = `\\frac{${num}}{${den}}`;

    const expected = isLess ? "<" : ">";

    return {
      meta: createProblemMeta(SKILL_5_NF_SCALING.id, difficulty),
      problem_content: {
        stem: `Without calculating, choose the correct symbol:
$$${factor} \\times ${fractionStr} \\text{ ? } ${factor}$$`,
        format: "latex",
        variables: { factor, num, den },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "multiple_choice",
        ui: { choices: ["<", ">", "="] },
      },
      solution_logic: {
        final_answer_canonical: expected,
        final_answer_type: "multiple_choice",
        steps: [
          {
            step_index: 1,
            explanation: `You are multiplying ${factor} by a number ${
              isLess ? "less" : "greater"
            } than 1.`,
            math: `\\text{Since } \\frac{${num}}{${den}} ${expected} 1, \\text{ the product is } ${expected} ${factor}.`,
            answer: expected,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_bigger",
          error_tag: "mult_always_bigger",
          trigger: { kind: "predicate", value: "false" },
          hint_ladder: [
            "Multiplication doesn't always make things bigger. If you multiply by something less than 1, it gets smaller.",
          ],
        },
      ],
    };
  },
};

engine.register(ScalingGenerator);

// ----------------------------------------------------------------------
// 4. Multiplying Fractions (5.NF.B.4)
// ----------------------------------------------------------------------

export const SKILL_5_NF_MULT_FRAC: Skill = {
  id: "5.nf.mult_frac",
  name: "Multiplying Fractions",
  gradeBand: "3-5",
  prereqs: ["5.nf.scaling"],
  misconceptions: ["cross_multiply_add"],
  templates: ["T_MULT_FRAC"],
  description: "Multiply a fraction by a fraction",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const MultFracGenerator: Generator = {
  skillId: SKILL_5_NF_MULT_FRAC.id,
  templateId: "T_MULT_FRAC",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const num1 = randomInt(1, 5, rng);
    const den1 = randomInt(num1 + 1, 8, rng);
    const num2 = randomInt(1, 5, rng);
    const den2 = randomInt(num2 + 1, 8, rng);

    const resNum = num1 * num2;
    const resDen = den1 * den2;

    // Simplify? 5th grade standard often accepts unsimplified, but good habit.
    // Let's ask for unsimplified or simplified. System usually canonizes both?
    // We will provide simplified as canonical.
    const common = gcd(resNum, resDen);
    const simNum = resNum / common;
    const simDen = resDen / common;

    return {
      meta: createProblemMeta(SKILL_5_NF_MULT_FRAC.id, difficulty),
      problem_content: {
        stem: `Multiply: $$\\frac{${num1}}{${den1}} \\times \\frac{${num2}}{${den2}} = ?$$`,
        format: "latex",
        variables: { num1, den1, num2, den2 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${simNum}/${simDen}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Multiply the numerators and multiply the denominators.`,
            math: `\\frac{${num1} \\times ${num2}}{${den1} \\times ${den2}} = \\frac{${resNum}}{${resDen}}`,
            answer: `${resNum}/${resDen}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_cross",
          error_tag: "cross_multiply_add",
          trigger: {
            kind: "exact_answer",
            value: `${num1 * den2 + num2 * den1}/${den1 * den2}`,
          }, // cross mult add like addition?
          hint_ladder: [
            "For multiplication, you just multiply straight across.",
          ],
        },
      ],
    };
  },
};

engine.register(MultFracGenerator);

// ----------------------------------------------------------------------
// 5. Dividing Fractions (5.NF.B.7)
// ----------------------------------------------------------------------

export const SKILL_5_NF_DIV_FRAC: Skill = {
  id: "5.nf.div_frac",
  name: "Dividing Fractions",
  gradeBand: "3-5",
  prereqs: ["5.nf.mult_frac"],
  misconceptions: ["divide_denominators", "flip_wrong_one"],
  templates: ["T_DIV_FRAC"],
  description:
    "Divide unit fractions by whole numbers and whole numbers by unit fractions",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const DivFracGenerator: Generator = {
  skillId: SKILL_5_NF_DIV_FRAC.id,
  templateId: "T_DIV_FRAC",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Case 1: Unit Frac / Whole
    // Case 2: Whole / Unit Frac
    const isCase1 = (rng ?? Math.random)() < 0.5;

    if (isCase1) {
      // 1/3 ÷ 4
      const den = randomInt(2, 8, rng);
      const whole = randomInt(2, 6, rng);
      // Answer: 1 / (3*4) = 1/12
      const ansDen = den * whole;

      return {
        meta: createProblemMeta(SKILL_5_NF_DIV_FRAC.id, difficulty),
        problem_content: {
          stem: `Divide: $$\\frac{1}{${den}} \\div ${whole} = ?$$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: `1/${ansDen}`,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Dividing a unit fraction by ${whole} means each part gets ${whole} times smaller (denominator gets ${whole} times bigger).`,
              math: `\\frac{1}{${den} \\times ${whole}} = \\frac{1}{${ansDen}}`,
              answer: `1/${ansDen}`,
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      // 4 ÷ 1/3
      const whole = randomInt(2, 6, rng);
      const den = randomInt(2, 8, rng);
      // Answer: 4 * 3 = 12
      const ans = whole * den;

      return {
        meta: createProblemMeta(SKILL_5_NF_DIV_FRAC.id, difficulty),
        problem_content: {
          stem: `Divide: $$${whole} \\div \\frac{1}{${den}} = ?$$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(ans),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `How many 1/${den}s are in ${whole}? Multiply ${whole} by ${den}.`,
              math: `${whole} \\times ${den} = ${ans}`,
              answer: String(ans),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(DivFracGenerator);

// ----------------------------------------------------------------------
// 6. Fraction Word Problems (5.NF.A.2 / 5.NF.B.6 / 5.NF.B.7)
// ----------------------------------------------------------------------

export const SKILL_5_NF_WORD_PROBLEMS: Skill = {
  id: "5.nf.word_problems",
  name: "Fraction Word Problems",
  gradeBand: "3-5",
  prereqs: ["5.nf.mult_frac", "5.nf.div_frac", "5.nf.add_sub_unlike"],
  misconceptions: ["wrong_op_word"],
  templates: ["T_FRAC_WORD"],
  description:
    "Solve word problems involving addition, subtraction, multiplication, and division of fractions.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const FractionWordProblemsGenerator: Generator = {
  skillId: SKILL_5_NF_WORD_PROBLEMS.id,
  templateId: "T_FRAC_WORD",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Types:
    // 0: Add/Sub (Unlike denominators) - 5.NF.A.2
    // 1: Mult (Recipe scaling / Area) - 5.NF.B.6
    // 2: Div (Sharing) - 5.NF.B.7

    const type = randomInt(0, 2, rng);

    if (type === 0) {
      // Add/Sub Word Problem
      const isAddition = (rng ?? Math.random)() < 0.6;

      let d1 = randomInt(2, 6, rng);
      let d2 = randomInt(2, 6, rng);
      // Ensure unlike
      while (d1 === d2) d2 = randomInt(2, 6, rng);

      const n1 = 1; // Simplify to unit fractions or simple proper for word problems
      const n2 = 1;

      // Context: "Alice ran 1/d1 miles. Bob ran 1/d2 miles. How far total? Or How much farther?"
      const commonDen = lcm(d1, d2);
      const convN1 = n1 * (commonDen / d1);
      const convN2 = n2 * (commonDen / d2);

      let resNum;
      const resDen = commonDen;
      let opText;

      if (isAddition) {
        resNum = convN1 + convN2;
        opText = "How many miles did they run in total?";
      } else {
        // Ensure positive subtraction
        const val1 = n1 / d1;
        const val2 = n2 / d2;
        if (val1 < val2) [d1, d2] = [d2, d1]; // Swap denominators to make first fraction larger? No, 1/3 > 1/4. So smaller den is larger val.
        // If d1 > d2, then 1/d1 < 1/d2.
        // We want 1/d1 - 1/d2 > 0. So d1 < d2.
        if (d1 > d2) {
          [d1, d2] = [d2, d1];
          // Recalc conv
        }
        const c1 = n1 * (commonDen / d1);
        const c2 = n2 * (commonDen / d2);
        resNum = c1 - c2;
        opText = "How much farther did the first person run?";
      }

      const common = gcd(resNum, resDen);
      const finalNum = resNum / common;
      const finalDen = resDen / common;

      return {
        meta: createProblemMeta(SKILL_5_NF_WORD_PROBLEMS.id, difficulty),
        problem_content: {
          stem: `Alice ran **1/${d1}** mile. Bob ran **1/${d2}** mile.
${opText}`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: `${finalNum}/${finalDen}`,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Find a common denominator (${resDen}) and ${
                isAddition ? "add" : "subtract"
              }.`,
              math: `\\frac{1}{${d1}} ${
                isAddition ? "+" : "-"
              } \\frac{1}{${d2}} = \\frac{${finalNum}}{${finalDen}}`,
              answer: `${finalNum}/${finalDen}`,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_add_den",
            error_tag: "add_num_add_den",
            trigger: {
              kind: "exact_answer",
              value: isAddition ? `2/${d1 + d2}` : `0`,
            },
            hint_ladder: [
              "Don't just add/subtract the numbers. Find a common denominator.",
            ],
          },
        ],
      };
    } else if (type === 1) {
      // Recipe or "Part of a Part"
      const num1 = randomInt(1, 3, rng);
      const den1 = randomInt(4, 5, rng); // e.g. 3/4

      const num2 = 1;
      const den2 = 2; // e.g. 1/2

      const resNum = num1 * num2;
      const resDen = den1 * den2;

      return {
        meta: createProblemMeta(SKILL_5_NF_WORD_PROBLEMS.id, difficulty),
        problem_content: {
          stem: `A recipe calls for **${num1}/${den1}** cup of sugar.
You want to make **${num2}/${den2}** of the recipe.
How much sugar should you use?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: `${resNum}/${resDen}`,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Multiply the amount needed by the fraction of the recipe you are making.`,
              math: `\\frac{${num1}}{${den1}} \\times \\frac{${num2}}{${den2}} = \\frac{${resNum}}{${resDen}}`,
              answer: `${resNum}/${resDen}`,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_add",
            error_tag: "wrong_op_word",
            trigger: { kind: "predicate", value: "false" },
            hint_ladder: [
              "'Of' usually means multiply. You are finding a part of a part.",
            ],
          },
        ],
      };
    } else {
      // Division
      // Type A: Share unit fraction (1/b div c)
      // Type B: How many small parts in whole (c div 1/b)

      const typeA = (rng ?? Math.random)() < 0.5;

      if (typeA) {
        // 1/3 gallon shared by 4 friends
        const den = randomInt(2, 5, rng);
        const friends = randomInt(2, 6, rng);
        const ansDen = den * friends;

        return {
          meta: createProblemMeta(SKILL_5_NF_WORD_PROBLEMS.id, difficulty),
          problem_content: {
            stem: `You have **1/${den}** gallon of juice.
You share it equally among **${friends}** friends.
How much juice does each friend get?`,
            format: "text",
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "fraction",
          },
          solution_logic: {
            final_answer_canonical: `1/${ansDen}`,
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `Divide the amount of juice by the number of friends.`,
                math: `\\frac{1}{${den}} \\div ${friends} = \\frac{1}{${ansDen}}`,
                answer: `1/${ansDen}`,
              },
            ],
          },
          misconceptions: [],
        };
      } else {
        // 4 lbs of raisins, put in 1/3 lb bags
        const whole = randomInt(2, 6, rng);
        const den = randomInt(2, 5, rng);
        const ans = whole * den;

        return {
          meta: createProblemMeta(SKILL_5_NF_WORD_PROBLEMS.id, difficulty),
          problem_content: {
            stem: `You have **${whole}** pounds of raisins.
You put them into bags that each hold **1/${den}** pound.
How many bags can you fill?`,
            format: "text",
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "integer",
          },
          solution_logic: {
            final_answer_canonical: String(ans),
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `Divide the total weight by the weight per bag.`,
                math: `${whole} \\div \\frac{1}{${den}} = ${ans}`,
                answer: String(ans),
              },
            ],
          },
          misconceptions: [],
        };
      }
    }
  },
};

engine.register(FractionWordProblemsGenerator);
