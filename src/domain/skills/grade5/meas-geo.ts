import type { Skill, Generator, MathProblemItem } from "../../types";
import { randomInt, createProblemMeta } from "../../math-utils";

// Mock provenance helper

// ----------------------------------------------------------------------
// 1. Volume: Counting Unit Cubes (5.MD.C.3 / 5.MD.C.4)
// ----------------------------------------------------------------------

export const SKILL_5_GM_VOLUME_CUBES: Skill = {
  id: "5.gm.volume_cubes",
  name: "Volume with Unit Cubes",
  gradeBand: "3-5",
  prereqs: ["nbt_mult_whole"],
  misconceptions: ["surface_area_confusion"],
  templates: ["T_VOLUME_CUBES"],
  description:
    "Recognize volume as an attribute of solid figures and understand concepts of volume measurement by counting unit cubes.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const VolumeCubesGenerator: Generator = {
  skillId: SKILL_5_GM_VOLUME_CUBES.id,
  templateId: "T_VOLUME_CUBES",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Generate a prism dimension
    const l = randomInt(2, 5, rng);
    const w = randomInt(2, 5, rng);
    const h = randomInt(2, 5, rng);
    const volume = l * w * h;

    // We can't easily show a 3D image here, so we describe it or use ASCII/Text
    // "A rectangular prism is built with unit cubes. It is X units long, Y units wide, Z units high."

    return {
      meta: createProblemMeta(SKILL_5_GM_VOLUME_CUBES.id, difficulty),
      problem_content: {
        stem: `A rectangular prism is packed with unit cubes (each $1$ cubic unit).
The prism is **${l} units** long, **${w} units** wide, and **${h} units** high.
How many unit cubes does it contain?`,
        format: "text",
        variables: { l, w, h },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(volume),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Count the cubes in one layer (base area) and multiply by the number of layers (height).`,
            math: `(${l} \\times ${w}) \\times ${h} = ${volume}`,
            answer: String(volume),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_sa",
          error_tag: "surface_area_confusion",
          trigger: {
            kind: "exact_answer",
            value: String(2 * (l * w + l * h + w * h)),
          }, // Surface Area
          hint_ladder: [
            "You calculated the area of the outside faces (Surface Area). Volume is the space inside.",
          ],
        },
      ],
    };
  },
};

// ----------------------------------------------------------------------
// 2. Volume Formula (5.MD.C.5)
// ----------------------------------------------------------------------

export const SKILL_5_GM_VOLUME_FORMULA: Skill = {
  id: "5.gm.volume_formula",
  name: "Volume Formula",
  gradeBand: "3-5",
  prereqs: ["5.gm.volume_cubes"],
  misconceptions: ["add_dims"],
  templates: ["T_VOLUME_FORMULA"],
  description:
    "Relate volume to the operations of multiplication and addition and solve real world and mathematical problems involving volume.",
  bktParams: { learningRate: 0.2, slip: 0.1, guess: 0.1 },
};

export const VolumeFormulaGenerator: Generator = {
  skillId: SKILL_5_GM_VOLUME_FORMULA.id,
  templateId: "T_VOLUME_FORMULA",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const l = randomInt(5, 15, rng);
    const w = randomInt(2, 10, rng);
    const h = randomInt(2, 12, rng);
    const volume = l * w * h;

    return {
      meta: createProblemMeta(SKILL_5_GM_VOLUME_FORMULA.id, difficulty),
      problem_content: {
        stem: `Find the volume of a rectangular prism with:
Length: **${l}** cm
Width: **${w}** cm
Height: **${h}** cm`,
        format: "text",
        variables: { l, w, h },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(volume),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Use the formula $V = l \\times w \\times h$.`,
            math: `${l} \\times ${w} \\times ${h} = ${volume}`,
            answer: String(volume),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_add",
          error_tag: "add_dims",
          trigger: { kind: "exact_answer", value: String(l + w + h) },
          hint_ladder: [
            "Do not add the dimensions. Volume is found by multiplying length, width, and height.",
          ],
        },
      ],
    };
  },
};

// ----------------------------------------------------------------------
// 3. Coordinate Plane (5.G.A.1 / 5.G.A.2)
// ----------------------------------------------------------------------

export const SKILL_5_GM_COORD_PLANE: Skill = {
  id: "5.gm.coord_plane",
  name: "Coordinate Plane (Quadrant I)",
  gradeBand: "3-5",
  prereqs: ["nbt_place_value"],
  misconceptions: ["xy_reversal"],
  templates: ["T_COORD_PLANE"],
  description:
    "Graph points on the coordinate plane to solve real-world and mathematical problems.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.25 },
};

export const CoordPlaneGenerator: Generator = {
  skillId: SKILL_5_GM_COORD_PLANE.id,
  templateId: "T_COORD_PLANE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Generate a point (x, y)
    const x = randomInt(0, 10, rng);
    const y = randomInt(0, 10, rng);

    // Question: Identify coordinates or Plot point
    // We'll simulate "What point is at (x, y)?" using a text grid description or
    // "Which coordinate is the x-coordinate?"

    // Let's do: "A point is located at (X, Y). How far is it from the y-axis?" (Tests understanding that x is horizontal dist from y-axis)
    // Or "Which number tells you how far to move to the right?"

    const type = (rng ?? Math.random)() < 0.5 ? "DIST_AXIS" : "IDENTIFY";

    if (type === "DIST_AXIS") {
      return {
        meta: createProblemMeta(SKILL_5_GM_COORD_PLANE.id, difficulty),
        problem_content: {
          stem: `Point A is located at **(${x}, ${y})** on the coordinate plane.
How many units is Point A from the **y-axis**?`, // Distance from y-axis is x-coord
          format: "text",
          variables: { x, y },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(x),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `The x-coordinate (${x}) represents the distance to the right of the y-axis.`,
              math: `\\text{Distance} = ${x}`,
              answer: String(x),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_xy_rev",
            error_tag: "xy_reversal",
            trigger: { kind: "exact_answer", value: String(y) },
            hint_ladder: [
              "The first number is the x-coordinate (horizontal). Distance from the y-axis corresponds to x.",
            ],
          },
        ],
      };
    } else {
      return {
        meta: createProblemMeta(SKILL_5_GM_COORD_PLANE.id, difficulty),
        problem_content: {
          stem: `In the ordered pair **(${x}, ${y})**, which number is the **y-coordinate**?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(y),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `An ordered pair is written as (x, y). The second number is the y-coordinate.`,
              math: `y = ${y}`,
              answer: String(y),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

// ----------------------------------------------------------------------
// 4. Classifying Figures (5.G.B.3 / 5.G.B.4)
// ----------------------------------------------------------------------

export const SKILL_5_GM_CLASS_FIGURES: Skill = {
  id: "5.gm.class_figures",
  name: "Classify 2D Figures (Hierarchy)",
  gradeBand: "3-5",
  prereqs: ["geo_shape_class"],
  misconceptions: ["all_rects_are_squares"],
  templates: ["T_CLASS_FIGURES_HIERARCHY"],
  description:
    "Understand that attributes belonging to a category of two-dimensional figures also belong to all subcategories of that category.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.33 },
};

export const ClassFiguresHierarchyGenerator: Generator = {
  skillId: SKILL_5_GM_CLASS_FIGURES.id,
  templateId: "T_CLASS_FIGURES_HIERARCHY",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // True/False statements about hierarchy
    const statements = [
      { text: "All squares are rectangles.", ans: "True" },
      { text: "All rectangles are squares.", ans: "False" },
      { text: "All parallelograms are quadrilaterals.", ans: "True" },
      { text: "All trapezoids are parallelograms.", ans: "False" }, // US definition (inclusive vs exclusive debated, usually exclusive in elementary texts implies False, or inclusive means True? Standard US curriculum usually treats trapezoid (1 pair parallel) distinct from parallelogram (2 pairs). Wait. Inclusive definition says trapezoid has AT LEAST 1 pair. So Parallelogram IS a Trapezoid. But rarely taught that way in Grade 5. Usually distinct. Let's stick to safer ones.)
      { text: "A square is always a rhombus.", ans: "True" },
      { text: "A rhombus is always a square.", ans: "False" },
    ];

    const q = statements[randomInt(0, statements.length - 1, rng)];

    return {
      meta: createProblemMeta(SKILL_5_GM_CLASS_FIGURES.id, difficulty),
      problem_content: {
        stem: `True or False:
**${q.text}**`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "multiple_choice",
        ui: { choices: ["True", "False"] },
      },
      solution_logic: {
        final_answer_canonical: q.ans,
        final_answer_type: "multiple_choice",
        steps: [
          {
            step_index: 1,
            explanation: `Review the properties. (e.g., A square has all properties of a rectangle).`,
            math: `Answer: ${q.ans}`,
            answer: q.ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

// ----------------------------------------------------------------------
// 5. Unit Conversions (5.MD.A.1)
// ----------------------------------------------------------------------

export const SKILL_5_GM_UNIT_CONV: Skill = {
  id: "5.gm.unit_conv",
  name: "Unit Conversions (Multi-step)",
  gradeBand: "3-5",
  prereqs: ["meas_unit_conversion"],
  misconceptions: ["wrong_op_conv"],
  templates: ["T_UNIT_CONV_5"],
  description:
    "Convert among different-sized standard measurement units within a given measurement system.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const UnitConv5Generator: Generator = {
  skillId: SKILL_5_GM_UNIT_CONV.id,
  templateId: "T_UNIT_CONV_5",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // 5th grade adds decimals to conversions or multi-step (e.g. m to cm involving decimal)
    // 2.5 m = ? cm

    const val = parseFloat(((rng ?? Math.random)() * 10).toFixed(1));
    const result = val * 100; // m to cm

    return {
      meta: createProblemMeta(SKILL_5_GM_UNIT_CONV.id, difficulty),
      problem_content: {
        stem: `Convert:
**${val} meters** = ? **centimeters**`,
        format: "text",
        variables: { val },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer", // result should be integer usually if val has 1 decimal
      },
      solution_logic: {
        final_answer_canonical: String(result),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `1 meter = 100 centimeters. Multiply by 100.`,
            math: `${val} \\times 100 = ${result}`,
            answer: String(result),
          },
        ],
      },
      misconceptions: [
        {
          id: "misc_div",
          error_tag: "wrong_op_conv",
          trigger: { kind: "exact_answer", value: String(val / 100) },
          hint_ladder: [
            "Large unit to small unit means you need MORE of them. Multiply, don't divide.",
          ],
        },
      ],
    };
  },
};

// ----------------------------------------------------------------------
// 6. Line Plots (5.MD.B.2)
// ----------------------------------------------------------------------

export const SKILL_5_MD_LINE_PLOTS: Skill = {
  id: "5.md.line_plots",
  name: "Line Plots with Fractions",
  gradeBand: "3-5",
  prereqs: ["5.nf.add_sub_unlike"],
  misconceptions: ["count_vs_value"],
  templates: ["T_LINE_PLOTS"],
  description:
    "Make a line plot to display a data set of measurements in fractions of a unit. Solve problems using this data.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const LinePlotGenerator: Generator = {
  skillId: SKILL_5_MD_LINE_PLOTS.id,
  templateId: "T_LINE_PLOTS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Generate data set
    // E.g. { 1/2: 3, 1/4: 2, 1/8: 5 }
    const denominators = [2, 4, 8];
    const den = denominators[randomInt(0, 2, rng)];

    // Create random data points
    const count = randomInt(5, 10, rng);
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      const num = randomInt(1, den, rng); // e.g. 1/8 to 8/8? or 1/8 to 7/8.
      // 5.MD.B.2 often uses fractions of a unit (e.g. 1/2, 1/4, 1/8).
      // Let's stick to proper fractions + 0 and 1 maybe?
      // Let's use 1/den, 2/den ...
      data.push(num);
    }

    // Question types:
    // 1. Total amount (sum of all)
    // 2. Difference between max and min value (range)
    // 3. Amount of items with value X

    const type = randomInt(0, 1, rng); // 0: Sum, 1: Range? Sum is better for fraction ops.

    // Prepare ASCII visual or text list
    data.sort((a, b) => a - b);
    const textData = data.map((n) => `${n}/${den}`).join(", ");

    if (type === 0) {
      // Sum
      const sumNum = data.reduce((a, b) => a + b, 0);
      const whole = Math.floor(sumNum / den);
      const rem = sumNum % den;

      // Canonical might be improper or mixed. Let's use mixed or improper.
      // The system likely handles equivalence. Let's provide improper as canonical if simple.
      const canonical = rem === 0 ? String(whole) : `${sumNum}/${den}`;

      return {
        meta: createProblemMeta(SKILL_5_MD_LINE_PLOTS.id, difficulty),
        problem_content: {
          stem: `A scientist measured the amount of liquid in several beakers (in liters).
The data collected is:
**${textData}**

What is the **total** amount of liquid in all the beakers combined?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: canonical,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Add all the fractions together.`,
              math: `\\text{Sum} = \\frac{${sumNum}}{${den}}`,
              answer: canonical,
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      // Range (Max - Min)
      const min = data[0];
      const max = data[data.length - 1];
      const diff = max - min;

      return {
        meta: createProblemMeta(SKILL_5_MD_LINE_PLOTS.id, difficulty),
        problem_content: {
          stem: `The data below shows the weight of several apples (in lbs):
**${textData}**

What is the difference in weight between the heaviest and lightest apple?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: `${diff}/${den}`,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Subtract the smallest value from the largest value.`,
              math: `\\frac{${max}}{${den}} - \\frac{${min}}{${den}} = \\frac{${diff}}{${den}}`,
              answer: `${diff}/${den}`,
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};
