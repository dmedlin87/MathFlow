import React, { useState, useEffect, useCallback } from 'react';
import type { MathProblemItem, Attempt, LearnerState } from '../domain/types';
import { checkAnswer } from '../domain/math-utils';
// LocalLearnerService removed (injected)
// Removed MisconceptionEvaluator import

import { MathRenderer } from './MathRenderer';
import { FractionVisualizer } from './FractionVisualizer';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalInput } from './inputs/UniversalInput'; // Import Universal Input
import { ProblemVisualizer } from './visualizers/ProblemVisualizer'; // Import Visualizer

import { SessionSummary } from './SessionSummary';
import { DeveloperControls } from './DeveloperControls';
import { InteractiveSteps } from './InteractiveSteps';

import type { ILearnerService } from '../services/LearnerService';

interface MathTutorProps {
    learnerState: LearnerState;
    setLearnerState: (state: LearnerState) => void;
    learnerService: ILearnerService;
}

// Type guard for runtime safety (Architecture Fix: No 'as any')
// Optimization: Moved outside component to avoid recreation on every render
const isFractionEquivVars = (v: unknown): v is { baseNum: number; baseDen: number } => {
    if (typeof v !== 'object' || v === null) return false;
    const r = v as Record<string, unknown>;
    return typeof r.baseNum === 'number' && typeof r.baseDen === 'number';
};

export const MathTutor: React.FC<MathTutorProps> = ({ learnerState, setLearnerState, learnerService }) => {
    // Service is now injected via props


    const [currentItem, setCurrentItem] = useState<MathProblemItem | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [diagnosis, setDiagnosis] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [attempts, setAttempts] = useState<number>(0);
    const [isDevMode, setIsDevMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Add Loading State for Async Service
    
    // Session State
    const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, masteredSkills: [] as string[] });
    const [isSessionDone, setIsSessionDone] = useState(false);

  const loadNextItem = useCallback(async (state: LearnerState) => {
    setIsLoading(true);
    try {
        const next = await learnerService.getRecommendation(state);
        setCurrentItem(next);
        setUserAnswer('');
        setFeedback(null);
        setDiagnosis(null);
        setStartTime(Date.now());
        setAttempts(0);
    } finally {
        setIsLoading(false);
    }
  }, [learnerService]);

    useEffect(() => {
        // Load Next Item on mount if state exists
        if (!currentItem && learnerState) {
            loadNextItem(learnerState);
        }
    }, [currentItem, learnerState, loadNextItem]);

  // Wrap handleSubmit in useCallback to prevent it from invalidating memoized children
  const handleSubmit = useCallback(async (e?: React.FormEvent, overrideAnswer?: string) => {
    if (e) e.preventDefault();
    if (!currentItem || !learnerState) return;

    // Check answer (use override if provided, otherwise state)
    const answerToCheck = overrideAnswer !== undefined ? overrideAnswer : userAnswer;
    const isCorrect = checkAnswer(answerToCheck, currentItem);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    const errorTags: string[] = [];
    let diagnosisMsg = null;

    setIsLoading(true);

    try {
        if (!isCorrect) {
            // Use the new Runtime Service for diagnosis
            try {
                const diagnosisResult = await learnerService.diagnose(currentItem, answerToCheck);
                if (diagnosisResult) {
                     errorTags.push(diagnosisResult.error_category);
                     
                     // Pick a hint from the ladder based on attempts
                     const ladder = diagnosisResult.hint_ladder || [];
                     if (ladder.length > 0) {
                         const hintIndex = Math.min(attempts, ladder.length - 1);
                         diagnosisMsg = ladder[hintIndex];
                     } else {
                         diagnosisMsg = diagnosisResult.diagnosis_explanation || null;
                     }
                }
            } catch (diagErr) {
                console.error("Diagnosis failed", diagErr);
            }
        }
        setDiagnosis(diagnosisMsg);

        const currentAttemptCount = attempts + 1;
        setAttempts(currentAttemptCount);

        const attempt: Attempt = {
            id: `att_${Date.now()}`,
            userId: learnerState.userId,
            itemId: currentItem.meta.id,
            skillId: currentItem.meta.skill_id,
            timestamp: new Date().toISOString(),
            isCorrect,
            timeTakenMs: Date.now() - startTime,
            attemptsCount: currentAttemptCount,
            hintsUsed: 0,
            errorTags
        };

        // Architecture Fix: Use Service to submit attempt (Async)
        // We explicitly await it to enforce the "Honest Simulation" latency
        const newState = await learnerService.submitAttempt(learnerState, attempt);
        
        // Update session stats
        if (attempts === 0) {
            setSessionStats(prev => ({
                ...prev,
                total: prev.total + 1,
                correct: prev.correct + (isCorrect ? 1 : 0),
                masteredSkills: newState.skillState[currentItem.meta.skill_id]?.masteryProb > 0.85
                    ? Array.from(new Set([...prev.masteredSkills, currentItem.meta.skill_id]))
                    : prev.masteredSkills
            }));
        } else {
            if (newState.skillState[currentItem.meta.skill_id].masteryProb > 0.85) {
                 setSessionStats(prev => ({
                    ...prev,
                    masteredSkills: Array.from(new Set([...prev.masteredSkills, currentItem.meta.skill_id]))
                 }));
            }
        }

        setLearnerState(newState);

    } catch (err) {
        console.error("Failed to submit attempt", err);
    } finally {
        setIsLoading(false);
    }
  }, [currentItem, learnerState, userAnswer, learnerService, attempts, startTime, setLearnerState]);

  // Stable handler for input changes
  const handleInputChange = useCallback((val: string) => {
    setUserAnswer(val);
    setFeedback(current => current === 'incorrect' ? null : current);
  }, []);

  const handleNext = () => {
    if (sessionStats.total >= 5) {
        setIsSessionDone(true);
        return;
    }

    if (learnerState) {
        loadNextItem(learnerState);
    }
  };

  const handleEndSession = () => {
    setIsSessionDone(true);
  };

  const handleRestart = () => {
     setSessionStats({ total: 0, correct: 0, masteredSkills: [] });
     setIsSessionDone(false);
     if (learnerState) loadNextItem(learnerState);
  };

  // Hoisted handleAutoSolve before early returns, depends on stable handleSubmit
  const handleAutoSolve = useCallback(() => {
    if (!currentItem) return;
    const correctAns = currentItem.solution_logic.final_answer_canonical;
    setUserAnswer(correctAns);

    // Call handleSubmit directly with the correct answer
    handleSubmit(undefined, correctAns);
  }, [currentItem, handleSubmit]);

  if (isSessionDone) {
      return <SessionSummary stats={sessionStats} onRestart={handleRestart} />;
  }

  if (!currentItem) return <div className="p-8 text-center">Loading...</div>;

  // Map variables for visualization
  // In V1, variables are in problem_content.variables
  const vars = currentItem.problem_content.variables;

  const fracEquivConfig = currentItem.meta.skill_id === 'frac_equiv_01' && isFractionEquivVars(vars)
    ? { baseNum: vars.baseNum, baseDen: vars.baseDen }
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 relative">
      <div className="mb-4 flex justify-between items-center text-sm text-gray-500">
        <span>Skill: {currentItem.meta.skill_id}</span>
        <div className="flex gap-4">
            <span>Ma: {(learnerState?.skillState[currentItem.meta.skill_id]?.masteryProb || 0).toFixed(2)}</span>
            {isLoading && <span className="text-blue-500 font-bold text-xs animate-pulse">SYNCING...</span>}
            <button 
                onClick={() => setIsDevMode(!isDevMode)}
                aria-pressed={isDevMode}
                className={`font-mono text-xs px-3 py-1 border rounded transition-colors ${
                    isDevMode 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                }`}
            >
                DEV MODE
            </button>
        </div>
      </div>

      {isDevMode && <DeveloperControls onAutoSolve={handleAutoSolve} />}

      <AnimatePresence mode="wait">
        <motion.div
            key={currentItem.meta.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-2xl font-medium mb-8 text-gray-800 flex flex-col items-center">
                <MathRenderer text={currentItem.problem_content.stem} />
                
                {/* Generic Visualizer Dispatcher */}
                {currentItem.problem_content.visual_spec && (
                   <div className="mt-8 flex justify-center w-full">
                       <ProblemVisualizer spec={currentItem.problem_content.visual_spec} />
                   </div>
                )}

                {/* Legacy Hardcoded Visualizer - Keep for now until migrated */}
                {!currentItem.problem_content.visual_spec && fracEquivConfig && (
                    <div className="mt-8 flex gap-12 items-center justify-center">
                        <div className="text-center">
                            <FractionVisualizer 
                                numerator={fracEquivConfig.baseNum}
                                denominator={fracEquivConfig.baseDen}
                                size={120}
                                color="#60a5fa" 
                            />
                            <div className="mt-2 text-sm text-gray-400">Target</div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <UniversalInput
                        item={currentItem}
                        value={userAnswer}
                        onChange={handleInputChange}
                        onSubmit={handleSubmit}
                        disabled={feedback === 'correct'}
                    />
                </div>

                {feedback !== 'correct' && currentItem.answer_spec.input_type !== 'multiple_choice' && (
                    <button
                        type="submit"
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={isLoading}
                        className={`w-full py-3 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                            isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Checking...</span>
                            </>
                        ) : (
                            feedback === 'incorrect' ? 'Try Again' : 'Check Answer'
                        )}
                    </button>
                )}
                {/* For Multiple Choice, UniversalInput handles click-to-select, but we still might want a submit or auto-submit.
                    The current implementation of UniversalInput for MC is passive (just onChange).
                    Let's add a condition: if multiple choice, maybe we show the button OR make UniversalInput smart.
                    Actually, keeping the button is safer for kids (select then confirm).
                    The previous plan said "Select-then-submit". So keeping the button is correct.
                */}
                {feedback !== 'correct' && currentItem.answer_spec.input_type === 'multiple_choice' && (
                    <button
                        type="submit"
                        disabled={!userAnswer || isLoading}
                        aria-disabled={!userAnswer || isLoading}
                        aria-busy={isLoading}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                             !userAnswer
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : isLoading
                                    ? 'bg-blue-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Checking...</span>
                            </>
                        ) : (
                            feedback === 'incorrect' ? 'Try Again' : 'Check Answer'
                        )}
                    </button>
                )}

                {feedback && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        role={feedback === 'correct' ? 'status' : 'alert'}
                        className={`p-4 rounded-lg text-center font-medium ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                        {feedback === 'correct' ? 'Correct! 🎉' : (diagnosis ? `⚠️ ${diagnosis}` : `Not quite. Try again.`)}
                    </motion.div>
                )}
            </form>

            {feedback === 'correct' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6"
                >
                    <div className="flex gap-4">
                        <button
                            onClick={handleNext}
                            autoFocus
                            className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors focus:outline-none focus:ring-4 focus:ring-gray-400"
                        >
                            Next Problem →
                        </button>
                        <button
                            onClick={handleEndSession}
                            className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            End Session
                        </button>
                    </div>
                    
                </motion.div>
            )}

            {currentItem.solution_logic.steps && feedback === 'incorrect' && (
                <InteractiveSteps 
                    steps={currentItem.solution_logic.steps.map((s, i) => ({
                        id: `step_${s.step_index}_${i}`,
                        text: s.explanation,
                        answer: s.answer,
                        explanation: s.math
                    }))} 
                />
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
