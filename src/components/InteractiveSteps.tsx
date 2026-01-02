import React, { useState } from 'react';
import type { Step } from '../domain/types';
import { MathRenderer } from './MathRenderer';

interface InteractiveStepsProps {
  steps: Step[];
}

// Optimized with React.memo to prevent unnecessary re-renders when parent state (like user answer) changes
export const InteractiveSteps = React.memo(({ steps }: InteractiveStepsProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Record<string, string>>({});
  const [stepFeedback, setStepFeedback] = useState<Record<string, 'correct' | 'incorrect' | null>>({});

  const updateAnswer = (stepId: string, value: string) => {
    setStepAnswers(prev => ({ ...prev, [stepId]: value }));
  };

  const handleStepSubmit = (index: number, step: Step) => {
    const val = stepAnswers[step.id]?.trim();
    if (!val) return;

    // Simple equality check for now (can be enhanced with tolerance or domain logic)
    const isCorrect = isCorrectAnswer(val, step);
    
    setStepFeedback(prev => ({ ...prev, [step.id]: isCorrect ? 'correct' : 'incorrect' }));

    if (isCorrect) {
        // Auto-advance after short delay or just let them see it
        // If it's the last step, maybe show a "All steps done!" msg
        if (index === currentStepIndex && index < steps.length - 1) {
             setCurrentStepIndex(index + 1);
        }
    }
  };

  return (
    <div className="mt-8 text-left bg-gray-50 p-6 rounded-lg border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-4">Let's break it down:</h3>
      <div className="space-y-6">
        {steps.map((step, index) => {
          if (index > currentStepIndex) return null; // Don't show future steps yet

          const feedback = stepFeedback[step.id];
          const isCompleted = feedback === 'correct';
          const stepNumber = index + 1;
          const isInteractive = step.answer !== undefined;

          return (
            <div key={step.id} className={`transition-opacity duration-500 ${index === currentStepIndex ? 'opacity-100' : 'opacity-70'}`}>
              <div className="text-gray-800 mb-2">
                 <MathRenderer text={step.text} />
              </div>

              {isInteractive ? (
                // Interactive Step
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            aria-label={`Answer for step ${stepNumber}`}
                            value={stepAnswers[step.id] || ''}
                            onChange={(e) => updateAnswer(step.id, e.target.value)}
                            className={getAnswerClassName(feedback)}
                            placeholder="?"
                            disabled={isCompleted}
                        />
                         {!isCompleted && (
                            <button
                                onClick={() => handleStepSubmit(index, step)}
                                aria-label={`Check answer for step ${stepNumber}`}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                            >
                                Check
                            </button>
                         )}
                         {feedback === 'correct' && <span className="text-green-600 flex items-center gap-1">✓ Correct</span>}
                         {feedback === 'incorrect' && <span className="text-red-500 flex items-center gap-1">✗ Try again</span>}
                    </div>
                    
                    {isCompleted && step.explanation && (
                         <div className="text-sm text-gray-600 mt-1 italic pl-2 border-l-2 border-green-200">
                             <MathRenderer text={step.explanation} />
                         </div>
                    )}
                </div>
              ) : (
                // Static Hint / Info Step
                <div className="text-gray-600">
                    {index === currentStepIndex && index < steps.length - 1 && (
                        <button 
                            onClick={() => setCurrentStepIndex(prev => prev + 1)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Continue ↓
                        </button>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

function isCorrectAnswer(value: string, step: Step) {
  return value == String(step.answer);
}

function getAnswerClassName(feedback: 'correct' | 'incorrect' | null | undefined) {
  const base = 'p-2 border rounded w-32 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors';
  if (feedback === 'correct') return `${base} border-green-500 bg-green-50`;
  if (feedback === 'incorrect') return `${base} border-red-500 bg-red-50`;
  return `${base} border-gray-300`;
}
