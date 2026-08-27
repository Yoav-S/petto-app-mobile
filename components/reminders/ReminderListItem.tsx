import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface ReminderListItemProps {
  /** Top-left bold title. */
  title: string;
  /** Optional note/description under the title (already truncated by caller). */
  description?: string | null;
  /** Top-right time (e.g. "9:00"). */
  time: string;
  /** Bottom-right day/date (Upcoming / Recent). */
  dayLabel?: string;
  onPress?: () => void;
  /** Completed recent: green bar on the left. */
  showCompletedBar?: boolean;
}

export default function ReminderListItem({
  title,
  description,
  time,
  dayLabel,
  onPress,
  showCompletedBar = false,
}: ReminderListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const hasDescription = Boolean(description?.trim());

  return (
    <TouchableOpacity
      style={[styles.card, !hasDescription && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {showCompletedBar ? <View style={styles.completedBar} /> : null}
      <View style={[styles.content, !hasDescription && styles.contentCompact]}>
        <View style={styles.left}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {hasDescription ? (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.right,
            dayLabel
              ? styles.rightCentered
              : hasDescription
                ? styles.rightTimeAtBottom
                : styles.rightCentered,
          ]}
        >
          <Text style={styles.time} numberOfLines={1}>
            {time}
          </Text>
          {dayLabel ? (
            <Text style={styles.day} numberOfLines={1}>
              {dayLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      marginBottom: 12,
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
      minHeight: 76,
    },
    cardCompact: {
      minHeight: 56,
    },
    completedBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      backgroundColor: c.success,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    contentCompact: {
      paddingVertical: 12,
    },
    left: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    right: {
      alignItems: 'flex-end',
      gap: 4,
      flexShrink: 0,
    },
    rightCentered: {
      justifyContent: 'center',
    },
    rightTimeAtBottom: {
      justifyContent: 'flex-end',
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
      lineHeight: 18,
      color: c.secondaryText,
    },
    time: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'right',
    },
    day: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 18,
      color: c.secondaryText,
      textAlign: 'right',
    },
  });
