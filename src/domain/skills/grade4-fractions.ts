import type { Skill, Generator, Item } from '../types';
import { engine } from '../generator/engine';

export const SKILL_EQUIV_FRACTIONS: Skill = {
  id: 'frac_equiv_01',
  name: 'Recognize equivalent fractions',
  gradeBand: '3-5',
  prereqs: [],
  misconceptions: ['add_num_add_den'],
  templates: ['T_EQUIV_FRACTION_FIND'],
  description: 'Understand that fractions can look different but have the same value.'
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
            text: `Look at the denominators. How do you get from ${baseDen} to ${targetDen}?`,
            isHint: true
        },
        {
            id: 's2',
            text: `${baseDen} × ${multiplier} = ${targetDen}. So multiply the numerator by ${multiplier} too.`,
            isHint: true
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
                    text: `When denominators are the same, keep the bottom number (${den}).`,
                    isHint: true
                },
                {
                    id: 's2',
                    text: `Add the top numbers: ${num1} + ${num2} = ${targetNum}.`,
                    isHint: true
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
