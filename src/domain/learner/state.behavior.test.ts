
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLearnerState, recommendNextItem, createInitialState } from './state';
import { ALL_SKILLS_LIST } from '../skills/registry';
import { engine } from '../generator/engine';

// Mock dependencies
vi.mock('../skills/registry', () => ({
  ALL_SKILLS_LIST: [
    { id: 'skill-a', prereqs: [] },
    { id: 'skill-b', prereqs: ['skill-a'] },
    { id: 'skill-c', prereqs: [] }
  ]
}));

vi.mock('../generator/engine', () => ({
  engine: {
    generate: vi.fn().mockResolvedValue({ meta: { id: 'test-item' } })
  }
}));

describe('Learner State Behavior', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInitialState', () => {
    it('initializes all registry skills with default values', () => {
      const state = createInitialState(mockUserId);
      expect(state.userId).toBe(mockUserId);
      expect(Object.keys(state.skillState)).toHaveLength(3); // A, B, C from mock
      expect(state.skillState['skill-a'].masteryProb).toBe(0.1);
      expect(state.skillState['skill-a'].stability).toBe(0);
    });
  });

  describe('updateLearnerState', () => {
    it('initializes missing skill state when updating', () => {
      const state = { userId: mockUserId, skillState: {} };
      const attempt = {
        skillId: 'skill-a',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        problemId: 'p1'
      };

      const newState = updateLearnerState(state as any, attempt);
      expect(newState.skillState['skill-a']).toBeDefined();
      expect(newState.skillState['skill-a'].masteryProb).toBeGreaterThan(0.1); // Increased from 0.1
    });

    it('increases stability by 1 when mastery is high (>0.8) and attempt is correct', () => {
      const state = {
        userId: mockUserId,
        skillState: {
          'skill-a': { masteryProb: 0.9, stability: 2, lastPracticed: '', misconceptions: [] }
        }
      };
      const attempt = {
        skillId: 'skill-a',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        problemId: 'p1'
      };

      const newState = updateLearnerState(state as any, attempt);
      expect(newState.skillState['skill-a'].stability).toBe(3); // 2 + 1
    });

    it('decreases stability by 0.5 (clamped to 0) when attempt is incorrect', () => {
      const state = {
        userId: mockUserId,
        skillState: {
          'skill-a': { masteryProb: 0.5, stability: 0.2, lastPracticed: '', misconceptions: [] }
        }
      };
      const attempt = {
        skillId: 'skill-a',
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        problemId: 'p1'
      };

      const newState = updateLearnerState(state as any, attempt);
      expect(newState.skillState['skill-a'].stability).toBe(0); // 0.2 - 0.5 clamped to 0
    });
  });

  describe('recommendNextItem', () => {
    it('filters out skills with unmet prerequisites', async () => {
      const state = {
        userId: mockUserId,
        skillState: {
          'skill-a': { masteryProb: 0.1, stability: 0, lastPracticed: '', misconceptions: [] }, // Prereq not met (<0.7)
          'skill-b': { masteryProb: 0.1, stability: 0, lastPracticed: '', misconceptions: [] }  // Depends on A
        }
      };

      // Mock RNG to pick B if available (it shouldn't be)
      const rng = () => 0.5;

      await recommendNextItem(state as any, rng);

      // Should have generated A or C (no prereqs), but definitely not B
      // Since we mocked registry to have A, B, C.
      // A (0.1), B (prereq fail), C (0.1 default)
      // Learning queue: A, C.
      // We verify engine called with A or C
      const calls = vi.mocked(engine.generate).mock.calls;
      const skillId = calls[0][0];
      expect(['skill-a', 'skill-c']).toContain(skillId);
      expect(skillId).not.toBe('skill-b');
    });

    it('sets difficulty to 0.9 for review items (mastery > 0.8)', async () => {
      const now = new Date();
      const longAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago

      const state = {
        userId: mockUserId,
        skillState: {
          'skill-a': { masteryProb: 0.95, stability: 0, lastPracticed: longAgo, misconceptions: [] }
        }
      };

      // Force review selection (RNG < 0.3)
      const rng = () => 0.1;

      await recommendNextItem(state as any, rng);

      expect(engine.generate).toHaveBeenCalledWith('skill-a', 0.9);
    });
  });
});
