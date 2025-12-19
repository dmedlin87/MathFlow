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

describe('MathTutor Hint Ladder', () => {
  it('shows hints from hint_ladder based on attempts', async () => {
    const hintLadderService = {
      getRecommendation: vi.fn().mockResolvedValue({
        meta: { id: 'test1', skill_id: 'test_skill', difficulty: 1 },
        problem_content: { stem: '2 + 2 = ?', variables: {} },
        solution_logic: { final_answer_canonical: '4', steps: [] },
        answer_spec: { ui: { placeholder: 'Answer' }, validation: { canonical: '4' }, input_type: 'text' }
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue({
        error_category: 'calculation_error',
        hint_ladder: ['First hint: count on fingers', 'Second hint: 2+2 is double 2'],
        diagnosis_explanation: 'Fallback explanation'
      })
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={hintLadderService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Answer');
    
    // First incorrect attempt - should show first hint
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Check Answer'));
    
    await waitFor(() => expect(screen.getByText(/First hint: count on fingers/)).toBeInTheDocument());

    // Second incorrect attempt - should show second hint
    fireEvent.change(input, { target: { value: '6' } });
    await waitFor(() => expect(screen.getByText('Check Answer')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Check Answer'));
    
    await waitFor(() => expect(screen.getByText(/Second hint: 2\+2 is double 2/)).toBeInTheDocument());
  });

  it('uses diagnosis_explanation when no hint_ladder', async () => {
    const noLadderService = {
      getRecommendation: vi.fn().mockResolvedValue({
        meta: { id: 'test1', skill_id: 'test_skill', difficulty: 1 },
        problem_content: { stem: '3 + 3 = ?', variables: {} },
        solution_logic: { final_answer_canonical: '6', steps: [] },
        answer_spec: { ui: { placeholder: 'Answer' }, validation: { canonical: '6' }, input_type: 'text' }
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue({
        error_category: 'calculation_error',
        hint_ladder: [], // Empty ladder
        diagnosis_explanation: 'Try adding the numbers carefully.'
      })
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={noLadderService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Answer'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Check Answer'));
    
    // Should use diagnosis_explanation as fallback
    await waitFor(() => expect(screen.getByText(/Try adding the numbers carefully/)).toBeInTheDocument());
  });
});

describe('MathTutor Session Flow', () => {
  it('ends session after 5 problems and shows SessionSummary', async () => {
    let problemCount = 0;
    const sessionService = {
      getRecommendation: vi.fn().mockImplementation(async () => {
        problemCount++;
        return {
          meta: { id: `test${problemCount}`, skill_id: 'test_skill', difficulty: 1 },
          problem_content: { stem: `Problem ${problemCount}`, variables: {} },
          solution_logic: { final_answer_canonical: '1', steps: [] },
          answer_spec: { ui: { placeholder: 'Answer' }, validation: { canonical: '1' }, input_type: 'text' }
        };
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue(null)
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={sessionService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    // Solve 5 problems
// Solve 5 problems
    for (let i = 0; i < 5; i++) {
      await waitFor(() => expect(screen.getByRole('button', { name: 'Check Answer' })).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Answer'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('Check Answer'));
      await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
      
      if (i < 4) {
        fireEvent.click(screen.getByText('Next Problem →'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Check Answer' })).toBeInTheDocument());
      } else {
        // On 5th problem, clicking Next should end session
        fireEvent.click(screen.getByText('Next Problem →'));
      }
    }

    // SessionSummary should be displayed
    await waitFor(() => expect(screen.getByText(/Session Complete/)).toBeInTheDocument());
  });

  it('shows SessionSummary when End Session clicked', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Enter 2')).toBeInTheDocument());

    // Solve one problem
    fireEvent.change(screen.getByPlaceholderText('Enter 2'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Check Answer'));
    await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());

    // Click End Session
    fireEvent.click(screen.getByText('End Session'));

    // SessionSummary should appear
    await waitFor(() => expect(screen.getByText(/Session Complete/)).toBeInTheDocument());
  });

  it('restarts session when restart clicked', async () => {
    let callCount = 0;
    const restartService = {
      getRecommendation: vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          meta: { id: `test${callCount}`, skill_id: 'test_skill', difficulty: 1 },
          problem_content: { stem: `Problem ${callCount}`, variables: {} },
          solution_logic: { final_answer_canonical: '1', steps: [] },
          answer_spec: { ui: { placeholder: 'Answer' }, validation: { canonical: '1' }, input_type: 'text' }
        };
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue(null)
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={restartService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument());

    // Solve and end session
    fireEvent.change(screen.getByPlaceholderText('Answer'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Check Answer'));
    await waitFor(() => expect(screen.getByText('Correct! 🎉')).toBeInTheDocument());
    fireEvent.click(screen.getByText('End Session'));
    
    await waitFor(() => expect(screen.getByText(/Session Complete/)).toBeInTheDocument());

    // Click restart
    fireEvent.click(screen.getByText(/Start New Session|Practice More/));

    // Should load new problem
    await waitFor(() => expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument());
    expect(restartService.getRecommendation).toHaveBeenCalledTimes(2); // Initial + restart
  });
});

describe('MathTutor Input Types', () => {
  it('shows disabled submit for multiple_choice with no selection', async () => {
    const mcService = {
      getRecommendation: vi.fn().mockResolvedValue({
        meta: { id: 'mc1', skill_id: 'test_skill', difficulty: 1 },
        problem_content: { stem: 'What is 2+2?', variables: {} },
        solution_logic: { final_answer_canonical: '4', steps: [] },
        answer_spec: { 
          input_type: 'multiple_choice', 
          options: ['3', '4', '5', '6'],
          ui: {}, 
          validation: { canonical: '4' } 
        }
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue(null)
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mcService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByText(/What is 2\+2/)).toBeInTheDocument());

    // Submit button should be disabled when nothing selected
    const submitBtn = screen.getByRole('button', { name: 'Check Answer' });
    expect(submitBtn).toBeDisabled();
  });

  it('clears incorrect feedback when input changes', async () => {
    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={mockLearnerService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Enter 2')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Enter 2');
    
    // Submit incorrect answer
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.click(screen.getByText('Check Answer'));
    
    await waitFor(() => expect(screen.getByText('Try Again')).toBeInTheDocument());
    
    // Feedback is shown (incorrect)
    expect(screen.queryByText('Correct! 🎉')).not.toBeInTheDocument();
    
    // Change input - should clear feedback  
    fireEvent.change(input, { target: { value: '99' } });
    
    // "Try Again" should change back to "Check Answer" since feedback is cleared
    await waitFor(() => expect(screen.getByText('Check Answer')).toBeInTheDocument());
  });
});

describe('MathTutor InteractiveSteps', () => {
  it('shows InteractiveSteps when incorrect with solution steps', async () => {
    const stepsService = {
      getRecommendation: vi.fn().mockResolvedValue({
        meta: { id: 'steps1', skill_id: 'test_skill', difficulty: 1 },
        problem_content: { stem: '5 + 5 = ?', variables: {} },
        solution_logic: { 
          final_answer_canonical: '10', 
          steps: [
            { step_index: 1, explanation: 'Start with 5', math: '5', answer: '5' },
            { step_index: 2, explanation: 'Add 5 more', math: '5 + 5 = 10', answer: '10' }
          ] 
        },
        answer_spec: { ui: { placeholder: 'Answer' }, validation: { canonical: '10' }, input_type: 'text' }
      }),
      submitAttempt: vi.fn().mockImplementation(async (state) => state),
      diagnose: vi.fn().mockResolvedValue({ error_category: 'error', diagnosis_explanation: 'Wrong' })
    };

    render(
      <MathTutor
        learnerState={mockLearnerState}
        setLearnerState={() => {}}
        learnerService={stepsService as unknown as import('../services/LearnerService').ILearnerService}
      />
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument());

    // Submit incorrect answer
    fireEvent.change(screen.getByPlaceholderText('Answer'), { target: { value: '99' } });
    fireEvent.click(screen.getByText('Check Answer'));

    // Should show InteractiveSteps with the step explanations
    await waitFor(() => expect(screen.getByText(/Start with 5/)).toBeInTheDocument());
  });
});
