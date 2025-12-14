import { describe, it, expect } from 'vitest';
import { engine } from './engine';
import { EquivFractionGenerator, AddLikeFractionGenerator, SKILL_EQUIV_FRACTIONS } from '../skills/grade4-fractions';

describe('Fraction Generator', () => {
    it('generates valid equivalent fraction problems', () => {
        const item = EquivFractionGenerator.generate(0.1);
        
        expect(item.skillId).toBe(SKILL_EQUIV_FRACTIONS.id);
        expect(item.templateId).toBe('T_EQUIV_FRACTION_FIND');
        
        // Config checks
        expect(item.config.baseNum).toBeGreaterThanOrEqual(1);
        expect(item.config.baseDen).toBeGreaterThan(item.config.baseNum); // Proper fraction
        
        const { baseNum, baseDen, multiplier } = item.config;
        const targetNum = item.answer as number;
        const targetDen = baseDen * multiplier;
        
        // Correctness check: baseNum/baseDen == targetNum/targetDen
        expect(baseNum * targetDen).toBe(targetNum * baseDen);
    });

    it('adjusts difficulty (multiplier increases)', () => {
        // Mock random potentially or just check range
        // Difficulty 1.0 SHOULD produce higher multipliers
        const hardItem = EquivFractionGenerator.generate(1.0);
        // We can't deterministic check random without mocking, but we can check constraints if we exported them
        expect(hardItem.config.multiplier).toBeGreaterThanOrEqual(2);
    });

    it('identifies additive misconception', () => {
        const item = EquivFractionGenerator.generate(0.5);
        // e.g. 1/2 = ?/4 (diff is +2)
        // Additive wrong answer would be 1+2 = 3.
        const { baseNum, baseDen, multiplier } = item.config;
        const targetDen = baseDen * multiplier;
        const diff = targetDen - baseDen;
        const wrongAns = baseNum + diff;
        
        // Find the matcher
        const matcher = item.misconceptionMatchers?.[0];
        expect(matcher).toBeDefined();
        if (matcher) {
            expect(matcher(wrongAns)).toBe('add_num_add_den');
            expect(matcher(wrongAns + 1)).toBeNull(); // Random wrong answer shouldn't match
        }
    });

    it('generates adding like fractions problems', () => {
         const gen = engine.getGenerator('T_ADD_LIKE_FRACTION');
         expect(gen).toBeDefined();
         const item = gen?.generate(0.5);
         expect(item).toBeDefined();
         if (!item) return;

         expect(item.skillId).toBe('frac_add_like_01');
         const { num1, num2, den } = item.config;
         expect(num1 + num2).toBe(item.answer);
         // Ensure we don't exceed denominator (for this specific generator logic)
         expect(num1 + num2).toBeLessThanOrEqual(den);
    });
    it('identifies add_denominators misconception', () => {
         const item = AddLikeFractionGenerator.generate(0.5);
         const { den } = item.config;
         
         // Misconception: The student adds the denominators.
         // Since the question asks "?/den", if they answer "den + den", it implies they think the bottom should change.
         const wrongAns = den + den;

         const matcher = item.misconceptionMatchers?.[0];
         expect(matcher).toBeDefined();
         if (matcher) {
             expect(matcher(wrongAns)).toBe('add_denominators');
             expect(matcher(wrongAns + 1)).toBeNull(); // Random wrong answer shouldn't match
         }
    });

});

describe('Generator Engine', () => {
    it('retrieves registered generators', () => {
        const gen = engine.getGenerator('T_EQUIV_FRACTION_FIND');
        expect(gen).toBeDefined();
        expect(gen?.skillId).toBe('frac_equiv_01');
    });

    it('generates items via engine', () => {
        const item = engine.generateItem('T_EQUIV_FRACTION_FIND', 0.5);
        expect(item).toBeDefined();
        expect(item.id).toContain('it_');
    });

    it('throws error when template not found', () => {
        expect(() => {
            engine.generateItem('NON_EXISTENT_TEMPLATE', 0.5);
        }).toThrow(/No generator found/);
    });
});
