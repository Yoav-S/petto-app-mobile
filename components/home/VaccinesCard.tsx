import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { makeHomeCardTypography } from '@/components/home/homeCardTypography';
import { homeCategoryIconBg, HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';

interface VaccinesCardProps {
  latestVaccine: {
    name: string;
    date: string;
    next_date?: string;
  } | null;
  loading: boolean;
  onPress: () => void;
}

function formatDate(isoString?: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function CategoryIcon() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={[styles.iconContainer, { backgroundColor: homeCategoryIconBg(colors).vaccines }]}>
      <Image source={HOME_CATEGORY_ICONS.vaccines} style={styles.iconImage} contentFit="contain" />
    </View>
  );
}

export default function VaccinesCard({ latestVaccine, loading, onPress }: VaccinesCardProps) {
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
          <View style={styles.iconTitleBlock}>
            <CategoryIcon />
            <Text style={homeCardTypography.title}>{t('home.vaccinesCard.title')}</Text>
          </View>

          <View style={styles.vaccineDetails}>
            {latestVaccine ? (
              <>
                <Text style={homeCardTypography.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  {latestVaccine.name}
                </Text>
                <Text style={homeCardTypography.meta} numberOfLines={1}>
                  {t('home.vaccinesCard.last')} {formatDate(latestVaccine.date)}
                </Text>
                {latestVaccine.next_date ? (
                  <Text style={homeCardTypography.meta} numberOfLines={1}>
                    {t('home.vaccinesCard.next')} {formatDate(latestVaccine.next_date)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={homeCardTypography.note} numberOfLines={1} ellipsizeMode="tail">
                {t('home.vaccinesCard.empty')}
              </Text>
            )}
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
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
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
    maxWidth: 132,
    height: 144,
    gap: 12,
    overflow: 'hidden',
  },
  iconTitleBlock: {
    width: '100%',
    height: 64,
    gap: 8,
    overflow: 'hidden',
  },
  vaccineDetails: {
    width: '100%',
    height: 68,
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
