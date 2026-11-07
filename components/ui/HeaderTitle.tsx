import React, { useCallback, useMemo, useState } from 'react';
import { Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface HeaderTitleProps {
  children: string;
}

/**
 * Centered header title. Stays on one line when it fits with a 12px inset
 * inside the title box (which already has 16px from the back/close chip).
 * Longer copy wraps after the first word so Privacy / Terms style titles
 * land on two lines instead of hitting the sides.
 */
export default function HeaderTitle({ children }: HeaderTitleProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [boxWidth, setBoxWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setBoxWidth((current) => (current === next ? current : next));
  }, []);

  const display = useMemo(
    () => wrapHeaderTitle(children, boxWidth),
    [boxWidth, children],
  );

  return (
    <Text
      onLayout={onLayout}
      style={[styles.title, { color: colors.primaryText }]}
      numberOfLines={2}
    >
      {display}
    </Text>
  );
}

const CHAR_WIDTH = 12.4;

export function wrapHeaderTitle(title: string, boxWidth: number): string {
  if (title.includes('\n')) return title;
  const trimmed = title.replace(/\s+/g, ' ').trim();
  if (!trimmed || !trimmed.includes(' ')) return trimmed;
  if (boxWidth <= 0) return trimmed;

  const fitWidth = Math.max(0, boxWidth - HEADER_LAYOUT.titleEdgeInset * 2);
  if (trimmed.length * CHAR_WIDTH <= fitWidth) return trimmed;

  const space = trimmed.indexOf(' ');
  if (space <= 0) return trimmed;
  return `${trimmed.slice(0, space)}\n${trimmed.slice(space + 1)}`;
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    title: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      textAlign: 'center',
    },
  });
