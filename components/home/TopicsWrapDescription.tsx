import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

interface TopicsWrapDescriptionProps {
  text: string;
  secondLineInset: number;
  style: StyleProp<TextStyle>;
}

const LINE_H = 14;
const DESC_GAP = 4;
const BOX_H = LINE_H * 2 + DESC_GAP;

function splitAtFirstLine(text: string, firstLine: string): { first: string; rest: string } {
  const trimmed = firstLine.replace(/\s+$/, '');
  if (!trimmed) return { first: text, rest: '' };

  let end = text.startsWith(trimmed) ? trimmed.length : text.indexOf(trimmed);
  if (end < 0) return { first: trimmed, rest: text.slice(trimmed.length).trimStart() };
  if (!text.startsWith(trimmed)) end += trimmed.length;
  while (end < text.length && /\s/.test(text[end])) end += 1;

  const rest = text.slice(end);
  if (!rest) return { first: text, rest: '' };
  return { first: text.slice(0, end).trimEnd() || trimmed, rest };
}

/**
 * Description: always 32px, two lines, 4px gap.
 * Line 1 uses the full column. Line 2 is shorter so it stops before the FAB.
 */
export default function TopicsWrapDescription({
  text,
  secondLineInset,
  style,
}: TopicsWrapDescriptionProps) {
  const [width, setWidth] = useState(0);
  const [first, setFirst] = useState(text);
  const [rest, setRest] = useState('');

  useEffect(() => {
    setFirst(text);
    setRest('');
  }, [text]);

  return (
    <View
      style={styles.box}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((prev) => (prev === next ? prev : next));
      }}
    >
      {width > 0 ? (
        <View style={[styles.measureClip, { width }]} pointerEvents="none">
          <Text
            style={[style, styles.measureText, { width }]}
            onTextLayout={(event) => {
              const line = event.nativeEvent.lines[0]?.text ?? '';
              const next = splitAtFirstLine(text, line);
              setFirst((prev) => (prev === next.first ? prev : next.first));
              setRest((prev) => (prev === next.rest ? prev : next.rest));
            }}
          >
            {text}
          </Text>
        </View>
      ) : null}
      <Text numberOfLines={1} ellipsizeMode="clip" style={[style, styles.line]}>
        {first}
      </Text>
      {rest ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            style,
            styles.line,
            width > 0 ? { width: Math.max(0, width - secondLineInset) } : null,
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
  },
  measureClip: {
    position: 'absolute',
    height: 0,
    overflow: 'hidden',
    left: 0,
    top: 0,
    opacity: 0,
  },
  measureText: {
    lineHeight: LINE_H,
    includeFontPadding: false,
  },
  line: {
    height: LINE_H,
    lineHeight: LINE_H,
    overflow: 'hidden',
    includeFontPadding: false,
  },
});
