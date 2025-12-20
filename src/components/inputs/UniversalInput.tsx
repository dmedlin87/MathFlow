import React, { memo } from 'react';
import type { MathProblemItem } from '../../domain/types';

interface UniversalInputProps {
  item: MathProblemItem;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const UniversalInput = memo(({ item, value, onChange, onSubmit, disabled }: UniversalInputProps) => {
  const type = item.answer_spec.input_type;

  if (type === 'fraction') {
    return <FractionInput value={value} onChange={onChange} disabled={disabled} onSubmit={onSubmit} />;
  }

  if (type === 'multiple_choice') {
    return (
      <MultipleChoiceInput
        item={item}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  // Default Text/Numeric Input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-lg p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
      placeholder={item.answer_spec.ui?.placeholder || "Enter your answer"}
      aria-label={item.answer_spec.ui?.placeholder || "Enter your answer"}
      disabled={disabled}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit();
      }}
    />
  );
});

UniversalInput.displayName = 'UniversalInput';

// --- Sub-components ---

const FractionInput = memo(({
  value,
  onChange,
  onSubmit,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) => {
  // Parse "num/den" or empty
  const [num, den] = value.includes('/') ? value.split('/') : [value, ''];

  const update = (n: string, d: string) => {
    // Only allow numeric input
    const cleanN = n.replace(/[^\d-]/g, '');
    const cleanD = d.replace(/[^\d-]/g, '');

    // Construct valid fractional string if both present, else partial
    if (cleanD) {
      onChange(`${cleanN}/${cleanD}`);
    } else {
      onChange(cleanN); // Just numerator state if denominator empty
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[120px] mx-auto">
        <input
          type="text"
          value={num}
          onChange={(e) => update(e.target.value, den)}
          className="w-full text-center text-xl p-2 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
          placeholder="Num"
          aria-label="Numerator"
          disabled={disabled}
          autoFocus
        />
        <div className="w-full h-1 bg-gray-800 rounded-full" />
        <input
          type="text"
          value={den}
          onChange={(e) => update(num, e.target.value)}
          className="w-full text-center text-xl p-2 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
          placeholder="Den"
          aria-label="Denominator"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
        />
    </div>
  );
});

FractionInput.displayName = 'FractionInput';

const MultipleChoiceInput = memo(({
  item,
  value,
  onChange,
  disabled
}: {
  item: MathProblemItem;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => {
  const choices = item.answer_spec.ui?.choices || [];

  if (choices.length === 0) {
      return <div className="text-red-500">Error: No choices provided for multiple choice question.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
        {choices.map((choice, idx) => (
            <button
                key={idx}
                type="button"
                onClick={() => onChange(choice)}
                disabled={disabled}
                className={`p-4 text-lg font-medium rounded-xl border-2 transition-all text-left ${
                    value === choice
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
                <span className="mr-3 inline-block w-6 h-6 rounded-full border border-current text-center text-xs leading-5 opacity-60">
                    {String.fromCharCode(65 + idx)}
                </span>
                {choice}
            </button>
        ))}
    </div>
  );
});

MultipleChoiceInput.displayName = 'MultipleChoiceInput';
