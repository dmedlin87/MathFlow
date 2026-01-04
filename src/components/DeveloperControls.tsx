import React from 'react';

interface DeveloperControlsProps {
    onAutoSolve: () => void;
}

// Optimized with React.memo to prevent unnecessary re-renders when parent state changes
export const DeveloperControls = React.memo(({ onAutoSolve }: DeveloperControlsProps) => {
    return (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-lg shadow-xl z-50 flex flex-col gap-2 border border-gray-700">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Dev Tools</div>
            <button
                onClick={onAutoSolve}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-medium transition-colors"
                title="Automatically fill and submit the correct answer"
            >
                <span aria-hidden="true">⚡</span> Auto Solve
            </button>
        </div>
    );
});
