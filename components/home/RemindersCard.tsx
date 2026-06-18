import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
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
          <Text style={styles.title}>{t('home.remindersCard.title')}</Text>
          {nextReminder ? (
            <>
              <Text style={styles.primaryText}>{nextReminder.title}</Text>
              <Text style={styles.secondaryText}>{formatTime(nextReminder.scheduled_at)}</Text>
              {upcomingCount > 0 ? (
                <View style={styles.bottomRow}>
                  <Text style={styles.secondaryText}>
                    {upcomingCount} {t('home.remindersCard.upcoming')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.secondaryText}>{t('home.remindersCard.empty')}</Text>
          )}
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
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  primaryText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  secondaryText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.sm,
    gap: 4,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
});
