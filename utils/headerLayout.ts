import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Figma 375×812 — status bar band ~44, header row starts at top: 56. */
export const HEADER_LAYOUT = {
  designWidth: 375,
  designHeight: 812,
  /** Distance from screen top to header row (includes status bar + small gap). */
  top: 56,
  height: 44,
  padH: 20,
  padV: 6,
} as const;

/**
 * Absolute padding from the physical top of the screen to the header row.
 * Matches Figma top: 56 (or the device safe-area if it's taller).
 *
 * The header owns this — parent screens must NOT also apply top safe-area padding.
 */
export function useHeaderTopPadding(): number {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return useMemo(() => {
    const sy = height / HEADER_LAYOUT.designHeight;
    return Math.max(insets.top, HEADER_LAYOUT.top * sy);
  }, [height, insets.top]);
}

/** @deprecated Use useHeaderTopPadding — same value, absolute from screen top. */
export function useHeaderTopMargin(): number {
  return useHeaderTopPadding();
}

export function useHeaderLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const sx = width / HEADER_LAYOUT.designWidth;
    const sy = height / HEADER_LAYOUT.designHeight;
    return {
      sx,
      sy,
      /** Absolute from screen top — do not stack under another top SafeArea. */
      paddingTop: Math.max(insets.top, HEADER_LAYOUT.top * sy),
      height: HEADER_LAYOUT.height * sy,
      paddingHorizontal: HEADER_LAYOUT.padH * sx,
      paddingVertical: HEADER_LAYOUT.padV * sy,
    };
  }, [width, height, insets.top]);
}

/** Offset from screen top to content below the header (Figma 56 + 44). */
export function getHeaderContentOffset(screenHeight: number): number {
  const sy = screenHeight / HEADER_LAYOUT.designHeight;
  return (HEADER_LAYOUT.top + HEADER_LAYOUT.height) * sy;
}
