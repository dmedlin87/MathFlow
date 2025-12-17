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
// 1. Area of Polygons (6.G.A.1)
// ----------------------------------------------------------------------

export const SKILL_6_G_AREA: Skill = {
  id: "6.g.area",
  name: "Area of Triangles and Quadrilaterals",
  gradeBand: "6-8",
  prereqs: ["meas_area_perimeter"],
  misconceptions: ["area_perimeter_confusion", "triangle_formula"],
  templates: ["T_AREA_POLY"],
  description:
    "Find the area of right triangles, other triangles, special quadrilaterals, and polygons",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const AreaPolyGenerator: Generator = {
  skillId: SKILL_6_G_AREA.id,
  templateId: "T_AREA_POLY",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type: Rectangle, Triangle, Parallelogram
    const type = Math.floor((rng ?? Math.random)() * 3);
    const b = randomInt(2, 12, rng);
    const h = randomInt(2, 12, rng);

    if (type === 0) {
      // Rectangle / Parallelogram
      const area = b * h;
      const shape =
        (rng ?? Math.random)() < 0.5 ? "rectangle" : "parallelogram";

      return {
        meta: createMockProvenance(SKILL_6_G_AREA.id, difficulty),
        problem_content: {
          stem: `Find the area of a ${shape} with base ${b} units and height ${h} units.`,
          format: "text",
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
              explanation: `Area = base × height`,
              math: `A = ${b} \\times ${h} = ${area}`,
              answer: String(area),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_perim",
            error_tag: "area_perimeter_confusion",
            trigger: { kind: "exact_answer", value: String(2 * (b + h)) },
            hint_ladder: [
              "You calculated the perimeter. Area involves multiplication of dimensions.",
            ],
          },
        ],
      };
    } else {
      // Triangle
      const area = 0.5 * b * h;
      const isInt = area % 1 === 0;
      const stem = `Find the area of a triangle with base ${b} units and height ${h} units.`;

      return {
        meta: createMockProvenance(SKILL_6_G_AREA.id, difficulty),
        problem_content: {
          stem,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: isInt ? "integer" : "decimal",
        },
        solution_logic: {
          final_answer_canonical: String(area),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Area of a triangle is 1/2 × base × height.`,
              math: `A = 0.5 \\times ${b} \\times ${h} = ${area}`,
              answer: String(area),
            },
          ],
        },
        misconceptions: [
          {
            id: "misc_tri_rect",
            error_tag: "triangle_formula",
            trigger: { kind: "exact_answer", value: String(b * h) },
            hint_ladder: [
              "Don't forget to multiply by 1/2 (or divide by 2) for a triangle.",
            ],
          },
        ],
      };
    }
  },
};

engine.register(AreaPolyGenerator);

const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// ----------------------------------------------------------------------
// 2. Surface Area (6.G.A.4)
// ----------------------------------------------------------------------
export const SKILL_6_G_SURFACE_AREA: Skill = {
  id: "6.g.surface_area",
  name: "Surface Area",
  gradeBand: "6-8",
  prereqs: ["6.g.area", "meas_area_perimeter"],
  misconceptions: ["volume_vs_surface_area"],
  templates: ["T_SURFACE_AREA"],
  description: "Find surface area of figures using nets",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const SurfaceAreaGenerator: Generator = {
  skillId: SKILL_6_G_SURFACE_AREA.id,
  templateId: "T_SURFACE_AREA",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Cube or Rectangular Prism
    // Cube: side s. SA = 6*s^2
    // Prism: l, w, h. SA = 2(lw + lh + wh)

    const isCube = (rng ?? Math.random)() < 0.4;

    if (isCube) {
      const s = randomInt(2, 10, rng);
      const sa = 6 * s * s;
      return {
        meta: createMockProvenance(SKILL_6_G_SURFACE_AREA.id, difficulty),
        problem_content: {
          stem: `Find the surface area of a cube with side length ${s} units.`,
          format: "text",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(sa),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `A cube has 6 separate square faces. Area of one face is ${s}*${s} = ${
                s * s
              }. Total SA = 6 * ${s * s} = ${sa}.`,
              math: `6 \\times ${s}^2 = ${sa}`,
              answer: String(sa),
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      const l = randomInt(2, 10, rng);
      const w = randomInt(2, 10, rng);
      const h = randomInt(2, 10, rng);
      const sa = 2 * (l * w + l * h + w * h);

      return {
        meta: createMockProvenance(SKILL_6_G_SURFACE_AREA.id, difficulty),
        problem_content: {
          stem: `Find the surface area of a rectangular prism with length=${l}, width=${w}, and height=${h}.`,
          format: "text",
        },
        answer_spec: { answer_mode: "final_only", input_type: "integer" },
        solution_logic: {
          final_answer_canonical: String(sa),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Sum the areas of all 6 faces: 2(lw) + 2(lh) + 2(wh).`,
              math: `2(${l}\\times${w} + ${l}\\times${h} + ${w}\\times${h}) = ${sa}`,
              answer: String(sa),
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(SurfaceAreaGenerator);

// ----------------------------------------------------------------------
// 3. Volume with Fractions (6.G.A.2)
// ----------------------------------------------------------------------
export const SKILL_6_G_VOLUME_FRAC: Skill = {
  id: "6.g.volume_frac",
  name: "Volume with Fractions",
  gradeBand: "6-8",
  prereqs: ["5.gm.volume_formula", "6.ns.div_fractions"],
  misconceptions: ["add_dims"],
  templates: ["T_VOLUME_FRAC"],
  description: "Find volume of rectangular prisms with fractional edge lengths",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const VolumeFracGenerator: Generator = {
  skillId: SKILL_6_G_VOLUME_FRAC.id,
  templateId: "T_VOLUME_FRAC",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // l = 1/2, w = 3/4, h = 2
    // V = lwh

    const lNum = randomInt(1, 4, rng);
    const lDen = randomInt(2, 5, rng);
    const wNum = randomInt(1, 4, rng);
    const wDen = randomInt(2, 5, rng);
    const h = randomInt(2, 10, rng); // keep height integer for simplicity or also fraction

    const volNum = lNum * wNum * h;
    const volDen = lDen * wDen;
    // simplify?
    const common = gcd(volNum, volDen);
    const num = volNum / common;
    const den = volDen / common;

    const canonical = den === 1 ? String(num) : `${num}/${den}`;

    return {
      meta: createMockProvenance(SKILL_6_G_VOLUME_FRAC.id, difficulty),
      problem_content: {
        stem: `Find the volume of a rectangular prism with length $\\frac{${lNum}}{${lDen}}$, width $\\frac{${wNum}}{${wDen}}$, and height ${h}.`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "fraction" },
      solution_logic: {
        final_answer_canonical: canonical,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Volume = Length * Width * Height`,
            math: `\\frac{${lNum}}{${lDen}} \\times \\frac{${wNum}}{${wDen}} \\times ${h} = ${canonical}`,
            answer: canonical,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(VolumeFracGenerator);

// ----------------------------------------------------------------------
// 4. Polygons in Coordinate Plane (6.G.A.3)
// ----------------------------------------------------------------------
export const SKILL_6_G_POLYGONS_COORD: Skill = {
  id: "6.g.polygons_coord",
  name: "Polygons in Coordinate Plane",
  gradeBand: "6-8",
  prereqs: ["6.ns.coord_plane"],
  misconceptions: ["distance_axis"],
  templates: ["T_POLYGONS_COORD"],
  description: "Draw polygons in the coordinate plane and find side lengths",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const PolygonsCoordGenerator: Generator = {
  skillId: SKILL_6_G_POLYGONS_COORD.id,
  templateId: "T_POLYGONS_COORD",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // "Vertices are (2, 5) and (2, 9). What is the length of this side?"
    // Or "Find the perimeter of rectangle..."

    const x = randomInt(-10, 10, rng);
    const y1 = randomInt(-10, 10, rng);
    const y2 = randomInt(-10, 10, rng);

    if (y1 === y2) return PolygonsCoordGenerator.generate(difficulty, rng); // retry

    const dist = Math.abs(y1 - y2);

    return {
      meta: createMockProvenance(SKILL_6_G_POLYGONS_COORD.id, difficulty),
      problem_content: {
        stem: `The endpoints of a line segment are points $(${x}, ${y1})$ and $(${x}, ${y2})$. What is the length of the segment?`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "integer" },
      solution_logic: {
        final_answer_canonical: String(dist),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Since x-coordinates are the same, subtract the y-coordinates absolute values.`,
            math: `|${y1} - ${y2}| = ${dist}`,
            answer: String(dist),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(PolygonsCoordGenerator);
