import React, { useId } from 'react';
import { Axis } from './Axis';

export interface DotPlotProps {
  data: number[]; // Raw numbers
  width?: number;
  height?: number;
}

export const DotPlot: React.FC<DotPlotProps> = ({ data, width = 400, height = 200 }) => {
  const titleId = useId();
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
  const totalPoints = data.length;

  // Format numbers for accessibility (clean integers vs decimals)
  const formatNum = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(2);
  const description = `Dot plot showing ${totalPoints} data points ranging from ${formatNum(min)} to ${formatNum(max)}.`;

  return (
    <svg
      width={width}
      height={height}
      className="border border-gray-100 rounded-lg bg-white shadow-sm"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{description}</title>
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
