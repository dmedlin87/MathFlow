import { describe, it, expect, vi } from 'vitest';
import { engine } from './engine';
import type { Generator } from '../types';

describe('generator/engine behavior', () => {
    // Reset engine potentially or just register new things.
    // Since `engine` is a singleton instance exported directly, it retains state.
    // Ideally we would reset it, but looking at class, it has no clear reset.
    // We will register unique IDs for these tests to avoid collisions.

    it('should register and retrieve a generator', () => {
        const mockGen: Generator = {
            templateId: 'tpl_test_1',
            skillId: 'skill_test_1',
            generate: vi.fn(),
        };

        engine.register(mockGen);
        const retrieved = engine.getGenerator('tpl_test_1');
        expect(retrieved).toBe(mockGen);
    });

    it('should generate an item when generator exists', () => {
        const mockItem = {
            id: 'item_1',
            skillId: 'skill_1',
            question: '1+1',
            answer: 2
        };

        const mockGen: Generator = {
            templateId: 'tpl_test_2',
            skillId: 'skill_test_2',
            generate: vi.fn().mockReturnValue(mockItem),
        };

        engine.register(mockGen);
        
        const result = engine.generateItem('tpl_test_2', 0.5);
        
        expect(result).toBe(mockItem);
        expect(mockGen.generate).toHaveBeenCalledWith(0.5);
    });

    it('should throw strict error when generator is missing', () => {
        expect(() => {
            engine.generateItem('non_existent_template_999', 0.5);
        }).toThrow(/No generator found for template: non_existent_template_999/);
    });
});
