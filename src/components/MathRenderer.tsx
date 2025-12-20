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
  // Split by spaces to handle operators
  const tokens = useMemo(() => text.split(' '), [text]);
  
  return (
    <>
      {tokens.map((token, i) => {
        // Check for fraction pattern: something/something
        // Allowing '?' as a valid part
        if (token.includes('/') && !token.includes('=') && token.split('/').length === 2) {
          const [num, den] = token.split('/');
          // Basic validation to avoid false positives (like dates or paths)
          if (num.length > 0 && den.length > 0) {
            return (
              <React.Fragment key={i}>
                <span className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
                  <span className="border-b-2 border-current px-1 min-w-[1em] text-center">{num}</span>
                  <span className="px-1 min-w-[1em] text-center">{den}</span>
                </span>
                {i < tokens.length - 1 && ' '}
              </React.Fragment>
            );
          }
        }
        // Operators or regular text
        return (
          <React.Fragment key={i}>
            <span className="mx-1">{token}</span>
            {i < tokens.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </>
  );
};
