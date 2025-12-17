import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";
import { randomInt, createProblemMeta } from "../../math-utils";

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

      return {
        meta: createProblemMeta(SKILL_GEO_LINES_ANGLES.id, difficulty),
        problem_content: {
          stem: `An angle measures **${deg} degrees**.
Is it Acute, Right, or Obtuse?`,
          format: "text",
          variables: { deg },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          ui: {
            choices: ["Acute", "Right", "Obtuse"],
          },
        },
        solution_logic: {
          final_answer_canonical: classification,
          final_answer_type: "multiple_choice",
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
        meta: createProblemMeta(SKILL_GEO_LINES_ANGLES.id, difficulty),
        problem_content: {
          stem: `Two lines in a plane that **${definition}** are called...`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "multiple_choice",
          ui: {
            choices: ["Parallel", "Perpendicular", "Intersecting"],
          },
        },
        solution_logic: {
          final_answer_canonical: term,
          final_answer_type: "multiple_choice",
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
      meta: createProblemMeta(SKILL_SYMMETRY.id, difficulty),
      problem_content: {
        stem: `How many lines of symmetry does a **${shape.name}** have?`,
        format: "text",
        variables: { shape: shape.name },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer", // Accept "4" as number
      },
      solution_logic: {
        final_answer_canonical: String(shape.lines),
        final_answer_type: "numeric",
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

// --- 7. Shape Classification (4.G.A.2) ---

export const SKILL_SHAPE_CLASSIFICATION: Skill = {
  id: "geo_shape_class",
  name: "Classify 2D Shapes",
  gradeBand: "3-5",
  prereqs: ["geo_lines_angles"],
  misconceptions: ["square_rect_confusion"],
  templates: ["T_SHAPE_CLASS"],
  description:
    "Classify two-dimensional figures based on the presence or absence of parallel or perpendicular lines, or the presence or absence of angles of a specified size. Recognize right triangles as a category, and identify right triangles.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.25 },
};

export const ShapeClassificationGenerator: Generator = {
  templateId: "T_SHAPE_CLASS",
  skillId: SKILL_SHAPE_CLASSIFICATION.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Riddles / Property checks
    const questions = [
      {
        clues:
          "I have 4 sides. Opposite sides are parallel. All 4 angles are right angles. I am not a square (my sides are not all equal).",
        ans: "Rectangle",
        choices: ["Trapezoid", "Rhombus", "Rectangle", "Square"],
      },
      {
        clues:
          "I have 3 sides. One of my angles is a right angle (90 degrees).",
        ans: "Right Triangle",
        choices: [
          "Acute Triangle",
          "Obtuse Triangle",
          "Right Triangle",
          "Equilateral Triangle",
        ],
      },
      {
        clues: "I have 4 sides. I have exactly one pair of parallel sides.",
        ans: "Trapezoid",
        choices: ["Parallelogram", "Trapezoid", "Rectangle", "Square"],
      },
      {
        clues:
          "I have 4 sides. All my sides are the same length. Opposite sides are parallel. I do not necessarily have right angles.",
        ans: "Rhombus",
        choices: ["Square", "Rhombus", "Rectangle", "Trapezoid"],
      },
    ];

    const q = questions[randomInt(0, questions.length - 1, rng)];

    return {
      meta: createProblemMeta(SKILL_SHAPE_CLASSIFICATION.id, difficulty),
      problem_content: {
        stem: `Identify the shape based on the clues:
"${q.clues}"`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "multiple_choice",
        ui: {
          choices: q.choices,
        },
      },
      solution_logic: {
        final_answer_canonical: q.ans,
        final_answer_type: "multiple_choice",
        steps: [
          {
            step_index: 1,
            explanation: `Match properties to the definition.`,
            math: `Answer: ${q.ans}`,
            answer: q.ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(ShapeClassificationGenerator);
