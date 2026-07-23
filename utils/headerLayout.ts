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
 * Margin below a parent that already applies `insets.top` (SafeAreaView),
 * so the header row lands at Figma `top: 56` (or at the safe area if taller).
 *
 * screenY = insets.top + marginTop ≈ max(insets.top, 56 * sy)
 */
export function useHeaderTopMargin(): number {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return useMemo(() => {
    const sy = height / HEADER_LAYOUT.designHeight;
    return Math.max(0, HEADER_LAYOUT.top * sy - insets.top);
  }, [height, insets.top]);
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
      marginTop: Math.max(0, HEADER_LAYOUT.top * sy - insets.top),
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
