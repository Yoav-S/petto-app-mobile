import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { PlaceReview } from '@/services/places';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return t('business.just_now');
  if (minutes < 60) {
    return `${minutes} ${t(minutes === 1 ? 'business.minute_ago' : 'business.minutes_ago')}`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} ${t(hours === 1 ? 'business.hour_ago' : 'business.hours_ago')}`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${t(days === 1 ? 'business.day_ago' : 'business.days_ago')}`;
}

export function postedLabel(iso: string): string {
  const when = relativeTime(iso);
  return when ? `${t('business.posted')} ${when}` : '';
}

interface ReviewListCardProps {
  review: PlaceReview;
  onPress?: () => void;
  /** Full comment, used on the single review screen. */
  expanded?: boolean;
}

export default function ReviewListCard({ review, onPress, expanded = false }: ReviewListCardProps) {
  const styles = useThemedStyles(makeStyles);
  const body = review.comment?.trim() ?? '';

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.top}>
        {review.author_photo ? (
          <Image source={{ uri: review.author_photo }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.identity}>
          <View style={styles.person}>
            <Text style={styles.name} numberOfLines={1}>
              {review.author_name || t('business.pet_parent')}
            </Text>
            <Text style={styles.date} numberOfLines={1}>
              {postedLabel(review.created_at)}
            </Text>
          </View>
          <View style={styles.ratingChip}>
            <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
            <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      {body ? (
        <Text style={styles.body} numberOfLines={expanded ? undefined : 3}>
          {body}
        </Text>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 6,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: c.border,
    },
    identity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    person: {
      flex: 1,
    },
    name: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    date: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    ratingChip: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 6,
      backgroundColor: '#004741',
      paddingTop: 2,
      paddingBottom: 2,
      paddingHorizontal: 6,
    },
    ratingText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: '#F6F7F9',
    },
    body: {
      marginLeft: 58,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
  });
