/**
 * @vitest-environment jsdom
 */
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
    answer_spec: { ui: { placeholder: 'Enter 2' }, validation: { canonical: '2' }, input_type: 'text' }
  }),
  submitAttempt: vi.fn().mockImplementation(async (state) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return state;
  }),
  diagnose: vi.fn().mockResolvedValue({
    error_category: 'calculation_error',
    diagnosis_explanation: 'Check your addition.'
  })
};

const mockLearnerState: LearnerState = {
  userId: 'user1',
  skillState: { 'test_skill': { masteryProb: 0.5, stability: 0.5, lastPracticed: '2023-01-01', misconceptions: [] } },
};

describe('MathTutor UX', () => {
  it('loads item on mount', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    // Should call getRecommendation
    expect(mockLearnerService.getRecommendation).toHaveBeenCalled();
    // STEM should eventually appear
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));
  });

  it('handles correct answer submission', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));

    const input = screen.getByPlaceholderText('Enter 2'); // From mock answer_spec
    fireEvent.change(input, { target: { value: '2' } });
    
    const submitBtn = screen.getByText('Check Answer');
    fireEvent.click(submitBtn);

    // Wait for checking
    await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
    
    // Check Next Problem button
    expect(screen.getByText('Next Problem →')).toBeInTheDocument();
  });

  it('handles incorrect answer and retry', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));

    const input = screen.getByPlaceholderText('Enter 2');
    fireEvent.change(input, { target: { value: '999' } });
    
    const submitBtn = screen.getByText('Check Answer');
    fireEvent.click(submitBtn);

    // Diagnose call should happen
    expect(mockLearnerService.diagnose).toHaveBeenCalled();
    
    // Should show diagnosis
    await waitFor(() => expect(screen.getByText(/Check your addition/)).toBeInTheDocument());

    // Should show "Try Again" on button (after loading finishes)
    await waitFor(() => expect(screen.getByText('Try Again')).toBeInTheDocument());
  });

  it('toggles dev mode and auto-solves', async () => {
    render(
        <MathTutor
          learnerState={mockLearnerState}
          setLearnerState={() => {}}
          learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
        />
      );

      await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));

      const devBtn = screen.getByText('DEV MODE');
      fireEvent.click(devBtn);

      // Dev controls should appear
      const autoSolveBtn = screen.getByText(/Auto Solve/i); // Assuming DeveloperControls has this
      expect(autoSolveBtn).toBeInTheDocument();

      fireEvent.click(autoSolveBtn);

      // Should fill answer and submit
      await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });
});
