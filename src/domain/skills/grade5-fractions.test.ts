import { describe, it, expect } from 'vitest';
import { engine } from '../generator/engine';
import {
  SKILL_5_NF_ADD_SUB_UNLIKE,
  SKILL_5_NF_FRAC_DIV,
  SKILL_5_NF_SCALING,
  SKILL_5_NF_MULT_FRAC,
  SKILL_5_NF_DIV_FRAC
} from './grade5-fractions';

describe('Grade 5 NF Domain', () => {
    const generate = async (skillId: string) => {
        return await engine.generate(skillId, 0.5);
    };

    describe('SKILL_5_NF_ADD_SUB_UNLIKE', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_NF_ADD_SUB_UNLIKE.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_NF_ADD_SUB_UNLIKE.id);
                expect(problem.answer_spec.input_type).toBe('fraction');
                expect(problem.solution_logic.final_answer_canonical).toContain('/');
            }
        });
    });

    describe('SKILL_5_NF_FRAC_DIV', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_NF_FRAC_DIV.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_NF_FRAC_DIV.id);
                expect(problem.answer_spec.input_type).toBe('fraction');
            }
        });
    });

    describe('SKILL_5_NF_SCALING', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_NF_SCALING.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_NF_SCALING.id);
                expect(problem.answer_spec.input_type).toBe('multiple_choice');
                expect(['<', '>', '=']).toContain(problem.solution_logic.final_answer_canonical);
            }
        });
    });

    describe('SKILL_5_NF_MULT_FRAC', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_NF_MULT_FRAC.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_NF_MULT_FRAC.id);
                expect(problem.answer_spec.input_type).toBe('fraction');
                expect(problem.solution_logic.final_answer_canonical).toContain('/');
            }
        });
    });

    describe('SKILL_5_NF_DIV_FRAC', () => {
        it('generates valid problems', async () => {
            for (let i = 0; i < 5; i++) {
                const problem = await generate(SKILL_5_NF_DIV_FRAC.id);
                expect(problem.meta.skill_id).toBe(SKILL_5_NF_DIV_FRAC.id);
                // Can be integer or fraction result
                expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
            }
        });
    });
});
