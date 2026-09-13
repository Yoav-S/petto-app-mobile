import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { isRTL } from '@/i18n';

interface TopicsWrapDescriptionProps {
  text: string;
  secondLineInset: number;
  style: StyleProp<TextStyle>;
}

const LINE_H = 14;
const DESC_GAP = 4;
const BOX_H = LINE_H * 2 + DESC_GAP;

function restAfterFirstLine(text: string, firstLine: string): string {
  const trimmed = firstLine.replace(/\s+$/, '');
  if (!trimmed) return '';
  if (text.startsWith(trimmed)) return text.slice(trimmed.length).trimStart();
  const index = text.indexOf(trimmed);
  if (index < 0) return '';
  return text.slice(index + trimmed.length).trimStart();
}

/**
 * Always two description lines when the note wraps.
 * Line 1 is full width (runs across the top of the FAB).
 * Line 2 is shorter and stops before the FAB.
 */
export default function TopicsWrapDescription({
  text,
  secondLineInset,
  style,
}: TopicsWrapDescriptionProps) {
  const [width, setWidth] = useState(0);
  const [first, setFirst] = useState(text);
  const [rest, setRest] = useState('');
  const align = isRTL ? 'right' : 'left';

  useEffect(() => {
    setFirst(text);
    setRest('');
  }, [text]);

  const secondWidth = width > 0 ? Math.max(0, width - secondLineInset) : undefined;

  return (
    <View
      style={styles.box}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((prev) => (prev === next ? prev : next));
      }}
    >
      {width > 0 ? (
        <View style={styles.measureWrap} pointerEvents="none" collapsable={false}>
          <Text
            style={[style, styles.measure, { width }]}
            onTextLayout={(event) => {
              const line = event.nativeEvent.lines[0]?.text ?? '';
              const nextRest = restAfterFirstLine(text, line);
              const nextFirst = nextRest ? line.replace(/\s+$/, '') || text : text;
              setFirst((prev) => (prev === nextFirst ? prev : nextFirst));
              setRest((prev) => (prev === nextRest ? prev : nextRest));
            }}
          >
            {text}
          </Text>
        </View>
      ) : null}

      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[style, styles.line, { width: width || '100%', textAlign: align }]}
      >
        {first}
      </Text>
      {rest ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            style,
            styles.line,
            {
              width: secondWidth ?? '100%',
              alignSelf: 'flex-start',
              textAlign: align,
            },
          ]}
        >
          {rest}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: BOX_H,
    gap: DESC_GAP,
    overflow: 'hidden',
    flexShrink: 0,
    direction: 'ltr',
  },
  measureWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
  },
  measure: {
    lineHeight: LINE_H,
    includeFontPadding: false,
  },
  line: {
    height: LINE_H,
    lineHeight: LINE_H,
    includeFontPadding: false,
  },
});
