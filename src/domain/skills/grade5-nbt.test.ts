import { describe, it, expect } from 'vitest';
import {
  SKILL_5_NBT_POWERS_10,
  SKILL_5_NBT_DECIMAL_FORMS,
  SKILL_5_NBT_COMPARE_DECIMALS,
  SKILL_5_NBT_ROUND_DECIMALS
} from './grade5-nbt';
import { checkAnswer } from '../math-utils';

describe('Grade 5 Module 1: Place Value & Decimals', () => {

  describe('SKILL_5_NBT_POWERS_10', () => {
    it('generates valid problems', () => {
      for (let i = 0; i < 20; i++) {
        const problem = SKILL_5_NBT_POWERS_10.generator.generate();
        expect(problem.type).toBe('fill_in_blank');
        expect(problem.items.length).toBe(1);
        expect(problem.stem).toBeTruthy();

        const item = problem.items[0];
        const canonical = item.solution_logic.final_answer_canonical;
        expect(checkAnswer(canonical, item)).toBe(true);
      }
    });
  });

  describe('SKILL_5_NBT_DECIMAL_FORMS', () => {
    it('generates valid problems', () => {
      for (let i = 0; i < 20; i++) {
        const problem = SKILL_5_NBT_DECIMAL_FORMS.generator.generate();
        expect(problem.type).toBe('fill_in_blank');
        expect(problem.items.length).toBe(1);
        expect(problem.stem).toBeTruthy();

        const item = problem.items[0];
        const canonical = item.solution_logic.final_answer_canonical;
        expect(checkAnswer(canonical, item)).toBe(true);
      }
    });
  });

  describe('SKILL_5_NBT_COMPARE_DECIMALS', () => {
    it('generates valid problems', () => {
      for (let i = 0; i < 20; i++) {
        const problem = SKILL_5_NBT_COMPARE_DECIMALS.generator.generate();
        expect(problem.type).toBe('multiple_choice');
        expect(problem.options).toEqual(['>', '<', '=']);
        expect(problem.items.length).toBe(1);

        const item = problem.items[0];
        const canonical = item.solution_logic.final_answer_canonical;
        expect(['>', '<', '=']).toContain(canonical);
        expect(checkAnswer(canonical, item)).toBe(true);
      }
    });
  });

  describe('SKILL_5_NBT_ROUND_DECIMALS', () => {
    it('generates valid problems', () => {
      for (let i = 0; i < 20; i++) {
        const problem = SKILL_5_NBT_ROUND_DECIMALS.generator.generate();
        expect(problem.type).toBe('fill_in_blank');
        expect(problem.items.length).toBe(1);

        const item = problem.items[0];
        const canonical = item.solution_logic.final_answer_canonical;

        // Ensure rounding is correct (manual check of random sample)
        const stem = problem.stem;
        const numMatch = stem.match(/Round ([\d.]+) to the nearest (.*)\./);
        if (numMatch) {
            const num = parseFloat(numMatch[1]);
            const place = numMatch[2];
            let expected = 0;
            if (place === 'whole number') expected = Math.round(num);
            if (place === 'tenth') expected = Math.round(num * 10) / 10;
            if (place === 'hundredth') expected = Math.round(num * 100) / 100;

            expect(Math.abs(parseFloat(canonical) - expected)).toBeLessThan(0.0001);
        }

        expect(checkAnswer(canonical, item)).toBe(true);
      }
    });
  });

});
