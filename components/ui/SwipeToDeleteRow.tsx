import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

const ACTION_WIDTH = 80;

interface SwipeToDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  /** When false, force-close (e.g. another row opened / back). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Swipe toward the trailing edge to reveal a themed trash control.
 * Hardware/system back closes the reveal without deleting.
 */
export default function SwipeToDeleteRow({
  children,
  onDelete,
  enabled = true,
  open,
  onOpenChange,
}: SwipeToDeleteRowProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const ref = useRef<Swipeable>(null);
  const [revealed, setRevealed] = useState(false);
  const rtl = isRTL();

  useEffect(() => {
    if (open === false) {
      ref.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (!revealed) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      ref.current?.close();
      return true;
    });
    return () => sub.remove();
  }, [revealed]);

  const renderActions = () => (
    <View style={styles.actions}>
      <Pressable
        style={styles.deleteHit}
        onPress={() => {
          ref.current?.close();
          onDelete();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('common.delete')}
      >
        <View style={[styles.circle, { backgroundColor: colors.error }]}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.deleteLabel, { color: colors.error }]} numberOfLines={1}>
          {t('common.delete')}
        </Text>
      </Pressable>
    </View>
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootFriction={8}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={rtl ? 40 : undefined}
      rightThreshold={rtl ? undefined : 40}
      renderLeftActions={rtl ? renderActions : undefined}
      renderRightActions={rtl ? undefined : renderActions}
      onSwipeableWillOpen={() => {
        setRevealed(true);
        onOpenChange?.(true);
      }}
      onSwipeableClose={() => {
        setRevealed(false);
        onOpenChange?.(false);
      }}
    >
      <View style={styles.row}>
        {children}
        {revealed ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              isDark ? styles.veilDark : styles.veilLight,
            ]}
          />
        ) : null}
      </View>
    </Swipeable>
  );
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    row: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    veilLight: {
      backgroundColor: 'rgba(31, 41, 55, 0.08)',
      borderRadius: 12,
    },
    veilDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.10)',
      borderRadius: 12,
    },
    actions: {
      width: ACTION_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteHit: {
      width: ACTION_WIDTH,
      height: '100%',
      minHeight: 76,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
    },
  });
