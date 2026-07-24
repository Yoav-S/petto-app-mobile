import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface ReminderListItemProps {
  title: string;
  subtitle: string;
  timeOrDate: string;
  onPress?: () => void;
}

export default function ReminderListItem({
  title,
  subtitle,
  timeOrDate,
  onPress,
}: ReminderListItemProps) {
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
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
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
      justifyContent: 'space-between',
      padding: Spacing.lg,
    },
    leftContent: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: Spacing.md,
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
  });
