import { describe, it, expect } from 'vitest';
import { gcd, getFactors } from './math-utils';

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
});
