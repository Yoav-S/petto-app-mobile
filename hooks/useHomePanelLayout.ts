import { useMemo } from 'react';
import {
  DESIGN_HOME_HALF_CARD_HEIGHT,
  DESIGN_HOME_HEALTH_CARD_HEIGHT,
} from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/** Space between breed/age and the vaccine/reminder cards. */
export const HOME_CARDS_GAP_AFTER_NAME = 16;

/**
 * Home panel metrics. Card heights stay at the design size so vaccine,
 * reminder, and topics details are never clipped. Extra space in the panel
 * sits under Topics for the FAB (cards are top-aligned).
 */
export function useHomePanelLayout() {
  const { structuralScale: s } = useResponsiveLayout();

  return useMemo(() => {
    const halfCardHeight = Math.round(DESIGN_HOME_HALF_CARD_HEIGHT * s);
    const healthCardHeight = Math.round(DESIGN_HOME_HEALTH_CARD_HEIGHT * s);

    return {
      gapAfterName: HOME_CARDS_GAP_AFTER_NAME,
      cardsBottomInset: 0,
      halfCardHeight,
      healthCardHeight,
      healthRowHeight: Math.round(80 * s),
    };
  }, [s]);
}
