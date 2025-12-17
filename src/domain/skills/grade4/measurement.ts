import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";
import { randomInt, createProblemMeta } from "../../math-utils";

// --- 1. Area & Perimeter (4.MD.A.3) ---

export const SKILL_AREA_PERIMETER: Skill = {
  id: "meas_area_perimeter",
  name: "Area and Perimeter of Rectangles",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_2digit", "nbt_add_sub_multi"],
  misconceptions: [
    "confuse_area_perimeter",
    "add_all_sides_for_area",
    "multiply_sides_for_perimeter",
  ],
  templates: ["T_AREA_PERIMETER"],
  description:
    "Apply the area and perimeter formulas for rectangles in real world and mathematical problems.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const AreaPerimeterGenerator: Generator = {
  templateId: "T_AREA_PERIMETER",
  skillId: SKILL_AREA_PERIMETER.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Core shapes: Rectangle, Square
    const isSquare = (rng ?? Math.random)() > 0.8;

    const w = randomInt(3, 12, rng);
    const l = isSquare ? w : randomInt(w + 1, 15, rng);

    // Mode:
    // 0: Find Area
    // 1: Find Perimeter
    // 2: Find missing side given Area? (Higher difficulty)

    let mode = "AREA";
    if ((rng ?? Math.random)() > 0.5) mode = "PERIMETER";

    const area = l * w;
    const perimeter = 2 * (l + w);

    // Misconceptions
    // Confuse Area/Perimeter: Give perim for area, area for perim
    const wrongArea = perimeter;
    const wrongPerimeter = area;

    if (mode === "AREA") {
      return {
        meta: createProblemMeta(SKILL_AREA_PERIMETER.id, difficulty),
        problem_content: {
          stem: `A rectangle has a length of ${l} units and a width of ${w} units.
What is the **Area** of the rectangle?`,
          format: "text",
          variables: { l, w },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(area),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `The formula for Area is Length × Width.`,
              math: `A = ${l} \\times ${w} = ${area}`,
              answer: String(area),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_confuse_ap",
            error_tag: "confuse_area_perimeter",
            trigger: { kind: "exact_answer", value: String(wrongArea) },
            hint_ladder: [
              `You calculated the Perimeter (distance around). Area is the space inside (Length × Width).`,
            ],
          },
        ],
      };
    } else {
      return {
        meta: createProblemMeta(SKILL_AREA_PERIMETER.id, difficulty),
        problem_content: {
          stem: `A rectangle has a length of ${l} units and a width of ${w} units.
What is the **Perimeter** of the rectangle?`,
          format: "text",
          variables: { l, w },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(perimeter),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `The formula for Perimeter is 2 × (Length + Width) or adding all four sides.`,
              math: `P = 2 \\times (${l} + ${w}) = ${perimeter}`,
              answer: String(perimeter),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_confuse_ap",
            error_tag: "confuse_area_perimeter",
            trigger: { kind: "exact_answer", value: String(wrongPerimeter) },
            hint_ladder: [
              `You calculated the Area (space inside). Perimeter is the distance around (add all sides).`,
            ],
          },
        ],
      };
    }
  },
};

engine.register(AreaPerimeterGenerator);

// --- 2. Unit Conversions (4.MD.A.1) ---

export const SKILL_UNIT_CONVERSION: Skill = {
  id: "meas_unit_conversion",
  name: "Convert Measurement Units",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_2digit"],
  misconceptions: ["wrong_conversion_factor", "reverse_operation"],
  templates: ["T_UNIT_CONVERSION"],
  description:
    "Know relative sizes of measurement units within one system of units. Convert a larger unit to a smaller unit.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

interface ConversionRule {
  category: string;
  from: string;
  to: string;
  factor: number;
}

export const UnitConversionGenerator: Generator = {
  templateId: "T_UNIT_CONVERSION",
  skillId: SKILL_UNIT_CONVERSION.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Supported conversions (Grade 4 usually Large -> Small)
    const rules: ConversionRule[] = [
      { category: "Length", from: "ft", to: "in", factor: 12 },
      { category: "Length", from: "m", to: "cm", factor: 100 },
      { category: "Length", from: "km", to: "m", factor: 1000 },
      { category: "Weight", from: "kg", to: "g", factor: 1000 },
      { category: "Weight", from: "lb", to: "oz", factor: 16 },
      { category: "Time", from: "hr", to: "min", factor: 60 },
      { category: "Time", from: "min", to: "sec", factor: 60 },
    ];

    const rule = rules[randomInt(0, rules.length - 1, rng)];

    // Input value
    const val = randomInt(2, 12, rng); // keep numbers simple for concept check

    const result = val * rule.factor;

    return {
      meta: createProblemMeta(SKILL_UNIT_CONVERSION.id, difficulty),
      problem_content: {
        stem: `Convert **${val} ${rule.from}** to **${rule.to}**.`,
        format: "text",
        variables: { val, from: rule.from, to: rule.to },
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
            explanation: `Know the relationship: 1 ${rule.from} = ${rule.factor} ${rule.to}.`,
            math: `\\text{Relation: } 1 \\text{ ${rule.from}} = ${rule.factor} \\text{ ${rule.to}}`,
            answer: String(rule.factor),
          },
          {
            step_index: 2,
            explanation: `Multiply the number of ${rule.from} by ${rule.factor}.`,
            math: `${val} \\times ${rule.factor} = ${result}`,
            answer: String(result),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_bad_factor",
          error_tag: "wrong_conversion_factor",
          trigger: { kind: "predicate", value: "check_conversion_factor" },
          hint_ladder: [
            `Did you use the correct conversion factor? 1 ${rule.from} is ${rule.factor} ${rule.to}.`,
          ],
        },
      ],
    };
  },
};

engine.register(UnitConversionGenerator);

// --- 5. Geometric Measurement: Angles (4.MD.C.5-7) ---

export const SKILL_ANGLES_MEASURE: Skill = {
  id: "meas_angles",
  name: "Angle Measurement and Properties",
  gradeBand: "3-5",
  prereqs: ["geo_lines_angles"], // Note: Refers to skill in geometry.ts, but standard string ref so OK.
  misconceptions: ["confuse_angle_turn"],
  templates: ["T_ANGLE_ADDITIVE"],
  description:
    "Recognize angles as geometric shapes that are formed wherever two rays share a common endpoint. Understand angle measure as additive.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const AngleMeasureGenerator: Generator = {
  templateId: "T_ANGLE_ADDITIVE",
  skillId: SKILL_ANGLES_MEASURE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Mode A: Additive Angles (Part + Part = Total)
    // Mode B: Degrees in circles/turns (1/4 turn = 90 deg)

    const mode = (rng ?? Math.random)() > 0.4 ? "ADDITIVE" : "TURNS";

    if (mode === "ADDITIVE") {
      // Two adjacent angles sum to a larger angle.
      // Ask for the missing part or the total.
      const angle1 = randomInt(20, 60, rng);
      const angle2 = randomInt(15, 50, rng);
      const total = angle1 + angle2;

      // Question type: Find Total (A+B) or Find Part (Total - A)
      const findTotal = (rng ?? Math.random)() > 0.5;

      if (findTotal) {
        return {
          meta: createProblemMeta(SKILL_ANGLES_MEASURE.id, difficulty),
          problem_content: {
            stem: `Angle $ABD$ measures $${angle1}^\\circ$.
Angle $DBC$ measures $${angle2}^\\circ$.
Angle $ABD$ and $DBC$ are adjacent and form Angle $ABC$.
What is the measure of Angle $ABC$?`,
            format: "latex",
            variables: { angle1, angle2 },
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "integer",
          },
          solution_logic: {
            final_answer_canonical: String(total),
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `Since the angles are adjacent, add their measures to find the total.`,
                math: `${angle1} + ${angle2} = ${total}`,
                answer: String(total),
              },
            ],
          },
          misconceptions: [],
        };
      } else {
        return {
          meta: createProblemMeta(SKILL_ANGLES_MEASURE.id, difficulty),
          problem_content: {
            stem: `Angle $ABC$ measures $${total}^\\circ$.
It is split into two smaller angles, $ABD$ and $DBC$.
If angle $ABD$ is $${angle1}^\\circ$, what is the measure of angle $DBC$?`,
            format: "latex",
            variables: { total, angle1 },
          },
          answer_spec: {
            answer_mode: "final_only",
            input_type: "integer",
          },
          solution_logic: {
            final_answer_canonical: String(angle2),
            final_answer_type: "numeric",
            steps: [
              {
                step_index: 1,
                explanation: `Subtract the known part from the total angle.`,
                math: `${total} - ${angle1} = ${angle2}`,
                answer: String(angle2),
              },
            ],
          },
          misconceptions: [],
        };
      }
    } else {
      // Turns and Circles
      // 1 full turn = 360, 1/2 = 180, 1/4 = 90
      const fracs = [
        { num: 1, den: 4, deg: 90 },
        { num: 1, den: 2, deg: 180 },
        { num: 3, den: 4, deg: 270 },
        { num: 1, den: 1, deg: 360 },
      ];
      const choice = fracs[randomInt(0, fracs.length - 1, rng)];

      return {
        meta: createProblemMeta(SKILL_ANGLES_MEASURE.id, difficulty),
        problem_content: {
          stem: `A circle measures $360^\\circ$.
How many degrees are in a **${choice.num}/${choice.den}** turn?`,
          format: "text",
          variables: { n: choice.num, d: choice.den },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(choice.deg),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Multiply the fraction of the turn by 360.`,
              math: `\\frac{${choice.num}}{${choice.den}} \\times 360 = ${choice.deg}`,
              answer: String(choice.deg),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(AngleMeasureGenerator);

// --- 8. Money Word Problems (4.MD.A.2) ---

export const SKILL_MONEY_WORD_PROBLEMS: Skill = {
  id: "meas_money_word_problems",
  name: "Solve Money Word Problems",
  gradeBand: "3-5",
  prereqs: ["nbt_add_sub_multi", "dec_notation_01"],
  misconceptions: ["decimal_alignment", "cents_notation"],
  templates: ["T_MONEY_WORD_PROBLEM"],
  description:
    "Solve word problems involving money, including simple addition and subtraction of money amounts.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const MoneyWordProblemGenerator: Generator = {
  templateId: "T_MONEY_WORD_PROBLEM",
  skillId: SKILL_MONEY_WORD_PROBLEMS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Scenario: Shopping
    // 1. Total Cost
    // 2. Change Calculation

    const price1 = randomInt(1, 15, rng) + randomInt(0, 99, rng) / 100;
    const price2 = randomInt(1, 10, rng) + randomInt(0, 99, rng) / 100;

    // Use fixed precision to avoid floating point weirdness
    const p1Fixed = Number(price1.toFixed(2));
    const p2Fixed = Number(price2.toFixed(2));
    const total = Number((p1Fixed + p2Fixed).toFixed(2));

    const mode = (rng ?? Math.random)() > 0.5 ? "TOTAL" : "CHANGE";

    if (mode === "TOTAL") {
      return {
        meta: createProblemMeta(SKILL_MONEY_WORD_PROBLEMS.id, difficulty),
        problem_content: {
          stem: `Alice buys a book for **$${p1Fixed.toFixed(
            2
          )}** and a pen for **$${p2Fixed.toFixed(2)}**.
How much did she spend in total?`,
          format: "text",
          variables: { p1: p1Fixed, p2: p2Fixed },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
          ui: { placeholder: "0.00" },
        },
        solution_logic: {
          final_answer_canonical: total.toFixed(2),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Align the decimal points and add.`,
              math: `$${p1Fixed.toFixed(2)} + $${p2Fixed.toFixed(
                2
              )} = $${total.toFixed(2)}`,
              answer: total.toFixed(2),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_dec_align",
            error_tag: "decimal_alignment",
            trigger: { kind: "predicate", value: "check_alignment" },
            hint_ladder: [
              "Make sure to line up the decimal points when adding.",
            ],
          },
        ],
      };
    } else {
      // Change
      const paid = Math.ceil(total / 5) * 5; // e.g. 20
      // Ensure paid > total
      const paidAmt = paid === total ? paid + 5 : paid;
      const change = Number((paidAmt - total).toFixed(2));

      return {
        meta: createProblemMeta(SKILL_MONEY_WORD_PROBLEMS.id, difficulty),
        problem_content: {
          stem: `Bob buys a toy for **$${total.toFixed(
            2
          )}**. He pays with a **$${paidAmt}** bill.
How much change should he receive?`,
          format: "text",
          variables: { total, paid: paidAmt },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "decimal",
          ui: { placeholder: "0.00" },
        },
        solution_logic: {
          final_answer_canonical: change.toFixed(2),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Subtract the cost from the amount paid.`,
              math: `$${paidAmt.toFixed(2)} - $${total.toFixed(
                2
              )} = $${change.toFixed(2)}`,
              answer: change.toFixed(2),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(MoneyWordProblemGenerator);

// --- 9. Protractor Measurement (4.MD.C.6) ---

export const SKILL_PROTRACTOR_MEASURE: Skill = {
  id: "meas_protractor",
  name: "Measure Angles with a Protractor",
  gradeBand: "3-5",
  prereqs: ["geo_lines_angles", "meas_angles"],
  misconceptions: ["read_wrong_scale"],
  templates: ["T_PROTRACTOR"],
  description:
    "Measure angles in whole-number degrees using a protractor. Sketch angles of specified measure.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const ProtractorGenerator: Generator = {
  templateId: "T_PROTRACTOR",
  skillId: SKILL_PROTRACTOR_MEASURE.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Simulate a protractor reading.
    // "One ray is at 0 degrees. The other ray crosses the scale at X degrees."
    // Or harder: "One ray is at 20 degrees. The other is at 80 degrees."

    const startAngle = difficulty < 0.5 ? 0 : randomInt(10, 50, rng);
    const angleSize = randomInt(20, 160, rng);
    const endAngle = startAngle + angleSize;

    // Protractor has inner and outer scales.
    // Inner: 0 to 180 (Right to Left)
    // Outer: 180 to 0 (Right to Left) -> actually 0 to 180 (Left to Right)
    // Let's assume standard position for simplicity or describe the crossing.

    // Misconception: Reading the supplement (wrong scale).
    // e.g. Angle is 60. Crosses at 60 and 120. User says 120.
    const wrongScale = 180 - angleSize;

    return {
      meta: createProblemMeta(SKILL_PROTRACTOR_MEASURE.id, difficulty),
      problem_content: {
        stem: `An angle is being measured with a protractor.
One ray of the angle points to **${startAngle}°**.
The other ray points to **${endAngle}°**.
What is the measure of the angle in degrees?`,
        format: "text",
        variables: { start: startAngle, end: endAngle },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(angleSize),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Find the difference between the two markings.`,
            math: `${endAngle} - ${startAngle} = ${angleSize}`,
            answer: String(angleSize),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_wrong_scale",
          error_tag: "read_wrong_scale",
          trigger: { kind: "exact_answer", value: String(wrongScale) },
          hint_ladder: [
            `Did you read the wrong scale? The angle looks ${
              angleSize < 90 ? "Acute (small)" : "Obtuse (wide)"
            }.`,
          ],
        },
      ],
    };
  },
};

engine.register(ProtractorGenerator);
