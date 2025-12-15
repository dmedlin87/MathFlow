
import { useState, useMemo } from 'react';
import { MathTutor } from './components/MathTutor';
import { Dashboard } from './components/Dashboard';
import { PersistenceService } from './services/persistence';
import { LocalLearnerService } from './services/LearnerService';
import { createInitialState } from './domain/learner/state';

function App() {
  const [view, setView] = useState<'tutor' | 'dashboard'>('tutor');
  // Load state here so we can pass it to Dashboard even if not in Tutor mode? 
  // Ideally MathTutor manages it, but lifting state up is better for Dashboard access.
  // For MVP, simple persistence read in Dashboard is fine or just pass from Tutor if we lift state.
  // Let's just instantiate persistence read in Dashboard for now to keep it simple, OR lift state.
  // Lifting state is safer.
  const [learnerState, setLearnerState] = useState(() => {
     return PersistenceService.loadState() || createInitialState('user_1');
  });

  const learnerService = useMemo(() => new LocalLearnerService(), []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MathFlow
            </h1>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setView('dashboard')}
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                    Dashboard
                </button>
                <div className="text-sm text-gray-400">R&D Preview</div>
            </div>
        </div>
      </header>
      <main>
        {view === 'tutor' ? (
            <MathTutor learnerState={learnerState} setLearnerState={setLearnerState} learnerService={learnerService} />
        ) : (
            <Dashboard learnerState={learnerState} onClose={() => setView('tutor')} />
        )}
      </main>
    </div>
  );
}

export default App;
