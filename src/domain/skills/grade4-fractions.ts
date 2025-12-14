import type { Skill, Generator, Item } from '../types';
import { engine } from '../generator/engine';
import { gcd } from '../math-utils';

export const SKILL_EQUIV_FRACTIONS: Skill = {
  id: 'frac_equiv_01',
  name: 'Recognize equivalent fractions',
  gradeBand: '3-5',
  prereqs: [],
  misconceptions: ['add_num_add_den'],
  templates: ['T_EQUIV_FRACTION_FIND'],
  description: 'Understand that fractions can look different but have the same value.',
  bktParams: {
    learningRate: 0.15, // Slightly faster learning
    slip: 0.05, // Lower slip probability
    guess: 0.25 
  }
};

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const EquivFractionGenerator: Generator = {
  templateId: 'T_EQUIV_FRACTION_FIND',
  skillId: SKILL_EQUIV_FRACTIONS.id,
  generate: (difficulty: number): Item => {
    // Difficulty 1: Simple multipliers (2, 3, 5, 10)
    // Difficulty 2: Harder multipliers
    
    const baseNum = randomInt(1, 4);
    const baseDen = randomInt(baseNum + 1, 6); // Proper fraction
    
    let multiplier = 2;
    if (difficulty > 0.5) {
        multiplier = randomInt(3, 9);
    } else {
        multiplier = randomInt(2, 4);
    }

    const targetNum = baseNum * multiplier;
    const targetDen = baseDen * multiplier;

    return {
      id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      skillId: SKILL_EQUIV_FRACTIONS.id,
      templateId: 'T_EQUIV_FRACTION_FIND',
      question: `Find the missing number: **${baseNum}/${baseDen} = ?/${targetDen}**`,
      answer: targetNum,
      config: { baseNum, baseDen, multiplier },
      steps: [
        {
            id: 's1',
            text: `Look at the denominators. What number do you multiply ${baseDen} by to get ${targetDen}?`,
            answer: multiplier,
            inputFormat: 'number',
            explanation: `Because ${baseDen} × ${multiplier} = ${targetDen}.`
        },
        {
            id: 's2',
            text: `Since the denominator was multiplied by ${multiplier}, we must do the same to the numerator. What is ${baseNum} × ${multiplier}?`,
            answer: targetNum,
            inputFormat: 'number',
            explanation: `${baseNum} × ${multiplier} = ${targetNum}.`
        }
      ],
      misconceptionMatchers: [
        (answer) => {
           // Misconception: Additive scaling (adding the difference instead of multiplying)
           // baseDen -> targetDen is +diff
           // If user did baseNum + diff, that's the error.
           const diff = targetDen - baseDen;
           const additiveWrongAnswer = baseNum + diff;
           if (Number(answer) === additiveWrongAnswer) {
               return 'add_num_add_den';
           }
           return null;
        }
      ]
    };
  }
};

// Register immediately
engine.register(EquivFractionGenerator);

export const SKILL_ADD_LIKE_FRACTIONS: Skill = {
    id: 'frac_add_like_01',
    name: 'Add fractions with like denominators',
    gradeBand: '3-5',
    prereqs: ['frac_equiv_01'], // ideally just "frac_identify" but this works for graph
    misconceptions: ['add_denominators'],
    templates: ['T_ADD_LIKE_FRACTION'],
    description: 'Add two fractions that share the same denominator.'
};

export const AddLikeFractionGenerator: Generator = {
    templateId: 'T_ADD_LIKE_FRACTION',
    skillId: SKILL_ADD_LIKE_FRACTIONS.id,
    generate: (_difficulty: number): Item => {
        // e.g. 1/5 + 2/5
        const den = randomInt(3, 12);
        const num1 = randomInt(1, den - 2);
        const num2 = randomInt(1, den - num1); // Ensure sum <= den
        
        const targetNum = num1 + num2;

        return {
            id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            skillId: SKILL_ADD_LIKE_FRACTIONS.id,
            templateId: 'T_ADD_LIKE_FRACTION',
            question: `Add: **${num1}/${den} + ${num2}/${den} = ?/${den}**`,
            answer: targetNum,
            config: { num1, num2, den },
            steps: [
                {
                    id: 's1',
                    text: `When adding fractions with the same denominator, does the denominator change?`,
                    answer: 'no',
                    inputFormat: 'text',
                    explanation: `Correct! We keep the bottom number (${den}) the same.`
                },
                {
                    id: 's2',
                    text: `Now just add the top numbers. What is ${num1} + ${num2}?`,
                    answer: targetNum,
                    inputFormat: 'number',
                    explanation: `${num1} + ${num2} = ${targetNum}. So the answer is ${targetNum}/${den}.`
                }
            ],
            misconceptionMatchers: [
                (answer) => {
                    // Misconception: Adding denominators
                    // If the user answers with the sum of denominators (den + den), 
                    // they likely think the denominator changes.
                    if (Number(answer) === den + den) {
                        return 'add_denominators';
                    }
                    return null;
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
    id: 'gen_sub_like_fractions',
    name: 'Subtract Like Fractions Generator',
    skillId: SKILL_SUB_LIKE_FRACTIONS.id,
    templateId: 'T_SUB_LIKE_FRACTIONS',
    generate: (difficulty: number) => {
        // Difficulty 0-0.5: Simple numbers (<10)
        // Difficulty 0.5-1: Larger numbers (<20)
        const max = difficulty < 0.5 ? 10 : 20;
        const den = randomInt(3, max);
        const targetNum = randomInt(1, den - 1); // Answer
        const num2 = randomInt(1, den - targetNum); // Subtrahend
        const num1 = targetNum + num2; // Minuend, so num1 - num2 = targetNum

        return {
            id: `sub_like_${Date.now()}_${Math.random()}`,
            skillId: SKILL_SUB_LIKE_FRACTIONS.id,
            templateId: 'T_SUB_LIKE_FRACTIONS',
            question: {
                text: `Subtract: \\(\\frac{${num1}}{${den}} - \\frac{${num2}}{${den}} = ?\\)`,
                format: 'tex'
            },
            answer: {
                value: `${targetNum}/${den}`,
                format: 'fraction'
            },
            steps: [
                {
                    id: 's1',
                    text: `When subtracting fractions with the same denominator, does the denominator change?`,
                    answer: 'no',
                    inputFormat: 'text',
                    explanation: `Correct! We keep the bottom number (${den}) the same.`
                },
                {
                    id: 's2',
                    text: `Now subtract the top numbers. What is ${num1} - ${num2}?`,
                    answer: targetNum,
                    inputFormat: 'number',
                    explanation: `${num1} - ${num2} = ${targetNum}. So the answer is ${targetNum}/${den}.`
                }
            ],
            misconceptionMatchers: [
                (ans) => {
                    const diff = targetNum;
                    // Regex for "num/0" if they did den-den
                    if (ans === `${targetNum}/0`) return 'sub_num_sub_den';
                    // If they added den
                    if (ans === `${targetNum}/${den + den}`) return 'sub_num_add_den';
                    return null;
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
    id: 'gen_simplify_fraction',
    name: 'Simplify Fraction Generator',
     skillId: SKILL_SIMPLIFY_FRACTIONS.id,
    templateId: 'T_SIMPLIFY_FRACTION',
    generate: (difficulty: number) => {
        // Generate a simplified fraction, then scale it up
        const maxBase = difficulty < 0.5 ? 5 : 10;
        const numBase = randomInt(1, maxBase);
        const denBase = randomInt(numBase + 1, maxBase + 5); 
        // Ensure base is actually simplified
        const common = gcd(numBase, denBase);
        const simpleNum = numBase / common;
        const simpleDen = denBase / common;

        // Scale up
        const multiplier = randomInt(2, difficulty < 0.5 ? 4 : 8);
        const questionNum = simpleNum * multiplier;
        const questionDen = simpleDen * multiplier;

        return {
            id: `simp_${Date.now()}_${Math.random()}`,
            skillId: SKILL_SIMPLIFY_FRACTIONS.id,
            templateId: 'T_SIMPLIFY_FRACTION',
            question: {
                text: `Simplify \\(\\frac{${questionNum}}{${questionDen}}\\) to its lowest terms.`,
                format: 'tex'
            },
            answer: {
                value: `${simpleNum}/${simpleDen}`,
                format: 'fraction'
            },
             steps: [
                {
                    id: 's1',
                    text: `Both ${questionNum} and ${questionDen} can be divided by ${multiplier}. What is ${questionNum} ÷ ${multiplier}?`,
                    answer: simpleNum,
                    inputFormat: 'number',
                    explanation: `Right! ${questionNum} ÷ ${multiplier} = ${simpleNum}. This is our new top number.`
                },
                 {
                    id: 's2',
                    text: `Now divide the bottom number. What is ${questionDen} ÷ ${multiplier}?`,
                    answer: simpleDen,
                    inputFormat: 'number',
                    explanation: `${questionDen} ÷ ${multiplier} = ${simpleDen}. So the simplified fraction is ${simpleNum}/${simpleDen}.`
                }
            ],
            misconceptionMatchers: [
               (ans) => {
                    if (ans === `${questionNum}/${questionDen}`) return 'no_simplify';
                    return null;
               }
            ]
        };
    }
};

engine.register(SimplifyFractionGenerator);
