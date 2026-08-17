import { makeHomeCardTypography } from '@/components/home/homeCardTypography';
import { homeCategoryIconBg, HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { DESIGN_HOME_HEALTH_CARD_HEIGHT } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface HealthCardProps {
  latestRecord: {
    type: string;
    description?: string;
    date: string;
    reminder_date?: string;
    reminder_time?: string;
  } | null;
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

export default function HealthCard({ latestRecord, loading, onPress }: HealthCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const homeCardTypography = useThemedStyles(makeHomeCardTypography);
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const { structuralScale } = useResponsiveLayout();
  const cardHeight = Math.round(DESIGN_HOME_HEALTH_CARD_HEIGHT * structuralScale);
  const rowHeight = Math.round(80 * structuralScale);

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
      style={[styles.card, { height: cardHeight }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={[styles.cardRow, { height: rowHeight }]}>
          <Animated.View style={[styles.skeletonIcon, { opacity: fadeAnim }]} />
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, { width: '70%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '90%', opacity: fadeAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: fadeAnim }]} />
          </View>
        </View>
      ) : (
        <View style={[styles.cardRow, { height: rowHeight }]}>
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

            <View style={homeCardTypography.healthBodyBlock}>
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
                <Text style={homeCardTypography.note} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.topicsCard.empty')}
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
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    ...cardShadow,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    paddingTop: 4,
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
