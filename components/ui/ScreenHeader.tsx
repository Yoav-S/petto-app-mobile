import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useHeaderLayout } from '@/utils/headerLayout';

interface ScreenHeaderProps {
  title: string;
  /** Back chevron (default) or close X. */
  icon?: 'back' | 'close';
  onBack?: () => void;
}

/**
 * App-wide title row. Owns top safe-area + Figma gap so every screen matches
 * Add Health (header row at top: 56). Parent must NOT pad the top safe area.
 */
export default function ScreenHeader({ title, icon = 'back', onBack }: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const layout = useHeaderLayout();
  const buttonSize = 40 * layout.sx;

  return (
    <View style={[styles.wrap, { paddingTop: layout.paddingTop, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.container,
          {
            height: layout.height,
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: 12 * layout.sx,
            },
          ]}
          onPress={onBack ?? (() => router.back())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={icon === 'close' ? 'close' : 'chevron-back'}
            size={icon === 'close' ? 22 : 24}
            color={colors.primaryText}
          />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={{ width: buttonSize }} />
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconButton: {
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
