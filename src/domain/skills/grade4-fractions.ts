import type { Skill, Generator, MathProblemItem } from '../types';
import { engine } from '../generator/engine';
import { gcd } from '../math-utils';

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

// Helper to create mock provenance for V0 runtime generation
const createMockProvenance = (skillId: string, diff: number): MathProblemItem['meta'] => ({
    id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: 1,
    skill_id: skillId,
    difficulty: Math.ceil(diff * 5) || 1,
    created_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    status: 'VERIFIED',
    provenance: {
        generator_model: 'v0-rule-based-engine',
        critic_model: 'v0-simulation',
        judge_model: 'v0-simulation',
        verifier: {
            type: 'numeric',
            passed: true
        },
        attempt: 1
    },
    verification_report: {
        rubric_scores: {
            solvability: 1,
            ambiguity: 0,
            procedural_correctness: 1,
            pedagogical_alignment: 1
        },
        underspecified: false,
        issues: []
    }
});

// --- 1. Equivalent Fractions ---

export const SKILL_EQUIV_FRACTIONS: Skill = {
  id: 'frac_equiv_01',
  name: 'Recognize equivalent fractions',
  gradeBand: '3-5',
  prereqs: [],
  misconceptions: ['add_num_add_den'],
  templates: ['T_EQUIV_FRACTION_FIND'],
  description: 'Understand that fractions can look different but have the same value.',
  bktParams: {
    learningRate: 0.15,
    slip: 0.05,
    guess: 0.25 
  }
};

export const EquivFractionGenerator: Generator = {
  templateId: 'T_EQUIV_FRACTION_FIND',
  skillId: SKILL_EQUIV_FRACTIONS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const baseNum = randomInt(1, 4, rng);
    const baseDen = randomInt(baseNum + 1, 6, rng); // Proper fraction
    
    let multiplier = 2;
    if (difficulty > 0.5) {
        multiplier = randomInt(3, 9, rng);
    } else {
        multiplier = randomInt(2, 4, rng);
    }

    const targetNum = baseNum * multiplier;
    const targetDen = baseDen * multiplier;
    
    // Calculate the wrong answer for the misconception trigger (additive scaling)
    const diff = targetDen - baseDen;
    const additiveWrongAnswer = baseNum + diff;

    return {
        meta: createMockProvenance(SKILL_EQUIV_FRACTIONS.id, difficulty),
        problem_content: {
            stem: `Find the missing number: **${baseNum}/${baseDen} = ?/${targetDen}**`,
            format: 'mixed',
            variables: { baseNum, baseDen, multiplier, targetDen }
        },
        answer_spec: {
            answer_mode: 'final_only',
            input_type: 'integer',
            ui: {
                placeholder: '?'
            }
        },
        solution_logic: {
            final_answer_canonical: String(targetNum),
            final_answer_type: 'numeric',
            steps: [
                {
                    step_index: 1,
                    explanation: `First, find the multiplier. ${baseDen} times what number equals ${targetDen}?`,
                    math: `${baseDen} \\times ? = ${targetDen}`,
                    answer: String(multiplier)
                },
                {
                    step_index: 2,
                    explanation: `Now multiply the numerator by that same number (${multiplier}). What is ${baseNum} × ${multiplier}?`,
                    math: `${baseNum} \\times ${multiplier} = ?`,
                    answer: String(targetNum)
                }
            ]
        },
        misconceptions: [
            {
                id: 'misc_additive',
                error_tag: 'add_num_add_den',
                trigger: {
                    kind: 'exact_answer',
                    value: String(additiveWrongAnswer)
                },
                hint_ladder: [
                    "It looks like you added the difference correctly, but fractions work by multiplication!",
                    "Did you think: 'since the bottom went up by X, the top goes up by X'? Try multiplying instead."
                ]
            }
        ]
    };
  }
};

engine.register(EquivFractionGenerator);

// --- 2. Add Like Fractions ---

export const SKILL_ADD_LIKE_FRACTIONS: Skill = {
    id: 'frac_add_like_01',
    name: 'Add fractions with like denominators',
    gradeBand: '3-5',
    prereqs: ['frac_equiv_01'], 
    misconceptions: ['add_denominators'],
    templates: ['T_ADD_LIKE_FRACTION'],
    description: 'Add two fractions that share the same denominator.'
};

export const AddLikeFractionGenerator: Generator = {
    templateId: 'T_ADD_LIKE_FRACTION',
    skillId: SKILL_ADD_LIKE_FRACTIONS.id,
    generate: (difficulty: number, rng?: () => number): MathProblemItem => {
        const maxDen = difficulty < 0.5 ? 12 : 20;
        const den = randomInt(3, maxDen, rng);
        const num1 = randomInt(1, den - 2, rng);
        const num2 = randomInt(1, den - num1, rng); // Ensure sum <= den
        const targetNum = num1 + num2;

        return {
            meta: createMockProvenance(SKILL_ADD_LIKE_FRACTIONS.id, difficulty),
            problem_content: {
                stem: `Add: **${num1}/${den} + ${num2}/${den} = ?/${den}**`,
                format: 'mixed',
                variables: { num1, num2, den }
            },
            answer_spec: {
                answer_mode: 'final_only',
                input_type: 'integer', 
            },
            solution_logic: {
                final_answer_canonical: String(targetNum),
                final_answer_type: 'numeric',
                steps: [
                    {
                        step_index: 1,
                         explanation: `When adding fractions with the same denominator, what is the new denominator?`,
                         math: `\\text{Keep } ${den}`,
                         answer: String(den)
                    },
                    {
                        step_index: 2,
                        explanation: `Now add the numerators. What is ${num1} + ${num2}?`,
                        math: `${num1} + ${num2} = ?`,
                        answer: String(targetNum)
                    }
                ]
            },
            misconceptions: [
                {
                    id: 'misc_add_den',
                    error_tag: 'add_denominators',
                    trigger: {
                        kind: 'exact_answer',
                        value: String(den + den) // Very specific trigger: user typed sum of denominators
                    },
                    hint_ladder: [
                        "Check the denominator. Do we add the bottom numbers?",
                        "When pieces are the same size, the size name (denominator) stays the same."
                    ]
                }
            ]
        };
    }
};

engine.register(AddLikeFractionGenerator);

// --- 3. Subtract Like Fractions ---

export const SKILL_SUB_LIKE_FRACTIONS: Skill = {
    id: 'fractions_sub_like',
    name: 'Subtract Fractions (Like Denominators)',
    gradeBand: '3-5',
    prereqs: ['frac_add_like_01'], 
    misconceptions: ['sub_num_sub_den', 'sub_num_add_den'],
    templates: ['T_SUB_LIKE_FRACTIONS'],
    description: 'Subtract fractions with the same denominator.',
    bktParams: {
        learningRate: 0.2, 
        slip: 0.05,
        guess: 0.1
    }
};

export const SubLikeFractionGenerator: Generator = {
    skillId: SKILL_SUB_LIKE_FRACTIONS.id,
    templateId: 'T_SUB_LIKE_FRACTIONS',
    generate: (difficulty: number, rng?: () => number): MathProblemItem => {
        const max = difficulty < 0.5 ? 10 : 20;
        const den = randomInt(3, max, rng);
        const targetNum = randomInt(1, den - 1, rng); 
        const num2 = randomInt(1, den - targetNum, rng); 
        const num1 = targetNum + num2; 

        return {
            meta: createMockProvenance(SKILL_SUB_LIKE_FRACTIONS.id, difficulty),
            problem_content: {
                stem: `Subtract: \\(\\frac{${num1}}{${den}} - \\frac{${num2}}{${den}} = ?\\)`,
                format: 'latex'
            },
            answer_spec: {
                // Note: user must type "2/5"
                answer_mode: 'final_only',
                input_type: 'fraction' 
            },
            solution_logic: {
                final_answer_canonical: `${targetNum}/${den}`,
                final_answer_type: 'numeric',
                steps: [
                    {
                        step_index: 1,
                        explanation: 'What represents the whole (the denominator)?',
                        math: `${den}`,
                        answer: String(den)
                    },
                    {
                        step_index: 2,
                        explanation: `Subtract the numerators: ${num1} - ${num2}`,
                        math: `${num1} - ${num2} = ?`,
                        answer: String(targetNum)
                    }
                ]
            },
            misconceptions: [
                {
                    id: 'misc_sub_den',
                    error_tag: 'sub_num_sub_den',
                    trigger: {
                         kind: 'regex',
                         value: `^${targetNum}/0$` // e.g. "3/0"
                    },
                    hint_ladder: ["You can't divide by zero! Did you subtract the bottom numbers?"]
                },
                 {
                    id: 'misc_add_den_sub',
                    error_tag: 'sub_num_add_den',
                    trigger: {
                         kind: 'regex',
                         value: `^${targetNum}/${den+den}$`
                    },
                    hint_ladder: ["Don't add the denominators when subtracting."]
                }
            ]
        };
    }
};

engine.register(SubLikeFractionGenerator);


// --- 4. Simplify Fractions ---

export const SKILL_SIMPLIFY_FRACTIONS: Skill = {
    id: 'fractions_simplify',
    name: 'Simplify Fractions',
    gradeBand: '3-5',
    prereqs: ['frac_equiv_01'], 
    misconceptions: ['divide_only_top', 'divide_diff_nums'],
    templates: ['T_SIMPLIFY_FRACTION'],
    description: 'Reduce fractions to their simplest form.',
    bktParams: {
        learningRate: 0.1, 
        slip: 0.1,
        guess: 0.1
    }
};

export const SimplifyFractionGenerator: Generator = {
     skillId: SKILL_SIMPLIFY_FRACTIONS.id,
    templateId: 'T_SIMPLIFY_FRACTION',
    generate: (difficulty: number, rng?: () => number): MathProblemItem => {
        const maxBase = difficulty < 0.5 ? 5 : 10;
        const numBase = randomInt(1, maxBase, rng);
        const denBase = randomInt(numBase + 1, maxBase + 5, rng); 
        const common = gcd(numBase, denBase);
        const simpleNum = numBase / common;
        const simpleDen = denBase / common;

        const multiplier = randomInt(2, difficulty < 0.5 ? 4 : 8, rng);
        const questionNum = simpleNum * multiplier;
        const questionDen = simpleDen * multiplier;

        return {
            meta: createMockProvenance(SKILL_SIMPLIFY_FRACTIONS.id, difficulty),
             problem_content: {
                stem: `Simplify \\(\\frac{${questionNum}}{${questionDen}}\\) to its lowest terms.`,
                format: 'latex'
            },
             answer_spec: {
                answer_mode: 'final_only',
                input_type: 'fraction'
            },
            solution_logic: {
                final_answer_canonical: `${simpleNum}/${simpleDen}`,
                final_answer_type: 'numeric',
                steps: [
                   {
                       step_index: 1,
                       explanation: `Find the number that divides both ${questionNum} and ${questionDen}.`,
                       math: `${questionNum} \\div ? = ${simpleNum}`,
                       answer: String(multiplier)
                   }
                ]
            },
            misconceptions: [
                {
                    id: 'misc_no_simp',
                    error_tag: 'no_simplify',
                     trigger: {
                         kind: 'exact_answer',
                         value: `${questionNum}/${questionDen}`
                    },
                    hint_ladder: ["That is the same fraction. Try to find a number that divides both top and bottom."]
                }
            ]
        };
    }
};

engine.register(SimplifyFractionGenerator);
