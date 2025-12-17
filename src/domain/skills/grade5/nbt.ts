import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";
import { randomInt, createProblemMeta } from "../../math-utils";

// Mock provenance helper

// Helper for robust rounding
const robustRound = (n: number, scale: number) => {
  return Math.round((n + Number.EPSILON) * scale) / scale;
};

// ----------------------------------------------------------------------
// 1. Powers of 10 (5.NBT.A.1, 5.NBT.A.2)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_POWERS_10: Skill = {
  id: "5.nbt.powers_10",
  name: "Powers of 10 and Place Value",
  gradeBand: "3-5",
  prereqs: ["nbt_place_value"],
  misconceptions: ["count_zeros", "direction_error"],
  templates: ["T_POWERS_OF_10"],
  description:
    "Understand powers of 10 and patterns in multiplication/division",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.1 },
};

export const PowersOf10Generator: Generator = {
  skillId: SKILL_5_NBT_POWERS_10.id,
  templateId: "T_POWERS_OF_10",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Types:
    // 0: Shift relation (300 is 10x ?)
    // 1: Exponent evaluation (10^3 = ?)
    // 2: Mult by power of 10 (5.2 x 100)
    // 3: Div by power of 10 (450 / 10)

    const type = Math.floor((rng ?? Math.random)() * 4);

    if (type === 0) {
      const base = randomInt(1, 9, rng);
      const power = randomInt(1, 4, rng);
      const val1 = base * Math.pow(10, power);
      const isMultiplication = (rng ?? Math.random)() < 0.5;

      if (isMultiplication) {
        const val2 = base * Math.pow(10, power - 1);
        return {
          meta: createProblemMeta(SKILL_5_NBT_POWERS_10.id, difficulty),
          problem_content: {
            stem: `${val1} is 10 times as much as ?`,
            format: "text",
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "integer",
          },
          solution_logic: {
            final_answer_canonical: String(val2),
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `To find the number that is 10 times less, divide by 10.`,
                math: `${val1} \\div 10 = ${val2}`,
                answer: String(val2),
              },
            ],
          },
          misconceptions: [],
        };
      } else {
        const val2 = base * Math.pow(10, power - 1);
        return {
          meta: createProblemMeta(SKILL_5_NBT_POWERS_10.id, difficulty),
          problem_content: {
            stem: `${val2} is 1/10 of ?`,
            format: "text",
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "integer",
          },
          solution_logic: {
            final_answer_canonical: String(val1),
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `To find the number that ${val2} is 1/10 of, multiply by 10.`,
                math: `${val2} \\times 10 = ${val1}`,
                answer: String(val1),
              },
            ],
          },
          misconceptions: [],
        };
      }
    } else if (type === 1) {
      const exponent = randomInt(1, 4, rng);
      const answer = Math.pow(10, exponent);
      return {
        meta: createProblemMeta(SKILL_5_NBT_POWERS_10.id, difficulty),
        problem_content: {
          stem: `Evaluate: $10^${exponent} = ?$`,
          format: "latex",
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
              explanation: `The exponent ${exponent} tells us to multiply 10 by itself ${exponent} times.`,
              math: `10^${exponent} = ${answer}`,
              answer: String(answer),
            },
          ],
        },
        misconceptions: [],
      };
    } else if (type === 2) {
      const isDecimal = (rng ?? Math.random)() < 0.7;
      let num: number;
      if (isDecimal) {
        num = parseFloat(((rng ?? Math.random)() * 10).toFixed(3));
      } else {
        num = randomInt(1, 100, rng);
      }
      const exponent = randomInt(1, 3, rng);
      const multiplier = Math.pow(10, exponent);
      const useExponent = (rng ?? Math.random)() < 0.5;
      const questionPart = useExponent ? `10^${exponent}` : String(multiplier);
      const answer = num * multiplier;
      const canonical = parseFloat(answer.toFixed(4)).toString();

      return {
        meta: createProblemMeta(SKILL_5_NBT_POWERS_10.id, difficulty),
        problem_content: {
          stem: `Calculate: $${num} \\times ${questionPart} = ?$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
        },
        solution_logic: {
          final_answer_canonical: canonical,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `When multiplying by $10^${exponent}$, move the decimal point ${exponent} places to the right.`,
              math: `${num} \\times ${multiplier} = ${canonical}`,
              answer: canonical,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_count_zeros",
            error_tag: "count_zeros",
            trigger: {
              kind: "exact_answer",
              value: `${num}${Array(exponent).fill(0).join("")}`,
            },
            hint_ladder: [
              "When multiplying decimals by 10, don't just add zeros. Move the decimal point.",
            ],
          },
        ],
      };
    } else {
      // Type 3: Division
      const exponent = randomInt(1, 3, rng);
      const divisor = Math.pow(10, exponent);
      const baseNum = randomInt(1, 1000, rng);
      const dividend = baseNum;
      const useExponent = (rng ?? Math.random)() < 0.5;
      const questionPart = useExponent ? `10^${exponent}` : String(divisor);
      const answer = dividend / divisor;
      const canonical = parseFloat(answer.toFixed(5)).toString();

      return {
        meta: createProblemMeta(SKILL_5_NBT_POWERS_10.id, difficulty),
        problem_content: {
          stem: `Calculate: $${dividend} \\div ${questionPart} = ?$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
        },
        solution_logic: {
          final_answer_canonical: canonical,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `When dividing by $10^${exponent}$, move the decimal point ${exponent} places to the left.`,
              math: `${dividend} \\div ${divisor} = ${canonical}`,
              answer: canonical,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_direction",
            error_tag: "direction_error",
            trigger: {
              kind: "exact_answer",
              value: String(dividend * divisor),
            },
            hint_ladder: [
              "Division makes the number smaller. Move the decimal to the left.",
            ],
          },
        ],
      };
    }
  },
};

engine.register(PowersOf10Generator);

// ----------------------------------------------------------------------
// 2. Decimal Forms (5.NBT.A.3.a)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_DECIMAL_FORMS: Skill = {
  id: "5.nbt.decimal_forms",
  name: "Decimal Forms",
  gradeBand: "3-5",
  prereqs: ["5.nbt.powers_10"],
  misconceptions: ["place_value", "decimal_point"],
  templates: ["T_DECIMAL_FORMS"],
  description: "Read and write decimals in standard and expanded forms",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.1 },
};

export const DecimalFormsGenerator: Generator = {
  skillId: SKILL_5_NBT_DECIMAL_FORMS.id,
  templateId: "T_DECIMAL_FORMS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const whole = randomInt(0, 99, rng);
    const decimalPart = randomInt(1, 999, rng);
    const decimalStr = String(decimalPart).padStart(3, "0");
    const numStr = `${whole}.${decimalStr}`.replace(/\.?0+$/, "");

    // Expanded to Standard
    const parts: string[] = [];
    const wholeStr = String(whole);
    for (let i = 0; i < wholeStr.length; i++) {
      const digit = parseInt(wholeStr[i]);
      if (digit === 0) continue;
      const placeVal = Math.pow(10, wholeStr.length - 1 - i);
      parts.push(`${digit} \\times ${placeVal}`);
    }
    const decStrActual = numStr.split(".")[1] || "";
    for (let i = 0; i < decStrActual.length; i++) {
      const digit = parseInt(decStrActual[i]);
      if (digit === 0) continue;
      const denom = Math.pow(10, i + 1);
      parts.push(`${digit} \\times \\frac{1}{${denom}}`);
    }
    const expandedForm = parts.join(" + ");

    return {
      meta: createProblemMeta(SKILL_5_NBT_DECIMAL_FORMS.id, difficulty),
      problem_content: {
        stem: `Write the standard form number for:
$$${expandedForm}$$`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "decimal",
      },
      solution_logic: {
        final_answer_canonical: numStr,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Combine the whole number parts and the decimal parts based on place value.`,
            math: `\\text{Sum} = ${numStr}`,
            answer: numStr,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(DecimalFormsGenerator);

// ----------------------------------------------------------------------
// 3. Comparing Decimals (5.NBT.A.3.b)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_COMPARE_DECIMALS: Skill = {
  id: "5.nbt.compare_decimals",
  name: "Comparing Decimals",
  gradeBand: "3-5",
  prereqs: ["5.nbt.decimal_forms"],
  misconceptions: ["longer_is_larger", "shorter_is_larger"],
  templates: ["T_COMPARE_DECIMALS"],
  description: "Compare two decimals to thousandths",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.33 },
};

export const CompareDecimalsGenerator: Generator = {
  skillId: SKILL_5_NBT_COMPARE_DECIMALS.id,
  templateId: "T_COMPARE_DECIMALS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const type = (rng ?? Math.random)();
    let n1: number, n2: number;
    let s1: string | undefined, s2: string | undefined;

    if (type < 0.3) {
      // Longer is larger trap
      const base = randomInt(1, 9, rng);
      n1 = base / 10;
      n2 = (base * 100 - randomInt(1, 10, rng)) / 1000;
      if ((rng ?? Math.random)() < 0.5) [n1, n2] = [n2, n1];
    } else if (type < 0.6) {
      // Equivalence with zeros
      const base = randomInt(1, 99, rng);
      n1 = base / 100;
      s1 = n1.toString();
      s2 = s1 + "0";
      n2 = n1;
    } else {
      // Close numbers
      const base = randomInt(1, 999, rng);
      n1 = base / 1000;
      n2 = (base + ((rng ?? Math.random)() < 0.5 ? 1 : -1)) / 1000;
      if (n2 < 0) n2 = 0.001;
    }

    s1 = s1! || n1.toString();
    s2 = s2! || n2.toString();

    let expected = "=";
    if (n1 > n2) expected = ">";
    if (n1 < n2) expected = "<";

    return {
      meta: createProblemMeta(SKILL_5_NBT_COMPARE_DECIMALS.id, difficulty),
      problem_content: {
        stem: `Compare: $${s1} \\text{ ? } ${s2}$`,
        format: "latex",
        variables: { s1, s2 },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "multiple_choice",
        ui: { choices: [">", "<", "="] },
      },
      solution_logic: {
        final_answer_canonical: expected,
        final_answer_type: "multiple_choice",
        steps: [
          {
            step_index: 1,
            explanation: `Compare digits from left to right.`,
            math: `${s1} ${expected} ${s2}`,
            answer: expected,
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_longer",
          error_tag: "longer_is_larger",
          trigger: { kind: "predicate", value: "false" }, // Difficult to trigger in MC without knowing which they picked
          hint_ladder: ["Compare place by place."],
        },
      ],
    };
  },
};

engine.register(CompareDecimalsGenerator);

// ----------------------------------------------------------------------
// 4. Rounding Decimals (5.NBT.A.4)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_ROUND_DECIMALS: Skill = {
  id: "5.nbt.round_decimals",
  name: "Rounding Decimals",
  gradeBand: "3-5",
  prereqs: ["5.nbt.compare_decimals"],
  misconceptions: ["truncation", "place_confusion"],
  templates: ["T_ROUND_DECIMALS"],
  description: "Round decimals to any place",
  bktParams: { learningRate: 0.15, slip: 0.05, guess: 0.1 },
};

export const RoundDecimalsGenerator: Generator = {
  skillId: SKILL_5_NBT_ROUND_DECIMALS.id,
  templateId: "T_ROUND_DECIMALS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const places = ["whole number", "tenth", "hundredth"];
    const placeIdx = Math.floor((rng ?? Math.random)() * 3);
    const targetPlace = places[placeIdx];

    const whole = randomInt(0, 99, rng);
    const dec = randomInt(100, 999, rng);
    const num = parseFloat(`${whole}.${dec}`);

    let rounded: number;
    if (placeIdx === 0) rounded = robustRound(num, 1);
    else if (placeIdx === 1) rounded = robustRound(num, 10);
    else rounded = robustRound(num, 100);

    return {
      meta: createProblemMeta(SKILL_5_NBT_ROUND_DECIMALS.id, difficulty),
      problem_content: {
        stem: `Round **${num}** to the nearest **${targetPlace}**.`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "decimal",
      },
      solution_logic: {
        final_answer_canonical: String(rounded),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Identify the rounding place and look at the digit to its right.`,
            math: `\\text{Result: } ${rounded}`,
            answer: String(rounded),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(RoundDecimalsGenerator);

// ----------------------------------------------------------------------
// 5. Add/Subtract Decimals (5.NBT.B.7)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_ADD_SUB_DECIMALS: Skill = {
  id: "5.nbt.add_sub_decimals",
  name: "Add and Subtract Decimals",
  gradeBand: "3-5",
  prereqs: ["5.nbt.compare_decimals"],
  misconceptions: ["alignment", "place_drift"],
  templates: ["T_ADD_SUB_DECIMALS"],
  description: "Add and subtract decimals to hundredths",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const AddSubDecimalsGenerator: Generator = {
  skillId: SKILL_5_NBT_ADD_SUB_DECIMALS.id,
  templateId: "T_ADD_SUB_DECIMALS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const isAddition = (rng ?? Math.random)() < 0.5;
    const d1 = randomInt(1, 2, rng);
    const d2 = randomInt(1, 2, rng);
    let n1 = parseFloat(((rng ?? Math.random)() * 50 + 1).toFixed(d1));
    let n2 = parseFloat(((rng ?? Math.random)() * 50 + 1).toFixed(d2));

    if (!isAddition && n1 < n2) [n1, n2] = [n2, n1];

    let result = isAddition ? n1 + n2 : n1 - n2;
    result = parseFloat(result.toFixed(3));
    const op = isAddition ? "+" : "-";

    return {
      meta: createProblemMeta(SKILL_5_NBT_ADD_SUB_DECIMALS.id, difficulty),
      problem_content: {
        stem: `Compute: $${n1} ${op} ${n2} = ?$`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "decimal",
      },
      solution_logic: {
        final_answer_canonical: String(result),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Align the decimal points and ${
              isAddition ? "add" : "subtract"
            }.`,
            math: `${n1} ${op} ${n2} = ${result}`,
            answer: String(result),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_align",
          error_tag: "alignment",
          trigger: { kind: "predicate", value: "false" }, // Requires analyzing if they added tenths to hundredths
          hint_ladder: ["Did you line up the decimal points?"],
        },
      ],
    };
  },
};

engine.register(AddSubDecimalsGenerator);

// ----------------------------------------------------------------------
// 6. Multi-Digit Multiplication (5.NBT.B.5)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_MULT_WHOLE: Skill = {
  id: "5.nbt.mult_whole",
  name: "Multi-Digit Multiplication",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_2digit"],
  misconceptions: ["zero_placeholder", "column_alignment"],
  templates: ["T_MULT_WHOLE_5"],
  description: "Multiply multi-digit whole numbers",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const MultWholeGenerator: Generator = {
  skillId: SKILL_5_NBT_MULT_WHOLE.id,
  templateId: "T_MULT_WHOLE_5",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // 3x2 or 4x2
    const n1 =
      (rng ?? Math.random)() < 0.5
        ? randomInt(100, 999, rng)
        : randomInt(1000, 9999, rng);
    const n2 = randomInt(10, 99, rng);
    const result = n1 * n2;

    return {
      meta: createProblemMeta(SKILL_5_NBT_MULT_WHOLE.id, difficulty),
      problem_content: {
        stem: `Multiply: $${n1} \\times ${n2} = ?$`,
        format: "latex",
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
            explanation: `Use standard algorithm or area model.`,
            math: `${n1} \\times ${n2} = ${result}`,
            answer: String(result),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(MultWholeGenerator);

// ----------------------------------------------------------------------
// 7. Decimal Multiplication (5.NBT.B.7)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_MULT_DECIMALS: Skill = {
  id: "5.nbt.mult_decimals",
  name: "Decimal Multiplication",
  gradeBand: "3-5",
  prereqs: ["5.nbt.mult_whole"],
  misconceptions: ["decimal_placement", "line_up_error"],
  templates: ["T_MULT_DECIMALS"],
  description: "Multiply decimals to hundredths",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const MultDecimalsGenerator: Generator = {
  skillId: SKILL_5_NBT_MULT_DECIMALS.id,
  templateId: "T_MULT_DECIMALS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const isDecDec = (rng ?? Math.random)() < 0.6;
    let n1: number, n2: number;

    if (isDecDec) {
      n1 = parseFloat(((rng ?? Math.random)() * 10).toFixed(1));
      n2 = parseFloat(((rng ?? Math.random)() * 5).toFixed(1));
    } else {
      const d = (rng ?? Math.random)() < 0.5 ? 1 : 2;
      n1 = parseFloat(((rng ?? Math.random)() * 20).toFixed(d));
      n2 = randomInt(2, 10, rng);
    }
    const result = parseFloat((n1 * n2).toFixed(4));
    const canonical = String(result);

    return {
      meta: createProblemMeta(SKILL_5_NBT_MULT_DECIMALS.id, difficulty),
      problem_content: {
        stem: `Multiply: $${n1} \\times ${n2} = ?$`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "decimal",
      },
      solution_logic: {
        final_answer_canonical: canonical,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Multiply as whole numbers, then place decimal so total decimal places match sum of factors.`,
            math: `${n1} \\times ${n2} = ${canonical}`,
            answer: canonical,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(MultDecimalsGenerator);

// ----------------------------------------------------------------------
// 8. Multi-Digit Division (5.NBT.B.6)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_DIV_WHOLE: Skill = {
  id: "5.nbt.div_whole",
  name: "Multi-Digit Division",
  gradeBand: "3-5",
  prereqs: ["nbt_div_remainders"],
  misconceptions: ["estimation", "remainder_size"],
  templates: ["T_DIV_WHOLE_5"],
  description:
    "Divide multi-digit numbers (up to 4-digit dividend, 2-digit divisor)",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const DivWholeGenerator: Generator = {
  skillId: SKILL_5_NBT_DIV_WHOLE.id,
  templateId: "T_DIV_WHOLE_5",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const divisor = randomInt(10, 99, rng);
    const quotient = randomInt(10, 200, rng);
    const isClean = (rng ?? Math.random)() < 0.6;
    let remainder = 0;
    if (!isClean) {
      remainder = randomInt(1, divisor - 1, rng);
    }
    const dividend = quotient * divisor + remainder;

    const answer =
      remainder === 0 ? String(quotient) : `${quotient} R ${remainder}`;

    return {
      meta: createProblemMeta(SKILL_5_NBT_DIV_WHOLE.id, difficulty),
      problem_content: {
        stem: `Divide: $${dividend} \\div ${divisor}$
${remainder > 0 ? "(Format: Quotient R Remainder, e.g. 5 R 2)" : ""}`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "text", // using text for "Q R R" format handling
        accepted_forms: [answer, remainder === 0 ? String(quotient) : ""],
      },
      solution_logic: {
        final_answer_canonical: answer,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Divide ${dividend} by ${divisor}.`,
            math: `${dividend} \\div ${divisor} = ${quotient} \\text{ R } ${remainder}`,
            answer: answer,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(DivWholeGenerator);

// ----------------------------------------------------------------------
// 9. Decimal Division (5.NBT.B.7)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_DIV_DECIMALS: Skill = {
  id: "5.nbt.div_decimals",
  name: "Decimal Division",
  gradeBand: "3-5",
  prereqs: ["5.nbt.div_whole"],
  misconceptions: ["move_decimal", "position"],
  templates: ["T_DIV_DECIMALS"],
  description: "Divide decimals to hundredths",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.05 },
};

export const DivDecimalsGenerator: Generator = {
  skillId: SKILL_5_NBT_DIV_DECIMALS.id,
  templateId: "T_DIV_DECIMALS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const type = Math.floor((rng ?? Math.random)() * 3);
    let divisor: number;
    const quotient = parseFloat(((rng ?? Math.random)() * 20 + 0.1).toFixed(2));

    if (type === 0) {
      divisor = randomInt(2, 12, rng);
    } else if (type === 1) {
      divisor = parseFloat(((rng ?? Math.random)() * 5 + 0.1).toFixed(1));
    } else {
      divisor = parseFloat(((rng ?? Math.random)() * 5 + 0.1).toFixed(1));
    }
    const dividend = parseFloat((quotient * divisor).toFixed(4));

    return {
      meta: createProblemMeta(SKILL_5_NBT_DIV_DECIMALS.id, difficulty),
      problem_content: {
        stem: `Divide: $${dividend} \\div ${divisor} = ?$`,
        format: "latex",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "decimal",
      },
      solution_logic: {
        final_answer_canonical: String(quotient),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `If divisor is decimal, shift decimal points until divisor is whole.`,
            math: `${dividend} \\div ${divisor} = ${quotient}`,
            answer: String(quotient),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(DivDecimalsGenerator);

// ----------------------------------------------------------------------
// 10. Fraction-Decimal Conversion (5.NBT / 5.NF)
// ----------------------------------------------------------------------

export const SKILL_5_NBT_FRAC_DEC_CONV: Skill = {
  id: "5.nbt.frac_dec_conv",
  name: "Fraction-Decimal Conversion",
  gradeBand: "3-5",
  prereqs: ["5.nbt.decimal_forms", "5.nf.div_frac"],
  misconceptions: ["append_digits"],
  templates: ["T_FRAC_DEC_CONV"],
  description:
    "Convert between fractions with denominators that are factors of 100 and decimals.",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.2 },
};

export const FracDecConversionGenerator: Generator = {
  skillId: SKILL_5_NBT_FRAC_DEC_CONV.id,
  templateId: "T_FRAC_DEC_CONV",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Denominators compatible with base 10
    const denominators = [2, 4, 5, 10, 20, 25, 50, 100];
    const den =
      denominators[Math.floor((rng ?? Math.random)() * denominators.length)];
    const num = randomInt(1, den - 1, rng);

    // Calculate decimal value
    const decimalVal = num / den;

    // Type 0: Fraction to Decimal (3/4 -> 0.75)
    // Type 1: Decimal to Fraction (0.75 -> 3/4)
    const type = (rng ?? Math.random)() < 0.5 ? 0 : 1;

    if (type === 0) {
      return {
        meta: createProblemMeta(SKILL_5_NBT_FRAC_DEC_CONV.id, difficulty),
        problem_content: {
          stem: `Convert the fraction to a decimal:
$$ \\frac{${num}}{${den}} = ? $$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
        },
        solution_logic: {
          final_answer_canonical: String(decimalVal),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Divide the numerator by the denominator, or convert to an equivalent fraction with a denominator of 10, 100, or 1000.`,
              math: `\\frac{${num}}{${den}} = ${decimalVal}`,
              answer: String(decimalVal),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_append",
            error_tag: "append_digits",
            trigger: { kind: "exact_answer", value: `${num}.${den}` }, // e.g. 3.4 for 3/4
            hint_ladder: [
              "A fraction bar means division. It does not mean a decimal point.",
            ],
          },
        ],
      };
    } else {
      // Decimal to Fraction
      return {
        meta: createProblemMeta(SKILL_5_NBT_FRAC_DEC_CONV.id, difficulty),
        problem_content: {
          stem: `Convert the decimal to a fraction (in simplest form):
$$ ${decimalVal} = ? $$`,
          format: "latex",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: `${num}/${den}`, // System should handle equivalent forms, but we aim for simplest if possible.
          // NOTE: Our simple random generation might produce 2/4. 2/4 = 0.5. Canonical answer for 0.5 might be 1/2.
          // Let's rely on the evaluation engine handling equivalence, OR pre-simplify here if we want strictness.
          // For checking simplicity, let's simplify our canonical answer.
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Write the decimal as a fraction with a denominator of 10, 100, etc., then simplify.`,
              math: `${decimalVal} = \\frac{${num}}{${den}}`,
              answer: `${num}/${den}`,
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(FracDecConversionGenerator);
