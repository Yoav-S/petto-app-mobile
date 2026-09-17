import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FOOTER_FADE_SOLID_AT,
  LIST_BOTTOM_FADE_SOLID_TAIL,
  LIST_TOP_FADE_SOLID_STRIP,
  SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT,
  SCROLL_DOCUMENT_TOP_FADE_GRADIENT,
  SCROLL_LIST_BOTTOM_FADE_GRADIENT,
  SCROLL_LIST_TOP_FADE_GRADIENT,
  listBottomFadeSolidAt,
  structuralScale,
  topFadeSolidAt,
} from '@/constants/layout';

export interface ListFadeHeights {
  topFadeHeight: number;
  bottomFadeHeight: number;
  /** Where the bottom gradient finishes — the rest of the band is solid. */
  bottomSolidAt: number;
  /** Height of that solid tail, i.e. what scroll padding has to clear. */
  bottomSolidTail: number;
  /** Where the top gradient starts — above it the band seams into the chrome. */
  topSolidAt?: number;
}

export function getListFadeHeights(
  width: number,
  height: number,
  document = false,
): ListFadeHeights {
  const scale = structuralScale(width, height);
  if (document) {
    return {
      /** Same 122pt Figma band at both edges of the document scroll. */
      topFadeHeight: SCROLL_DOCUMENT_TOP_FADE_GRADIENT,
      bottomFadeHeight: SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT,
      bottomSolidAt: FOOTER_FADE_SOLID_AT,
      bottomSolidTail: Math.round(
        SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT * (1 - FOOTER_FADE_SOLID_AT),
      ),
      /**
       * Opaque only in the small gap under the header. The rest of the 122pt
       * band is a dissolve, so the first line stays readable at rest.
       */
      topSolidAt: topFadeSolidAt(
        SCROLL_DOCUMENT_TOP_FADE_GRADIENT,
        LIST_TOP_FADE_SOLID_STRIP,
      ),
    };
  }
  const bottomFadeHeight = Math.round(SCROLL_LIST_BOTTOM_FADE_GRADIENT * scale);
  return {
    /** Unscaled: the first row's offset is measured off this exact height. */
    topFadeHeight: SCROLL_LIST_TOP_FADE_GRADIENT,
    bottomFadeHeight,
    bottomSolidAt: listBottomFadeSolidAt(bottomFadeHeight),
    bottomSolidTail: Math.min(LIST_BOTTOM_FADE_SOLID_TAIL, bottomFadeHeight),
    topSolidAt: topFadeSolidAt(
      SCROLL_LIST_TOP_FADE_GRADIENT,
      LIST_TOP_FADE_SOLID_STRIP,
    ),
  };
}

/**
 * Bottom scroll padding. Lists run to the home indicator — the fade overlay
 * sits on top of the last rows instead of reserving a dead strip under them.
 */
export function getListScrollBottomPadding(
  bottomSolidTail: number,
  bottomInset: number,
  width: number,
  height: number,
  document = false,
): number {
  if (!document) return bottomInset;
  /** Last line clears the opaque tail; the viewport itself already runs to the screen edge. */
  return bottomInset + bottomSolidTail;
}

export function useListScrollFadeLayout(document = false) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const fades = getListFadeHeights(width, height, document);
    return {
      ...fades,
      bottomInset: insets.bottom,
      bottomPadding: () =>
        getListScrollBottomPadding(
          fades.bottomSolidTail,
          insets.bottom,
          width,
          height,
          document,
        ),
    };
  }, [width, height, insets.bottom, document]);
}
