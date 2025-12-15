import { describe, it, expect, vi } from 'vitest';
import { SubLikeFractionGenerator, SimplifyFractionGenerator, EquivFractionGenerator, SKILL_EQUIV_FRACTIONS } from './grade4-fractions';
import { gcd } from '../math-utils';
import type { MathProblemItem } from '../types';

describe('grade4-fractions generators', () => {
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

  describe('SubLikeFractionGenerator', () => {
    it('uses smaller ranges when difficulty < 0.5', () => {
      // Mock sequence: 
      // 1. den -> 0.999 (max)
      // 2. targetNum -> 0 (min)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0.999, 0, 0]);

      const item = SubLikeFractionGenerator.generate(0.1, rng);
      
      const qText = item.problem_content.stem;
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\} = \?\\/);
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(10); // max for diff < 0.5 is 10

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical.split('/').map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
    });

    it('uses larger ranges when difficulty >= 0.5', () => {
      // Mock sequence:
      // 1. den -> 0.999 (max)
      // 2. targetNum -> 0.999 (max)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0.999, 0.999, 0]);

      const item = SubLikeFractionGenerator.generate(0.9, rng);

      const qText = item.problem_content.stem;
      // Note the regex in generator includes = ?\)
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\} = \?\\/);
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(20);
      expect(den).toBeGreaterThanOrEqual(3);

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical.split('/').map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
    });

    it('defines misconceptions for subtracting denominators or adding denominators', () => {
      // Mock sequence:
      // 1. den -> 0 (min)
      // 2. targetNum -> 0 (min)
      // 3. num2 -> 0 (min)
      const rng = createMockRng([0, 0, 0]);

      const item = SubLikeFractionGenerator.generate(0.1, rng);
      
      const miscSubDen = item.misconceptions?.find(m => m.error_tag === 'sub_num_sub_den');
      const miscAddDen = item.misconceptions?.find(m => m.error_tag === 'sub_num_add_den');

      expect(miscSubDen).toBeDefined();
      expect(miscAddDen).toBeDefined();

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical.split('/').map(Number);

      // Verify the trigger values
      // sub_num_sub_den regex: ^ansNum/0$
      expect(miscSubDen?.trigger.kind).toBe('regex');
      expect(miscSubDen?.trigger.value).toBe(`^${ansNum}/0$`);

      // sub_num_add_den regex: ^ansNum/2*den$
      expect(miscAddDen?.trigger.kind).toBe('regex');
      expect(miscAddDen?.trigger.value).toBe(`^${ansNum}/${ansDen + ansDen}$`);
    });
  });

  describe('SimplifyFractionGenerator', () => {
    it('generates a reducible fraction and provides a lowest-terms answer', () => {
      // Mock sequence:
      // 1. numBase -> 0 (min)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.1, rng);

      const qText = item.problem_content.stem;
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const questionNum = Number(match[1]);
      const questionDen = Number(match[2]);
      expect(gcd(questionNum, questionDen)).toBeGreaterThan(1);

      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical.split('/').map(Number);
      expect(gcd(ansNum, ansDen)).toBe(1);
      expect(questionNum * ansDen).toBe(questionDen * ansNum);
    });

    it('expands number ranges when difficulty >= 0.5', () => {
      // Mock sequence:
      // 1. numBase -> 0.999 (max)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0.999, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.9, rng);
      const [ansNum, ansDen] = item.solution_logic.final_answer_canonical.split('/').map(Number);
      expect(ansNum).toBeGreaterThan(0);
      expect(ansDen).toBeGreaterThan(ansNum);
    });

    it('defines the no_simplify misconception trigger', () => {
      // Mock sequence:
      // 1. numBase -> 0 (min)
      // 2. denBase -> 0.999 (max)
      // 3. multiplier -> 0.999 (max)
      const rng = createMockRng([0, 0.999, 0.999]);

      const item = SimplifyFractionGenerator.generate(0.1, rng);
      const miscNoSimp = item.misconceptions?.find(m => m.error_tag === 'no_simplify');
      
      expect(miscNoSimp).toBeDefined();

      const qText = item.problem_content.stem;
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      const questionNum = Number(match![1]);
      const questionDen = Number(match![2]);

      expect(miscNoSimp?.trigger.kind).toBe('exact_answer');
      expect(miscNoSimp?.trigger.value).toBe(`${questionNum}/${questionDen}`);
    });
  });

  describe('EquivFractionGenerator', () => {
    it('generates valid equivalent fraction problems', () => {
        const item = EquivFractionGenerator.generate(0.1);
        const vars = item.problem_content.variables as { baseNum: number; baseDen: number; multiplier: number };
        
        expect(item.meta.skill_id).toBe(SKILL_EQUIV_FRACTIONS.id);
        expect(vars.baseNum).toBeGreaterThanOrEqual(1);
    });

    it('identifies additive misconception', () => {
        const item = EquivFractionGenerator.generate(0.5);
        const vars = item.problem_content.variables as { baseNum: number; baseDen: number; targetDen: number };
        const { baseNum, baseDen, targetDen } = vars;
        const diff = targetDen - baseDen;
        const wrongAns = baseNum + diff;
        
        const misc = item.misconceptions?.find(m => m.error_tag === 'add_num_add_den');
        expect(misc).toBeDefined();
        expect(misc?.trigger.value).toBe(String(wrongAns));
    });
  });
});
