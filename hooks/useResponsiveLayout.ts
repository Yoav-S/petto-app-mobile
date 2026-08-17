import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  LayoutBreakpoint,
  MIN_SUPPORTED_WIDTH,
  PAGE_HORIZONTAL_PADDING,
} from '@/constants/layout';

export type ResponsiveLayout = {
  width: number;
  height: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
  /** Fluid content width: screen minus fixed horizontal page padding. */
  contentWidth: number;
  pagePadding: typeof PAGE_HORIZONTAL_PADDING;
  isCompact: boolean;
  isBaseOrLarger: boolean;
  isLarge: boolean;
  isExtraLarge: boolean;
};

/**
 * Shared responsive layout values for Ragly.
 * Fixed typography/spacing — fluid containers only. No global scale factor.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.max(0, width - PAGE_HORIZONTAL_PADDING * 2);

    return {
      width,
      height,
      insets,
      contentWidth,
      pagePadding: PAGE_HORIZONTAL_PADDING,
      isCompact: width <= LayoutBreakpoint.compact,
      isBaseOrLarger: width >= LayoutBreakpoint.base,
      isLarge: width >= LayoutBreakpoint.large,
      isExtraLarge: width >= LayoutBreakpoint.xl,
    };
  }, [height, insets, width]);
}

export { DESIGN_WIDTH, DESIGN_HEIGHT, MIN_SUPPORTED_WIDTH, PAGE_HORIZONTAL_PADDING };
