import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { isRTL } from '@/i18n';

interface TopicsWrapDescriptionProps {
  text: string;
  /** How much to shorten a line that runs into the add button. */
  secondLineInset: number;
  /** Screen Y of the add button’s top. Lines above this stay full width. */
  fabTop: number;
  style: StyleProp<TextStyle>;
}

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

/** Pull a mid-word fragment back to the previous space so the line ends on a word. */
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

/** First visible line, never ending in the middle of a word. */
function splitFirstLine(text: string, lineText: string): { first: string; rest: string } {
  const first = endOnWord(lineText, text);
  if (!first) return { first: '', rest: text.trim() };
  const rest = restAfterFirstLine(text, first);
  return { first, rest };
}

/**
 * Text that does not fit the line, cut before the unfinished word.
 * "2 week…" that cannot finish "week" becomes "2...".
 */
function withEllipsis(fittedLine: string, source: string): string {
  const fitted = endOnWord(fittedLine, source);
  if (!fitted) return ELLIPSIS;
  if (fitted.length >= source.trimEnd().length) return source.trimEnd();
  return `${fitted}${ELLIPSIS}`;
}

/** Drop one more whole word so the ellipsis itself can fit. */
function dropOneWord(display: string): string {
  const bare = display.endsWith(ELLIPSIS)
    ? display.slice(0, -ELLIPSIS.length).replace(/\s+$/, '')
    : display.replace(/\s+$/, '');
  const space = bare.lastIndexOf(' ');
  if (space <= 0) return ELLIPSIS;
  return `${bare.slice(0, space)}${ELLIPSIS}`;
}

function lineHitsFab(lineTop: number, fabTop: number): boolean {
  return lineTop + LINE_H > fabTop;
}

/**
 * Two description lines. The first stays full width while it sits above the
 * add button, and uses the second line’s right edge if it would run underneath.
 * The second line always stops before the button. Overflow ends on a whole word,
 * then "...".
 */
export default function TopicsWrapDescription({
  text,
  secondLineInset,
  fabTop,
  style,
}: TopicsWrapDescriptionProps) {
  const boxRef = useRef<View>(null);
  const [width, setWidth] = useState(0);
  const [boxTop, setBoxTop] = useState<number | null>(null);
  const [first, setFirst] = useState(text);
  const [rest, setRest] = useState('');
  const [secondText, setSecondText] = useState('');
  const align = isRTL ? 'right' : 'left';

  const firstHitsFab = boxTop != null && lineHitsFab(boxTop, fabTop);
  const firstWidth = width > 0 ? Math.max(0, width - (firstHitsFab ? secondLineInset : 0)) : 0;
  const secondWidth = width > 0 ? Math.max(0, width - secondLineInset) : 0;

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
        boxRef.current?.measureInWindow((_x, y) => {
          if (!Number.isFinite(y)) return;
          const rounded = Math.round(y);
          setBoxTop((prev) => (prev === rounded ? prev : rounded));
        });
      }}
    >
      {firstWidth > 0 ? (
        <View style={styles.measureWrap} pointerEvents="none" collapsable={false}>
          <Text
            style={[style, styles.measure, { width: firstWidth }]}
            onTextLayout={(event) => {
              const line = event.nativeEvent.lines[0]?.text ?? '';
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
        <View style={styles.measureWrap} pointerEvents="none" collapsable={false}>
          <Text
            style={[style, styles.measure, { width: secondWidth }]}
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
