import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  /** Compact Figma CTA (124×48, 14/18). Default is the larger list action. */
  actionCompact?: boolean;
  /** Scaled top offset (px) — skips vertical centering when set. */
  topOffset?: number;
  /** Gap between title, subtitle, and action. */
  contentGap?: number;
}

export default function EmptyState({
  title,
  subtitle,
  actionTitle,
  onAction,
  actionCompact = false,
  topOffset,
  contentGap,
}: EmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.container,
        topOffset != null ? styles.containerOffset : null,
        topOffset != null ? { paddingTop: topOffset } : null,
        contentGap != null ? { gap: contentGap } : null,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      {actionTitle && onAction && (
        <TouchableOpacity
          style={[styles.button, actionCompact && styles.buttonCompact]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, actionCompact && styles.buttonTextCompact]}>
            {actionTitle}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  containerOffset: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.secondaryText,
    textAlign: 'center',
  },
  button: {
    backgroundColor: c.button.primaryBg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    width: 125,
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.button.primaryText,
  },
  buttonTextCompact: {
    fontSize: 14,
    lineHeight: 18,
    color: c.button.primaryText,
  },
});
