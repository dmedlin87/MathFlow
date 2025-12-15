import type { Skill, Generator, MathProblemItem } from '../types';
import { engine } from '../generator/engine';

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

// Helper to create mock provenance (duplicated from fractions for independence)
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

// --- Decimal Notation (4.NF.C.6) ---

export const SKILL_DECIMAL_NOTATION: Skill = {
    id: 'dec_notation_01',
    name: 'Convert Fractions to Decimals',
    gradeBand: '3-5',
    prereqs: ['frac_equiv_01'], 
    misconceptions: ['longer_is_larger', 'ignoring_place_value'],
    templates: ['T_DEC_NOTATION'],
    description: 'Use decimal notation for fractions with denominators 10 or 100.',
    bktParams: {
        learningRate: 0.15,
        slip: 0.1,
        guess: 0.15
    }
};

export const DecimalNotationGenerator: Generator = {
    templateId: 'T_DEC_NOTATION',
    skillId: SKILL_DECIMAL_NOTATION.id,
    generate: (difficulty: number, rng?: () => number): MathProblemItem => {
        // Difficulty split:
        // < 0.5: Tenths (e.g. 7/10 -> 0.7)
        // >= 0.5: Hundredths (e.g. 42/100 -> 0.42)
        
        const isHundredths = difficulty >= 0.5;
        const den = isHundredths ? 100 : 10;
        
        let num: number;
        if (isHundredths) {
            num = randomInt(1, 99, rng);
            // Avoid multiples of 10 to keep it strictly "hundredths" look initially? 
            // Actually 30/100 = 0.30 is fine, but 0.3 is better. 
            // For simply testing notation, let's allow all.
        } else {
            num = randomInt(1, 9, rng);
        }

        // Canonical Answer
        const canonical = (num / den).toString(); // JS handles 3/10 as 0.3 nicely.

        return {
            meta: createMockProvenance(SKILL_DECIMAL_NOTATION.id, difficulty),
            problem_content: {
                stem: `Write **${num}/${den}** as a decimal.`,
                format: 'mixed',
                variables: { num, den }
            },
            answer_spec: {
                answer_mode: 'final_only',
                input_type: 'decimal',
                ui: {
                    placeholder: isHundredths ? '0.00' : '0.0'
                }
            },
            solution_logic: {
                final_answer_canonical: canonical,
                final_answer_type: 'numeric',
                steps: [
                    {
                        step_index: 1,
                        explanation: isHundredths 
                            ? `The denominator is 100, so the number ends in the hundredths place (two decimal places).`
                            : `The denominator is 10, so the number ends in the tenths place (one decimal place).`,
                        math: `\\text{Place Value}`,
                        answer: isHundredths ? '0.01' : '0.1' // Just a placeholder check-in
                    },
                    {
                        step_index: 2,
                        explanation: `Write ${num} so it ends in that place.`,
                        math: `${num}/${den} = ${canonical}`,
                        answer: canonical
                    }
                ]
            },
            misconceptions: [
                {
                    id: 'misc_whole_bias',
                    error_tag: 'ignoring_place_value',
                    trigger: {
                         kind: 'exact_answer',
                         value: isHundredths ? `${num}.0` : `${num}` // e.g. 3/10 -> 3 or 3.0
                    },
                    hint_ladder: [
                        "That looks like a whole number!",
                        `Remember, we are looking for a decimal less than 1.`
                    ]
                }
            ]
        };
    }
};

// Auto-register
engine.register(DecimalNotationGenerator);
