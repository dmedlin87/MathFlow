import React, { useState, useEffect } from 'react';
import type { Item, Attempt, LearnerState } from '../domain/types';
import { updateLearnerState, recommendNextItem, isMastered } from '../domain/learner/state'; // createInitialState removed

import { MathRenderer } from './MathRenderer';
import { FractionVisualizer } from './FractionVisualizer';
import { InteractiveSteps } from './InteractiveSteps';
import { motion, AnimatePresence } from 'framer-motion';

import { SessionSummary } from './SessionSummary';

interface MathTutorProps {
    learnerState: LearnerState;
    setLearnerState: (state: LearnerState) => void;
}

export const MathTutor: React.FC<MathTutorProps> = ({ learnerState, setLearnerState }) => {
    // const [learnerState, setLearnerState] = useState<LearnerState | null>(null); // Lifted
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [diagnosis, setDiagnosis] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    
    // Session State
    const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, masteredSkills: [] as string[] });
    const [isSessionDone, setIsSessionDone] = useState(false);
  
    useEffect(() => {
        // Load Next Item on mount if state exists
        if (learnerState) {
            loadNextItem(learnerState);
        }
    }, []); // Run once on mount (managed by parent mostly now)
    
    // Effect to reload item if state changes externally? No, we don't want to reset item if state updates.

    // Persistence moved to App


  const loadNextItem = (state: LearnerState) => {
    const next = recommendNextItem(state);
    setCurrentItem(next);
    setUserAnswer('');
    setFeedback(null);
    setDiagnosis(null);
    setStartTime(Date.now());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !learnerState) return;

    // Check answer (simple string/number compare for now)
    const isCorrect = userAnswer.trim() === String(currentItem.answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    const errorTags: string[] = [];
    let diagnosisMsg = null;

    if (!isCorrect && currentItem.misconceptionMatchers) {
        for (const matcher of currentItem.misconceptionMatchers) {
            const tag = matcher(userAnswer);
            if (tag) {
                errorTags.push(tag);
                // Hardcoded mapping for now - ideally this comes from the Skill definition
                if (tag === 'add_num_add_den') {
                    diagnosisMsg = "It looks like you added the difference instead of multiplying. Remember, fractions scale by multiplication!";
                }
            }
        }
    }
    setDiagnosis(diagnosisMsg);

    const attempt: Attempt = {
        id: `att_${Date.now()}`,
        userId: learnerState.userId,
        itemId: currentItem.id,
        skillId: currentItem.skillId,
        timestamp: new Date().toISOString(),
        isCorrect,
        timeTakenMs: Date.now() - startTime,
        attemptsCount: 1, // simplified
        hintsUsed: 0,
        errorTags
    };

    const newState = updateLearnerState(learnerState, attempt);
    
    // Update session stats
    setSessionStats(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        masteredSkills: isMastered(newState.skillState[currentItem.skillId])
            ? Array.from(new Set([...prev.masteredSkills, currentItem.skillId])) 
            : prev.masteredSkills
    }));

    setLearnerState(newState);
  };

  const handleNext = () => {
    // End session after 5 items for demo (or add button)
    if (sessionStats.total >= 5) {
        setIsSessionDone(true);
        return;
    }

    if (learnerState) {
        loadNextItem(learnerState);
    }
  };

  const handleRestart = () => {
     setSessionStats({ total: 0, correct: 0, masteredSkills: [] });
     setIsSessionDone(false);
     if (learnerState) loadNextItem(learnerState);
  };

  if (isSessionDone) {
      return <SessionSummary stats={sessionStats} onRestart={handleRestart} />;
  }

  if (!currentItem) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <div className="mb-4 flex justify-between items-center text-sm text-gray-500">
        <span>Skill: {currentItem.skillId}</span>
        <span>Ma: {(learnerState?.skillState[currentItem.skillId]?.masteryProb || 0).toFixed(2)}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-2xl font-medium mb-8 text-gray-800 flex flex-col items-center">
                <MathRenderer text={currentItem.question} />
                
                {currentItem.config && currentItem.skillId === 'frac_equiv_01' && (
                    <div className="mt-8 flex gap-12 items-center justify-center">
                        <div className="text-center">
                            <FractionVisualizer 
                                numerator={currentItem.config.baseNum} 
                                denominator={currentItem.config.baseDen} 
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
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="w-full text-lg p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-colors"
                        placeholder="Enter your answer"
                        disabled={feedback !== null}
                        autoFocus
                    />
                </div>

                {feedback === null ? (
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Check Answer
                    </button>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg text-center font-medium ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                        {feedback === 'correct' ? 'Correct! 🎉' : (diagnosis ? `⚠️ ${diagnosis}` : `Not quite. The answer is ${currentItem.answer}.`)}
                    </motion.div>
                )}
            </form>

            {feedback && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6"
                >
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
                    >
                        Next Problem →
                    </button>
                    
                    {currentItem.steps && feedback === 'incorrect' && (
                        <InteractiveSteps steps={currentItem.steps} />
                    )}
                </motion.div>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
