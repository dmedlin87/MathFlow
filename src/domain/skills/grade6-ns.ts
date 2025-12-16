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
            math: `\\frac{${a}}{${b}} \\times \\frac{${d}}{${c}} = \\frac{${a * d}}{${b * c}}`,
            answer: `${a * d}/${b * c}`,
          },
          {
            step_index: 2,
            explanation: `Simplify if possible.`,
            math: `${canonical}`,
            answer: canonical,
          }
        ]
      },
      misconceptions: [
        {
          id: "misc_inv_div",
          error_tag: "invert_dividend",
          trigger: { kind: "exact_answer", value: `${(b*c)/gcd(b*c, a*d)}/${(a*d)/gcd(b*c, a*d)}` }, // Reciprocal of answer
          hint_ladder: ["Did you flip the first fraction? Only flip the second one."],
        }
      ],
    };
  }
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
  description: "Fluently divide multi-digit numbers using the standard algorithm",
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
          }
        ]
      },
      misconceptions: [],
    };
  }
};

engine.register(MultiDigitDivGenerator);
