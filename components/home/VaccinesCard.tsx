import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { homeCardTypography } from '@/components/home/homeCardTypography';
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
  return (
    <View style={[styles.iconContainer, { backgroundColor: Colors.category.vaccinesBg }]}>
      <MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />
    </View>
  );
}

export default function VaccinesCard({ latestVaccine, loading, onPress }: VaccinesCardProps) {
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
          <CategoryIcon />
          <View style={homeCardTypography.titleSubtitleBlock}>
            <Text style={homeCardTypography.title}>{t('home.vaccinesCard.title')}</Text>
            {latestVaccine ? (
              <Text style={homeCardTypography.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {latestVaccine.name}
              </Text>
            ) : (
              <Text style={homeCardTypography.meta} numberOfLines={1} ellipsizeMode="tail">
                {t('home.vaccinesCard.empty')}
              </Text>
            )}
          </View>
          {latestVaccine ? (
            <>
              <Text style={homeCardTypography.meta} numberOfLines={1}>
                {t('home.vaccinesCard.last')} {formatDate(latestVaccine.date)}
              </Text>
              {latestVaccine.next_date ? (
                <Text style={homeCardTypography.meta} numberOfLines={1}>
                  {t('home.vaccinesCard.next')} {formatDate(latestVaccine.next_date)}
                </Text>
              ) : null}
            </>
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
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
});
