import type { LearnerState, SkillState } from '../domain/types';

export const createTestState = (overrides: Partial<LearnerState> = {}): LearnerState => ({
  userId: 'test_user',
  skillState: {},
  ...overrides
});

export const createSkillState = (overrides: Partial<SkillState> = {}): SkillState => ({
  masteryProb: 0.1,
  stability: 0,
  lastPracticed: new Date().toISOString(),
  misconceptions: [],
  ...overrides
});

/**
 * Returns a fixed date for testing: 2024-01-01T12:00:00.000Z
 */
export const getFixedDate = () => new Date('2024-01-01T12:00:00.000Z');
