import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { isRTL } from '@/i18n';

interface TopicsWrapDescriptionProps {
  text: string;
  secondLineInset: number;
  fabTop: number;
  fabSize?: number;
  style: StyleProp<TextStyle>;
}

/** Extra clear on the second line only — first line uses full width. */
const EXTRA_INSET = 40;

const LINE_H = 16;
const DESC_GAP = 4;
const BOX_H = LINE_H * 2 + DESC_GAP;
const ELLIPSIS = '...';

function restAfterFirstLine(text: string, firstLine: string): string {
  const trimmed = firstLine.replace(/\s+$/, '');
  if (!trimmed) return text.trim();
  if (text.startsWith(trimmed)) return text.slice(trimmed.length).trimStart();
  const index = text.indexOf(trimmed);
  if (index < 0) return '';
  return text.slice(index + trimmed.length).trimStart();
}

function endOnWord(fitted: string, source: string): string {
  const line = fitted.replace(/\s+$/, '');
  if (!line) return '';
  if (!source.startsWith(line)) {
    const space = line.lastIndexOf(' ');
    return space > 0 ? line.slice(0, space) : line;
  }
  if (line.length >= source.trimEnd().length) return source.trimEnd();
  const next = source[line.length];
  const midWord = next != null && !/\s/.test(next);
  if (!midWord) return line;
  const space = line.lastIndexOf(' ');
  return space > 0 ? line.slice(0, space) : '';
}

function takeFirstWord(rest: string): { word: string; rest: string } {
  const trimmed = rest.trimStart();
  if (!trimmed) return { word: '', rest: '' };
  const space = trimmed.indexOf(' ');
  if (space < 0) return { word: trimmed, rest: '' };
  return { word: trimmed.slice(0, space), rest: trimmed.slice(space + 1).trimStart() };
}

/**
 * Split on the measured first line, then pull one more word up onto line 1
 * (line 1 may sit under the FAB). Remainder stays on line 2.
 */
function splitFirstLine(text: string, lineText: string): { first: string; rest: string } {
  let first = endOnWord(lineText, text);
  if (!first) return { first: '', rest: text.trim() };
  let rest = restAfterFirstLine(text, first);
  // Pull one more word onto line 1 only when line 2 still has remainder.
  if (rest) {
    const { word, rest: nextRest } = takeFirstWord(rest);
    if (word && nextRest) {
      first = `${first} ${word}`;
      rest = nextRest;
    }
  }
  return { first, rest };
}

function withEllipsis(fittedLine: string, source: string): string {
  const fitted = endOnWord(fittedLine, source);
  if (!fitted) return ELLIPSIS;
  if (fitted.length >= source.trimEnd().length) return source.trimEnd();
  return `${fitted}${ELLIPSIS}`;
}

function dropOneWord(display: string): string {
  const bare = display.endsWith(ELLIPSIS)
    ? display.slice(0, -ELLIPSIS.length).replace(/\s+$/, '')
    : display.replace(/\s+$/, '');
  const space = bare.lastIndexOf(' ');
  if (space <= 0) return ELLIPSIS;
  return `${bare.slice(0, space)}${ELLIPSIS}`;
}

/**
 * Two description lines. Line 1 is full width (+ one word under the FAB).
 * Line 2 is shorter so it clears the FAB.
 */
export default function TopicsWrapDescription({
  text,
  secondLineInset,
  fabTop: _fabTop,
  style,
}: TopicsWrapDescriptionProps) {
  const boxRef = useRef<View>(null);
  const [width, setWidth] = useState(0);
  const [first, setFirst] = useState(text);
  const [rest, setRest] = useState('');
  const [secondText, setSecondText] = useState('');
  const align = isRTL ? 'right' : 'left';

  const secondInset = Math.max(0, secondLineInset) + EXTRA_INSET;
  const firstWidth = width;
  const secondWidth = width > 0 ? Math.max(0, width - secondInset) : 0;

  useEffect(() => {
    setFirst(text);
    setRest('');
    setSecondText('');
  }, [text, firstWidth]);

  useEffect(() => {
    setSecondText(rest);
  }, [rest, secondWidth]);

  return (
    <View
      ref={boxRef}
      style={styles.box}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((prev) => (prev === next ? prev : next));
      }}
    >
      {firstWidth > 0 ? (
        <View
          style={[styles.measureWrap, { width: firstWidth }]}
          pointerEvents="none"
          collapsable={false}
        >
          <Text
            key={`first-${firstWidth}-${text}`}
            style={[style, styles.measure, { width: firstWidth, maxWidth: firstWidth }]}
            onTextLayout={(event) => {
              const lines = event.nativeEvent.lines;
              const line = lines[0]?.text ?? '';
              // Multi-line measure: real wrap. Single line: either fits, or width failed —
              // if the reported line is shorter than the source, still split on it.
              if (lines.length <= 1 && line.replace(/\s+$/, '') === text.trim()) {
                setFirst(text.trim());
                setRest('');
                return;
              }
              const next = splitFirstLine(text, line);
              setFirst((prev) => (prev === next.first ? prev : next.first));
              setRest((prev) => (prev === next.rest ? prev : next.rest));
            }}
          >
            {text}
          </Text>
        </View>
      ) : null}

      {rest && secondWidth > 0 ? (
        <View
          style={[styles.measureWrap, { width: secondWidth }]}
          pointerEvents="none"
          collapsable={false}
        >
          <Text
            key={`second-${secondWidth}-${rest}`}
            style={[style, styles.measure, { width: secondWidth, maxWidth: secondWidth }]}
            onTextLayout={(event) => {
              if (event.nativeEvent.lines.length <= 1) return;
              const fitted = event.nativeEvent.lines[0]?.text ?? '';
              const next =
                secondText !== rest && secondText.endsWith(ELLIPSIS)
                  ? dropOneWord(secondText)
                  : withEllipsis(fitted, rest);
              setSecondText((prev) => (prev === next ? prev : next));
            }}
          >
            {secondText || rest}
          </Text>
        </View>
      ) : null}

      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[style, styles.line, { width: firstWidth || '100%', textAlign: align }]}
      >
        {first}
      </Text>
      {rest ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            style,
            styles.line,
            {
              width: secondWidth || '100%',
              alignSelf: 'flex-start',
              textAlign: align,
            },
          ]}
        >
          {secondText || rest}
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
