import { describe, it, expect } from 'vitest';
import { engine } from '../generator/engine';
import {
  SKILL_5_GM_VOLUME_CUBES,
  SKILL_5_GM_VOLUME_FORMULA,
  SKILL_5_GM_COORD_PLANE,
  SKILL_5_GM_CLASS_FIGURES,
  SKILL_5_GM_UNIT_CONV
} from './grade5-meas-geo';

describe('Grade 5 GM Domain', () => {
    const generate = async (skillId: string) => {
        return await engine.generate(skillId, 0.5);
    };

    describe('SKILL_5_GM_VOLUME_CUBES', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_GM_VOLUME_CUBES.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_GM_VOLUME_CUBES.id);
                expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
            }
        });
    });

    describe('SKILL_5_GM_VOLUME_FORMULA', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_GM_VOLUME_FORMULA.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_GM_VOLUME_FORMULA.id);
                expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
            }
        });
    });

    describe('SKILL_5_GM_COORD_PLANE', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_GM_COORD_PLANE.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_GM_COORD_PLANE.id);
                expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('SKILL_5_GM_CLASS_FIGURES', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_GM_CLASS_FIGURES.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_GM_CLASS_FIGURES.id);
                expect(['True', 'False']).toContain(problem.solution_logic.final_answer_canonical);
            }
        });
    });

    describe('SKILL_5_GM_UNIT_CONV', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_GM_UNIT_CONV.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_GM_UNIT_CONV.id);
                expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
            }
        });
    });
});
