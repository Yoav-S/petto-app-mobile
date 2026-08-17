import { StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';

/** Figma reference widths — use as maxWidth caps, not fixed layout widths. */
export const HOME_CARD_TEXT_MAX_WIDTH = 132;
export const HOME_HEALTH_CONTENT_MAX_WIDTH = 263;

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
    width: '100%',
    maxWidth: HOME_CARD_TEXT_MAX_WIDTH,
    gap: 6,
    overflow: 'hidden',
  },
  footerRow: {
    width: '100%',
    maxWidth: HOME_CARD_TEXT_MAX_WIDTH,
    minHeight: 16,
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
    height: 80,
    gap: 12,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  healthDateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
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
