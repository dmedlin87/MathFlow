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
  prereqs: ["4.meas.area_perimeter"],
  misconceptions: ["area_perimeter_confusion", "triangle_formula"],
  templates: ["T_AREA_POLY"],
  description: "Find the area of right triangles, other triangles, special quadrilaterals, and polygons",
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

    if (type === 0) { // Rectangle / Parallelogram
       const area = b * h;
       const shape = (rng ?? Math.random)() < 0.5 ? "rectangle" : "parallelogram";

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
             }
           ]
         },
         misconceptions: [
           {
             id: "misc_perim",
             error_tag: "area_perimeter_confusion",
             trigger: { kind: "exact_answer", value: String(2*(b+h)) },
             hint_ladder: ["You calculated the perimeter. Area involves multiplication of dimensions."],
           }
         ],
       };
    } else { // Triangle
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
             }
           ]
         },
         misconceptions: [
            {
             id: "misc_tri_rect",
             error_tag: "triangle_formula",
             trigger: { kind: "exact_answer", value: String(b*h) },
             hint_ladder: ["Don't forget to multiply by 1/2 (or divide by 2) for a triangle."],
           }
         ],
       };
    }
  }
};

engine.register(AreaPolyGenerator);
