import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_BELOW_SAFE_AREA, HEADER_LAYOUT } from '@/constants/layout';

/**
 * Absolute padding from the physical top of the screen to the header row.
 * Fixed Figma metrics + safe area — no width/height scaling.
 *
 * Parent screens must NOT also apply top safe-area padding when using ScreenHeader.
 */
export function useHeaderTopPadding(): number {
  const insets = useSafeAreaInsets();
  return useMemo(
    () =>
      Math.max(
        insets.top + HEADER_BELOW_SAFE_AREA,
        HEADER_LAYOUT.topFromScreen,
      ),
    [insets.top],
  );
}

/** @deprecated Use useHeaderTopPadding — same value, absolute from screen top. */
export function useHeaderTopMargin(): number {
  return useHeaderTopPadding();
}

export function useHeaderLayout() {
  const paddingTop = useHeaderTopPadding();

  return useMemo(
    () => ({
      paddingTop,
      height: HEADER_LAYOUT.height,
      paddingHorizontal: HEADER_LAYOUT.paddingHorizontal,
      paddingVertical: HEADER_LAYOUT.paddingVertical,
      /** Y offset for content below the header row. */
      contentTop: paddingTop + HEADER_LAYOUT.height,
    }),
    [paddingTop],
  );
}

/** Offset from screen top to content below the header (fixed band, no scaling). */
export function getHeaderContentOffset(_screenHeight?: number): number {
  return HEADER_LAYOUT.topFromScreen + HEADER_LAYOUT.height;
}
