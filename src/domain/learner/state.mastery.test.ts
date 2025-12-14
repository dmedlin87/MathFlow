import { describe, it, expect } from 'vitest';
import { isMastered, MASTERY_THRESHOLD } from './state';
import type { SkillState } from '../types';

describe('Learner State Mastery', () => {
    const createSkillState = (masteryProb: number): SkillState => ({
        masteryProb,
        stability: 0,
        lastPracticed: new Date().toISOString(),
        misconceptions: []
    });

    it('returns true when mastery probability is greater than threshold', () => {
        const state = createSkillState(MASTERY_THRESHOLD + 0.01);
        expect(isMastered(state)).toBe(true);
    });

    it('returns false when mastery probability is equal to threshold', () => {
        const state = createSkillState(MASTERY_THRESHOLD);
        expect(isMastered(state)).toBe(false);
    });

    it('returns false when mastery probability is less than threshold', () => {
        const state = createSkillState(MASTERY_THRESHOLD - 0.01);
        expect(isMastered(state)).toBe(false);
    });
});
