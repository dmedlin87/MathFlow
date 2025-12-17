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

// Helper for GCF
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// ----------------------------------------------------------------------
// 1. Division of Fractions (6.NS.A.1)
// ----------------------------------------------------------------------

export const SKILL_6_NS_DIV_FRACTIONS: Skill = {
  id: "6.ns.div_fractions",
  name: "Divide Fractions",
  gradeBand: "6-8",
  prereqs: ["5.nf.frac_div"],
  misconceptions: ["invert_dividend", "multiply_instead"],
  templates: ["T_DIV_FRACTIONS"],
  description: "Interpret and compute quotients of fractions",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const DivFractionsGenerator: Generator = {
  skillId: SKILL_6_NS_DIV_FRACTIONS.id,
  templateId: "T_DIV_FRACTIONS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // a/b / c/d
    const b = randomInt(2, 8, rng);
    const d = randomInt(2, 8, rng);
    const a = randomInt(1, b - 1, rng);
    const c = randomInt(1, d - 1, rng);

    // Result numerator = a*d, denominator = b*c
    let resNum = a * d;
    let resDenom = b * c;
    const common = gcd(resNum, resDenom);
    resNum /= common;
    resDenom /= common;

    const canonical = resDenom === 1 ? String(resNum) : `${resNum}/${resDenom}`;

    return {
      meta: createMockProvenance(SKILL_6_NS_DIV_FRACTIONS.id, difficulty),
      problem_content: {
        stem: `Calculate: $ \\frac{${a}}{${b}} \\div \\frac{${c}}{${d}} = ? $`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "fraction", // User can input "num/denom"
      },
      solution_logic: {
        final_answer_canonical: canonical,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Multiply by the reciprocal of the second fraction.`,
            math: `\\frac{${a}}{${b}} \\times \\frac{${d}}{${c}} = \\frac{${
              a * d
            }}{${b * c}}`,
            answer: `${a * d}/${b * c}`,
          },
          {
            step_index: 2,
            explanation: `Simplify if possible.`,
            math: `${canonical}`,
            answer: canonical,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_inv_div",
          error_tag: "invert_dividend",
          trigger: {
            kind: "exact_answer",
            value: `${(b * c) / gcd(b * c, a * d)}/${
              (a * d) / gcd(b * c, a * d)
            }`,
          }, // Reciprocal of answer
          hint_ladder: [
            "Did you flip the first fraction? Only flip the second one.",
          ],
        },
      ],
    };
  },
};

engine.register(DivFractionsGenerator);

// ----------------------------------------------------------------------
// 2. Multi-Digit Division (6.NS.B.2)
// ----------------------------------------------------------------------

export const SKILL_6_NS_MULTI_DIGIT_DIV: Skill = {
  id: "6.ns.multi_digit_div",
  name: "Multi-Digit Long Division",
  gradeBand: "6-8",
  prereqs: ["5.nbt.div_whole"],
  misconceptions: ["remainder_notation"],
  templates: ["T_LONG_DIV_6"],
  description:
    "Fluently divide multi-digit numbers using the standard algorithm",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const MultiDigitDivGenerator: Generator = {
  skillId: SKILL_6_NS_MULTI_DIGIT_DIV.id,
  templateId: "T_LONG_DIV_6",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // 5-digit by 2-digit or similar, larger than grade 5
    const divisor = randomInt(12, 99, rng);
    const quotient = randomInt(100, 999, rng);
    const dividend = divisor * quotient;

    return {
      meta: createMockProvenance(SKILL_6_NS_MULTI_DIGIT_DIV.id, difficulty),
      problem_content: {
        stem: `Divide: $ ${dividend} \\div ${divisor} = ? $`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(quotient),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Divide ${dividend} by ${divisor}.`,
            math: `${dividend} \\div ${divisor} = ${quotient}`,
            answer: String(quotient),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(MultiDigitDivGenerator);

// Helper for robust rounding
const robustRound = (n: number, scale: number) => {
  return Math.round((n + Number.EPSILON) * scale) / scale;
};

// ----------------------------------------------------------------------
// 3. Decimal Operations (6.NS.B.3)
// ----------------------------------------------------------------------

export const SKILL_6_NS_DECIMAL_OPS: Skill = {
  id: "6.ns.decimal_ops",
  name: "Decimal Operations",
  gradeBand: "6-8",
  prereqs: [
    "5.nbt.add_sub_decimals",
    "5.nbt.mult_decimals",
    "5.nbt.div_decimals",
  ],
  misconceptions: ["decimal_placement"],
  templates: ["T_DECIMAL_OPS_6"],
  description:
    "Fluently add, subtract, multiply, and divide multi-digit decimals",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const DecimalOpsGenerator: Generator = {
  skillId: SKILL_6_NS_DECIMAL_OPS.id,
  templateId: "T_DECIMAL_OPS_6",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Operations: 0: Add, 1: Sub, 2: Mult, 3: Div
    const op = randomInt(0, 3, rng);
    const a = randomInt(10, 500, rng) / 100; // e.g., 0.10 to 5.00
    const b = randomInt(10, 500, rng) / 100;

    let stem = "";
    let ans = 0;
    let explanation = "";
    let math = "";

    if (op === 0) {
      ans = robustRound(a + b, 100);
      stem = `Calculate: $${a} + ${b} = ?$`;
      explanation = "Line up the decimal points and add.";
      math = `${a} + ${b} = ${ans}`;
    } else if (op === 1) {
      // Ensure a > b
      const high = Math.max(a, b);
      const low = Math.min(a, b);
      ans = robustRound(high - low, 100);
      stem = `Calculate: $${high} - ${low} = ?$`;
      explanation = "Line up the decimal points and subtract.";
      math = `${high} - ${low} = ${ans}`;
    } else if (op === 2) {
      // Multiply: keep numbers smaller for sanity
      const f1 = randomInt(2, 20, rng) / 10; // 0.2 to 2.0
      const f2 = randomInt(2, 20, rng) / 10;
      ans = robustRound(f1 * f2, 100);
      stem = `Calculate: $${f1} \\times ${f2} = ?$`;
      explanation =
        "Multiply as with whole numbers, then place the decimal point.";
      math = `${f1} \\times ${f2} = ${ans}`;
    } else {
      // Division: clean result
      const quotient = randomInt(2, 20, rng) / 10;
      const divisor = randomInt(2, 10, rng); // Integer divisor for ease usually, or simple decimal
      // Let's stick to integer divisor or simple decimal divisor
      const divType = (rng ?? Math.random)() < 0.5 ? "int" : "dec";
      const finalDivisor = divType === "int" ? divisor : divisor / 10;
      const dividend = robustRound(quotient * finalDivisor, 100);
      ans = quotient;
      stem = `Calculate: $${dividend} \\div ${finalDivisor} = ?$`;
      explanation =
        "Move decimal point in divisor to make it a whole number, move decimal in dividend same amount, then divide.";
      math = `${dividend} \\div ${finalDivisor} = ${ans}`;
    }

    return {
      meta: createMockProvenance(SKILL_6_NS_DECIMAL_OPS.id, difficulty),
      problem_content: { stem, format: "latex" },
      answer_spec: { answer_mode: "final_only", input_type: "decimal" },
      solution_logic: {
        final_answer_canonical: String(ans),
        final_answer_type: "numeric",
        steps: [{ step_index: 1, explanation, math, answer: String(ans) }],
      },
      misconceptions: [],
    };
  },
};

engine.register(DecimalOpsGenerator);

// ----------------------------------------------------------------------
// 4. GCF & LCM (6.NS.B.4)
// ----------------------------------------------------------------------

export const SKILL_6_NS_GCF_LCM: Skill = {
  id: "6.ns.gcf_lcm",
  name: "GCF and LCM",
  gradeBand: "6-8",
  prereqs: ["oa_factors_multiples"],
  misconceptions: ["confuse_gcf_lcm"],
  templates: ["T_GCF_LCM"],
  description: "Find greatest common factor and least common multiple",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

function lcm(a: number, b: number) {
  return (a * b) / gcd(a, b);
}

export const GcfLcmGenerator: Generator = {
  skillId: SKILL_6_NS_GCF_LCM.id,
  templateId: "T_GCF_LCM",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const type = (rng ?? Math.random)() < 0.5 ? "GCF" : "LCM";
    const a = randomInt(4, 24, rng);
    const b = randomInt(4, 24, rng);

    // Ensure they aren't the same
    const finalB = a === b ? b + 1 : b;

    if (type === "GCF") {
      const val = gcd(a, finalB);
      return {
        meta: createMockProvenance(SKILL_6_NS_GCF_LCM.id, difficulty),
        problem_content: {
          stem: `Find the Greatest Common Factor (GCF) of ${a} and ${finalB}.`,
          format: "text",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(val),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `List factors or use prime factorization.`,
              math: `\\text{GCF}(${a}, ${finalB}) = ${val}`,
              answer: String(val),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      const val = lcm(a, finalB);
      return {
        meta: createMockProvenance(SKILL_6_NS_GCF_LCM.id, difficulty),
        problem_content: {
          stem: `Find the Least Common Multiple (LCM) of ${a} and ${finalB}.`,
          format: "text",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(val),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `List multiples.`,
              math: `\\text{LCM}(${a}, ${finalB}) = ${val}`,
              answer: String(val),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(GcfLcmGenerator);

// ----------------------------------------------------------------------
// 5. Integers (6.NS.C.5, 6.NS.C.6)
// ----------------------------------------------------------------------

export const SKILL_6_NS_INTEGERS: Skill = {
  id: "6.ns.integers",
  name: "Integers & Opposites",
  gradeBand: "6-8",
  prereqs: [],
  misconceptions: ["sign_error"],
  templates: ["T_INTEGERS_INTRO"],
  description: "Understand positive and negative numbers, opposites",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const IntegersGenerator: Generator = {
  skillId: SKILL_6_NS_INTEGERS.id,
  templateId: "T_INTEGERS_INTRO",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type 0: Opposite of X
    // Type 1: Context (gain/loss/temp)
    const type = (rng ?? Math.random)() < 0.5 ? 0 : 1;

    if (type === 0) {
      const val = randomInt(-20, 20, rng);
      if (val === 0) return IntegersGenerator.generate(difficulty, rng); // recursive retry
      const ans = -val;
      return {
        meta: createMockProvenance(SKILL_6_NS_INTEGERS.id, difficulty),
        problem_content: {
          stem: `What is the opposite of ${val}?`,
          format: "text",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(ans),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `The opposite of a number has the same magnitude but opposite sign.`,
              math: `-${val} = ${ans}`,
              answer: String(ans),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      const val = randomInt(1, 20, rng);
      const context = (rng ?? Math.random)() < 0.5 ? "below zero" : "loss";
      let text = "";
      let ans = 0;
      if (context === "below zero") {
        text = `The temperature is ${val} degrees below zero. Write this as an integer.`;
        ans = -val;
      } else {
        text = `A football team lost ${val} yards. Write this change as an integer.`;
        ans = -val;
      }
      return {
        meta: createMockProvenance(SKILL_6_NS_INTEGERS.id, difficulty),
        problem_content: { stem: text, format: "text" },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(ans),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Below zero or loss indicates a negative value.`,
              math: String(ans),
              answer: String(ans),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(IntegersGenerator);

// ----------------------------------------------------------------------
// 6. Rational Numbers (6.NS.C.6, 6.NS.C.7)
// ----------------------------------------------------------------------

export const SKILL_6_NS_RATIONAL_NUMBER_LINE: Skill = {
  id: "6.ns.rational_line",
  name: "Rational Numbers Number Line",
  gradeBand: "6-8",
  prereqs: ["6.ns.integers"],
  misconceptions: ["order_of_negatives"],
  templates: ["T_RATIONAL_LINE"],
  description: "Locate and compare rational numbers on a number line",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const RationalNumberLineGenerator: Generator = {
  skillId: SKILL_6_NS_RATIONAL_NUMBER_LINE.id,
  templateId: "T_RATIONAL_LINE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Compare two numbers: which is greater?
    // "Which is greater: -0.5 or -1.5?"
    const a = randomInt(-20, 20, rng) / 2; // .5s
    const b = randomInt(-20, 20, rng) / 2;
    if (a === b) return RationalNumberLineGenerator.generate(difficulty, rng); // retry

    const ans = Math.max(a, b);

    return {
      meta: createMockProvenance(
        SKILL_6_NS_RATIONAL_NUMBER_LINE.id,
        difficulty
      ),
      problem_content: {
        stem: `Which number is greater: $${a}$ or $${b}$?`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "decimal" },
      solution_logic: {
        final_answer_canonical: String(ans),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `On a number line, numbers to the right are greater.`,
            math: `${ans} > ${Math.min(a, b)}`,
            answer: String(ans),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(RationalNumberLineGenerator);

// ----------------------------------------------------------------------
// 7. Coordinate Plane (6.NS.C.8)
// ----------------------------------------------------------------------

export const SKILL_6_NS_COORD_PLANE: Skill = {
  id: "6.ns.coord_plane",
  name: "Coordinate Plane",
  gradeBand: "6-8",
  prereqs: ["6.ns.integers"],
  misconceptions: ["xy_confusion"],
  templates: ["T_COORD_PLANE"],
  description: "Graph points in all four quadrants",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const CoordPlaneGenerator: Generator = {
  skillId: SKILL_6_NS_COORD_PLANE.id,
  templateId: "T_COORD_PLANE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // "In which quadrant is the point (x, y) located?"
    const x = randomInt(-10, 10, rng);
    const y = randomInt(-10, 10, rng);
    if (x === 0 || y === 0)
      return CoordPlaneGenerator.generate(difficulty, rng); // avoid axes for simplicity in quadrant question

    let quad = "";
    if (x > 0 && y > 0) quad = "I";
    else if (x < 0 && y > 0) quad = "II";
    else if (x < 0 && y < 0) quad = "III";
    else quad = "IV";

    return {
      meta: createMockProvenance(SKILL_6_NS_COORD_PLANE.id, difficulty),
      problem_content: {
        stem: `In which quadrant is the point $(${x}, ${y})$ located? (Enter I, II, III, or IV)`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "text" },
      solution_logic: {
        final_answer_canonical: quad,
        final_answer_type: "numeric", // text
        steps: [
          {
            step_index: 1,
            explanation: `x is ${x > 0 ? "positive" : "negative"} and y is ${
              y > 0 ? "positive" : "negative"
            }.`,
            math: "",
            answer: quad,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(CoordPlaneGenerator);
