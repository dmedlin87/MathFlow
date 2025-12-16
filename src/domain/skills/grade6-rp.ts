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

// Helper for robust rounding
const robustRound = (n: number, scale: number) => {
  return Math.round((n + Number.EPSILON) * scale) / scale;
};

// ----------------------------------------------------------------------
// 1. Ratios (6.RP.A.1, 6.RP.A.3)
// ----------------------------------------------------------------------

export const SKILL_6_RP_RATIOS: Skill = {
  id: "6.rp.ratios",
  name: "Understand Ratio Concepts",
  gradeBand: "6-8",
  prereqs: ["5.nf.mult_frac"], // Assuming 5th grade fraction knowledge
  misconceptions: ["additive_reasoning", "order_matters"],
  templates: ["T_RATIOS_INTRO"],
  description: "Understand the concept of a ratio and use ratio language",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const RatiosGenerator: Generator = {
  skillId: SKILL_6_RP_RATIOS.id,
  templateId: "T_RATIOS_INTRO",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type 0: Write ratio (There are 5 dogs and 3 cats. What is ratio of dogs to cats?)
    // Type 1: Equivalent ratio / Missing value (Ratio is 2:3. If 10 dogs, how many cats?)

    const type = (rng ?? Math.random)() < 0.5 ? 0 : 1;

    if (type === 0) {
      const a = randomInt(2, 12, rng);
      const b = randomInt(2, 12, rng);
      const subjects = [
        "dogs",
        "cats",
        "apples",
        "oranges",
        "boys",
        "girls",
        "pens",
        "pencils",
      ];
      const s1 = subjects[randomInt(0, 3, rng) * 2];
      const s2 = subjects[randomInt(0, 3, rng) * 2 + 1];

      const askForOrder = (rng ?? Math.random)() < 0.5;
      const targetS1 = askForOrder ? s1 : s2;
      const targetS2 = askForOrder ? s2 : s1;
      const val1 = askForOrder ? a : b;
      const val2 = askForOrder ? b : a;

      return {
        meta: createMockProvenance(SKILL_6_RP_RATIOS.id, difficulty),
        problem_content: {
          stem: `There are ${a} ${s1} and ${b} ${s2}. Write the ratio of **${targetS1}** to **${targetS2}** (use a colon, e.g. 1:2).`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "text",
          accepted_forms: [`${val1}:${val2}`, `${val1} to ${val2}`],
        },
        solution_logic: {
          final_answer_canonical: `${val1}:${val2}`,
          final_answer_type: "numeric", // it's text really but close enough for now
          steps: [
            {
              step_index: 1,
              explanation: `The question asks for ${targetS1} to ${targetS2}. Number of ${targetS1} is ${val1}. Number of ${targetS2} is ${val2}.`,
              math: `\\text{Ratio} = ${val1}:${val2}`,
              answer: `${val1}:${val2}`,
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_order",
            error_tag: "order_matters",
            trigger: { kind: "exact_answer", value: `${val2}:${val1}` },
            hint_ladder: ["Pay attention to the order asked in the question."],
          },
        ],
      };
    } else {
      // Equivalent ratio
      const m = randomInt(2, 5, rng); // multiplier
      const a = randomInt(1, 10, rng);
      const b = randomInt(1, 10, rng);

      // Determine which part is missing
      const _missingIndex = randomInt(0, 1, rng); // 0 -> missing second part of scaled, 1 -> missing first part
      // actually let's just do: Ratio is a:b. If we have (a*m) of first, how many of second?

      const scaledA = a * m;
      const scaledB = b * m;

      return {
        meta: createMockProvenance(SKILL_6_RP_RATIOS.id, difficulty),
        problem_content: {
          stem: `The ratio of flour to sugar in a recipe is ${a}:${b}. If you use ${scaledA} cups of flour, how many cups of sugar should you use?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(scaledB),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Find the multiplier. ${scaledA} is ${m} times ${a}. Multiply ${b} by ${m}.`,
              math: `${b} \\times ${m} = ${scaledB}`,
              answer: String(scaledB),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_additive",
            error_tag: "additive_reasoning",
            trigger: { kind: "exact_answer", value: String(scaledA - a + b) }, // e.g. 2:3 -> 4:5 (adding 2 instead of mult by 2)
            hint_ladder: [
              "Ratios use multiplication, not addition. How many times bigger is the new amount?",
            ],
          },
        ],
      };
    }
  },
};

engine.register(RatiosGenerator);

// ----------------------------------------------------------------------
// 2. Unit Rates (6.RP.A.2)
// ----------------------------------------------------------------------

export const SKILL_6_RP_UNIT_RATE: Skill = {
  id: "6.rp.unit_rate",
  name: "Unit Rates",
  gradeBand: "6-8",
  prereqs: ["6.rp.ratios"],
  misconceptions: ["inverted_rate"],
  templates: ["T_UNIT_RATE"],
  description:
    "Solve unit rate problems including those involving unit pricing and constant speed",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const UnitRateGenerator: Generator = {
  skillId: SKILL_6_RP_UNIT_RATE.id,
  templateId: "T_UNIT_RATE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type: Cost per item, or Miles per hour
    const type = (rng ?? Math.random)() < 0.5 ? "cost" : "speed";

    if (type === "cost") {
      const units = randomInt(3, 12, rng);
      const pricePerUnit =
        randomInt(2, 9, rng) + ((rng ?? Math.random)() < 0.5 ? 0.5 : 0);
      const totalCost = units * pricePerUnit;

      return {
        meta: createMockProvenance(SKILL_6_RP_UNIT_RATE.id, difficulty),
        problem_content: {
          stem: `If ${units} notebooks cost $${totalCost.toFixed(
            2
          )}, what is the cost per notebook?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
        },
        solution_logic: {
          final_answer_canonical: String(pricePerUnit),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Divide total cost by number of units.`,
              math: `${totalCost} \\div ${units} = ${pricePerUnit}`,
              answer: String(pricePerUnit),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_invert",
            error_tag: "inverted_rate",
            trigger: {
              kind: "exact_answer",
              value: String(robustRound(units / totalCost, 100)),
            },
            hint_ladder: [
              "You divided the wrong way. We want cost divided by items.",
            ],
          },
        ],
      };
    } else {
      // Speed
      const hours = randomInt(2, 5, rng);
      const speed = randomInt(40, 70, rng);
      const miles = speed * hours;

      return {
        meta: createMockProvenance(SKILL_6_RP_UNIT_RATE.id, difficulty),
        problem_content: {
          stem: `A car travels ${miles} miles in ${hours} hours. What is its average speed in miles per hour?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(speed),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Divide distance by time.`,
              math: `${miles} \\div ${hours} = ${speed}`,
              answer: String(speed),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(UnitRateGenerator);

// ----------------------------------------------------------------------
// 3. Percents (6.RP.A.3.c)
// ----------------------------------------------------------------------

export const SKILL_6_RP_PERCENTS: Skill = {
  id: "6.rp.percents",
  name: "Percents",
  gradeBand: "6-8",
  prereqs: ["6.rp.ratios", "6.rp.unit_rate"],
  misconceptions: ["percent_decimal_confusion"],
  templates: ["T_PERCENTS"],
  description:
    "Find a percent of a quantity as a rate per 100; solve problems involving finding the whole",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const PercentsGenerator: Generator = {
  skillId: SKILL_6_RP_PERCENTS.id,
  templateId: "T_PERCENTS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type 0: Find part (What is P% of W?)
    // Type 1: Find whole (Part is P% of what?)
    const type = (rng ?? Math.random)() < 0.6 ? 0 : 1;

    if (type === 0) {
      const percent = randomInt(1, 20, rng) * 5; // 5, 10, ... 100
      const whole = randomInt(2, 20, rng) * 10; // 20, 30, ... 200
      const part = (percent / 100) * whole;

      return {
        meta: createMockProvenance(SKILL_6_RP_PERCENTS.id, difficulty),
        problem_content: {
          stem: `What is ${percent}% of ${whole}?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
        },
        solution_logic: {
          final_answer_canonical: String(part),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Convert ${percent}% to a decimal (${
                percent / 100
              }) or fraction (${percent}/100) and multiply by ${whole}.`,
              math: `${percent / 100} \\times ${whole} = ${part}`,
              answer: String(part),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      // Find whole
      const percent = [10, 20, 25, 50, 75][randomInt(0, 4, rng)];
      const whole = randomInt(2, 20, rng) * 4; // Ensure clean numbers
      const part = (percent / 100) * whole;

      return {
        meta: createMockProvenance(SKILL_6_RP_PERCENTS.id, difficulty),
        problem_content: {
          stem: `${part} is ${percent}% of what number?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(whole),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `If ${part} is ${percent}%, divide ${part} by ${
                percent / 100
              }.`,
              math: `${part} \\div ${percent / 100} = ${whole}`,
              answer: String(whole),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(PercentsGenerator);

// ----------------------------------------------------------------------
// 4. Ratio Tables (6.RP.A.3.a)
// ----------------------------------------------------------------------

export const SKILL_6_RP_RATIO_TABLES: Skill = {
  id: "6.rp.ratio_tables",
  name: "Ratio Tables",
  gradeBand: "6-8",
  prereqs: ["6.rp.ratios"],
  misconceptions: ["additive_pattern"],
  templates: ["T_RATIO_TABLE"],
  description: "Make tables of equivalent ratios relating quantities",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const RatioTablesGenerator: Generator = {
  skillId: SKILL_6_RP_RATIO_TABLES.id,
  templateId: "T_RATIO_TABLE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const a = randomInt(2, 5, rng);
    const b = randomInt(2, 9, rng);
    const mult1 = randomInt(2, 3, rng);
    const mult2 = randomInt(4, 5, rng);

    // Table:
    // a | b
    // ? | b*mult1
    // a*mult2 | ?

    const missingType = (rng ?? Math.random)() < 0.5 ? 1 : 2;

    if (missingType === 1) {
      const targetB = b * mult1;
      const answer = a * mult1;
      return {
        meta: createMockProvenance(SKILL_6_RP_RATIO_TABLES.id, difficulty),
        problem_content: {
          stem: `Complete the ratio table.
              
| A | B |
|---|---|
| ${a} | ${b} |
| ? | ${targetB} |`,
          format: "text",
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
              explanation: `Identify the multiplier. ${targetB} divided by ${b} is ${mult1}. Multiply ${a} by ${mult1}.`,
              math: `${a} \\times ${mult1} = ${answer}`,
              answer: String(answer),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      const targetA = a * mult2;
      const answer = b * mult2;
      return {
        meta: createMockProvenance(SKILL_6_RP_RATIO_TABLES.id, difficulty),
        problem_content: {
          stem: `Complete the ratio table.
              
| A | B |
|---|---|
| ${a} | ${b} |
| ${targetA} | ? |`,
          format: "text",
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
              explanation: `Identify the multiplier. ${targetA} divided by ${a} is ${mult2}. Multiply ${b} by ${mult2}.`,
              math: `${b} \\times ${mult2} = ${answer}`,
              answer: String(answer),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(RatioTablesGenerator);

// ----------------------------------------------------------------------
// 5. Unit Conversion (6.RP.A.3.d)
// ----------------------------------------------------------------------

export const SKILL_6_RP_UNIT_CONVERSION: Skill = {
  id: "6.rp.unit_conversion",
  name: "Convert Measurement Units",
  gradeBand: "6-8",
  prereqs: ["6.rp.ratios", "6.rp.unit_rate"],
  misconceptions: ["wrong_operation"],
  templates: ["T_UNIT_CONV_RP"],
  description: "Use ratio reasoning to convert measurement units",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const UnitConversionRPGenerator: Generator = {
  skillId: SKILL_6_RP_UNIT_CONVERSION.id,
  templateId: "T_UNIT_CONV_RP",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Simple conversions: inches to feet, cm to m, etc.
    const conversions = [
      { from: "feet", to: "inches", rate: 12 },
      { from: "yards", to: "feet", rate: 3 },
      { from: "meters", to: "centimeters", rate: 100 },
      { from: "kilometers", to: "meters", rate: 1000 },
      { from: "pounds", to: "ounces", rate: 16 },
    ];

    const conv = conversions[randomInt(0, conversions.length - 1, rng)];

    // Direction: larger to smaller (mult) or smaller to larger (div)
    // 6th grade often focuses on "using ratio reasoning", so we can frame it as a ratio.

    const val = randomInt(2, 10, rng);
    const res = val * conv.rate;

    return {
      meta: createMockProvenance(SKILL_6_RP_UNIT_CONVERSION.id, difficulty),
      problem_content: {
        stem: `Convert ${val} ${conv.from} to ${conv.to}. (Hint: 1 ${conv.from} = ${conv.rate} ${conv.to})`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(res),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Since 1 ${conv.from} is ${conv.rate} ${conv.to}, multiply ${val} by ${conv.rate}.`,
            math: `${val} \\times ${conv.rate} = ${res}`,
            answer: String(res),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(UnitConversionRPGenerator);
