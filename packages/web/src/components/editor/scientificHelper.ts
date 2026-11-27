export type InsertResult = {
  text: string;
  cursorIndex: number;
};

export type CatalystOptions = {
  type: 'single' | 'reversible';
  reactants?: string;
  products?: string;
  conditionTop?: string;
  conditionBottom?: string;
  format?: 'latex' | 'mhchem';
};

export function insertSnippetAtCursor(
  originalText: string,
  selectionStart: number,
  selectionEnd: number,
  snippet: string,
  cursorPlaceholder: string = '|'
): InsertResult {
  const safeStart = Math.max(0, Math.min(selectionStart, originalText.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, originalText.length));
  const selectedText = originalText.slice(safeStart, safeEnd);

  const before = originalText.slice(0, safeStart);
  const after = originalText.slice(safeEnd);

  let insertedText: string;
  let cursorOffset: number;

  const placeholderIndex = snippet.indexOf(cursorPlaceholder);
  if (placeholderIndex !== -1) {
    if (selectedText.length > 0) {
      insertedText = snippet.replace(cursorPlaceholder, selectedText);
      cursorOffset = placeholderIndex + selectedText.length;
    } else {
      insertedText = snippet.slice(0, placeholderIndex) + snippet.slice(placeholderIndex + cursorPlaceholder.length);
      cursorOffset = placeholderIndex;
    }
  } else {
    insertedText = snippet;
    cursorOffset = snippet.length;
  }

  const text = before + insertedText + after;
  const cursorIndex = before.length + cursorOffset;

  return { text, cursorIndex };
}

/** Wrap non-ASCII condition labels (e.g. Vietnamese catalyst notes) in `\text{...}` for KaTeX/mhchem font safety. */
function formatMhchemCondition(cond: string): string {
  if (!cond || cond.includes('\\text{')) return cond;
  return /[^\x00-\x7F]/.test(cond) ? `\\text{${cond}}` : cond;
}

export function buildCatalystEquation(options: CatalystOptions): string {
  const {
    type,
    reactants = '',
    products = '',
    conditionTop = '',
    conditionBottom = '',
    format = 'mhchem'
  } = options;

  const top = conditionTop.trim();
  const bottom = conditionBottom.trim();
  const r = reactants.trim();
  const p = products.trim();

  if (format === 'mhchem') {
    const arrowSymbol = type === 'reversible' ? '<=>' : '->';
    const formattedTop = formatMhchemCondition(top);
    const formattedBottom = formatMhchemCondition(bottom);
    let arrow = arrowSymbol;
    if (formattedTop && formattedBottom) {
      arrow = `${arrowSymbol}[${formattedTop}][${formattedBottom}]`;
    } else if (formattedTop) {
      arrow = `${arrowSymbol}[${formattedTop}]`;
    } else if (formattedBottom) {
      arrow = `${arrowSymbol}[][${formattedBottom}]`;
    }

    const core = [r, arrow, p].filter(Boolean).join(' ');
    return `\\ce{${core}}`;
  }

  let arrowLatex: string;
  if (type === 'reversible') {
    if (top || bottom) {
      const topPart = top ? `{${top}}` : '{}';
      const bottomPart = bottom ? `[\\text{${bottom}}]` : '';
      arrowLatex = `\\xrightleftharpoons${bottomPart}${topPart}`;
    } else {
      arrowLatex = '\\rightleftharpoons';
    }
  } else {
    if (top || bottom) {
      const topPart = top ? `{${top}}` : '{}';
      const bottomPart = bottom ? `[\\text{${bottom}}]` : '';
      arrowLatex = `\\xrightarrow${bottomPart}${topPart}`;
    } else {
      arrowLatex = '\\rightarrow';
    }
  }

  return [r, arrowLatex, p].filter(Boolean).join(' ');
}

export function normalizeScientificText(text: string): string {
  if (!text || !text.includes('\\ce{')) return text;

  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    if (text.startsWith('\\ce{', i)) {
      const isPrecededByDollar = i > 0 && text[i - 1] === '$';

      let depth = 0;
      let j = i + 3;
      let foundEnd = -1;
      while (j < len) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') {
          depth--;
          if (depth === 0) {
            foundEnd = j;
            break;
          }
        }
        j++;
      }

      if (foundEnd !== -1) {
        const isFollowedByDollar = foundEnd + 1 < len && text[foundEnd + 1] === '$';
        const ceBlock = text.slice(i, foundEnd + 1);

        if (!isPrecededByDollar && !isFollowedByDollar) {
          result += `$${ceBlock}$`;
        } else {
          result += ceBlock;
        }
        i = foundEnd + 1;
        continue;
      }
    }

    result += text[i];
    i++;
  }

  return result;
}

