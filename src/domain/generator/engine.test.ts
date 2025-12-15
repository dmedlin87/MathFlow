import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { engine, Engine } from './engine';
import { EquivFractionGenerator } from '../skills/grade4-fractions';
import type { Generator, MathProblemItem } from '../types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Generator Engine', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        // Reset console spies if needed or just spy
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Client Integration (Network & Fallback)', () => {
        let testEngine: Engine;

        beforeEach(() => {
             // Create test engine with API configured (to enable network tests)
             testEngine = new Engine({ apiBaseUrl: 'http://localhost:3002/api' });
             testEngine.register(EquivFractionGenerator);
        });

        it('tries to fetch from API and successfully returns verifying item', async () => {
            const mockItem = {
                meta: { id: 'api_item_1', skill_id: 'frac_equiv_01' },
                problem_content: { stem: 'API Problem' }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [mockItem]
            });

            const item = await testEngine.generate('frac_equiv_01', 0.5);
            
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/problems?skillId=frac_equiv_01'));
            expect(item.meta.id).toBe('api_item_1');
        });

        it('falls back to local generator if API fetch fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network Error"));
            
            // Should catch error and fall back to local EquivGenerator
            const item = await testEngine.generate('frac_equiv_01', 0.5);
            
            expect(item).toBeDefined();
            expect(item.meta.skill_id).toBe('frac_equiv_01');
            // Check it came from local generator (random ID, not static API mock)
            expect(item.problem_content.stem).toContain('missing number');
        });

        it('falls back to local generator if API returns empty', async () => {
            // 1. Fetch returns empty []
            // 2. Factory run fetch returns empty (simulated)
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => [] }) 
                .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) }); 

            const item = await testEngine.generate('frac_equiv_01', 0.5);
            
            expect(mockFetch).toHaveBeenCalledTimes(2); // Problem fetch + Factory trigger
            expect(item).toBeDefined();
        });

        it('uses factory item if bank is empty but factory returns item', async () => {
            const factoryItem = {
                meta: { id: 'factory_item_1', skill_id: 'frac_equiv_01' },
                problem_content: { stem: 'Factory Problem' }
            };

            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Bank empty
                .mockResolvedValueOnce({ 
                    ok: true, 
                    json: async () => ({ items: [factoryItem] }) 
                }); // Factory returns item

            const item = await testEngine.generate('frac_equiv_01', 0.5);
            
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(item.meta.id).toBe('factory_item_1');
        });
        
        it('throws error when skill not found locally and API fails', async () => {
             mockFetch.mockRejectedValue(new Error("Network Error"));

             await expect(testEngine.generate('NON_EXISTENT_SKILL', 0.5)).rejects.toThrow(/No generator found/);
        });
    });

    describe('Registry & Behavior', () => {
        beforeEach(() => {
             // Force network failure to test local registry logic purely
             mockFetch.mockRejectedValue(new Error('Network offline (Test)'));
        });

        it('should register and retrieve a generator', async () => {
            const mockGen: Generator = {
                templateId: 'tpl_test_1',
                skillId: 'skill_test_1',
                generate: vi.fn().mockReturnValue({} as any),
            };
    
            engine.register(mockGen);
            
            await expect(engine.generate('skill_test_1', 0.5)).resolves.toBeDefined();
        });
    
        it('should generate an item when generator exists', async () => {
            const mockItem = {
                meta: { id: 'item_1', skill_id: 'skill_test_2' },
                problem_content: { stem: '1+1' },
                solution_logic: { final_answer_canonical: '2' }
            } as unknown as MathProblemItem;
    
            const mockGen: Generator = {
                templateId: 'tpl_test_2',
                skillId: 'skill_test_2',
                generate: vi.fn().mockReturnValue(mockItem),
            };
    
            engine.register(mockGen);
            
            const result = await engine.generate('skill_test_2', 0.5);
            
            expect(result).toBe(mockItem);
            expect(mockGen.generate).toHaveBeenCalledWith(0.5, undefined);
        });
    });
});

