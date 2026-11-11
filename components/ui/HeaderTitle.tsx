import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Text,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface HeaderTitleProps {
  children: string;
}

const TITLE_SIZES = [
  { fontSize: 24, lineHeight: 28 },
  { fontSize: 20, lineHeight: 24 },
  { fontSize: 18, lineHeight: 22 },
] as const;

export type HeaderTitleLayout = {
  display: string;
  align: 'left' | 'center';
  fontSize: number;
  lineHeight: number;
};

/**
 * Shared screen title. Never splits mid-word.
 *
 * - Short one-word titles that fit → centered
 * - Long words or 2+ words → left, with the header row’s 16px gap from the back chip
 * - If the line still overflows the title box → wrap at a word boundary, else shrink
 */
export default function HeaderTitle({ children }: HeaderTitleProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [boxWidth, setBoxWidth] = useState(0);
  const title = useMemo(() => children.replace(/\s+/g, ' ').trim(), [children]);
  const planned = useMemo(() => layoutHeaderTitle(title, boxWidth), [title, boxWidth]);
  const [layout, setLayout] = useState(planned);

  useEffect(() => {
    setLayout(planned);
  }, [planned]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setBoxWidth((current) => (current === next ? current : next));
  }, []);

  const onTextLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (boxWidth <= 0) return;
      const lines = event.nativeEvent.lines;
      if (!lines.length) return;
      const widest = Math.max(...lines.map((line) => line.width));
      if (widest <= boxWidth + 1) return;

      const words = title.split(' ').filter(Boolean);
      const nextSize = TITLE_SIZES.find((size) => size.fontSize < layout.fontSize);
      if (!layout.display.includes('\n') && words.length >= 2) {
        const wrapped = wrapAtWords(words, boxWidth, layout.fontSize)
          ?? `${words[0]}\n${words.slice(1).join(' ')}`;
        if (wrapped !== layout.display) {
          setLayout({
            display: wrapped,
            align: 'left',
            fontSize: layout.fontSize,
            lineHeight: layout.lineHeight,
          });
          return;
        }
      }
      if (nextSize) {
        setLayout({
          display: layout.display,
          align: 'left',
          ...nextSize,
        });
      }
    },
    [boxWidth, layout.display, layout.fontSize, layout.lineHeight, title],
  );

  return (
    <Text
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      style={[
        styles.title,
        {
          color: colors.primaryText,
          textAlign: layout.align,
          fontSize: layout.fontSize,
          lineHeight: layout.lineHeight,
        },
      ]}
      numberOfLines={2}
      allowFontScaling={false}
      textBreakStrategy="simple"
      lineBreakStrategyIOS="standard"
    >
      {layout.display}
    </Text>
  );
}

/** Rough glyph width for Rubik at `fontSize` — enough to choose wrap/align before paint. */
function estimateWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    if (char === ' ') width += fontSize * 0.3;
    else if (/[iIlj.,:;!'|´`]/.test(char)) width += fontSize * 0.34;
    else if (/[WwMm@%]/.test(char)) width += fontSize * 0.78;
    else if (/[\u0400-\u04FF]/.test(char)) width += fontSize * 0.62;
    else if (/[\u0590-\u05FF]/.test(char)) width += fontSize * 0.56;
    else width += fontSize * 0.56;
  }
  return width;
}

function wrapAtWords(words: string[], boxWidth: number, fontSize: number): string | null {
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(' ');
    const second = words.slice(index).join(' ');
    if (
      estimateWidth(first, fontSize) <= boxWidth
      && estimateWidth(second, fontSize) <= boxWidth
    ) {
      return `${first}\n${second}`;
    }
  }
  return null;
}

/**
 * Pure layout planner used by the header title.
 * `boxWidth` is the flex title slot between the back chip and the trailing spacer;
 * the 16px gap from the arrow is owned by `HEADER_LAYOUT.iconTitleGap`.
 */
export function layoutHeaderTitle(title: string, boxWidth: number): HeaderTitleLayout {
  const trimmed = title.replace(/\s+/g, ' ').trim();
  const fallback = TITLE_SIZES[0];
  if (!trimmed) {
    return { display: '', align: 'center', ...fallback };
  }

  const words = trimmed.split(' ').filter(Boolean);
  if (boxWidth <= 0) {
    return {
      display: trimmed,
      align: words.length >= 2 ? 'left' : 'center',
      ...fallback,
    };
  }

  const fitWidth = Math.max(0, boxWidth);

  for (const size of TITLE_SIZES) {
    const full = estimateWidth(trimmed, size.fontSize);

    if (words.length === 1) {
      if (full > fitWidth) continue;
      // Center only when each side still has ≥16px free inside the title slot.
      const side = (boxWidth - full) / 2;
      const center = side >= HEADER_LAYOUT.iconTitleGap;
      return {
        display: trimmed,
        align: center ? 'center' : 'left',
        ...size,
      };
    }

    // Two or more words always sit left; chip gap keeps ≥16px from the back arrow.
    if (full <= fitWidth) {
      return { display: trimmed, align: 'left', ...size };
    }

    const wrapped = wrapAtWords(words, fitWidth, size.fontSize);
    if (wrapped) {
      return { display: wrapped, align: 'left', ...size };
    }
  }

  const last = TITLE_SIZES[TITLE_SIZES.length - 1];
  if (words.length >= 2) {
    const wrapped = wrapAtWords(words, fitWidth, last.fontSize)
      ?? `${words[0]}\n${words.slice(1).join(' ')}`;
    return { display: wrapped, align: 'left', ...last };
  }
  return { display: trimmed, align: 'left', ...last };
}

/** @deprecated Prefer layoutHeaderTitle — kept for older call sites. */
export function wrapHeaderTitle(title: string, boxWidth: number): string {
  return layoutHeaderTitle(title, boxWidth).display;
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    title: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      includeFontPadding: false,
    },
  });
