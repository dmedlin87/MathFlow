import React from 'react';
import type { LearnerState, Skill } from '../domain/types';
import { ALL_SKILLS_LIST } from '../domain/skills/registry'; // Need to create this or import from somewhere

interface DashboardProps {
    learnerState: LearnerState;
    onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ learnerState, onClose }) => {
    const handleExport = () => {
        const data = JSON.stringify(learnerState, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mathflow-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
             <div className="max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Learner Progress</h2>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleExport}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                        >
                            Export Data
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black"
                        >
                            Back to Tutor
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mastery Heatmap / List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Skill Mastery</h3>
                        <div className="space-y-4">
                            {ALL_SKILLS_LIST.map((skill: Skill) => {
                                const state = learnerState.skillState[skill.id];
                                const mastery = state?.masteryProb || 0.1; // Default
                                const stability = state?.stability || 0;
                                
                                let color = 'bg-red-500';
                                if (mastery > 0.8) color = 'bg-green-500';
                                else if (mastery > 0.5) color = 'bg-yellow-500';

                                return (
                                    <div key={skill.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-800">{skill.name}</span>
                                            <span className="text-sm text-gray-500">{(mastery * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${mastery * 100}%` }}></div>
                                        </div>
                                        <div className="mt-1 flex justify-between text-xs text-gray-400">
                                            <span>Stability: {stability.toFixed(1)}</span>
                                            <span>Last: {state ? new Date(state.lastPracticed).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Misconceptions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Needs Attention</h3>
                         <div className="space-y-4">
                            {Object.entries(learnerState.skillState)
                                .filter(([, s]) => s.misconceptions && s.misconceptions.length > 0)
                                .map(([skillId, s]) => (
                                <div key={skillId} className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <div className="text-sm font-semibold text-orange-800 mb-1">{skillId}</div>
                                    <ul className="list-disc list-inside text-sm text-orange-700">
                                        {s.misconceptions.map(m => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {Object.values(learnerState.skillState).every(s => !s.misconceptions?.length) && (
                                <p className="text-gray-500 italic">No persistent misconceptions detected yet. Good job!</p>
                            )}
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};
