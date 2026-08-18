import React from 'react';

const BULLET_RE = /^[-•]\s+(.*)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/;

/** Splits a single line on **bold** markers into text/<strong> nodes.
 *  Only ever emits the original text content wrapped in elements — never
 *  HTML — so it can't inject markup even if the source text contains
 *  literal angle brackets or other HTML-looking characters. */
function renderInlineBold(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    return match
      ? <strong key={`${keyPrefix}-b${i}`}>{match[1]}</strong>
      : <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>;
  });
}

/** Renders a small, safe-by-construction "mini markdown" subset used for
 *  meeting minutes: **bold**, "- "/"• " bullet lines, and "1. " numbered
 *  lines. Deliberately not a full markdown parser and never uses
 *  dangerouslySetInnerHTML — keep it that way; anything richer needs a real
 *  sanitizer on both write and read paths. */
export function renderMiniMarkdown(text: string | undefined | null): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const bulletMatch = lines[i].match(BULLET_RE);
    const numberedMatch = !bulletMatch ? lines[i].match(NUMBERED_RE) : null;

    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(BULLET_RE);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const groupKey = key++;
      blocks.push(
        <ul key={`ul-${groupKey}`} className="list-disc pl-5 space-y-0.5">
          {items.map((item, idx) => <li key={idx}>{renderInlineBold(item, `ul-${groupKey}-${idx}`)}</li>)}
        </ul>
      );
      continue;
    }

    if (numberedMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(NUMBERED_RE);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const groupKey = key++;
      blocks.push(
        <ol key={`ol-${groupKey}`} className="list-decimal pl-5 space-y-0.5">
          {items.map((item, idx) => <li key={idx}>{renderInlineBold(item, `ol-${groupKey}-${idx}`)}</li>)}
        </ol>
      );
      continue;
    }

    if (lines[i].trim() === '') {
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
    } else {
      blocks.push(<p key={`p-${key++}`}>{renderInlineBold(lines[i], `p-${key}`)}</p>);
    }
    i++;
  }

  return <>{blocks}</>;
}
