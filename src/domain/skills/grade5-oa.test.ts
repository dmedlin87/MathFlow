import { describe, it, expect } from 'vitest';
import { engine } from '../generator/engine';
import {
  SKILL_5_OA_ORDER_OPS,
  SKILL_5_OA_PATTERNS
} from './grade5-oa';

describe('Grade 5 OA Domain', () => {
    const generate = async (skillId: string) => {
        return await engine.generate(skillId, 0.5);
    };

    describe('SKILL_5_OA_ORDER_OPS', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_OA_ORDER_OPS.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_OA_ORDER_OPS.id);
                expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('SKILL_5_OA_PATTERNS', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_OA_PATTERNS.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_OA_PATTERNS.id);
                expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
            }
        });
    });
});
