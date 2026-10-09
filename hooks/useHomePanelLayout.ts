import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import {
  DESIGN_COVER_HEIGHT,
  DESIGN_HOME_CARD_ROW_GAP,
  DESIGN_HOME_HALF_CARD_HEIGHT,
  DESIGN_HOME_HALF_GAP,
  DESIGN_HOME_HEALTH_CARD_HEIGHT,
} from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/** Tabs sit 32px under the sheet; the cards start 16px under the 28px tabs. */
const PANEL_CHROME = 32 + 28 + 16;
const CARD_STACK =
  DESIGN_HOME_HALF_CARD_HEIGHT + DESIGN_HOME_CARD_ROW_GAP + DESIGN_HOME_HEALTH_CARD_HEIGHT;
/** Add button top inside the 450px sheet (375-wide frame, left 299). */
const SHEET_FAB_TOP = 368;
/** How far that top sits above the bottom of the 118px Topics card. */
const FAB_TOPICS_OVERLAP = 32 + 28 + 16 + CARD_STACK - SHEET_FAB_TOP;

/**
 * Overview cards keep the 375×812 sizes and shrink together only when the
 * sheet cannot fit them. They do not grow to fill leftover space.
 */
export function useHomePanelLayout() {
  const insets = useSafeAreaInsets();
  const { height, structuralScale } = useResponsiveLayout();

  return useMemo(() => {
    const coverHeight = Math.round(DESIGN_COVER_HEIGHT * structuralScale);
    const bottom = Math.max(insets.bottom, 12);
    const budget = Math.max(180, height - coverHeight - PANEL_CHROME - bottom);
    const scale = Math.min(structuralScale, budget / CARD_STACK);
    const halfCardHeight = Math.round(DESIGN_HOME_HALF_CARD_HEIGHT * scale);
    const topicsCardHeight = Math.round(DESIGN_HOME_HEALTH_CARD_HEIGHT * scale);
    const fabSize = Math.round(ADD_FAB.size * structuralScale);
    const topicsTop = coverHeight + PANEL_CHROME + halfCardHeight + DESIGN_HOME_CARD_ROW_GAP;
    const overlap = Math.round(
      FAB_TOPICS_OVERLAP * (topicsCardHeight / DESIGN_HOME_HEALTH_CARD_HEIGHT),
    );
    const drop = 16;
    const floor = Math.max(0, bottom - drop);
    const fabTop = Math.min(
      topicsTop + topicsCardHeight - overlap + drop,
      height - fabSize - floor,
    );
    const fabBottom = Math.max(floor, height - fabTop - fabSize);
    const secondLineInset = Math.max(0, fabSize - 16 + 8);

    return {
      cardsBottomInset: bottom,
      halfCardHeight,
      topicsCardHeight,
      cardRowGap: DESIGN_HOME_CARD_ROW_GAP,
      halfCardGap: DESIGN_HOME_HALF_GAP,
      fabBottom,
      /** Screen Y of the add button’s top edge. */
      fabTop,
      /** Screen bottom to the top of the add button. Lists end here. */
      fabTopInset: fabBottom + fabSize,
      secondLineInset,
    };
  }, [height, insets.bottom, structuralScale]);
}
