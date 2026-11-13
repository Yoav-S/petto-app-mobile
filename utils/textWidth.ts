/** Approximate rendered width for Rubik — prefer real onTextLayout when available. */
export function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    if (char === ' ' || char === '\n') width += fontSize * 0.28;
    else if (char === '\u2060') continue;
    else if (/[iIlj.,:;!'|´`|]/.test(char)) width += fontSize * 0.32;
    else if (/[WwMm@%]/.test(char)) width += fontSize * 0.72;
    else if (/[\u0400-\u04FF]/.test(char)) width += fontSize * 0.58;
    else if (/[\u0590-\u05FF]/.test(char)) width += fontSize * 0.52;
    else width += fontSize * 0.54;
  }
  return width;
}

/** Break after the largest prefix that still fits. Never splits a word. */
export function wrapTextAtWords(
  text: string,
  boxWidth: number,
  fontSize: number,
): string | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let breakAt = 1;
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(' ');
    if (estimateTextWidth(first, fontSize) <= boxWidth) breakAt = index;
    else break;
  }
  const first = words.slice(0, breakAt).join(' ');
  const second = words.slice(breakAt).join(' ');
  return `${first}\n${second}`;
}

export type CategoryTileLabelLayout = {
  display: string;
  fontSize: number;
  lines: 1 | 2;
};

/**
 * Home category tile copy:
 * - 1 word → one line (shrink if needed)
 * - 2 words → one line when it fits, else word1 / word2
 * - 3+ words → first word on top, remaining words on the bottom (never 2+1)
 */
export function layoutCategoryTileLabel(
  text: string,
  boxWidth: number,
  maxFontSize: number,
  minFontSize = 12,
): CategoryTileLabelLayout {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0 || boxWidth <= 0) {
    return { display: '', fontSize: maxFontSize, lines: 1 };
  }

  const shrinkToFit = (lines: string[], startSize: number): number => {
    let size = startSize;
    while (size > minFontSize) {
      const overflow = lines.some((line) => estimateTextWidth(line, size) > boxWidth);
      if (!overflow) break;
      size -= 1;
    }
    return size;
  };

  if (words.length === 1) {
    const display = words[0];
    return {
      display,
      fontSize: shrinkToFit([display], maxFontSize),
      lines: 1,
    };
  }

  if (words.length === 2) {
    const oneLine = `${words[0]} ${words[1]}`;
    if (estimateTextWidth(oneLine, maxFontSize) <= boxWidth) {
      return { display: oneLine, fontSize: maxFontSize, lines: 1 };
    }
    const display = `${words[0]}\n${words[1]}`;
    return {
      display,
      fontSize: shrinkToFit([words[0], words[1]], maxFontSize),
      lines: 2,
    };
  }

  // 3+ words: always first on top, rest on bottom.
  const top = words[0];
  const bottom = words.slice(1).join(' ');
  return {
    display: `${top}\n${bottom}`,
    fontSize: shrinkToFit([top, bottom], maxFontSize),
    lines: 2,
  };
}
