import React from 'react';
import type { VisualSpec } from '../../domain/types';
import { BoxPlot } from './BoxPlot';
import { DotPlot } from './DotPlot';

interface ProblemVisualizerProps {
    spec: VisualSpec;
}

// Optimization: Memoize to prevent re-renders when parent state (e.g. user input) changes
// but the visual specification remains the same. SVGs are expensive to re-calculate/DOM-diff.
export const ProblemVisualizer = React.memo(({ spec }: ProblemVisualizerProps) => {
    if (!spec) return null;

    switch (spec.type) {
        case 'box_plot':
            return <BoxPlot {...spec.data} />;
        case 'dot_plot':
            return <DotPlot {...spec.data} />;
        default:
            return <div className="text-gray-400 text-sm">Visualizer not implemented for {spec.type}</div>;
    }
});
