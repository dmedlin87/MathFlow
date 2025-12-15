import { describe, it, expect } from 'vitest';
import { DecimalNotationGenerator, DecimalComparisonGenerator, SKILL_DECIMAL_NOTATION } from './grade4-decimals';

describe('grade4-decimals generator', () => {
    // Helper to create a controllable RNG
    const createMockRng = (sequence: number[]) => {
        let index = 0;
        return () => {
            if (index >= sequence.length) {
                return 0.5; // Default fallback
            }
            return sequence[index++];
        };
    };

    describe('DecimalNotationGenerator', () => {
        it('generates tenths for difficulty < 0.5', () => {
            // Mock sequence: num -> 0.3 (should map to 3 if range is 1-9)
            // randomInt(1, 9): range=9, min=1. floor(0.3 * 9) + 1 = floor(2.7)+1 = 2+1 = 3.
            const rng = createMockRng([0.3]); 
            
            const item = DecimalNotationGenerator.generate(0.1, rng);
            
            expect(item.meta.skill_id).toBe(SKILL_DECIMAL_NOTATION.id);
            expect(item.problem_content.stem).toContain('Write **3/10** as a decimal');
            expect(item.solution_logic.final_answer_canonical).toBe('0.3');
            expect(item.answer_spec.ui?.placeholder).toBe('0.0');
        });

        it('generates hundredths for difficulty >= 0.5', () => {
             // Mock sequence: num -> 0.5 (range 1-99)
             // randomInt(1, 99): range=99, min=1. floor(0.5*99)+1 = 49+1 = 50.
             const rng = createMockRng([0.5]);
             
             const item = DecimalNotationGenerator.generate(0.9, rng);
             
             expect(item.problem_content.stem).toContain('Write **50/100** as a decimal');
             // 50/100 = 0.5
             expect(item.solution_logic.final_answer_canonical).toBe('0.5');
             expect(item.answer_spec.ui?.placeholder).toBe('0.00');
        });

        it('defines misconception for whole number bias', () => {
             const rng = createMockRng([0.1]); // num -> 1
             // 1/10 -> 0.1
             
             const item = DecimalNotationGenerator.generate(0.1, rng);
             const misc = item.misconceptions.find(m => m.error_tag === 'ignoring_place_value');
             
             expect(misc).toBeDefined();
             // Expect trigger for "1"
             expect(misc?.trigger.value).toBe('1');
        });
    });

    describe('DecimalComparisonGenerator', () => {
        it('generates same-length decimals for difficulty < 0.5', () => {
            // Mock: first call randomInt(0,1) -> 0 (Tenths). 
            // Then num1, num2. 
            // rng: [0, 0.4, 0.7] -> 0 (bool), 4 (num1), 7 (num2)
            const rng = createMockRng([0, 0.4, 0.7]);
            
            const item = DecimalComparisonGenerator.generate(0.1, rng);
            // 0 -> Tenths. Max 9.
            // 0.4 * 9 + 1 = 3.6+1=4.
            // 0.7 * 9 + 1 = 6.3+1=7.
            // Compare 0.4 and 0.7.
            
            expect(item.problem_content.stem).toContain('Compare: **0.4** and **0.7**');
            expect(item.solution_logic.final_answer_canonical).toBe('<');
        });

        it('generates different-length decimals for difficulty >= 0.5', () => {
             // Diff >= 0.5. Code calls randomInt(1,9) then randomInt(1,99).
             // rng: [0.2, 0.19]
             // num1: 0.2 -> floor(0.2*9)+1 = 2. -> 0.2
             // num2: 0.19 -> floor(0.19*99)+1 = 18+1=19. -> 0.19
             
             // Wait: 0.19 * 99 = 18.81. Floor 18. +1 = 19. Correct.
             
             const rng = createMockRng([0.2, 0.19]);
             const item = DecimalComparisonGenerator.generate(0.9, rng);
             
             expect(item.problem_content.stem).toContain('Compare: **0.2** and **0.19**');
             // 0.2 > 0.19
             expect(item.solution_logic.final_answer_canonical).toBe('>');
        });

        it('detects longer_is_larger misconception', () => {
             // Case: 0.2 vs 0.19. (0.2 > 0.19).
             // User thinks 0.19 is bigger because 19 > 2.
             // User selects '<' (0.2 < 0.19).
             const rng = createMockRng([0.2, 0.19]);
             const item = DecimalComparisonGenerator.generate(0.9, rng);
             
             const misc = item.misconceptions.find(m => m.error_tag === 'longer_is_larger');
             expect(misc).toBeDefined();
             expect(misc?.trigger.value).toBe('<');
        });
    });
});
