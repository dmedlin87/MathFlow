import { describe, it, expect, vi } from 'vitest';
import { ContentPipeline } from './pipeline';
import { MockFractionsGenerator, MockCritic, MockJudge } from './generators/fractions';

describe('ContentPipeline', () => {
    it('successfully generates and verifies an item', async () => {
        const generator = new MockFractionsGenerator();
        const critic = new MockCritic(false); // Passes
        const judge = new MockJudge();
        
        const pipeline = new ContentPipeline(generator, critic, judge);
        
        const item = await pipeline.run(0.5);
        
        expect(item).not.toBeNull();
        if (!item) return;
        
        expect(item.meta.status).toBe('VERIFIED');
        expect(item.meta.provenance.attempt).toBe(1);
        expect(item.meta.provenance.critic_model).toBe('mock-critic-v1');
    });

    it('retries on rejection and respects maxAttempts', async () => {
        const generator = new MockFractionsGenerator();
        // Spy on generate to count calls
        const spyGen = vi.spyOn(generator, 'generate');
        
        const critic = new MockCritic(true); // Always fails
        const judge = new MockJudge(); // Will reject based on critic
        
        const pipeline = new ContentPipeline(generator, critic, judge, undefined, { 
            maxAttempts: 2, 
            requireDeterministicVerification: false 
        });
        
        const item = await pipeline.run(0.5);
        
        expect(item).toBeNull(); // Should fail after retries
        expect(spyGen).toHaveBeenCalledTimes(2);
    });

    it('uses deterministic verifier if provided', async () => {
        const generator = new MockFractionsGenerator();
        const critic = new MockCritic(false);
        const judge = new MockJudge();
        
        const mockVerifier = {
            verify: vi.fn().mockResolvedValue({ 
                passed: true, 
                details: "Verified via MathEngine", 
                type: "numeric" 
            })
        };
        
        const pipeline = new ContentPipeline(generator, critic, judge, mockVerifier);
        
        const item = await pipeline.run(0.5);
        
        expect(item).not.toBeNull();
        expect(mockVerifier.verify).toHaveBeenCalled();
        expect(item?.meta.provenance.verifier.passed).toBe(true);
        expect(item?.meta.provenance.verifier.type).toBe('numeric');
    });
});
