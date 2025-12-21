import React from 'react';
import { Axis } from './Axis';

export interface BoxPlotProps {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  width?: number;
  height?: number;
}

export const BoxPlot: React.FC<BoxPlotProps> = ({ min, q1, median, q3, max, width = 400, height = 150 }) => {
  const padding = 40;
  const graphWidth = width - padding * 2;
  // const graphHeight = height - padding * 2; // Unused for now, but good for future scaling

  // Scale function
  const range = max - min;
  // Add buffer to scale
  const scaleMin = min - range * 0.1;
  const scaleMax = max + range * 0.1;
  const scaleRange = scaleMax - scaleMin;

  const xScale = (val: number) => {
    return padding + ((val - scaleMin) / scaleRange) * graphWidth;
  };

  const midY = height / 2;
  const boxHeight = 40;

  const f = (n: number) => Number(n.toFixed(2));
  const description = `Box plot showing data range from ${f(min)} to ${f(max)}. First quartile is ${f(q1)}, median is ${f(median)}, and third quartile is ${f(q3)}.`;

  return (
    <svg
      width={width}
      height={height}
      className="border border-gray-100 rounded-lg bg-white shadow-sm"
      role="img"
      aria-label={description}
    >
      <title>{description}</title>
      <Axis width={width} height={height} padding={padding} ticks={[min, q1, median, q3, max]} xScale={xScale} />

      {/* Whiskers */}
      <line x1={xScale(min)} y1={midY} x2={xScale(q1)} y2={midY} stroke="#334155" strokeWidth="2" />
      <line x1={xScale(q3)} y1={midY} x2={xScale(max)} y2={midY} stroke="#334155" strokeWidth="2" />

      {/* End Caps */}
      <line x1={xScale(min)} y1={midY - 10} x2={xScale(min)} y2={midY + 10} stroke="#334155" strokeWidth="2" />
      <line x1={xScale(max)} y1={midY - 10} x2={xScale(max)} y2={midY + 10} stroke="#334155" strokeWidth="2" />

      {/* Box */}
      <rect
        x={xScale(q1)}
        y={midY - boxHeight / 2}
        width={xScale(q3) - xScale(q1)}
        height={boxHeight}
        fill="#bae6fd"
        stroke="#0284c7"
        strokeWidth="2"
      />

      {/* Median Line */}
      <line
        x1={xScale(median)}
        y1={midY - boxHeight / 2}
        x2={xScale(median)}
        y2={midY + boxHeight / 2}
        stroke="#0369a1"
        strokeWidth="3"
      />
    </svg>
  );
};
