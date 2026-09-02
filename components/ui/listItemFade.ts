interface RowFadeParams {
  /** Row bottom measured from the top of the first row (excludes scroll padding). */
  rowBottom: number;
  /** Scroll paddingTop — the offset the floating chrome pushes rows down by. */
  contentTop: number;
  scrollY: number;
  /** Viewport y where content starts being covered (top of the bottom fade band). */
  fadeLine: number;
  /** Distance over which the row goes from visible to fully faded. */
  fadeZone: number;
}

/** 0 (visible) → 1 (faded) as a row crosses the bottom edge of its scroll viewport. */
export function rowFadeIntensity({
  rowBottom,
  contentTop,
  scrollY,
  fadeLine,
  fadeZone,
}: RowFadeParams): number {
  if (fadeLine <= 0 || fadeZone <= 0) return 0;
  const pastFadeLine = contentTop + rowBottom - scrollY - fadeLine;
  if (pastFadeLine <= 0) return 0;
  return Math.min(1, pastFadeLine / fadeZone);
}
