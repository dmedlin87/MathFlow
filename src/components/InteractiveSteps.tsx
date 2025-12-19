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

  const handleStepSubmit = (index: number, step: Step) => {
    const val = stepAnswers[step.id]?.trim();
    if (!val) return;

    // Simple equality check for now (can be enhanced with tolerance or domain logic)
    const isCorrect = val == String(step.answer);
    
    setStepFeedback(prev => ({ ...prev, [step.id]: isCorrect ? 'correct' : 'incorrect' }));

    if (isCorrect) {
        // Auto-advance after short delay or just let them see it
        // If it's the last step, maybe show a "All steps done!" msg
        if (index === currentStepIndex && index < steps.length - 1) {
             setCurrentStepIndex(index + 1);
        }
    }
  };

  // Auto-advance static steps
  React.useEffect(() => {
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.answer === undefined && currentStepIndex < steps.length - 1) {
        // It's a static text step, just show it and allow manual advance or auto advance? 
        // For now, let's just create a "Continue" button for static steps or auto-advance after a delay.
        // Actually, simplest UX: Show a "Continue" button for static steps.
    }
  }, [currentStepIndex, steps]);

  return (
    <div className="mt-8 text-left bg-gray-50 p-6 rounded-lg border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-4">Let's break it down:</h3>
      <div className="space-y-6">
        {steps.map((step, index) => {
          if (index > currentStepIndex) return null; // Don't show future steps yet

          const feedback = stepFeedback[step.id];
          const isCompleted = feedback === 'correct';

          return (
            <div key={step.id} className={`transition-opacity duration-500 ${index === currentStepIndex ? 'opacity-100' : 'opacity-70'}`}>
              <div className="text-gray-800 mb-2">
                 <MathRenderer text={step.text} />
              </div>

              {step.answer !== undefined ? (
                // Interactive Step
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            aria-label={`Answer for step ${index + 1}`}
                            value={stepAnswers[step.id] || ''}
                            onChange={(e) => setStepAnswers(prev => ({ ...prev, [step.id]: e.target.value }))}
                            className={`p-2 border rounded w-32 ${
                                feedback === 'correct' ? 'border-green-500 bg-green-50' : 
                                feedback === 'incorrect' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="?"
                            disabled={isCompleted}
                        />
                         {!isCompleted && (
                            <button
                                onClick={() => handleStepSubmit(index, step)}
                                aria-label={`Check answer for step ${index + 1}`}
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
