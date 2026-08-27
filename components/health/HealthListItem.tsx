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
import {
  formatHealthDateMeta,
  truncateHealthDescription,
  truncatePreviewText,
} from '@/utils/calendar';

export const HEALTH_LIST_CARD_WIDTH = '100%';
export const HEALTH_LIST_CARD_HEIGHT = 122;
export const HEALTH_LIST_ITEM_GAP = 12;

const PREVIEW_CHARS = 20;

interface HealthListItemProps {
  title: string;
  subtitle: string;
  metaAt?: string | null;
  metaKind?: 'created' | 'resolved';
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
  metaAt,
  metaKind = 'created',
  hasReminder = false,
  fadeIntensity = 0,
  onPress,
  onLongPress,
  onReminderPress,
}: HealthListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();

  const displayTitle = truncatePreviewText(title, PREVIEW_CHARS);
  const displaySubtitle = truncateHealthDescription(subtitle, PREVIEW_CHARS);
  const hasSubtitle = Boolean(displaySubtitle);

  const metaPrefix =
    metaKind === 'resolved' ? t('topics.resolved_prefix') : t('topics.created_prefix');
  const metaLabel = formatHealthDateMeta(metaAt, {
    today: t('common.today'),
    yesterday: t('topics.created_yesterday'),
    prefix: metaPrefix,
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.stack}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, styles.rowMain]} numberOfLines={1} ellipsizeMode="tail">
              {displayTitle}
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
              <View style={styles.reminderSpacer} />
            )}
          </View>

          {hasSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {displaySubtitle}
            </Text>
          ) : null}
        </View>

        {metaLabel ? (
          <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
            {metaLabel}
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: '100%',
      alignSelf: 'center',
      backgroundColor: c.surface,
      overflow: 'hidden',
      borderRadius: 12,
      marginBottom: HEALTH_LIST_ITEM_GAP,
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 96,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
    },
    content: {
      width: '100%',
      gap: 6,
    },
    stack: {
      width: '100%',
      gap: 6,
    },
    titleRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: 20,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    reminderIconBtn: {
      flexShrink: 0,
    },
    reminderSpacer: {
      width: 16,
      flexShrink: 0,
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      width: '100%',
    },
    meta: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
      width: '100%',
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
