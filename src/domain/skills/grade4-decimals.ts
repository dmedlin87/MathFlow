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

// --- Decimal Comparison (4.NF.C.7) ---

export const SKILL_DECIMAL_COMPARE: Skill = {
    id: 'dec_compare_01',
    name: 'Compare Decimals (Tenths & Hundredths)',
    gradeBand: '3-5',
    prereqs: ['dec_notation_01'], 
    misconceptions: ['longer_is_larger'],
    templates: ['T_DEC_COMPARE'],
    description: 'Compare two decimals to hundredths by reasoning about their size.',
    bktParams: {
        learningRate: 0.15,
        slip: 0.1,
        guess: 0.33 // 3 options (<, >, =)
    }
};

export const DecimalComparisonGenerator: Generator = {
    templateId: 'T_DEC_COMPARE',
    skillId: SKILL_DECIMAL_COMPARE.id,
    generate: (difficulty: number, rng?: () => number): MathProblemItem => {
        // Difficulty split:
        // < 0.5: Same number of digits (e.g. 0.4 vs 0.7, or 0.45 vs 0.67) - Easy
        // >= 0.5: Different lengths (e.g. 0.2 vs 0.19) - Triggers misconception
        
        let val1: number;
        let val2: number;
        let s1: string;
        let s2: string;

        if (difficulty < 0.5) {
            // Same lengths
            const useHundredths = randomInt(0, 1, rng) === 1;
            const max = useHundredths ? 99 : 9;
            const den = useHundredths ? 100 : 10;
            
            val1 = randomInt(1, max, rng);
            do {
                val2 = randomInt(1, max, rng);
            } while (val1 === val2); // Avoid equals for low difficulty for now to focus on magnitude
            
            s1 = (val1 / den).toFixed(useHundredths ? 2 : 1);
            s2 = (val2 / den).toFixed(useHundredths ? 2 : 1);
        } else {
            // Different lengths (The "Trap")
            // A: Tenths (e.g. 0.2)
            // B: Hundredths (e.g. 0.19)
            
            const num1 = randomInt(1, 9, rng); // Tenths
            const num2 = randomInt(1, 99, rng); // Hundredths
            
            s1 = (num1 / 10).toFixed(1); // "0.2"
            s2 = (num2 / 100).toFixed(2); // "0.19"
            
            // Should properly parse back to numbers for comparison
        }

        const n1 = parseFloat(s1);
        const n2 = parseFloat(s2);
        
        let correctSym = '=';
        if (n1 < n2) correctSym = '<';
        if (n1 > n2) correctSym = '>';
        
        // Detect "Longer is Larger" trap scenario (0.19 > 0.2 because 19 > 2)
        // Happens if (length(s1) < length(s2)) BUT (n1 > n2)
        // e.g. 0.2 vs 0.19. Len(3) < Len(4). But 0.2 > 0.19.
        // User guesses 0.19 is larger (>) -> INCORRECT.
        // Or vice versa.
        
        // Let's strictly define the "Trap" case for misconception trigger
        const s1_longer = s1.length > s2.length;
        const s2_longer = s2.length > s1.length;
        
        let trapAnswer: string | null = null;
        
        if (s1_longer && n1 < n2) {
             // 0.19 (len 4) vs 0.2 (len 3). 0.19 < 0.2. 
             // Wait: 0.19 < 0.2 is TRUE (0.19 is 0.19, 0.2 is 0.20).
             // 0.19 < 0.20.
             // If user thinks "Longer is larger", they think 0.19 is bigger. 
             // "Select >". 0.19 > 0.2.
             // But valid is <.
             // So trap is '>'.
             trapAnswer = '>'; 
        } else if (s2_longer && n2 < n1) {
             // 0.2 vs 0.19. 0.2 > 0.19. 
             // User thinks 0.19 (longer) is bigger. 
             // "Select <". 0.2 < 0.19.
             // Trap is '<'.
             trapAnswer = '<';
        }

        // Only add misconception if catchable
        const misconceptions = [];
        if (trapAnswer) {
            misconceptions.push({
                id: 'misc_len_bias',
                error_tag: 'longer_is_larger',
                trigger: {
                    kind: 'exact_answer' as const,
                    value: trapAnswer
                },
                hint_ladder: [
                    "Check the place value. Add a zero to make them the same length.",
                    `Compare ${s1}0 and ${s2} (or similar).` // Simplified hint
                ]
            });
        }

        return {
            meta: createMockProvenance(SKILL_DECIMAL_COMPARE.id, difficulty),
            problem_content: {
                stem: `Compare: **${s1}** and **${s2}**`,
                format: 'mixed',
                variables: { s1, s2 }
            },
            answer_spec: {
                answer_mode: 'final_only',
                input_type: 'multiple_choice',
                ui: {
                    choices: ['<', '>', '=']
                }
            },
            solution_logic: {
                final_answer_canonical: correctSym,
                final_answer_type: 'multiple_choice',
                steps: [
                    {
                        step_index: 1,
                        explanation: `Write them with the same number of decimal places.`,
                        math: `${s1} \\rightarrow ${n1.toFixed(2)}, \\quad ${s2} \\rightarrow ${n2.toFixed(2)}`,
                        answer: n1.toFixed(2) // Not really interactive here, just explanation
                    },
                    {
                        step_index: 2,
                        explanation: `Now compare ${n1.toFixed(2)} and ${n2.toFixed(2)}.`,
                        math: `${n1.toFixed(2)} ${correctSym} ${n2.toFixed(2)}`,
                        answer: correctSym
                    }
                ]
            },
            misconceptions
        };
    }
};

engine.register(DecimalComparisonGenerator);
