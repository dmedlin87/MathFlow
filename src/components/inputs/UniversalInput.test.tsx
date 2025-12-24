// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UniversalInput } from './UniversalInput';
import { MathProblemItem } from '../../domain/types';

// Mock MathProblemItem
const mockItem = (type: 'fraction' | 'multiple_choice' | 'text', placeholder?: string, choices?: string[]): MathProblemItem => ({
  meta: { id: 'test', skill_id: 'test_skill', difficulty: 0.5 },
  problem_content: { stem: 'Test Problem', variables: {} },
  solution_logic: { final_answer_canonical: 'test', steps: [] },
  answer_spec: { input_type: type, ui: { placeholder, choices } }
});

describe('UniversalInput', () => {
  it('focuses denominator input when Enter is pressed in numerator input', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const item = mockItem('fraction');

    render(
      <UniversalInput
        item={item}
        value=""
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const numInput = screen.getByPlaceholderText('Num');
    const denInput = screen.getByPlaceholderText('Den');

    // Type in numerator
    fireEvent.change(numInput, { target: { value: '1' } });

    // Press Enter in numerator
    fireEvent.keyDown(numInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Expect denominator to have focus
    expect(denInput).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled(); // Should not submit yet
  });

  it('submits when Enter is pressed in denominator input', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const item = mockItem('fraction');

    render(
      <UniversalInput
        item={item}
        value="1/2"
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const denInput = screen.getByPlaceholderText('Den');
    
    // Press Enter in denominator
    fireEvent.keyDown(denInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(onSubmit).toHaveBeenCalled();
  });
});
