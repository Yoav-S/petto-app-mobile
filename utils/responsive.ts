import { PAGE_HORIZONTAL_PADDING, PHONE_CONTENT_MAX_WIDTH } from '@/constants/layout';

/**
 * Fluid content width: screen minus fixed page padding.
 * No 335pt phone cap — that left empty gutters on larger iPhones.
 */
export function fluidContentWidth(
  screenWidth: number,
  maxWidth = PHONE_CONTENT_MAX_WIDTH,
  horizontalPadding = PAGE_HORIZONTAL_PADDING,
): number {
  const inner = Math.max(0, screenWidth - horizontalPadding * 2);
  return maxWidth == null ? inner : Math.min(inner, maxWidth);
}

/** @deprecated Always returns 1. Typography stays at design tokens. */
export function legacyScale(_width: number, _height?: number): number {
  return 1;
}
