/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UniversalInput } from './UniversalInput';
import type { MathProblemItem } from '../../domain/types';

// --- Test Fixtures ---

const createMockItem = (
  inputType: MathProblemItem['answer_spec']['input_type'],
  options?: { placeholder?: string; choices?: string[] }
): MathProblemItem => ({
  meta: {
    id: 'test-item',
    version: 1,
    skill_id: 'test_skill',
    difficulty: 1,
    created_at: '2024-01-01',
    status: 'VERIFIED',
    provenance: {
      generator_model: 'test',
      critic_model: 'test',
      judge_model: 'test',
      verifier: { type: 'none', passed: true },
      attempt: 1,
    },
    verification_report: {
      rubric_scores: { solvability: 5, ambiguity: 5, procedural_correctness: 5, pedagogical_alignment: 5 },
      underspecified: false,
      issues: [],
    },
  },
  problem_content: { stem: 'Test problem', format: 'text' },
  answer_spec: {
    answer_mode: 'final_only',
    input_type: inputType,
    ui: {
      placeholder: options?.placeholder ?? 'Enter answer',
      choices: options?.choices,
    },
  },
  solution_logic: { final_answer_canonical: '42', final_answer_type: 'numeric', steps: [] },
  misconceptions: [],
});

// --- Text Input Tests ---

describe('UniversalInput - Text Input', () => {
  it('renders text input for default input types', () => {
    const mockItem = createMockItem('text', { placeholder: 'Type here' });
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={onSubmit} />
    );

    const input = screen.getByPlaceholderText('Type here');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('calls onChange when user types', () => {
    const mockItem = createMockItem('integer');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={onSubmit} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123' } });

    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('calls onSubmit when Enter key is pressed', () => {
    const mockItem = createMockItem('text');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="test" onChange={onChange} onSubmit={onSubmit} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onSubmit when other keys are pressed', () => {
    const mockItem = createMockItem('text');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="test" onChange={onChange} onSubmit={onSubmit} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'a' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('respects disabled prop', () => {
    const mockItem = createMockItem('text');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={onSubmit} disabled />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('uses default placeholder when none provided', () => {
    const mockItem = createMockItem('text');
    // Remove the placeholder from ui
    mockItem.answer_spec.ui = {};

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    const input = screen.getByPlaceholderText('Enter your answer');
    expect(input).toBeInTheDocument();
  });
});

// --- Fraction Input Tests ---

describe('UniversalInput - Fraction Input', () => {
  it('renders fraction input with numerator and denominator fields', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={onSubmit} />
    );

    expect(screen.getByLabelText('Numerator')).toBeInTheDocument();
    expect(screen.getByLabelText('Denominator')).toBeInTheDocument();
  });

  it('parses existing value with "/" correctly', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="3/4" onChange={onChange} onSubmit={onSubmit} />
    );

    const numInput = screen.getByLabelText('Numerator');
    const denInput = screen.getByLabelText('Denominator');

    expect(numInput).toHaveValue('3');
    expect(denInput).toHaveValue('4');
  });

  it('parses value without "/" as numerator only', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="5" onChange={onChange} onSubmit={onSubmit} />
    );

    const numInput = screen.getByLabelText('Numerator');
    const denInput = screen.getByLabelText('Denominator');

    expect(numInput).toHaveValue('5');
    expect(denInput).toHaveValue('');
  });

  it('updates with fraction format when denominator is present', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="3" onChange={onChange} onSubmit={onSubmit} />
    );

    const denInput = screen.getByLabelText('Denominator');
    fireEvent.change(denInput, { target: { value: '4' } });

    expect(onChange).toHaveBeenCalledWith('3/4');
  });

  it('updates with numerator only when denominator is empty', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="3/4" onChange={onChange} onSubmit={onSubmit} />
    );

    const denInput = screen.getByLabelText('Denominator');
    fireEvent.change(denInput, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('3');
  });

  it('filters non-numeric characters except minus sign', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={onSubmit} />
    );

    const numInput = screen.getByLabelText('Numerator');
    fireEvent.change(numInput, { target: { value: '-5abc' } });

    // Should strip 'abc', keeping '-5'
    expect(onChange).toHaveBeenCalledWith('-5');
  });

  it('calls onSubmit on Enter key in denominator field', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="1/2" onChange={onChange} onSubmit={onSubmit} />
    );

    const denInput = screen.getByLabelText('Denominator');
    fireEvent.keyDown(denInput, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onSubmit on non-Enter key in denominator field', () => {
    const mockItem = createMockItem('fraction');
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <UniversalInput item={mockItem} value="1/2" onChange={onChange} onSubmit={onSubmit} />
    );

    const denInput = screen.getByLabelText('Denominator');
    fireEvent.keyDown(denInput, { key: 'Escape' });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('respects disabled prop on fraction inputs', () => {
    const mockItem = createMockItem('fraction');

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled />
    );

    expect(screen.getByLabelText('Numerator')).toBeDisabled();
    expect(screen.getByLabelText('Denominator')).toBeDisabled();
  });
});

// --- Multiple Choice Input Tests ---

describe('UniversalInput - Multiple Choice Input', () => {
  it('shows error when choices array is empty', () => {
    const mockItem = createMockItem('multiple_choice', { choices: [] });

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.getByText(/Error: No choices provided/)).toBeInTheDocument();
  });

  it('renders all choices as buttons', () => {
    const mockItem = createMockItem('multiple_choice', { choices: ['A', 'B', 'C'] });

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /A$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /B$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /C$/ })).toBeInTheDocument();
  });

  it('calls onChange with selected choice when clicked', () => {
    const mockItem = createMockItem('multiple_choice', { choices: ['Option 1', 'Option 2'] });
    const onChange = vi.fn();

    render(
      <UniversalInput item={mockItem} value="" onChange={onChange} onSubmit={vi.fn()} />
    );

    const option2 = screen.getByRole('button', { name: /Option 2$/ });
    fireEvent.click(option2);

    expect(onChange).toHaveBeenCalledWith('Option 2');
  });

  it('applies selected styling to current value', () => {
    const mockItem = createMockItem('multiple_choice', { choices: ['Yes', 'No'] });

    render(
      <UniversalInput item={mockItem} value="Yes" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    const yesBtn = screen.getByRole('button', { name: /Yes$/ });
    const noBtn = screen.getByRole('button', { name: /No$/ });

    // Selected button has blue styling
    expect(yesBtn.className).toContain('border-blue-600');
    expect(yesBtn.className).toContain('bg-blue-50');

    // Unselected button has gray styling
    expect(noBtn.className).toContain('border-gray-200');
    expect(noBtn.className).toContain('bg-white');
  });

  it('sets aria-pressed correctly for accessibility', () => {
    const mockItem = createMockItem('multiple_choice', { choices: ['One', 'Two'] });

    render(
      <UniversalInput item={mockItem} value="One" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    const btnOne = screen.getByRole('button', { name: /One$/ });
    const btnTwo = screen.getByRole('button', { name: /Two$/ });

    expect(btnOne).toHaveAttribute('aria-pressed', 'true');
    expect(btnTwo).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects disabled prop on choice buttons', () => {
    const mockItem = createMockItem('multiple_choice', { choices: ['A', 'B'] });

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled />
    );

    expect(screen.getByRole('button', { name: /A$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /B$/ })).toBeDisabled();
  });

  it('handles undefined choices gracefully (falls back to empty)', () => {
    const mockItem = createMockItem('multiple_choice');
    // Explicitly set choices to undefined
    mockItem.answer_spec.ui = { choices: undefined };

    render(
      <UniversalInput item={mockItem} value="" onChange={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.getByText(/Error: No choices provided/)).toBeInTheDocument();
  });
});
