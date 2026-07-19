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
              // Regular text
              return <span key={inlineIdx}>{inlineContent}</span>;
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MathRenderer;
