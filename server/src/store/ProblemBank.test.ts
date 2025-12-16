import { describe, it, expect } from 'vitest';
import { ProblemBank } from './ProblemBank';
import type { MathProblemItem } from '../../../src/domain/types';

function createMockItem(id: string, skillId: string): MathProblemItem {
    return {
        meta: {
            id,
            skill_id: skillId,
            status: 'VERIFIED',
            difficulty: 1,
            version: 1,
            created_at: new Date().toISOString(),
            provenance: {} as any,
            verification_report: {} as any
        },
        problem_content: {
            stem: '?',
            format: 'text'
        },
        solution_logic: {
            final_answer_canonical: '1',
            final_answer_type: 'numeric',
            steps: []
        },
        answer_spec: {
            answer_mode: 'final_only',
            input_type: 'integer'
        },
        misconceptions: []
    };
}

describe('ProblemBank', () => {
    describe('sample strategy', () => {
        const bank = new ProblemBank();
        const skillId = 'test-skill-sampling';
        const TOTAL_ITEMS = 100;

        // Setup: Add 100 items
        it('should setup correctly', async () => {
             for (let i = 0; i < TOTAL_ITEMS; i++) {
                 await bank.save(createMockItem(`item-${i}`, skillId));
             }
        });

        it('should correctly sample small counts (count < len/2)', async () => {
            // Request 10 items (10% of 100) -> Sparse Strategy
            const items = await bank.fetch(skillId, 10);
            expect(items.length).toBe(10);

            // Uniqueness check
            const ids = new Set(items.map(i => i.meta.id));
            expect(ids.size).toBe(10);
        });

        it('should correctly sample medium counts (count >= len/2)', async () => {
             // Request 60 items (60% of 100) -> Partial Fisher-Yates Strategy
             const items = await bank.fetch(skillId, 60);
             expect(items.length).toBe(60);

             // Uniqueness check
             const ids = new Set(items.map(i => i.meta.id));
             expect(ids.size).toBe(60);
        });

        it('should correctly sample all items (count >= len)', async () => {
             // Request 100 items -> Full Fisher-Yates
             const items = await bank.fetch(skillId, 100);
             expect(items.length).toBe(100);

             const ids = new Set(items.map(i => i.meta.id));
             expect(ids.size).toBe(100);
        });

        it('should handle request for more items than available', async () => {
             // Request 150 items -> Should return 100
             const items = await bank.fetch(skillId, 150);
             expect(items.length).toBe(100);

             const ids = new Set(items.map(i => i.meta.id));
             expect(ids.size).toBe(100);
        });

        it('should handle empty bank or skill', async () => {
             const items = await bank.fetch('non-existent', 5);
             expect(items.length).toBe(0);
        });

        it('should handle count 0', async () => {
             const items = await bank.fetch(skillId, 0);
             expect(items.length).toBe(0);
        });
    });

    // Statistical Sanity Check (Flaky if threshold too tight, but good for logic verification)
    it('should be reasonably random', async () => {
        const bank = new ProblemBank();
        const skillId = 'random-check';
        // Add 10 items
        for (let i = 0; i < 10; i++) {
            await bank.save(createMockItem(`${i}`, skillId));
        }

        // Run Monte Carlo simulation for Sparse Sampling (fetch 2 from 10)
        const counts = new Array(10).fill(0);
        const TRIALS = 1000;

        for (let i=0; i<TRIALS; i++) {
            const items = await bank.fetch(skillId, 2);
            items.forEach(item => {
                counts[parseInt(item.meta.id)]++;
            });
        }

        // Expected count for each item is (2/10) * TRIALS = 200
        // Check if within reasonable bounds (e.g., +/- 30%)
        // This confirms we aren't just picking the first items or last items
        const expected = (2/10) * TRIALS;
        const tolerance = expected * 0.4; // 40% tolerance for random noise in 1000 trials

        counts.forEach(count => {
            expect(count).toBeGreaterThan(expected - tolerance);
            expect(count).toBeLessThan(expected + tolerance);
        });
    });
});
