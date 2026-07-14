import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import HealthListReminderMeta from '@/components/health/HealthListReminderMeta';

export const HEALTH_LIST_DESIGN_WIDTH = 375;
export const HEALTH_LIST_CARD_WIDTH = 335;
export const HEALTH_LIST_CARD_HEIGHT = 122;
export const HEALTH_LIST_ITEM_GAP = 10;

interface HealthListItemProps {
  title: string;
  subtitle: string;
  reminderDate?: string | null;
  reminderTime?: string | null;
  fadeIntensity?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onReminderPress?: () => void;
}

function BottomFadeOverlay({ intensity }: { intensity: number }) {
  if (intensity <= 0.01) return null;

  const stops = [0, 0.22, 0.45, 0.68, 0.89, 1];

  return (
    <View style={styles.fadeOverlay} pointerEvents="none">
      {stops.map((stop, index) => {
        const nextStop = stops[index + 1] ?? 1;
        const bandOpacity = intensity * stop * 0.95;
        if (bandOpacity <= 0.01) return null;
        return (
          <View
            key={stop}
            style={[
              styles.fadeBand,
              {
                top: `${stop * 100}%`,
                height: `${(nextStop - stop) * 100}%`,
                backgroundColor: Colors.surface,
                opacity: bandOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function SubtitleBlock({
  subtitle,
  width,
  lineHeight,
  fontSize,
  readMoreSize,
}: {
  subtitle: string;
  width: number;
  lineHeight: number;
  fontSize: number;
  readMoreSize: number;
}) {
  const [overflows, setOverflows] = useState(false);

  const handleFullLayout = useCallback(
    (lineCount: number) => {
      setOverflows(lineCount > 2);
    },
    [],
  );

  return (
    <View style={styles.subtitleWrap}>
      <Text
        style={[styles.measureText, { width, fontSize, lineHeight }]}
        onTextLayout={(e) => handleFullLayout(e.nativeEvent.lines.length)}
      >
        {subtitle}
      </Text>
      <Text
        style={[styles.subtitle, { fontSize, lineHeight }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {subtitle}
        {overflows ? (
          <Text style={[styles.readMore, { fontSize: readMoreSize, lineHeight }]}>
            {' '}
            {t('health.read_more')}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

export default function HealthListItem({
  title,
  subtitle,
  reminderDate,
  reminderTime,
  fadeIntensity = 0,
  onPress,
  onLongPress,
  onReminderPress,
}: HealthListItemProps) {
  const { width: screenWidth } = useWindowDimensions();
  const sx = screenWidth / HEALTH_LIST_DESIGN_WIDTH;

  const cardWidth = HEALTH_LIST_CARD_WIDTH * sx;
  const cardHeight = HEALTH_LIST_CARD_HEIGHT * sx;
  const padV = 14 * sx;
  const padH = 16 * sx;
  const innerGap = 12 * sx;
  const textGap = 6 * sx;
  const titleSize = 16 * sx;
  const titleLine = 20 * sx;
  const subtitleSize = 14 * sx;
  const subtitleLine = 20 * sx;
  const innerWidth = cardWidth - padH * 2;
  const textBlockHeight = 66 * sx;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          paddingTop: padV,
          paddingBottom: padV,
          paddingHorizontal: padH,
          borderRadius: 12 * sx,
          marginBottom: HEALTH_LIST_ITEM_GAP * sx,
          alignSelf: 'center',
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.inner, { width: innerWidth, gap: innerGap }]}>
        <View style={[styles.textBlock, { width: innerWidth, height: textBlockHeight, gap: textGap }]}>
          <Text
            style={[styles.title, { fontSize: titleSize, lineHeight: titleLine }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <SubtitleBlock
            subtitle={subtitle}
            width={innerWidth}
            lineHeight={subtitleLine}
            fontSize={subtitleSize}
            readMoreSize={subtitleSize}
          />
        </View>

        <TouchableOpacity
          onPress={onReminderPress}
          hitSlop={8}
          activeOpacity={0.7}
          disabled={!onReminderPress}
          style={{ maxWidth: innerWidth }}
        >
          <HealthListReminderMeta
            date={reminderDate}
            time={reminderTime}
            scale={sx}
          />
        </TouchableOpacity>
      </View>

      <BottomFadeOverlay intensity={fadeIntensity} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textBlock: {
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'Rubik-Medium',
    color: Colors.primaryText,
    flexShrink: 1,
  },
  subtitleWrap: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    fontFamily: 'Rubik-Regular',
    color: Colors.primaryText,
    left: 0,
    right: 0,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    color: Colors.primaryText,
  },
  readMore: {
    fontFamily: 'Rubik-Medium',
    color: Colors.secondaryText,
  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  fadeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
