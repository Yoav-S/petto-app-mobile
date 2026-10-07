import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import CardBottomFadeOverlay from '@/components/ui/CardBottomFadeOverlay';

const CARD_PAD_V = 22;
const STACK_GAP = 10;
const LINE = 20;
/** Description wraps to at most three lines; the card grows with it. */
const DESC_MAX_LINES = 3;
/** Rough chars on one description line when the time or day shares the row. */
const DESC_CHARS_PER_LINE = 32;

function descriptionLineCount(description?: string | null): number {
  const text = description?.trim() ?? '';
  if (!text) return 0;
  return Math.min(DESC_MAX_LINES, Math.max(1, Math.ceil(text.length / DESC_CHARS_PER_LINE)));
}

/** Title + time only. */
export const REMINDER_LIST_CARD_COMPACT_HEIGHT = CARD_PAD_V * 2 + LINE;
/** Title row plus one description line. */
export const REMINDER_LIST_CARD_FULL_HEIGHT = CARD_PAD_V * 2 + LINE + STACK_GAP + LINE;
export const REMINDER_LIST_ITEM_GAP = 4;

export function estimateReminderListItemHeight(options: {
  description?: string | null;
  dayLabel?: string | null;
}): number {
  const secondRowLines = Math.max(descriptionLineCount(options.description), options.dayLabel ? 1 : 0);
  if (secondRowLines === 0) return REMINDER_LIST_CARD_COMPACT_HEIGHT;
  return CARD_PAD_V * 2 + LINE + STACK_GAP + secondRowLines * LINE;
}

interface ReminderListItemProps {
  title: string;
  description?: string | null;
  time: string;
  /** Upcoming / Recent — shown on row 2, right side. */
  dayLabel?: string;
  onPress?: () => void;
  showCompletedBar?: boolean;
  /** 0 (visible) → 1 (faded out) as the row passes the list bottom edge. */
  fadeIntensity?: number;
}

export default function ReminderListItem({
  title,
  description,
  time,
  dayLabel,
  onPress,
  showCompletedBar = false,
  fadeIntensity = 0,
}: ReminderListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const hasDescription = Boolean(description?.trim());

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !dayLabel && !hasDescription ? styles.cardCompact : null,
      ]}
      onPress={onPress}
      // Press feedback comes from the swipe row's disabled wash instead, so the
      // card keeps one appearance through press, drag and open.
      activeOpacity={1}
      disabled={!onPress}
    >
      {showCompletedBar ? <View style={styles.completedBar} /> : null}
      <View style={styles.content}>
        {dayLabel ? (
          /* Upcoming / Recent: row1 title|time, row2 description|day */
          <View style={styles.stack}>
            <View style={styles.row}>
              <Text style={[styles.title, styles.rowMain]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.time} numberOfLines={1}>
                {time}
              </Text>
            </View>
            <View style={[styles.row, styles.rowTop]}>
              {hasDescription ? (
                <Text style={[styles.description, styles.rowMain]} numberOfLines={DESC_MAX_LINES}>
                  {description}
                </Text>
              ) : (
                <View style={styles.rowMain} />
              )}
              <Text style={styles.day} numberOfLines={1}>
                {dayLabel}
              </Text>
            </View>
          </View>
        ) : hasDescription ? (
          /* Today + note: title, then description|time */
          <View style={styles.stack}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.row, styles.rowTop]}>
              <Text style={[styles.description, styles.rowMain]} numberOfLines={DESC_MAX_LINES}>
                {description}
              </Text>
              <Text style={styles.time} numberOfLines={1}>
                {time}
              </Text>
            </View>
          </View>
        ) : (
          /* Today, no note: title|time */
          <View style={styles.row}>
            <Text style={[styles.title, styles.rowMain]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.time} numberOfLines={1}>
              {time}
            </Text>
          </View>
        )}
      </View>

      <CardBottomFadeOverlay intensity={fadeIntensity} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      marginBottom: REMINDER_LIST_ITEM_GAP,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
      flexDirection: 'row',
      overflow: 'hidden',
      minHeight: REMINDER_LIST_CARD_FULL_HEIGHT,
    },
    cardCompact: {
      minHeight: REMINDER_LIST_CARD_COMPACT_HEIGHT,
    },
    completedBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      backgroundColor: c.success,
    },
    content: {
      flex: 1,
      paddingTop: CARD_PAD_V,
      paddingBottom: CARD_PAD_V,
      paddingLeft: 20,
      paddingRight: 20,
      justifyContent: 'center',
    },
    stack: {
      gap: STACK_GAP,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      minHeight: LINE,
    },
    rowTop: {
      alignItems: 'flex-start',
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    description: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    time: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'right',
      flexShrink: 0,
    },
    day: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'right',
      flexShrink: 0,
    },
  });
