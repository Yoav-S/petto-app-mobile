import { makeHomeCardTypography } from '@/components/home/homeCardTypography';
import { homeCategoryIconBg, HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useHomePanelLayout } from '@/hooks/useHomePanelLayout';

interface HealthCardProps {
  latestRecord: {
    type: string;
    description?: string;
    date: string;
    reminder_date?: string;
    reminder_time?: string;
  } | null;
  allDoneToday?: boolean;
  loading: boolean;
  onPress: () => void;
}

function CategoryIcon() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={[styles.iconContainer, { backgroundColor: homeCategoryIconBg(colors).health }]}>
      <Image source={HOME_CATEGORY_ICONS.health} style={styles.iconImage} contentFit="contain" />
    </View>
  );
}

export default function HealthCard({ latestRecord, allDoneToday = false, loading, onPress }: HealthCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const homeCardTypography = useThemedStyles(makeHomeCardTypography);
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const { topicsEndPadding } = useHomePanelLayout();

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

  return (
    <TouchableOpacity
      style={[styles.card, { paddingRight: topicsEndPadding }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={styles.cardRow}>
          <Animated.View style={[styles.skeletonIcon, { opacity: fadeAnim }]} />
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, { width: '70%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '90%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: fadeAnim }]} />
          </View>
        </View>
      ) : (
        <View style={styles.cardRow}>
          <CategoryIcon />
          <View style={homeCardTypography.healthContent}>
            <View style={homeCardTypography.healthTitleRow}>
              <Text style={[homeCardTypography.title, styles.healthTitle]} numberOfLines={1}>
                {t('home.topicsCard.title')}
              </Text>
              {latestRecord?.reminder_date || latestRecord?.reminder_time ? (
                <View style={homeCardTypography.healthDateMeta}>
                  <Ionicons
                    name="notifications-outline"
                    size={14}
                    color={colors.secondaryText}
                  />
                  <HealthReminderLine
                    date={latestRecord.reminder_date}
                    time={latestRecord.reminder_time}
                    style={styles.reminderLine}
                    showLabel={false}
                    compact
                  />
                </View>
              ) : null}
            </View>

            <View
              style={[
                homeCardTypography.healthBodyBlock,
                latestRecord ? null : homeCardTypography.emptyBlockCentered,
              ]}
            >
              {latestRecord ? (
                <>
                  <Text style={homeCardTypography.healthSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    {latestRecord.type}
                  </Text>
                  {latestRecord.description ? (
                    <Text style={homeCardTypography.note} numberOfLines={1} ellipsizeMode="tail">
                      {latestRecord.description}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text
                  style={[homeCardTypography.note, homeCardTypography.noteCentered]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {allDoneToday
                    ? t('home.topicsCard.allDone')
                    : t('home.topicsCard.empty')}
                </Text>
              )}
            </View>
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
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    ...cardShadow,
  },
  cardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.border,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: c.border,
    borderRadius: 6,
  },
  healthTitle: {
    flexShrink: 1,
  },
  reminderLine: {
    flexShrink: 1,
  },
});
