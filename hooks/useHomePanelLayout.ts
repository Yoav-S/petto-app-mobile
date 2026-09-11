import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import {
  DESIGN_FAB_TOPICS_OVERLAP,
  DESIGN_HOME_HALF_CARD_HEIGHT,
  DESIGN_HOME_HEALTH_CARD_HEIGHT,
} from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/** Space between breed/age and the vaccine/reminder cards. */
export const HOME_CARDS_GAP_AFTER_NAME = 16;

/** Flex weights so vaccines/reminders and topics shrink/grow together. */
export const HOME_HALF_ROW_FLEX = DESIGN_HOME_HALF_CARD_HEIGHT;
export const HOME_TOPICS_ROW_FLEX = DESIGN_HOME_HEALTH_CARD_HEIGHT;

/**
 * Figma 375×812: FAB right-aligned with Topics, Topics covering the top
 * 25% (14px) of the 56px button. Cards share leftover space equally.
 */
export function useHomePanelLayout() {
  const insets = useSafeAreaInsets();
  const { structuralScale: s } = useResponsiveLayout();

  return useMemo(() => {
    const fabSize = Math.round(ADD_FAB.size * s);
    const fabBottom = Math.max(Math.round(ADD_FAB.bottom * s), 16 + insets.bottom);
    const overlap = Math.round(fabSize * (DESIGN_FAB_TOPICS_OVERLAP / ADD_FAB.size));
    // Line 2 stops ~8px before the FAB (FAB is 56px, card padding 16).
    const secondLineInset = Math.max(8, fabSize - 16 + 8);

    return {
      gapAfterName: HOME_CARDS_GAP_AFTER_NAME,
      cardsBottomInset: fabBottom + fabSize - overlap,
      secondLineInset,
    };
  }, [insets.bottom, s]);
}
