import type { Skill, Generator, MathProblemItem } from "../types";
import { engine } from "../generator/engine";

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

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

// --- 1. Place Value (4.NBT.A.1, 4.NBT.A.2) ---

export const SKILL_PLACE_VALUE: Skill = {
  id: "nbt_place_value",
  name: "Generalize place value understanding",
  gradeBand: "3-5",
  prereqs: [], // Foundational
  misconceptions: ["face_value_bias", "reverse_place_value"],
  templates: ["T_PLACE_VALUE_ID", "T_PLACE_VALUE_VAL"],
  description:
    "Recognize that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right.",
  bktParams: { learningRate: 0.2, slip: 0.05, guess: 0.1 },
};

const PLACES = [
  { name: "ones", val: 1 },
  { name: "tens", val: 10 },
  { name: "hundreds", val: 100 },
  { name: "thousands", val: 1000 },
  { name: "ten-thousands", val: 10000 },
  { name: "hundred-thousands", val: 100000 },
  { name: "millions", val: 1000000 },
];

export const PlaceValueGenerator: Generator = {
  templateId: "T_PLACE_VALUE_MIXED",
  skillId: SKILL_PLACE_VALUE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Difficulty maps to max number magnitude
    // < 0.3: up to 1,000
    // < 0.6: up to 100,000
    // >= 0.6: up to 1,000,000

    let maxExp = 3; // 1000
    if (difficulty >= 0.3) maxExp = 5; // 100,000
    if (difficulty >= 0.6) maxExp = 6; // 1,000,000

    // Generate number with guaranteed length for the chosen difficulty
    const minVal = Math.pow(10, maxExp - 1);
    const maxVal = Math.pow(10, maxExp + 1) - 1;
    const number = randomInt(minVal, maxVal, rng);
    const numStr = number.toString();
    const digits = numStr.split("").map(Number);
    const len = digits.length;

    // Mode:
    // A) "What is the value of the digit X?"
    // B) "Which digit is in the [Place] place?"
    const mode = (rng ?? Math.random)() > 0.5 ? "VALUE_OF" : "DIGIT_IN";

    // Select a random position (0 = ones, 1 = tens, etc.)
    // Ensure we don't pick a leading zero (impossible here)
    const targetPosIndex = randomInt(0, len - 1, rng); // 0 to len-1
    // Map posIndex to power of 10.
    // Logic: digits array is [Most Significant ... Least].
    // Let's index from right (0 = ones).
    const posFromRight = targetPosIndex;
    // e.g. number 1234. digits=['1','2','3','4'].
    // right index 0 -> '4'. right index 3 -> '1'.

    const digitVal = digits[len - 1 - posFromRight];
    const placeInfo = PLACES[posFromRight];

    // Format number with commas for readability
    const formattedNum = number.toLocaleString();

    if (mode === "VALUE_OF") {
      const actualValue = digitVal * placeInfo.val;

      return {
        meta: createMockProvenance(SKILL_PLACE_VALUE.id, difficulty),
        problem_content: {
          stem: `What is the value of the digit in the **${placeInfo.name}** place of the number **${formattedNum}**?`,
          format: "text",
          variables: { number, place: placeInfo.name },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(actualValue),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Identify the digit in the ${placeInfo.name} place.`,
              math: `\\text{Digit: } ${digitVal}`,
              answer: String(digitVal),
            },
            {
              step_index: 2,
              explanation: `Multiply the digit by its place value (${placeInfo.val}).`,
              math: `${digitVal} \\times ${placeInfo.val} = ${actualValue}`,
              answer: String(actualValue),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_face_val",
            error_tag: "face_value_bias",
            trigger: { kind: "exact_answer", value: String(digitVal) },
            hint_ladder: [
              `That is the digit itself, but what is its *value* in the ${placeInfo.name} place?`,
            ],
          },
        ],
      };
    } else {
      // mode === 'DIGIT_IN'
      return {
        meta: createMockProvenance(SKILL_PLACE_VALUE.id, difficulty),
        problem_content: {
          stem: `Which digit is in the **${placeInfo.name}** place in the number **${formattedNum}**?`,
          format: "text",
          variables: { number, place: placeInfo.name },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(digitVal),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Locate the ${placeInfo.name} place.`,
              math: `\\text{It is the } ${
                posFromRight + 1
              } \\text{th digit from the right.}`,
              answer: String(digitVal),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(PlaceValueGenerator);

// --- 2. Rounding (4.NBT.A.3) ---

export const SKILL_ROUNDING: Skill = {
  id: "nbt_rounding",
  name: "Round multi-digit whole numbers",
  gradeBand: "3-5",
  prereqs: ["nbt_place_value"],
  misconceptions: ["round_down_always", "round_wrong_direction"],
  templates: ["T_ROUNDING"],
  description:
    "Use place value understanding to round multi-digit whole numbers to any place.",
  bktParams: { learningRate: 0.15, slip: 0.05, guess: 0.1 },
};

export const RoundingGenerator: Generator = {
  templateId: "T_ROUNDING",
  skillId: SKILL_ROUNDING.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Difficulty:
    // < 0.3: Round 3-4 digit numbers to nearest 10 or 100
    // < 0.6: Round up to 100,000 to nearest 1000 or 10,000
    // >= 0.6: Round up to 1,000,000 to any place

    let minExp = 2; // Hundreds (10-999)
    let maxExp = 3; // Thousands

    if (difficulty >= 0.3) {
      minExp = 4;
      maxExp = 5;
    } // 10k - 100k
    if (difficulty >= 0.6) {
      minExp = 5;
      maxExp = 6;
    } // 100k - 1m

    const exponent = randomInt(minExp, maxExp, rng);
    const minVal = Math.pow(10, exponent);
    const maxVal = Math.pow(10, exponent + 1) - 1;

    const number = randomInt(minVal, maxVal, rng);

    // Pick a place to round to strictly smaller than the number
    const numDigits = number.toString().length;
    // placeIndex: 0=ones (never round to), 1=tens, 2=hundreds...
    const maxRoundIndex = numDigits - 1;
    const roundIndex = randomInt(
      1,
      Math.min(maxRoundIndex, difficulty >= 0.6 ? 5 : 3),
      rng
    );

    const roundPlaceVal = Math.pow(10, roundIndex); // e.g. 10, 100, 1000
    const placeName = PLACES[roundIndex].name;

    // Rounding logic
    // x / step, round, * step
    const rounded = Math.round(number / roundPlaceVal) * roundPlaceVal;

    // Check for specific scenario: rounding exactly halfway case (e.g. 15 -> 20)
    // Math.round handles .5 by rounding up to next integer in +ve, which matches school rule.

    // Calculate "round down" and "round up" candidates for misconceptions
    const lower = Math.floor(number / roundPlaceVal) * roundPlaceVal;
    const upper = Math.ceil(number / roundPlaceVal) * roundPlaceVal;
    const wrongAnswer = rounded === upper ? lower : upper;

    return {
      meta: createMockProvenance(SKILL_ROUNDING.id, difficulty),
      problem_content: {
        stem: `Round **${number.toLocaleString()}** to the nearest **${placeName}**.`,
        format: "text",
        variables: { number, place: placeName },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(rounded),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Find the digit in the ${placeName} place. Look at the digit to its right.`,
            math: `\\text{Target Place: } ${
              Math.floor(number / roundPlaceVal) % 10
            }, \\quad \\text{Neighbor: } ${
              Math.floor(number / (roundPlaceVal / 10)) % 10
            }`,
            answer: String(Math.floor(number / roundPlaceVal) % 10), // Just asking for target digit
          },
          {
            step_index: 2,
            explanation: `If the neighbor is 5 or more, round up. If less than 5, round down.`,
            math: `\\text{Round } ${number} \\to ${rounded}`,
            answer: String(rounded),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_round_dir",
          error_tag: "round_wrong_direction",
          trigger: { kind: "exact_answer", value: String(wrongAnswer) },
          hint_ladder: [
            "Check the digit to the right of the rounding place.",
            `Is it 5 or more? Round up. Less than 5? Round down.`, // Generic hint
          ],
        },
      ],
    };
  },
};

engine.register(RoundingGenerator);

// --- 3. Multi-Digit Addition & Subtraction (4.NBT.B.4) ---

export const SKILL_ADD_SUB_MULTI: Skill = {
  id: "nbt_add_sub_multi",
  name: "Add & Subtract Multi-Digit Numbers",
  gradeBand: "3-5",
  prereqs: ["nbt_place_value"],
  misconceptions: ["smaller_from_larger", "forget_borrow", "forget_carry"],
  templates: ["T_ADD_SUB_MULTI"],
  description:
    "Fluently add and subtract multi-digit whole numbers using the standard algorithm.",
  bktParams: { learningRate: 0.1, slip: 0.05, guess: 0.05 },
};

export const AddSubMultiGenerator: Generator = {
  templateId: "T_ADD_SUB_MULTI",
  skillId: SKILL_ADD_SUB_MULTI.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const isAddition = (rng ?? Math.random)() > 0.5;

    // Digits: 3 to 6
    // <0.3: 3 digits
    // <0.6: 4-5 digits
    // >=0.6: 6 digits
    let digits = 3;
    if (difficulty >= 0.3) digits = randomInt(4, 5, rng);
    if (difficulty >= 0.6) digits = 6;

    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;

    const n1 = randomInt(minVal, maxVal, rng);
    const n2 = randomInt(minVal, maxVal, rng);

    let num1 = n1;
    let num2 = n2;

    if (!isAddition) {
      // Ensure num1 >= num2 for subtraction
      num1 = Math.max(n1, n2);
      num2 = Math.min(n1, n2);
    }

    const result = isAddition ? num1 + num2 : num1 - num2;
    const opSym = isAddition ? "+" : "-";

    // Misconception: Smaller from Larger (Subtraction)
    // e.g. 52 - 38. 2-8? writes 6. 5-3=2. Result 26. (Correct is 14)
    // This is complex to generate generically, but we can simulate the "digit-wise difference"
    let smallerModel = 0;
    if (!isAddition) {
      const s1 = num1.toString().split("").reverse();
      const s2 = num2.toString().split("").reverse();
      let resDigits: number[] = [];
      for (let i = 0; i < Math.max(s1.length, s2.length); i++) {
        const d1 = parseInt(s1[i] || "0");
        const d2 = parseInt(s2[i] || "0");
        resDigits.push(Math.abs(d1 - d2)); // The error
      }
      smallerModel = parseInt(resDigits.reverse().join(""));
    }

    // Misconception: Add Denominators? No, for addition, maybe forgetting carry?
    // e.g. 15 + 16. 5+6=11. writes 11? 1+1=2. 211?
    // Or 15+16 -> 5+6=11 (write 1), 1+1=2. 21. Correct 31. Forget carry.

    return {
      meta: createMockProvenance(SKILL_ADD_SUB_MULTI.id, difficulty),
      problem_content: {
        stem: `${isAddition ? "Add" : "Subtract"}:
$$
\\begin{array}{r}
${num1.toLocaleString()} \\\\
${opSym} \\, ${num2.toLocaleString()} \\\\
\\hline
\\end{array}
$$`,
        format: "latex",
        variables: { num1, num2, op: opSym },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(result),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Align the numbers by place value and ${
              isAddition ? "add" : "subtract"
            } from right to left.`,
            math: `${num1} ${opSym} ${num2} = ${result}`,
            answer: String(result),
          },
        ],
      },
      misconceptions:
        !isAddition && smallerModel !== result
          ? [
              {
                id: "misc_smaller_larger",
                error_tag: "smaller_from_larger",
                trigger: { kind: "exact_answer", value: String(smallerModel) },
                hint_ladder: [
                  "Did you subtract the smaller digit from the larger one defined by place?",
                  "If the top digit is smaller, you must borrow from the next place.",
                ],
              },
            ]
          : [],
    };
  },
};

engine.register(AddSubMultiGenerator);

// --- 4. Multiplication (4.NBT.B.5) ---

export const SKILL_MULT_1DIGIT: Skill = {
  id: "nbt_mult_1digit",
  name: "Multiply by 1-Digit Numbers",
  gradeBand: "3-5",
  prereqs: ["nbt_add_sub_multi"], // Loose dependency
  misconceptions: ["add_instead_mult", "place_value_shift"],
  templates: ["T_MULT_VERTICAL"],
  description:
    "Multiply a whole number of up to four digits by a one-digit whole number.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const SKILL_MULT_2DIGIT: Skill = {
  id: "nbt_mult_2digit",
  name: "Multiply 2-Digit by 2-Digit",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_1digit"],
  misconceptions: ["forget_zero_placeholder", "add_instead_mult"],
  templates: ["T_MULT_VERTICAL"],
  description:
    "Multiply two two-digit numbers using strategies based on place value.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const MultiplicationGenerator: Generator = {
  templateId: "T_MULT_VERTICAL",
  skillId: "dynamic_mult", // Can serve both? Engine maps by ID. We need to register twice or logic inside.
  // Actually, we can just use two generators or one generator mapped to multiple skills?
  // Engine register map is strictly 1:1 SkillID -> Generator.
  // So distinct objects or register same object with different ID property?
  // Let's make a factory or just handle the logic inside specific objects if they differ.
  // They share a lot. Let's define the logic function and reuse.
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // This is a placeholder.
    // We will register specific instances below.
    throw new Error("Abstract generator called");
  },
};

// Helper for multiplication logic, reused for both skills
const generateMultProblem = (
  skillId: string,
  diff: number,
  rng: () => number = Math.random
): MathProblemItem => {
  const is2Digit = skillId === SKILL_MULT_2DIGIT.id;

  let n1: number, n2: number;

  if (is2Digit) {
    // 2-digit x 2-digit
    // diff < 0.5: 10-50 range
    // >= 0.5: 10-99 range
    const max = diff < 0.5 ? 50 : 99;
    n1 = randomInt(10, max, rng);
    n2 = randomInt(10, max, rng);
  } else {
    // 4-digit x 1-digit (or 2/3 digit)
    // < 0.3: 2-digit x 1-digit
    // < 0.6: 3-digit x 1-digit
    // >= 0.6: 4-digit x 1-digit
    let digits = 2;
    if (diff >= 0.3) digits = 3;
    if (diff >= 0.6) digits = 4;

    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;

    n1 = randomInt(minVal, maxVal, rng);
    n2 = randomInt(2, 9, rng); // 1-digit multiplier (avoid 0, 1 for pedagogical richness)
  }

  const result = n1 * n2;

  // Misconception: Adding?
  const addedWrong = n1 + n2;

  // Formatting
  // e.g.
  //   123
  // x   4

  return {
    meta: createMockProvenance(skillId, diff),
    problem_content: {
      stem: `Multiply:
$$
\\begin{array}{r}
${n1} \\\\
\\times \\, ${n2} \\\\
\\hline
\\end{array}
$$`,
      format: "latex",
      variables: { n1, n2 },
    },
    answer_spec: {
      answer_mode: "final_only",
      input_type: "integer",
    },
    solution_logic: {
      final_answer_canonical: String(result),
      final_answer_type: "numeric",
      steps: [
        {
          step_index: 1,
          explanation: is2Digit
            ? `Multiply ${n1} by the ones digit of ${n2}, then by the tens digit (place holder zero), and add.`
            : `Multiply each digit of ${n1} by ${n2}, carrying over values as needed.`,
          math: `${n1} \\times ${n2} = ${result}`,
          answer: String(result),
        },
      ],
    },
    misconceptions: [
      {
        id: "misc_add_mult",
        error_tag: "add_instead_mult",
        trigger: { kind: "exact_answer", value: String(addedWrong) },
        hint_ladder: [
          "Did you add the numbers? The sign is $\\times$ (multiplication).",
        ],
      },
    ],
  };
};

// --- 5. Division with Remainders (4.NBT.B.6) ---

export const SKILL_DIV_REMAINDERS: Skill = {
  id: "nbt_div_remainders",
  name: "Divide with Remainders",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_1digit", "nbt_add_sub_multi"],
  misconceptions: [
    "remainder_greater_than_divisor",
    "confuse_quotient_remainder",
  ],
  templates: ["T_DIV_REMAINDER"],
  description:
    "Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const DivisionGenerator: Generator = {
  templateId: "T_DIV_REMAINDER",
  skillId: SKILL_DIV_REMAINDERS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Dividend: 2 to 4 digits
    // <0.3: 2-digit
    // <0.6: 3-digit
    // >=0.6: 4-digit
    let digits = 2;
    if (difficulty >= 0.3) digits = 3;
    if (difficulty >= 0.6) digits = 4;

    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;

    const dividend = randomInt(minVal, maxVal, rng);
    const divisor = randomInt(2, 9, rng);

    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;

    // Misconception: Remainder > Divisor (Logic error simulation is hard without user input stream analysis)
    // We can just set up the problem.

    return {
      meta: createMockProvenance(SKILL_DIV_REMAINDERS.id, difficulty),
      problem_content: {
        stem: `Divide: $${dividend} \\div ${divisor}$
Enter the Quotient and Remainder.`,
        format: "latex",
        variables: { dividend, divisor },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "number_pair", // Special type needed? Or just text 'Q R'
        // Let's use multi-part format or just ask for them in separate fields if supported?
        // Our system currently supports 'final_only'.
        // Ideally, we'd have a custom input for "Q, R".
        // For now, let's just ask for "Quotient R Remainder" format or separate specific questions.
        // Let's simplify: "What is the quotient? (Ignore remainder)" or "What is the remainder?"
        // Ideally cover 4.NBT.B.6 which is "Find whole-number quotients and remainders".
        // Let's output a structured answer field or simply ask the user to format "Q R".
        // We'll trust the unstructured input parser or make it specific.
        // Let's use format: "X R Y" e.g. "12 R 3"
        calculator: false,
      },
      solution_logic: {
        final_answer_canonical: `${quotient} R ${remainder}`,
        final_answer_type: "string", // special format
        steps: [
          {
            step_index: 1,
            explanation: `Divide ${dividend} by ${divisor}.`,
            math: `${dividend} \\div ${divisor} = ${quotient} \\text{ with remainder } ${remainder}`,
            answer: `${quotient} R ${remainder}`,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_rem_size",
          error_tag: "remainder_greater_than_divisor",
          // This triggers if user inputs R >= divisor. Unlikely to be an exact match trigger.
          // Placeholder.
          trigger: { kind: "regex", value: `.* R [${divisor}-9]` }, // Crude regex
          hint_ladder: [
            `The remainder cannot be equal to or larger than the divisor (${divisor}).`,
          ],
        },
      ],
    };
  },
};

engine.register(DivisionGenerator);

// Concrete generators
export const Mult1DigitGen: Generator = {
  skillId: SKILL_MULT_1DIGIT.id,
  templateId: "T_MULT_VERTICAL",
  generate: (d, r) => generateMultProblem(SKILL_MULT_1DIGIT.id, d, r),
};

export const Mult2DigitGen: Generator = {
  skillId: SKILL_MULT_2DIGIT.id,
  templateId: "T_MULT_VERTICAL",
  generate: (d, r) => generateMultProblem(SKILL_MULT_2DIGIT.id, d, r),
};

engine.register(Mult1DigitGen);
engine.register(Mult2DigitGen);
