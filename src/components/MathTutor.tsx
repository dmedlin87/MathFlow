import React, { useState, useEffect } from 'react';
import type { Item, Attempt, LearnerState } from '../domain/types';
import { createInitialState, updateLearnerState, recommendNextItem } from '../domain/learner/state';

import { MathRenderer } from './MathRenderer';
import { FractionVisualizer } from './FractionVisualizer';

import { PersistenceService } from '../services/persistence';

import { SessionSummary } from './SessionSummary';

export const MathTutor: React.FC = () => {
    // ... (state hooks are fine) 
    const [learnerState, setLearnerState] = useState<LearnerState | null>(null);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [diagnosis, setDiagnosis] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    
    // Session State
    const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, masteredSkills: [] as string[] });
    const [isSessionDone, setIsSessionDone] = useState(false);
  
    useEffect(() => {
        // Load or Initialize
        let state = PersistenceService.loadState();
        if (!state) {
            state = createInitialState('user_1');
        }
        setLearnerState(state);
        loadNextItem(state);
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        if (learnerState) {
            PersistenceService.saveState(learnerState);
        }
    }, [learnerState]);

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
        // Simple mock mastery check: if prob > 0.85 add to list if not there
        masteredSkills: newState.skillState[currentItem.skillId].masteryProb > 0.85 
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

      <div className="text-2xl font-medium mb-8 text-gray-800 flex flex-col items-center">
         <MathRenderer text={currentItem.question} />
         
         {/* Visual Cue if available in config */}
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
                 {/* Maybe show the target blank pie? Or just one visual is enough for now */}
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
            <div className={`p-4 rounded-lg text-center font-medium ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {feedback === 'correct' ? 'Correct! 🎉' : (diagnosis ? `⚠️ ${diagnosis}` : `Not quite. The answer is ${currentItem.answer}.`)}
            </div>
        )}
      </form>

      {feedback && (
        <div className="mt-6">
            <button
                onClick={handleNext}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
            >
                Next Problem →
            </button>
            
            {currentItem.steps && feedback === 'incorrect' && (
                <div className="mt-8 text-left bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Explanation</h3>
                    <ul className="space-y-2">
                        {currentItem.steps.map(step => (
                            <li key={step.id} className="text-gray-600">
                                • {step.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
