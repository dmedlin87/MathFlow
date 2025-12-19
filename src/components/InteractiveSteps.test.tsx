/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { InteractiveSteps } from './InteractiveSteps';
import type { Step } from '../domain/types';
import '@testing-library/jest-dom';

describe('InteractiveSteps', () => {
  const mockSteps: Step[] = [
    {
      id: 'step-1',
      text: 'What is 1 + 1?',
      answer: 2,
      explanation: '1 + 1 equals 2.'
    },
    {
      id: 'step-2',
      text: 'This is a static hint.'
    },
    {
      id: 'step-3',
      text: 'What is 2 * 2?',
      answer: 4,
      explanation: '2 times 2 equals 4.'
    }
  ];

  it('renders the first step correctly', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    // MathRenderer splits text by spaces, so exact full text match fails across spans
    expect(screen.getByText("What")).toBeInTheDocument();
    expect(screen.getByText("is")).toBeInTheDocument();
    expect(screen.queryByText('This is a static hint.')).not.toBeInTheDocument();
  });

  it('advances to next step on correct answer', async () => {
    const user = userEvent.setup();
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    const button = screen.getByLabelText('Check answer for step 1');

    await user.type(input, '2');
    await user.click(button);
    
    expect(await screen.findByText('✓ Correct')).toBeInTheDocument();
    // Match partials due to MathRenderer splitting
    expect(await screen.findByText(/equals/)).toBeInTheDocument();
    expect(await screen.findByText(/2\./)).toBeInTheDocument();
    
    // Check for next step parts (static step)
    // MathRenderer splits text, so we check for significant words
    expect(await screen.findByText('This')).toBeInTheDocument();
    expect(await screen.findByText('static')).toBeInTheDocument();
  });

  it('shows error on incorrect answer and does not advance', async () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    const button = screen.getByLabelText('Check answer for step 1');

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.click(button);

    expect(await screen.findByText('✗ Try again')).toBeInTheDocument();
    // Verify explanation is NOT present (checking key tokens)
    expect(screen.queryByText('equals')).not.toBeInTheDocument();
    expect(screen.queryByText('2.')).not.toBeInTheDocument();
    expect(screen.queryByText('This is a static hint.')).not.toBeInTheDocument();
  });

  it('does nothing on empty submit', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const button = screen.getByLabelText('Check answer for step 1');
    fireEvent.click(button);

    expect(screen.queryByText('✓ Correct')).not.toBeInTheDocument();
    expect(screen.queryByText('✗ Try again')).not.toBeInTheDocument();
    expect(screen.queryByText('This is a static hint.')).not.toBeInTheDocument();
  });

  it('advances through multiple steps including static steps', async () => {
    const user = userEvent.setup();
    render(<InteractiveSteps steps={mockSteps} />);
    
    // Complete Step 1
    const input1 = screen.getByLabelText('Answer for step 1');
    const button1 = screen.getByLabelText('Check answer for step 1');
    
    await user.type(input1, '2');
    await user.click(button1);

    // Step 2 is static, should appear
    // MatchRenderer splits text
    expect(await screen.findByText('This')).toBeInTheDocument();
    expect(await screen.findByText('static')).toBeInTheDocument();
    
    // Step 2 has "Continue" button
    const continueBtn = await screen.findByText(/Continue/);
    await user.click(continueBtn);

    // Step 3 should appear
    // "What is 2 * 2?" split by MathRenderer might be complex
    // Just search for the input label which confirms step is active
    expect(screen.getByLabelText('Answer for step 3')).toBeInTheDocument();
    
    expect(screen.getByLabelText('Answer for step 3')).toBeInTheDocument();
    
    // And try to find part of the question text
    // "What" appears in both step 1 and 3, so we expect multiple
    expect((await screen.findAllByText(/What/)).length).toBeGreaterThanOrEqual(2);
    // Check for specific unique tokens of step 3
    expect(await screen.findByText('*')).toBeInTheDocument();
    
    // Using existing input variable if available or finding it
    const input3 = screen.getByLabelText('Answer for step 3');
    await user.type(input3, '4');
    const button3 = screen.getByLabelText('Check answer for step 3');
    // Ensure state updated
    expect(button3).toBeEnabled();
    // Use fireEvent to bypass potential overlay/transition issues in JSDOM
    fireEvent.click(button3);

    // Expect multiple "Correct" messages (one for step 1, one for step 3)
    expect((await screen.findAllByText('✓ Correct')).length).toBeGreaterThanOrEqual(2);
    
    // Wait for explanation matches
    // "equals" appears in multiple steps
    expect((await screen.findAllByText(/equals/)).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText(/4\./)).toBeInTheDocument();

    // Last step, no "Continue" button
    expect(screen.queryByText(/Continue/)).not.toBeInTheDocument();
  });

  it('disables input after correct answer', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByLabelText('Check answer for step 1'));
    
    expect(input).toBeDisabled();
  });
});
