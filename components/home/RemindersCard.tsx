import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { homeCardTypography } from '@/components/home/homeCardTypography';
import { t, currentLocale } from '@/i18n';

interface RemindersCardProps {
  nextReminder: {
    title: string;
    scheduled_at: string;
    status: 'today' | 'scheduled' | 'missed' | 'completed';
  } | null;
  upcomingCount: number;
  loading: boolean;
  onPress: () => void;
}

function CategoryIcon() {
  return (
    <View style={[styles.iconContainer, { backgroundColor: Colors.category.remindersBg }]}>
      <Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />
    </View>
  );
}

export default function RemindersCard({
  nextReminder,
  upcomingCount,
  loading,
  onPress,
}: RemindersCardProps) {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(1);
    }
  }, [loading, fadeAnim]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {loading ? (
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.skeletonLine, { width: 40, height: 36, opacity: fadeAnim }]} />
          <Animated.View style={[styles.skeletonLine, { width: '80%', opacity: fadeAnim }]} />
          <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: fadeAnim }]} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <CategoryIcon />
          <View style={homeCardTypography.titleSubtitleBlock}>
            <Text style={homeCardTypography.title}>{t('home.remindersCard.title')}</Text>
            {nextReminder ? (
              <Text style={homeCardTypography.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {nextReminder.title}
              </Text>
            ) : (
              <Text style={homeCardTypography.meta} numberOfLines={1} ellipsizeMode="tail">
                {t('home.remindersCard.empty')}
              </Text>
            )}
          </View>
          {nextReminder ? (
            <Text style={homeCardTypography.meta} numberOfLines={1}>
              {formatTime(nextReminder.scheduled_at)}
            </Text>
          ) : null}
          {upcomingCount > 0 ? (
            <View style={[homeCardTypography.footerRow, styles.upcomingRow]}>
              <Text style={homeCardTypography.meta} numberOfLines={1}>
                {upcomingCount} {t('home.remindersCard.upcoming')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flex: 1,
    minHeight: 156,
    ...cardShadow,
  },
  contentContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  upcomingRow: {
    marginTop: 'auto',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
});
