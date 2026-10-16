import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

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
      <View style={styles.body}>
        <View style={styles.chip} />
        <View style={styles.title} />
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
      backgroundColor: colors.surface,
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
      aspectRatio: 4 / 3,
      borderRadius: 24,
      backgroundColor: colors.background,
    },
    body: {
      paddingHorizontal: 12,
      gap: 8,
    },
    chip: {
      width: 72,
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    title: {
      width: '62%',
      height: 20,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    line: {
      width: '44%',
      height: 14,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
  });
}
