import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Regex to split by LaTeX delimiters or bold markdown
// DELIMITERS: \( ... \) or $$ ... $$ or ** ... **
const LATEX_REGEX = /(\\\(.*?\\\)|(?:\$\$.*?\$\$)|(?:\*\*.*?\*\*))/g;

// Helper to determine if a token is a simple fraction
const isFraction = (token: string): boolean => {
  return (
    token.includes('/') &&
    !token.includes('=') &&
    token.split('/').length === 2 &&
    // Ensure both parts are non-empty strings (e.g. not just "/")
    token.split('/')[0].length > 0 &&
    token.split('/')[1].length > 0
  );
};

// Simple parser that supports both KaTeX and our legacy fraction format
// Optimized with React.memo to prevent unnecessary re-renders
export const MathRenderer = React.memo(({ text }: { text: string }) => {
  const parts = useMemo(() => {
    return text.split(LATEX_REGEX);
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

interface TextNode {
  type: 'text';
  content: string;
}

interface FractionNode {
  type: 'fraction';
  num: string;
  den: string;
}

type ParsedNode = TextNode | FractionNode;

const ParsedMath: React.FC<{ text: string }> = ({ text }) => {
  // Optimization: Group consecutive text tokens into single spans to reduce DOM node count.
  const nodes = useMemo(() => {
    const tokens = text.split(' ');
    const grouped: ParsedNode[] = [];
    let currentTextBuffer: string[] = [];

    const flushBuffer = () => {
      if (currentTextBuffer.length > 0) {
        // Join with spaces since we split by space
        grouped.push({ type: 'text', content: currentTextBuffer.join(' ') });
        currentTextBuffer = [];
      }
    };

    tokens.forEach((token) => {
      if (isFraction(token)) {
        flushBuffer();
        const [num, den] = token.split('/');
        grouped.push({ type: 'fraction', num, den });
      } else {
        currentTextBuffer.push(token);
      }
    });
    flushBuffer();
    return grouped;
  }, [text]);
  
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'fraction') {
          return (
            <React.Fragment key={i}>
              <span className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
                <span className="border-b-2 border-current px-1 min-w-[1em] text-center">{node.num}</span>
                <span className="px-1 min-w-[1em] text-center">{node.den}</span>
              </span>
              {/* Add space after if not last */}
              {i < nodes.length - 1 && ' '}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={i}>
            {/*
               We use mx-1 to match previous visual style, but apply it to the whole group.
               Since internal spaces are preserved in 'content', this renders standard text.
               The mx-1 gives margin to the block against other blocks (like fractions).
            */}
            <span className="mx-1">{node.content}</span>
            {i < nodes.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </>
  );
};
