import React from 'react';

export interface AxisProps {
  width: number;
  height: number;
  padding: number;
  ticks: number[];
  xScale: (val: number) => number;
}

export const Axis: React.FC<AxisProps> = ({ width, height, padding, ticks, xScale }) => (
  <>
    <line x1={padding} y1={height - 30} x2={width - padding} y2={height - 30} stroke="#94a3b8" strokeWidth="2" />
    {ticks.map((val, index) => (
      <g key={`${val}-${index}`} transform={`translate(${xScale(val)}, 0)`}>
        <line x1="0" y1={height - 35} x2="0" y2={height - 25} stroke="#64748b" strokeWidth="2" />
        <text x="0" y={height - 10} textAnchor="middle" fontSize="12" fill="#475569">{val}</text>
      </g>
    ))}
  </>
);
