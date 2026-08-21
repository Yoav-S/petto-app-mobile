import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/** Figma empty block: text↔CTA gap 22, title↔subtitle gap 4, CTA 124×48. */
const EMPTY = {
  stackGap: 22,
  textGap: 4,
  /** Wider than Figma 256 so EN subtitles stay on one line. */
  textMaxWidth: 335,
  btnWidth: 124,
  btnHeight: 48,
  btnRadius: 12,
  btnPadV: 12,
  btnPadH: 16,
} as const;

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  /** Compact Figma CTA (124×48). Default is the larger list action. */
  actionCompact?: boolean;
  /** Scaled top offset (px) — skips vertical centering when set. */
  topOffset?: number;
}

export default function EmptyState({
  title,
  subtitle,
  actionTitle,
  onAction,
  actionCompact = false,
  topOffset,
}: EmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  const { contentWidth } = useResponsiveLayout();
  const hasAction = Boolean(actionTitle && onAction);
  const textWidth = Math.min(EMPTY.textMaxWidth, contentWidth);

  return (
    <View
      style={[
        styles.container,
        topOffset != null ? styles.containerOffset : null,
        topOffset != null ? { paddingTop: topOffset } : null,
      ]}
    >
      <View
        style={[
          styles.block,
          { width: textWidth },
          hasAction && actionCompact ? styles.blockCompact : null,
        ]}
      >
        <View style={[styles.textStack, { width: textWidth }]}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
            {title}
          </Text>
          <Text
            style={styles.subtitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {subtitle}
          </Text>
        </View>

        {hasAction ? (
          <TouchableOpacity
            style={[styles.button, actionCompact && styles.buttonCompact]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.buttonText, actionCompact && styles.buttonTextCompact]}
              numberOfLines={1}
            >
              {actionTitle}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    containerOffset: {
      flex: 0,
      justifyContent: 'flex-start',
      paddingTop: 0,
    },
    block: {
      alignItems: 'center',
      gap: EMPTY.stackGap,
    },
    blockCompact: {
      // title 24 + gap 4 + subtitle 24 + gap 22 + btn 48
      minHeight: 122,
    },
    textStack: {
      gap: EMPTY.textGap,
      alignItems: 'center',
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.secondaryText,
      textAlign: 'center',
      width: '100%',
    },
    button: {
      backgroundColor: c.button.primaryBg,
      paddingVertical: EMPTY.btnPadV,
      paddingHorizontal: 24,
      borderRadius: EMPTY.btnRadius,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    buttonCompact: {
      width: EMPTY.btnWidth,
      height: EMPTY.btnHeight,
      paddingVertical: EMPTY.btnPadV,
      paddingHorizontal: EMPTY.btnPadH,
      alignSelf: 'center',
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
      textAlign: 'center',
      flexShrink: 0,
    },
  });
