import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
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
  topOffset,
  contentGap,
}: EmptyStateProps) {
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
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 120,
  },
  containerOffset: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.button.primaryBg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.button.primaryText,
  },
});
