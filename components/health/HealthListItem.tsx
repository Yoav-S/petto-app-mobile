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
import CardBottomFadeOverlay from '@/components/ui/CardBottomFadeOverlay';
import { t } from '@/i18n';
import { formatHealthDateMeta, truncatePreviewText } from '@/utils/calendar';

export const HEALTH_LIST_CARD_WIDTH = '100%';
export const HEALTH_LIST_ITEM_GAP = 12;

const TITLE_CHARS = 20;
const CARD_PAD_V = 14;
/** Title → description. */
const TITLE_GAP = 6;
/** Description → meta line (double the title gap). */
const META_GAP = 12;
const TITLE_LINE = 20;
const SUBTITLE_LINE = 20;
const META_LINE = 16;
/** Description wraps to at most two lines. */
const SUBTITLE_MAX_LINES = 2;
/** Rough chars that fit on one description line at 14/20 inside a 303pt card. */
const SUBTITLE_CHARS_PER_LINE = 42;

/** Title + meta + padding (no description). */
export const HEALTH_LIST_CARD_COMPACT_HEIGHT =
  CARD_PAD_V * 2 + TITLE_LINE + TITLE_GAP + META_LINE;
/** Title + one description line + meta + padding. */
export const HEALTH_LIST_CARD_FULL_HEIGHT =
  CARD_PAD_V * 2 + TITLE_LINE + TITLE_GAP + SUBTITLE_LINE + META_GAP + META_LINE;
/** @deprecated Use HEALTH_LIST_CARD_FULL_HEIGHT or estimate per row. */
export const HEALTH_LIST_CARD_HEIGHT = HEALTH_LIST_CARD_FULL_HEIGHT;

export function estimateHealthListItemHeight(description?: string | null): number {
  const text = description?.trim() ?? '';
  if (!text) return HEALTH_LIST_CARD_COMPACT_HEIGHT;
  const lines = Math.min(
    SUBTITLE_MAX_LINES,
    Math.max(1, Math.ceil(text.length / SUBTITLE_CHARS_PER_LINE)),
  );
  return HEALTH_LIST_CARD_FULL_HEIGHT + (lines - 1) * SUBTITLE_LINE;
}

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

  const displayTitle = truncatePreviewText(title, TITLE_CHARS);
  const displaySubtitle = subtitle?.trim() ?? '';
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
      // Press feedback comes from the swipe row's disabled wash instead, so the
      // card keeps one appearance through press, drag and open.
      activeOpacity={1}
      disabled={!onPress}
    >
      <View style={styles.body}>
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
          <Text
            style={styles.subtitle}
            numberOfLines={SUBTITLE_MAX_LINES}
            ellipsizeMode="tail"
          >
            {displaySubtitle}
          </Text>
        ) : null}

        {metaLabel ? (
          <Text
            style={[styles.meta, !hasSubtitle && styles.metaTight]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {metaLabel}
          </Text>
        ) : null}
      </View>

      <CardBottomFadeOverlay intensity={fadeIntensity} />
    </TouchableOpacity>
  );
}

/** Description shown in the topics list — wraps to two lines, no char cap. */
export function healthRecordSubtitle(description?: string | null): string {
  return description?.trim() ?? '';
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
      paddingVertical: CARD_PAD_V,
      paddingHorizontal: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
    },
    body: {
      width: '100%',
    },
    titleRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: TITLE_LINE,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: TITLE_LINE,
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
      lineHeight: SUBTITLE_LINE,
      color: c.primaryText,
      width: '100%',
      marginTop: TITLE_GAP,
    },
    meta: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: META_LINE,
      color: c.secondaryText,
      marginTop: META_GAP,
      width: '100%',
    },
    metaTight: {
      marginTop: TITLE_GAP,
    },
  });
