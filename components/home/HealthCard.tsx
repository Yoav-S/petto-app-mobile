import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { homeCardTypography } from '@/components/home/homeCardTypography';
import { formatDisplayDate } from '@/utils/calendar';
import { t } from '@/i18n';

interface HealthCardProps {
  latestRecord: {
    type: string;
    description?: string;
    date: string;
    reminder_time?: string;
  } | null;
  loading: boolean;
  onPress: () => void;
}

function CategoryIcon() {
  return (
    <View style={[styles.iconContainer, { backgroundColor: Colors.category.notesBg }]}>
      <MaterialCommunityIcons name="heart-pulse" size={18} color={Colors.category.notes} />
    </View>
  );
}

export default function HealthCard({ latestRecord, loading, onPress }: HealthCardProps) {
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
              <Text style={homeCardTypography.title}>{t('home.healthCard.title')}</Text>
              {latestRecord ? (
                <View style={homeCardTypography.healthDateMeta}>
                  {latestRecord.reminder_time ? (
                    <Ionicons name="notifications-outline" size={14} color={Colors.secondaryText} />
                  ) : null}
                  <Text style={homeCardTypography.meta} numberOfLines={1}>
                    {formatDisplayDate(latestRecord.date)}
                  </Text>
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
                  {t('home.healthCard.empty')}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    minHeight: 120,
    ...cardShadow,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
});
