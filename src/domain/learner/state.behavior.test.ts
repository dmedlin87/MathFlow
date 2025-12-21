import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Skill } from '../types';

// Define mocks before imports
const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'Skill 1',
    gradeBand: '3-5',
    templates: [],
    prereqs: [],
    misconceptions: [],
  },
  {
    id: 'skill-2',
    name: 'Skill 2',
    gradeBand: '3-5',
    templates: [],
    prereqs: ['skill-1'],
    misconceptions: [],
  },
];

// Mock engine
vi.mock('../generator/engine', () => ({
  engine: {
    generate: vi.fn(),
  },
}));

// Mock ALL_SKILLS_LIST - hoisted, so we must use the const defined above if we could,
// but vitest hoisting prevents accessing out-of-scope vars.
// We must inline the value or use a getter.
vi.mock('../skills/registry', () => ({
  ALL_SKILLS_LIST: [
      {
        id: 'skill-1',
        name: 'Skill 1',
        gradeBand: '3-5',
        templates: [],
        prereqs: [],
        misconceptions: [],
      },
      {
        id: 'skill-2',
        name: 'Skill 2',
        gradeBand: '3-5',
        templates: [],
        prereqs: ['skill-1'],
        misconceptions: [],
      },
    ]
}));

// Import after mocks
import { createInitialState, updateLearnerState, recommendNextItem } from './state';
import { engine } from '../generator/engine';
import { ALL_SKILLS_LIST } from '../skills/registry';

describe('learner/state.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInitialState', () => {
    it('initializes state for all registered skills with default values', () => {
      const state = createInitialState('user-1');

      expect(state.userId).toBe('user-1');
      expect(state.skillState['skill-1']).toEqual(
        expect.objectContaining({
          masteryProb: 0.1,
          stability: 0,
        })
      );
      expect(state.skillState['skill-2']).toEqual(
        expect.objectContaining({
          masteryProb: 0.1,
          stability: 0,
        })
      );
    });
  });

  describe('updateLearnerState', () => {
    it('initializes missing skill state before updating', () => {
      const initialState = createInitialState('user-1');
      // Simulate missing skill (e.g. added later to registry)
      delete initialState.skillState['skill-1'];

      const newState = updateLearnerState(initialState, {
        skillId: 'skill-1',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });

      expect(newState.skillState['skill-1']).toBeDefined();
      expect(newState.skillState['skill-1'].masteryProb).toBeGreaterThan(0.1);
    });

    it('increases mastery on correct attempt (BKT)', () => {
      const state = createInitialState('user-1');
      const initialMastery = state.skillState['skill-1'].masteryProb;

      const newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });

      expect(newState.skillState['skill-1'].masteryProb).toBeGreaterThan(initialMastery);
    });

    it('decreases mastery on incorrect attempt (BKT)', () => {
      const state = createInitialState('user-1');
      // Set initial mastery higher so we can see decrease
      state.skillState['skill-1'].masteryProb = 0.5;

      const newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });

      expect(newState.skillState['skill-1'].masteryProb).toBeLessThan(0.5);
    });

    it('increases stability when mastery is high (>0.8) and correct', () => {
      const state = createInitialState('user-1');
      state.skillState['skill-1'].masteryProb = 0.9;
      state.skillState['skill-1'].stability = 1;

      const newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });

      expect(newState.skillState['skill-1'].stability).toBeGreaterThan(1);
    });

    it('decreases stability on incorrect attempt', () => {
      const state = createInitialState('user-1');
      state.skillState['skill-1'].stability = 2;

      const newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });

      expect(newState.skillState['skill-1'].stability).toBeLessThan(2);
    });

    it('clamps mastery probability between 0.01 and 0.99', () => {
      const state = createInitialState('user-1');

      // Test lower bound
      state.skillState['skill-1'].masteryProb = 0.01;
      // Force it down
      let newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: false,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });
      expect(newState.skillState['skill-1'].masteryProb).toBeGreaterThanOrEqual(0.01);

      // Test upper bound
      state.skillState['skill-1'].masteryProb = 0.99;
      // Force it up
      newState = updateLearnerState(state, {
        skillId: 'skill-1',
        isCorrect: true,
        timestamp: new Date().toISOString(),
        timeTaken: 10,
        type: 'attempt',
        input: '1',
      });
      expect(newState.skillState['skill-1'].masteryProb).toBeLessThanOrEqual(0.99);
    });
  });

  describe('recommendNextItem', () => {
    it('throws error if no skills available', async () => {
      const state = createInitialState('user-1');
      await expect(recommendNextItem(state, Math.random, [])).rejects.toThrow('No skills available');
    });

    it('prioritizes Review Due items (mastery > 0.8 and interval passed)', async () => {
      const state = createInitialState('user-1');
      const now = new Date();

      // Setup skill-1 as review due
      state.skillState['skill-1'].masteryProb = 0.9;
      state.skillState['skill-1'].stability = 0; // 24h interval
      const lastPracticed = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      state.skillState['skill-1'].lastPracticed = lastPracticed.toISOString();

      // Setup skill-2 as not due
      state.skillState['skill-2'].masteryProb = 0.5;

      // Mock RNG to pick review (roll < 0.3)
      const mockRng = vi.fn().mockReturnValue(0.1);

      // Pass ALL_SKILLS_LIST explicitly to avoid using the mocked module if it's tricky,
      // but the function signature allows injection.
      await recommendNextItem(state, mockRng, ALL_SKILLS_LIST);

      expect(engine.generate).toHaveBeenCalledWith('skill-1', 0.9);
    });

    it('prioritizes Learning Queue (lowest mastery) when no review due or roll >= 0.3', async () => {
      const state = createInitialState('user-1');

      // skill-1: 0.5 mastery
      state.skillState['skill-1'].masteryProb = 0.5;

      // skill-2: 0.3 mastery (should be picked)
      state.skillState['skill-2'].masteryProb = 0.3;
      // Ensure skill-2 prereqs met
      state.skillState['skill-1'].masteryProb = 0.8; // Met

      const mockRng = vi.fn().mockReturnValue(0.5); // Skip review check

      await recommendNextItem(state, mockRng, ALL_SKILLS_LIST);

      expect(engine.generate).toHaveBeenCalledWith('skill-2', 0.3);
    });

    it('respects prerequisites for Learning Queue', async () => {
      const state = createInitialState('user-1');

      // skill-1: 0.1 mastery (Prereq for skill-2)
      state.skillState['skill-1'].masteryProb = 0.1;

      // skill-2: 0.1 mastery, but prereq skill-1 not met (< 0.7)
      state.skillState['skill-2'].masteryProb = 0.1;

      const mockRng = vi.fn().mockReturnValue(0.5);

      await recommendNextItem(state, mockRng, ALL_SKILLS_LIST);

      // Should pick skill-1 because skill-2 is blocked
      expect(engine.generate).toHaveBeenCalledWith('skill-1', 0.1);
    });

    it('falls back to random selection if no review and queue empty (e.g. all mastered)', async () => {
        const state = createInitialState('user-1');

        // All mastered
        state.skillState['skill-1'].masteryProb = 0.9;
        state.skillState['skill-1'].lastPracticed = new Date().toISOString(); // Not due

        state.skillState['skill-2'].masteryProb = 0.9;
        state.skillState['skill-2'].lastPracticed = new Date().toISOString(); // Not due

        const mockRng = vi.fn()
            .mockReturnValueOnce(0.5) // Skip review check (even if empty)
            .mockReturnValueOnce(0); // Index 0 for random fallback

        await recommendNextItem(state, mockRng, ALL_SKILLS_LIST);

        // Either skill is fine, checking call
        expect(engine.generate).toHaveBeenCalled();
    });
  });
});
