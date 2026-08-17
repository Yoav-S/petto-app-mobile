import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  LayoutBreakpoint,
  MIN_SUPPORTED_WIDTH,
  PAGE_HORIZONTAL_PADDING,
  PHONE_CONTENT_MAX_WIDTH,
  structuralScale as computeStructuralScale,
} from '@/constants/layout';
import { fluidContentWidth } from '@/utils/responsive';

export type ResponsiveLayout = {
  width: number;
  height: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
  /** Fluid content width: screen minus 16px padding, capped only at tablet widths. */
  contentWidth: number;
  pagePadding: typeof PAGE_HORIZONTAL_PADDING;
  /** Structural chrome scale (cover, card heights, FAB). Not for type. */
  structuralScale: number;
  isCompact: boolean;
  isBaseOrLarger: boolean;
  isLarge: boolean;
  isExtraLarge: boolean;
};

/**
 * Shared responsive layout values for Ragly.
 * Fixed typography/spacing. Fluid containers. Bounded structural scale for chrome.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = fluidContentWidth(width, PHONE_CONTENT_MAX_WIDTH);

    return {
      width,
      height,
      insets,
      contentWidth,
      pagePadding: PAGE_HORIZONTAL_PADDING,
      structuralScale: computeStructuralScale(width, height),
      isCompact: width <= LayoutBreakpoint.compact,
      isBaseOrLarger: width >= LayoutBreakpoint.base,
      isLarge: width >= LayoutBreakpoint.large,
      isExtraLarge: width >= LayoutBreakpoint.xl,
    };
  }, [height, insets, width]);
}

export { DESIGN_WIDTH, DESIGN_HEIGHT, MIN_SUPPORTED_WIDTH, PAGE_HORIZONTAL_PADDING };
