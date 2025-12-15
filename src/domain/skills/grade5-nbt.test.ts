import { describe, it, expect } from 'vitest';
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
import { checkAnswer } from '../math-utils';

describe('Grade 5 NBT Domain', () => {

  describe('Module 1: Place Value & Decimals', () => {
    describe('SKILL_5_NBT_POWERS_10', () => {
      it('generates valid problems', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_POWERS_10.generator.generate();
          expect(problem.type).toBe('fill_in_blank');
          expect(problem.items.length).toBe(1);
          expect(problem.stem).toBeTruthy();
          const item = problem.items[0];
          expect(checkAnswer(item.solution_logic.final_answer_canonical, item)).toBe(true);
        }
      });
    });

    describe('SKILL_5_NBT_DECIMAL_FORMS', () => {
      it('generates valid problems', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_DECIMAL_FORMS.generator.generate();
          expect(problem.items.length).toBe(1);
          const item = problem.items[0];
          expect(checkAnswer(item.solution_logic.final_answer_canonical, item)).toBe(true);
        }
      });
    });

    describe('SKILL_5_NBT_COMPARE_DECIMALS', () => {
      it('generates valid problems', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_COMPARE_DECIMALS.generator.generate();
          expect(problem.type).toBe('multiple_choice');
          const item = problem.items[0];
          expect(checkAnswer(item.solution_logic.final_answer_canonical, item)).toBe(true);
        }
      });
    });

    describe('SKILL_5_NBT_ROUND_DECIMALS', () => {
      it('generates valid problems', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_ROUND_DECIMALS.generator.generate();
          const item = problem.items[0];
          expect(checkAnswer(item.solution_logic.final_answer_canonical, item)).toBe(true);
        }
      });
    });
  });

  describe('Module 2: Multiplication (Whole & Decimal)', () => {
    describe('SKILL_5_NBT_MULT_WHOLE', () => {
      it('generates valid multi-digit multiplication', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_MULT_WHOLE.generator.generate();
          const item = problem.items[0];
          // Check if stem contains "Multiply:"
          expect(problem.stem).toContain('Multiply');
          // Parse numbers from stem if needed, or just trust canonical
          const canonical = item.solution_logic.final_answer_canonical;
          expect(checkAnswer(canonical, item)).toBe(true);
        }
      });
    });

    describe('SKILL_5_NBT_MULT_DECIMALS', () => {
      it('generates valid decimal multiplication', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_MULT_DECIMALS.generator.generate();
          const item = problem.items[0];
          const canonical = item.solution_logic.final_answer_canonical;
          expect(checkAnswer(canonical, item)).toBe(true);
          // Verify answer is decimal format if needed, but checkAnswer handles it
        }
      });
    });

    describe('SKILL_5_NBT_ADD_SUB_DECIMALS', () => {
        it('generates valid decimal addition/subtraction', () => {
          for (let i = 0; i < 20; i++) {
            const problem = SKILL_5_NBT_ADD_SUB_DECIMALS.generator.generate();
            const item = problem.items[0];
            const canonical = item.solution_logic.final_answer_canonical;
            expect(checkAnswer(canonical, item)).toBe(true);
          }
        });
      });
  });

  describe('Module 3: Division (Whole & Decimal)', () => {
    describe('SKILL_5_NBT_DIV_WHOLE', () => {
      it('generates valid multi-digit division', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_DIV_WHOLE.generator.generate();
          const items = problem.items;

          if (items.length === 1) {
             const item = items[0];
             expect(checkAnswer(item.solution_logic.final_answer_canonical, item)).toBe(true);
          } else {
             // Remainder case
             expect(items.length).toBe(2);
             const q = items[0];
             const r = items[1];
             expect(checkAnswer(q.solution_logic.final_answer_canonical, q)).toBe(true);
             expect(checkAnswer(r.solution_logic.final_answer_canonical, r)).toBe(true);
          }
        }
      });
    });

    describe('SKILL_5_NBT_DIV_DECIMALS', () => {
      it('generates valid decimal division', () => {
        for (let i = 0; i < 20; i++) {
          const problem = SKILL_5_NBT_DIV_DECIMALS.generator.generate();
          const item = problem.items[0];
          const canonical = item.solution_logic.final_answer_canonical;
          expect(checkAnswer(canonical, item)).toBe(true);
        }
      });
    });
  });

});
