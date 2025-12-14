import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInitialState, updateLearnerState, recommendNextItem } from './state';
import { createTestState, createSkillState, getFixedDate } from '../../test/testHelpers';
import { engine } from '../generator/engine';

// Mock dependencies
vi.mock('../generator/engine', () => ({
  engine: {
    generateItem: vi.fn(),
    register: vi.fn(),
  }
}));

// Mock Date and Random
const FIXED_DATE = getFixedDate();

describe('learner/state behavior', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(FIXED_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('createInitialState', () => {
        it('should return a zeroed state for a new user', () => {
            const state = createInitialState('user_123');
            expect(state.userId).toBe('user_123');
            // Check that we have skill entries
            expect(Object.keys(state.skillState).length).toBeGreaterThan(0);
            
            // detailed check on one
            const firstSkill = Object.values(state.skillState)[0];
            expect(firstSkill.masteryProb).toBe(0.1);
            expect(firstSkill.stability).toBe(0);
        });
    });

    describe('updateLearnerState', () => {
        it('should increase mastery when attempt is correct', () => {
             const startState = createTestState({
                 skillState: {
                     'test_skill': createSkillState({ masteryProb: 0.5 })
                 }
             });

             const attempt = {
                 id: 'att_1',
                 userId: 'user_1',
                 itemId: 'item_1',
                 skillId: 'test_skill',
                 timestamp: FIXED_DATE.toISOString(),
                 isCorrect: true,
                 timeTakenMs: 1000,
                 attemptsCount: 1,
                 errorTags: [],
                 hintsUsed: 0
             };

             const newState = updateLearnerState(startState, attempt);
             // Bayesian update: 0.5 prior, correct answer -> should go up
             expect(newState.skillState['test_skill'].masteryProb).toBeGreaterThan(0.5);
        });

        it('should decrease mastery when attempt is incorrect', () => {
            const startState = createTestState({
                skillState: {
                    'test_skill': createSkillState({ masteryProb: 0.5 })
                }
            });

            const attempt = {
                id: 'att_1',
                userId: 'user_1',
                itemId: 'item_1',
                skillId: 'test_skill',
                timestamp: FIXED_DATE.toISOString(),
                isCorrect: false,
                timeTakenMs: 1000,
                attemptsCount: 1,
                hintsUsed: 0,
                errorTags: []
            };

            const newState = updateLearnerState(startState, attempt);
            expect(newState.skillState['test_skill'].masteryProb).toBeLessThan(0.5);
        });

        it('should clamp mastery between 0.01 and 0.99', () => {
             // Case 1: Max out
             const highState = createTestState({
                 skillState: { 'test_skill': createSkillState({ masteryProb: 0.999 }) }
             });
             // Even a correct answer shouldn't push it past 0.99 (after transit/clamp)
             const attempt = {
                 id: 'att_1', 
                 userId: 'u1', 
                 itemId: 'i1', 
                 skillId: 'test_skill', 
                 timestamp: FIXED_DATE.toISOString(), 
                 isCorrect: true, 
                 timeTakenMs: 100, 
                 attemptsCount: 1, 
                 hintsUsed: 0,
                 errorTags: [] 
             };
             
             const newState = updateLearnerState(highState, attempt);
             expect(newState.skillState['test_skill'].masteryProb).toBeLessThanOrEqual(0.99);

             // Case 2: Bottom out?
             // Not strictly testing the lower bound heavy logic here, but general clamp behavior checks are good.
        });
        
        it('should initialize state for a new skill if missing', () => {
             const state = createTestState({ skillState: {} });
             const attempt = {
                 id: 'att_1', 
                 userId: 'u1', 
                 itemId: 'i1', 
                 skillId: 'new_skill', 
                 timestamp: FIXED_DATE.toISOString(), 
                 isCorrect: true, 
                 timeTakenMs: 100, 
                 attemptsCount: 1, 
                 hintsUsed: 0,
                 errorTags: [] 
             };
             
             const newState = updateLearnerState(state, attempt);
             expect(newState.skillState['new_skill']).toBeDefined();
             expect(newState.skillState['new_skill'].masteryProb).toBeGreaterThan(0.1); // initialized at 0.1 then updated
        });
    });

    describe('recommendNextItem', () => {
        // We know from specific knowledge that `grade4-fractions` defines skills:
        // 'frac_equiv_01' and 'frac_add_like_01'
        const SKILL_ID_1 = 'frac_equiv_01';
        
        beforeEach(() => {
            (engine.generateItem as ReturnType<typeof vi.fn>).mockReturnValue({
                id: 'gen_item',
                skillId: SKILL_ID_1,
                question: 'Q',
                answer: 'A'
            });
        });

        it('should select review items when due (>24h) and random roll < 0.3', () => {
            // Force Random to select Review (roll < 0.3)
            vi.spyOn(Math, 'random').mockReturnValue(0.1);

            // Create state where skill is mastered but old (>24h)
            // FIXED_DATE is 2024-01-01T12:00
            // Last practiced: 2023-12-30 (48 hours ago)
            const oldDate = new Date('2023-12-30T12:00:00.000Z').toISOString();
            
            const state = createTestState({
                skillState: {
                    [SKILL_ID_1]: createSkillState({ 
                        masteryProb: 0.95, // High mastery
                        lastPracticed: oldDate 
                    })
                }
            });

            recommendNextItem(state);

            // We expect it to have called generator for this skill
            // In `recommendNextItem`, it calls engine.generateItem(templateId, difficulty)
            // If it picked the review item, difficulty should be 0.9 (line 136 in state.ts)
            expect(engine.generateItem).toHaveBeenCalledWith(
                expect.any(String), // template ID
                0.9 // high difficulty for review
            );
        });

        it('should select learning queue items when random roll > 0.3', () => {
            // Force Random to skip Review (roll > 0.3)
            vi.spyOn(Math, 'random').mockReturnValue(0.5);

            // State: 
            // Skill 1: Mastered, Old (Valid for review, but RNG skipped it)
            // Skill 2: Low mastery (Valid for learning)
            const oldDate = new Date('2023-12-30T12:00:00.000Z').toISOString();
            
            const state = createTestState({
                skillState: {
                    [SKILL_ID_1]: createSkillState({ masteryProb: 0.95, lastPracticed: oldDate }), // Review candidate
                    'frac_add_like_01': createSkillState({ masteryProb: 0.2 }) // Default low mastery
                }
            });

            recommendNextItem(state);
            
            // Should pick the low mastery one. 
            // Difficulty for low mastery is the mastery itself (0.2) or slightly above 0.1
            expect(engine.generateItem).toHaveBeenCalledWith(
                expect.any(String),
                expect.closeTo(0.2, 1) 
            );
        });

        it('should pick lowest mastery item from learning queue', () => {
             // Mock sort behavior
             vi.spyOn(Math, 'random').mockReturnValue(0.5);

             const state = createTestState({
                skillState: {
                    'frac_equiv_01': createSkillState({ masteryProb: 0.75 }),
                    'frac_add_like_01': createSkillState({ masteryProb: 0.2 }) 
                }
            });
            
            // To properly test this, we need to know WHICH template corresponds to WHICH skill
            // Since we can't easily inspect the return value's internal decision without spying deeper or knowing map,
            // we rely on the implementation details we saw in `grade4-fractions.ts` or just general behavior.
            // But verify: 'frac_add_like_01' has lower mastery (0.2), so it should be picked.
            
            // We can check the difficulty passed to generateItem. It should match the chosen skill's mastery (0.2).
            recommendNextItem(state);
            
            expect(engine.generateItem).toHaveBeenCalledWith(
                expect.any(String),
                0.2
            );
        });

        it('should fallback to random skill when no review or learning candidates exist', () => {
            // Mock random roll to > 0.3 to avoid forced review logic
            // (Though review logic requires >0.8 mastery AND >24h old, which we won't satisfy below)
            vi.spyOn(Math, 'random').mockReturnValue(0.9);

            // Create state where ALL skills are mastered (>0.8) and recently practiced (<24h)
            // So Review Queue is empty.
            // Learning Queue is empty (all > 0.8).
            const recentDate = new Date().toISOString();
            
            const state = createTestState({
               skillState: {
                   'frac_equiv_01': createSkillState({ masteryProb: 0.9, lastPracticed: recentDate }),
                   'frac_add_like_01': createSkillState({ masteryProb: 0.95, lastPracticed: recentDate })
               }
           });

           recommendNextItem(state);

           // It should validly call generateItem for ONE of them (fallback picks random from all candidates)
           expect(engine.generateItem).toHaveBeenCalled();
       });

       it('should skip skill if prerequisites are not met', () => {
           // Behavior: frac_add_like_01 requires frac_equiv_01 > 0.7
           // Case: frac_equiv_01 is 0.5 (unmet prereq), frac_add_like_01 is 0.1 (needs learning)
           // Expectation: frac_add_like_01 is blocked. Engine picks frac_equiv_01 (lowest mastery valid item).
           
           vi.spyOn(Math, 'random').mockReturnValue(0.5);

           const state = createTestState({
               skillState: {
                   'frac_equiv_01': createSkillState({ masteryProb: 0.5 }), 
                   'frac_add_like_01': createSkillState({ masteryProb: 0.1 }) 
               }
           });

           recommendNextItem(state);

           // We expect the generator to be called for the prerequisite skill (equiv fractions)
           // because the other one is blocked.
           expect(engine.generateItem).toHaveBeenCalledWith(
               'T_EQUIV_FRACTION_FIND', // Template for frac_equiv_01
               expect.any(Number)
           );
           
           // Should NOT call the blocked one
           expect(engine.generateItem).not.toHaveBeenCalledWith(
               'T_ADD_LIKE_FRACTION',
               expect.any(Number)
           );
       });

       it('should handle recommended skill not being present in state (default difficulty)', () => {
             // Case: State is empty. 
             // Logic will use default values for candidacy, pick a skill (likely random or first learning queue).
             // When calculating difficulty, state.skillState[id] is undefined.
             // Should default to 0.1.
             
             const state = createTestState({ skillState: {} });
             recommendNextItem(state);
             
             expect(engine.generateItem).toHaveBeenCalledWith(
                 expect.any(String),
                 0.1 // Default difficulty
             );
        });
    });
});
