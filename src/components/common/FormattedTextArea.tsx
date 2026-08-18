'use client';
import React, { useRef } from 'react';
import { renderMiniMarkdown } from '@/lib/utils/miniMarkdown';

interface FormattedTextAreaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

const LINE_PREFIX_RE = /^([-•]\s+|\d+[.)]\s+)/;

function getLineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEnd };
}

/** A plain textarea with a small toolbar that inserts a lightweight,
 *  safe-by-construction markdown-like syntax (**bold**, "- " bullets,
 *  "1. " numbers) — rendered via renderMiniMarkdown wherever minutes are
 *  displayed. No raw HTML is ever produced, so nothing here needs
 *  sanitizing on write or on read. */
const FormattedTextArea: React.FC<FormattedTextAreaProps> = ({
  id, value, onChange, placeholder, required, disabled, minHeight = 'min-h-[100px]', className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyChange = (newValue: string, selStart: number, selEnd: number) => {
    onChange(newValue);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      }
    });
  };

  const handleBold = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);
    if (selected) {
      const newValue = value.slice(0, start) + `**${selected}**` + value.slice(end);
      applyChange(newValue, start + 2, end + 2);
    } else {
      const newValue = value.slice(0, start) + '****' + value.slice(end);
      applyChange(newValue, start + 2, start + 2);
    }
  };

  const applyLinePrefixes = (getPrefix: (lineIndex: number) => string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const { lineStart, lineEnd } = getLineBounds(value, start, end);
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const newBlock = lines.map((line, i) => `${getPrefix(i)}${line.replace(LINE_PREFIX_RE, '')}`).join('\n');
    const newValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
    applyChange(newValue, lineStart + newBlock.length, lineStart + newBlock.length);
  };

  const handleBulletList = () => applyLinePrefixes(() => '- ');
  const handleNumberedList = () => applyLinePrefixes((i) => `${i + 1}. `);

  const toolbarBtn = 'px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={handleBold} disabled={disabled} title="Bold selected text">
          <span className="font-bold">B</span>
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={handleBulletList} disabled={disabled} title="Bullet list">
          • List
        </button>
        <button type="button" className={toolbarBtn} onMouseDown={e => e.preventDefault()} onClick={handleNumberedList} disabled={disabled} title="Numbered list">
          1. List
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        className={`w-full border border-[#e5eaf1] rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77] resize-vertical ${minHeight} ${className}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {!!value?.trim() && (
        <div className="mt-2 border border-gray-100 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Preview</p>
          {renderMiniMarkdown(value)}
        </div>
      )}
    </div>
  );
};

export default FormattedTextArea;
