import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

// Helper to calculate factors
const getFactors = (n: number): number[] => {
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) factors.push(n / i);
    }
  }
  return factors.sort((a, b) => a - b);
};

// Mock provenance helper (duplicated for isolation)
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

// --- 1. Factors & Multiples (4.OA.B.4) ---

export const SKILL_FACTORS_MULTIPLES: Skill = {
  id: "oa_factors_multiples",
  name: "Factors, Multiples, and Primes",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_1digit"],
  misconceptions: ["confuse_factors_multiples", "prime_is_odd"],
  templates: ["T_FACTORS"],
  description:
    "Find all factor pairs for a whole number in the range 1-100. Recognize that a whole number is a multiple of each of its factors. Determine whether a whole number is prime or composite.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const FactorsMultiplesGenerator: Generator = {
  templateId: "T_FACTORS",
  skillId: SKILL_FACTORS_MULTIPLES.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Difficulty:
    // <0.3: Small composite numbers (factors)
    // <0.6: Primes vs Composite check
    // >=0.6: Larger numbers or Multiples questions

    const mode = (rng ?? Math.random)();

    if (difficulty < 0.3 || mode < 0.33) {
      // Mode A: Find factors of X
      // Target distinct composite numbers to avoid trivial 1,X
      const candidates = [6, 8, 10, 12, 14, 15, 16, 18, 20, 24, 30, 36, 40];
      const number = candidates[randomInt(0, candidates.length - 1, rng)];
      const factors = getFactors(number);

      return {
        meta: createMockProvenance(SKILL_FACTORS_MULTIPLES.id, difficulty),
        problem_content: {
          stem: `List all factors of **${number}**.
Enter them separated by commas (e.g. 1, 2, 4).`,
          format: "text",
          variables: { number },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "set", // ideal: set of numbers
        },
        solution_logic: {
          final_answer_canonical: factors.join(", "),
          final_answer_type: "set",
          steps: [
            {
              step_index: 1,
              explanation: `Find pairs of numbers that multiply to ${number}.`,
              math: factors
                .map(
                  (f) => f + (number / f >= f ? ` \\times ${number / f}` : "")
                )
                .filter((s) => s.includes("times"))
                .join(", "),
              answer: factors.join(", "),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_multiples_mixup",
            error_tag: "confuse_factors_multiples",
            trigger: { kind: "regex", value: `${number * 2}.*` }, // If they start listing multiples
            hint_ladder: [
              `Factors are numbers that divide ${number} evenly. Multiples are ${number} times something.`,
            ],
          },
        ],
      };
    } else if (difficulty < 0.6 || mode < 0.66) {
      // Mode B: Prime or Composite?
      // Mix of primes and composites
      const isPrimeTarget = (rng ?? Math.random)() > 0.5;
      let number = 0;
      if (isPrimeTarget) {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
        number = primes[randomInt(0, primes.length - 1, rng)];
      } else {
        const composites = [4, 6, 8, 9, 10, 12, 14, 15, 21, 25, 27];
        number = composites[randomInt(0, composites.length - 1, rng)];
      }

      const ans = isPrimeTarget ? "Prime" : "Composite";

      return {
        meta: createMockProvenance(SKILL_FACTORS_MULTIPLES.id, difficulty),
        problem_content: {
          stem: `Is the number **${number}** Prime or Composite?`,
          format: "text",
          variables: { number },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          ui: {
            choices: ["Prime", "Composite"],
          },
        },
        solution_logic: {
          final_answer_canonical: ans,
          final_answer_type: "multiple_choice",
          steps: [
            {
              step_index: 1,
              explanation: `Check if ${number} has any factors other than 1 and itself.`,
              math: isPrimeTarget
                ? `${number} has distinct factors: 1, ${number}.`
                : `It has factors: ${getFactors(number).join(", ")}`,
              answer: ans,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_prime_odd",
            error_tag: "prime_is_odd",
            trigger: { kind: "exact_answer", value: "Prime" }, // If they say Prime for 9, 15 etc
            hint_ladder: [
              "Not all odd numbers are prime.",
              `Can you divide ${number} by 3 or 5?`,
            ],
          },
        ],
      };
    } else {
      // Mode C: Multiples
      const base = randomInt(2, 9, rng);
      const targetIndex = randomInt(3, 8, rng); // e.g. 4th multiple
      const answer = base * targetIndex;

      return {
        meta: createMockProvenance(SKILL_FACTORS_MULTIPLES.id, difficulty),
        problem_content: {
          stem: `What is the ${targetIndex}th multiple of **${base}**?`,
          format: "text",
          variables: { base, index: targetIndex },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(answer),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Multiply ${base} by ${targetIndex}.`,
              math: `${base} \\times ${targetIndex} = ${answer}`,
              answer: String(answer),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(FactorsMultiplesGenerator);

// --- 2. Patterns (4.OA.C.5) ---

export const SKILL_PATTERNS: Skill = {
  id: "oa_patterns",
  name: "Generate and Analyze Patterns",
  gradeBand: "3-5",
  prereqs: ["nbt_add_sub_multi"],
  misconceptions: ["wrong_operation_rule", "off_by_one_index"],
  templates: ["T_PATTERNS"],
  description:
    "Generate a number or shape pattern that follows a given rule. Identify apparent features of the pattern that were not explicit in the rule itself.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const PatternGenerator: Generator = {
  templateId: "T_PATTERNS",
  skillId: SKILL_PATTERNS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Simple numeric patterns for now.
    // Rule types:
    // 1. Add N (e.g. +3)
    // 2. Subtract N (e.g. -5)
    // 3. Multiply N (e.g. x2) - strictly speaking 4.OA.C.5 is often additive, but geometric is good for G4 enrichment or G5 prep.
    // Common Core 4.OA.C.5 examples are usually "Start at 1 and create a pattern that adds 3".

    const ruleType = (rng ?? Math.random)() > 0.4 ? "ADD" : "SUBTRACT";

    let start = 0;
    let step = 0;

    if (ruleType === "ADD") {
      start = randomInt(1, 10, rng);
      step = randomInt(2, 9, rng);
    } else {
      start = randomInt(50, 100, rng);
      step = randomInt(2, 9, rng);
    }

    const sequence: number[] = [];
    let current = start;
    for (let i = 0; i < 6; i++) {
      sequence.push(current);
      if (ruleType === "ADD") current += step;
      else current -= step;
    }

    // Task: Find the next number OR Find the rule?
    // Let's ask for the next number in the sequence.
    const nextVal = current;
    const visibleSeq = sequence.join(", ");

    // Distractor: Wrong operation (e.g. added instead of sub) or arithmetic error

    return {
      meta: createMockProvenance(SKILL_PATTERNS.id, difficulty),
      problem_content: {
        stem: `Observe the pattern:
**${visibleSeq}, ...**

What is the next number in the sequence?`,
        format: "text",
        variables: { start, step, rule: ruleType },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(nextVal),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Identify the rule. The numbers are ${
              ruleType === "ADD" ? "increasing" : "decreasing"
            }.`,
            math: `\\text{Rule: } ${ruleType === "ADD" ? "+" : "-"}${step}`,
            answer: `${ruleType} ${step}`,
          },
          {
            step_index: 2,
            explanation: `Apply the rule to the last number (${
              sequence[sequence.length - 1]
            }).`,
            math: `${sequence[sequence.length - 1]} ${
              ruleType === "ADD" ? "+" : "-"
            } ${step} = ${nextVal}`,
            answer: String(nextVal),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(PatternGenerator);

// --- 3. Multiplicative Comparison (4.OA.A.1, 4.OA.A.2) ---

export const SKILL_MULT_COMPARE: Skill = {
  id: "oa_mult_compare",
  name: "Multiplicative Comparisons",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_1digit"],
  misconceptions: ["additive_comparison"], // interpreting "times as many" as "more than"
  templates: ["T_MULT_COMPARE"],
  description:
    "Interpret a multiplication equation as a comparison, e.g. interpret 35 = 5 x 7 as a statement that 35 is 5 times as many as 7.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const MultCompareGenerator: Generator = {
  templateId: "T_MULT_COMPARE",
  skillId: SKILL_MULT_COMPARE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Structure: "A blue hat costs $X. A red hat costs N times as much as the blue hat. How much does the red hat cost?"
    // OR "X is N times as many as Y."

    // const items = [
    //   { small: "a rubber band", big: "a coil" },
    //   { small: "a marble", big: "a baseball" },
    //   { small: "Alice", big: "Bob" }, // generic names for "Alice has X apples, Bob has..."
    // ];

    // const choice = items[randomInt(0, items.length - 1, rng)];

    const factor = randomInt(2, 9, rng);
    const baseVal = randomInt(3, 12, rng);
    const largeVal = baseVal * factor;

    // Misconception: Additive. Answer = base + factor? or base + base?
    const additiveError = baseVal + factor;

    return {
      meta: createMockProvenance(SKILL_MULT_COMPARE.id, difficulty),
      problem_content: {
        stem: `Alice has **${baseVal}** marbles.
Bob has **${factor} times as many** marbles as Alice.
How many marbles does Bob have?`, // hardcoded context for now for simplicity
        format: "text",
        variables: { baseVal, factor },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(largeVal),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Multiply Alice's amount by ${factor}.`,
            math: `${baseVal} \\times ${factor} = ${largeVal}`,
            answer: String(largeVal),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_additive",
          error_tag: "additive_comparison",
          trigger: { kind: "exact_answer", value: String(additiveError) },
          hint_ladder: [`"Times as many" means multiplication, not addition.`],
        },
      ],
    };
  },
};

engine.register(MultCompareGenerator);

// --- 4. Multi-Step Word Problems (4.OA.A.3) ---

export const SKILL_MULTI_STEP_WORD_PROBLEMS: Skill = {
  id: "oa_multi_step_word",
  name: "Multi-Step Word Problems",
  gradeBand: "3-5",
  prereqs: ["nbt_add_sub_multi", "nbt_mult_1digit", "nbt_div_remainders"],
  misconceptions: [
    "wrong_order_operations",
    "ignore_remainder",
    "wrong_remainder_handling",
  ],
  templates: ["T_MULTI_STEP_WORD"],
  description:
    "Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const MultiStepWordGen: Generator = {
  templateId: "T_MULTI_STEP_WORD",
  skillId: SKILL_MULTI_STEP_WORD_PROBLEMS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Mode:
    // A) Two-step arithmetic (Add/Sub + Mult/Div)
    // B) Remainder interpretation (Ceil/Floor cases)

    const mode = (rng ?? Math.random)() > 0.5 ? "ARITHMETIC" : "REMAINDER";

    if (mode === "ARITHMETIC") {
      // Example: Alice had X, bought Y more packs of Z. How many total?
      // Or: Alice had X, gave Y to friend, split rest among Z bags.

      const start = randomInt(20, 100, rng);
      const subtract = randomInt(5, 15, rng);
      const divisor = randomInt(3, 8, rng);

      // Construct so it divides evenly
      // (start - subtract) must be divisible by divisor
      const adjustedStart =
        Math.floor((start - subtract) / divisor) * divisor + subtract;
      const finalAns = (adjustedStart - subtract) / divisor;

      // Misconception: Ignore subtraction (start / divisor)? or Add subtraction?
      // (adjustedStart + subtract) / divisor ?

      return {
        meta: createMockProvenance(
          SKILL_MULTI_STEP_WORD_PROBLEMS.id,
          difficulty
        ),
        problem_content: {
          stem: `Alice had **${adjustedStart}** stickers. She gave **${subtract}** stickers to her sister.
Then she divided the rest equally into **${divisor}** albums.
How many stickers did she put in each album?`,
          format: "text",
          variables: { start: adjustedStart, subtract, divisor },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(finalAns),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `First, subtract the stickers she gave away.`,
              math: `${adjustedStart} - ${subtract} = ${
                adjustedStart - subtract
              }`,
              answer: String(adjustedStart - subtract),
            },
            {
              step_index: 2,
              explanation: `Then divide the remaining stickers by ${divisor}.`,
              math: `${
                adjustedStart - subtract
              } \\div ${divisor} = ${finalAns}`,
              answer: String(finalAns),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_order_ops",
            error_tag: "wrong_order_operations",
            trigger: { kind: "predicate", value: "check_logic" }, // Hard to genericize
            hint_ladder: ["Did you subtract the stickers she gave away first?"],
          },
        ],
      };
    } else {
      // Remainder interpretation
      // "X students, Y per bus. How many buses?" (Round Up)
      const perGroup = randomInt(4, 9, rng);
      const numGroups = randomInt(5, 12, rng);
      const remainder = randomInt(1, perGroup - 1, rng);
      const total = numGroups * perGroup + remainder;

      const ans = numGroups + 1; // Need one more bus

      return {
        meta: createMockProvenance(
          SKILL_MULTI_STEP_WORD_PROBLEMS.id,
          difficulty
        ),
        problem_content: {
          stem: `There are **${total}** students going on a field trip.
Each van can hold **${perGroup}** students.
What is the fewest number of vans needed to carry **everyone**?`,
          format: "text",
          variables: { total, perGroup },
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
              explanation: `Divide the total students by the van capacity.`,
              math: `${total} \\div ${perGroup} = ${numGroups} \\text{ R } ${remainder}`,
              answer: `${numGroups} R ${remainder}`,
            },
            {
              step_index: 2,
              explanation: `Since there is a remainder of ${remainder}, we need an extra van for them.`,
              math: `${numGroups} + 1 = ${ans}`,
              answer: String(ans),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_ignore_rem",
            error_tag: "ignore_remainder",
            trigger: { kind: "exact_answer", value: String(numGroups) },
            hint_ladder: [
              `You calculated the full vans, but what about the ${remainder} leftover students?`,
              "We need another van for the remaining students.",
            ],
          },
        ],
      };
    }
  },
};

engine.register(MultiStepWordGen);
