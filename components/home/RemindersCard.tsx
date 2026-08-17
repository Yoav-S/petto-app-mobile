import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { makeHomeCardTypography } from '@/components/home/homeCardTypography';
import { homeCategoryIconBg, HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
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
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={[styles.iconContainer, { backgroundColor: homeCategoryIconBg(colors).reminders }]}>
      <Image source={HOME_CATEGORY_ICONS.reminders} style={styles.iconImage} contentFit="contain" />
    </View>
  );
}

export default function RemindersCard({
  nextReminder,
  upcomingCount,
  loading,
  onPress,
}: RemindersCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const homeCardTypography = useThemedStyles(makeHomeCardTypography);
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
          <View style={styles.topContent}>
            <View style={styles.iconTitleBlock}>
              <CategoryIcon />
              <Text style={homeCardTypography.title}>{t('home.remindersCard.title')}</Text>
            </View>

            <View style={styles.reminderDetails}>
              {nextReminder ? (
                <>
                  <Text style={homeCardTypography.subtitle} numberOfLines={1} ellipsizeMode="tail">
                    {nextReminder.title}
                  </Text>
                  <Text style={homeCardTypography.meta} numberOfLines={1}>
                    {formatTime(nextReminder.scheduled_at)}
                  </Text>
                </>
              ) : (
                <Text style={homeCardTypography.note} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.remindersCard.empty')}
                </Text>
              )}
            </View>
          </View>

          <View style={homeCardTypography.footerRow}>
            {upcomingCount > 0 ? (
              <>
                <Text style={homeCardTypography.meta} numberOfLines={1}>
                  {upcomingCount} {t('home.remindersCard.upcoming')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
              </>
            ) : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardShadow = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 2,
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    padding: Spacing.lg,
    flex: 1,
    height: 198,
    minHeight: 198,
    maxHeight: 198,
    minWidth: 0,
    ...cardShadow,
  },
  contentContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    minWidth: 0,
  },
  topContent: {
    width: '100%',
    gap: Spacing.md,
    overflow: 'hidden',
    flex: 1,
  },
  iconTitleBlock: {
    width: '100%',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  reminderDetails: {
    width: '100%',
    gap: 6,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: c.border,
    borderRadius: 6,
  },
});
