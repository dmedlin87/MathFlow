import React from 'react';
import { Axis } from './Axis';

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

  // Generate accessible description
  // Sort keys to ensure order, although Object.entries order is usually insertion order for string keys (except numeric)
  // Numeric keys in JS objects are sorted.
  const summary = Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([val, count]) => `${count} at ${val}`)
    .join(', ');

  const description = `Dot plot showing data distribution: ${summary}.`;

  return (
    <svg
      width={width}
      height={height}
      className="border border-gray-100 rounded-lg bg-white shadow-sm"
      role="img"
      aria-label={description}
    >
      <title>{description}</title>
      <Axis width={width} height={height} padding={padding} ticks={ticks} xScale={xScale} />

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
