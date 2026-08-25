import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface ReminderListItemProps {
  /** Top-left label (category). */
  category: string;
  /** Bottom-left reminder name. */
  title: string;
  /** Top-right time. */
  time: string;
  /** Bottom-right day label (Today / Yesterday / date). */
  dayLabel?: string;
  onPress?: () => void;
  /** Green check on the right (Today done affordance). */
  showCheckMark?: boolean;
  onCheckPress?: () => void;
  /** Completed recent: green bar on the left. */
  showCompletedBar?: boolean;
}

export default function ReminderListItem({
  category,
  title,
  time,
  dayLabel,
  onPress,
  showCheckMark = false,
  onCheckPress,
  showCompletedBar = false,
}: ReminderListItemProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {showCompletedBar ? <View style={styles.completedBar} /> : null}
      <View style={styles.content}>
        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
            <Text style={styles.time} numberOfLines={1}>
              {time}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {dayLabel ? (
              <Text style={styles.day} numberOfLines={1}>
                {dayLabel}
              </Text>
            ) : null}
          </View>
        </View>
        {showCheckMark ? (
          <TouchableOpacity
            style={styles.checkBtn}
            onPress={() => onCheckPress?.()}
            hitSlop={8}
            activeOpacity={0.7}
            disabled={!onCheckPress}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          </TouchableOpacity>
        ) : null}
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
    completedBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      backgroundColor: c.success,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 10,
    },
    rows: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: 20,
    },
    category: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      minWidth: 0,
    },
    time: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'right',
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
      minWidth: 0,
    },
    day: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'right',
      flexShrink: 0,
    },
    checkBtn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
