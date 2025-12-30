import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Simple parser that supports both KaTeX and our legacy fraction format
// Optimized with React.memo to prevent unnecessary re-renders
export const MathRenderer = React.memo(({ text }: { text: string }) => {
  // Regex to split by LaTeX delimiters or bold markdown
  // DELIMITERS: \( ... \) or $$ ... $$ or ** ... **
  const parts = useMemo(() => {
    return text.split(/(\\\(.*?\\\)|(?:\$\$.*?\$\$)|(?:\*\*.*?\*\*))/g);
  }, [text]);

  return (
    <span className="inline-flex items-center flex-wrap gap-1 text-2xl">
      <span className="sr-only" aria-hidden="false">{text}</span>
      <span aria-hidden="true" className="inline-flex items-center flex-wrap gap-1">
      {parts.map((part, i) => {
        if (!part) return null;

        // LaTeX Inline: \( ... \) or Display: $$ ... $$
        if ((part.startsWith('\\(') && part.endsWith('\\)')) || (part.startsWith('$$') && part.endsWith('$$'))) {
          const isDisplay = part.startsWith('$$');
          const content = isDisplay ? part.slice(2, -2) : part.slice(2, -2);
          
          try {
            const html = katex.renderToString(content, {
              throwOnError: false,
              displayMode: isDisplay
            });
            return (
              <span 
                key={i} 
                className={isDisplay ? "w-full flex justify-center my-2" : "inline-block mx-1"}
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          } catch (e) {
            console.error("KaTeX error:", e);
            return <span key={i} className="text-red-500 font-mono text-sm">{part}</span>;
          }
        }

        // Bold Markdown: ** ... **
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold mx-1 inline-flex items-center">
              <ParsedMath text={content} />
            </strong>
          );
        }

        // Regular Text (might contain simple a/b fractions)
        return <ParsedMath key={i} text={part} />;
      })}
      </span>
    </span>
  );
});

const ParsedMath: React.FC<{ text: string }> = ({ text }) => {
  // Optimize: Split by fraction pattern to reduce DOM nodes (span soup)
  // Only create separate spans for fractions; keep text grouped.
  // Pattern: alphanumeric/alphanumeric (e.g. 1/2, 3x/4y).
  // We use lookbehind/lookahead to avoid matching parts of larger sequences like 1/2/3
  const parts = useMemo(() => text.split(/((?<!\/)[\w.]+\/[\w.]+(?!\/))/g), [text]);
  
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Check if it's a fraction (double check format)
        if (part.includes('/') && part.split('/').length === 2) {
          const [num, den] = part.split('/');
          // Ensure valid numerator/denominator to avoid rendering invalid fractions like "1/" or "/2"
          if (num.length > 0 && den.length > 0) {
            return (
              <span key={i} className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
                <span className="border-b-2 border-current px-1 min-w-[1em] text-center">{num}</span>
                <span className="px-1 min-w-[1em] text-center">{den}</span>
              </span>
            );
          }
        }

        // Regular text
        return (
          <span key={i} className="mx-1">{part}</span>
        );
      })}
    </>
  );
};
