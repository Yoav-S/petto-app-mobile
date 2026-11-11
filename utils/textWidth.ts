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
