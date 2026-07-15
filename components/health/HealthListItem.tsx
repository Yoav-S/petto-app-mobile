import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { formatHealthCreatedLabel, truncateHealthDescription } from '@/utils/calendar';

export const HEALTH_LIST_DESIGN_WIDTH = 375;
export const HEALTH_LIST_CARD_WIDTH = 335;
export const HEALTH_LIST_CARD_HEIGHT = 122;
export const HEALTH_LIST_ITEM_GAP = 10;

interface HealthListItemProps {
  title: string;
  subtitle: string;
  createdAt?: string | null;
  hasReminder?: boolean;
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

export default function HealthListItem({
  title,
  subtitle,
  createdAt,
  hasReminder = false,
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
  const metaSize = 14 * sx;
  const metaLine = 20 * sx;
  const innerWidth = cardWidth - padH * 2;

  const createdLabel = formatHealthCreatedLabel(createdAt, {
    today: t('common.today'),
    yesterday: t('health.created_yesterday'),
    createdPrefix: t('health.created_prefix'),
  });

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
        <View style={[styles.topRow, { width: innerWidth }]}>
          <Text
            style={[
              styles.title,
              { fontSize: titleSize, lineHeight: titleLine, maxWidth: innerWidth - 28 * sx },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {hasReminder ? (
            <TouchableOpacity
              onPress={onReminderPress}
              hitSlop={8}
              activeOpacity={0.7}
              disabled={!onReminderPress}
              style={styles.reminderIconBtn}
            >
              <Ionicons name="notifications-outline" size={16 * sx} color={Colors.secondaryText} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 16 * sx }} />
          )}
        </View>

        <View style={[styles.textBlock, { width: innerWidth, gap: textGap }]}>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleLine }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {createdLabel ? (
          <Text
            style={[styles.createdMeta, { fontSize: metaSize, lineHeight: metaLine }]}
            numberOfLines={1}
          >
            {createdLabel}
          </Text>
        ) : null}
      </View>

      <BottomFadeOverlay intensity={fadeIntensity} />
    </TouchableOpacity>
  );
}

export function healthRecordSubtitle(description?: string | null): string {
  return truncateHealthDescription(description);
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Rubik-Medium',
    color: Colors.primaryText,
    flex: 1,
  },
  reminderIconBtn: {
    marginLeft: 8,
    paddingTop: 2,
  },
  textBlock: {
    flexShrink: 1,
    minHeight: 0,
    justifyContent: 'flex-start',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    color: Colors.primaryText,
  },
  createdMeta: {
    fontFamily: 'Rubik-Regular',
    color: Colors.secondaryText,
    flexShrink: 0,
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
