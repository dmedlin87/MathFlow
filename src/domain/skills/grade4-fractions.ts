import type { Skill, Generator, MathProblemItem } from "../types";
import { engine } from "../generator/engine";
import { gcd } from "../math-utils";

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

// Helper to create mock provenance for V0 runtime generation
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
    verifier: {
      type: "numeric",
      passed: true,
    },
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

// --- 1. Equivalent Fractions ---

export const SKILL_EQUIV_FRACTIONS: Skill = {
  id: "frac_equiv_01",
  name: "Recognize equivalent fractions",
  gradeBand: "3-5",
  prereqs: [],
  misconceptions: ["add_num_add_den"],
  templates: ["T_EQUIV_FRACTION_FIND"],
  description:
    "Understand that fractions can look different but have the same value.",
  bktParams: {
    learningRate: 0.15,
    slip: 0.05,
    guess: 0.25,
  },
};

export const EquivFractionGenerator: Generator = {
  templateId: "T_EQUIV_FRACTION_FIND",
  skillId: SKILL_EQUIV_FRACTIONS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const baseNum = randomInt(1, 4, rng);
    const baseDen = randomInt(baseNum + 1, 6, rng); // Proper fraction

    let multiplier = 2;
    if (difficulty > 0.5) {
      multiplier = randomInt(3, 9, rng);
    } else {
      multiplier = randomInt(2, 4, rng);
    }

    const targetNum = baseNum * multiplier;
    const targetDen = baseDen * multiplier;

    // Calculate the wrong answer for the misconception trigger (additive scaling)
    const diff = targetDen - baseDen;
    const additiveWrongAnswer = baseNum + diff;

    return {
      meta: createMockProvenance(SKILL_EQUIV_FRACTIONS.id, difficulty),
      problem_content: {
        stem: `Find the missing number: **${baseNum}/${baseDen} = ?/${targetDen}**`,
        format: "mixed",
        variables: { baseNum, baseDen, multiplier, targetDen },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
        ui: {
          placeholder: "?",
        },
      },
      solution_logic: {
        final_answer_canonical: String(targetNum),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `First, find the multiplier. ${baseDen} times what number equals ${targetDen}?`,
            math: `${baseDen} \\times ? = ${targetDen}`,
            answer: String(multiplier),
          },
          {
            step_index: 2,
            explanation: `Now multiply the numerator by that same number (${multiplier}). What is ${baseNum} × ${multiplier}?`,
            math: `${baseNum} \\times ${multiplier} = ?`,
            answer: String(targetNum),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_additive",
          error_tag: "add_num_add_den",
          trigger: {
            kind: "exact_answer",
            value: String(additiveWrongAnswer),
          },
          hint_ladder: [
            "It looks like you added the difference correctly, but fractions work by multiplication!",
            "Did you think: 'since the bottom went up by X, the top goes up by X'? Try multiplying instead.",
          ],
        },
      ],
    };
  },
};

engine.register(EquivFractionGenerator);

// --- 2. Add Like Fractions ---

export const SKILL_ADD_LIKE_FRACTIONS: Skill = {
  id: "frac_add_like_01",
  name: "Add fractions with like denominators",
  gradeBand: "3-5",
  prereqs: ["frac_equiv_01"],
  misconceptions: ["add_denominators"],
  templates: ["T_ADD_LIKE_FRACTION"],
  description: "Add two fractions that share the same denominator.",
};

export const AddLikeFractionGenerator: Generator = {
  templateId: "T_ADD_LIKE_FRACTION",
  skillId: SKILL_ADD_LIKE_FRACTIONS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const maxDen = difficulty < 0.5 ? 12 : 20;
    const den = randomInt(3, maxDen, rng);
    const num1 = randomInt(1, den - 2, rng);
    const num2 = randomInt(1, den - num1, rng); // Ensure sum <= den
    const targetNum = num1 + num2;

    return {
      meta: createMockProvenance(SKILL_ADD_LIKE_FRACTIONS.id, difficulty),
      problem_content: {
        stem: `Add: **${num1}/${den} + ${num2}/${den} = ?/${den}**`,
        format: "mixed",
        variables: { num1, num2, den },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(targetNum),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `When adding fractions with the same denominator, what is the new denominator?`,
            math: `\\text{Keep } ${den}`,
            answer: String(den),
          },
          {
            step_index: 2,
            explanation: `Now add the numerators. What is ${num1} + ${num2}?`,
            math: `${num1} + ${num2} = ?`,
            answer: String(targetNum),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_add_den",
          error_tag: "add_denominators",
          trigger: {
            kind: "exact_answer",
            value: String(den + den), // Very specific trigger: user typed sum of denominators
          },
          hint_ladder: [
            "Check the denominator. Do we add the bottom numbers?",
            "When pieces are the same size, the size name (denominator) stays the same.",
          ],
        },
      ],
    };
  },
};

engine.register(AddLikeFractionGenerator);

// --- 3. Subtract Like Fractions ---

export const SKILL_SUB_LIKE_FRACTIONS: Skill = {
  id: "fractions_sub_like",
  name: "Subtract Fractions (Like Denominators)",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01"],
  misconceptions: ["sub_num_sub_den", "sub_num_add_den"],
  templates: ["T_SUB_LIKE_FRACTIONS"],
  description: "Subtract fractions with the same denominator.",
  bktParams: {
    learningRate: 0.2,
    slip: 0.05,
    guess: 0.1,
  },
};

export const SubLikeFractionGenerator: Generator = {
  skillId: SKILL_SUB_LIKE_FRACTIONS.id,
  templateId: "T_SUB_LIKE_FRACTIONS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const max = difficulty < 0.5 ? 10 : 20;
    const den = randomInt(3, max, rng);
    const targetNum = randomInt(1, den - 1, rng);
    const num2 = randomInt(1, den - targetNum, rng);
    const num1 = targetNum + num2;

    return {
      meta: createMockProvenance(SKILL_SUB_LIKE_FRACTIONS.id, difficulty),
      problem_content: {
        stem: `Subtract: \\(\\frac{${num1}}{${den}} - \\frac{${num2}}{${den}} = ?\\)`,
        format: "latex",
      },
      answer_spec: {
        // Note: user must type "2/5"
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${targetNum}/${den}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: "What represents the whole (the denominator)?",
            math: `${den}`,
            answer: String(den),
          },
          {
            step_index: 2,
            explanation: `Subtract the numerators: ${num1} - ${num2}`,
            math: `${num1} - ${num2} = ?`,
            answer: String(targetNum),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_sub_den",
          error_tag: "sub_num_sub_den",
          trigger: {
            kind: "regex",
            value: `^${targetNum}/0$`, // e.g. "3/0"
          },
          hint_ladder: [
            "You can't divide by zero! Did you subtract the bottom numbers?",
          ],
        },
        {
          id: "misc_add_den_sub",
          error_tag: "sub_num_add_den",
          trigger: {
            kind: "regex",
            value: `^${targetNum}/${den + den}$`,
          },
          hint_ladder: ["Don't add the denominators when subtracting."],
        },
      ],
    };
  },
};

engine.register(SubLikeFractionGenerator);

// --- 4. Simplify Fractions ---

export const SKILL_SIMPLIFY_FRACTIONS: Skill = {
  id: "fractions_simplify",
  name: "Simplify Fractions",
  gradeBand: "3-5",
  prereqs: ["frac_equiv_01"],
  misconceptions: ["divide_only_top", "divide_diff_nums"],
  templates: ["T_SIMPLIFY_FRACTION"],
  description: "Reduce fractions to their simplest form.",
  bktParams: {
    learningRate: 0.1,
    slip: 0.1,
    guess: 0.1,
  },
};

export const SimplifyFractionGenerator: Generator = {
  skillId: SKILL_SIMPLIFY_FRACTIONS.id,
  templateId: "T_SIMPLIFY_FRACTION",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const maxBase = difficulty < 0.5 ? 5 : 10;
    const numBase = randomInt(1, maxBase, rng);
    const denBase = randomInt(numBase + 1, maxBase + 5, rng);
    const common = gcd(numBase, denBase);
    const simpleNum = numBase / common;
    const simpleDen = denBase / common;

    const multiplier = randomInt(2, difficulty < 0.5 ? 4 : 8, rng);
    const questionNum = simpleNum * multiplier;
    const questionDen = simpleDen * multiplier;

    return {
      meta: createMockProvenance(SKILL_SIMPLIFY_FRACTIONS.id, difficulty),
      problem_content: {
        stem: `Simplify \\(\\frac{${questionNum}}{${questionDen}}\\) to its lowest terms.`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${simpleNum}/${simpleDen}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Find the number that divides both ${questionNum} and ${questionDen}.`,
            math: `${questionNum} \\div ? = ${simpleNum}`,
            answer: String(multiplier),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_no_simp",
          error_tag: "no_simplify",
          trigger: {
            kind: "exact_answer",
            value: `${questionNum}/${questionDen}`,
          },
          hint_ladder: [
            "That is the same fraction. Try to find a number that divides both top and bottom.",
          ],
        },
      ],
    };
  },
};

engine.register(SimplifyFractionGenerator);

// --- 5. Multiply Fraction by Whole Number (4.NF.B.4) ---

export const SKILL_FRAC_MULT_WHOLE: Skill = {
  id: "frac_mult_whole",
  name: "Multiply Fractions by Whole Numbers",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01"],
  misconceptions: ["mult_den_too", "add_to_num"],
  templates: ["T_FRAC_MULT_WHOLE"],
  description:
    "Multiply a fraction by a whole number, understanding it as repeated addition.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const FracMultWholeGenerator: Generator = {
  templateId: "T_FRAC_MULT_WHOLE",
  skillId: SKILL_FRAC_MULT_WHOLE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Form: W * (Num/Den)
    const whole = randomInt(2, 6, rng);
    const den = randomInt(3, 10, rng);
    const num = randomInt(1, den - 1, rng);

    // Result
    const finalNum = whole * num;
    const finalDen = den;

    // Misconception: Multiply denominator too
    // e.g. 3 * 2/5 -> 6/15
    const miscMultDenNum = whole * num;
    const miscMultDenDen = whole * den;

    return {
      meta: createMockProvenance(SKILL_FRAC_MULT_WHOLE.id, difficulty),
      problem_content: {
        stem: `Multiply: **${whole} \\times \\frac{${num}}{${den}}**`,
        format: "latex",
        variables: { whole, num, den },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction", // User inputs improper fraction or mixed
        // We typically accept improper fractions like 6/5.
      },
      solution_logic: {
        final_answer_canonical: `${finalNum}/${finalDen}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Think of ${whole} \\times \\frac{${num}}{${den}} as adding \\frac{${num}}{${den}} together ${whole} times.`,
            math: `\\frac{${num}}{${den}} + ... = \\frac{${whole} \\times ${num}}{${den}}`,
            answer: `${finalNum}/${finalDen}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_mult_den",
          error_tag: "mult_den_too",
          trigger: {
            kind: "exact_answer",
            value: `${miscMultDenNum}/${miscMultDenDen}`,
          },
          hint_ladder: [
            "Did you multiply the bottom number too?",
            `Remember, the denominator (size of pieces) stays the same. You just have ${whole} times as many pieces.`,
          ],
        },
      ],
    };
  },
};

engine.register(FracMultWholeGenerator);

// --- 6. Compare Unlike Fractions (4.NF.A.2) ---

export const SKILL_FRAC_COMPARE_UNLIKE: Skill = {
  id: "frac_compare_unlike",
  name: "Compare Fractions (Unlike Denominators)",
  gradeBand: "3-5",
  prereqs: ["frac_equiv_01"],
  misconceptions: ["gap_reasoning", "compare_den_only"],
  templates: ["T_COMPARE_UNLIKE"],
  description:
    "Compare two fractions with different numerators and different denominators.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.25 },
};

export const FracCompareUnlikeGenerator: Generator = {
  templateId: "T_COMPARE_UNLIKE",
  skillId: SKILL_FRAC_COMPARE_UNLIKE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Generate two unlike fractions
    // Strategy: Pick two simple fractions, ensure they are not equal (for now, or allow equal)
    // Harder: Close values

    const den1 = randomInt(3, 8, rng);
    const num1 = randomInt(1, den1 - 1, rng);
    let den2 = randomInt(3, 8, rng);

    // Ensure den2 != den1 for "Unlike" skill
    while (den1 === den2) {
      den2 = randomInt(3, 10, rng);
    }
    const num2 = randomInt(1, den2 - 1, rng);

    const val1 = num1 / den1;
    const val2 = num2 / den2;

    let symbol = "=";
    if (val1 > val2) symbol = ">";
    if (val1 < val2) symbol = "<";

    return {
      meta: createMockProvenance(SKILL_FRAC_COMPARE_UNLIKE.id, difficulty),
      problem_content: {
        stem: `Compare the fractions:
\\(\\frac{${num1}}{${den1}}\\) and \\(\\frac{${num2}}{${den2}}\\).

Choose <, >, or =.`,
        format: "latex",
        variables: { num1, den1, num2, den2 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "multiple_choice",
        ui: {
          choices: ["<", ">", "="],
        },
      },
      solution_logic: {
        final_answer_canonical: symbol,
        final_answer_type: "multiple_choice",
        steps: [
          {
            step_index: 1,
            explanation: `Find a common denominator or compare to a benchmark (like 1/2).`,
            math: `${num1}/${den1} ${symbol} ${num2}/${den2}`,
            answer: symbol,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_denom_reverse",
          error_tag: "compare_den_only",
          // This triggers if they think bigger denominator = bigger number (when nums are same or expected logic fails)
          // Hard to detect in Multiple Choice without more specific distractors or reasoning capture.
          // We'll leave the trigger generic or manual for now.
          trigger: { kind: "predicate", value: "false" },
          hint_ladder: ["Remember, a larger denominator means smaller pieces."],
        },
      ],
    };
  },
};

engine.register(FracCompareUnlikeGenerator);

// --- 7. Add Tenths and Hundredths (4.NF.C.5) ---

export const SKILL_ADD_TENTHS_HUNDREDTHS: Skill = {
  id: "frac_add_tenths_hundredths",
  name: "Add Tenths and Hundredths",
  gradeBand: "3-5",
  prereqs: ["frac_equiv_01", "frac_add_like_01"],
  misconceptions: ["add_num_add_den"],
  templates: ["T_ADD_TENTHS_HUNDREDTHS"],
  description:
    "Express a fraction with denominator 10 as an equivalent fraction with denominator 100, and use this technique to add two fractions with respective denominators 10 and 100.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const AddTenthsHundredthsGenerator: Generator = {
  templateId: "T_ADD_TENTHS_HUNDREDTHS",
  skillId: SKILL_ADD_TENTHS_HUNDREDTHS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Problem type: A/10 + B/100 = ?
    // Ensure sum <= 100/100 or allow > 1? Standard usually starts < 1.
    // Let's keep sum <= 100/100 for lower difficulty.

    const num10 = randomInt(1, 9, rng); // e.g. 3/10
    const num100 = randomInt(1, 50, rng); // e.g. 42/100

    // To make it interesting, sometimes put 100 first?
    const order = (rng ?? Math.random)() > 0.5; // True = 10 first

    // True calculation
    // num10/10 = (num10 * 10)/100
    // Total num = num10*10 + num100
    const correctNum = num10 * 10 + num100;
    const correctDen = 100;

    // Misconception: Add tops and bottoms
    // (num10 + num100) / (10 + 100) = (num10+num100)/110
    // Or just (num10+num100)/100 without converting?
    // "3/10 + 4/100 = 7/100" -> very common error
    const wrongNumNoConvert = num10 + num100;

    const term1 = order ? `\\frac{${num10}}{10}` : `\\frac{${num100}}{100}`;
    const term2 = order ? `\\frac{${num100}}{100}` : `\\frac{${num10}}{10}`;

    return {
      meta: createMockProvenance(SKILL_ADD_TENTHS_HUNDREDTHS.id, difficulty),
      problem_content: {
        stem: `Add: $$${term1} + ${term2} = ?$$`,
        format: "latex",
        variables: { num10, num100 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction",
      },
      solution_logic: {
        final_answer_canonical: `${correctNum}/${correctDen}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Convert \\(\\frac{${num10}}{10}\\) to hundredths. Multiply top and bottom by 10.`,
            math: `\\frac{${num10} \\times 10}{10 \\times 10} = \\frac{${
              num10 * 10
            }}{100}`,
            answer: `${num10 * 10}/100`,
          },
          {
            step_index: 2,
            explanation: `Now add the numerators: ${num10 * 10} + ${num100}.`,
            math: `\\frac{${
              num10 * 10
            }}{100} + \\frac{${num100}}{100} = \\frac{${correctNum}}{100}`,
            answer: `${correctNum}/${correctDen}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_no_convert",
          error_tag: "add_num_add_den", // reusing generic tag or specific?
          // Specific tag might be "failed_to_convert_tenths"
          trigger: {
            kind: "exact_answer",
            value: `${wrongNumNoConvert}/100`,
          },
          hint_ladder: [
            "Did you convert tenths to hundredths first?",
            `Remember, \\(\\frac{${num10}}{10} = \\frac{${
              num10 * 10
            }}{100}\\).`,
          ],
        },
      ],
    };
  },
};

engine.register(AddTenthsHundredthsGenerator);

// --- 8. Decompose Fractions (4.NF.B.5) ---

export const SKILL_FRAC_DECOMPOSE: Skill = {
  id: "frac_decompose",
  name: "Decompose Fractions",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01"],
  misconceptions: ["sum_equals_product"],
  templates: ["T_FRAC_DECOMPOSE"],
  description:
    "Decompose a fraction into a sum of fractions with the same denominator in more than one way.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const FracDecomposeGenerator: Generator = {
  templateId: "T_FRAC_DECOMPOSE",
  skillId: SKILL_FRAC_DECOMPOSE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Concept: 5/8 = 2/8 + ?/8 OR 5/8 = 1/8 + 1/8 + ...
    // Difficulty:
    // < 0.5: Missing one part (5/8 = 2/8 + ?)
    // >= 0.5: Decompose into sum of unit fractions (3/4 = 1/4 + 1/4 + 1/4) - Text input?
    // Let's stick to "Find the missing part" for easier verification for now.

    const den = randomInt(3, 12, rng);
    const num = randomInt(2, den, rng); // At least 2 to allow decomposition

    // Split num into two parts
    const part1 = randomInt(1, num - 1, rng);
    const part2 = num - part1;

    return {
      meta: createMockProvenance(SKILL_FRAC_DECOMPOSE.id, difficulty),
      problem_content: {
        stem: `Find the missing numerator to complete the decomposition:
$$
\\frac{${num}}{${den}} = \\frac{${part1}}{${den}} + \\frac{?}{${den}}
$$`,
        format: "latex",
        variables: { num, den, part1 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(part2),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `The denominators are the same, so the specific parts must add up to the total numerator.`,
            math: `${part1} + ? = ${num}`,
            answer: String(part2),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_sum_prod",
          error_tag: "sum_equals_product",
          trigger: { kind: "exact_answer", value: String(part1 * num) }, // Placeholder logic
          hint_ladder: [
            "We are adding parts to make the whole, not multiplying.",
          ],
        },
      ],
    };
  },
};

engine.register(FracDecomposeGenerator);

// --- 9. Add/Subtract Mixed Numbers (4.NF.B.6) ---

export const SKILL_ADD_SUB_MIXED: Skill = {
  id: "frac_add_sub_mixed",
  name: "Add/Subtract Mixed Numbers",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01", "fractions_sub_like"],
  misconceptions: ["add_whole_only", "subtract_reversed"],
  templates: ["T_ADD_SUB_MIXED"],
  description: "Add and subtract mixed numbers with like denominators.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const AddSubMixedGenerator: Generator = {
  templateId: "T_ADD_SUB_MIXED",
  skillId: SKILL_ADD_SUB_MIXED.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const isAddition = (rng ?? Math.random)() > 0.5;
    const den = randomInt(3, 12, rng);

    // Initial check to keep it simple (no carrying/borrowing for low difficulty)
    const simple = difficulty < 0.5;

    let w1 = randomInt(1, 5, rng);
    let num1 = randomInt(1, den - 1, rng);
    let w2 = randomInt(1, 4, rng);
    let num2 = randomInt(1, den - 1, rng);

    // For subtraction, ensure Term 1 > Term 2
    if (!isAddition) {
      // Rough value comparison
      const v1 = w1 + num1 / den;
      const v2 = w2 + num2 / den;
      if (v1 < v2) {
        // Swap
        [w1, w2] = [w2, w1];
        [num1, num2] = [num2, num1];
      }
      // If equal, bump w1
      if (w1 === w2 && num1 === num2) {
        w1++;
      }
      // Ensure num1 >= num2 for simple subtraction
      if (simple && num1 < num2) {
        // Adjust to avoid borrowing
        num1 = num2 + 1;
      }
    } else {
      // Addition
      // Simple: sum of fractions < 1
      if (simple && num1 + num2 >= den) {
        // Reduce logic
        num2 = den - num1 - 1;
        if (num2 < 1) {
          num1 = 1;
          num2 = 1;
        }
      }
    }

    // Calculation
    // Variables used for calculation logic below directly use den/resImpNum
    // targetNum/targetDen were unused placeholders.

    // Calculate accurate result as improper fraction
    const impNum1 = w1 * den + num1;
    const impNum2 = w2 * den + num2;

    let resImpNum = 0;
    if (isAddition) resImpNum = impNum1 + impNum2;
    else resImpNum = impNum1 - impNum2;

    const op = isAddition ? "+" : "-";

    return {
      meta: createMockProvenance(SKILL_ADD_SUB_MIXED.id, difficulty),
      problem_content: {
        stem: `Compute:
$$
${w1}\\frac{${num1}}{${den}} ${op} ${w2}\\frac{${num2}}{${den}} = ?
$$`,
        format: "latex",
        variables: { w1, num1, w2, num2, den, op },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction", // User can enter improper e.g. 15/4
      },
      solution_logic: {
        final_answer_canonical: `${resImpNum}/${den}`,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Convert mixed numbers to improper fractions or operate on wholes and parts separately.`,
            math: `${w1}\\frac{${num1}}{${den}} ${op} ${w2}\\frac{${num2}}{${den}} = \\frac{${resImpNum}}{${den}}`,
            answer: `${resImpNum}/${den}`,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(AddSubMixedGenerator);
