import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;
const HEADER_TOP = 56;
const HEADER_HEIGHT = 44;
const HEADER_PAD_H = 20;
const HEADER_PAD_V = 6;

interface VaccineScreenHeaderProps {
  title: string;
  icon?: 'back' | 'close';
}

export default function VaccineScreenHeader({ title, icon = 'back' }: VaccineScreenHeaderProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(
    () => ({
      marginTop: Math.max(0, HEADER_TOP * sy - insets.top),
      height: HEADER_HEIGHT * sy,
      paddingHorizontal: HEADER_PAD_H * sx,
      paddingVertical: HEADER_PAD_V * sy,
      buttonSize: 40 * sx,
      buttonRadius: 12 * sx,
    }),
    [sx, sy, insets.top],
  );

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: layout.marginTop,
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
            width: layout.buttonSize,
            height: layout.buttonSize,
            borderRadius: layout.buttonRadius,
          },
        ]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={icon === 'close' ? 'close' : 'chevron-back'}
          size={icon === 'close' ? 22 : 24}
          color={Colors.primaryText}
        />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={{ width: layout.buttonSize }} />
    </View>
  );
}

/** Total offset from screen top to content below the header (Figma 56 + 44). */
export function getVaccineHeaderContentOffset(screenHeight: number): number {
  const sy = screenHeight / DESIGN_HEIGHT;
  return (HEADER_TOP + HEADER_HEIGHT) * sy;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  iconButton: {
    backgroundColor: Colors.surface,
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
    color: Colors.primaryText,
    textAlign: 'center',
  },
});
