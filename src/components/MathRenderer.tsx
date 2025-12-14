import React from 'react';

// Simple parser for our specific format
// Converts "**3/5 = ?/15**" into bold + fraction layout
export const MathRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Regex to find fractions: number/number or ?/number or number/?
  // and wrapped in bold if present
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span className="inline-flex items-center flex-wrap gap-1 text-2xl">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold mx-1 inline-flex items-center">
              <ParsedMath text={content} />
            </strong>
          );
        }
        if (!part) return null;
        return <ParsedMath key={i} text={part} />;
      })}
    </span>
  );
};

const ParsedMath: React.FC<{ text: string }> = ({ text }) => {
  // Split by spaces to handle operators
  const tokens = text.split(' ');
  
  return (
    <>
      {tokens.map((token, i) => {
        // Check for fraction pattern: something/something
        // Allowing '?' as a valid part
        if (token.includes('/') && !token.includes('=')) {
          const [num, den] = token.split('/');
          return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
              <span className="border-b-2 border-current px-1 min-w-[1em] text-center">{num}</span>
              <span className="px-1 min-w-[1em] text-center">{den}</span>
            </span>
          );
        }
        // Operators or regular text
        return <span key={i} className="mx-1">{token}</span>;
      })}
    </>
  );
};
