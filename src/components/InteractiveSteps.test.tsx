/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
    expect(screen.getByText("What is 1 + 1?")).toBeInTheDocument();
    expect(screen.queryByText('This is a static hint.')).not.toBeInTheDocument();
  });

  it('advances to next step on correct answer', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    const button = screen.getByLabelText('Check answer for step 1');

    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(button);

    expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    expect(screen.getByText('1 + 1 equals 2.')).toBeInTheDocument();
    expect(screen.getByText('This is a static hint.')).toBeInTheDocument();
  });

  it('shows error on incorrect answer and does not advance', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    const button = screen.getByLabelText('Check answer for step 1');

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.click(button);

    expect(screen.getByText('✗ Try again')).toBeInTheDocument();
    expect(screen.queryByText('1 + 1 equals 2.')).not.toBeInTheDocument();
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

  it('advances through multiple steps including static steps', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    
    // Complete Step 1
    fireEvent.change(screen.getByLabelText('Answer for step 1'), { target: { value: '2' } });
    fireEvent.click(screen.getByLabelText('Check answer for step 1'));
    
    // Step 2 (Static) should be visible
    expect(screen.getByText('This is a static hint.')).toBeInTheDocument();
    const continueBtn = screen.getByText('Continue ↓');
    fireEvent.click(continueBtn);

    // Step 3 (Interactive) should be visible
    expect(screen.getByText('What is 2 * 2?')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer for step 3')).toBeInTheDocument();
    
    // Complete Step 3
    fireEvent.change(screen.getByLabelText('Answer for step 3'), { target: { value: '4' } });
    fireEvent.click(screen.getByLabelText('Check answer for step 3'));
    
    expect(screen.getByText('2 times 2 equals 4.')).toBeInTheDocument();
    // Last step, no "Continue" button
    expect(screen.queryByText('Continue ↓')).not.toBeInTheDocument();
  });

  it('disables input after correct answer', () => {
    render(<InteractiveSteps steps={mockSteps} />);
    const input = screen.getByLabelText('Answer for step 1');
    
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByLabelText('Check answer for step 1'));
    
    expect(input).toBeDisabled();
  });
});
