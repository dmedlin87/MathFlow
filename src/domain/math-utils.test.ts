import { describe, it, expect } from 'vitest';
import { gcd, getFactors, checkAnswer } from './math-utils';
import { MathProblemItem } from './types';

describe('math-utils', () => {
  describe('gcd', () => {
    it('returns a when b is 0', () => {
      expect(gcd(5, 0)).toBe(5);
    });

    it('computes the greatest common divisor via recursion', () => {
      expect(gcd(12, 8)).toBe(4);
    });

    it('treats gcd(0, a) as gcd(a, 0) (characterization)', () => {
      expect(gcd(0, 5)).toBe(5);
    });
  });

  describe('getFactors', () => {
    it('returns all positive divisors of n', () => {
      expect(getFactors(6)).toEqual([1, 2, 3, 6]);
    });

    it('returns [1] for n = 1', () => {
      expect(getFactors(1)).toEqual([1]);
    });

    it('returns [] for n <= 0 (characterization)', () => {
      expect(getFactors(0)).toEqual([]);
      expect(getFactors(-3)).toEqual([]);
    });
  });

  describe('checkAnswer', () => {
    const baseItem: MathProblemItem = {
      meta: {
        id: 'test', version: 1, skill_id: 'test', difficulty: 1, created_at: '',
        provenance: { generator_model: '', critic_model: '', judge_model: '', verifier: { type: 'none', passed: true }, attempt: 1 },
        verification_report: { rubric_scores: { solvability: 1, ambiguity: 0, procedural_correctness: 1, pedagogical_alignment: 1 }, underspecified: false, issues: [] }
      },
      problem_content: { stem: 'test', format: 'text' },
      answer_spec: { answer_mode: 'final_only', input_type: 'integer' },
      solution_logic: { final_answer_canonical: '42', final_answer_type: 'numeric', steps: [] },
      misconceptions: []
    };

    it('returns true for exact match', () => {
      expect(checkAnswer('42', baseItem)).toBe(true);
    });

    it('returns true for match with whitespace', () => {
      expect(checkAnswer(' 42 ', baseItem)).toBe(true);
    });

    it('returns false for incorrect answer', () => {
      expect(checkAnswer('43', baseItem)).toBe(false);
    });

    it('returns true for numeric equivalent (42.0 vs 42)', () => {
      expect(checkAnswer('42.0', baseItem)).toBe(true);
    });

    it('returns true for accepted forms', () => {
      const item: MathProblemItem = {
        ...baseItem,
        answer_spec: {
          ...baseItem.answer_spec,
          accepted_forms: ['forty-two', '42.00']
        }
      };
      expect(checkAnswer('forty-two', item)).toBe(true);
      expect(checkAnswer('42.00', item)).toBe(true);
    });

    it('respects tolerance for decimals', () => {
        const item: MathProblemItem = {
            ...baseItem,
            answer_spec: {
                ...baseItem.answer_spec,
                input_type: 'decimal',
                tolerance: 0.1
            },
            solution_logic: {
                ...baseItem.solution_logic,
                final_answer_canonical: '3.14'
            }
        };
        expect(checkAnswer('3.14159', item)).toBe(true); // Diff is 0.00159 < 0.1
        expect(checkAnswer('3.2', item)).toBe(true); // Diff is 0.06 < 0.1
        expect(checkAnswer('3.3', item)).toBe(false); // Diff is 0.16 > 0.1
    });

    it('returns false for empty input', () => {
        expect(checkAnswer('', baseItem)).toBe(false);
    });
  });
});
