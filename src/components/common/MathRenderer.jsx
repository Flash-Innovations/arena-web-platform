import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Minifies generated HTML to prevent whitespace from creating awkward line breaks
 */
function minifyHtml(s) {
  if (!s) return '';
  return s.replace(/\r?\n\s*/g, ' ').replace(/>\s+</g, '><').trim();
}

/**
 * Parses markdown text with embedded LaTeX math:
 * - Block math: $$ ... $$ or \[ ... \]
 * - Inline math: $ ... $ or \( ... \)
 * - Inline code: ` ... `
 * - Bold / Italics
 */
export function renderMathAndMarkdown(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const tokens = [];
  const addToken = (html) => {
    tokens.push(html);
    return `___MATH_TOKEN_${tokens.length - 1}___`;
  };

  let text = rawText
    .replace(/\$\\text\{\\\$\}\$/g, '$')
    .replace(/\$\\\$\$/g, '$')
    .replace(/\\\$([0-9])/g, '$$$1');

  // 1. Block math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
      return addToken(
        minifyHtml(`<div class="my-3 overflow-x-auto text-center py-2 px-3 bg-zinc-950/80 border border-zinc-850 rounded-lg text-zinc-100">${rendered}</div>`)
      );
    } catch (e) {
      return match;
    }
  });

  // 2. Block math: \[ ... \]
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
      return addToken(
        minifyHtml(`<div class="my-3 overflow-x-auto text-center py-2 px-3 bg-zinc-950/80 border border-zinc-850 rounded-lg text-zinc-100">${rendered}</div>`)
      );
    } catch (e) {
      return match;
    }
  });

  // 3. Inline math: $ ... $
  text = text.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    // Skip if looks like a simple dollar price e.g. $100
    if (/^\s*[0-9]+(\.[0-9]{1,2})?\s*$/.test(formula)) {
      return match;
    }
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false
      });
      return addToken(
        minifyHtml(`<span class="inline-math px-0.5 text-zinc-100 font-sans">${rendered}</span>`)
      );
    } catch (e) {
      return match;
    }
  });

  // 4. Inline math: \( ... \)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false
      });
      return addToken(
        minifyHtml(`<span class="inline-math px-0.5 text-zinc-100 font-sans">${rendered}</span>`)
      );
    } catch (e) {
      return match;
    }
  });

  // 5. Inline code: ` ... `
  text = text.replace(/`([^`\n\r]+)`/g, (match, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return addToken(
      minifyHtml(`<code class="bg-zinc-850 text-amber-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-zinc-750">${escaped}</code>`)
    );
  });

  // 6. Basic formatting: bold, italic, line breaks
  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>')
    .replace(/\n\n/g, '<div class="h-2"></div>')
    .replace(/\n/g, '<br />');

  // Re-substitute tokens
  text = text.replace(/___MATH_TOKEN_(\d+)___/g, (match, idx) => {
    return tokens[Number(idx)] || '';
  });

  return text;
}

export function MathRenderer({ content, className = '' }) {
  const html = useMemo(() => renderMathAndMarkdown(content), [content]);

  return (
    <div
      className={`math-rendered-content text-xs leading-relaxed text-zinc-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathRenderer;
