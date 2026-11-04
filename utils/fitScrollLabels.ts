/**
 * One shared type size for a horizontal row of tiles.
 * Shrink the font so the longest label stays on one line near the Figma
 * source width. Only grow the tile after the font already hit the floor.
 */
export function fitScrollLabels({
  naturalMaxWidth,
  sourceItemWidth,
  horizontalPad,
  baseFont,
  baseLine,
  minFont,
  stretch = true,
}: {
  naturalMaxWidth: number;
  sourceItemWidth: number;
  horizontalPad: number;
  baseFont: number;
  baseLine: number;
  minFont: number;
  stretch?: boolean;
}): { fontSize: number; lineHeight: number; itemWidth: number } {
  const sourceContent = Math.max(1, sourceItemWidth - horizontalPad);
  if (naturalMaxWidth <= 0 || naturalMaxWidth <= sourceContent) {
    return {
      fontSize: baseFont,
      lineHeight: baseLine,
      itemWidth: sourceItemWidth,
    };
  }

  const fontSize = Math.max(
    minFont,
    Math.round(baseFont * (sourceContent / naturalMaxWidth) * 10) / 10,
  );
  const lineHeight = Math.min(
    baseLine,
    Math.max(fontSize + 2, Math.round(baseLine * (fontSize / baseFont))),
  );
  const fittedContent = naturalMaxWidth * (fontSize / baseFont);
  const itemWidth = stretch
    ? Math.max(sourceItemWidth, Math.ceil(fittedContent + horizontalPad))
    : sourceItemWidth;

  return { fontSize, lineHeight, itemWidth };
}
