import { describe, it, expect, vi } from 'vitest';
import { LocalLearnerService } from './LearnerService';
import type { Attempt, MathProblemItem } from '../domain/types';
import { MisconceptionEvaluator } from '../domain/learner/misconceptionEvaluator';

describe('LocalLearnerService', () => {
    it('should simulate network latency', async () => {
        const service = new LocalLearnerService();
        const start = Date.now();
        await service.loadState('user123');
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(300); // Expecting ~400ms
    });

    it('should return valid initial state', async () => {
        const service = new LocalLearnerService();
        const state = await service.loadState('user_test');
        expect(state.userId).toBe('user_test');
        expect(state.skillState).toBeDefined();
    });

    it('should submit attempt and return updated state', async () => {
        const service = new LocalLearnerService();
        const state = await service.loadState('user_test');
        
        const attempt: Attempt = {
            id: '123',
            userId: 'user_test',
            itemId: 'item1',
            skillId: 'any_skill', // simplified for test
            timestamp: new Date().toISOString(),
            isCorrect: true,
            timeTakenMs: 1000,
            attemptsCount: 1,
            hintsUsed: 0,
            errorTags: []
        };

        const newState = await service.submitAttempt(state, attempt);
        // We expect some update logic to run (though without valid skillId in domain it might just default)
        expect(newState).toBeDefined();
        // Latency check again
        const start = Date.now();
        await service.submitAttempt(state, attempt);
        expect(Date.now() - start).toBeGreaterThanOrEqual(300);
    });

    it('should reject non-serializable data (Architecture Violation)', async () => {
        const service = new LocalLearnerService();
        
        // Create a circular array
        const circularArray: any[] = [];
        circularArray.push(circularArray);

        // Spy on MisconceptionEvaluator to return circular data
        const spy = vi.spyOn(MisconceptionEvaluator, 'evaluate').mockReturnValue({
            tag: 'circular_error',
            hintLadder: circularArray,
            description: 'test'
        });
        
        // Silence expected error log
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const item = { misconceptions: [1] } as any; // Dummy item to pass check

        try {
            await expect(service.diagnose(item, 'bad_input'))
                .rejects
                .toThrow("Data could not be serialized (Architecture Violation)");
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Serialization Violation"), expect.anything());
        } finally {
            spy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

    it('should return null when answer matches no misconception', async () => {
        const service = new LocalLearnerService();
        const item: MathProblemItem = {
            meta: { 
                id: '1', skill_id: 'test', difficulty: 1, version: 1, 
                created_at: '', status: 'VERIFIED',
                provenance: {} as any, verification_report: {} as any
            },
            problem_content: { stem: '1+1', format: 'text' },
            answer_spec: { input_type: 'integer', answer_mode: 'final_only', ui: {} },
            solution_logic: { final_answer_canonical: '2', final_answer_type: 'numeric', steps: [] },
            misconceptions: [{
                id: 'm1', error_tag: 'test_error',
                trigger: { kind: 'exact_answer', value: '3' }, // Triggers on wrong answer
                hint_ladder: ['Hint']
            }]
        };

        // User gives correct answer '2' - no misconception triggers
        const diagnosis = await service.diagnose(item, '2');
        expect(diagnosis).toBeNull();
    });

    it('should diagnose known misconceptions', async () => {
        const service = new LocalLearnerService();
        const item: MathProblemItem = {
            meta: { 
                id: '1', skill_id: 'test', difficulty: 1, version: 1, 
                created_at: '', status: 'VERIFIED',
                provenance: {} as any, verification_report: {} as any
            },
            problem_content: { stem: '1+1', format: 'text' },
            answer_spec: { input_type: 'integer', answer_mode: 'final_only', ui: {} },
            solution_logic: { final_answer_canonical: '2', final_answer_type: 'numeric', steps: [] },
            misconceptions: [{
                id: 'm1', error_tag: 'test_error',
                trigger: { kind: 'exact_answer', value: '3' },
                hint_ladder: ['Hint']
            }]
        };

        const diagnosis = await service.diagnose(item, '3');
        expect(diagnosis).not.toBeNull();
        expect(diagnosis?.error_category).toBe('test_error');
        expect(diagnosis?.hint_ladder).toContain('Hint');
    });

    it('should get recommendation from domain logic', async () => {
        const service = new LocalLearnerService();
        const state = await service.loadState('user_reco');
        
        // Use the service to get a recommendation
        // Note: The actual recommendation logic is probabilistic/domain-dependent,
        // but the Service wrapper just needs to ensure it calls down and returns *something*.
        const item = await service.getRecommendation(state);
        
        expect(item).toBeDefined();
        expect(item.meta).toBeDefined();
        // Check for basic structure of a problem
        expect(item.problem_content).toBeDefined();
        // Latency check
        const start = Date.now();
        await service.getRecommendation(state);
        expect(Date.now() - start).toBeGreaterThanOrEqual(300);
    });
});
