import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { PlaceReview } from '@/services/places';
import { postedLabel } from '@/utils/reviewPosted';

export { postedLabel };

interface ReviewListCardProps {
  review: PlaceReview;
  onPress?: () => void;
  onMenuPress?: () => void;
  /** Full comment, used on the single review screen. */
  expanded?: boolean;
}

export default function ReviewListCard({
  review,
  onPress,
  onMenuPress,
  expanded = false,
}: ReviewListCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const body = review.comment?.trim() ?? '';
  const [lineCount, setLineCount] = useState(0);
  const [open, setOpen] = useState(false);
  const showAll = expanded || open;
  const overflows = !expanded && lineCount > 3;

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
            <View style={styles.rating}>
              <Star size={12} color={colors.primaryText} fill={colors.primaryText} />
              <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Pressable
            style={styles.menuButton}
            onPress={onMenuPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('business.review_actions')}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.primaryText} />
          </Pressable>
        </View>
      </View>
      {body ? (
        <View>
          <Text
            pointerEvents="none"
            accessible={false}
            style={[styles.body, styles.measure]}
            onTextLayout={(event) => {
              const count = event.nativeEvent.lines.length;
              setLineCount((current) => (current === count ? current : count));
            }}
          >
            {body}
          </Text>
          <Text style={styles.body} numberOfLines={showAll ? undefined : 3} ellipsizeMode="tail">
            {body}
          </Text>
        </View>
      ) : null}
      {overflows ? (
        <TouchableOpacity onPress={() => setOpen((value) => !value)} hitSlop={8}>
          <Text style={styles.readMore}>
            {open ? t('business.read_less') : t('business.read_more')}
          </Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.date}>{postedLabel(review.created_at)}</Text>
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
      gap: 2,
    },
    name: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    rating: {
      height: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      color: c.primaryText,
    },
    menuButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      marginLeft: 58,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
    measure: {
      position: 'absolute',
      opacity: 0,
      left: 0,
      right: 0,
    },
    readMore: {
      marginLeft: 58,
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.brand,
    },
    date: {
      marginLeft: 58,
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
  });
