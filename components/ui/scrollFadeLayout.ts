import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import {
  SCROLL_BOTTOM_FADE_GRADIENT,
  SCROLL_BOTTOM_FADE_SOLID_AT,
  SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT,
  SCROLL_DOCUMENT_TOP_FADE_GRADIENT,
  SCROLL_LIST_BOTTOM_FADE_GRADIENT,
  SCROLL_LIST_TOP_FADE_GRADIENT,
  structuralScale,
} from '@/constants/layout';

/** Small breathing room below the last row at the design frame (scaled per device). */
const LIST_BOTTOM_BREATH_DESIGN = 12;

export interface ListFadeHeights {
  topFadeHeight: number;
  bottomFadeHeight: number;
}

export function getListFadeHeights(
  width: number,
  height: number,
  document = false,
): ListFadeHeights {
  const scale = structuralScale(width, height);
  if (document) {
    return {
      topFadeHeight: Math.round(SCROLL_DOCUMENT_TOP_FADE_GRADIENT * scale),
      bottomFadeHeight: Math.round(SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT * scale),
    };
  }
  return {
    topFadeHeight: Math.round(SCROLL_LIST_TOP_FADE_GRADIENT * scale),
    bottomFadeHeight: Math.round(SCROLL_LIST_BOTTOM_FADE_GRADIENT * scale),
  };
}

/** FAB footprint above the screen bottom (home inset handled by the bottom fade strip). */
export function getFabScrollPadding(width: number, height: number): number {
  const scale = structuralScale(width, height);
  return Math.round(ADD_FAB.bottom * scale + ADD_FAB.size * scale + 8);
}

/**
 * Bottom scroll padding: clear the opaque fade tail + home indicator + small breath.
 * Fade and FAB zones overlap — use the larger requirement, not the sum.
 */
export function getListScrollBottomPadding(
  bottomFadeHeight: number,
  bottomInset: number,
  fabPadding: number,
  width: number,
  height: number,
): number {
  const scale = structuralScale(width, height);
  const breath = Math.round(LIST_BOTTOM_BREATH_DESIGN * scale);
  /** Deeper bands are visual only — clearance stays on the base gradient. */
  const clearanceBand = Math.min(
    bottomFadeHeight,
    Math.round(SCROLL_BOTTOM_FADE_GRADIENT * scale),
  );
  const fadeClearance =
    bottomInset + Math.round(clearanceBand * SCROLL_BOTTOM_FADE_SOLID_AT) + breath;

  if (fabPadding <= 0) return fadeClearance;
  return Math.max(fadeClearance, fabPadding);
}

export function useListScrollFadeLayout(document = false) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const fades = getListFadeHeights(width, height, document);
    const fabPadding = getFabScrollPadding(width, height);
    return {
      ...fades,
      bottomInset: insets.bottom,
      fabPadding,
      bottomPadding: (fabOverlay: boolean) =>
        getListScrollBottomPadding(
          fades.bottomFadeHeight,
          insets.bottom,
          fabOverlay ? fabPadding : 0,
          width,
          height,
        ),
    };
  }, [width, height, insets.bottom, document]);
}
