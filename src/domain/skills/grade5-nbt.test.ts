import { describe, it, expect } from 'vitest';
import { engine } from '../generator/engine';
import {
  SKILL_5_NBT_POWERS_10,
  SKILL_5_NBT_DECIMAL_FORMS,
  SKILL_5_NBT_COMPARE_DECIMALS,
  SKILL_5_NBT_ROUND_DECIMALS,
  SKILL_5_NBT_ADD_SUB_DECIMALS,
  SKILL_5_NBT_MULT_WHOLE,
  SKILL_5_NBT_MULT_DECIMALS,
  SKILL_5_NBT_DIV_WHOLE,
  SKILL_5_NBT_DIV_DECIMALS
} from './grade5-nbt';

describe('Grade 5 NBT Domain', () => {

  const generate = async (skillId: string) => {
    return await engine.generate(skillId, 0.5);
  };

  describe('Module 1: Place Value & Decimals', () => {
    describe('SKILL_5_NBT_POWERS_10', () => {
      it('generates valid problems', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_POWERS_10.id);
          expect(problem.meta.skill_id).toBe(SKILL_5_NBT_POWERS_10.id);
          expect(problem.problem_content.stem).toBeTruthy();
          expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
        }
      });
    });

    describe('SKILL_5_NBT_DECIMAL_FORMS', () => {
      it('generates valid problems', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_DECIMAL_FORMS.id);
          expect(problem.meta.skill_id).toBe(SKILL_5_NBT_DECIMAL_FORMS.id);
          expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
        }
      });
    });

    describe('SKILL_5_NBT_COMPARE_DECIMALS', () => {
      it('generates valid problems', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_COMPARE_DECIMALS.id);
          expect(problem.answer_spec.input_type).toBe('multiple_choice');
          expect(problem.solution_logic.final_answer_canonical).toMatch(/<|>|=/);
        }
      });
    });

    describe('SKILL_5_NBT_ROUND_DECIMALS', () => {
      it('generates valid problems', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_ROUND_DECIMALS.id);
          expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
        }
      });
    });
  });

  describe('Module 2: Multiplication (Whole & Decimal)', () => {
    describe('SKILL_5_NBT_MULT_WHOLE', () => {
      it('generates valid multi-digit multiplication', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_MULT_WHOLE.id);
          expect(problem.problem_content.stem).toContain('Multiply');
          expect(parseInt(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
        }
      });
    });

    describe('SKILL_5_NBT_MULT_DECIMALS', () => {
      it('generates valid decimal multiplication', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_MULT_DECIMALS.id);
          expect(parseFloat(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
        }
      });
    });

    describe('SKILL_5_NBT_ADD_SUB_DECIMALS', () => {
        it('generates valid decimal addition/subtraction', async () => {
          for (let i = 0; i < 5; i++) {
            const problem = await generate(SKILL_5_NBT_ADD_SUB_DECIMALS.id);
            expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
          }
        });
      });
  });

  describe('Module 3: Division (Whole & Decimal)', () => {
    describe('SKILL_5_NBT_DIV_WHOLE', () => {
      it('generates valid multi-digit division', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_DIV_WHOLE.id);
          expect(problem.solution_logic.final_answer_canonical).toBeTruthy();
        }
      });
    });

    describe('SKILL_5_NBT_DIV_DECIMALS', () => {
      it('generates valid decimal division', async () => {
        for (let i = 0; i < 5; i++) {
          const problem = await generate(SKILL_5_NBT_DIV_DECIMALS.id);
          expect(parseFloat(problem.solution_logic.final_answer_canonical)).toBeGreaterThan(0);
        }
      });
    });
  });

});
