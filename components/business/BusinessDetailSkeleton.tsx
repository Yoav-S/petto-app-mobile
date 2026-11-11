import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

/**
 * Keeps business-detail section sizes stable while the first fetch is in flight,
 * so Near You → business does not flash empty reviews / missing cards.
 */
export default function BusinessDetailSkeleton() {
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
    <Animated.View style={{ opacity: pulse, gap: 4 }}>
      <View style={styles.hoursCard}>
        <View style={styles.tab} />
        <View style={styles.block} />
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '55%' }]} />
        <View style={[styles.line, { width: '62%' }]} />
      </View>
      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <View style={[styles.title, { width: 110 }]} />
          <View style={[styles.chip, { width: 64 }]} />
        </View>
        <View style={styles.reviewRow}>
          <View style={styles.reviewCard} />
          <View style={styles.reviewCard} />
        </View>
      </View>
    </Animated.View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    hoursCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 16,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 16,
    },
    sectionHead: {
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tab: {
      height: 28,
      width: 88,
      borderRadius: 10,
      backgroundColor: c.background,
    },
    block: {
      height: 72,
      borderRadius: 24,
      backgroundColor: c.background,
    },
    line: {
      height: 14,
      borderRadius: 7,
      backgroundColor: c.background,
    },
    title: {
      height: 24,
      borderRadius: 8,
      backgroundColor: c.background,
    },
    chip: {
      height: 18,
      borderRadius: 6,
      backgroundColor: c.background,
    },
    reviewRow: {
      flexDirection: 'row',
      gap: 6,
    },
    reviewCard: {
      width: 313,
      height: 112,
      borderRadius: 24,
      backgroundColor: c.background,
    },
  });
}
