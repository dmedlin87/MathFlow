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
// 1. Order of Operations (5.OA.A.1 / 5.OA.A.2)
// ----------------------------------------------------------------------

export const SKILL_5_OA_ORDER_OPS: Skill = {
  id: "5.oa.order_ops",
  name: "Order of Operations & Expressions",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_whole", "nbt_div_whole"],
  misconceptions: [
    "left_to_right_add_first",
    "parentheses_ignore",
    "expression_order",
  ],
  templates: ["T_ORDER_OPS"],
  description:
    "Use parentheses, brackets, or braces in numerical expressions, evaluate expressions with these symbols, and write simple expressions.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.05 },
};

export const OrderOpsGenerator: Generator = {
  skillId: SKILL_5_OA_ORDER_OPS.id,
  templateId: "T_ORDER_OPS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Mode 0: Evaluate Expression (5.OA.A.1)
    // Mode 1: Write Expression (5.OA.A.2)

    const mode = (rng ?? Math.random)() < 0.7 ? "EVAL" : "WRITE";

    if (mode === "EVAL") {
      // Evaluate expression: e.g. 3 + 4 x 5 vs (3 + 4) x 5
      const templates = [
        {
          t: (a: number, b: number, c: number) => `${a} + ${b} \\times ${c}`,
          eval: (a: number, b: number, c: number) => a + b * c,
        },
        {
          t: (a: number, b: number, c: number) => `(${a} + ${b}) \\times ${c}`,
          eval: (a: number, b: number, c: number) => (a + b) * c,
        },
        {
          t: (a: number, b: number, c: number) => `${a} \\times (${b} + ${c})`,
          eval: (a: number, b: number, c: number) => a * (b + c),
        },
        {
          t: (a: number, b: number, c: number) => `${a} \\times ${b} - ${c}`,
          eval: (a: number, b: number, c: number) => a * b - c,
        }, // ensure result > 0
      ];

      const tIdx = randomInt(0, templates.length - 1, rng);
      const a = randomInt(2, 9, rng);
      const b = randomInt(2, 9, rng);
      const c = randomInt(2, 9, rng);

      let expr = templates[tIdx].t(a, b, c);
      let val = templates[tIdx].eval(a, b, c);

      // Ensure positive for last template
      if (val < 0) {
        // Redo with larger A
        const a2 = a + 10;
        expr = templates[tIdx].t(a2, b, c);
        val = templates[tIdx].eval(a2, b, c);
      }

      // Misconception: Left to Right strictly
      let wrongVal = 0;
      if (tIdx === 0) wrongVal = (a + b) * c;

      return {
        meta: createMockProvenance(SKILL_5_OA_ORDER_OPS.id, difficulty),
        problem_content: {
          stem: `Evaluate the expression:
$$${expr} = ?$$`,
          format: "latex",
          variables: { a, b, c },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(val),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Follow Order of Operations: Parentheses first, then Multiplication/Division, then Addition/Subtraction.`,
              math: `${expr} = ${val}`,
              answer: String(val),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_l2r",
            error_tag: "left_to_right_add_first",
            trigger: { kind: "exact_answer", value: String(wrongVal) },
            hint_ladder: [
              "Did you add before multiplying? Remember order of operations: Multiply before Add.",
            ],
          },
        ],
      };
    } else {
      // Write Expression (Multiple Choice for robustness in V1)
      // e.g. "Add 8 and 7, then multiply by 2" -> (8 + 7) * 2

      const a = randomInt(2, 9, rng);
      const b = randomInt(2, 9, rng);
      const c = randomInt(2, 9, rng);

      // Phrases
      // 0: (A + B) * C
      // 1: A + (B * C)

      const isGroupFirst = (rng ?? Math.random)() < 0.5;

      let stem = "";
      let correctExpr = "";
      let distractorExpr = "";

      if (isGroupFirst) {
        stem = `Add **${a}** and **${b}**, then multiply by **${c}**.`;
        correctExpr = `(${a} + ${b}) \\times ${c}`;
        distractorExpr = `${a} + ${b} \\times ${c}`;
      } else {
        stem = `Multiply **${b}** by **${c}**, then add **${a}**.`;
        correctExpr = `${a} + ${b} \\times ${c}`;
        distractorExpr = `(${a} + ${b}) \\times ${c}`;
      }

      return {
        meta: createMockProvenance(SKILL_5_OA_ORDER_OPS.id, difficulty),
        problem_content: {
          stem: `Choose the expression that matches the description:
"${stem}"`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          ui: {
            choices: [correctExpr, distractorExpr].sort(
              () => (rng ?? Math.random)() - 0.5
            ),
          }, // Simple shuffle
        },
        solution_logic: {
          final_answer_canonical: correctExpr,
          final_answer_type: "multiple_choice",
          steps: [
            {
              step_index: 1,
              explanation: `The phrase "${
                isGroupFirst ? "Add ... then" : "Multiply ... then"
              }" tells you which operation happens first. Use parentheses if addition needs to happen before multiplication.`,
              math: `\\text{Expression: } ${correctExpr}`,
              answer: correctExpr,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_order",
            error_tag: "expression_order",
            trigger: { kind: "exact_answer", value: distractorExpr },
            hint_ladder: [
              "Think about which operation must happen first. Use parentheses to group the first part.",
            ],
          },
        ],
      };
    }
  },
};

engine.register(OrderOpsGenerator);

// ----------------------------------------------------------------------
// 2. Numerical Patterns (5.OA.B.3)
// ----------------------------------------------------------------------

export const SKILL_5_OA_PATTERNS: Skill = {
  id: "5.oa.patterns",
  name: "Numerical Patterns and Relationships",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_whole"],
  misconceptions: ["swapped_rule"],
  templates: ["T_PATTERNS"],
  description:
    "Generate two numerical patterns using two given rules. Identify apparent relationships between corresponding terms.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const PatternsGenerator: Generator = {
  skillId: SKILL_5_OA_PATTERNS.id,
  templateId: "T_PATTERNS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Rule 1: Add A (start at 0)
    // Rule 2: Add B (start at 0)
    // B is usually a multiple of A (e.g. Add 3, Add 6)

    const ruleA = randomInt(2, 5, rng);
    const mult = randomInt(2, 3, rng);
    const ruleB = ruleA * mult;

    // Generate sequence
    // Term 0: 0, 0
    // Term 1: A, B
    // Term 2: 2A, 2B
    // Term 3: 3A, 3B

    const termIdx = randomInt(3, 5, rng);
    const valA = ruleA * termIdx;
    const valB = ruleB * termIdx;

    // Question: "Rule 1 is Add A. Rule 2 is Add B. If term X in pattern 1 is ValA, what is term X in pattern 2?"
    // Or "What is the relationship?"

    return {
      meta: createMockProvenance(SKILL_5_OA_PATTERNS.id, difficulty),
      problem_content: {
        stem: `Two patterns start at 0.
Rule 1: Add **${ruleA}**.
Rule 2: Add **${ruleB}**.

Complete the table for the ${termIdx}th term (after 0).
Pattern 1: ${valA}
Pattern 2: ?`,
        format: "text",
        variables: { ruleA, ruleB, termIdx },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(valB),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Compare the rules. Rule 2 (${ruleB}) is ${mult} times Rule 1 (${ruleA}). So the terms in Pattern 2 are ${mult} times the terms in Pattern 1.`,
            math: `${valA} \\times ${mult} = ${valB}`,
            answer: String(valB),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(PatternsGenerator);
