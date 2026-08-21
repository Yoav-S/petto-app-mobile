import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface ReminderListItemProps {
  title: string;
  subtitle: string;
  timeOrDate: string;
  onPress?: () => void;
  /** Green check on the right (Today done affordance / completed Recent). */
  showCheckMark?: boolean;
  onCheckPress?: () => void;
}

export default function ReminderListItem({
  title,
  subtitle,
  timeOrDate,
  onPress,
  showCheckMark = false,
  onCheckPress,
}: ReminderListItemProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const lines = timeOrDate.split('\n').filter(Boolean);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.contentContainer}>
        <View style={styles.leftContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.rightContent}>
          {lines.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              style={[styles.timeOrDate, index === 0 && lines.length > 1 ? styles.primaryTime : null]}
            >
              {line}
            </Text>
          ))}
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
      marginBottom: Spacing.lg,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      overflow: 'hidden',
      minHeight: 72,
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      gap: 10,
    },
    leftContent: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: Spacing.sm,
      minWidth: 0,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      color: c.secondaryText,
    },
    rightContent: {
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    timeOrDate: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      color: c.secondaryText,
      textAlign: 'right',
    },
    primaryTime: {
      color: c.primaryText,
      marginBottom: 2,
    },
    checkBtn: {
      marginLeft: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
