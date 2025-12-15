import type { Skill, Generator, MathProblemItem } from "../types";
import { engine } from "../generator/engine";

// Helper to get random integer
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

    let w = randomInt(3, 12, rng);
    let l = isSquare ? w : randomInt(w + 1, 15, rng);

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
        meta: createMockProvenance(SKILL_AREA_PERIMETER.id, difficulty),
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
        meta: createMockProvenance(SKILL_AREA_PERIMETER.id, difficulty),
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
      meta: createMockProvenance(SKILL_UNIT_CONVERSION.id, difficulty),
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
          trigger: { kind: "manual", value: "impossible" }, // Hard to predict exact wrong factor chosen
          hint_ladder: [
            `Did you use the correct conversion factor? 1 ${rule.from} is ${rule.factor} ${rule.to}.`,
          ],
        },
      ],
    };
  },
};

engine.register(UnitConversionGenerator);

// --- 3. Geometry: Lines & Angles (4.G.A.1) ---

export const SKILL_GEO_LINES_ANGLES: Skill = {
  id: "geo_lines_angles",
  name: "Lines and Angles",
  gradeBand: "3-5",
  prereqs: [],
  misconceptions: ["confuse_parallel_perp", "confuse_acute_obtuse"],
  templates: ["T_LINES_ANGLES"],
  description:
    "Draw and identify points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.25 },
};

export const GeometryGenerator: Generator = {
  templateId: "T_LINES_ANGLES",
  skillId: SKILL_GEO_LINES_ANGLES.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Concept checks
    // Types:
    // 1. Angle Classification (Acute vs Obtuse vs Right)
    // 2. Line Relationship (Parallel vs Perpendicular)

    const type = (rng ?? Math.random)() > 0.5 ? "ANGLE" : "LINE";

    if (type === "ANGLE") {
      // Generate an angle in degrees
      // <90 = Acute, 90 = Right, >90 = Obtuse
      const deg = randomInt(10, 170, rng);
      let classification = "Acute";
      if (deg === 90) classification = "Right"; // Rare exactly 90
      else if (deg > 90) classification = "Obtuse";
      else classification = "Acute";

      // Override to ensure even distribution if needed, but random is okay.
      // Let's force specific types based on sub-range logic to ensure coverage?
      // Nah, random is fine.

      return {
        meta: createMockProvenance(SKILL_GEO_LINES_ANGLES.id, difficulty),
        problem_content: {
          stem: `An angle measures **${deg} degrees**.
Is it Acute, Right, or Obtuse?`,
          format: "text",
          variables: { deg },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          choices: ["Acute", "Right", "Obtuse"],
        },
        solution_logic: {
          final_answer_canonical: classification,
          final_answer_type: "string",
          steps: [
            {
              step_index: 1,
              explanation: `Compare the angle to 90°. < 90 is Acute. > 90 is Obtuse. = 90 is Right.`,
              math: `${deg} is ${
                classification === "Right"
                  ? "equal to"
                  : classification === "Acute"
                  ? "less than"
                  : "greater than"
              } 90.`,
              answer: classification,
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      // Lines
      const isParallel = (rng ?? Math.random)() > 0.5;
      const term = isParallel ? "Parallel" : "Perpendicular";
      const definition = isParallel
        ? "never intersect"
        : "intersect at a right angle (90°)";

      return {
        meta: createMockProvenance(SKILL_GEO_LINES_ANGLES.id, difficulty),
        problem_content: {
          stem: `Two lines in a plane that **${definition}** are called...`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          choices: ["Parallel", "Perpendicular", "Intersecting"],
        },
        solution_logic: {
          final_answer_canonical: term,
          final_answer_type: "string",
          steps: [
            {
              step_index: 1,
              explanation: `Recalling definitions: Parallel lines never meet. Perpendicular lines meet at right angles.`,
              math: `Answer: ${term}`,
              answer: term,
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(GeometryGenerator);

// --- 4. Symmetry (4.G.A.3) ---

export const SKILL_SYMMETRY: Skill = {
  id: "geo_symmetry",
  name: "Line Symmetry",
  gradeBand: "3-5",
  prereqs: [],
  misconceptions: ["confuse_diagonal_symmetry"],
  templates: ["T_SYMMETRY"],
  description: "Recognize a line of symmetry for a two-dimensional figure.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.25 },
};

export const SymmetryGenerator: Generator = {
  templateId: "T_SYMMETRY",
  skillId: SKILL_SYMMETRY.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Shapes with known symmetry lines
    const shapes = [
      { name: "Square", lines: 4 },
      { name: "Rectangle (non-square)", lines: 2 },
      { name: "Equilateral Triangle", lines: 3 },
      { name: "Isosceles Triangle (non-equilateral)", lines: 1 },
      { name: "Circle", lines: "Infinite" },
      { name: "Letter A", lines: 1 },
      { name: "Letter H", lines: 2 },
    ];

    const shape = shapes[randomInt(0, shapes.length - 1, rng)];

    return {
      meta: createMockProvenance(SKILL_SYMMETRY.id, difficulty),
      problem_content: {
        stem: `How many lines of symmetry does a **${shape.name}** have?`,
        format: "text",
        variables: { shape: shape.name },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "string", // Accept "4", "2", "Infinite"
      },
      solution_logic: {
        final_answer_canonical: String(shape.lines),
        final_answer_type: "string",
        steps: [
          {
            step_index: 1,
            explanation: `A line of symmetry folds the shape into two matching halves.`,
            math: `The ${shape.name} has ${shape.lines} such line(s).`,
            answer: String(shape.lines),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(SymmetryGenerator);
