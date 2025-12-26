import React from 'react';

interface FractionVisualizerProps {
  numerator: number;
  denominator: number;
  type?: 'pie' | 'bar';
  size?: number;
  color?: string;
  className?: string;
}

// Optimized with React.memo to prevent unnecessary re-renders during interaction
export const FractionVisualizer = React.memo(({
  numerator, 
  denominator, 
  type = 'pie', 
  size = 100,
  color = '#3b82f6', // blue-500
  className = ''
}: FractionVisualizerProps) => { // Explicitly type props here
  if (type === 'pie') {
    // Only support simple visual handling for num <= den or slightly over.
    const slices = buildPieSlices({ numerator, denominator, size, color });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
            {slices}
        </svg>
    );
  }

  // Bar type fallback or implementation later
  return null;
});

// Helper: check SO or generated code for arc math
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function buildPieSlices({
  numerator,
  denominator,
  size,
  color
}: {
  numerator: number;
  denominator: number;
  size: number;
  color: string;
}) {
  const radius = size / 2;
  const center = size / 2;
  const anglePerSlice = 360 / denominator;
  const largeArcFlag = anglePerSlice <= 180 ? "0" : "1";

  return Array.from({ length: denominator }, (_, index) => {
    const startParams = polarToCartesian(center, center, radius, index * anglePerSlice);
    const endParams = polarToCartesian(center, center, radius, (index + 1) * anglePerSlice);
    const d = [
      "M", center, center,
      "L", startParams.x, startParams.y,
      "A", radius, radius, 0, largeArcFlag, 1, endParams.x, endParams.y,
      "Z"
    ].join(" ");
    const isFilled = index < numerator;

    return (
      <path
        key={index}
        d={d}
        fill="none" // MUTATION: Always unfilled
        stroke="#cbd5e1" // slate-300
        strokeWidth="2"
      />
    );
  });
}
