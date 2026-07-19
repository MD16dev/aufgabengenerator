import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  math: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ math, block = false }) => {
  if (block) {
    return (
      <div className="w-full min-w-0 overflow-x-auto py-2">
        <BlockMath math={math} />
      </div>
    );
  }
  return <InlineMath math={math} />;
};

function renderFormattedText(content: string): React.ReactNode[] {
  // Convert basic HTML formatting tags to markdown bold/italic
  const normalized = content
    .replace(/<\/?strong>/gi, '**')
    .replace(/<\/?b>/gi, '**')
    .replace(/<\/?em>/gi, '*')
    .replace(/<\/?i>/gi, '*');

  const boldParts = normalized.split('**');
  return boldParts.map((bText, bIdx) => {
    const isBold = bIdx % 2 === 1;
    const italicParts = bText.split('*');
    const renderedItalic = italicParts.map((iText, iIdx) => {
      const isItalic = iIdx % 2 === 1;
      if (isItalic) {
        return <em key={iIdx}>{iText}</em>;
      }
      return iText;
    });

    if (isBold) {
      return <strong key={bIdx}>{renderedItalic}</strong>;
    }
    return <span key={bIdx}>{renderedItalic}</span>;
  });
}

interface LatexTextRendererProps {
  text: string;
}

/**
 * Parses a string containing inline math ($...$) and block math ($$...$$)
 * and renders it with appropriate KaTeX elements.
 */
export const LatexTextRenderer: React.FC<LatexTextRendererProps> = ({ text }) => {
  // Split by $$ first to isolate block math
  const blocks = text.split('$$');
  return (
    <div className="leading-relaxed">
      {blocks.map((blockContent, blockIdx) => {
        if (blockIdx % 2 === 1) {
          // This is a block math segment
          return <MathRenderer key={blockIdx} math={blockContent} block />;
        }

        // This is a text segment, which may contain inline math ($).
        // Use a Fragment (not <p>) so we never nest a <p> inside another <p>
        // (which produces invalid HTML / hydration errors and breaks rendering).
        const inlines = blockContent.split('$');
        return (
          <React.Fragment key={blockIdx}>
            {inlines.map((inlineContent, inlineIdx) => {
              if (inlineIdx % 2 === 1) {
                // This is an inline math segment
                return <MathRenderer key={inlineIdx} math={inlineContent} />;
              }
              // Regular text parsed for bold/italic formatting
              return (
                <React.Fragment key={inlineIdx}>
                  {renderFormattedText(inlineContent)}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MathRenderer;
