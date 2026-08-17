import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

type AppScreenProps = {
  children: React.ReactNode;
  /** Safe-area edges; default excludes top when a header owns the inset. */
  edges?: Edge[];
  style?: ViewStyle;
  /** Apply standard 16px horizontal page padding. */
  padded?: boolean;
  background?: 'background' | 'panel';
};

/**
 * Standard screen shell: flex column + optional fixed horizontal padding.
 * Does not scale typography or spacing.
 */
export default function AppScreen({
  children,
  edges = ['left', 'right'],
  style,
  padded = false,
  background = 'background',
}: AppScreenProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView
      style={[styles.safe, background === 'panel' ? styles.panel : styles.background, style]}
      edges={edges}
    >
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
    },
    background: {
      backgroundColor: c.background,
    },
    panel: {
      backgroundColor: c.panel,
    },
    inner: {
      flex: 1,
    },
    padded: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
  });
