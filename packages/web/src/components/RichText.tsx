import { useMemo } from 'react';
import type { ContentBlock } from '@ltvquiz/shared';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.mjs';
import { normalizeScientificText } from './editor/scientificHelper';

interface RichTextProps {
  content: string;
  className?: string;
}

const AZOTA_STYLE_TAGS: Array<{ tag: string; open: string; close: string }> = [
  { tag: 'b', open: '<strong class="font-bold">', close: '</strong>' },
  { tag: 'i', open: '<em class="italic">', close: '</em>' },
  { tag: 'u', open: '<u class="underline decoration-1 underline-offset-2">', close: '</u>' },
  { tag: 'red', open: '<span class="text-rose-600 dark:text-rose-400 font-semibold">', close: '</span>' },
  { tag: 'blue', open: '<span class="text-blue-600 dark:text-blue-400 font-semibold">', close: '</span>' },
];

export function renderRichTextToHtml(content: string): string {
  if (!content) return '';

  // 1. Extract markdown images before math/escaping steps so data URIs or alt text aren't mangled
  const imageTokens: string[] = [];
  let rendered = content.replace(
    /!\[((?:\\[\s\S]|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, alt, rawSrc) => {
      const src = String(rawSrc).startsWith('data:image/')
        ? String(rawSrc).replace(/\\([+_\/\-=])/g, '$1')
        : String(rawSrc);
      const safeAlt = String(alt || 'image').replace(/"/g, '&quot;');
      const idx = imageTokens.length;
      imageTokens.push(
        `<img src="${src}" alt="${safeAlt}" class="inline-block align-middle max-w-full h-auto rounded-md my-1 object-contain" style="max-height: 400px;" />`,
      );
      return `@@RICHTEXTIMG${idx}@@`;
    },
  );

  // 2. Normalize standalone chemical equations \ce{...}
  rendered = normalizeScientificText(rendered);

  // 3. Clean residual docx/parser tags while keeping LaTeX \[...\] / \(...\) delimiters intact
  rendered = rendered.replace(/\\?\[\/?BOLD\\?\]/gi, '');
  rendered = rendered.replace(/\\?\[\/?(?:RED|UNDERLINE)\\?\]/gi, '');
  rendered = rendered.replace(/\\([._])/g, '$1');

  // 4. Azota formatting tags: match paired [!tag:$...$] first so inner $ and [0; 1] stay intact
  for (const { tag, open, close } of AZOTA_STYLE_TAGS) {
    const dollarWrapped = new RegExp(`\\[!${tag}:\\$([\\s\\S]*?)\\$\\]`, 'gi');
    const plainWrapped = new RegExp(`\\[!${tag}:((?:[^\\[\\]]|\\[[^\\]]*\\])*)\\]`, 'gi');
    rendered = rendered.replace(dollarWrapped, `${open}$1${close}`);
    rendered = rendered.replace(plainWrapped, `${open}$1${close}`);
  }

  // Markdown bold **text**
  rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

  // 5. Render Block math $$...$$ or \[...\] and Inline math $...$ or \(...\) into tokens
  const mathTokens: string[] = [];
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (match, math1, math2) => {
    const math = math1 || math2;
    try {
      const html = katex.renderToString(math, { displayMode: true, throwOnError: false, strict: false });
      const idx = mathTokens.length;
      mathTokens.push(html);
      return `@@RICHTEXTMATH${idx}@@`;
    } catch {
      return match;
    }
  });

  rendered = rendered.replace(/\$([^\n\$]+?)\$|\\\(([\s\S]+?)\\\)/g, (match, math1, math2) => {
    const math = math1 || math2;
    try {
      const html = katex.renderToString(math, { displayMode: false, throwOnError: false, strict: false });
      const idx = mathTokens.length;
      mathTokens.push(html);
      return `@@RICHTEXTMATH${idx}@@`;
    } catch {
      return match;
    }
  });

  // 6. Escape stray comparison '<' (e.g., "x < 5") without disturbing allowed HTML tags
  rendered = rendered.replace(/<(?!(?:\/?(?:strong|em|u|sub|sup|b|i|span|br|img)\b))/gi, '&lt;');

  // 7. Restore math & image tokens
  rendered = rendered.replace(/@@RICHTEXTMATH(\d+)@@/g, (_m, i) => mathTokens[Number(i)] || '');
  rendered = rendered.replace(/@@RICHTEXTIMG(\d+)@@/g, (_m, i) => imageTokens[Number(i)] || '');

  return rendered;
}

export function RichText({ content, className = '' }: RichTextProps) {
  const html = useMemo(() => renderRichTextToHtml(content), [content]);

  return (
    <div 
      className={`rich-text whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function RichContent({ content }: { content: ContentBlock[] | string }) {
  if (typeof content === 'string') {
    return <RichText content={content} />;
  }

  return content.map((block, index) =>
    block.type === 'image' ? (
      <img
        key={index}
        src={block.content}
        alt={block.alt || 'Minh họa'}
        className="my-1 max-h-40 max-w-full rounded-md object-contain"
      />
    ) : (
      <RichText key={index} content={block.content} />
    ),
  );
}
