import { StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';

/** Figma text block width inside home summary cards (375px frame). */
export const HOME_CARD_TEXT_WIDTH = 132;

/** Figma content width beside the health card icon (375px frame). */
export const HOME_HEALTH_CONTENT_WIDTH = 263;

export const makeHomeCardTypography = (c: ThemeColors) => StyleSheet.create({
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.primaryText,
  },
  meta: {
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
  },
  titleSubtitleBlock: {
    width: HOME_CARD_TEXT_WIDTH,
    height: 46,
    gap: 6,
    overflow: 'hidden',
  },
  footerRow: {
    width: HOME_CARD_TEXT_WIDTH,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRightMeta: {
    width: 96,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthContent: {
    flex: 1,
    minWidth: 0,
    maxWidth: HOME_HEALTH_CONTENT_WIDTH,
    height: 80,
    justifyContent: 'space-between',
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 20,
  },
  healthDateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    maxWidth: 120,
  },
  healthBodyBlock: {
    height: 42,
    gap: 6,
    overflow: 'hidden',
  },
  healthSubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
  },
  note: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
  },
});
