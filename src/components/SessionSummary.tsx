import React from 'react';


interface SessionSummaryProps {
  stats: {
    total: number;
    correct: number;
    masteredSkills: string[];
  };
  onRestart: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ stats, onRestart }) => {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10 text-center">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Complete! 🎓</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-2">{accuracy}%</div>
            <div className="text-gray-600 font-medium">Accuracy</div>
        </div>
        <div className="p-6 bg-purple-50 rounded-xl">
            <div className="text-4xl font-bold text-purple-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 font-medium">Problems Solved</div>
        </div>
      </div>

      <div className="mb-8 text-left">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Skills Practiced</h3>
        <div className="space-y-2">
            {stats.masteredSkills.map(skill => (
                <div key={skill} className="flex items-center text-green-700 bg-green-50 p-3 rounded-lg">
                    <span className="mr-2">✅</span> {skill} (Mastered)
                </div>
            ))}
             {/* If no mastered skills, maybe show something generic */}
             {stats.masteredSkills.length === 0 && (
                <div className="text-gray-500 italic">Keep practicing to master new skills!</div>
             )}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold text-lg hover:bg-black transition-colors"
      >
        Start New Session
      </button>
    </div>
  );
};
