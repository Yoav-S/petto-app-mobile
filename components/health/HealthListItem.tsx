import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { formatHealthCreatedLabel, truncateHealthDescription } from '@/utils/calendar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export const HEALTH_LIST_CARD_WIDTH = '100%';
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
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
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
                backgroundColor: colors.surface,
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
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const { contentWidth } = useResponsiveLayout();
  const cardWidth = contentWidth;
  const cardHeight = HEALTH_LIST_CARD_HEIGHT;
  const padV = 14;
  const padH = 16;
  const innerGap = 12;
  const textGap = 6;
  const innerWidth = cardWidth - padH * 2;
  const textBlockHeight = 66;
  const createdHeight = 16;

  const createdLabel = formatHealthCreatedLabel(createdAt, {
    today: t('common.today'),
    yesterday: t('topics.created_yesterday'),
    createdPrefix: t('topics.created_prefix'),
  });
  const hasSubtitle = Boolean(subtitle.trim());

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          height: hasSubtitle ? cardHeight : undefined,
          maxHeight: hasSubtitle ? cardHeight : undefined,
          minHeight: hasSubtitle ? cardHeight : 80,
          paddingTop: padV,
          paddingBottom: padV,
          paddingHorizontal: padH,
          borderRadius: 12,
          marginBottom: HEALTH_LIST_ITEM_GAP,
          alignSelf: 'center',
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerWidth,
            height: hasSubtitle ? textBlockHeight + innerGap + createdHeight : undefined,
            maxHeight: hasSubtitle ? textBlockHeight + innerGap + createdHeight : undefined,
            gap: innerGap,
          },
        ]}
      >
        <View
          style={[
            styles.textBlock,
            {
              width: innerWidth,
              height: hasSubtitle ? textBlockHeight : undefined,
              maxHeight: hasSubtitle ? textBlockHeight : undefined,
              gap: textGap,
            },
          ]}
        >
          <View style={[styles.titleRow, { width: innerWidth }]}>
            <Text
              style={[styles.title, { maxWidth: innerWidth - 28 }]}
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
                <Ionicons name="notifications-outline" size={16} color={colors.secondaryText} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 16 }} />
            )}
          </View>

          {hasSubtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {createdLabel ? (
          <Text style={styles.createdMeta} numberOfLines={1} ellipsizeMode="tail">
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    overflow: 'hidden',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
    flex: 1,
  },
  reminderIconBtn: {
    marginLeft: 8,
    paddingTop: 2,
  },
  textBlock: {
    flexShrink: 1,
    minHeight: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
    flexShrink: 1,
  },
  createdMeta: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
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
