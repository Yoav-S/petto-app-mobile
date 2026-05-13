import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onHide?: () => void;
  duration?: number;
}

export default function Snackbar({ 
  visible, 
  message, 
  actionText, 
  onAction,
  onHide,
  duration = 3000
}: SnackbarProps) {
  const translateY = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      
      if (onHide) {
        const timer = setTimeout(() => {
          onHide();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      translateY.value = withTiming(100, { duration: 300 });
    }
  }, [visible, duration, onHide, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value === 100) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.message}>{message}</Text>
      
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above FAB
    alignSelf: 'center',
    width: '90%',
    backgroundColor: '#1F2937', // Dark background
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  message: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  actionText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
