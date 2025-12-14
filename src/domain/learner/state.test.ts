import { describe, it, expect } from 'vitest';
import { createInitialState, updateLearnerState } from './state';
import type { Attempt, LearnerState } from '../types';
import { SKILL_EQUIV_FRACTIONS, SKILL_ADD_LIKE_FRACTIONS } from '../skills/grade4-fractions';

describe('Learner State Behavior', () => {
    describe('createInitialState', () => {
        it('initializes state with correct userId and defaults', () => {
            const userId = 'test_user_123';
            const state = createInitialState(userId);

            expect(state.userId).toBe(userId);
            expect(state.skillState).toBeDefined();
            
            // Contract: Must initialize known skills
            expect(state.skillState[SKILL_EQUIV_FRACTIONS.id]).toBeDefined();
            expect(state.skillState[SKILL_ADD_LIKE_FRACTIONS.id]).toBeDefined();

            // Contract: Default mastery is 0.1
            expect(state.skillState[SKILL_EQUIV_FRACTIONS.id].masteryProb).toBe(0.1);
        });
    });

    describe('updateLearnerState', () => {
        // Base state helper
        const baseState: LearnerState = createInitialState('u1');
        const skillId = SKILL_EQUIV_FRACTIONS.id;

        it('increases mastery on correct attempt', () => {
            // Given
            const startProb = baseState.skillState[skillId].masteryProb; // 0.1
            const attempt: Attempt = {
                id: 'a1',
                userId: 'u1',
                itemId: 'i1',
                skillId: skillId,
                isCorrect: true,
                timestamp: new Date().toISOString(),
                timeTakenMs: 1000,
                attemptsCount: 1,
                hintsUsed: 0,
                errorTags: []
            };

            // When
            const newState = updateLearnerState(baseState, attempt);

            // Then
            const newProb = newState.skillState[skillId].masteryProb;
            expect(newProb).toBeGreaterThan(startProb);
            
            // Check specific BKT math if we want to lock behavior, but strictly "increases" is the behavior we care about most.
            // But let's be strict as per prompt:
            // P(L|Correct) upd logic calculation:
            // P=0.1, S=0.1, G=0.2, T=0.1
            // num = 0.1 * 0.9 = 0.09
            // den = 0.09 + (0.9 * 0.2) = 0.09 + 0.18 = 0.27
            // P_post = 0.09 / 0.27 = 0.333...
            // P_transit = 0.333 + (0.666 * 0.1) = 0.333 + 0.0666 = 0.4
            
            expect(newProb).toBeCloseTo(0.4, 1); 
        });

        it('decreases mastery on incorrect attempt', () => {
             // Given state with some mastery so we can see it drop
             const higherState = { ...baseState };
             higherState.skillState[skillId] = { ...baseState.skillState[skillId], masteryProb: 0.5 };
             
             const attempt: Attempt = {
                id: 'a2',
                userId: 'u1',
                itemId: 'i1',
                skillId: skillId,
                isCorrect: false, // Incorrect
                timestamp: new Date().toISOString(),
                timeTakenMs: 1000,
                attemptsCount: 1,
                hintsUsed: 0,
                errorTags: []
            };

            // When
            const newState = updateLearnerState(higherState, attempt);

            // Then
            const newProb = newState.skillState[skillId].masteryProb;
            expect(newProb).toBeLessThan(0.5);
        });

        it('clamps mastery between 0.01 and 0.99', () => {
            // Case 1: Attempt to go below 0.01
            // If we have very low mastery and get it wrong.
            const lowState = { ...baseState };
            lowState.skillState[skillId] = { ...baseState.skillState[skillId], masteryProb: 0.01 };
            
            const wrongAttempt: Attempt = {
                id: 'a3',
                userId: 'u1',
                itemId: 'i1',
                skillId: skillId,
                isCorrect: false,
                timestamp: new Date().toISOString(),
                timeTakenMs: 1000,
                attemptsCount: 1, hintsUsed: 0, errorTags: []
            };
            
            const newStateLow = updateLearnerState(lowState, wrongAttempt);
            expect(newStateLow.skillState[skillId].masteryProb).toBeGreaterThanOrEqual(0.01); // Actually logic should keep it at min 0.01

             // Case 2: Attempt to go above 0.99
             const highState = { ...baseState };
             highState.skillState[skillId] = { ...baseState.skillState[skillId], masteryProb: 0.99 };
             
             const correctAttempt: Attempt = {
                 id: 'a4',
                 userId: 'u1',
                 itemId: 'i1',
                 skillId: skillId,
                 isCorrect: true,
                 timestamp: new Date().toISOString(),
                 timeTakenMs: 1000,
                 attemptsCount: 1, hintsUsed: 0, errorTags: []
             };
             
             const newStateHigh = updateLearnerState(highState, correctAttempt);
             expect(newStateHigh.skillState[skillId].masteryProb).toBeLessThanOrEqual(0.99);
        });

        it('initializes missing skill state on fly (Safe Falback)', () => {
            // If attempt comes in for a skill NOT in the state
            const attempt: Attempt = {
                id: 'a5',
                userId: 'u1',
                itemId: 'i1',
                skillId: 'unknown_skill_id',
                isCorrect: true,
                timestamp: new Date().toISOString(),
                timeTakenMs: 1000,
                attemptsCount: 1, hintsUsed: 0, errorTags: []
            };
            
            const newState = updateLearnerState(baseState, attempt);
            
            expect(newState.skillState['unknown_skill_id']).toBeDefined();
            // Should have performed an update on the default 0.1
            expect(newState.skillState['unknown_skill_id'].masteryProb).toBeGreaterThan(0.1);
        });
        
        it('returns a new state reference (Immutability)', () => {
            const attempt: Attempt = {
                 id: 'a6', userId: 'u1', itemId: 'i1', skillId: skillId, isCorrect: true,
                 timestamp: new Date().toISOString(), timeTakenMs: 1000, attemptsCount: 1, hintsUsed: 0, errorTags: []
            };
            
            const newState = updateLearnerState(baseState, attempt);
            expect(newState).not.toBe(baseState);
            expect(newState.skillState).not.toBe(baseState.skillState);
        });
    });
});
