import React from 'react';

export interface DotPlotProps {
  data: number[]; // Raw numbers
  width?: number;
  height?: number;
}

export const DotPlot: React.FC<DotPlotProps> = ({ data, width = 400, height = 200 }) => {
  const padding = 40;
  const graphWidth = width - padding * 2;
  // const graphHeight = height - padding * 2; // Unused for now

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Ticks every integer if range small, else adaptive (MVP: assume integer small range)
  const ticks = Array.from({ length: range + 1 }, (_, i) => min + i);

  const xScale = (val: number) => {
    return padding + ((val - min) / range) * graphWidth;
  };

  // Bin data
  const counts: Record<number, number> = {};
  data.forEach(d => counts[d] = (counts[d] || 0) + 1);

  const dotRadius = 6;
  const dotGap = 16;

  return (
    <svg width={width} height={height} className="border border-gray-100 rounded-lg bg-white shadow-sm">
      {/* Axis */}
      <line x1={padding} y1={height - 30} x2={width - padding} y2={height - 30} stroke="#94a3b8" strokeWidth="2" />

      {/* Ticks */}
      {ticks.map(val => (
        <g key={val} transform={`translate(${xScale(val)}, 0)`}>
             <line x1="0" y1={height - 35} x2="0" y2={height - 25} stroke="#64748b" strokeWidth="2" />
             <text x="0" y={height - 10} textAnchor="middle" fontSize="12" fill="#475569">{val}</text>
        </g>
      ))}

      {/* Dots */}
      {Object.entries(counts).map(([valStr, count]) => {
          const val = Number(valStr);
          return Array.from({ length: count }).map((_, i) => (
            <circle
                key={`${val}-${i}`}
                cx={xScale(val)}
                cy={height - 40 - (i * dotGap)}
                r={dotRadius}
                fill="#3b82f6"
                stroke="#1d4ed8"
                strokeWidth="1"
            />
          ));
      })}
    </svg>
  );
};
