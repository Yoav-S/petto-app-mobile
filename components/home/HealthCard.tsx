import { makeHomeCardTypography } from '@/components/home/homeCardTypography';
import { homeCategoryIconBg, HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import TopicsWrapDescription from '@/components/home/TopicsWrapDescription';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useHomePanelLayout } from '@/hooks/useHomePanelLayout';
import { type ThemeColors } from '@/constants/theme';

/** Figma Topics card inner metrics (335×112 → 303×80 after 16 padding). */
const TOPICS = {
  padding: 16,
  radius: 20,
  innerGap: 8,
  icon: 36,
  columnGap: 4,
  headerH: 20,
  titleDescGap: 8,
  titleH: 16,
  descH: 32,
} as const;

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
  const { secondLineInset } = useHomePanelLayout();

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
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={styles.inner}>
          <Animated.View style={[styles.skeletonIcon, { opacity: fadeAnim }]} />
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, { width: '70%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '90%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: fadeAnim }]} />
          </View>
        </View>
      ) : (
        <View style={styles.inner}>
          <CategoryIcon />
          <View style={styles.column}>
            <View style={styles.headerRow}>
              <Text style={[homeCardTypography.title, styles.headerTitle]} numberOfLines={1}>
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
                styles.body,
                latestRecord ? null : styles.bodyEmpty,
              ]}
            >
              {latestRecord ? (
                <>
                  <Text style={styles.recordTitle} numberOfLines={1} ellipsizeMode="tail">
                    {latestRecord.type}
                  </Text>
                  {latestRecord.description ? (
                    <TopicsWrapDescription
                      text={latestRecord.description}
                      secondLineInset={secondLineInset}
                      style={homeCardTypography.note}
                    />
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
    borderRadius: TOPICS.radius,
    padding: TOPICS.padding,
    width: '100%',
    overflow: 'hidden',
    ...cardShadow,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: TOPICS.innerGap,
    minHeight: 0,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    gap: TOPICS.columnGap,
    overflow: 'hidden',
  },
  headerRow: {
    height: TOPICS.headerH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    overflow: 'hidden',
  },
  headerTitle: {
    flexShrink: 1,
    includeFontPadding: false,
  },
  body: {
    flexGrow: 1,
    flexShrink: 0,
    width: '100%',
    gap: TOPICS.titleDescGap,
    overflow: 'hidden',
  },
  bodyEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordTitle: {
    width: '100%',
    height: TOPICS.titleH,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 16,
    color: c.primaryText,
    flexShrink: 0,
    includeFontPadding: false,
    overflow: 'hidden',
  },
  iconContainer: {
    width: TOPICS.icon,
    height: TOPICS.icon,
    borderRadius: 10,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  skeletonIcon: {
    width: TOPICS.icon,
    height: TOPICS.icon,
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
  reminderLine: {
    flexShrink: 1,
  },
});
