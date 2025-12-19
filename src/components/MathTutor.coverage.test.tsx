/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MathTutor } from './MathTutor';
import type { LearnerState } from '../domain/types';

// Mock LearnerService
const mockLearnerService = {
  getRecommendation: vi.fn(),
  submitAttempt: vi.fn(),
  diagnose: vi.fn()
};

const mockLearnerState: LearnerState = {
  userId: 'user1',
  skillState: { 'test_skill': { masteryProb: 0.5, stability: 0.5, lastPracticed: '2023-01-01', misconceptions: [] } },
};

describe('MathTutor Error & Edge Cases', () => {

    it('handles handleSubmit failure gracefully', async () => {
        // Setup: Mock submitAttempt to reject
        mockLearnerService.getRecommendation.mockResolvedValueOnce({
            meta: { id: 'test1', skill_id: 'test_skill', difficulty: 1 },
            problem_content: { stem: '1+1', variables: {} },
            solution_logic: { final_answer_canonical: '2', steps: [] },
            answer_spec: { ui: { placeholder: 'Ans' }, validation: { canonical: '2' }, input_type: 'text' }
        });
        mockLearnerService.submitAttempt.mockRejectedValueOnce(new Error('Network error'));

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <MathTutor
                learnerState={mockLearnerState}
                setLearnerState={() => {}}
                learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
            />
        );

        await waitFor(() => expect(screen.getByPlaceholderText('Ans')).toBeInTheDocument());

        // Submit correct answer
        fireEvent.change(screen.getByPlaceholderText('Ans'), { target: { value: '2' } });
        fireEvent.click(screen.getByText('Check Answer'));

        // Should not crash, but maybe show error or just log?
        // Current implementation just logs to console.error
        await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to submit attempt', expect.any(Error)));

        consoleErrorSpy.mockRestore();
    });

    it('submits on Enter key in text input', async () => {
        mockLearnerService.getRecommendation.mockResolvedValueOnce({
            meta: { id: 'test2', skill_id: 'test_skill', difficulty: 1 },
            problem_content: { stem: '1+1', variables: {} },
            solution_logic: { final_answer_canonical: '2', steps: [] },
            answer_spec: { ui: { placeholder: 'Ans' }, validation: { canonical: '2' }, input_type: 'text' }
        });
        // Fix: return valid state from submit
        mockLearnerService.submitAttempt.mockResolvedValue(mockLearnerState);

        render(
            <MathTutor
                learnerState={mockLearnerState}
                setLearnerState={() => {}}
                learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
            />
        );

        await waitFor(() => expect(screen.getByPlaceholderText('Ans')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Ans'), { target: { value: '2' } });
        fireEvent.keyDown(screen.getByPlaceholderText('Ans'), { key: 'Enter', code: 'Enter', charCode: 13 });

        // Should see Correct!
        await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
    });

    it('submits on Enter key in fraction denominator', async () => {
         mockLearnerService.getRecommendation.mockResolvedValueOnce({
            meta: { id: 'test3', skill_id: 'test_skill', difficulty: 1 },
            problem_content: { stem: '1/2', variables: {} },
            solution_logic: { final_answer_canonical: '1/2', steps: [] },
            answer_spec: { ui: {}, validation: { canonical: '1/2' }, input_type: 'fraction' }
        });
        mockLearnerService.submitAttempt.mockResolvedValue(mockLearnerState);

        render(
            <MathTutor
                learnerState={mockLearnerState}
                setLearnerState={() => {}}
                learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
            />
        );

        await waitFor(() => expect(screen.getByPlaceholderText('Num')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Num'), { target: { value: '1' } });
        fireEvent.change(screen.getByPlaceholderText('Den'), { target: { value: '2' } });

        fireEvent.keyDown(screen.getByPlaceholderText('Den'), { key: 'Enter', code: 'Enter', charCode: 13 });

        await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
    });
});
