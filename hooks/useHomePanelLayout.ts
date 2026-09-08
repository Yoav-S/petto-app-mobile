import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import {
  DESIGN_COVER_HEIGHT,
  DESIGN_HOME_HALF_CARD_HEIGHT,
  DESIGN_HOME_HEALTH_CARD_HEIGHT,
  DESIGN_PANEL_TOP,
} from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const NAME_CLIP_PAD_TOP = 16;
const NAME_BLOCK_MIN = 72;
/** Space between breed/age and the vaccine/reminder cards. */
export const HOME_CARDS_GAP_AFTER_NAME = 16;
const CARD_ROW_GAP = 8;
const FAB_ABOVE_GAP = 12;

/**
 * Home panel metrics: cards sit under the name (not the screen bottom),
 * and enough room is reserved under Topics for the FAB so it does not
 * sit on that card.
 */
export function useHomePanelLayout() {
  const insets = useSafeAreaInsets();
  const { height, structuralScale: s } = useResponsiveLayout();

  return useMemo(() => {
    const coverHeight = Math.round(DESIGN_COVER_HEIGHT * s);
    const panelOverlap = Math.round((DESIGN_COVER_HEIGHT - DESIGN_PANEL_TOP) * s);
    const panelHeight = height - (coverHeight - panelOverlap);
    const nameBlock = NAME_CLIP_PAD_TOP + NAME_BLOCK_MIN;
    const fabBottom = Math.max(Math.round(ADD_FAB.bottom * s), 16 + insets.bottom);
    const fabClearance = Math.round(ADD_FAB.size * s) + fabBottom + FAB_ABOVE_GAP;

    const spaceForCards = panelHeight - nameBlock - HOME_CARDS_GAP_AFTER_NAME - fabClearance;
    const naturalHalf = Math.round(DESIGN_HOME_HALF_CARD_HEIGHT * s);
    const naturalHealth = Math.round(DESIGN_HOME_HEALTH_CARD_HEIGHT * s);
    const naturalTotal = naturalHalf + CARD_ROW_GAP + naturalHealth;
    const pack = spaceForCards > 0 ? Math.min(1, spaceForCards / naturalTotal) : 1;

    const healthCardHeight = Math.round(naturalHealth * pack);

    return {
      gapAfterName: HOME_CARDS_GAP_AFTER_NAME,
      cardsBottomInset: fabClearance,
      halfCardHeight: Math.round(naturalHalf * pack),
      healthCardHeight,
      healthRowHeight: Math.round(
        healthCardHeight * (80 / DESIGN_HOME_HEALTH_CARD_HEIGHT),
      ),
    };
  }, [height, insets.bottom, s]);
}
