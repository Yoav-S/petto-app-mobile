import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import {
  DESIGN_HOME_HALF_CARD_HEIGHT,
  DESIGN_HOME_HEALTH_CARD_HEIGHT,
  PAGE_HORIZONTAL_PADDING,
} from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/** Space between breed/age and the vaccine/reminder cards. */
export const HOME_CARDS_GAP_AFTER_NAME = 16;

/** Flex weights so the three cards grow/shrink together, keeping Figma ratios. */
export const HOME_HALF_ROW_FLEX = DESIGN_HOME_HALF_CARD_HEIGHT;
export const HOME_TOPICS_ROW_FLEX = DESIGN_HOME_HEALTH_CARD_HEIGHT;

/**
 * Home panel metrics.
 *
 * Cards fill the panel (bigger phone → bigger cards). The FAB floats on the
 * bottom-right corner of Topics instead of shortening that card. A bottom
 * inset only clears the home indicator, same for every card.
 */
export function useHomePanelLayout() {
  const insets = useSafeAreaInsets();
  const { structuralScale: s } = useResponsiveLayout();

  return useMemo(() => {
    const fabSize = Math.round(ADD_FAB.size * s);
    const fabRight = Math.round(ADD_FAB.right * s);
    const fabOverlap = fabRight + fabSize - PAGE_HORIZONTAL_PADDING;
    const topicsEndPadding = Math.max(16, fabOverlap + 8);

    return {
      gapAfterName: HOME_CARDS_GAP_AFTER_NAME,
      cardsBottomInset: 16 + insets.bottom,
      topicsEndPadding,
    };
  }, [insets.bottom, s]);
}
