import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

/** Fluid content width with optional Figma max (default 335). */
export function fluidContentWidth(
  screenWidth: number,
  maxWidth = 335,
  horizontalPadding = PAGE_HORIZONTAL_PADDING,
): number {
  return Math.min(Math.max(0, screenWidth - horizontalPadding * 2), maxWidth);
}

/** @deprecated Responsive migration — always returns 1. Use fixed tokens + fluid widths. */
export function legacyScale(_width: number, _height?: number): number {
  return 1;
}
