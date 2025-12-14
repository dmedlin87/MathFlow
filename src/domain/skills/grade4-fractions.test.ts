import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubLikeFractionGenerator, SimplifyFractionGenerator } from './grade4-fractions';
import { gcd } from '../math-utils';

function getTexQuestionText(item: unknown): string {
  const question = (item as { question?: unknown }).question;
  if (typeof question === 'string') return question;
  if (typeof question === 'object' && question !== null) {
    const text = (question as { text?: unknown }).text;
    if (typeof text === 'string') return text;
  }
  throw new Error('Expected question with { text: string } or string');
}

 function getAnswerValueString(item: unknown): string {
  const answer = (item as { answer?: unknown }).answer;
  if (typeof answer === 'string' || typeof answer === 'number') return String(answer);
  if (typeof answer === 'object' && answer !== null) {
    const value = (answer as { value?: unknown }).value;
    if (typeof value === 'string') return value;
  }
  throw new Error('Expected answer as string/number or { value: string }');
 }

afterEach(() => {
  vi.restoreAllMocks();
});

describe('grade4-fractions generators', () => {
  describe('SubLikeFractionGenerator', () => {
    it('uses smaller ranges when difficulty < 0.5 (characterization)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.999) // den -> max
        .mockReturnValueOnce(0) // targetNum -> min
        .mockReturnValueOnce(0); // num2 -> min

      const item = SubLikeFractionGenerator.generate(0.1);

      const qText = getTexQuestionText(item);
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(10);

      const [ansNum, ansDen] = getAnswerValueString(item).split('/').map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
    });

    it('uses larger ranges when difficulty >= 0.5 (characterization)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.999) // den -> max
        .mockReturnValueOnce(0.999) // targetNum -> max
        .mockReturnValueOnce(0); // num2 -> min

      const item = SubLikeFractionGenerator.generate(0.9);

      const qText = getTexQuestionText(item);
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\} - \\frac\{(\d+)\}\{\2\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const num1 = Number(match[1]);
      const den = Number(match[2]);
      const num2 = Number(match[3]);

      expect(den).toBeLessThanOrEqual(20);
      expect(den).toBeGreaterThanOrEqual(3);

      const [ansNum, ansDen] = getAnswerValueString(item).split('/').map(Number);
      expect(ansDen).toBe(den);
      expect(num1 - num2).toBe(ansNum);
      expect(ansNum).toBeGreaterThan(0);
      expect(num2).toBeGreaterThan(0);
    });

    it('tags misconception answers for subtracting denominators or adding denominators', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0) // den -> min
        .mockReturnValueOnce(0) // targetNum -> min
        .mockReturnValueOnce(0); // num2 -> min

      const item = SubLikeFractionGenerator.generate(0.1);
      const matcher = item.misconceptionMatchers?.[0];
      expect(matcher).toBeDefined();
      if (!matcher) return;

      const [ansNum, ansDen] = getAnswerValueString(item).split('/').map(Number);

      expect(matcher(`${ansNum}/0`)).toBe('sub_num_sub_den');
      expect(matcher(`${ansNum}/${ansDen + ansDen}`)).toBe('sub_num_add_den');
      expect(matcher(`${ansNum}/${ansDen}`)).toBeNull();
    });
  });

  describe('SimplifyFractionGenerator', () => {
    it('generates a reducible fraction and provides a lowest-terms answer', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0) // numBase -> min
        .mockReturnValueOnce(0.999) // denBase -> max
        .mockReturnValueOnce(0.999); // multiplier -> max

      const item = SimplifyFractionGenerator.generate(0.1);

      const qText = getTexQuestionText(item);
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const questionNum = Number(match[1]);
      const questionDen = Number(match[2]);
      expect(gcd(questionNum, questionDen)).toBeGreaterThan(1);

      const [ansNum, ansDen] = getAnswerValueString(item).split('/').map(Number);
      expect(gcd(ansNum, ansDen)).toBe(1);
      expect(questionNum * ansDen).toBe(questionDen * ansNum);
    });

    it('expands number ranges when difficulty >= 0.5 (characterization)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.999) // numBase -> max
        .mockReturnValueOnce(0.999) // denBase -> max
        .mockReturnValueOnce(0.999); // multiplier -> max

      const item = SimplifyFractionGenerator.generate(0.9);
      const [ansNum, ansDen] = getAnswerValueString(item).split('/').map(Number);
      expect(ansNum).toBeGreaterThan(0);
      expect(ansDen).toBeGreaterThan(ansNum);
    });

    it('tags the no_simplify misconception when the original fraction is submitted', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0) // numBase -> min
        .mockReturnValueOnce(0.999) // denBase -> max
        .mockReturnValueOnce(0.999); // multiplier -> max

      const item = SimplifyFractionGenerator.generate(0.1);
      const matcher = item.misconceptionMatchers?.[0];
      expect(matcher).toBeDefined();
      if (!matcher) return;

      const qText = getTexQuestionText(item);
      const match = qText.match(/\\frac\{(\d+)\}\{(\d+)\}/);
      expect(match).not.toBeNull();
      if (!match) return;

      const questionNum = Number(match[1]);
      const questionDen = Number(match[2]);

      expect(matcher(`${questionNum}/${questionDen}`)).toBe('no_simplify');
      expect(matcher(getAnswerValueString(item))).toBeNull();
    });
  });
});
