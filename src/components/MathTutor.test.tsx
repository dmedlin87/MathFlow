import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MathTutor } from './MathTutor';
import { vi, describe, it, expect } from 'vitest';
import type { LearnerState } from '../domain/types';

// Mock dependencies
const mockLearnerService = {
  getRecommendation: vi.fn().mockResolvedValue({
    meta: { id: 'test1', skill_id: 'test_skill', difficulty: 1 },
    problem_content: { stem: '1 + 1 = ?', variables: {} },
    solution_logic: { final_answer_canonical: '2', steps: [] },
    answer_spec: { ui: { placeholder: 'Enter 2' }, validation: { canonical: '2' } }
  }),
  submitAttempt: vi.fn().mockImplementation(async (state) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return state;
  }),
  diagnose: vi.fn()
};

const mockLearnerState: LearnerState = {
  userId: 'user1',
  skillState: { 'test_skill': { masteryProb: 0.5, stability: 0.5, lastPracticed: '2023-01-01', misconceptions: [] } },
};

describe('MathTutor UX', () => {
  it('disables submit button and shows loading state during submission', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    // Wait for item to load
    // The MathRenderer breaks up the text, so we check for parts of it
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));

    const input = screen.getByLabelText('Enter your answer');
    const submitBtn = screen.getByText('Check Answer');

    // Enter WRONG answer to ensure button stays visible
    fireEvent.change(input, { target: { value: '999' } });

    // Submit
    fireEvent.click(submitBtn);

    // Check loading state immediately after click
    // The button should show "Checking..." while the async diagnosis/submission happens
    await waitFor(() => {
        expect(screen.getByText('Checking...')).toBeInTheDocument();
        expect(submitBtn).toBeDisabled();
    });
  });
});
