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

// Optimization: Memoize and group text nodes to reduce DOM size
const ParsedMath = React.memo(({ text }: { text: string }) => {
  const parts = useMemo(() => {
    // We split by space to detect fractions but re-group regular text
    // to avoid creating a span for every single word.
    const tokens = text.split(' ');
    const result: Array<{ type: 'text', content: string } | { type: 'fraction', num: string, den: string }> = [];
    let currentText: string[] = [];

    tokens.forEach((token) => {
      // Fraction detection logic (must match original behavior)
      let isFraction = false;
      let num = '';
      let den = '';

      if (token.includes('/') && !token.includes('=') && token.split('/').length === 2) {
         const split = token.split('/');
         num = split[0];
         den = split[1];
         // Basic validation
         if (num.length > 0 && den.length > 0) {
           isFraction = true;
         }
      }

      if (isFraction) {
        // Flush accumulated text if any
        if (currentText.length > 0) {
           result.push({ type: 'text', content: currentText.join(' ') });
           currentText = [];
        }
        result.push({ type: 'fraction', num, den });
      } else {
        currentText.push(token);
      }
    });

    if (currentText.length > 0) {
      result.push({ type: 'text', content: currentText.join(' ') });
    }
    return result;
  }, [text]);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'fraction') {
          return (
            <React.Fragment key={i}>
              <span className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
                <span className="border-b-2 border-current px-1 min-w-[1em] text-center">{part.num}</span>
                <span className="px-1 min-w-[1em] text-center">{part.den}</span>
              </span>
              {/* Maintain space if not last */}
              {i < parts.length - 1 && ' '}
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={i}>
              {/* Render grouped text in a single span */}
              <span className="mx-1">{part.content}</span>
              {/* Maintain space if not last */}
              {i < parts.length - 1 && ' '}
            </React.Fragment>
          );
        }
      })}
    </>
  );
});
