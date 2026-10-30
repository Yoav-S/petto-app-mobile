import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

/** Same frame as a place photo: 335×278 on a 375-wide screen. */
const BUSINESS_IMAGE_RATIO = 335 / 278;

/** Placeholder with the same shape as a place card, shown while nearby places load. */
export default function PlaceCardSkeleton() {
  const styles = useThemedStyles(makeStyles);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.image} />
      <View style={styles.item}>
        <View style={styles.chip} />
        <View style={styles.titleRow}>
          <View style={styles.title} />
          <View style={styles.rate} />
        </View>
        <View style={styles.line} />
      </View>
    </Animated.View>
  );
}

export function PlaceCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <PlaceCardSkeleton key={index} />
      ))}
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: '100%',
      alignSelf: 'stretch',
      borderRadius: 24,
      backgroundColor: colors.iconChip,
      paddingBottom: 22,
      gap: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.080)',
      elevation: 4,
    },
    image: {
      width: '100%',
      aspectRatio: BUSINESS_IMAGE_RATIO,
      borderRadius: 24,
      backgroundColor: colors.background,
    },
    item: {
      width: '100%',
      minHeight: 76,
      paddingHorizontal: 12,
      gap: 8,
    },
    titleRow: {
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      width: '62%',
      height: 20,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    rate: {
      width: 36,
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    chip: {
      width: 122,
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    line: {
      width: 122,
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
  });
}
